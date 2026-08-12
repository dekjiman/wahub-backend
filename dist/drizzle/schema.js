"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escalationsRelations = exports.chatLogsRelations = exports.groupMembersRelations = exports.groupsRelations = exports.communitiesRelations = exports.membersRelations = exports.adminsRelations = exports.webhookEvents = exports.workflowRuns = exports.auditLogs = exports.systemSettings = exports.integrations = exports.broadcastRecipients = exports.broadcasts = exports.escalationComments = exports.escalations = exports.memberWarnings = exports.moderationAlerts = exports.aiAnalyses = exports.chatLogs = exports.groupMembers = exports.groups = exports.communities = exports.members = exports.admins = exports.priorityEnum = exports.severityEnum = exports.sentimentEnum = exports.messageTypeEnum = exports.directionEnum = exports.statusEnum = exports.adminRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// Enums
exports.adminRoleEnum = (0, pg_core_1.pgEnum)('admin_role', [
    'super_admin',
    'business_manager',
    'area_manager',
    'support',
    'viewer',
]);
exports.statusEnum = (0, pg_core_1.pgEnum)('status', ['active', 'inactive', 'banned']);
exports.directionEnum = (0, pg_core_1.pgEnum)('direction', ['inbound', 'outbound']);
exports.messageTypeEnum = (0, pg_core_1.pgEnum)('message_type', [
    'text',
    'image',
    'video',
    'document',
    'audio',
]);
exports.sentimentEnum = (0, pg_core_1.pgEnum)('sentiment', [
    'positive',
    'neutral',
    'negative',
]);
exports.severityEnum = (0, pg_core_1.pgEnum)('severity', [
    'low',
    'medium',
    'high',
    'critical',
]);
exports.priorityEnum = (0, pg_core_1.pgEnum)('priority', [
    'low',
    'medium',
    'high',
    'urgent',
]);
// Tables
exports.admins = (0, pg_core_1.pgTable)('admins', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).unique().notNull(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    role: (0, exports.adminRoleEnum)('role').default('viewer').notNull(),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('active'),
    lastLoginAt: (0, pg_core_1.timestamp)('last_login_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.members = (0, pg_core_1.pgTable)('members', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    externalId: (0, pg_core_1.varchar)('external_id', { length: 100 }),
    whatsappNumber: (0, pg_core_1.varchar)('whatsapp_number', { length: 20 }).unique().notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    area: (0, pg_core_1.varchar)('area', { length: 100 }),
    businessType: (0, pg_core_1.varchar)('business_type', { length: 100 }),
    businessName: (0, pg_core_1.varchar)('business_name', { length: 255 }),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('active'),
    warningCount: (0, pg_core_1.integer)('warning_count').default(0),
    joinedAt: (0, pg_core_1.timestamp)('joined_at').defaultNow(),
    lastActiveAt: (0, pg_core_1.timestamp)('last_active_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.communities = (0, pg_core_1.pgTable)('communities', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    area: (0, pg_core_1.varchar)('area', { length: 100 }),
    whatsappCommunityId: (0, pg_core_1.varchar)('whatsapp_community_id', { length: 100 }),
    coverImageUrl: (0, pg_core_1.text)('cover_image_url'),
    assignedAdminId: (0, pg_core_1.uuid)('assigned_admin_id').references(() => exports.admins.id, { onDelete: 'set null' }),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('active'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.groups = (0, pg_core_1.pgTable)('groups', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    communityId: (0, pg_core_1.uuid)('community_id').references(() => exports.communities.id, {
        onDelete: 'set null',
    }),
    whatsappGroupJid: (0, pg_core_1.varchar)('whatsapp_group_jid', { length: 100 }).unique().notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    groupType: (0, pg_core_1.varchar)('group_type', { length: 50 }).default('regular'),
    assignedAdminId: (0, pg_core_1.uuid)('assigned_admin_id').references(() => exports.admins.id, { onDelete: 'set null' }),
    aiEnabled: (0, pg_core_1.boolean)('ai_enabled').default(true),
    aiPausedUntil: (0, pg_core_1.timestamp)('ai_paused_until'),
    autoWelcome: (0, pg_core_1.boolean)('auto_welcome').default(true),
    autoFaq: (0, pg_core_1.boolean)('auto_faq').default(true),
    autoModeration: (0, pg_core_1.boolean)('auto_moderation').default(true),
    maxMembers: (0, pg_core_1.integer)('max_members'),
    memberCount: (0, pg_core_1.integer)('member_count').default(0),
    messageCountToday: (0, pg_core_1.integer)('message_count_today').default(0),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('active'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.groupMembers = (0, pg_core_1.pgTable)('group_members', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    groupId: (0, pg_core_1.uuid)('group_id').references(() => exports.groups.id, {
        onDelete: 'cascade',
    }),
    memberId: (0, pg_core_1.uuid)('member_id').references(() => exports.members.id, {
        onDelete: 'cascade',
    }),
    role: (0, pg_core_1.varchar)('role', { length: 20 }).default('member'),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('active'),
    joinedAt: (0, pg_core_1.timestamp)('joined_at').defaultNow(),
    leftAt: (0, pg_core_1.timestamp)('left_at'),
    syncedAt: (0, pg_core_1.timestamp)('synced_at'),
}, (t) => [
    (0, pg_core_1.unique)('group_members_group_id_member_id_unique').on(t.groupId, t.memberId),
]);
exports.chatLogs = (0, pg_core_1.pgTable)('chat_logs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    groupId: (0, pg_core_1.uuid)('group_id').references(() => exports.groups.id),
    memberId: (0, pg_core_1.uuid)('member_id').references(() => exports.members.id),
    whatsappMsgId: (0, pg_core_1.varchar)('whatsapp_msg_id', { length: 100 }),
    direction: (0, exports.directionEnum)('direction').notNull(),
    content: (0, pg_core_1.text)('content'),
    messageType: (0, exports.messageTypeEnum)('message_type').default('text'),
    mediaUrl: (0, pg_core_1.text)('media_url'),
    isFromAi: (0, pg_core_1.boolean)('is_from_ai').default(false),
    sentiment: (0, exports.sentimentEnum)('sentiment'),
    topic: (0, pg_core_1.varchar)('topic', { length: 100 }),
    isSpam: (0, pg_core_1.boolean)('is_spam').default(false),
    isFlagged: (0, pg_core_1.boolean)('is_flagged').default(false),
    replyToMsgId: (0, pg_core_1.varchar)('reply_to_msg_id', { length: 100 }),
    sentAt: (0, pg_core_1.timestamp)('sent_at').defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.aiAnalyses = (0, pg_core_1.pgTable)('ai_analyses', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    chatLogId: (0, pg_core_1.uuid)('chat_log_id').references(() => exports.chatLogs.id),
    analysisType: (0, pg_core_1.varchar)('analysis_type', { length: 50 }).notNull(),
    result: (0, pg_core_1.jsonb)('result').notNull(),
    confidence: (0, pg_core_1.decimal)('confidence', { precision: 3, scale: 2 }),
    modelUsed: (0, pg_core_1.varchar)('model_used', { length: 100 }),
    tokensUsed: (0, pg_core_1.integer)('tokens_used'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.moderationAlerts = (0, pg_core_1.pgTable)('moderation_alerts', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    groupId: (0, pg_core_1.uuid)('group_id').references(() => exports.groups.id),
    memberId: (0, pg_core_1.uuid)('member_id').references(() => exports.members.id),
    chatLogId: (0, pg_core_1.uuid)('chat_log_id').references(() => exports.chatLogs.id),
    alertType: (0, pg_core_1.varchar)('alert_type', { length: 50 }).notNull(),
    severity: (0, exports.severityEnum)('severity').default('medium'),
    description: (0, pg_core_1.text)('description'),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('pending'),
    reviewedBy: (0, pg_core_1.uuid)('reviewed_by').references(() => exports.admins.id),
    reviewedAt: (0, pg_core_1.timestamp)('reviewed_at'),
    actionTaken: (0, pg_core_1.varchar)('action_taken', { length: 50 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.memberWarnings = (0, pg_core_1.pgTable)('member_warnings', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    memberId: (0, pg_core_1.uuid)('member_id').references(() => exports.members.id),
    groupId: (0, pg_core_1.uuid)('group_id').references(() => exports.groups.id),
    issuedBy: (0, pg_core_1.uuid)('issued_by').references(() => exports.admins.id),
    violationType: (0, pg_core_1.varchar)('violation_type', { length: 100 }).notNull(),
    reason: (0, pg_core_1.text)('reason').notNull(),
    severity: (0, pg_core_1.varchar)('severity', { length: 20 }).default('warning'),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('active'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.escalations = (0, pg_core_1.pgTable)('escalations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    groupId: (0, pg_core_1.uuid)('group_id').references(() => exports.groups.id),
    memberId: (0, pg_core_1.uuid)('member_id').references(() => exports.members.id),
    assignedTo: (0, pg_core_1.uuid)('assigned_to').references(() => exports.admins.id),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    priority: (0, exports.priorityEnum)('priority').default('medium'),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('open'),
    slaDeadline: (0, pg_core_1.timestamp)('sla_deadline'),
    resolvedAt: (0, pg_core_1.timestamp)('resolved_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.escalationComments = (0, pg_core_1.pgTable)('escalation_comments', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    escalationId: (0, pg_core_1.uuid)('escalation_id').references(() => exports.escalations.id, {
        onDelete: 'cascade',
    }),
    adminId: (0, pg_core_1.uuid)('admin_id').references(() => exports.admins.id),
    content: (0, pg_core_1.text)('content').notNull(),
    isInternal: (0, pg_core_1.boolean)('is_internal').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.broadcasts = (0, pg_core_1.pgTable)('broadcasts', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    createdBy: (0, pg_core_1.uuid)('created_by').references(() => exports.admins.id),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    content: (0, pg_core_1.text)('content').notNull(),
    messageType: (0, pg_core_1.varchar)('message_type', { length: 20 }).default('text'),
    mediaUrl: (0, pg_core_1.text)('media_url'),
    targetType: (0, pg_core_1.varchar)('target_type', { length: 20 }).notNull(),
    targetIds: (0, pg_core_1.uuid)('target_ids').array().notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('draft'),
    scheduledAt: (0, pg_core_1.timestamp)('scheduled_at'),
    sentAt: (0, pg_core_1.timestamp)('sent_at'),
    totalRecipients: (0, pg_core_1.integer)('total_recipients').default(0),
    totalSent: (0, pg_core_1.integer)('total_sent').default(0),
    totalFailed: (0, pg_core_1.integer)('total_failed').default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.broadcastRecipients = (0, pg_core_1.pgTable)('broadcast_recipients', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    broadcastId: (0, pg_core_1.uuid)('broadcast_id').references(() => exports.broadcasts.id, {
        onDelete: 'cascade',
    }),
    groupId: (0, pg_core_1.uuid)('group_id').references(() => exports.groups.id),
    memberId: (0, pg_core_1.uuid)('member_id').references(() => exports.members.id),
    whatsappMsgId: (0, pg_core_1.varchar)('whatsapp_msg_id', { length: 100 }),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('pending'),
    sentAt: (0, pg_core_1.timestamp)('sent_at'),
    errorMessage: (0, pg_core_1.text)('error_message'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.integrations = (0, pg_core_1.pgTable)('integrations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('disconnected'),
    config: (0, pg_core_1.jsonb)('config').default({}),
    lastSyncedAt: (0, pg_core_1.timestamp)('last_synced_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.systemSettings = (0, pg_core_1.pgTable)('system_settings', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    key: (0, pg_core_1.varchar)('key', { length: 100 }).unique().notNull(),
    value: (0, pg_core_1.text)('value'),
    type: (0, pg_core_1.varchar)('type', { length: 20 }).default('string'),
    category: (0, pg_core_1.varchar)('category', { length: 50 }),
    description: (0, pg_core_1.text)('description'),
    updatedBy: (0, pg_core_1.uuid)('updated_by').references(() => exports.admins.id),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    adminId: (0, pg_core_1.uuid)('admin_id').references(() => exports.admins.id),
    action: (0, pg_core_1.varchar)('action', { length: 100 }).notNull(),
    entityType: (0, pg_core_1.varchar)('entity_type', { length: 50 }).notNull(),
    entityId: (0, pg_core_1.uuid)('entity_id'),
    beforeData: (0, pg_core_1.jsonb)('before_data'),
    afterData: (0, pg_core_1.jsonb)('after_data'),
    ipAddress: (0, pg_core_1.inet)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.workflowRuns = (0, pg_core_1.pgTable)('workflow_runs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    triggerType: (0, pg_core_1.varchar)('trigger_type', { length: 50 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('running'),
    inputData: (0, pg_core_1.jsonb)('input_data'),
    outputData: (0, pg_core_1.jsonb)('output_data'),
    errorMessage: (0, pg_core_1.text)('error_message'),
    durationMs: (0, pg_core_1.integer)('duration_ms'),
    startedAt: (0, pg_core_1.timestamp)('started_at').defaultNow(),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
});
exports.webhookEvents = (0, pg_core_1.pgTable)('webhook_events', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    provider: (0, pg_core_1.varchar)('provider', { length: 50 }).notNull().default('evolution_go'),
    instanceName: (0, pg_core_1.varchar)('instance_name', { length: 100 }),
    externalEventId: (0, pg_core_1.varchar)('external_event_id', { length: 255 }),
    eventType: (0, pg_core_1.varchar)('event_type', { length: 100 }).notNull(),
    payload: (0, pg_core_1.jsonb)('payload').notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 30 }).default('received'),
    retryCount: (0, pg_core_1.integer)('retry_count').default(0),
    errorMessage: (0, pg_core_1.text)('error_message'),
    receivedAt: (0, pg_core_1.timestamp)('received_at').defaultNow(),
    processedAt: (0, pg_core_1.timestamp)('processed_at'),
}, (t) => [
    (0, pg_core_1.index)('idx_webhook_events_status').on(t.status),
    (0, pg_core_1.index)('idx_webhook_events_event_type').on(t.eventType),
    (0, pg_core_1.uniqueIndex)('uq_webhook_external_event').on(t.provider, t.externalEventId),
]);
// Relations
exports.adminsRelations = (0, drizzle_orm_1.relations)(exports.admins, ({ many }) => ({
    moderationAlerts: many(exports.moderationAlerts),
    memberWarnings: many(exports.memberWarnings),
    escalations: many(exports.escalations),
    broadcasts: many(exports.broadcasts),
    auditLogs: many(exports.auditLogs),
}));
exports.membersRelations = (0, drizzle_orm_1.relations)(exports.members, ({ many }) => ({
    groupMembers: many(exports.groupMembers),
    chatLogs: many(exports.chatLogs),
    warnings: many(exports.memberWarnings),
}));
exports.communitiesRelations = (0, drizzle_orm_1.relations)(exports.communities, ({ many }) => ({
    groups: many(exports.groups),
}));
exports.groupsRelations = (0, drizzle_orm_1.relations)(exports.groups, ({ one, many }) => ({
    community: one(exports.communities, {
        fields: [exports.groups.communityId],
        references: [exports.communities.id],
    }),
    groupMembers: many(exports.groupMembers),
    chatLogs: many(exports.chatLogs),
}));
exports.groupMembersRelations = (0, drizzle_orm_1.relations)(exports.groupMembers, ({ one }) => ({
    group: one(exports.groups, {
        fields: [exports.groupMembers.groupId],
        references: [exports.groups.id],
    }),
    member: one(exports.members, {
        fields: [exports.groupMembers.memberId],
        references: [exports.members.id],
    }),
}));
exports.chatLogsRelations = (0, drizzle_orm_1.relations)(exports.chatLogs, ({ one }) => ({
    group: one(exports.groups, {
        fields: [exports.chatLogs.groupId],
        references: [exports.groups.id],
    }),
    member: one(exports.members, {
        fields: [exports.chatLogs.memberId],
        references: [exports.members.id],
    }),
}));
exports.escalationsRelations = (0, drizzle_orm_1.relations)(exports.escalations, ({ one, many }) => ({
    group: one(exports.groups, {
        fields: [exports.escalations.groupId],
        references: [exports.groups.id],
    }),
    member: one(exports.members, {
        fields: [exports.escalations.memberId],
        references: [exports.members.id],
    }),
    assignee: one(exports.admins, {
        fields: [exports.escalations.assignedTo],
        references: [exports.admins.id],
    }),
    comments: many(exports.escalationComments),
}));
