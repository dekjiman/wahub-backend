# Product Requirements Document (PRD)

## Wahub Backend — REST API Server

### Version
v1.0.0

### Document Status
Draft

### Owner
Engineering

### Last Updated
10 August 2026

---

# 1. Product Overview

## Summary

Backend REST API untuk **Limestone Hub** — admin dashboard untuk mengelola WhatsApp Community, Groups, Members, AI Automation, Moderation, Broadcast, dan Integrasi. Dibangun menggunakan **Node.js + Express.js + PostgreSQL**.

Backend ini menjadi jembatan antara Frontend Dashboard dengan WhatsApp layer (Evolution API) serta AI/LLM services.

## Frontend Reference

Frontend sudah tersedia di `D:\laragon\www\wahub-frontend` dengan tech stack:
- Vue 3 + Vite + TypeScript
- Tailwind CSS
- Pinia (state management)

Frontend mengharapkan semua response dalam format:
```json
{ "data": <T> }
// atau untuk error:
{ "errors": [{ "code": "string", "message": "string", "field": "string?" }] }
```

---

# 2. Goals

## Primary Goal

Bangun backend API yang kompatibel 100% dengan frontend Limestone Hub, termasuk:
- Semua endpoint yang di-expect oleh frontend
- Authentication & Authorization
- WhatsApp Community/Group management via Evolution API
- AI-powered automation (moderation, summary, FAQ)

## Success Criteria

- Semua 40+ API endpoint berfungsi sesuai frontend
- WhatsApp instance terhubung via Evolution API
- Community & Group metadata tersinkronisasi
- Real-time webhook events dari WhatsApp diproses
- AI moderation & summary berjalan
- Docker deployment reproducible

---

# 3. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20+ |
| Framework | Express.js | 4.x |
| Language | TypeScript | 5.x |
| Database | PostgreSQL | 15+ |
| ORM | Drizzle ORM | 0.x |
| Cache | Redis | 7+ |
| Auth | JWT (jsonwebtoken) | - |
| Validation | Zod | 3.x |
| WhatsApp Gateway | Evolution API | v2 |
| AI/LLM | OpenAI / OpenRouter | - |
| Scheduler | node-cron | - |
| Container | Docker + Docker Compose | - |

### Drizzle ORM Package Dependencies
```json
{
  "dependencies": {
    "drizzle-orm": "^0.35.0",
    "postgres": "^3.4.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.25.0",
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0"
  }
}
```

### Drizzle Configuration (`drizzle.config.ts`)
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

### Database Connection (`src/config/database.ts`)
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../drizzle/schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
export const db = drizzle(client, { schema })
```

---

# 4. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (Vue 3)                   │
│               Limestone Hub Dashboard               │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP REST API
                        │ Authorization: Bearer <JWT>
                        ▼
┌─────────────────────────────────────────────────────┐
│              Backend API (Express.js)                │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Auth     │ │ Admin    │ │ Member   │ │ Group  │ │
│  │ Module   │ │ Module   │ │ Module   │ │ Module │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Dashboard │ │Broadcast │ │Moderation│ │Escalat.│ │
│  │ Module   │ │ Module   │ │ Module   │ │ Module │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Analytics │ │Audit Log │ │Settings  │ │Workflow│ │
│  │ Module   │ │ Module   │ │ Module   │ │ Module │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐                          │
│  │Chat Log  │ │Integrat. │   ┌──────────────────┐  │
│  │ Module   │ │ Module   │   │ WhatsApp Service  │  │
│  └──────────┘ └──────────┘   │ (Evolution API)   │  │
│                              └──────────────────┘  │
└──────────┬──────────┬───────────────┬──────────────┘
           │          │               │
           ▼          ▼               ▼
     ┌──────────┐ ┌──────────┐ ┌──────────────────┐
     │PostgreSQL│ │  Redis   │ │ Evolution API    │
     │    DB    │ │  Cache   │ │ (WhatsApp GW)    │
     └──────────┘ └──────────┘ └──────────────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  WhatsApp Cloud  │
                                  │  / Baileys API   │
                                  └──────────────────┘
```

---

# 5. Database Schema (PostgreSQL via Drizzle ORM)

> Full schema ditulis dalam Drizzle ORM format di `drizzle/schema.ts`.

## 5.1 Enums

```typescript
// drizzle/schema.ts
import { pgEnum } from 'drizzle-orm/pg-core'

export const adminRoleEnum = pgEnum('admin_role', [
  'super_admin', 'business_manager', 'area_manager', 'support', 'viewer'
])
export const statusEnum = pgEnum('status', ['active', 'inactive', 'banned'])
export const directionEnum = pgEnum('direction', ['inbound', 'outbound'])
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'video', 'document', 'audio'])
export const sentimentEnum = pgEnum('sentiment', ['positive', 'neutral', 'negative'])
export const severityEnum = pgEnum('severity', ['low', 'medium', 'high', 'critical'])
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'urgent'])
```

## 5.2 Core Tables

```typescript
import { pgTable, uuid, varchar, text, boolean, integer, timestamp, decimal, jsonb, inet, unique } from 'drizzle-orm/pg-core'

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
})

export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
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
  joinedAt: timestamp('joined_at').defaultNow(),
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const communities = pgTable('communities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  whatsappCommunityId: varchar('whatsapp_community_id', { length: 100 }),
  coverImageUrl: text('cover_image_url'),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const groups = pgTable('groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  communityId: uuid('community_id').references(() => communities.id, { onDelete: 'set null' }),
  whatsappGroupJid: varchar('whatsapp_group_jid', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  groupType: varchar('group_type', { length: 50 }).default('regular'),
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
})

export const groupMembers = pgTable('group_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).default('member'),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (t) => [
  unique('group_members_group_id_member_id_unique').on(t.groupId, t.memberId),
])
```

## 5.3 Chat & Message Tables

```typescript
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
})

export const aiAnalyses = pgTable('ai_analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatLogId: uuid('chat_log_id').references(() => chatLogs.id),
  analysisType: varchar('analysis_type', { length: 50 }).notNull(),
  result: jsonb('result').notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  modelUsed: varchar('model_used', { length: 100 }),
  tokensUsed: integer('tokens_used'),
  createdAt: timestamp('created_at').defaultNow(),
})
```

## 5.4 Automation Tables

```typescript
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
})

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
})

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
})

export const escalationComments = pgTable('escalation_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  escalationId: uuid('escalation_id').references(() => escalations.id, { onDelete: 'cascade' }),
  adminId: uuid('admin_id').references(() => admins.id),
  content: text('content').notNull(),
  isInternal: boolean('is_internal').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})
```

## 5.5 Broadcast Tables

```typescript
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
})

export const broadcastRecipients = pgTable('broadcast_recipients', {
  id: uuid('id').defaultRandom().primaryKey(),
  broadcastId: uuid('broadcast_id').references(() => broadcasts.id, { onDelete: 'cascade' }),
  groupId: uuid('group_id').references(() => groups.id),
  memberId: uuid('member_id').references(() => members.id),
  whatsappMsgId: varchar('whatsapp_msg_id', { length: 100 }),
  status: varchar('status', { length: 20 }).default('pending'),
  sentAt: timestamp('sent_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
})
```

## 5.6 Integration & System Tables

```typescript
export const integrations = pgTable('integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('disconnected'),
  config: jsonb('config').default({}),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: text('value'),
  type: varchar('type', { length: 20 }).default('string'),
  category: varchar('category', { length: 50 }),
  description: text('description'),
  updatedBy: uuid('updated_by').references(() => admins.id),
  updatedAt: timestamp('updated_at').defaultNow(),
})

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
})

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
})
```

## 5.7 Relations

```typescript
import { relations } from 'drizzle-orm'

export const adminsRelations = relations(admins, ({ many }) => ({
  moderationAlerts: many(moderationAlerts),
  memberWarnings: many(memberWarnings),
  escalations: many(escalations),
  broadcasts: many(broadcasts),
  auditLogs: many(auditLogs),
}))

export const membersRelations = relations(members, ({ many }) => ({
  groupMembers: many(groupMembers),
  chatLogs: many(chatLogs),
  warnings: many(memberWarnings),
}))

export const communitiesRelations = relations(communities, ({ many }) => ({
  groups: many(groups),
}))

export const groupsRelations = relations(groups, ({ one, many }) => ({
  community: one(communities, { fields: [groups.communityId], references: [communities.id] }),
  groupMembers: many(groupMembers),
  chatLogs: many(chatLogs),
}))

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  member: one(members, { fields: [groupMembers.memberId], references: [members.id] }),
}))

export const chatLogsRelations = relations(chatLogs, ({ one }) => ({
  group: one(groups, { fields: [chatLogs.groupId], references: [groups.id] }),
  member: one(members, { fields: [chatLogs.memberId], references: [members.id] }),
}))

export const escalationsRelations = relations(escalations, ({ one, many }) => ({
  group: one(groups, { fields: [escalations.groupId], references: [groups.id] }),
  member: one(members, { fields: [escalations.memberId], references: [members.id] }),
  assignee: one(admins, { fields: [escalations.assignedTo], references: [admins.id] }),
  comments: many(escalationComments),
}))
```

## 5.8 Migration Commands

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Push schema directly to database (dev)
npx drizzle-kit push

# Open Drizzle Studio (GUI)
npx drizzle-kit studio

# Pull existing DB schema into Drizzle
npx drizzle-kit pull
```

---

# 6. API Endpoints Specification

> **Base URL:** `/api/v1`
>
> **Auth:** `Authorization: Bearer <JWT_TOKEN>`
>
> **Content-Type:** `application/json`

## 6.1 Auth Module

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/auth/login` | Login | `{ email, password }` | `{ token, user: AuthUser }` |
| `POST` | `/auth/logout` | Logout | - | `204` |
| `GET` | `/auth/me` | Get current user | - | `{ data: AuthUser }` |
| `POST` | `/auth/forgot-password` | Request reset | `{ email }` | `204` |
| `POST` | `/auth/reset-password` | Reset password | `{ token, password }` | `204` |

**AuthUser shape:**
```typescript
interface AuthUser {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'business_manager' | 'area_manager' | 'support' | 'viewer'
  avatar_url: string | null
  permissions: string[]
}
```

**JWT Payload:**
```typescript
{ sub: adminId, email, role, iat, exp }
```

**Permission keys (from frontend):**
```
admin.view, admin.create, admin.edit, admin.delete
member.view, member.create, member.edit, member.warning
group.view, group.create, group.edit, group.ai_control
community.view, community.create
broadcast.view, broadcast.create, broadcast.approve
moderation.view, moderation.approve, moderation.reject, moderation.execute
escalation.view, escalation.assign, escalation.update
dashboard.view, dashboard.analytics
settings.view, settings.edit
audit.view
integration.view, integration.refresh
```

## 6.2 Admins Module

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/admins` | List all admins | - | `{ data: Admin[] }` |
| `POST` | `/admins` | Create admin | `Partial<Admin>` | `{ data: Admin }` |
| `PATCH` | `/admins/:id` | Update admin | `Partial<Admin>` | `{ data: Admin }` |
| `DELETE` | `/admins/:id` | Delete admin | - | `204` |

```typescript
interface Admin {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'business_manager' | 'area_manager' | 'support' | 'viewer'
  avatar_url: string | null
  phone: string | null
  status: 'active' | 'inactive'
  last_login_at: string | null
  created_at: string
}
```

## 6.3 Members Module

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/members` | List all members | - | `{ data: Member[] }` |
| `POST` | `/members` | Create member | `Partial<Member>` | `{ data: Member }` |
| `PATCH` | `/members/:id` | Update member | `Partial<Member>` | `{ data: Member }` |
| `GET` | `/members/:id/groups` | Member's groups | - | `{ data: GroupMembership[] }` |
| `GET` | `/members/:id/warnings` | Member's warnings | - | `{ data: MemberWarning[] }` |
| `POST` | `/members/:id/warnings` | Issue warning | `{ violation_type, reason }` | `{ data: MemberWarning }` |
| `GET` | `/members/:id/messages` | Member's messages | - | `{ data: ChatLog[] }` |

```typescript
interface Member {
  id: string
  whatsapp_number: string
  display_name: string
  phone: string | null
  email: string | null
  area: string | null
  business_type: string | null
  business_name: string | null
  avatar_url: string | null
  status: 'active' | 'inactive' | 'banned'
  warning_count: number
  joined_at: string
  last_active_at: string | null
}

interface GroupMembership {
  group_id: string
  group_name: string
  community_name: string
  role: string
  joined_at: string
}

interface MemberWarning {
  id: string
  violation_type: string
  reason: string
  severity: string
  issued_by: string
  created_at: string
}
```

## 6.4 Communities & Groups Module

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/communities` | List communities | - | `{ data: Community[] }` |
| `POST` | `/communities` | Create community | `Partial<Community>` | `{ data: Community }` |
| `GET` | `/communities/:id/groups` | Groups in community | - | `{ data: Group[] }` |
| `GET` | `/groups` | List all groups | - | `{ data: Group[] }` |
| `POST` | `/groups` | Create group | `Partial<Group>` | `{ data: Group }` |
| `PATCH` | `/groups/:id` | Update group | `Partial<Group>` | `{ data: Group }` |
| `GET` | `/groups/:id/members` | Group members | - | `{ data: GroupMemberRow[] }` |
| `GET` | `/groups/:id/metrics` | Group metrics | - | `{ data: GroupMetrics }` |
| `POST` | `/groups/:id/pause-ai` | Pause AI | `{ minutes }` | `{ data: Group }` |
| `POST` | `/groups/:id/resume-ai` | Resume AI | - | `{ data: Group }` |

```typescript
interface Community {
  id: string
  name: string
  description: string | null
  whatsapp_community_id: string | null
  cover_image_url: string | null
  status: 'active' | 'inactive'
  group_count: number
}

interface Group {
  id: string
  community_id: string | null
  whatsapp_group_jid: string
  name: string
  description: string | null
  group_type: 'regular' | 'announcement' | 'support'
  ai_enabled: boolean
  ai_paused_until: string | null
  auto_welcome: boolean
  auto_faq: boolean
  auto_moderation: boolean
  member_count: number
  message_count_today: number
  status: 'active' | 'inactive'
}

interface GroupMemberRow {
  member_id: string
  display_name: string
  whatsapp_number: string
  role: string
  joined_at: string
  warning_count: number
}

interface GroupMetrics {
  total_members: number
  messages_today: number
  messages_this_week: number
  active_members: number
  ai_responses_today: number
  moderation_actions_today: number
}
```

## 6.5 Dashboard Module

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/dashboard/summary` | KPI summary | `DashboardSummary` |
| `GET` | `/dashboard/health` | Service health | `HealthStatus[]` |
| `GET` | `/dashboard/recent-activities` | Activity feed | `RecentActivity[]` |

```typescript
interface DashboardSummary {
  total_communities: number
  total_groups: number
  total_members: number
  messages_today: number
  messages_this_week: number
  active_ai_groups: number
  pending_moderations: number
  open_escalations: number
}

interface HealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  last_checked: string
  details: string | null
}

interface RecentActivity {
  id: string
  type: string
  description: string
  actor: string
  timestamp: string
}
```

## 6.6 Broadcasts Module

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/broadcasts` | List broadcasts | - | `{ data: Broadcast[] }` |
| `GET` | `/broadcasts/:id` | Get broadcast | - | `{ data: Broadcast }` |
| `GET` | `/broadcasts/:id/recipients` | Get recipients | - | `{ data: BroadcastRecipient[] }` |
| `POST` | `/broadcasts` | Create broadcast | `Partial<Broadcast>` | `{ data: Broadcast }` |
| `PATCH` | `/broadcasts/:id/status` | Update status | `{ status }` | `{ data: Broadcast }` |
| `POST` | `/broadcasts/:id/approve` | Approve broadcast | - | `{ data: Broadcast }` |

```typescript
interface Broadcast {
  id: string
  created_by: string
  title: string
  content: string
  message_type: 'text' | 'image' | 'video' | 'document'
  media_url: string | null
  target_type: 'community' | 'group' | 'member'
  target_ids: string[]
  status: 'draft' | 'pending_approval' | 'approved' | 'sending' | 'sent' | 'failed'
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  total_sent: number
  total_failed: number
  created_at: string
}

interface BroadcastRecipient {
  id: string
  group_name: string
  member_name: string
  whatsapp_number: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  sent_at: string | null
  error_message: string | null
}
```

## 6.7 Moderation Module

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/moderation/alerts` | List alerts | - | `{ data: ModerationAlert[] }` |
| `GET` | `/moderation/alerts/:id` | Get alert | - | `{ data: ModerationAlert }` |
| `POST` | `/moderation/alerts/:id/approve` | Approve | - | `{ data: ModerationAlert }` |
| `POST` | `/moderation/alerts/:id/reject` | Reject | - | `{ data: ModerationAlert }` |
| `POST` | `/moderation/alerts/:id/execute` | Execute action | - | `{ data: ModerationAlert }` |

```typescript
interface ModerationAlert {
  id: string
  group_id: string
  group_name: string
  member_id: string
  member_name: string
  chat_log_id: string
  alert_type: 'spam' | 'flood' | 'toxic' | 'link' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'executed'
  reviewed_by: string | null
  reviewed_at: string | null
  action_taken: string | null
  created_at: string
}
```

## 6.8 Escalations Module

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/escalations` | List escalations | - | `{ data: Escalation[] }` |
| `GET` | `/escalations/:id` | Get escalation | - | `{ data: Escalation }` |
| `GET` | `/escalations/:id/comments` | Get comments | - | `{ data: EscalationComment[] }` |
| `POST` | `/escalations/:id/assign` | Assign | `{ admin_id }` | `{ data: Escalation }` |
| `PATCH` | `/escalations/:id/status` | Update status | `{ status }` | `{ data: Escalation }` |
| `POST` | `/escalations/:id/comments` | Add comment | `{ content, is_internal }` | `{ data: EscalationComment }` |

```typescript
interface Escalation {
  id: string
  group_id: string
  group_name: string
  member_id: string
  member_name: string
  assigned_to: string | null
  assigned_name: string | null
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  sla_deadline: string | null
  resolved_at: string | null
  created_at: string
}

interface EscalationComment {
  id: string
  admin_id: string
  admin_name: string
  content: string
  is_internal: boolean
  created_at: string
}
```

## 6.9 Settings Module

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/settings` | Get all settings | - | `{ data: SystemSetting[] }` |
| `PATCH` | `/settings/:key` | Update setting | `{ value }` | `{ data: SystemSetting }` |

```typescript
interface SystemSetting {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json'
  category: string
  description: string | null
}
```

## 6.10 Analytics Module

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/analytics/growth` | Growth metrics | `{ data: GrowthData[] }` |
| `GET` | `/analytics/sentiment` | Sentiment analysis | `{ data: SentimentData[] }` |
| `GET` | `/analytics/topics` | Topic distribution | `{ data: TopicData[] }` |
| `GET` | `/analytics/spam` | Spam trends | `{ data: SpamData[] }` |
| `GET` | `/analytics/delivery` | Message delivery | `{ data: DeliveryData[] }` |

## 6.11 Chat Logs Module

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/chat-logs` | List chat logs | `{ data: ChatLog[] }` |
| `GET` | `/chat-logs/:id` | Get chat log detail | `{ data: ChatLog }` |
| `GET` | `/chat-logs/member/:memberId` | Member's chat logs | `{ data: ChatLog[] }` |

```typescript
interface ChatLog {
  id: string
  group_id: string
  group_name: string
  member_id: string
  member_name: string
  direction: 'inbound' | 'outbound'
  content: string
  message_type: 'text' | 'image' | 'video' | 'document' | 'audio'
  is_from_ai: boolean
  sentiment: 'positive' | 'neutral' | 'negative' | null
  topic: string | null
  is_spam: boolean
  is_flagged: boolean
  sent_at: string
}
```

## 6.12 Integrations Module

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/integrations` | List integrations | `{ data: Integration[] }` |
| `POST` | `/integrations/:id/refresh` | Refresh/sync | `{ data: Integration }` |

```typescript
interface Integration {
  id: string
  name: string
  type: 'whatsapp' | 'openrouter' | 'n8n' | 'postgresql' | 'redis' | 'openai'
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, unknown>
  last_synced_at: string | null
}
```

## 6.13 Workflow Module

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/workflows` | List workflow runs | `{ data: WorkflowRun[] }` |
| `POST` | `/workflows/:id/retry` | Retry workflow | `{ data: WorkflowRun }` |

```typescript
interface WorkflowRun {
  id: string
  name: string
  trigger_type: 'webhook' | 'schedule' | 'manual'
  status: 'running' | 'success' | 'failed' | 'timeout'
  input_data: unknown
  output_data: unknown
  error_message: string | null
  duration_ms: number | null
  started_at: string
  completed_at: string | null
}
```

## 6.14 Audit Logs Module

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/audit-logs` | List audit logs | `{ data: AuditLog[] }` |

```typescript
interface AuditLog {
  id: string
  admin_id: string
  admin_name: string
  action: string
  entity_type: string
  entity_id: string | null
  before_data: unknown | null
  after_data: unknown | null
  ip_address: string | null
  created_at: string
}
```

---

# 7. WhatsApp Integration (Evolution API)

## 7.1 Overview

Backend menggunakan **Evolution API** sebagai WhatsApp gateway. Evolution API mendukung:
- **Baileys** (WhatsApp Web API) — gratis, unlimited
- **WhatsApp Cloud API** — official Meta API

Untuk MVP, gunakan **Baileys** (free, no Meta approval needed).

## 7.2 Evolution API Integration Architecture

```
Wahub Backend
    │
    ├── REST API calls to Evolution API
    │     ├── POST /instance/create          (create WA instance)
    │     ├── GET  /instance/connectionState  (check connection)
    │     ├── POST /instance/connect          (get QR code)
    │     ├── POST /message/sendText          (send text)
    │     ├── POST /message/sendMedia         (send media)
    │     ├── GET  /chat/findContacts         (list contacts)
    │     └── GET  /group/fetchGroups         (list groups)
    │
    └── Webhook receiver (from Evolution API)
          ├── messages.upsert               (new message)
          ├── messages.update               (message status)
          ├── participant.update            (member join/leave)
          ├── group.update                  (group metadata change)
          └── connection.update             (connection status)
```

## 7.3 Evolution API Endpoints Used

### Instance Management
```typescript
// Create instance
POST /instance/create
Body: {
  instanceName: string,
  number: string,
  integration: 'WHATSAPP-BAILEYS' | 'WHATSAPP-CLOUD-API',
  qrcode: boolean,
  reject_call: boolean,
  groups_ignore: boolean,
  always_online: boolean,
  webhook: {
    url: string,
    by_events: boolean,
    base64: boolean,
    events: [
      'messages.upsert',
      'messages.update',
      'participant.update',
      'group.update',
      'connection.update'
    ]
  }
}

// Get connection state
GET /instance/connectionState/{instanceName}

// Connect (get QR)
POST /instance/connect/{instanceName}
Response: { base64: string }  // QR code

// Get instances
GET /instance/fetchInstances
```

### Messaging
```typescript
// Send text message
POST /message/sendText/{instanceName}
Body: {
  number: string,         // group JID for group message
  text: string,
  delay?: number          // typing simulation ms
}

// Send media
POST /message/sendMedia/{instanceName}
Body: {
  number: string,
  mediatype: 'image' | 'video' | 'document' | 'audio',
  mimetype: string,
  media: string,          // base64 or URL
  caption?: string
}

// Send mentions
POST /message/sendText/{instanceName}
Body: {
  number: string,
  text: string,
  mentions?: { mention: string[] }
}
```

### Groups
```typescript
// Fetch all groups
GET /group/fetchGroups/{instanceName}

// Get group info
GET /group/findGroupInfo/{instanceName}/{groupJid}

// Get group members
GET /group/participants/{instanceName}/{groupJid}

// Create group
POST /group/create/{instanceName}
Body: {
  subject: string,
  participants: string[]
}

// Update group description
PUT /group/updateGroupInfo/{instanceName}/{groupJid}
Body: { description: string }

// Get invite code
GET /group/inviteCode/{instanceName}/{groupJid}
```

### Webhook Events
```typescript
// messages.upsert — incoming message
{
  key: {
    remoteJid: string,    // group JID or private chat
    fromMe: boolean,
    id: string
  },
  pushName: string,       // sender display name
  message: {
    conversation?: string,
    extendedTextMessage?: { text: string },
    imageMessage?: { caption?: string },
    videoMessage?: { caption?: string },
    documentMessage?: { fileName: string }
  },
  messageType: string,
  messageTimestamp: number,
  instanceName: string
}

// participant.update — member join/leave
{
  groupJid: string,
  participant: string,    // phone number
  action: 'add' | 'remove',
  timestamp: number
}

// group.update — group metadata change
{
  groupJid: string,
  subject?: string,
  description?: string
}

// connection.update — connection status
{
  instance: string,
  state: 'open' | 'close',
  statusReason: number
}
```

## 7.4 Webhook Handler

Backend harus menyediakan endpoint untuk menerima webhook dari Evolution API:

```
POST /webhook/evolution
```

Event routing:
```typescript
switch (event) {
  case 'messages.upsert':
    → Log message to chat_logs
    → Check if spam (AI moderation)
    → Check if FAQ keyword match
    → Check if escalation needed
    → Trigger n8n workflow (if configured)
    → Send AI response (if applicable)

  case 'participant.update':
    → Log member join/leave
    → Update member_count in groups
    → Trigger welcome automation (if action === 'add')
    → Remove from group_members (if action === 'remove')

  case 'group.update':
    → Sync group metadata in DB

  case 'connection.update':
    → Update integration status
    → Notify admin if disconnected
}
```

---

# 8. Authentication & Authorization

## 8.1 JWT Flow

```
POST /api/v1/auth/login
  → Validate email + password (bcrypt)
  → Generate JWT (expires in 24h)
  → Return { token, user }

GET /api/v1/auth/me
  → Validate JWT from Authorization header
  → Return user data + permissions
```

## 8.2 Role-Permission Matrix

| Permission | super_admin | business_manager | area_manager | support | viewer |
|-----------|:-----------:|:----------------:|:------------:|:-------:|:------:|
| admin.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin.create | ✓ | ✓ | - | - | - |
| admin.edit | ✓ | ✓ | - | - | - |
| admin.delete | ✓ | - | - | - | - |
| member.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| member.create | ✓ | ✓ | ✓ | - | - |
| member.edit | ✓ | ✓ | ✓ | - | - |
| member.warning | ✓ | ✓ | ✓ | ✓ | - |
| group.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| group.create | ✓ | ✓ | - | - | - |
| group.edit | ✓ | ✓ | ✓ | - | - |
| group.ai_control | ✓ | ✓ | - | - | - |
| community.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| community.create | ✓ | ✓ | - | - | - |
| broadcast.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| broadcast.create | ✓ | ✓ | - | - | - |
| broadcast.approve | ✓ | ✓ | - | - | - |
| moderation.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| moderation.approve | ✓ | ✓ | ✓ | ✓ | - |
| moderation.reject | ✓ | ✓ | ✓ | ✓ | - |
| moderation.execute | ✓ | ✓ | - | - | - |
| escalation.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| escalation.assign | ✓ | ✓ | - | - | - |
| escalation.update | ✓ | ✓ | ✓ | ✓ | - |
| dashboard.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| dashboard.analytics | ✓ | ✓ | ✓ | - | - |
| settings.view | ✓ | ✓ | - | - | - |
| settings.edit | ✓ | - | - | - | - |
| audit.view | ✓ | ✓ | - | - | - |
| integration.view | ✓ | ✓ | ✓ | - | - |
| integration.refresh | ✓ | ✓ | - | - | - |

---

# 9. Project Structure

```
wahub-backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Drizzle client + pg pool
│   │   ├── redis.ts             # Redis client
│   │   ├── env.ts               # Environment variables
│   │   └── cors.ts              # CORS config
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT verification
│   │   ├── permission.middleware.ts  # Role-based access
│   │   ├── validate.middleware.ts    # Zod validation
│   │   ├── error.middleware.ts       # Global error handler
│   │   └── audit.middleware.ts       # Audit logging
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.schema.ts
│   │   │
│   │   ├── admins/
│   │   │   ├── admins.controller.ts
│   │   │   ├── admins.service.ts
│   │   │   ├── admins.routes.ts
│   │   │   └── admins.schema.ts
│   │   │
│   │   ├── members/
│   │   │   ├── members.controller.ts
│   │   │   ├── members.service.ts
│   │   │   ├── members.routes.ts
│   │   │   └── members.schema.ts
│   │   │
│   │   ├── groups/
│   │   │   ├── groups.controller.ts
│   │   │   ├── groups.service.ts
│   │   │   ├── groups.routes.ts
│   │   │   └── groups.schema.ts
│   │   │
│   │   ├── communities/
│   │   │   ├── communities.controller.ts
│   │   │   ├── communities.service.ts
│   │   │   ├── communities.routes.ts
│   │   │   └── communities.schema.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── dashboard.service.ts
│   │   │   └── dashboard.routes.ts
│   │   │
│   │   ├── broadcasts/
│   │   │   ├── broadcasts.controller.ts
│   │   │   ├── broadcasts.service.ts
│   │   │   ├── broadcasts.routes.ts
│   │   │   └── broadcasts.schema.ts
│   │   │
│   │   ├── moderation/
│   │   │   ├── moderation.controller.ts
│   │   │   ├── moderation.service.ts
│   │   │   ├── moderation.routes.ts
│   │   │   └── moderation.schema.ts
│   │   │
│   │   ├── escalations/
│   │   │   ├── escalations.controller.ts
│   │   │   ├── escalations.service.ts
│   │   │   ├── escalations.routes.ts
│   │   │   └── escalations.schema.ts
│   │   │
│   │   ├── chat-logs/
│   │   │   ├── chat-logs.controller.ts
│   │   │   ├── chat-logs.service.ts
│   │   │   └── chat-logs.routes.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── analytics.routes.ts
│   │   │
│   │   ├── settings/
│   │   │   ├── settings.controller.ts
│   │   │   ├── settings.service.ts
│   │   │   ├── settings.routes.ts
│   │   │   └── settings.schema.ts
│   │   │
│   │   ├── integrations/
│   │   │   ├── integrations.controller.ts
│   │   │   ├── integrations.service.ts
│   │   │   └── integrations.routes.ts
│   │   │
│   │   ├── workflows/
│   │   │   ├── workflows.controller.ts
│   │   │   ├── workflows.service.ts
│   │   │   └── workflows.routes.ts
│   │   │
│   │   └── audit-logs/
│   │       ├── audit-logs.controller.ts
│   │       ├── audit-logs.service.ts
│   │       └── audit-logs.routes.ts
│   │
│   ├── services/
│   │   ├── evolution.service.ts    # Evolution API client
│   │   ├── ai.service.ts           # OpenAI / OpenRouter
│   │   ├── webhook.service.ts      # Webhook handler
│   │   ├── scheduler.service.ts    # node-cron jobs
│   │   └── notification.service.ts # Admin notifications
│   │
│   ├── utils/
│   │   ├── api-response.ts         # Standard response format
│   │   ├── password.ts             # Bcrypt helpers
│   │   ├── jwt.ts                  # JWT helpers
│   │   ├── pagination.ts           # Pagination helper
│   │   └── logger.ts               # Winston/Pino logger
│   │
│   ├── app.ts                      # Express app setup
│   └── server.ts                   # Entry point
│
├── drizzle/
│   ├── schema.ts                  # Database schema (Drizzle)
│   ├── migrations/                # Auto-generated migrations
│   └── seed.ts                    # Seed data
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

---

# 10. Docker Compose Configuration

```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: wahub
      POSTGRES_USER: wahub
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes:
      - redisdata:/data

  evolution-api:
    image: evoapicloud/evolution-api:latest
    ports: ["8080:8080"]
    environment:
      SERVER_TYPE: http
      SERVER_PORT: 8080
      DATABASE_ENABLED: "false"
      CACHE_REDIS_ENABLED: "true"
      CACHE_REDIS_URI: redis://redis:6379
      AUTHENTICATION_API_KEY: ${EVOLUTION_API_KEY}
    depends_on:
      - redis

  wahub-backend:
    build: .
    ports: ["3000:3000"]
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://wahub:${DB_PASSWORD}@postgres:5432/wahub
      REDIS_URL: redis://redis:6379
      EVOLUTION_API_URL: http://evolution-api:8080
      EVOLUTION_API_KEY: ${EVOLUTION_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      - redis
      - evolution-api
    command: >
      sh -c "npx drizzle-kit push && node dist/server.js"

volumes:
  pgdata:
  redisdata:
```

---

# 11. Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://wahub:password@localhost:5432/wahub

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-evolution-api-key

# AI/LLM
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4o-mini
# atau
OPENROUTER_API_KEY=sk-or-xxx
OPENROUTER_MODEL=openai/gpt-4o-mini

# Frontend CORS
FRONTEND_URL=http://localhost:5173
```

---

# 12. API Response Envelope

Semua response mengikuti format standar:

### Success
```json
{
  "data": { ... }
}
```

### Success List (with pagination)
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### Error
```json
{
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Email is required",
      "field": "email"
    }
  ]
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

---

# 13. Implementation Phases

## Phase 1 — Foundation (Week 1-2)
- [ ] Project setup (Express + TypeScript + Drizzle ORM)
- [ ] PostgreSQL schema + migrations
- [ ] Auth module (login, JWT, RBAC)
- [ ] Admins CRUD
- [ ] Members CRUD
- [ ] Docker Compose setup

## Phase 2 — Core Business (Week 3-4)
- [ ] Communities & Groups CRUD
- [ ] Evolution API integration (instance, messaging, groups)
- [ ] Webhook handler (messages, participants)
- [ ] Chat logs storage
- [ ] Group metrics calculation

## Phase 3 — Automation (Week 5-6)
- [ ] AI service integration (OpenAI/OpenRouter)
- [ ] Welcome automation (on member join)
- [ ] FAQ automation (keyword detection)
- [ ] Moderation alerts (spam, flood, toxic)
- [ ] Escalation workflow

## Phase 4 — Advanced Features (Week 7-8)
- [ ] Broadcast management (create, approve, send)
- [ ] Dashboard analytics aggregation
- [ ] Settings management
- [ ] Audit logging
- [ ] Workflow run tracking

## Phase 5 — Polish & Deploy (Week 9-10)
- [ ] Integration status monitoring
- [ ] Scheduled jobs (daily summary)
- [ ] Error handling & logging
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Docker production deployment
- [ ] Frontend integration testing

---

# 14. Non-Functional Requirements

## Performance
- API response time < 200ms (p95)
- Support 100+ concurrent users
- Database connection pooling via PostgreSQL driver (pg)

## Security
- JWT with 24h expiration
- bcrypt password hashing (12 rounds)
- CORS whitelist (frontend URL only)
- Rate limiting (100 req/min per IP)
- Input validation on all endpoints (Zod)
- SQL injection prevention (Drizzle parameterized queries)

## Reliability
- Graceful error handling
- Database transaction support
- Retry mechanism for Evolution API calls
- Health check endpoint (`GET /health`)

## Observability
- Structured logging (JSON)
- Request ID tracking
- Audit trail for all mutations
- Error alerting

---

# 15. API Documentation

Backend akan menyediakan OpenAPI 3.0 spec yang bisa diakses di:
```
GET /api/docs
```

Swagger UI available at:
```
GET /api/docs/ui
```

---

# 16. References

| Resource | URL |
|----------|-----|
| Evolution API GitHub | https://github.com/evolution-foundation/evolution-api |
| Evolution API Docs | https://docs.evolutionfoundation.com.br |
| Drizzle ORM Docs | https://orm.drizzle.team/docs |
| Express.js Docs | https://expressjs.com |
| WhatsApp Baileys | https://github.com/WhiskeySockets/Baileys |
| Meta Cloud API | https://developers.facebook.com/docs/whatsapp/cloud-api |

---

End of Document
