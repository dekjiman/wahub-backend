import { db } from '../../config/database.js';
import { communities, groups, admins } from '../../../drizzle/schema.js';
import { eq, sql } from 'drizzle-orm';
import { EvolutionService } from '../../services/evolution.service.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

export class CommunitiesService {
  static async list() {
    const rows = await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        area: communities.area,
        whatsapp_community_id: communities.whatsappCommunityId,
        cover_image_url: communities.coverImageUrl,
        assigned_admin_id: communities.assignedAdminId,
        admin_name: admins.name,
        status: communities.status,
        group_count: sql<number>`cast(count(${groups.id}) as int)`,
      })
      .from(communities)
      .leftJoin(groups, eq(groups.communityId, communities.id))
      .leftJoin(admins, eq(communities.assignedAdminId, admins.id))
      .groupBy(communities.id, admins.name);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      area: r.area,
      whatsapp_community_id: r.whatsapp_community_id,
      cover_image_url: r.cover_image_url,
      assigned_admin_id: r.assigned_admin_id || null,
      assigned_admin_name: r.admin_name || null,
      status: (r.status || 'active') as 'active' | 'inactive',
      group_count: r.group_count || 0,
    }));
  }

  static async create(data: {
    name: string;
    description?: string;
    area?: string | null;
    whatsapp_community_id?: string;
    cover_image_url?: string;
    assigned_admin_id?: string;
    instance_name?: string;
  }) {
    const [row] = await db
      .insert(communities)
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
    const instanceName = data.instance_name || env.EVOLUTION_DEFAULT_INSTANCE;
    let synced: { whatsapp_community_id?: string | null; result?: unknown } | null = null;
    try {
      synced = await this.syncToWhatsApp(
        row.id,
        instanceName,
        data.description || '',
        []
      ) as { whatsapp_community_id?: string | null; result?: unknown };
    } catch (error: any) {
      // Rollback: community could not be created on WhatsApp, so don't keep it
      // in the DB either (otherwise it shows in Wahub but never in WhatsApp).
      await db
        .update(communities)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(communities.id, row.id));
      throw new Error(
        `Komunitas dibuat di Wahub tapi gagal sync ke WhatsApp (${instanceName}): ${error.message}`
      );
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
      status: (row.status || 'active') as 'active' | 'inactive',
      group_count: 0,
    };
  }

  static async getGroups(communityId: string) {
    const rows = await db
      .select()
      .from(groups)
      .where(eq(groups.communityId, communityId));

    return rows.map((r) => ({
      id: r.id,
      community_id: r.communityId,
      whatsapp_group_jid: r.whatsappGroupJid,
      name: r.name,
      description: r.description,
      group_type: (r.groupType || 'regular') as 'regular' | 'announcement' | 'support',
      assigned_admin_id: r.assignedAdminId || null,
      ai_enabled: r.aiEnabled ?? true,
      ai_paused_until: r.aiPausedUntil ? r.aiPausedUntil.toISOString() : null,
      auto_welcome: r.autoWelcome ?? true,
      auto_faq: r.autoFaq ?? true,
      auto_moderation: r.autoModeration ?? true,
      member_count: r.memberCount || 0,
      message_count_today: r.messageCountToday || 0,
      status: (r.status || 'active') as 'active' | 'inactive',
    }));
  }

  static async getById(id: string) {
    const rows = await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        area: communities.area,
        whatsapp_community_id: communities.whatsappCommunityId,
        cover_image_url: communities.coverImageUrl,
        assigned_admin_id: communities.assignedAdminId,
        admin_name: admins.name,
        status: communities.status,
        created_at: communities.createdAt,
        group_count: sql<number>`cast(count(${groups.id}) as int)`,
      })
      .from(communities)
      .leftJoin(groups, eq(groups.communityId, communities.id))
      .leftJoin(admins, eq(communities.assignedAdminId, admins.id))
      .where(eq(communities.id, id))
      .groupBy(communities.id, admins.name)
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      area: row.area,
      whatsapp_community_id: row.whatsapp_community_id,
      cover_image_url: row.cover_image_url,
      assigned_admin_id: row.assigned_admin_id || null,
      assigned_admin_name: row.admin_name || null,
      status: (row.status || 'active') as 'active' | 'inactive',
      group_count: row.group_count || 0,
      created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
    };
  }

  static async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      area?: string | null;
      whatsapp_community_id?: string | null;
      cover_image_url?: string | null;
      assigned_admin_id?: string | null;
      status?: string;
    }
  ) {
    const updatePayload: any = { updatedAt: new Date() };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.area !== undefined) updatePayload.area = data.area;
    if (data.whatsapp_community_id !== undefined) updatePayload.whatsappCommunityId = data.whatsapp_community_id;
    if (data.cover_image_url !== undefined) updatePayload.coverImageUrl = data.cover_image_url;
    if (data.assigned_admin_id !== undefined) updatePayload.assignedAdminId = data.assigned_admin_id;
    if (data.status !== undefined) updatePayload.status = data.status;

    const [row] = await db
      .update(communities)
      .set(updatePayload)
      .where(eq(communities.id, id))
      .returning();

    if (!row) return null;

    const adminRow = row.assignedAdminId
      ? await db.select({ name: admins.name }).from(admins).where(eq(admins.id, row.assignedAdminId)).limit(1)
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
      status: (row.status || 'active') as 'active' | 'inactive',
      group_count: 0,
    };
  }

  static async delete(id: string): Promise<boolean> {
    const [row] = await db
      .update(communities)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(communities.id, id))
      .returning();
    return !!row;
  }

  // Sync community to Evolution Go
  static async syncToWhatsApp(
    communityId: string,
    instanceName: string,
    description: string,
    groupJids: string[]
  ) {
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
    const result = await EvolutionService.createCommunity(
      instanceName,
      community.name
    );

    const communityJid = (result as any)?.JID || (result as any)?.communityJid || (result as any)?.jid;
    if (!communityJid) {
      throw new Error('Failed to create community on WhatsApp');
    }

    // Update community with WhatsApp JID
    const [updated] = await db
      .update(communities)
      .set({
        whatsappCommunityId: communityJid,
        updatedAt: new Date(),
      })
      .where(eq(communities.id, communityId))
      .returning();

    // Add groups to the new community
    let addResult: unknown = null;
    if (groupJids && groupJids.length > 0) {
      addResult = await EvolutionService.addGroupsToCommunity(
        instanceName,
        communityJid,
        groupJids
      );
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
  static async addGroupsToWhatsApp(
    communityId: string,
    instanceName: string,
    groupJids: string[]
  ) {
    const community = await this.getById(communityId);
    if (!community?.whatsapp_community_id) {
      throw new Error('Community not synced to WhatsApp');
    }

    const result = await EvolutionService.addGroupsToCommunity(
      instanceName,
      community.whatsapp_community_id,
      groupJids
    );

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
  static async removeGroupsFromWhatsApp(
    communityId: string,
    instanceName: string,
    groupJids: string[]
  ) {
    const community = await this.getById(communityId);
    if (!community?.whatsapp_community_id) {
      throw new Error('Community not synced to WhatsApp');
    }

    const result = await EvolutionService.removeGroupsFromCommunity(
      instanceName,
      community.whatsapp_community_id,
      groupJids
    );

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
  static async syncFromWhatsApp(instanceName: string) {
    const waCommunities = (await EvolutionService.fetchCommunities(instanceName)) || [];

    const created: string[] = [];
    const updated: string[] = [];

    for (const item of waCommunities) {
      const jid = item?.JID || item?.jid || item?.id || '';
      if (!jid || !/@g\.us$/.test(jid)) continue;

      const name = item?.Name || item?.name || jid;
      const description = item?.Topic || item?.topic || null;
      const isActive = item?.Suspended === undefined ? true : !item.Suspended;

      const existing = await db
        .select({ id: communities.id })
        .from(communities)
        .where(eq(communities.whatsappCommunityId, jid))
        .limit(1);

      if (existing[0]) {
        // Only update if community is already active; don't reactivate inactive ones
        const current = await db
          .select({ status: communities.status })
          .from(communities)
          .where(eq(communities.id, existing[0].id))
          .limit(1);

        if (current[0]?.status === 'inactive') {
          logger.info(`[sync] Skipping inactive community "${name}" (${jid}) — not reactivating`);
          continue;
        }

        // Only sync name and description — never change status via reconciliation
        // Status should only be changed by admin action
        await db
          .update(communities)
          .set({
            name,
            description,
            updatedAt: new Date(),
          })
          .where(eq(communities.id, existing[0].id));
        updated.push(jid);
      } else {
        // Auto-create disabled: communities must be created manually via API
        logger.info(`[sync] Skipping community "${name}" (${jid}) — not found in DB, auto-create disabled`);
      }
    }

    // Automatic deactivation disabled: reconciliation cron should never change community status to inactive.
    // Status can only be changed manually by admin.
    const deactivated = 0;

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
  static async fetchFromWhatsApp(instanceName: string) {
    const result = await EvolutionService.fetchCommunities(instanceName);
    return result || [];
  }

  // Get community info from WhatsApp
  static async getWhatsAppInfo(instanceName: string, communityJid: string) {
    return EvolutionService.getCommunityInfo(instanceName, communityJid);
  }
}
