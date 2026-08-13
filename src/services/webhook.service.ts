import { db } from '../config/database.js';
import {
  groups,
  members,
  groupMembers,
  chatLogs,
  moderationAlerts,
  aiAnalyses,
  integrations,
  communities,
} from '../../drizzle/schema.js';
import { eq, sql } from 'drizzle-orm';
import { AiService } from './ai.service.js';
import { EvolutionService } from './evolution.service.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class WebhookService {
  static async handleEvent(payload: any) {
    const event = payload.event || payload.type;
    const data = payload.data || payload;

    logger.info(`Received Evolution webhook event: ${event}`);

    try {
      switch (event) {
        case 'Message':
        case 'messages.upsert':
          data.instanceName = payload.instanceName || data.instanceName;
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
          logger.info(`Unhandled webhook event: ${event}`);
      }
    } catch (error) {
      logger.error(`Error processing webhook event ${event}:`, error);
    }
  }

  private static async handleIncomingMessage(data: any) {
    const key = data.key || {};
    const info = data.Info || {};
    const remoteJid = key.remoteJid || info.MessageSource?.Chat || info.Chat;
    if (!remoteJid) return;

    // Detect GROUP_PARTICIPANT_ADD / LEAVE from whatsmeow stub types
    const stubType = info.MessageStubType || data.messageStubType;
    if (stubType === 27 || stubType === 28 || stubType === 32 || data.messageStubParameters || info.MessageStubParameters) {
        const action = stubType === 27 ? 'add' : 'remove';
        const participants = info.MessageStubParameters || data.messageStubParameters || [];
        if (participants.length > 0) {
            await this.handleParticipantUpdate({
                groupJid: remoteJid,
                action: action,
                participant: participants[0],
                instanceName: data.instanceName
            });
        }
        return;
    }

    const fromMe = Boolean(key.fromMe ?? info.MessageSource?.IsFromMe ?? info.IsFromMe);
    const msgId = key.id || info.ID;
    const pushName = data.pushName || info.PushName || 'WhatsApp User';
    
    const msgData = data.Message || data.message || {};
    const messageContent =
      msgData.conversation ||
      msgData.extendedTextMessage?.text ||
      msgData.imageMessage?.caption ||
      msgData.videoMessage?.caption ||
      '';

    const senderSource = info.MessageSource?.Sender || info.Sender || key.participant || remoteJid;
    const senderPhone = senderSource.split('@')[0];

    // Find or create member
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
        })
        .onConflictDoNothing()
        .returning();

      member = newMember || (await db.query.members.findFirst({
        where: eq(members.whatsappNumber, senderPhone),
      }));
    }

    // Find group if message is in a group
    let group = await db.query.groups.findFirst({
      where: eq(groups.whatsappGroupJid, remoteJid),
    });

    if (remoteJid.endsWith('@g.us')) {
      if (!group || group.status !== 'active') {
        logger.info(`[webhook] Skipping message from unregistered/inactive group ${remoteJid}`);
        return;
      }
    }

    // Ensure member is in groupMembers relation
    if (group && member) {
      await db
        .insert(groupMembers)
        .values({
          groupId: group.id,
          memberId: member.id,
        })
        .onConflictDoNothing();
    }

    // Perform AI analysis on message
    const aiResult = await AiService.analyzeMessage(messageContent);

    // Save to chatLogs
    const [chatLog] = await db
      .insert(chatLogs)
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
      await db.insert(aiAnalyses).values({
        chatLogId: chatLog.id,
        analysisType: 'moderation_sentiment',
        result: aiResult,
        confidence: (aiResult.confidence || 0.85).toFixed(2),
        modelUsed: env.OPENAI_MODEL,
      });

      // Increment message count today for group
      if (group) {
        await db
          .update(groups)
          .set({
            messageCountToday: sql`${groups.messageCountToday} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(groups.id, group.id));
      }
    }

    // Create Moderation Alert if flagged & autoModeration enabled
    if (
      (aiResult.isSpam || aiResult.isToxic) &&
      group &&
      member &&
      chatLog &&
      group.autoModeration
    ) {
      await db.insert(moderationAlerts).values({
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
    if (
      !fromMe &&
      group?.aiEnabled &&
      group?.autoFaq &&
      messageContent.endsWith('?')
    ) {
      const faqResponse = await AiService.generateFaqResponse(messageContent);
      if (faqResponse && data.instanceName) {
        await EvolutionService.sendText(
          data.instanceName,
          remoteJid,
          faqResponse
        );

        // Save outbound AI message log
        await db.insert(chatLogs).values({
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

  private static async handleParticipantUpdate(data: any) {
    const groupJid = data.groupJid || data.id;
    const participantPhone = (data.participant || data.participants?.[0] || '')
      .split('@')[0];
    const action = data.action; // 'add' or 'remove'

    if (!groupJid || !participantPhone) return;

    let group = await db.query.groups.findFirst({
      where: eq(groups.whatsappGroupJid, groupJid),
    });

    // If groupJid is a Community Parent JID, fallback to finding the subgroup under that community
    if (!group) {
      const community = await db.query.communities.findFirst({
        where: eq(communities.whatsappCommunityId, groupJid),
      });

      if (community) {
        group = await db.query.groups.findFirst({
          where: eq(groups.communityId, community.id),
        });
      }
    }

    if (!group || group.status !== 'active') return;

    let member = await db.query.members.findFirst({
      where: eq(members.whatsappNumber, participantPhone),
    });

    if (!member && action === 'add') {
      const [newMember] = await db
        .insert(members)
        .values({
          whatsappNumber: participantPhone,
          phone: participantPhone,
        })
        .onConflictDoNothing()
        .returning();

      member = newMember || (await db.query.members.findFirst({
        where: eq(members.whatsappNumber, participantPhone),
      }));
    }

    if (action === 'add' && member) {
      await db
        .insert(groupMembers)
        .values({
          groupId: group.id,
          memberId: member.id,
        })
        .onConflictDoNothing();

      // Recalculate member count
      const memberCountRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, group.id));

      await db
        .update(groups)
        .set({
          memberCount: Number(memberCountRes[0]?.count || 0),
          updatedAt: new Date(),
        })
        .where(eq(groups.id, group.id));

      // Auto Welcome & Onboarding (Only for non-announcement groups with autoWelcome enabled)
      if (group.autoWelcome && group.groupType !== 'announcement') {
        if (data.instanceName && !env.N8N_WEBHOOK_URL) {
          const welcomeText = `Selamat datang di ${group.name}! Silakan baca peraturan grup dan perkenalkan diri Anda.`;
          await EvolutionService.sendText(
            data.instanceName,
            groupJid,
            welcomeText
          );
        }

        // Trigger n8n Onboarding Workflow
        if (env.N8N_WEBHOOK_URL) {
          try {
            fetch(env.N8N_WEBHOOK_URL, {
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
            }).catch((err) => logger.error('Failed to trigger n8n webhook', err));
          } catch (err) {
            logger.error('Failed to trigger n8n webhook', err);
          }
        }
      }
    } else if (action === 'remove' && member) {
      await db
        .delete(groupMembers)
        .where(
          sql`${groupMembers.groupId} = ${group.id} AND ${groupMembers.memberId} = ${member.id}`
        );

      const memberCountRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, group.id));

      await db
        .update(groups)
        .set({
          memberCount: Number(memberCountRes[0]?.count || 0),
          updatedAt: new Date(),
        })
        .where(eq(groups.id, group.id));
    }
  }

  private static async handleGroupUpdate(data: any) {
    const groupJid = data.groupJid || data.id;
    if (!groupJid) return;

    const updateFields: any = { updatedAt: new Date() };
    if (data.subject) updateFields.name = data.subject;
    if (data.description) updateFields.description = data.description;

    await db
      .update(groups)
      .set(updateFields)
      .where(eq(groups.whatsappGroupJid, groupJid));
  }

  private static async handleConnectionUpdate(data: any) {
    const state = data.state || data.status;
    const status = state === 'open' ? 'connected' : 'disconnected';

    await db
      .update(integrations)
      .set({
        status,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(integrations.type, 'whatsapp'));
  }
}
