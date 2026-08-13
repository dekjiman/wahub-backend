import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  decimal,
  jsonb,
  inet,
  unique,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const adminRoleEnum = pgEnum('admin_role', [
  'super_admin',
  'business_manager',
  'area_manager',
  'support',
  'viewer',
]);

export const statusEnum = pgEnum('status', ['active', 'inactive', 'banned']);
export const directionEnum = pgEnum('direction', ['inbound', 'outbound']);
export const messageTypeEnum = pgEnum('message_type', [
  'text',
  'image',
  'video',
  'document',
  'audio',
]);
export const sentimentEnum = pgEnum('sentiment', [
  'positive',
  'neutral',
  'negative',
]);
export const severityEnum = pgEnum('severity', [
  'low',
  'medium',
  'high',
  'critical',
]);
export const priorityEnum = pgEnum('priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

// Tables
export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: adminRoleEnum('role').default('viewer').notNull(),
  avatarUrl: text('avatar_url'),
  phone: varchar('phone', { length: 20 }),
  status: varchar('status', { length: 20 }).default('active'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  externalId: varchar('external_id', { length: 100 }),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }).unique().notNull(),
  displayName: varchar('display_name', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  area: varchar('area', { length: 100 }),
  businessType: varchar('business_type', { length: 100 }),
  businessName: varchar('business_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  status: varchar('status', { length: 20 }).default('active'),
  warningCount: integer('warning_count').default(0),
  onboardingStatus: varchar('onboarding_status', { length: 20 }).default('pending'),
  joinedAt: timestamp('joined_at').defaultNow(),
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const communities = pgTable('communities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  area: varchar('area', { length: 100 }),
  whatsappCommunityId: varchar('whatsapp_community_id', { length: 100 }),
  coverImageUrl: text('cover_image_url'),
  assignedAdminId: uuid('assigned_admin_id').references(() => admins.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const groups = pgTable('groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  communityId: uuid('community_id').references(() => communities.id, {
    onDelete: 'set null',
  }),
  whatsappGroupJid: varchar('whatsapp_group_jid', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  groupType: varchar('group_type', { length: 50 }).default('regular'),
  assignedAdminId: uuid('assigned_admin_id').references(() => admins.id, { onDelete: 'set null' }),
  aiEnabled: boolean('ai_enabled').default(true),
  aiPausedUntil: timestamp('ai_paused_until'),
  autoWelcome: boolean('auto_welcome').default(true),
  autoFaq: boolean('auto_faq').default(true),
  autoModeration: boolean('auto_moderation').default(true),
  maxMembers: integer('max_members'),
  memberCount: integer('member_count').default(0),
  messageCountToday: integer('message_count_today').default(0),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const groupMembers = pgTable(
  'group_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id').references(() => groups.id, {
      onDelete: 'cascade',
    }),
    memberId: uuid('member_id').references(() => members.id, {
      onDelete: 'cascade',
    }),
    role: varchar('role', { length: 20 }).default('member'),
    status: varchar('status', { length: 20 }).default('active'),
    joinedAt: timestamp('joined_at').defaultNow(),
    leftAt: timestamp('left_at'),
    syncedAt: timestamp('synced_at'),
  },
  (t) => [
    unique('group_members_group_id_member_id_unique').on(t.groupId, t.memberId),
  ]
);

export const chatLogs = pgTable('chat_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => groups.id),
  memberId: uuid('member_id').references(() => members.id),
  whatsappMsgId: varchar('whatsapp_msg_id', { length: 100 }),
  direction: directionEnum('direction').notNull(),
  content: text('content'),
  messageType: messageTypeEnum('message_type').default('text'),
  mediaUrl: text('media_url'),
  isFromAi: boolean('is_from_ai').default(false),
  sentiment: sentimentEnum('sentiment'),
  topic: varchar('topic', { length: 100 }),
  isSpam: boolean('is_spam').default(false),
  isFlagged: boolean('is_flagged').default(false),
  replyToMsgId: varchar('reply_to_msg_id', { length: 100 }),
  sentAt: timestamp('sent_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const aiAnalyses = pgTable('ai_analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatLogId: uuid('chat_log_id').references(() => chatLogs.id),
  analysisType: varchar('analysis_type', { length: 50 }).notNull(),
  result: jsonb('result').notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  modelUsed: varchar('model_used', { length: 100 }),
  tokensUsed: integer('tokens_used'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const moderationAlerts = pgTable('moderation_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => groups.id),
  memberId: uuid('member_id').references(() => members.id),
  chatLogId: uuid('chat_log_id').references(() => chatLogs.id),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  severity: severityEnum('severity').default('medium'),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => admins.id),
  reviewedAt: timestamp('reviewed_at'),
  actionTaken: varchar('action_taken', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const memberWarnings = pgTable('member_warnings', {
  id: uuid('id').defaultRandom().primaryKey(),
  memberId: uuid('member_id').references(() => members.id),
  groupId: uuid('group_id').references(() => groups.id),
  issuedBy: uuid('issued_by').references(() => admins.id),
  violationType: varchar('violation_type', { length: 100 }).notNull(),
  reason: text('reason').notNull(),
  severity: varchar('severity', { length: 20 }).default('warning'),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const escalations = pgTable('escalations', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => groups.id),
  memberId: uuid('member_id').references(() => members.id),
  assignedTo: uuid('assigned_to').references(() => admins.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  priority: priorityEnum('priority').default('medium'),
  status: varchar('status', { length: 20 }).default('open'),
  slaDeadline: timestamp('sla_deadline'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const escalationComments = pgTable('escalation_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  escalationId: uuid('escalation_id').references(() => escalations.id, {
    onDelete: 'cascade',
  }),
  adminId: uuid('admin_id').references(() => admins.id),
  content: text('content').notNull(),
  isInternal: boolean('is_internal').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const broadcasts = pgTable('broadcasts', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdBy: uuid('created_by').references(() => admins.id),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 20 }).default('text'),
  mediaUrl: text('media_url'),
  targetType: varchar('target_type', { length: 20 }).notNull(),
  targetIds: uuid('target_ids').array().notNull(),
  status: varchar('status', { length: 20 }).default('draft'),
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  totalRecipients: integer('total_recipients').default(0),
  totalSent: integer('total_sent').default(0),
  totalFailed: integer('total_failed').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const broadcastRecipients = pgTable('broadcast_recipients', {
  id: uuid('id').defaultRandom().primaryKey(),
  broadcastId: uuid('broadcast_id').references(() => broadcasts.id, {
    onDelete: 'cascade',
  }),
  groupId: uuid('group_id').references(() => groups.id),
  memberId: uuid('member_id').references(() => members.id),
  whatsappMsgId: varchar('whatsapp_msg_id', { length: 100 }),
  status: varchar('status', { length: 20 }).default('pending'),
  sentAt: timestamp('sent_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const integrations = pgTable('integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('disconnected'),
  config: jsonb('config').default({}),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: text('value'),
  type: varchar('type', { length: 20 }).default('string'),
  category: varchar('category', { length: 50 }),
  description: text('description'),
  updatedBy: uuid('updated_by').references(() => admins.id),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').references(() => admins.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id'),
  beforeData: jsonb('before_data'),
  afterData: jsonb('after_data'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const workflowRuns = pgTable('workflow_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  triggerType: varchar('trigger_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('running'),
  inputData: jsonb('input_data'),
  outputData: jsonb('output_data'),
  errorMessage: text('error_message'),
  durationMs: integer('duration_ms'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    provider: varchar('provider', { length: 50 }).notNull().default('evolution_go'),
    instanceName: varchar('instance_name', { length: 100 }),
    externalEventId: varchar('external_event_id', { length: 255 }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull(),
    status: varchar('status', { length: 30 }).default('received'),
    retryCount: integer('retry_count').default(0),
    errorMessage: text('error_message'),
    receivedAt: timestamp('received_at').defaultNow(),
    processedAt: timestamp('processed_at'),
  },
  (t) => [
    index('idx_webhook_events_status').on(t.status),
    index('idx_webhook_events_event_type').on(t.eventType),
    uniqueIndex('uq_webhook_external_event').on(t.provider, t.externalEventId),
  ]
);

// Relations
export const adminsRelations = relations(admins, ({ many }) => ({
  moderationAlerts: many(moderationAlerts),
  memberWarnings: many(memberWarnings),
  escalations: many(escalations),
  broadcasts: many(broadcasts),
  auditLogs: many(auditLogs),
}));

export const membersRelations = relations(members, ({ many }) => ({
  groupMembers: many(groupMembers),
  chatLogs: many(chatLogs),
  warnings: many(memberWarnings),
}));

export const communitiesRelations = relations(communities, ({ many }) => ({
  groups: many(groups),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  community: one(communities, {
    fields: [groups.communityId],
    references: [communities.id],
  }),
  groupMembers: many(groupMembers),
  chatLogs: many(chatLogs),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  member: one(members, {
    fields: [groupMembers.memberId],
    references: [members.id],
  }),
}));

export const chatLogsRelations = relations(chatLogs, ({ one }) => ({
  group: one(groups, {
    fields: [chatLogs.groupId],
    references: [groups.id],
  }),
  member: one(members, {
    fields: [chatLogs.memberId],
    references: [members.id],
  }),
}));

export const escalationsRelations = relations(escalations, ({ one, many }) => ({
  group: one(groups, {
    fields: [escalations.groupId],
    references: [groups.id],
  }),
  member: one(members, {
    fields: [escalations.memberId],
    references: [members.id],
  }),
  assignee: one(admins, {
    fields: [escalations.assignedTo],
    references: [admins.id],
  }),
  comments: many(escalationComments),
}));
