"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const communities_service_js_1 = require("../modules/communities/communities.service.js");
const groups_service_js_1 = require("../modules/groups/groups.service.js");
const database_js_1 = require("../config/database.js");
const schema_js_1 = require("../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const env_js_1 = require("../config/env.js");
const logger_js_1 = require("../utils/logger.js");
class ReconciliationService {
    static isRunning = false;
    // Run full data reconciliation between WhatsApp Evolution Go and PostgreSQL
    static async runReconciliation(instanceName = env_js_1.env.EVOLUTION_DEFAULT_INSTANCE) {
        if (this.isRunning) {
            logger_js_1.logger.info('[reconciliation] Job already in progress, skipping run.');
            return { success: true, skipped: true };
        }
        this.isRunning = true;
        const startTime = Date.now();
        logger_js_1.logger.info(`[reconciliation] Starting data reconciliation for instance=${instanceName}`);
        try {
            // 1. Sync Communities (pull & compare DB)
            const communitySyncRes = await communities_service_js_1.CommunitiesService.syncFromWhatsApp(instanceName);
            logger_js_1.logger.info(`[reconciliation] Communities synced: found=${communitySyncRes.found} created=${communitySyncRes.created} updated=${communitySyncRes.updated} deactivated=${communitySyncRes.deactivated}`);
            // 2. Sync Groups (pull & compare DB)
            const groupSyncRes = await groups_service_js_1.GroupsService.syncFromWhatsApp(instanceName);
            logger_js_1.logger.info(`[reconciliation] Groups synced: found=${groupSyncRes.found} created=${groupSyncRes.created} updated=${groupSyncRes.updated} deactivated=${groupSyncRes.deactivated}`);
            // 3. Sync Participants for all active groups
            const activeGroups = await database_js_1.db
                .select({ id: schema_js_1.groups.id, name: schema_js_1.groups.name, jid: schema_js_1.groups.whatsappGroupJid })
                .from(schema_js_1.groups)
                .where((0, drizzle_orm_1.eq)(schema_js_1.groups.status, 'active'));
            let participantSyncCount = 0;
            for (const group of activeGroups) {
                if (!group.jid)
                    continue;
                try {
                    await groups_service_js_1.GroupsService.syncParticipants(group.id, instanceName);
                    participantSyncCount++;
                    // Small delay to prevent WhatsApp rate-overlimit (429)
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
                catch (err) {
                    logger_js_1.logger.warn(`[reconciliation] Failed participant sync for group ${group.name} (${group.id}): ${err.message}`);
                }
            }
            const durationMs = Date.now() - startTime;
            logger_js_1.logger.info(`[reconciliation] Reconciliation completed in ${durationMs}ms for ${activeGroups.length} groups.`);
            return {
                success: true,
                durationMs,
                communities: communitySyncRes,
                groups: groupSyncRes,
                groupsParticipantSynced: participantSyncCount,
            };
        }
        catch (error) {
            logger_js_1.logger.error('[reconciliation] Job failed with error:', error);
            throw error;
        }
        finally {
            this.isRunning = false;
        }
    }
    // Helper to schedule cron job
    static startCron(scheduleExpression = '*/15 * * * *') {
        logger_js_1.logger.info(`[reconciliation] Scheduling cron job with expression: ${scheduleExpression}`);
        return node_cron_1.default.schedule(scheduleExpression, () => {
            void this.runReconciliation().catch((err) => {
                logger_js_1.logger.error('[reconciliation] Scheduled cron error:', err);
            });
        });
    }
}
exports.ReconciliationService = ReconciliationService;
