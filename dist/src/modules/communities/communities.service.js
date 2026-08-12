"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunitiesService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const evolution_service_js_1 = require("../../services/evolution.service.js");
const env_js_1 = require("../../config/env.js");
class CommunitiesService {
    static async list() {
        const rows = await database_js_1.db
            .select({
            id: schema_js_1.communities.id,
            name: schema_js_1.communities.name,
            description: schema_js_1.communities.description,
            area: schema_js_1.communities.area,
            whatsapp_community_id: schema_js_1.communities.whatsappCommunityId,
            cover_image_url: schema_js_1.communities.coverImageUrl,
            assigned_admin_id: schema_js_1.communities.assignedAdminId,
            admin_name: schema_js_1.admins.name,
            status: schema_js_1.communities.status,
            group_count: (0, drizzle_orm_1.sql) `cast(count(${schema_js_1.groups.id}) as int)`,
        })
            .from(schema_js_1.communities)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.groups.communityId, schema_js_1.communities.id))
            .leftJoin(schema_js_1.admins, (0, drizzle_orm_1.eq)(schema_js_1.communities.assignedAdminId, schema_js_1.admins.id))
            .groupBy(schema_js_1.communities.id, schema_js_1.admins.name);
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            area: r.area,
            whatsapp_community_id: r.whatsapp_community_id,
            cover_image_url: r.cover_image_url,
            assigned_admin_id: r.assigned_admin_id || null,
            assigned_admin_name: r.admin_name || null,
            status: (r.status || 'active'),
            group_count: r.group_count || 0,
        }));
    }
    static async create(data) {
        const [row] = await database_js_1.db
            .insert(schema_js_1.communities)
            .values({
            name: data.name,
            description: data.description || null,
            area: data.area || null,
            whatsappCommunityId: data.whatsapp_community_id || null,
            coverImageUrl: data.cover_image_url || null,
            assignedAdminId: data.assigned_admin_id || null,
        })
            .returning();
        // Auto-sync community to WhatsApp so it appears there immediately.
        const instanceName = data.instance_name || env_js_1.env.EVOLUTION_DEFAULT_INSTANCE;
        let synced = null;
        try {
            synced = await this.syncToWhatsApp(row.id, instanceName, data.description || '', []);
        }
        catch (error) {
            // Rollback: community could not be created on WhatsApp, so don't keep it
            // in the DB either (otherwise it shows in Wahub but never in WhatsApp).
            await database_js_1.db
                .update(schema_js_1.communities)
                .set({ status: 'inactive', updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_js_1.communities.id, row.id));
            throw new Error(`Komunitas dibuat di Wahub tapi gagal sync ke WhatsApp (${instanceName}): ${error.message}`);
        }
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            area: row.area,
            whatsapp_community_id: synced?.whatsapp_community_id || row.whatsappCommunityId,
            cover_image_url: row.coverImageUrl,
            assigned_admin_id: row.assignedAdminId || null,
            assigned_admin_name: null,
            status: (row.status || 'active'),
            group_count: 0,
        };
    }
    static async getGroups(communityId) {
        const rows = await database_js_1.db
            .select()
            .from(schema_js_1.groups)
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.communityId, communityId));
        return rows.map((r) => ({
            id: r.id,
            community_id: r.communityId,
            whatsapp_group_jid: r.whatsappGroupJid,
            name: r.name,
            description: r.description,
            group_type: (r.groupType || 'regular'),
            assigned_admin_id: r.assignedAdminId || null,
            ai_enabled: r.aiEnabled ?? true,
            ai_paused_until: r.aiPausedUntil ? r.aiPausedUntil.toISOString() : null,
            auto_welcome: r.autoWelcome ?? true,
            auto_faq: r.autoFaq ?? true,
            auto_moderation: r.autoModeration ?? true,
            member_count: r.memberCount || 0,
            message_count_today: r.messageCountToday || 0,
            status: (r.status || 'active'),
        }));
    }
    static async getById(id) {
        const rows = await database_js_1.db
            .select({
            id: schema_js_1.communities.id,
            name: schema_js_1.communities.name,
            description: schema_js_1.communities.description,
            area: schema_js_1.communities.area,
            whatsapp_community_id: schema_js_1.communities.whatsappCommunityId,
            cover_image_url: schema_js_1.communities.coverImageUrl,
            assigned_admin_id: schema_js_1.communities.assignedAdminId,
            admin_name: schema_js_1.admins.name,
            status: schema_js_1.communities.status,
            created_at: schema_js_1.communities.createdAt,
            group_count: (0, drizzle_orm_1.sql) `cast(count(${schema_js_1.groups.id}) as int)`,
        })
            .from(schema_js_1.communities)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.groups.communityId, schema_js_1.communities.id))
            .leftJoin(schema_js_1.admins, (0, drizzle_orm_1.eq)(schema_js_1.communities.assignedAdminId, schema_js_1.admins.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.communities.id, id))
            .groupBy(schema_js_1.communities.id, schema_js_1.admins.name)
            .limit(1);
        const row = rows[0];
        if (!row)
            return null;
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            area: row.area,
            whatsapp_community_id: row.whatsapp_community_id,
            cover_image_url: row.cover_image_url,
            assigned_admin_id: row.assigned_admin_id || null,
            assigned_admin_name: row.admin_name || null,
            status: (row.status || 'active'),
            group_count: row.group_count || 0,
            created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
        };
    }
    static async update(id, data) {
        const updatePayload = { updatedAt: new Date() };
        if (data.name !== undefined)
            updatePayload.name = data.name;
        if (data.description !== undefined)
            updatePayload.description = data.description;
        if (data.area !== undefined)
            updatePayload.area = data.area;
        if (data.whatsapp_community_id !== undefined)
            updatePayload.whatsappCommunityId = data.whatsapp_community_id;
        if (data.cover_image_url !== undefined)
            updatePayload.coverImageUrl = data.cover_image_url;
        if (data.assigned_admin_id !== undefined)
            updatePayload.assignedAdminId = data.assigned_admin_id;
        if (data.status !== undefined)
            updatePayload.status = data.status;
        const [row] = await database_js_1.db
            .update(schema_js_1.communities)
            .set(updatePayload)
            .where((0, drizzle_orm_1.eq)(schema_js_1.communities.id, id))
            .returning();
        if (!row)
            return null;
        const adminRow = row.assignedAdminId
            ? await database_js_1.db.select({ name: schema_js_1.admins.name }).from(schema_js_1.admins).where((0, drizzle_orm_1.eq)(schema_js_1.admins.id, row.assignedAdminId)).limit(1)
            : [];
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            area: row.area,
            whatsapp_community_id: row.whatsappCommunityId,
            cover_image_url: row.coverImageUrl,
            assigned_admin_id: row.assignedAdminId || null,
            assigned_admin_name: adminRow[0]?.name || null,
            status: (row.status || 'active'),
            group_count: 0,
        };
    }
    static async delete(id) {
        const [row] = await database_js_1.db
            .update(schema_js_1.communities)
            .set({ status: 'inactive', updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_js_1.communities.id, id))
            .returning();
        return !!row;
    }
    // Sync community to Evolution Go
    static async syncToWhatsApp(communityId, instanceName, description, groupJids) {
        const community = await this.getById(communityId);
        if (!community) {
            throw new Error('Community not found');
        }
        // If already synced (valid WhatsApp community JID), just add groups
        if (community.whatsapp_community_id && /@g\.us$/.test(community.whatsapp_community_id)) {
            if (groupJids && groupJids.length > 0) {
                return this.addGroupsToWhatsApp(communityId, instanceName, groupJids);
            }
            return {
                community_id: communityId,
                whatsapp_community_id: community.whatsapp_community_id,
                status: 'already-synced',
                groups_added: null,
            };
        }
        // Create community on Evolution Go
        const result = await evolution_service_js_1.EvolutionService.createCommunity(instanceName, community.name);
        const communityJid = result?.JID || result?.communityJid || result?.jid;
        if (!communityJid) {
            throw new Error('Failed to create community on WhatsApp');
        }
        // Update community with WhatsApp JID
        const [updated] = await database_js_1.db
            .update(schema_js_1.communities)
            .set({
            whatsappCommunityId: communityJid,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.communities.id, communityId))
            .returning();
        // Add groups to the new community
        let addResult = null;
        if (groupJids && groupJids.length > 0) {
            addResult = await evolution_service_js_1.EvolutionService.addGroupsToCommunity(instanceName, communityJid, groupJids);
        }
        return {
            community_id: communityId,
            whatsapp_community_id: updated?.whatsappCommunityId,
            status: 'synced',
            result,
            groups_added: addResult,
        };
    }
    // Add groups to community on WhatsApp
    static async addGroupsToWhatsApp(communityId, instanceName, groupJids) {
        const community = await this.getById(communityId);
        if (!community?.whatsapp_community_id) {
            throw new Error('Community not synced to WhatsApp');
        }
        const result = await evolution_service_js_1.EvolutionService.addGroupsToCommunity(instanceName, community.whatsapp_community_id, groupJids);
        if (!result) {
            throw new Error('Failed to add groups to community');
        }
        return {
            community_id: communityId,
            whatsapp_community_id: community.whatsapp_community_id,
            groups_added: groupJids,
            result,
        };
    }
    // Remove groups from community on WhatsApp
    static async removeGroupsFromWhatsApp(communityId, instanceName, groupJids) {
        const community = await this.getById(communityId);
        if (!community?.whatsapp_community_id) {
            throw new Error('Community not synced to WhatsApp');
        }
        const result = await evolution_service_js_1.EvolutionService.removeGroupsFromCommunity(instanceName, community.whatsapp_community_id, groupJids);
        if (!result) {
            throw new Error('Failed to remove groups from community');
        }
        return {
            community_id: communityId,
            whatsapp_community_id: community.whatsapp_community_id,
            groups_removed: groupJids,
            result,
        };
    }
    // Pull communities from WhatsApp and upsert them into PostgreSQL.
    // External id (whatsapp_community_id) is the unique key. Communities that
    // previously had a valid WhatsApp JID but no longer appear on WhatsApp are
    // marked inactive instead of being deleted.
    static async syncFromWhatsApp(instanceName) {
        const waCommunities = (await evolution_service_js_1.EvolutionService.fetchCommunities(instanceName)) || [];
        const created = [];
        const updated = [];
        for (const item of waCommunities) {
            const jid = item?.JID || item?.jid || item?.id || '';
            if (!jid || !/@g\.us$/.test(jid))
                continue;
            const name = item?.Name || item?.name || jid;
            const description = item?.Topic || item?.topic || null;
            const isActive = item?.Suspended === undefined ? true : !item.Suspended;
            const existing = await database_js_1.db
                .select({ id: schema_js_1.communities.id })
                .from(schema_js_1.communities)
                .where((0, drizzle_orm_1.eq)(schema_js_1.communities.whatsappCommunityId, jid))
                .limit(1);
            if (existing[0]) {
                await database_js_1.db
                    .update(schema_js_1.communities)
                    .set({
                    name,
                    description,
                    status: isActive ? 'active' : 'inactive',
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.communities.id, existing[0].id));
                updated.push(jid);
            }
            else {
                await database_js_1.db.insert(schema_js_1.communities).values({
                    name,
                    description,
                    whatsappCommunityId: jid,
                    status: isActive ? 'active' : 'inactive',
                });
                created.push(jid);
            }
        }
        const waJids = new Set(waCommunities
            .map((c) => c?.JID || c?.jid)
            .filter((j) => typeof j === 'string' && /@g\.us$/.test(j)));
        let deactivated = 0;
        const dbSynced = await database_js_1.db
            .select({
            id: schema_js_1.communities.id,
            whatsappCommunityId: schema_js_1.communities.whatsappCommunityId,
            status: schema_js_1.communities.status,
        })
            .from(schema_js_1.communities)
            .where((0, drizzle_orm_1.sql) `${schema_js_1.communities.whatsappCommunityId} IS NOT NULL`);
        for (const row of dbSynced) {
            if (row.whatsappCommunityId &&
                /@g\.us$/.test(row.whatsappCommunityId) &&
                !waJids.has(row.whatsappCommunityId) &&
                row.status !== 'inactive') {
                await database_js_1.db
                    .update(schema_js_1.communities)
                    .set({ status: 'inactive', updatedAt: new Date() })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.communities.id, row.id));
                deactivated++;
            }
        }
        return {
            instance: instanceName,
            found: waCommunities.length,
            created: created.length,
            updated: updated.length,
            deactivated,
            created_ids: created,
            updated_ids: updated,
            synced_at: new Date().toISOString(),
        };
    }
    // Fetch communities from Evolution Go
    static async fetchFromWhatsApp(instanceName) {
        const result = await evolution_service_js_1.EvolutionService.fetchCommunities(instanceName);
        return result || [];
    }
    // Get community info from WhatsApp
    static async getWhatsAppInfo(instanceName, communityJid) {
        return evolution_service_js_1.EvolutionService.getCommunityInfo(instanceName, communityJid);
    }
}
exports.CommunitiesService = CommunitiesService;
