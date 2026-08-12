"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const node_crypto_1 = require("node:crypto");
const drizzle_orm_1 = require("drizzle-orm");
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const logger_js_1 = require("../../utils/logger.js");
const ai_service_js_1 = require("../../services/ai.service.js");
const env_js_1 = require("../../config/env.js");
class WebhooksService {
    // Evolution Go (patched) sends:
    //   { event, data, instanceName, instanceId, instanceToken }
    // The `data` for message events is a whatsmeow events.Message serialization
    // with a stable Info.ID. When no stable ID is present we fall back to a
    // content hash so provider retries (same body) are deduplicated.
    static normalizeEvolutionGo(payload) {
        const event = payload?.event || payload?.type;
        if (typeof event !== 'string' || !event)
            return null;
        const data = payload?.data ?? {};
        let externalEventId = null;
        if (typeof data?.Info?.ID === 'string' && data.Info.ID) {
            externalEventId = data.Info.ID;
        }
        else if (typeof data?.key?.id === 'string' && data.key.id) {
            externalEventId = data.key.id;
        }
        if (!externalEventId) {
            externalEventId = (0, node_crypto_1.createHash)('sha256')
                .update(JSON.stringify(payload))
                .digest('hex')
                .slice(0, 64);
        }
        return {
            provider: 'evolution_go',
            instanceName: typeof payload?.instanceName === 'string' ? payload.instanceName : null,
            externalEventId,
            eventType: event,
            payload,
        };
    }
    static async ingest(payload) {
        const normalized = this.normalizeEvolutionGo(payload);
        if (!normalized) {
            return { stored: false, duplicate: false };
        }
        const [row] = await database_js_1.db
            .insert(schema_js_1.webhookEvents)
            .values({
            provider: normalized.provider,
            instanceName: normalized.instanceName,
            externalEventId: normalized.externalEventId,
            eventType: normalized.eventType,
            payload: normalized.payload,
        })
            .onConflictDoNothing({
            target: [schema_js_1.webhookEvents.provider, schema_js_1.webhookEvents.externalEventId],
        })
            .returning();
        if (!row) {
            logger_js_1.logger.info(`Duplicate webhook ignored: ${normalized.eventType} ${normalized.externalEventId}`);
            return { stored: false, duplicate: true };
        }
        return { stored: true, duplicate: false, eventId: row.id };
    }
    // Respond fast to the provider, then process in the background.
    static scheduleProcessing(eventId) {
        setImmediate(() => {
            void this.processEvent(eventId).catch((error) => {
                logger_js_1.logger.error(`Webhook async processing error for ${eventId}:`, error);
            });
        });
    }
    static async processEvent(eventId) {
        const [event] = await database_js_1.db
            .select()
            .from(schema_js_1.webhookEvents)
            .where((0, drizzle_orm_1.eq)(schema_js_1.webhookEvents.id, eventId))
            .limit(1);
        if (!event)
            return;
        await database_js_1.db
            .update(schema_js_1.webhookEvents)
            .set({ status: 'processing' })
            .where((0, drizzle_orm_1.eq)(schema_js_1.webhookEvents.id, eventId));
        try {
            await this.dispatch(event);
            await database_js_1.db
                .update(schema_js_1.webhookEvents)
                .set({ status: 'processed', processedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_js_1.webhookEvents.id, eventId));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger_js_1.logger.error(`Webhook event ${eventId} (${event.eventType}) failed:`, error);
            await database_js_1.db
                .update(schema_js_1.webhookEvents)
                .set({
                status: 'failed',
                errorMessage: message,
                retryCount: (event.retryCount || 0) + 1,
            })
                .where((0, drizzle_orm_1.eq)(schema_js_1.webhookEvents.id, eventId));
        }
    }
    // Dispatch normalized events to their handlers.
    static async dispatch(event) {
        const payload = event.payload ?? {};
        const data = payload.data ?? {};
        const chat = data?.Info?.Chat || data?.key?.remoteJid || null;
        const sender = data?.Info?.Sender || data?.key?.participant || null;
        const messageId = data?.Info?.ID || data?.key?.id || null;
        switch (event.eventType) {
            case 'Message':
            case 'messages.upsert':
            case 'SendMessage':
                logger_js_1.logger.info(`[webhook] Processing message event id=${messageId} chat=${chat} sender=${sender}`);
                await this.handleIncomingMessage(event);
                break;
            case 'participant.update':
            case 'GroupParticipants':
            case 'GroupParticipantsUpdate':
                logger_js_1.logger.info(`[webhook] Participant lifecycle event ${event.eventType} chat=${chat}`);
                await this.handleParticipantLifecycle(event);
                break;
            case 'Connected':
            case 'Disconnected':
            case 'LoggedOut':
                logger_js_1.logger.info(`[webhook] Connection event ${event.eventType} instance=${payload.instanceName}`);
                break;
            case 'GroupInfo':
            case 'JoinedGroup':
                logger_js_1.logger.info(`[webhook] Group event ${event.eventType} chat=${chat}`);
                break;
            default:
                logger_js_1.logger.info(`[webhook] Unhandled event type ${event.eventType}`);
        }
    }
    // Persist incoming/outgoing messages into PostgreSQL chatLogs, updating member/group
    static async handleIncomingMessage(event) {
        const payload = event.payload ?? {};
        const data = payload.data ?? payload;
        const info = data?.Info || {};
        const key = data?.key || {};
        const messageId = info.ID || key.id || null;
        const chatJid = info.Chat || key.remoteJid || null;
        const fromMe = Boolean(info.IsFromMe ?? key.fromMe ?? (event.eventType === 'SendMessage'));
        const senderJid = info.Sender || key.participant || (fromMe ? null : chatJid) || null;
        const pushName = info.PushName || data.pushName || 'WhatsApp User';
        const isGroup = Boolean(info.IsGroup ?? (chatJid ? chatJid.endsWith('@g.us') : false));
        const msgObj = data.Message || data.message || {};
        const content = msgObj.conversation ||
            msgObj.extendedTextMessage?.text ||
            msgObj.imageMessage?.caption ||
            msgObj.videoMessage?.caption ||
            msgObj.documentMessage?.caption ||
            (typeof data.content === 'string' ? data.content : '');
        let messageType = 'text';
        if (msgObj.imageMessage)
            messageType = 'image';
        else if (msgObj.videoMessage)
            messageType = 'video';
        else if (msgObj.documentMessage)
            messageType = 'document';
        else if (msgObj.audioMessage)
            messageType = 'audio';
        const mediaUrl = msgObj.imageMessage?.url ||
            msgObj.videoMessage?.url ||
            msgObj.documentMessage?.url ||
            msgObj.audioMessage?.url ||
            null;
        const sentAt = info.Timestamp
            ? new Date(info.Timestamp)
            : data.messageTimestamp
                ? new Date(data.messageTimestamp * 1000)
                : new Date();
        // Deduplication check: skip if messageId already in chatLogs
        if (messageId) {
            const existing = await database_js_1.db
                .select({ id: schema_js_1.chatLogs.id })
                .from(schema_js_1.chatLogs)
                .where((0, drizzle_orm_1.eq)(schema_js_1.chatLogs.whatsappMsgId, messageId))
                .limit(1);
            if (existing.length > 0) {
                logger_js_1.logger.info(`[webhook] Skip existing chatLog whatsappMsgId=${messageId}`);
                return existing[0].id;
            }
        }
        // Upsert member
        let memberId = null;
        const senderPhone = senderJid
            ? senderJid.split('@')[0]
            : chatJid && !isGroup
                ? chatJid.split('@')[0]
                : null;
        if (senderPhone && senderPhone !== 'status') {
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
                    externalId: senderJid || undefined,
                    lastActiveAt: new Date(),
                })
                    .onConflictDoNothing()
                    .returning();
                member =
                    newMember ||
                        (await database_js_1.db.query.members.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_js_1.members.whatsappNumber, senderPhone),
                        }));
            }
            else {
                await database_js_1.db
                    .update(schema_js_1.members)
                    .set({ lastActiveAt: new Date(), updatedAt: new Date() })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, member.id));
            }
            if (member) {
                memberId = member.id;
            }
        }
        // Upsert group
        let groupId = null;
        if (isGroup && chatJid) {
            let group = await database_js_1.db.query.groups.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_js_1.groups.whatsappGroupJid, chatJid),
            });
            if (!group) {
                const [newGroup] = await database_js_1.db
                    .insert(schema_js_1.groups)
                    .values({
                    whatsappGroupJid: chatJid,
                    name: pushName && pushName !== 'WhatsApp User' ? pushName : 'WhatsApp Group',
                })
                    .onConflictDoNothing()
                    .returning();
                group =
                    newGroup ||
                        (await database_js_1.db.query.groups.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_js_1.groups.whatsappGroupJid, chatJid),
                        }));
            }
            else {
                await database_js_1.db
                    .update(schema_js_1.groups)
                    .set({
                    messageCountToday: (0, drizzle_orm_1.sql) `${schema_js_1.groups.messageCountToday} + 1`,
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, group.id));
            }
            if (group) {
                groupId = group.id;
            }
        }
        // Ensure groupMembers relation
        if (groupId && memberId) {
            await database_js_1.db
                .insert(schema_js_1.groupMembers)
                .values({
                groupId,
                memberId,
            })
                .onConflictDoNothing();
        }
        // Insert into chatLogs
        const direction = fromMe ? 'outbound' : 'inbound';
        const [chatLog] = await database_js_1.db
            .insert(schema_js_1.chatLogs)
            .values({
            groupId,
            memberId,
            whatsappMsgId: messageId,
            direction,
            content,
            messageType,
            mediaUrl,
            isFromAi: false,
            sentAt,
        })
            .returning();
        logger_js_1.logger.info(`[webhook] Persisted message id=${chatLog.id} msgId=${messageId} direction=${direction}`);
        // TASK-014: AI Cost Control Pre-filter
        let targetGroup = null;
        if (groupId) {
            targetGroup = await database_js_1.db.query.groups.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_js_1.groups.id, groupId),
            });
        }
        const shouldRunAi = content &&
            content.trim().length >= 3 &&
            messageType === 'text' &&
            direction === 'inbound' &&
            (!targetGroup || (targetGroup.aiEnabled && (!targetGroup.aiPausedUntil || new Date(targetGroup.aiPausedUntil) <= new Date())));
        if (shouldRunAi && chatLog) {
            try {
                const aiResult = await ai_service_js_1.AiService.analyzeMessage(content);
                // Update chatLog with AI sentiment, topic, and flagging
                await database_js_1.db
                    .update(schema_js_1.chatLogs)
                    .set({
                    sentiment: aiResult.sentiment,
                    topic: aiResult.topic,
                    isSpam: aiResult.isSpam,
                    isFlagged: aiResult.isSpam || aiResult.isToxic,
                })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.chatLogs.id, chatLog.id));
                // Save AI analysis result
                await database_js_1.db.insert(schema_js_1.aiAnalyses).values({
                    chatLogId: chatLog.id,
                    analysisType: 'moderation_sentiment',
                    result: aiResult,
                    confidence: String(aiResult.confidence || 0.9),
                    modelUsed: env_js_1.env.OPENROUTER_API_KEY ? env_js_1.env.OPENROUTER_MODEL : env_js_1.env.OPENAI_MODEL,
                });
                // TASK-014: AI Guardrail — Shadow Mode
                // Create Moderation Alert for human review (NO auto-delete/auto-kick)
                if ((aiResult.isSpam || aiResult.isToxic) && targetGroup && targetGroup.autoModeration) {
                    await database_js_1.db.insert(schema_js_1.moderationAlerts).values({
                        groupId: targetGroup.id,
                        memberId: memberId || undefined,
                        chatLogId: chatLog.id,
                        alertType: aiResult.isSpam ? 'spam' : 'toxic',
                        severity: aiResult.isToxic ? 'high' : 'medium',
                        description: aiResult.reason || 'Flagged by AI Moderation System (Shadow Mode)',
                        status: 'pending',
                    });
                    logger_js_1.logger.info(`[ai-guardrail] Shadow Mode alert created for chatLogId=${chatLog.id} group=${targetGroup.name}`);
                }
            }
            catch (error) {
                logger_js_1.logger.error(`[ai] Analysis error for chatLogId=${chatLog.id}:`, error);
            }
        }
        // TASK-016: Human Support Keyword Detection -> Auto Create Escalation & Human Takeover (Pause AI)
        const lowerContent = content ? content.toLowerCase() : '';
        const humanSupportKeywords = [
            'butuh admin',
            'bicara dengan manusia',
            'bantuan cs',
            'panggil admin',
            'human support',
            'bicara dengan admin',
            'butuh bantuan cs',
        ];
        const needsHumanTakeover = humanSupportKeywords.some((kw) => lowerContent.includes(kw));
        if (needsHumanTakeover && groupId) {
            try {
                const pauseUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
                await database_js_1.db
                    .update(schema_js_1.groups)
                    .set({ aiPausedUntil: pauseUntil })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, groupId));
                await database_js_1.db.insert(schema_js_1.escalations).values({
                    groupId,
                    memberId: memberId || undefined,
                    title: `Human Support Requested by Member`,
                    description: `Member message: "${content}"`,
                    priority: 'high',
                    status: 'open',
                });
                logger_js_1.logger.info(`[human-takeover] Escalation created and AI paused for group ${groupId} via keyword match`);
            }
            catch (err) {
                logger_js_1.logger.error(`[human-takeover] Failed to trigger auto-escalation: ${err.message}`);
            }
        }
        return chatLog.id;
    }
    // Handle participant join, leave, promote, demote events from Evolution Go
    static async handleParticipantLifecycle(event) {
        const payload = event.payload ?? {};
        const data = payload.data ?? payload;
        const groupJid = data?.groupJid ||
            data?.id ||
            data?.Info?.Chat ||
            data?.key?.remoteJid ||
            null;
        let action = (data?.action || data?.Type || '').toLowerCase();
        if (action === 'add' || action === 'join')
            action = 'add';
        else if (action === 'remove' || action === 'leave')
            action = 'remove';
        else if (action === 'promote')
            action = 'promote';
        else if (action === 'demote')
            action = 'demote';
        if (!groupJid || !action)
            return;
        let rawParticipants = data?.participants || data?.participant || [];
        if (!Array.isArray(rawParticipants)) {
            rawParticipants = [rawParticipants];
        }
        const participantJids = rawParticipants.filter((p) => typeof p === 'string' && p.length > 0);
        if (participantJids.length === 0)
            return;
        let group = await database_js_1.db.query.groups.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.groups.whatsappGroupJid, groupJid),
        });
        if (!group && groupJid.endsWith('@g.us')) {
            const [newGroup] = await database_js_1.db
                .insert(schema_js_1.groups)
                .values({
                whatsappGroupJid: groupJid,
                name: data.pushName || 'WhatsApp Group',
            })
                .onConflictDoNothing()
                .returning();
            group =
                newGroup ||
                    (await database_js_1.db.query.groups.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema_js_1.groups.whatsappGroupJid, groupJid),
                    }));
        }
        if (!group)
            return;
        for (const pJid of participantJids) {
            const phone = pJid.split('@')[0];
            if (!phone || phone === 'status')
                continue;
            let member = await database_js_1.db.query.members.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_js_1.members.whatsappNumber, phone),
            });
            if (!member) {
                const [newMember] = await database_js_1.db
                    .insert(schema_js_1.members)
                    .values({
                    whatsappNumber: phone,
                    displayName: data.pushName || phone,
                    phone,
                    externalId: pJid,
                    lastActiveAt: new Date(),
                })
                    .onConflictDoNothing()
                    .returning();
                member =
                    newMember ||
                        (await database_js_1.db.query.members.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_js_1.members.whatsappNumber, phone),
                        }));
            }
            if (!member)
                continue;
            if (action === 'add') {
                await database_js_1.db
                    .insert(schema_js_1.groupMembers)
                    .values({
                    groupId: group.id,
                    memberId: member.id,
                    role: 'member',
                    status: 'active',
                    joinedAt: new Date(),
                    syncedAt: new Date(),
                })
                    .onConflictDoUpdate({
                    target: [schema_js_1.groupMembers.groupId, schema_js_1.groupMembers.memberId],
                    set: {
                        status: 'active',
                        leftAt: null,
                        syncedAt: new Date(),
                    },
                });
            }
            else if (action === 'promote') {
                await database_js_1.db
                    .insert(schema_js_1.groupMembers)
                    .values({
                    groupId: group.id,
                    memberId: member.id,
                    role: 'admin',
                    status: 'active',
                    syncedAt: new Date(),
                })
                    .onConflictDoUpdate({
                    target: [schema_js_1.groupMembers.groupId, schema_js_1.groupMembers.memberId],
                    set: {
                        role: 'admin',
                        status: 'active',
                        syncedAt: new Date(),
                    },
                });
            }
            else if (action === 'demote') {
                await database_js_1.db
                    .insert(schema_js_1.groupMembers)
                    .values({
                    groupId: group.id,
                    memberId: member.id,
                    role: 'member',
                    status: 'active',
                    syncedAt: new Date(),
                })
                    .onConflictDoUpdate({
                    target: [schema_js_1.groupMembers.groupId, schema_js_1.groupMembers.memberId],
                    set: {
                        role: 'member',
                        status: 'active',
                        syncedAt: new Date(),
                    },
                });
            }
            else if (action === 'remove') {
                await database_js_1.db
                    .update(schema_js_1.groupMembers)
                    .set({
                    status: 'left',
                    leftAt: new Date(),
                    syncedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.sql) `${schema_js_1.groupMembers.groupId} = ${group.id} AND ${schema_js_1.groupMembers.memberId} = ${member.id}`);
            }
        }
        const memberCountRes = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.groupMembers)
            .where((0, drizzle_orm_1.sql) `${schema_js_1.groupMembers.groupId} = ${group.id} AND ${schema_js_1.groupMembers.status} = 'active'`);
        const activeCount = Number(memberCountRes[0]?.count || 0);
        await database_js_1.db
            .update(schema_js_1.groups)
            .set({
            memberCount: activeCount,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, group.id));
        logger_js_1.logger.info(`[webhook] Handled participant lifecycle group=${group.name} action=${action} count=${activeCount}`);
    }
}
exports.WebhooksService = WebhooksService;
