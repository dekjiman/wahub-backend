"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const database_js_1 = require("../config/database.js");
const schema_js_1 = require("../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const reconciliation_service_js_1 = require("./reconciliation.service.js");
const logger_js_1 = require("../utils/logger.js");
class SchedulerService {
    static init() {
        logger_js_1.logger.info('Initializing background scheduler jobs...');
        // Every 1 minute: run WhatsApp data reconciliation (TASK-012)
        node_cron_1.default.schedule('*/1 * * * *', async () => {
            logger_js_1.logger.info('Running scheduled 1-minute WhatsApp data reconciliation...');
            try {
                await reconciliation_service_js_1.ReconciliationService.runReconciliation();
            }
            catch (error) {
                logger_js_1.logger.error('Failed scheduled reconciliation job:', error);
            }
        });
        // Midnight job: reset daily message counts
        node_cron_1.default.schedule('0 0 * * *', async () => {
            logger_js_1.logger.info('Running daily reset for group message counts...');
            try {
                await database_js_1.db.update(schema_js_1.groups).set({ messageCountToday: 0 });
            }
            catch (error) {
                logger_js_1.logger.error('Failed to reset daily message counts:', error);
            }
        });
        // Every minute job: process scheduled broadcasts
        node_cron_1.default.schedule('* * * * *', async () => {
            try {
                const now = new Date();
                const pendingBroadcasts = await database_js_1.db.query.broadcasts.findMany({
                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.broadcasts.status, 'approved'), (0, drizzle_orm_1.lte)(schema_js_1.broadcasts.scheduledAt, now)),
                });
                for (const broadcast of pendingBroadcasts) {
                    logger_js_1.logger.info(`Processing scheduled broadcast ${broadcast.id}: ${broadcast.title}`);
                    await database_js_1.db
                        .update(schema_js_1.broadcasts)
                        .set({ status: 'sending', sentAt: new Date() })
                        .where((0, drizzle_orm_1.eq)(schema_js_1.broadcasts.id, broadcast.id));
                    const { BroadcastsService } = await import('../modules/broadcasts/broadcasts.service.js');
                    await BroadcastsService.executeBroadcast(broadcast.id, broadcast);
                }
            }
            catch (error) {
                logger_js_1.logger.error('Error processing scheduled broadcasts:', error);
            }
        });
    }
}
exports.SchedulerService = SchedulerService;
