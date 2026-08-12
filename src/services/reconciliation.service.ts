import cron from 'node-cron';
import { CommunitiesService } from '../modules/communities/communities.service.js';
import { GroupsService } from '../modules/groups/groups.service.js';
import { db } from '../config/database.js';
import { groups } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface ReconciliationResult {
  success: boolean;
  skipped?: boolean;
  durationMs?: number;
  communities?: any;
  groups?: any;
  groupsParticipantSynced?: number;
}

export class ReconciliationService {
  private static isRunning = false;

  // Run full data reconciliation between WhatsApp Evolution Go and PostgreSQL
  static async runReconciliation(
    instanceName = env.EVOLUTION_DEFAULT_INSTANCE
  ): Promise<ReconciliationResult> {
    if (this.isRunning) {
      logger.info('[reconciliation] Job already in progress, skipping run.');
      return { success: true, skipped: true };
    }

    this.isRunning = true;
    const startTime = Date.now();
    logger.info(`[reconciliation] Starting data reconciliation for instance=${instanceName}`);

    try {
      // 1. Sync Communities (pull & compare DB)
      const communitySyncRes = await CommunitiesService.syncFromWhatsApp(instanceName);
      logger.info(
        `[reconciliation] Communities synced: found=${communitySyncRes.found} created=${communitySyncRes.created} updated=${communitySyncRes.updated} deactivated=${communitySyncRes.deactivated}`
      );

      // 2. Sync Groups (pull & compare DB)
      const groupSyncRes = await GroupsService.syncFromWhatsApp(instanceName);
      logger.info(
        `[reconciliation] Groups synced: found=${groupSyncRes.found} created=${groupSyncRes.created} updated=${groupSyncRes.updated} deactivated=${groupSyncRes.deactivated}`
      );

      // 3. Sync Participants for all active groups
      const activeGroups = await db
        .select({ id: groups.id, name: groups.name, jid: groups.whatsappGroupJid })
        .from(groups)
        .where(eq(groups.status, 'active'));

      let participantSyncCount = 0;
      for (const group of activeGroups) {
        if (!group.jid) continue;
        try {
          await GroupsService.syncParticipants(group.id, instanceName);
          participantSyncCount++;
          // Small delay to prevent WhatsApp rate-overlimit (429)
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (err: any) {
          logger.warn(
            `[reconciliation] Failed participant sync for group ${group.name} (${group.id}): ${err.message}`
          );
        }
      }

      const durationMs = Date.now() - startTime;
      logger.info(
        `[reconciliation] Reconciliation completed in ${durationMs}ms for ${activeGroups.length} groups.`
      );

      return {
        success: true,
        durationMs,
        communities: communitySyncRes,
        groups: groupSyncRes,
        groupsParticipantSynced: participantSyncCount,
      };
    } catch (error: any) {
      logger.error('[reconciliation] Job failed with error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Helper to schedule cron job
  static startCron(scheduleExpression = '*/15 * * * *') {
    logger.info(`[reconciliation] Scheduling cron job with expression: ${scheduleExpression}`);
    return cron.schedule(scheduleExpression, () => {
      void this.runReconciliation().catch((err) => {
        logger.error('[reconciliation] Scheduled cron error:', err);
      });
    });
  }
}
