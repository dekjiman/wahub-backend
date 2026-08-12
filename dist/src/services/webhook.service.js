"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const database_js_1 = require("../config/database.js");
const schema_js_1 = require("../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const ai_service_js_1 = require("./ai.service.js");
const evolution_service_js_1 = require("./evolution.service.js");
const env_js_1 = require("../config/env.js");
const logger_js_1 = require("../utils/logger.js");
class WebhookService {
    static async handleEvent(payload) {
        const event = payload.event || payload.type;
        const data = payload.data || payload;
        logger_js_1.logger.info(`Received Evolution webhook event: ${event}`);
        try {
            switch (event) {
                case 'messages.upsert':
                    await this.handleIncomingMessage(data);
                    break;
                case 'participant.update':
                    await this.handleParticipantUpdate(data);
                    break;
                case 'group.update':
                case 'upsertGroups':
                    await this.handleGroupUpdate(data);
                    break;
                case 'connection.update':
                    await this.handleConnectionUpdate(data);
                    break;
                default:
                    logger_js_1.logger.info(`Unhandled webhook event: ${event}`);
            }
        }
        catch (error) {
            logger_js_1.logger.error(`Error processing webhook event ${event}:`, error);
        }
    }
    static async handleIncomingMessage(data) {
        const key = data.key || {};
        const remoteJid = key.remoteJid;
        if (!remoteJid)
            return;
        const fromMe = Boolean(key.fromMe);
        const msgId = key.id;
        const pushName = data.pushName || 'WhatsApp User';
        const messageContent = data.message?.conversation ||
            data.message?.extendedTextMessage?.text ||
            data.message?.imageMessage?.caption ||
            data.message?.videoMessage?.caption ||
            '';
        const senderPhone = (key.participant || remoteJid).split('@')[0];
        // Find or create member
        let member = await database_js_1.db.query.members.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.members.whatsappNumber, senderPhone),
        });
        if (!member) {
            const [newMember] = await database_js_1.db
                .insert(schema_js_1.members)
                .values({
                whatsappNumber: senderPhone,
                displayName: pushName,
                phone: senderPhone,
            })
                .onConflictDoNothing()
                .returning();
            member = newMember || (await database_js_1.db.query.members.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_js_1.members.whatsappNumber, senderPhone),
            }));
        }
        // Find group if message is in a group
        let group = await database_js_1.db.query.groups.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.groups.whatsappGroupJid, remoteJid),
        });
        if (!group && remoteJid.endsWith('@g.us')) {
            const [newGroup] = await database_js_1.db
                .insert(schema_js_1.groups)
                .values({
                whatsappGroupJid: remoteJid,
                name: pushName || 'WhatsApp Group',
            })
                .onConflictDoNothing()
                .returning();
            group = newGroup || (await database_js_1.db.query.groups.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_js_1.groups.whatsappGroupJid, remoteJid),
            }));
        }
        // Ensure member is in groupMembers relation
        if (group && member) {
            await database_js_1.db
                .insert(schema_js_1.groupMembers)
                .values({
                groupId: group.id,
                memberId: member.id,
            })
                .onConflictDoNothing();
        }
        // Perform AI analysis on message
        const aiResult = await ai_service_js_1.AiService.analyzeMessage(messageContent);
        // Save to chatLogs
        const [chatLog] = await database_js_1.db
            .insert(schema_js_1.chatLogs)
            .values({
            groupId: group?.id,
            memberId: member?.id,
            whatsappMsgId: msgId,
            direction: fromMe ? 'outbound' : 'inbound',
            content: messageContent,
            messageType: data.message?.imageMessage ? 'image' : 'text',
            isFromAi: false,
            sentiment: aiResult.sentiment,
            topic: aiResult.topic,
            isSpam: aiResult.isSpam,
            isFlagged: aiResult.isSpam || aiResult.isToxic,
        })
            .returning();
        // Save AI Analysis record
        if (chatLog) {
            await database_js_1.db.insert(schema_js_1.aiAnalyses).values({
                chatLogId: chatLog.id,
                analysisType: 'moderation_sentiment',
                result: aiResult,
                confidence: (aiResult.confidence || 0.85).toFixed(2),
                modelUsed: env_js_1.env.OPENAI_MODEL,
            });
            // Increment message count today for group
            if (group) {
                await database_js_1.db
                    .update(schema_js_1.groups)
                    .set({
                    messageCountToday: (0, drizzle_orm_1.sql) `${schema_js_1.groups.messageCountToday} + 1`,
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, group.id));
            }
        }
        // Create Moderation Alert if flagged & autoModeration enabled
        if ((aiResult.isSpam || aiResult.isToxic) &&
            group &&
            member &&
            chatLog &&
            group.autoModeration) {
            await database_js_1.db.insert(schema_js_1.moderationAlerts).values({
                groupId: group.id,
                memberId: member.id,
                chatLogId: chatLog.id,
                alertType: aiResult.isSpam ? 'spam' : 'toxic',
                severity: aiResult.isToxic ? 'high' : 'medium',
                description: aiResult.reason || 'Flagged by AI Moderation System',
                status: 'pending',
            });
        }
        // FAQ Auto-Response if enabled
        if (!fromMe &&
            group?.aiEnabled &&
            group?.autoFaq &&
            messageContent.endsWith('?')) {
            const faqResponse = await ai_service_js_1.AiService.generateFaqResponse(messageContent);
            if (faqResponse && data.instanceName) {
                await evolution_service_js_1.EvolutionService.sendText(data.instanceName, remoteJid, faqResponse);
                // Save outbound AI message log
                await database_js_1.db.insert(schema_js_1.chatLogs).values({
                    groupId: group.id,
                    memberId: member.id,
                    direction: 'outbound',
                    content: faqResponse,
                    isFromAi: true,
                    sentiment: 'neutral',
                    topic: aiResult.topic,
                });
            }
        }
    }
    static async handleParticipantUpdate(data) {
        const groupJid = data.groupJid || data.id;
        const participantPhone = (data.participant || data.participants?.[0] || '')
            .split('@')[0];
        const action = data.action; // 'add' or 'remove'
        if (!groupJid || !participantPhone)
            return;
        const group = await database_js_1.db.query.groups.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.groups.whatsappGroupJid, groupJid),
        });
        if (!group)
            return;
        let member = await database_js_1.db.query.members.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.members.whatsappNumber, participantPhone),
        });
        if (!member && action === 'add') {
            const [newMember] = await database_js_1.db
                .insert(schema_js_1.members)
                .values({
                whatsappNumber: participantPhone,
                phone: participantPhone,
            })
                .onConflictDoNothing()
                .returning();
            member = newMember || (await database_js_1.db.query.members.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_js_1.members.whatsappNumber, participantPhone),
            }));
        }
        if (action === 'add' && member) {
            await database_js_1.db
                .insert(schema_js_1.groupMembers)
                .values({
                groupId: group.id,
                memberId: member.id,
            })
                .onConflictDoNothing();
            // Recalculate member count
            const memberCountRes = await database_js_1.db
                .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(schema_js_1.groupMembers)
                .where((0, drizzle_orm_1.eq)(schema_js_1.groupMembers.groupId, group.id));
            await database_js_1.db
                .update(schema_js_1.groups)
                .set({
                memberCount: Number(memberCountRes[0]?.count || 0),
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, group.id));
            // Auto Welcome (Fallback if not using n8n)
            if (group.autoWelcome && data.instanceName && !env_js_1.env.N8N_WEBHOOK_URL) {
                const welcomeText = `Selamat datang di ${group.name}! Silakan baca peraturan grup dan perkenalkan diri Anda.`;
                await evolution_service_js_1.EvolutionService.sendText(data.instanceName, groupJid, welcomeText);
            }
            // Trigger n8n Onboarding Workflow
            if (env_js_1.env.N8N_WEBHOOK_URL) {
                try {
                    fetch(env_js_1.env.N8N_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            event: 'participant.joined',
                            instanceName: data.instanceName,
                            group: {
                                id: group.id,
                                name: group.name,
                                jid: groupJid,
                                autoWelcome: group.autoWelcome,
                            },
                            member: {
                                id: member.id,
                                phone: participantPhone,
                                name: member.displayName || participantPhone,
                            },
                        }),
                    }).catch((err) => logger_js_1.logger.error('Failed to trigger n8n webhook', err));
                }
                catch (err) {
                    logger_js_1.logger.error('Failed to trigger n8n webhook', err);
                }
            }
        }
        else if (action === 'remove' && member) {
            await database_js_1.db
                .delete(schema_js_1.groupMembers)
                .where((0, drizzle_orm_1.sql) `${schema_js_1.groupMembers.groupId} = ${group.id} AND ${schema_js_1.groupMembers.memberId} = ${member.id}`);
            const memberCountRes = await database_js_1.db
                .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(schema_js_1.groupMembers)
                .where((0, drizzle_orm_1.eq)(schema_js_1.groupMembers.groupId, group.id));
            await database_js_1.db
                .update(schema_js_1.groups)
                .set({
                memberCount: Number(memberCountRes[0]?.count || 0),
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, group.id));
        }
    }
    static async handleGroupUpdate(data) {
        const groupJid = data.groupJid || data.id;
        if (!groupJid)
            return;
        const updateFields = { updatedAt: new Date() };
        if (data.subject)
            updateFields.name = data.subject;
        if (data.description)
            updateFields.description = data.description;
        await database_js_1.db
            .update(schema_js_1.groups)
            .set(updateFields)
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.whatsappGroupJid, groupJid));
    }
    static async handleConnectionUpdate(data) {
        const state = data.state || data.status;
        const status = state === 'open' ? 'connected' : 'disconnected';
        await database_js_1.db
            .update(schema_js_1.integrations)
            .set({
            status,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.integrations.type, 'whatsapp'));
    }
}
exports.WebhookService = WebhookService;
