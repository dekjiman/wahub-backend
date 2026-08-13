import { createHash } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import {
  webhookEvents,
  chatLogs,
  members,
  groups,
  groupMembers,
  aiAnalyses,
  moderationAlerts,
  escalations,
} from '../../../drizzle/schema.js';

import { logger } from '../../utils/logger.js';
import { AiService } from '../../services/ai.service.js';
import { env } from '../../config/env.js';


export interface NormalizedWebhookEvent {
  provider: string;
  instanceName: string | null;
  externalEventId: string | null;
  eventType: string;
  payload: unknown;
}

export interface IngestResult {
  stored: boolean;
  duplicate: boolean;
  eventId?: string;
}

export class WebhooksService {
  // Evolution Go (patched) sends:
  //   { event, data, instanceName, instanceId, instanceToken }
  // The `data` for message events is a whatsmeow events.Message serialization
  // with a stable Info.ID. When no stable ID is present we fall back to a
  // content hash so provider retries (same body) are deduplicated.
  static normalizeEvolutionGo(payload: any): NormalizedWebhookEvent | null {
    const event = payload?.event || payload?.type;
    if (typeof event !== 'string' || !event) return null;

    const data = payload?.data ?? {};
    let externalEventId: string | null = null;
    if (typeof data?.Info?.ID === 'string' && data.Info.ID) {
      externalEventId = data.Info.ID;
    } else if (typeof data?.key?.id === 'string' && data.key.id) {
      externalEventId = data.key.id;
    }
    if (!externalEventId) {
      externalEventId = createHash('sha256')
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

  static async ingest(payload: any): Promise<IngestResult> {
    const normalized = this.normalizeEvolutionGo(payload);
    if (!normalized) {
      return { stored: false, duplicate: false };
    }

    const [row] = await db
      .insert(webhookEvents)
      .values({
        provider: normalized.provider,
        instanceName: normalized.instanceName,
        externalEventId: normalized.externalEventId,
        eventType: normalized.eventType,
        payload: normalized.payload as any,
      })
      .onConflictDoNothing({
        target: [webhookEvents.provider, webhookEvents.externalEventId],
      })
      .returning();

    if (!row) {
      logger.info(
        `Duplicate webhook ignored: ${normalized.eventType} ${normalized.externalEventId}`
      );
      return { stored: false, duplicate: true };
    }

    return { stored: true, duplicate: false, eventId: row.id };
  }

  // Respond fast to the provider, then process in the background.
  static scheduleProcessing(eventId: string) {
    setImmediate(() => {
      void this.processEvent(eventId).catch((error) => {
        logger.error(`Webhook async processing error for ${eventId}:`, error);
      });
    });
  }

  static async processEvent(eventId: string) {
    const [event] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, eventId))
      .limit(1);

    if (!event) return;

    await db
      .update(webhookEvents)
      .set({ status: 'processing' })
      .where(eq(webhookEvents.id, eventId));

    try {
      await this.dispatch(event);
      await db
        .update(webhookEvents)
        .set({ status: 'processed', processedAt: new Date() })
        .where(eq(webhookEvents.id, eventId));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Webhook event ${eventId} (${event.eventType}) failed:`, error);
      await db
        .update(webhookEvents)
        .set({
          status: 'failed',
          errorMessage: message,
          retryCount: (event.retryCount || 0) + 1,
        })
        .where(eq(webhookEvents.id, eventId));
    }
  }

  // Dispatch normalized events to their handlers.
  static async dispatch(event: any) {
    const payload = event.payload ?? {};
    const data = payload.data ?? {};
    const chat = data?.Info?.Chat || data?.key?.remoteJid || null;
    const sender = data?.Info?.Sender || data?.key?.participant || null;
    const messageId = data?.Info?.ID || data?.key?.id || null;

    switch (event.eventType) {
      case 'Message':
      case 'messages.upsert':
      case 'SendMessage':
        logger.info(`[webhook] Processing message event id=${messageId} chat=${chat} sender=${sender}`);
        await this.handleIncomingMessage(event);
        break;
      case 'participant.update':
      case 'GroupParticipants':
      case 'GroupParticipantsUpdate':
        logger.info(`[webhook] Participant lifecycle event ${event.eventType} chat=${chat}`);
        await this.handleParticipantLifecycle(event);
        break;
      case 'Connected':
      case 'Disconnected':
      case 'LoggedOut':
        logger.info(`[webhook] Connection event ${event.eventType} instance=${payload.instanceName}`);
        break;
      case 'GroupInfo':
      case 'JoinedGroup':
        logger.info(`[webhook] Group event ${event.eventType} chat=${chat}`);
        break;
      default:
        logger.info(`[webhook] Unhandled event type ${event.eventType}`);
    }
  }

  // Persist incoming/outgoing messages into PostgreSQL chatLogs, updating member/group
  static async handleIncomingMessage(event: any) {
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
    const content =
      msgObj.conversation ||
      msgObj.extendedTextMessage?.text ||
      msgObj.imageMessage?.caption ||
      msgObj.videoMessage?.caption ||
      msgObj.documentMessage?.caption ||
      (typeof data.content === 'string' ? data.content : '');

    let messageType: 'text' | 'image' | 'video' | 'document' | 'audio' = 'text';
    if (msgObj.imageMessage) messageType = 'image';
    else if (msgObj.videoMessage) messageType = 'video';
    else if (msgObj.documentMessage) messageType = 'document';
    else if (msgObj.audioMessage) messageType = 'audio';

    const mediaUrl =
      msgObj.imageMessage?.url ||
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
      const existing = await db
        .select({ id: chatLogs.id })
        .from(chatLogs)
        .where(eq(chatLogs.whatsappMsgId, messageId))
        .limit(1);

      if (existing.length > 0) {
        logger.info(`[webhook] Skip existing chatLog whatsappMsgId=${messageId}`);
        return existing[0].id;
      }
    }

    // Upsert member
    let memberId: string | null = null;
    const senderPhone = senderJid
      ? senderJid.split('@')[0]
      : chatJid && !isGroup
        ? chatJid.split('@')[0]
        : null;

    if (senderPhone && senderPhone !== 'status') {
      let member = await db.query.members.findFirst({
        where: eq(members.whatsappNumber, senderPhone),
      });

      if (!member) {
        const [newMember] = await db
          .insert(members)
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
          (await db.query.members.findFirst({
            where: eq(members.whatsappNumber, senderPhone),
          }));
      } else {
        await db
          .update(members)
          .set({ lastActiveAt: new Date(), updatedAt: new Date() })
          .where(eq(members.id, member.id));
      }

      if (member) {
        memberId = member.id;
      }
    }

    // Check if group is registered and active
    let groupId: string | null = null;
    let targetGroup: any = null;
    if (isGroup && chatJid) {
      targetGroup = await db.query.groups.findFirst({
        where: eq(groups.whatsappGroupJid, chatJid),
      });

      // Ignore unregistered or inactive groups
      if (!targetGroup || targetGroup.status !== 'active') {
        logger.info(`[webhook] Ignoring message from unregistered/inactive group: ${chatJid}`);
        return null;
      }

      await db
        .update(groups)
        .set({
          messageCountToday: sql`${groups.messageCountToday} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(groups.id, targetGroup.id));

      groupId = targetGroup.id;
    }

    // Ensure groupMembers relation
    if (groupId && memberId) {
      await db
        .insert(groupMembers)
        .values({
          groupId,
          memberId,
        })
        .onConflictDoNothing();
    }

    // Insert into chatLogs
    const direction = fromMe ? 'outbound' : 'inbound';
    const [chatLog] = await db
      .insert(chatLogs)
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

    logger.info(
      `[webhook] Persisted message id=${chatLog.id} msgId=${messageId} direction=${direction}`
    );

    // TASK-014: AI Cost Control Pre-filter
    const shouldRunAi =
      content &&
      content.trim().length >= 3 &&
      messageType === 'text' &&
      direction === 'inbound' &&
      (!targetGroup || (targetGroup.aiEnabled && (!targetGroup.aiPausedUntil || new Date(targetGroup.aiPausedUntil) <= new Date())));

    if (shouldRunAi && chatLog) {
      try {
        const aiResult = await AiService.analyzeMessage(content);

        // Update chatLog with AI sentiment, topic, and flagging
        await db
          .update(chatLogs)
          .set({
            sentiment: aiResult.sentiment,
            topic: aiResult.topic,
            isSpam: aiResult.isSpam,
            isFlagged: aiResult.isSpam || aiResult.isToxic,
          })
          .where(eq(chatLogs.id, chatLog.id));

        // Save AI analysis result
        await db.insert(aiAnalyses).values({
          chatLogId: chatLog.id,
          analysisType: 'moderation_sentiment',
          result: aiResult as any,
          confidence: String(aiResult.confidence || 0.9),
          modelUsed: env.OPENROUTER_API_KEY ? env.OPENROUTER_MODEL : env.OPENAI_MODEL,
        });

        // TASK-014: AI Guardrail — Shadow Mode
        // Create Moderation Alert for human review (NO auto-delete/auto-kick)
        if ((aiResult.isSpam || aiResult.isToxic) && targetGroup && targetGroup.autoModeration) {
          await db.insert(moderationAlerts).values({
            groupId: targetGroup.id,
            memberId: memberId || undefined,
            chatLogId: chatLog.id,
            alertType: aiResult.isSpam ? 'spam' : 'toxic',
            severity: aiResult.isToxic ? 'high' : 'medium',
            description: aiResult.reason || 'Flagged by AI Moderation System (Shadow Mode)',
            status: 'pending',
          });

          logger.info(
            `[ai-guardrail] Shadow Mode alert created for chatLogId=${chatLog.id} group=${targetGroup.name}`
          );
        }
      } catch (error) {
        logger.error(`[ai] Analysis error for chatLogId=${chatLog.id}:`, error);
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
        await db
          .update(groups)
          .set({ aiPausedUntil: pauseUntil })
          .where(eq(groups.id, groupId));

        await db.insert(escalations).values({
          groupId,
          memberId: memberId || undefined,
          title: `Human Support Requested by Member`,
          description: `Member message: "${content}"`,
          priority: 'high',
          status: 'open',
        });

        logger.info(
          `[human-takeover] Escalation created and AI paused for group ${groupId} via keyword match`
        );
      } catch (err: any) {
        logger.error(`[human-takeover] Failed to trigger auto-escalation: ${err.message}`);
      }
    }

    return chatLog.id;
  }



  // Handle participant join, leave, promote, demote events from Evolution Go
  static async handleParticipantLifecycle(event: any) {
    const payload = event.payload ?? {};
    const data = payload.data ?? payload;

    const groupJid =
      data?.groupJid ||
      data?.id ||
      data?.Info?.Chat ||
      data?.key?.remoteJid ||
      null;

    let action = (data?.action || data?.Type || '').toLowerCase();
    if (action === 'add' || action === 'join') action = 'add';
    else if (action === 'remove' || action === 'leave') action = 'remove';
    else if (action === 'promote') action = 'promote';
    else if (action === 'demote') action = 'demote';

    if (!groupJid || !action) return;

    let rawParticipants = data?.participants || data?.participant || [];
    if (!Array.isArray(rawParticipants)) {
      rawParticipants = [rawParticipants];
    }

    const participantJids: string[] = rawParticipants.filter(
      (p: any) => typeof p === 'string' && p.length > 0
    );

    if (participantJids.length === 0) return;

    let group = await db.query.groups.findFirst({
      where: eq(groups.whatsappGroupJid, groupJid),
    });

    // Ignore unregistered or inactive groups
    if (!group || group.status !== 'active') {
      logger.info(`[webhook] Ignoring participant lifecycle from unregistered/inactive group: ${groupJid}`);
      return;
    }

    for (const pJid of participantJids) {
      const phone = pJid.split('@')[0];
      if (!phone || phone === 'status') continue;

      let member = await db.query.members.findFirst({
        where: eq(members.whatsappNumber, phone),
      });

      if (!member) {
        const [newMember] = await db
          .insert(members)
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
          (await db.query.members.findFirst({
            where: eq(members.whatsappNumber, phone),
          }));
      }

      if (!member) continue;

      if (action === 'add') {
        await db
          .insert(groupMembers)
          .values({
            groupId: group.id,
            memberId: member.id,
            role: 'member',
            status: 'active',
            joinedAt: new Date(),
            syncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [groupMembers.groupId, groupMembers.memberId],
            set: {
              status: 'active',
              leftAt: null,
              syncedAt: new Date(),
            },
          });
      } else if (action === 'promote') {
        await db
          .insert(groupMembers)
          .values({
            groupId: group.id,
            memberId: member.id,
            role: 'admin',
            status: 'active',
            syncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [groupMembers.groupId, groupMembers.memberId],
            set: {
              role: 'admin',
              status: 'active',
              syncedAt: new Date(),
            },
          });
      } else if (action === 'demote') {
        await db
          .insert(groupMembers)
          .values({
            groupId: group.id,
            memberId: member.id,
            role: 'member',
            status: 'active',
            syncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [groupMembers.groupId, groupMembers.memberId],
            set: {
              role: 'member',
              status: 'active',
              syncedAt: new Date(),
            },
          });
      } else if (action === 'remove') {
        await db
          .update(groupMembers)
          .set({
            status: 'left',
            leftAt: new Date(),
            syncedAt: new Date(),
          })
          .where(
            sql`${groupMembers.groupId} = ${group.id} AND ${groupMembers.memberId} = ${member.id}`
          );
      }
    }

    const memberCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(groupMembers)
      .where(
        sql`${groupMembers.groupId} = ${group.id} AND ${groupMembers.status} = 'active'`
      );

    const activeCount = Number(memberCountRes[0]?.count || 0);

    await db
      .update(groups)
      .set({
        memberCount: activeCount,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, group.id));

    logger.info(
      `[webhook] Handled participant lifecycle group=${group.name} action=${action} count=${activeCount}`
    );
  }
}

