import cron from 'node-cron';
import { db } from '../config/database.js';
import { groups, broadcasts, broadcastRecipients, members, groupMembers } from '../../drizzle/schema.js';
import { eq, and, lte, sql } from 'drizzle-orm';
import { EvolutionService } from './evolution.service.js';
import { ReconciliationService } from './reconciliation.service.js';
import { logger } from '../utils/logger.js';

export class SchedulerService {
  static init() {
    logger.info('Initializing background scheduler jobs...');

    // Every 1 minute: run WhatsApp data reconciliation (TASK-012)
    cron.schedule('*/1 * * * *', async () => {
      logger.info('Running scheduled 1-minute WhatsApp data reconciliation...');
      try {
        await ReconciliationService.runReconciliation();
      } catch (error) {
        logger.error('Failed scheduled reconciliation job:', error);
      }
    });

    // Midnight job: reset daily message counts
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running daily reset for group message counts...');
      try {
        await db.update(groups).set({ messageCountToday: 0 });
      } catch (error) {
        logger.error('Failed to reset daily message counts:', error);
      }
    });

    // Every minute job: process scheduled broadcasts
    cron.schedule('* * * * *', async () => {
      try {
        const now = new Date();
        const pendingBroadcasts = await db.query.broadcasts.findMany({
          where: and(
            eq(broadcasts.status, 'approved'),
            lte(broadcasts.scheduledAt, now)
          ),
        });

        for (const broadcast of pendingBroadcasts) {
          logger.info(`Processing scheduled broadcast ${broadcast.id}: ${broadcast.title}`);
          
          await db
            .update(broadcasts)
            .set({ status: 'sending', sentAt: new Date() })
            .where(eq(broadcasts.id, broadcast.id));

          const { BroadcastsService } = await import('../modules/broadcasts/broadcasts.service.js');
          await BroadcastsService.executeBroadcast(broadcast.id, broadcast);
        }
      } catch (error) {
        logger.error('Error processing scheduled broadcasts:', error);
      }
    });
  }
}


