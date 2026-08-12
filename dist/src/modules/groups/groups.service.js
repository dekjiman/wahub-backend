"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const evolution_service_js_1 = require("../../services/evolution.service.js");
const env_js_1 = require("../../config/env.js");
const logger_js_1 = require("../../utils/logger.js");
class GroupsService {
    static formatGroup(row, adminName) {
        return {
            id: row.id,
            community_id: row.communityId,
            whatsapp_group_jid: row.whatsappGroupJid,
            name: row.name,
            description: row.description,
            group_type: (row.groupType || 'regular'),
            assigned_admin_id: row.assignedAdminId || null,
            assigned_admin_name: adminName || null,
            ai_enabled: row.aiEnabled ?? true,
            ai_paused_until: row.aiPausedUntil ? row.aiPausedUntil.toISOString() : null,
            auto_welcome: row.autoWelcome ?? true,
            auto_faq: row.autoFaq ?? true,
            auto_moderation: row.autoModeration ?? true,
            member_count: row.memberCount || 0,
            message_count_today: row.messageCountToday || 0,
            status: (row.status || 'active'),
        };
    }
    static async list() {
        const rows = await database_js_1.db
            .select({
            group: schema_js_1.groups,
            adminName: schema_js_1.admins.name,
        })
            .from(schema_js_1.groups)
            .leftJoin(schema_js_1.admins, (0, drizzle_orm_1.eq)(schema_js_1.groups.assignedAdminId, schema_js_1.admins.id));
        return rows.map((r) => this.formatGroup(r.group, r.adminName ?? undefined));
    }
    static async getById(id) {
        const rows = await database_js_1.db
            .select({
            group: schema_js_1.groups,
            adminName: schema_js_1.admins.name,
        })
            .from(schema_js_1.groups)
            .leftJoin(schema_js_1.admins, (0, drizzle_orm_1.eq)(schema_js_1.groups.assignedAdminId, schema_js_1.admins.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, id))
            .limit(1);
        const row = rows[0];
        return row ? this.formatGroup(row.group, row.adminName ?? undefined) : null;
    }
    static async create(data) {
        const instanceName = data.instance_name || env_js_1.env.EVOLUTION_DEFAULT_INSTANCE;
        let jid = data.whatsapp_group_jid || null;
        // If the group belongs to a community, create it in WhatsApp and link it
        // to the community's WhatsApp group so it appears there immediately.
        if (data.community_id) {
            const [community] = await database_js_1.db
                .select({ whatsappCommunityId: schema_js_1.communities.whatsappCommunityId })
                .from(schema_js_1.communities)
                .where((0, drizzle_orm_1.eq)(schema_js_1.communities.id, data.community_id))
                .limit(1);
            if (!community?.whatsappCommunityId) {
                throw new Error('Community not synced to WhatsApp. Sync the community first.');
            }
            if (!jid) {
                const created = await evolution_service_js_1.EvolutionService.createGroup(instanceName, data.name, []);
                jid = created?.jid || created?.JID || null;
                if (!jid) {
                    throw new Error('Failed to create group on WhatsApp');
                }
            }
            await this.linkToCommunityWithRetry(instanceName, community.whatsappCommunityId, jid);
        }
        if (!jid) {
            throw new Error('WhatsApp group JID is required');
        }
        const [row] = await database_js_1.db
            .insert(schema_js_1.groups)
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
    static async linkToCommunityWithRetry(instanceName, communityJid, groupJid, attempts = 5) {
        let lastError = null;
        for (let i = 1; i <= attempts; i++) {
            try {
                const result = (await evolution_service_js_1.EvolutionService.addGroupsToCommunity(instanceName, communityJid, [groupJid]));
                const failed = Array.isArray(result?.failed) ? result.failed : [];
                if (result === null) {
                    throw new Error('no response from evolution');
                }
                if (failed.includes(groupJid)) {
                    throw new Error('reported as failed by evolution');
                }
                // Verify the group is actually linked to this community before moving on.
                const info = (await evolution_service_js_1.EvolutionService.findGroupInfo(instanceName, groupJid));
                const linkedTo = info?.LinkedParentJID || info?.linkedParentJID || null;
                if (linkedTo === communityJid) {
                    return;
                }
                throw new Error(`link not reflected yet (linkedTo=${linkedTo})`);
            }
            catch (error) {
                lastError = error.message;
                logger_js_1.logger.warn(`Link group ${groupJid} to community ${communityJid} attempt ${i}/${attempts} failed: ${error.message}`);
                if (i < attempts) {
                    await new Promise((resolve) => setTimeout(resolve, 3000 * i));
                }
            }
        }
        throw new Error(`Group created but failed to link it to the community on WhatsApp after ${attempts} attempts: ${lastError}`);
    }
    static async update(id, data) {
        const updatePayload = { updatedAt: new Date() };
        if (data.community_id !== undefined)
            updatePayload.communityId = data.community_id;
        if (data.name !== undefined)
            updatePayload.name = data.name;
        if (data.description !== undefined)
            updatePayload.description = data.description;
        if (data.group_type !== undefined)
            updatePayload.groupType = data.group_type;
        if (data.assigned_admin_id !== undefined)
            updatePayload.assignedAdminId = data.assigned_admin_id;
        if (data.ai_enabled !== undefined)
            updatePayload.aiEnabled = data.ai_enabled;
        if (data.auto_welcome !== undefined)
            updatePayload.autoWelcome = data.auto_welcome;
        if (data.auto_faq !== undefined)
            updatePayload.autoFaq = data.auto_faq;
        if (data.auto_moderation !== undefined)
            updatePayload.autoModeration = data.auto_moderation;
        if (data.max_members !== undefined)
            updatePayload.maxMembers = data.max_members;
        if (data.status !== undefined)
            updatePayload.status = data.status;
        const [row] = await database_js_1.db
            .update(schema_js_1.groups)
            .set(updatePayload)
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, id))
            .returning();
        return row ? this.formatGroup(row) : null;
    }
    static async getMembers(groupId) {
        const rows = await database_js_1.db
            .select({
            id: schema_js_1.groupMembers.id,
            member_id: schema_js_1.members.id,
            member_name: schema_js_1.members.displayName,
            phone_number: schema_js_1.members.whatsappNumber,
            role: schema_js_1.groupMembers.role,
            joined_at: schema_js_1.groupMembers.joinedAt,
            warning_count: schema_js_1.members.warningCount,
        })
            .from(schema_js_1.groupMembers)
            .innerJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.groupMembers.memberId, schema_js_1.members.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.groupMembers.groupId, groupId));
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
    static async syncParticipants(groupId, instanceName) {
        const [group] = await database_js_1.db
            .select({ id: schema_js_1.groups.id, whatsappGroupJid: schema_js_1.groups.whatsappGroupJid })
            .from(schema_js_1.groups)
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, groupId))
            .limit(1);
        if (!group)
            throw new Error('Group not found');
        if (!group.whatsappGroupJid)
            throw new Error('Group has no WhatsApp JID');
        const info = (await evolution_service_js_1.EvolutionService.getParticipants(instanceName, group.whatsappGroupJid));
        const participants = Array.isArray(info?.Participants) ? info.Participants : [];
        const created = [];
        const updated = [];
        const memberIds = [];
        for (const participant of participants) {
            const externalId = participant?.JID || participant?.LID || participant?.PhoneNumber || '';
            if (!externalId)
                continue;
            const phone = this.normalizePhone(participant?.PhoneNumber) ||
                this.normalizePhone(externalId) ||
                externalId;
            const displayName = participant?.DisplayName || '';
            const isAdmin = participant?.IsAdmin || participant?.IsSuperAdmin || false;
            let memberId = null;
            const byExternal = await database_js_1.db
                .select({ id: schema_js_1.members.id })
                .from(schema_js_1.members)
                .where((0, drizzle_orm_1.eq)(schema_js_1.members.externalId, externalId))
                .limit(1);
            if (byExternal[0]) {
                memberId = byExternal[0].id;
                await this.updateSyncedMember(memberId, displayName, phone);
                updated.push(externalId);
            }
            else {
                const byPhone = await database_js_1.db
                    .select({ id: schema_js_1.members.id })
                    .from(schema_js_1.members)
                    .where((0, drizzle_orm_1.eq)(schema_js_1.members.whatsappNumber, phone))
                    .limit(1);
                if (byPhone[0]) {
                    memberId = byPhone[0].id;
                    await database_js_1.db
                        .update(schema_js_1.members)
                        .set({ externalId, updatedAt: new Date() })
                        .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, memberId));
                    await this.updateSyncedMember(memberId, displayName, phone);
                    updated.push(externalId);
                }
                else {
                    const [row] = await database_js_1.db
                        .insert(schema_js_1.members)
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
            if (!memberId)
                continue;
            memberIds.push(memberId);
            await this.upsertGroupMember(groupId, memberId, isAdmin ? 'admin' : 'member');
        }
        let deactivated = 0;
        const activeRows = await database_js_1.db
            .select({
            id: schema_js_1.groupMembers.id,
            memberId: schema_js_1.groupMembers.memberId,
            status: schema_js_1.groupMembers.status,
        })
            .from(schema_js_1.groupMembers)
            .where((0, drizzle_orm_1.eq)(schema_js_1.groupMembers.groupId, groupId));
        const activeSet = new Set(memberIds);
        for (const gm of activeRows) {
            if (gm.status === 'inactive')
                continue;
            if (!gm.memberId || !activeSet.has(gm.memberId)) {
                await database_js_1.db
                    .update(schema_js_1.groupMembers)
                    .set({ status: 'inactive', leftAt: new Date(), syncedAt: new Date() })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.groupMembers.id, gm.id));
                deactivated++;
            }
        }
        // Keep the cached member count on the group fresh.
        await database_js_1.db
            .update(schema_js_1.groups)
            .set({ memberCount: participants.length, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, groupId));
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
    static normalizePhone(value) {
        if (!value)
            return null;
        return value.replace(/@s\.whatsapp\.net$/, '');
    }
    static async updateSyncedMember(memberId, displayName, phone) {
        const updateData = { status: 'active', updatedAt: new Date() };
        if (displayName)
            updateData.displayName = displayName;
        if (phone)
            updateData.phone = phone;
        await database_js_1.db.update(schema_js_1.members).set(updateData).where((0, drizzle_orm_1.eq)(schema_js_1.members.id, memberId));
    }
    static async upsertGroupMember(groupId, memberId, role) {
        const existing = await database_js_1.db
            .select({ id: schema_js_1.groupMembers.id, status: schema_js_1.groupMembers.status })
            .from(schema_js_1.groupMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.groupMembers.groupId, groupId), (0, drizzle_orm_1.eq)(schema_js_1.groupMembers.memberId, memberId)))
            .limit(1);
        let isNewJoined = false;
        if (existing[0]) {
            await database_js_1.db
                .update(schema_js_1.groupMembers)
                .set({ role, status: 'active', leftAt: null, syncedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_js_1.groupMembers.id, existing[0].id));
            if (existing[0].status === 'inactive') {
                isNewJoined = true;
            }
        }
        else {
            await database_js_1.db.insert(schema_js_1.groupMembers).values({
                groupId,
                memberId,
                role,
                status: 'active',
                syncedAt: new Date(),
            });
            isNewJoined = true;
        }
        if (isNewJoined) {
            // Trigger n8n Onboarding Workflow for newly polled members
            const { env } = await import('../../config/env.js');
            if (env.N8N_WEBHOOK_URL) {
                try {
                    const group = await database_js_1.db.query.groups.findFirst({ where: (0, drizzle_orm_1.eq)(schema_js_1.groups.id, groupId) });
                    const member = await database_js_1.db.query.members.findFirst({ where: (0, drizzle_orm_1.eq)(schema_js_1.members.id, memberId) });
                    if (group && member) {
                        fetch(env.N8N_WEBHOOK_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                event: 'participant.joined',
                                instanceName: 'wahub-main',
                                group: {
                                    id: group.id,
                                    name: group.name,
                                    jid: group.whatsappGroupJid,
                                    autoWelcome: group.autoWelcome,
                                },
                                member: {
                                    id: member.id,
                                    phone: member.whatsappNumber,
                                    name: member.displayName || member.whatsappNumber,
                                },
                            }),
                        }).catch((err) => logger_js_1.logger.error('Failed to trigger n8n webhook from sync', err));
                    }
                }
                catch (err) {
                    logger_js_1.logger.error('Failed to trigger n8n webhook from sync', err);
                }
            }
        }
    }
    static async getMetrics(groupId) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const group = await database_js_1.db.query.groups.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.groups.id, groupId),
        });
        if (!group)
            return null;
        const memberCountRes = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.groupMembers)
            .where((0, drizzle_orm_1.eq)(schema_js_1.groupMembers.groupId, groupId));
        const messagesThisWeekRes = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.chatLogs)
            .where((0, drizzle_orm_1.sql) `${schema_js_1.chatLogs.groupId} = ${groupId} AND ${schema_js_1.chatLogs.sentAt} >= ${oneWeekAgo.toISOString()}`);
        const activeMembersRes = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(distinct ${schema_js_1.chatLogs.memberId})` })
            .from(schema_js_1.chatLogs)
            .where((0, drizzle_orm_1.sql) `${schema_js_1.chatLogs.groupId} = ${groupId} AND ${schema_js_1.chatLogs.sentAt} >= ${oneWeekAgo.toISOString()}`);
        const aiResponsesRes = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.chatLogs)
            .where((0, drizzle_orm_1.sql) `${schema_js_1.chatLogs.groupId} = ${groupId} AND ${schema_js_1.chatLogs.isFromAi} = true AND ${schema_js_1.chatLogs.sentAt} >= CURRENT_DATE`);
        const moderationActionsRes = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.moderationAlerts)
            .where((0, drizzle_orm_1.sql) `${schema_js_1.moderationAlerts.groupId} = ${groupId} AND ${schema_js_1.moderationAlerts.createdAt} >= CURRENT_DATE`);
        return {
            total_members: Number(memberCountRes[0]?.count || group.memberCount || 0),
            messages_today: group.messageCountToday || 0,
            messages_this_week: Number(messagesThisWeekRes[0]?.count || 0),
            active_members: Number(activeMembersRes[0]?.count || 0),
            ai_responses_today: Number(aiResponsesRes[0]?.count || 0),
            moderation_actions_today: Number(moderationActionsRes[0]?.count || 0),
        };
    }
    static async pauseAi(groupId, minutes) {
        const pausedUntil = new Date(Date.now() + minutes * 60 * 1000);
        const [row] = await database_js_1.db
            .update(schema_js_1.groups)
            .set({
            aiEnabled: false,
            aiPausedUntil: pausedUntil,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, groupId))
            .returning();
        return row ? this.formatGroup(row) : null;
    }
    static async resumeAi(groupId) {
        const [row] = await database_js_1.db
            .update(schema_js_1.groups)
            .set({
            aiEnabled: true,
            aiPausedUntil: null,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, groupId))
            .returning();
        return row ? this.formatGroup(row) : null;
    }
    static async delete(id) {
        const [row] = await database_js_1.db
            .update(schema_js_1.groups)
            .set({ status: 'inactive', updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, id))
            .returning();
        return !!row;
    }
    // Pull groups from WhatsApp and upsert them into PostgreSQL.
    // External id (whatsapp_group_jid) is the unique key. A group is linked to a
    // community via WhatsApp's LinkedParentJID -> communities.whatsapp_community_id.
    // Only groups that belong to a Wahub-managed community are synced; standalone
    // groups are ignored. Groups that previously existed but no longer appear on
    // WhatsApp are marked inactive instead of being deleted.
    static async syncFromWhatsApp(instanceName) {
        const waGroups = (await evolution_service_js_1.EvolutionService.fetchGroups(instanceName)) || [];
        // Cache DB communities by their WhatsApp JID for parent linkage.
        const dbCommunities = await database_js_1.db
            .select({
            id: schema_js_1.communities.id,
            whatsappCommunityId: schema_js_1.communities.whatsappCommunityId,
            status: schema_js_1.communities.status,
        })
            .from(schema_js_1.communities);
        const communityByJid = new Map();
        for (const c of dbCommunities) {
            if (c.whatsappCommunityId)
                communityByJid.set(c.whatsappCommunityId, c.id);
        }
        const created = [];
        const updated = [];
        const linked = [];
        const activeJids = [];
        for (const item of waGroups) {
            if (item?.IsParent)
                continue; // communities, not groups
            const jid = item?.JID || item?.jid || item?.id || '';
            if (!jid || !/@g\.us$/.test(jid))
                continue;
            const parentJid = item?.LinkedParentJID || item?.linkedParentJID || '';
            const communityId = parentJid && communityByJid.get(parentJid) ? communityByJid.get(parentJid) : null;
            // Only sync groups that belong to a community managed by Wahub.
            if (!communityId)
                continue;
            const name = item?.Name || item?.name || jid;
            const description = item?.Topic || item?.topic || null;
            const isActive = item?.Suspended === undefined ? true : !item.Suspended;
            activeJids.push(jid);
            const existing = await database_js_1.db
                .select({ id: schema_js_1.groups.id })
                .from(schema_js_1.groups)
                .where((0, drizzle_orm_1.eq)(schema_js_1.groups.whatsappGroupJid, jid))
                .limit(1);
            if (existing[0]) {
                await database_js_1.db
                    .update(schema_js_1.groups)
                    .set({
                    name,
                    description,
                    communityId,
                    status: isActive ? 'active' : 'inactive',
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, existing[0].id));
                updated.push(jid);
            }
            else {
                await database_js_1.db.insert(schema_js_1.groups).values({
                    whatsappGroupJid: jid,
                    name,
                    description,
                    communityId,
                    status: isActive ? 'active' : 'inactive',
                });
                created.push(jid);
            }
            if (communityId)
                linked.push(jid);
        }
        const activeSet = new Set(activeJids);
        let deactivated = 0;
        const dbGroups = await database_js_1.db
            .select({
            id: schema_js_1.groups.id,
            whatsappGroupJid: schema_js_1.groups.whatsappGroupJid,
            status: schema_js_1.groups.status,
        })
            .from(schema_js_1.groups);
        for (const row of dbGroups) {
            if (row.whatsappGroupJid &&
                /@g\.us$/.test(row.whatsappGroupJid) &&
                !activeSet.has(row.whatsappGroupJid) &&
                row.status !== 'inactive') {
                await database_js_1.db
                    .update(schema_js_1.groups)
                    .set({ status: 'inactive', updatedAt: new Date() })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, row.id));
                deactivated++;
            }
        }
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
    static async getGroupMessages(groupId, options) {
        const { page, limit, direction, type } = options;
        const offset = (page - 1) * limit;
        const conditions = [(0, drizzle_orm_1.eq)(schema_js_1.chatLogs.groupId, groupId)];
        if (direction === 'inbound' || direction === 'outbound') {
            conditions.push((0, drizzle_orm_1.eq)(schema_js_1.chatLogs.direction, direction));
        }
        if (type) {
            conditions.push((0, drizzle_orm_1.eq)(schema_js_1.chatLogs.messageType, type));
        }
        const whereClause = (0, drizzle_orm_1.and)(...conditions);
        const countResult = await database_js_1.db
            .select({ total: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.chatLogs)
            .where(whereClause);
        const total = Number(countResult[0]?.total || 0);
        const rows = await database_js_1.db
            .select({
            log: schema_js_1.chatLogs,
            memberId: schema_js_1.members.id,
            memberName: schema_js_1.members.displayName,
            memberPhone: schema_js_1.members.whatsappNumber,
        })
            .from(schema_js_1.chatLogs)
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.chatLogs.memberId, schema_js_1.members.id))
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema_js_1.chatLogs.sentAt))
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
    static async sendGroupMessage(groupId, data, _adminId) {
        const group = await database_js_1.db.query.groups.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.groups.id, groupId),
        });
        if (!group) {
            throw new Error('Group not found');
        }
        if (group.status === 'inactive') {
            throw new Error('Cannot send message to inactive group');
        }
        const instanceName = data.instance_name || env_js_1.env.EVOLUTION_DEFAULT_INSTANCE;
        const messageType = data.type || 'text';
        let result = null;
        if (messageType === 'text') {
            result = await evolution_service_js_1.EvolutionService.sendText(instanceName, group.whatsappGroupJid, data.text, 1000 // 1s delay for safety / anti-ban
            );
        }
        else if (data.media_url) {
            result = await evolution_service_js_1.EvolutionService.sendMedia(instanceName, group.whatsappGroupJid, messageType, data.media_url, data.text);
        }
        else {
            throw new Error('media_url is required for media message types');
        }
        const externalMsgId = result?.id || result?.key?.id || result?.ID || null;
        // Record outbound message in chatLogs
        const [chatLog] = await database_js_1.db
            .insert(schema_js_1.chatLogs)
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
        await database_js_1.db
            .update(schema_js_1.groups)
            .set({
            messageCountToday: (0, drizzle_orm_1.sql) `${schema_js_1.groups.messageCountToday} + 1`,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, group.id));
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
exports.GroupsService = GroupsService;
