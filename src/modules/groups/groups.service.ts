import { db } from '../../config/database.js';
import {
  groups,
  groupMembers,
  members,
  admins,
  chatLogs,
  moderationAlerts,
  communities,
} from '../../../drizzle/schema.js';
import { eq, sql, gte, and, desc } from 'drizzle-orm';
import { EvolutionService } from '../../services/evolution.service.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class GroupsService {
  private static formatGroup(row: typeof groups.$inferSelect, adminName?: string) {
    return {
      id: row.id,
      community_id: row.communityId,
      whatsapp_group_jid: row.whatsappGroupJid,
      name: row.name,
      description: row.description,
      group_type: (row.groupType || 'regular') as 'regular' | 'announcement' | 'support',
      assigned_admin_id: row.assignedAdminId || null,
      assigned_admin_name: adminName || null,
      ai_enabled: row.aiEnabled ?? true,
      ai_paused_until: row.aiPausedUntil ? row.aiPausedUntil.toISOString() : null,
      auto_welcome: row.autoWelcome ?? true,
      auto_faq: row.autoFaq ?? true,
      auto_moderation: row.autoModeration ?? true,
      member_count: row.memberCount || 0,
      message_count_today: row.messageCountToday || 0,
      status: (row.status || 'active') as 'active' | 'inactive',
    };
  }

  static async list() {
    const rows = await db
      .select({
        group: groups,
        adminName: admins.name,
      })
      .from(groups)
      .leftJoin(admins, eq(groups.assignedAdminId, admins.id));
    return rows.map((r) => this.formatGroup(r.group, r.adminName ?? undefined));
  }

  static async getById(id: string) {
    const rows = await db
      .select({
        group: groups,
        adminName: admins.name,
      })
      .from(groups)
      .leftJoin(admins, eq(groups.assignedAdminId, admins.id))
      .where(eq(groups.id, id))
      .limit(1);
    const row = rows[0];
    return row ? this.formatGroup(row.group, row.adminName ?? undefined) : null;
  }

  static async create(data: {
    whatsapp_group_jid?: string;
    name: string;
    community_id?: string;
    description?: string;
    group_type?: string;
    assigned_admin_id?: string;
    ai_enabled?: boolean;
    auto_welcome?: boolean;
    auto_faq?: boolean;
    auto_moderation?: boolean;
    max_members?: number;
    instance_name?: string;
  }) {
    const instanceName = data.instance_name || env.EVOLUTION_DEFAULT_INSTANCE;
    let jid = data.whatsapp_group_jid || null;

    // If the group belongs to a community, create it in WhatsApp and link it
    // to the community's WhatsApp group so it appears there immediately.
    if (data.community_id) {
      const [community] = await db
        .select({ whatsappCommunityId: communities.whatsappCommunityId })
        .from(communities)
        .where(eq(communities.id, data.community_id))
        .limit(1);

      if (!community?.whatsappCommunityId) {
        throw new Error('Community not synced to WhatsApp. Sync the community first.');
      }

      if (!jid) {
        const created = await EvolutionService.createGroup(instanceName, data.name, []);
        jid = (created as any)?.jid || (created as any)?.JID || null;
        if (!jid) {
          throw new Error('Failed to create group on WhatsApp');
        }
      }

      await this.linkToCommunityWithRetry(instanceName, community.whatsappCommunityId, jid);
    }

    if (!jid) {
      throw new Error('WhatsApp group JID is required');
    }

    const [row] = await db
      .insert(groups)
      .values({
        whatsappGroupJid: jid,
        name: data.name,
        communityId: data.community_id || null,
        description: data.description || null,
        groupType: data.group_type || 'regular',
        assignedAdminId: data.assigned_admin_id || null,
        aiEnabled: data.ai_enabled ?? true,
        autoWelcome: data.auto_welcome ?? true,
        autoFaq: data.auto_faq ?? true,
        autoModeration: data.auto_moderation ?? true,
        maxMembers: data.max_members || null,
      })
      .returning();

    return this.formatGroup(row);
  }

  // Link a group to a WhatsApp community, retrying on rate-limit/timeout
  // and verifying the link actually took effect before returning.
  private static async linkToCommunityWithRetry(
    instanceName: string,
    communityJid: string,
    groupJid: string,
    attempts = 5
  ): Promise<void> {
    let lastError: string | null = null;

    for (let i = 1; i <= attempts; i++) {
      try {
        const result = (await EvolutionService.addGroupsToCommunity(
          instanceName,
          communityJid,
          [groupJid]
        )) as any;

        const failed = Array.isArray(result?.failed) ? result.failed : [];
        if (result === null) {
          throw new Error('no response from evolution');
        }
        if (failed.includes(groupJid)) {
          throw new Error('reported as failed by evolution');
        }

        // Verify the group is actually linked to this community before moving on.
        const info = (await EvolutionService.findGroupInfo(instanceName, groupJid)) as any;
        const linkedTo = info?.LinkedParentJID || info?.linkedParentJID || null;
        if (linkedTo === communityJid) {
          return;
        }

        throw new Error(`link not reflected yet (linkedTo=${linkedTo})`);
      } catch (error: any) {
        lastError = error.message;
        logger.warn(
          `Link group ${groupJid} to community ${communityJid} attempt ${i}/${attempts} failed: ${error.message}`
        );
        if (i < attempts) {
          await new Promise((resolve) => setTimeout(resolve, 3000 * i));
        }
      }
    }

    throw new Error(
      `Group created but failed to link it to the community on WhatsApp after ${attempts} attempts: ${lastError}`
    );
  }

  static async update(
    id: string,
    data: {
      community_id?: string | null;
      name?: string;
      description?: string | null;
      group_type?: string;
      assigned_admin_id?: string | null;
      ai_enabled?: boolean;
      auto_welcome?: boolean;
      auto_faq?: boolean;
      auto_moderation?: boolean;
      max_members?: number | null;
      status?: string;
    }
  ) {
    const updatePayload: any = { updatedAt: new Date() };

    if (data.community_id !== undefined) updatePayload.communityId = data.community_id;
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.group_type !== undefined) updatePayload.groupType = data.group_type;
    if (data.assigned_admin_id !== undefined) updatePayload.assignedAdminId = data.assigned_admin_id;
    if (data.ai_enabled !== undefined) updatePayload.aiEnabled = data.ai_enabled;
    if (data.auto_welcome !== undefined) updatePayload.autoWelcome = data.auto_welcome;
    if (data.auto_faq !== undefined) updatePayload.autoFaq = data.auto_faq;
    if (data.auto_moderation !== undefined) updatePayload.autoModeration = data.auto_moderation;
    if (data.max_members !== undefined) updatePayload.maxMembers = data.max_members;
    if (data.status !== undefined) updatePayload.status = data.status;

    const [row] = await db
      .update(groups)
      .set(updatePayload)
      .where(eq(groups.id, id))
      .returning();

    return row ? this.formatGroup(row) : null;
  }

  static async getMembers(groupId: string) {
    const rows = await db
      .select({
        id: groupMembers.id,
        member_id: members.id,
        member_name: members.displayName,
        phone_number: members.whatsappNumber,
        role: groupMembers.role,
        joined_at: groupMembers.joinedAt,
        warning_count: members.warningCount,
      })
      .from(groupMembers)
      .innerJoin(members, eq(groupMembers.memberId, members.id))
      .where(eq(groupMembers.groupId, groupId));

    return rows.map((r) => ({
      id: r.id,
      group_id: groupId,
      member_id: r.member_id,
      member_name: r.member_name || r.phone_number,
      phone_number: r.phone_number,
      onboarded: false,
      role: r.role || 'member',
      joined_at: r.joined_at ? r.joined_at.toISOString() : new Date().toISOString(),
      warning_count: r.warning_count || 0,
    }));
  }

  // Pull participants of a group from WhatsApp and upsert them into PostgreSQL.
  // The WhatsApp JID/LID is stored as-is on members.external_id (doc rule: keep
  // the external identifier verbatim). whatsapp_number is derived by stripping
  // the @s.whatsapp.net server suffix. Members that are no longer in the group
  // are marked inactive (status='inactive', left_at set) instead of deleted.
  static async syncParticipants(groupId: string, instanceName: string) {
    const [group] = await db
      .select({ id: groups.id, whatsappGroupJid: groups.whatsappGroupJid, name: groups.name })
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!group) throw new Error('Group not found');
    if (!group.whatsappGroupJid) throw new Error('Group has no WhatsApp JID');

    const info = (await EvolutionService.getParticipants(
      instanceName,
      group.whatsappGroupJid
    )) as any;
    const participants: any[] = Array.isArray(info?.Participants) ? info.Participants : [];

    logger.info(`[sync] syncParticipants: group="${group.name}" jid=${group.whatsappGroupJid} participants=${participants.length}`);

    const created: string[] = [];
    const updated: string[] = [];
    const memberIds: string[] = [];

    for (const participant of participants) {
      const externalId =
        participant?.JID || participant?.LID || participant?.PhoneNumber || '';
      if (!externalId) continue;

      const phone =
        this.normalizePhone(participant?.PhoneNumber) ||
        this.normalizePhone(externalId) ||
        externalId;
      const displayName = participant?.DisplayName || '';
      const isAdmin = participant?.IsAdmin || participant?.IsSuperAdmin || false;

      let memberId: string | null = null;
      const byExternal = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.externalId, externalId))
        .limit(1);

      if (byExternal[0]) {
        memberId = byExternal[0].id;
        await this.updateSyncedMember(memberId, displayName, phone);
        updated.push(externalId);
      } else {
        const byPhone = await db
          .select({ id: members.id })
          .from(members)
          .where(eq(members.whatsappNumber, phone))
          .limit(1);
        if (byPhone[0]) {
          memberId = byPhone[0].id;
          await db
            .update(members)
            .set({ externalId, updatedAt: new Date() })
            .where(eq(members.id, memberId));
          await this.updateSyncedMember(memberId, displayName, phone);
          updated.push(externalId);
        } else {
          const [row] = await db
            .insert(members)
            .values({
              externalId,
              whatsappNumber: phone,
              displayName: displayName || null,
              phone: phone || null,
            })
            .returning();
          memberId = row.id;
          created.push(externalId);
        }
      }

      if (!memberId) continue;
      memberIds.push(memberId);
      await this.upsertGroupMember(groupId, memberId, isAdmin ? 'admin' : 'member');
    }

    let deactivated = 0;
    const activeRows = await db
      .select({
        id: groupMembers.id,
        memberId: groupMembers.memberId,
        status: groupMembers.status,
      })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));

    const activeSet = new Set(memberIds);
    for (const gm of activeRows) {
      if (gm.status === 'inactive') continue;
      if (!gm.memberId || !activeSet.has(gm.memberId)) {
        await db
          .update(groupMembers)
          .set({ status: 'inactive', leftAt: new Date(), syncedAt: new Date() })
          .where(eq(groupMembers.id, gm.id));
        deactivated++;
      }
    }

    // Keep the cached member count on the group fresh.
    await db
      .update(groups)
      .set({ memberCount: participants.length, updatedAt: new Date() })
      .where(eq(groups.id, groupId));

    return {
      group_id: groupId,
      instance: instanceName,
      found: participants.length,
      created: created.length,
      updated: updated.length,
      deactivated,
      member_ids: memberIds,
      synced_at: new Date().toISOString(),
    };
  }

  private static normalizePhone(value?: string): string | null {
    if (!value) return null;
    return value.replace(/@s\.whatsapp\.net$/, '');
  }

  private static async updateSyncedMember(memberId: string, displayName: string, phone: string) {
    const updateData: any = { status: 'active', updatedAt: new Date() };
    if (displayName) updateData.displayName = displayName;
    if (phone) updateData.phone = phone;
    await db.update(members).set(updateData).where(eq(members.id, memberId));
  }

  private static async upsertGroupMember(groupId: string, memberId: string, role: string) {
    const existing = await db
      .select({ id: groupMembers.id, status: groupMembers.status })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, memberId)))
      .limit(1);

    let isNewJoined = false;

    if (existing[0]) {
      await db
        .update(groupMembers)
        .set({ role, status: 'active', leftAt: null, syncedAt: new Date() })
        .where(eq(groupMembers.id, existing[0].id));
        
      if (existing[0].status === 'inactive') {
        isNewJoined = true;
      }
    } else {
      await db.insert(groupMembers).values({
        groupId,
        memberId,
        role,
        status: 'active',
        syncedAt: new Date(),
      });
      isNewJoined = true;
    }

    if (isNewJoined) {
      logger.info(`[sync] New member detected in group ${groupId}: memberId=${memberId}, triggering n8n...`);
      // Trigger n8n Onboarding Workflow for newly polled members
      const { env } = await import('../../config/env.js');
      if (env.N8N_WEBHOOK_URL) {
        try {
          const group = await db.query.groups.findFirst({ where: eq(groups.id, groupId) });
          const member = await db.query.members.findFirst({ where: eq(members.id, memberId) });
          if (group && member && group.autoWelcome && group.groupType !== 'announcement') {
            logger.info(`[sync] Sending to n8n: group="${group.name}" member="${member.displayName || member.whatsappNumber}"`);
            const response = await fetch(env.N8N_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'participant.joined',
                instanceName: env.EVOLUTION_DEFAULT_INSTANCE || 'wahub-main',
                group: {
                  id: group.id,
                  name: group.name,
                  jid: group.whatsappGroupJid,
                  autoWelcome: group.autoWelcome,
                  rules: group.description || '',
                },
                member: {
                  id: member.id,
                  phone: member.whatsappNumber,
                  name: member.displayName || member.whatsappNumber,
                  onboardingStatus: member.onboardingStatus || 'pending',
                },
              }),
            });
            if (response.ok) {
              logger.info(`[sync] n8n webhook triggered successfully from sync`);
            } else {
              logger.error(`[sync] n8n webhook responded with status ${response.status} from sync`);
            }
          }
        } catch (err) {
          logger.error('Failed to trigger n8n webhook from sync', err);
        }
      }
    }
  }

  static async getMetrics(groupId: string) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!group) return null;

    const memberCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));

    const messagesThisWeekRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatLogs)
      .where(
        sql`${chatLogs.groupId} = ${groupId} AND ${chatLogs.sentAt} >= ${oneWeekAgo.toISOString()}`
      );

    const activeMembersRes = await db
      .select({ count: sql<number>`count(distinct ${chatLogs.memberId})` })
      .from(chatLogs)
      .where(
        sql`${chatLogs.groupId} = ${groupId} AND ${chatLogs.sentAt} >= ${oneWeekAgo.toISOString()}`
      );

    const aiResponsesRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatLogs)
      .where(
        sql`${chatLogs.groupId} = ${groupId} AND ${chatLogs.isFromAi} = true AND ${chatLogs.sentAt} >= CURRENT_DATE`
      );

    const moderationActionsRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(moderationAlerts)
      .where(
        sql`${moderationAlerts.groupId} = ${groupId} AND ${moderationAlerts.createdAt} >= CURRENT_DATE`
      );

    return {
      total_members: Number(memberCountRes[0]?.count || group.memberCount || 0),
      messages_today: group.messageCountToday || 0,
      messages_this_week: Number(messagesThisWeekRes[0]?.count || 0),
      active_members: Number(activeMembersRes[0]?.count || 0),
      ai_responses_today: Number(aiResponsesRes[0]?.count || 0),
      moderation_actions_today: Number(moderationActionsRes[0]?.count || 0),
    };
  }

  static async pauseAi(groupId: string, minutes: number) {
    const pausedUntil = new Date(Date.now() + minutes * 60 * 1000);
    const [row] = await db
      .update(groups)
      .set({
        aiEnabled: false,
        aiPausedUntil: pausedUntil,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId))
      .returning();

    return row ? this.formatGroup(row) : null;
  }

  static async resumeAi(groupId: string) {
    const [row] = await db
      .update(groups)
      .set({
        aiEnabled: true,
        aiPausedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId))
      .returning();

    return row ? this.formatGroup(row) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const [row] = await db
      .update(groups)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return !!row;
  }

  // Pull groups from WhatsApp and upsert them into PostgreSQL.
  // External id (whatsapp_group_jid) is the unique key. A group is linked to a
  // community via WhatsApp's LinkedParentJID -> communities.whatsapp_community_id.
  // Only groups that belong to a Wahub-managed community are synced; standalone
  // groups are ignored. Groups that previously existed but no longer appear on
  // WhatsApp are marked inactive instead of being deleted.
  static async syncFromWhatsApp(instanceName: string) {
    const waGroups = (await EvolutionService.fetchGroups(instanceName)) || [];

    // Cache DB communities by their WhatsApp JID for parent linkage.
    const dbCommunities = await db
      .select({
        id: communities.id,
        whatsappCommunityId: communities.whatsappCommunityId,
        status: communities.status,
      })
      .from(communities);
    const communityByJid = new Map<string, string>();
    for (const c of dbCommunities) {
      if (c.whatsappCommunityId) communityByJid.set(c.whatsappCommunityId, c.id);
    }

    const created: string[] = [];
    const updated: string[] = [];
    const linked: string[] = [];
    const activeJids: string[] = [];

    for (const item of waGroups) {
      if (item?.IsParent) continue; // communities, not groups

      const jid = item?.JID || item?.jid || item?.id || '';
      if (!jid || !/@g\.us$/.test(jid)) continue;

      const parentJid = item?.LinkedParentJID || item?.linkedParentJID || '';
      const communityId = parentJid && communityByJid.get(parentJid) ? communityByJid.get(parentJid)! : null;

      // Only sync groups that belong to a community managed by Wahub.
      if (!communityId) continue;

      const name = item?.Name || item?.name || jid;
      const description = item?.Topic || item?.topic || null;
      const isActive = item?.Suspended === undefined ? true : !item.Suspended;
      activeJids.push(jid);

      const existing = await db
        .select({ id: groups.id })
        .from(groups)
        .where(eq(groups.whatsappGroupJid, jid))
        .limit(1);

      if (existing[0]) {
        // Only update if group is already active; don't reactivate inactive ones
        const currentGroup = await db
          .select({ status: groups.status })
          .from(groups)
          .where(eq(groups.id, existing[0].id))
          .limit(1);

        if (currentGroup[0]?.status === 'inactive') {
          logger.info(`[sync] Skipping inactive group "${name}" (${jid}) — not reactivating`);
          continue;
        }

        // Only sync name, description, and communityId — never change status via reconciliation
        // Status should only be changed by admin action
        await db
          .update(groups)
          .set({
            name,
            description,
            communityId,
            updatedAt: new Date(),
          })
          .where(eq(groups.id, existing[0].id));
        updated.push(jid);
      } else {
        // Auto-create disabled: groups must be created manually or via community setup
        logger.info(`[sync] Skipping group "${name}" (${jid}) — not found in DB, auto-create disabled`);
      }

      if (communityId) linked.push(jid);
    }

    // Automatic deactivation disabled: reconciliation cron should never change group status to inactive.
    // Status can only be changed manually by admin.
    const deactivated = 0;

    return {
      instance: instanceName,
      found: activeJids.length,
      created: created.length,
      updated: updated.length,
      deactivated,
      linked: linked.length,
      created_ids: created,
      updated_ids: updated,
      linked_ids: linked,
      synced_at: new Date().toISOString(),
    };
  }

  static async getGroupMessages(
    groupId: string,
    options: {
      page: number;
      limit: number;
      direction?: string;
      type?: string;
    }
  ) {
    const { page, limit, direction, type } = options;
    const offset = (page - 1) * limit;

    const conditions = [eq(chatLogs.groupId, groupId)];
    if (direction === 'inbound' || direction === 'outbound') {
      conditions.push(eq(chatLogs.direction, direction));
    }
    if (type) {
      conditions.push(eq(chatLogs.messageType, type as any));
    }

    const whereClause = and(...conditions);

    const countResult = await db
      .select({ total: sql<number>`count(*)` })
      .from(chatLogs)
      .where(whereClause);

    const total = Number(countResult[0]?.total || 0);

    const rows = await db
      .select({
        log: chatLogs,
        memberId: members.id,
        memberName: members.displayName,
        memberPhone: members.whatsappNumber,
      })
      .from(chatLogs)
      .leftJoin(members, eq(chatLogs.memberId, members.id))
      .where(whereClause)
      .orderBy(desc(chatLogs.sentAt))
      .limit(limit)
      .offset(offset);

    const data = rows.map((r) => ({
      id: r.log.id,
      groupId: r.log.groupId,
      sender: {
        id: r.memberId || null,
        name: r.memberName || r.memberPhone || 'System',
      },
      direction: r.log.direction,
      type: r.log.messageType || 'text',
      text: r.log.content || '',
      mediaUrl: r.log.mediaUrl || null,
      receivedAt: r.log.sentAt
        ? r.log.sentAt.toISOString()
        : r.log.createdAt
          ? r.log.createdAt.toISOString()
          : new Date().toISOString(),
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  static async sendGroupMessage(
    groupId: string,
    data: {
      type?: 'text' | 'image' | 'video' | 'document' | 'audio';
      text: string;
      media_url?: string;
      instance_name?: string;
    },
    _adminId?: string
  ) {
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!group) {
      throw new Error('Group not found');
    }

    if (group.status === 'inactive') {
      throw new Error('Cannot send message to inactive group');
    }

    const instanceName = data.instance_name || env.EVOLUTION_DEFAULT_INSTANCE;
    const messageType = data.type || 'text';
    let result: any = null;

    if (messageType === 'text') {
      result = await EvolutionService.sendText(
        instanceName,
        group.whatsappGroupJid,
        data.text,
        1000 // 1s delay for safety / anti-ban
      );
    } else if (data.media_url) {
      result = await EvolutionService.sendMedia(
        instanceName,
        group.whatsappGroupJid,
        messageType,
        data.media_url,
        data.text
      );
    } else {
      throw new Error('media_url is required for media message types');
    }

    const externalMsgId = result?.id || result?.key?.id || result?.ID || null;

    // Record outbound message in chatLogs
    const [chatLog] = await db
      .insert(chatLogs)
      .values({
        groupId: group.id,
        memberId: null,
        whatsappMsgId: externalMsgId,
        direction: 'outbound',
        content: data.text,
        messageType,
        mediaUrl: data.media_url || null,
        isFromAi: false,
        sentAt: new Date(),
      })
      .returning();

    // Increment group messageCountToday
    await db
      .update(groups)
      .set({
        messageCountToday: sql`${groups.messageCountToday} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, group.id));

    return {
      id: chatLog.id,
      groupId: group.id,
      whatsappMsgId: externalMsgId,
      direction: 'outbound',
      type: messageType,
      text: data.text,
      mediaUrl: data.media_url || null,
      sentAt: chatLog.sentAt ? chatLog.sentAt.toISOString() : new Date().toISOString(),
    };
  }
}


