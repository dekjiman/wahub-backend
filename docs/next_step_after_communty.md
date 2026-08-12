# next_step_after_communty.md

> **Project:** Limestone Hub — WhatsApp Community Automation  
> **Document Type:** Execution Plan / Next Development Steps  
> **Status:** Ready for Implementation  
> **Audience:** AI Coding Agent, Junior Developer, Backend Developer, QA  
> **Backend:** Node.js + Express.js  
> **Database:** PostgreSQL  
> **WhatsApp Connector:** Evolution Go  
> **Current Achievement:** Create Community ✅, Create Group ✅

---

# 1. Tujuan

Dokumen ini menjelaskan langkah teknis **setelah Create Community dan Create Group sudah berhasil**.

Prioritas berikutnya **bukan langsung AI, analytics, atau dashboard besar**. Yang harus dibuktikan dulu adalah satu vertical slice end-to-end:

```text
Community
  ↓
Group
  ↓
Participant / Member
  ↓
Incoming Message
  ↓
Evolution Go
  ↓
Express Webhook
  ↓
PostgreSQL
  ↓
REST API
```

Setelah pipeline ini stabil, baru lanjut:

```text
n8n
↓
AI Analysis
↓
Moderation
↓
Escalation
↓
Onboarding
↓
Broadcast / Reminder
↓
Vue Dashboard
↓
Analytics
```

---

# 2. Kondisi Saat Ini

## Sudah Berhasil

- [x] Backend Node.js.
- [x] Express.js.
- [x] PostgreSQL.
- [x] Integrasi Evolution Go.
- [x] Create Community.
- [x] Create Group.

## Belum Dikerjakan / Belum Jadi Prioritas

- [ ] Read/List Community.
- [ ] Read/List Group.
- [ ] Sync ke PostgreSQL.
- [ ] Read/sync participant.
- [ ] Webhook real-time.
- [ ] Incoming message persistence.
- [ ] Outgoing message wrapper.
- [ ] Member lifecycle.
- [ ] n8n.
- [ ] AI moderation.
- [ ] Escalation.
- [ ] Onboarding.
- [ ] Broadcast/reminder.
- [ ] Vue operational dashboard.
- [ ] Analytics.

---

# 3. Prinsip Arsitektur

| Komponen | Tanggung Jawab |
|---|---|
| Evolution Go | Transport WhatsApp / Community / Group / Message |
| Express.js | API utama, business logic, webhook ingress |
| PostgreSQL | System of Record |
| Redis | Optional: cache, lock, rate limit, queue |
| n8n | Orchestration / workflow automation |
| OpenRouter / AI Provider | Classification, sentiment, moderation recommendation |
| Vue.js | Dashboard admin |

## Aturan Penting

Jangan jadikan n8n sebagai database.

Benar:

```text
n8n
  ↓
Express Internal API
  ↓
PostgreSQL
```

Hindari:

```text
n8n
  ↓
INSERT langsung ke banyak tabel PostgreSQL
```

Tujuan:

- business rule satu tempat;
- audit lebih mudah;
- junior developer mudah memahami flow;
- AI agent murah tidak membuat logic tersebar;
- perubahan workflow tidak merusak database.

---

# 4. Urutan Milestone

```text
M1  Read / List Community
 ↓
M2  Read / List Group
 ↓
M3  Sync Community & Group ke PostgreSQL
 ↓
M4  Read / Sync Participants
 ↓
M5  Webhook Receiver
 ↓
M6  Incoming Message Persistence
 ↓
M7  Outgoing Message Wrapper
 ↓
M8  Participant Lifecycle
 ↓
M9  Community Reconciliation / Sync Worker
 ↓
M10 n8n Integration
 ↓
M11 AI Analysis
 ↓
M12 Human-in-the-Loop Moderation
 ↓
M13 Escalation
 ↓
M14 Onboarding
 ↓
M15 Broadcast / Reminder
 ↓
M16 Vue Operational Dashboard
 ↓
M17 Analytics
```

---

# 5. Target Vertical Slice Pertama

Gunakan satu group test.

Member mengirim:

```text
Halo semuanya, apakah minggu depan ada acara gathering?
```

Target:

```text
WhatsApp
  ↓
Evolution Go
  ↓
POST /api/v1/webhooks/evolution-go
  ↓
Validate
  ↓
Deduplicate
  ↓
Normalize payload
  ↓
Insert webhook_events
  ↓
Insert chat_messages
  ↓
HTTP 200
```

Lalu:

```http
GET /api/v1/groups/:groupId/messages
```

harus menampilkan pesan tersebut.

> Jika ini belum stabil, **jangan lanjut ke AI**.

---

# 6. M1 — Read / List Community

## Objective

Backend dapat membaca Community melalui Evolution Go.

## Endpoint

```http
GET /api/v1/whatsapp/communities
```

Flow:

```text
Client
 ↓
Express
 ↓
EvolutionGoService
 ↓
Evolution Go
 ↓
Mapper / Normalizer
 ↓
Return JSON
```

Contoh response aplikasi:

```json
{
  "success": true,
  "data": [
    {
      "externalId": "community-jid",
      "name": "Limestones",
      "description": null,
      "isActive": true
    }
  ]
}
```

### Rules

- Jangan expose raw Evolution Go payload langsung ke frontend.
- Gunakan `externalId` sebagai identifier integration.
- Jangan gunakan nama Community sebagai unique key.

### Definition of Done

- [ ] Community dapat dibaca.
- [ ] Response normalized.
- [ ] Timeout provider ditangani.
- [ ] Error provider ditangani.
- [ ] Credential tidak hardcoded.
- [ ] Existing Create Community tetap bekerja.
- [ ] Test tersedia.

---

# 7. M2 — Read / List Groups

Endpoint:

```http
GET /api/v1/whatsapp/groups
```

Optional:

```http
GET /api/v1/whatsapp/groups?communityExternalId=xxx
```

Internal type minimal:

```ts
type WhatsAppGroup = {
  externalId: string;
  communityExternalId?: string | null;
  name: string;
  description?: string | null;
  participantCount?: number;
  isAnnouncement?: boolean;
  isActive: boolean;
};
```

### Identifier Rule

Salah:

```text
unique = "Pitch & New Business"
```

Benar:

```text
unique = external_group_jid
```

---

# 8. M3 — Sync Community & Group ke PostgreSQL

## Tabel `whatsapp_instances`

```sql
CREATE TABLE whatsapp_instances (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'evolution_go',
    external_instance_id VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'unknown',
    phone_number VARCHAR(30),
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Tabel `communities`

```sql
CREATE TABLE communities (
    id UUID PRIMARY KEY,
    whatsapp_instance_id UUID NOT NULL REFERENCES whatsapp_instances(id),
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(whatsapp_instance_id, external_id)
);
```

## Tabel `groups`

```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY,
    whatsapp_instance_id UUID NOT NULL REFERENCES whatsapp_instances(id),
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    participant_count INTEGER NOT NULL DEFAULT 0,
    is_announcement BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(whatsapp_instance_id, external_id)
);
```

## Tabel `community_groups`

```sql
CREATE TABLE community_groups (
    id UUID PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(community_id, group_id)
);
```

## Sync Rule

```text
Fetch Communities
 ↓
UPSERT communities
 ↓
Fetch Groups
 ↓
UPSERT groups
 ↓
Map community_groups
 ↓
Update last_sync_at
```

Jika group hilang saat sync:

```text
is_active = false
```

Jangan langsung DELETE.

---

# 9. M4 — Participant Sync

## `members`

```sql
CREATE TABLE members (
    id UUID PRIMARY KEY,
    external_id VARCHAR(255),
    phone_number VARCHAR(30),
    display_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## `group_members`

```sql
CREATE TABLE group_members (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL DEFAULT 'member',
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, member_id)
);
```

### Important

Evolution Go dapat menggunakan JID/LID.

- Simpan identifier external apa adanya.
- Jangan menebak mapping ke nomor telepon.
- Jangan create member duplicate setiap sync.

---

# 10. M5 — Webhook Receiver

Endpoint:

```http
POST /api/v1/webhooks/evolution-go
```

Pattern:

```text
Evolution Go
 ↓
Validate request
 ↓
Read / generate event ID
 ↓
Check duplicate
 ↓
Save raw webhook
 ↓
Respond HTTP 200
 ↓
Process async
```

Target response sebaiknya < 1 detik jika memungkinkan.

---

# 11. Tabel `webhook_events`

```sql
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    instance_id UUID REFERENCES whatsapp_instances(id),
    external_event_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'received',
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_events_status
ON webhook_events(status);

CREATE INDEX idx_webhook_events_event_type
ON webhook_events(event_type);
```

Jika external event ID stabil:

```sql
CREATE UNIQUE INDEX uq_webhook_external_event
ON webhook_events(provider, external_event_id)
WHERE external_event_id IS NOT NULL;
```

---

# 12. Event Normalization Layer

Jangan gunakan payload Evolution Go langsung di seluruh aplikasi.

Buat internal event:

```ts
type InternalWhatsAppEvent =
  | {
      type: 'message.received';
      instanceExternalId: string;
      groupExternalId: string | null;
      senderExternalId: string;
      externalMessageId: string;
      messageType: string;
      text: string | null;
      timestamp: string;
      raw: unknown;
    }
  | {
      type: 'participant.joined';
      instanceExternalId: string;
      groupExternalId: string;
      participantExternalId: string;
      timestamp: string;
      raw: unknown;
    }
  | {
      type: 'participant.left';
      instanceExternalId: string;
      groupExternalId: string;
      participantExternalId: string;
      timestamp: string;
      raw: unknown;
    };
```

Recommended files:

```text
src/integrations/evolution-go/
  evolution.client.ts
  evolution.service.ts
  evolution.mapper.ts
  evolution.types.ts
```

> Jika payload belum diketahui, capture payload asli. **Jangan menebak field.**

---

# 13. M6 — Incoming Message Persistence

## `chat_messages`

```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    whatsapp_instance_id UUID NOT NULL REFERENCES whatsapp_instances(id),
    community_id UUID REFERENCES communities(id),
    group_id UUID REFERENCES groups(id),
    member_id UUID REFERENCES members(id),
    external_message_id VARCHAR(255),
    direction VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    text_content TEXT,
    media_url TEXT,
    quoted_external_message_id VARCHAR(255),
    raw_payload JSONB,
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_group_time
ON chat_messages(group_id, received_at DESC);

CREATE INDEX idx_chat_messages_member_time
ON chat_messages(member_id, received_at DESC);

CREATE UNIQUE INDEX uq_chat_messages_external_id
ON chat_messages(whatsapp_instance_id, external_message_id)
WHERE external_message_id IS NOT NULL;
```

---

# 14. Message API

```http
GET /api/v1/groups/:groupId/messages
```

Query example:

```text
?page=1&limit=50&direction=inbound&type=text
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "groupId": "uuid",
      "sender": {
        "id": "uuid",
        "name": "Budi"
      },
      "direction": "inbound",
      "type": "text",
      "text": "Halo semuanya",
      "receivedAt": "2026-08-12T04:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1
  }
}
```

---

# 15. M7 — Outgoing Message Wrapper

Jangan panggil Evolution Go dari banyak controller.

Buat satu service:

```text
WhatsAppMessageService
```

Method:

```ts
sendText()
sendImage()
sendDocument()
sendGroupText()
```

Endpoint:

```http
POST /api/v1/groups/:groupId/messages
```

Body:

```json
{
  "type": "text",
  "text": "Halo member Limestones!"
}
```

Flow:

```text
Controller
 ↓
WhatsAppMessageService
 ↓
EvolutionGoAdapter
 ↓
Evolution Go
 ↓
Store outbound result
```

---

# 16. Simple Outbox Pattern

Untuk fase awal gunakan PostgreSQL outbox.

```sql
CREATE TABLE outbound_messages (
    id UUID PRIMARY KEY,
    whatsapp_instance_id UUID NOT NULL REFERENCES whatsapp_instances(id),
    group_id UUID REFERENCES groups(id),
    member_id UUID REFERENCES members(id),
    message_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    external_message_id VARCHAR(255),
    retry_count INTEGER NOT NULL DEFAULT 0,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Status:

```text
pending
processing
sent
failed
cancelled
```

Belum perlu Kafka/RabbitMQ jika traffic masih kecil.

---

# 17. M8 — Participant Lifecycle

Test event:

- [ ] Join.
- [ ] Leave.
- [ ] Remove.
- [ ] Promote admin.
- [ ] Demote admin.
- [ ] Group update.
- [ ] Group unavailable/deleted.

Flow:

```text
Webhook
 ↓
Normalize
 ↓
ParticipantService
 ↓
UPSERT Member
 ↓
UPSERT group_members
 ↓
Audit
```

---

# 18. M9 — Reconciliation / Sync Worker

Webhook = realtime.

Sync = repair / consistency check.

Awal cukup setiap:

```text
10–30 menit
```

Gunakan salah satu:

```text
node-cron
```

atau:

```text
n8n Schedule Trigger
```

**Jangan menjalankan job yang sama di dua tempat.**

Flow:

```text
Scheduler
 ↓
Fetch communities
 ↓
Fetch groups
 ↓
Fetch participants
 ↓
Compare DB
 ↓
UPSERT
 ↓
Mark stale
```

---

# 19. M10 — Integrasi n8n

Hanya setelah message ingestion stabil.

Internal API:

```http
GET  /api/internal/events/:id
POST /api/internal/ai-analyses
POST /api/internal/moderation-alerts
POST /api/internal/escalations
POST /api/internal/workflow-runs
```

Security minimal:

```http
Authorization: Bearer INTERNAL_SERVICE_TOKEN
```

---

# 20. n8n Workflow Pertama

Nama:

```text
WF-01 Incoming Message Analysis
```

Flow:

```text
Express
 ↓
Trigger n8n
 ↓
GET event detail dari Express
 ↓
Check event = message.received
 ↓
Check text available
 ↓
Call AI
 ↓
Validate result
 ↓
POST result ke Express
```

---

# 21. M11 — AI Analysis

```sql
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    provider VARCHAR(100),
    model VARCHAR(100),
    is_spam BOOLEAN,
    violation_type VARCHAR(100),
    sentiment VARCHAR(30),
    category VARCHAR(100),
    needs_escalation BOOLEAN NOT NULL DEFAULT FALSE,
    confidence NUMERIC(5,4),
    reasoning TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Expected AI result:

```json
{
  "is_spam": false,
  "violation_type": null,
  "sentiment": "neutral",
  "category": "question",
  "needs_escalation": false,
  "confidence": 0.93,
  "reasoning": "Member menanyakan jadwal kegiatan."
}
```

---

# 22. AI Guardrail — Shadow Mode

Fase awal:

```text
AI Detect
 ↓
AI Recommendation
 ↓
Moderation Alert
 ↓
Admin Review
 ↓
Approve / Reject
 ↓
Execute
```

AI belum boleh auto-delete / auto-remove pada pilot pertama.

---

# 23. M12 — Moderation Alert

```sql
CREATE TABLE moderation_alerts (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES chat_messages(id),
    ai_analysis_id UUID REFERENCES ai_analyses(id),
    group_id UUID REFERENCES groups(id),
    member_id UUID REFERENCES members(id),
    risk_level VARCHAR(30),
    violation_type VARCHAR(100),
    recommendation VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'pending_review',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Status:

```text
pending_review
approved
rejected
ignored
executed
failed
```

---

# 24. M13 — Escalation

```sql
CREATE TABLE escalations (
    id UUID PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    group_id UUID REFERENCES groups(id),
    member_id UUID REFERENCES members(id),
    message_id UUID REFERENCES chat_messages(id),
    category VARCHAR(100),
    summary TEXT NOT NULL,
    priority VARCHAR(30) NOT NULL DEFAULT 'medium',
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    assigned_to UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
```

Priority:

```text
low
medium
high
urgent
```

---

# 25. M14 — Onboarding

Dikerjakan setelah participant event stabil.

```text
participant.joined
 ↓
Member exists?
 ↓
Create/update member
 ↓
Create group_members
 ↓
Trigger onboarding
 ↓
Send welcome
 ↓
Store onboarding status
```

Tambahkan:

```text
members.is_onboarded
members.onboarded_at
```

---

# 26. M15 — Broadcast / Reminder

Pilot bertahap:

```text
5 recipients
 ↓
20
 ↓
100
 ↓
500
```

Gunakan queue/outbox.

Tambahkan:

```text
broadcasts
broadcast_recipients
```

Jangan blast ribuan pesan dalam satu request.

---

# 27. M16 — Vue Operational Dashboard

Dashboard setelah backend vertical slice stabil.

Urutan screen:

```text
1. Login
2. Dashboard
3. Communities
4. Community Detail
5. Groups
6. Group Detail
7. Messages
8. Members
9. Moderation Alerts
10. Escalations
11. Broadcast
12. Automation
13. Analytics
14. Settings
```

Group Detail minimal:

```text
Group Name
Community
Participant Count
Connection Status
Last Sync
Recent Messages
Members
Moderation Alerts
```

---

# 28. Struktur Backend Sederhana

Jangan over-engineering.

```text
src/
├── app.ts
├── server.ts
├── config/
│   ├── env.ts
│   └── database.ts
├── routes/
│   ├── community.routes.ts
│   ├── group.routes.ts
│   ├── member.routes.ts
│   ├── message.routes.ts
│   └── webhook.routes.ts
├── controllers/
│   ├── community.controller.ts
│   ├── group.controller.ts
│   ├── member.controller.ts
│   ├── message.controller.ts
│   └── webhook.controller.ts
├── services/
│   ├── community.service.ts
│   ├── group.service.ts
│   ├── member.service.ts
│   ├── message.service.ts
│   ├── webhook.service.ts
│   └── sync.service.ts
├── repositories/
│   ├── community.repository.ts
│   ├── group.repository.ts
│   ├── member.repository.ts
│   └── message.repository.ts
├── integrations/
│   └── evolution-go/
│       ├── evolution.client.ts
│       ├── evolution.service.ts
│       ├── evolution.mapper.ts
│       └── evolution.types.ts
├── middlewares/
│   ├── error.middleware.ts
│   ├── auth.middleware.ts
│   └── request-id.middleware.ts
├── jobs/
│   ├── community-sync.job.ts
│   └── outbox.job.ts
└── utils/
    ├── logger.ts
    └── errors.ts
```

> Jika codebase existing sudah punya pola yang baik, **ikuti existing pattern**. Jangan refactor besar hanya agar sama dengan dokumen ini.

---

# 29. API Minimum

## Community

```http
GET  /api/v1/communities
GET  /api/v1/communities/:id
POST /api/v1/communities/sync
```

Existing create tetap dipertahankan.

## Groups

```http
GET  /api/v1/groups
GET  /api/v1/groups/:id
POST /api/v1/groups/sync
GET  /api/v1/groups/:id/members
GET  /api/v1/groups/:id/messages
POST /api/v1/groups/:id/messages
```

Existing create tetap dipertahankan.

## Members

```http
GET /api/v1/members
GET /api/v1/members/:id
GET /api/v1/members/:id/groups
```

## Webhook

```http
POST /api/v1/webhooks/evolution-go
```

## Health

```http
GET /health
GET /ready
GET /api/v1/whatsapp/status
```

---

# 30. Standard API Response

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "GROUP_NOT_FOUND",
    "message": "Group tidak ditemukan."
  },
  "requestId": "req_xxx"
}
```

Jangan kirim stack trace production ke client.

---

# 31. Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://...

EVOLUTION_GO_BASE_URL=http://...
EVOLUTION_GO_API_KEY=...

WEBHOOK_SECRET=...

N8N_BASE_URL=http://...
N8N_INTERNAL_TOKEN=...

OPENROUTER_API_KEY=...
```

Rules:

- `.env` jangan di-commit.
- Commit `.env.example`.
- Jangan hardcode secret.
- Jangan log secret.

---

# 32. Logging Minimum

Per HTTP request:

```text
requestId
method
path
status
duration
```

Per webhook:

```text
requestId
eventId
eventType
instanceId
status
```

---

# 33. Security Minimum

- [ ] Rate limit.
- [ ] Body validation.
- [ ] Helmet.
- [ ] CORS whitelist.
- [ ] Parameterized SQL / ORM.
- [ ] Webhook verification jika provider menyediakan secret/signature.
- [ ] Internal API authentication.
- [ ] Admin RBAC.
- [ ] Audit log.
- [ ] Secret via environment.
- [ ] PostgreSQL backup.
- [ ] No production stack trace.

---

# 34. Idempotency

Wajib untuk:

```text
webhook
incoming message
outgoing message
participant lifecycle
sync job
```

Contoh:

```text
external_message_id already exists?
      │
     yes
      │
      └── ignore duplicate
```

Mencegah:

```text
duplicate message
duplicate ticket
duplicate warning
duplicate member
```

---

# 35. Retry Strategy

Jangan retry tanpa batas.

```text
Attempt 1 → 5 detik
Attempt 2 → 30 detik
Attempt 3 → 2 menit
Attempt 4 → mark failed
```

Simpan:

```text
retry_count
error_message
failed_at
```

---

# 36. Testing Priority

## P0 — Wajib

- [ ] Existing Create Community tidak rusak.
- [ ] Existing Create Group tidak rusak.
- [ ] Read Community.
- [ ] Read Group.
- [ ] Community sync.
- [ ] Group sync.
- [ ] Participant sync.
- [ ] Receive message webhook.
- [ ] Duplicate webhook ignored.
- [ ] Message tersimpan PostgreSQL.
- [ ] Message list API.
- [ ] Send group message.
- [ ] Evolution Go offline handled.

## P1

- [ ] Participant join.
- [ ] Participant leave.
- [ ] Group update.
- [ ] Outgoing retry.
- [ ] Reconciliation.

## P2

- [ ] AI.
- [ ] Moderation.
- [ ] Escalation.
- [ ] Analytics.

---

# 37. Test Data

Gunakan test Community:

```text
Limestones Test
```

Group:

```text
Agent Test Group
```

Participants:

```text
Admin
Developer
QA/Test Number
```

Jangan test awal di seluruh Community production.

---

# 38. Deployment Stages

## Stage 1 — Local

```text
Node.js
PostgreSQL
Evolution Go test instance
```

## Stage 2 — Staging

```text
API staging
PostgreSQL staging
Evolution Go test/staging
n8n staging
```

## Stage 3 — Pilot

```text
1 Community
1–2 Groups
5–20 Members
```

## Stage 4 — Controlled Production

```text
1 Community
Selected Groups
```

## Stage 5 — Full Production

```text
All approved Communities / Groups
```

---

# 39. Jangan Over-Scale di Awal

Belum perlu:

- Kafka.
- Kubernetes.
- Microservices.
- ClickHouse.
- Elasticsearch.
- RabbitMQ jika traffic masih kecil.
- Data warehouse terpisah.

Mulai sederhana:

```text
Express
PostgreSQL
Evolution Go
n8n
```

Tambahkan Redis jika memang diperlukan untuk:

```text
rate limit
lock
cache
queue
```

---

# 40. Cost-Saving Rules

Gunakan:

```text
PostgreSQL sebagai system of record
PostgreSQL outbox untuk queue sederhana
node-cron ATAU n8n scheduler
1 backend service
1 PostgreSQL
1 n8n
```

Hindari:

```text
Kafka
multiple workers berlebihan
heavy observability SaaS
multiple database engine
AI pada semua jenis event
AI untuk system message
```

---

# 41. AI Cost Control

Pre-filter sebelum AI:

```text
Message received
 ↓
Text message?
 no → skip AI
 ↓
System message?
 yes → skip AI
 ↓
Very short / irrelevant?
 yes → skip AI
 ↓
Group excluded?
 yes → skip AI
 ↓
Human takeover active?
 yes → no auto action
 ↓
AI Analysis
```

---

# 42. Agent Execution Rules

## Rule 1 — Audit First

Sebelum coding, agent harus mencari:

```text
existing route
existing controller
existing service
existing Evolution Go client
existing createCommunity()
existing createGroup()
existing database schema
existing error handler
existing auth
existing tests
```

Jangan membuat duplicate implementation.

## Rule 2 — Jangan Rewrite Fitur yang Sudah Berhasil

Create Community dan Create Group sudah bekerja.

Agent **dilarang rewrite** kedua fitur tersebut kecuali ada bug terverifikasi.

## Rule 3 — One Milestone per Task

Contoh benar:

```text
Implement Community Read & Sync
```

Hindari:

```text
sync + AI + dashboard + analytics dalam satu task
```

## Rule 4 — Verification

Setelah setiap task:

1. lint;
2. typecheck jika TypeScript;
3. unit test;
4. integration test terkait;
5. regression test Create Community;
6. regression test Create Group.

## Rule 5 — Jangan Menebak Payload

Jika payload Evolution Go belum diketahui:

> Capture payload nyata dan jadikan fixture.

```text
tests/fixtures/evolution-go/
  community-list.json
  group-list.json
  message-received.json
  participant-joined.json
```

---

# 43. Junior Developer Rules

Jangan:

```text
controller berisi SQL panjang
controller call Evolution Go langsung
route berisi business logic
n8n menulis DB langsung
copy-paste API key
```

Gunakan:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Repository / Integration
```

Contoh:

```text
GET /groups
 ↓
group.routes
 ↓
group.controller
 ↓
group.service
 ↓
group.repository / EvolutionGoService
```

---

# 44. Task Breakdown

## TASK-001 — Audit Existing Integration

Output:

```text
docs/current-whatsapp-integration.md
```

Isi:

- existing Community endpoint;
- existing Group endpoint;
- Evolution Go client;
- auth mechanism;
- DB schema;
- env variables;
- coding pattern;
- existing tests.

## TASK-002 — List Community

```http
GET /api/v1/communities
```

## TASK-003 — List Groups

```http
GET /api/v1/groups
```

## TASK-004 — Community Sync

```http
POST /api/v1/communities/sync
```

## TASK-005 — Group Sync

```http
POST /api/v1/groups/sync
```

## TASK-006 — Participant Sync

```http
GET /api/v1/groups/:id/members
```

## TASK-007 — Webhook Ingress

```http
POST /api/v1/webhooks/evolution-go
```

## TASK-008 — Message Receiver

Persist ke `chat_messages`.

## TASK-009 — Message List API

```http
GET /api/v1/groups/:id/messages
```

## TASK-010 — Send Message

```http
POST /api/v1/groups/:id/messages
```

## TASK-011 — Participant Lifecycle

Join / leave / update.

## TASK-012 — Reconciliation Job

Community / group / participant sync.

## TASK-013 — n8n Hook

Hanya setelah TASK-001 s.d. TASK-012 stabil.

## TASK-014 — AI Analysis

## TASK-015 — Moderation Alert

## TASK-016 — Escalation

## TASK-017 — Onboarding

## TASK-018 — Broadcast / Reminder

## TASK-019 — Vue Operational Dashboard

---

# 45. Prompt Pertama untuk Coding Agent

```text
Baca file next_step_after_communty.md sampai selesai.

Kondisi saat ini:
- Backend Node.js + Express.js.
- Database PostgreSQL.
- WhatsApp menggunakan Evolution Go.
- Create Community sudah berhasil.
- Create Group sudah berhasil.

JANGAN mengubah atau rewrite Create Community dan Create Group yang sudah bekerja.

Kerjakan TASK-001 terlebih dahulu.

Tujuan TASK-001:
Audit implementasi WhatsApp/Evolution Go yang sudah ada.

Lakukan:
1. Temukan route/controller/service yang menangani Create Community.
2. Temukan route/controller/service yang menangani Create Group.
3. Temukan Evolution Go API client/config.
4. Audit schema database yang sudah ada.
5. Identifikasi coding pattern project.
6. Identifikasi environment variables terkait.
7. Identifikasi test yang sudah tersedia.

Output hanya:
docs/current-whatsapp-integration.md

Jangan implementasi fitur baru pada task ini.
Jangan refactor besar.
Jangan menghapus code existing.
Setelah selesai, laporkan file yang dianalisis dan gap yang ditemukan.
```

---

# 46. Prompt Setelah TASK-001

```text
Baca:
1. next_step_after_communty.md
2. docs/current-whatsapp-integration.md

Kerjakan TASK-002: Implement List Community.

Requirements:
- Ikuti architecture/code pattern existing.
- Jangan rewrite Create Community.
- Gunakan Evolution Go client existing.
- Normalize response sebelum dikirim ke frontend.
- Gunakan error handling existing.
- Tambahkan test.
- Jangan lanjut ke TASK-003.

Definition of Done:
- GET /api/v1/communities bekerja.
- Error provider ditangani.
- Test pass.
- Create Community existing tetap bekerja.
- Create Group existing tetap bekerja.

Setelah selesai, berikan summary file yang dibuat/diubah dan test result.
```

---

# 47. Mandatory Stop Points

Agent harus STOP untuk verifikasi manual setelah:

### Stop Point A

```text
List Community berhasil.
```

### Stop Point B

```text
List Group + Sync berhasil.
```

### Stop Point C

```text
Webhook message masuk PostgreSQL.
```

### Stop Point D

```text
Outgoing message berhasil.
```

### Stop Point E

```text
Participant join/leave berhasil.
```

Setelah itu baru AI.

---

# 48. Phase Completion Checklist

## PHASE A — Foundation

- [ ] Audit existing integration.
- [ ] Read Community.
- [ ] Read Group.
- [ ] PostgreSQL community sync.
- [ ] PostgreSQL group sync.
- [ ] Participant sync.

## PHASE B — Messaging

- [ ] Webhook receiver.
- [ ] Event normalization.
- [ ] Incoming message persistence.
- [ ] Outgoing message service.
- [ ] Retry.
- [ ] Idempotency.

## PHASE C — Lifecycle

- [ ] Join.
- [ ] Leave.
- [ ] Admin changes.
- [ ] Group changes.
- [ ] Reconciliation.

## PHASE D — Automation

- [ ] n8n event trigger.
- [ ] AI classification.
- [ ] Moderation alert.
- [ ] Escalation.
- [ ] Onboarding.
- [ ] Reminder.
- [ ] Broadcast.

## PHASE E — Admin Application

- [ ] Communities UI.
- [ ] Groups UI.
- [ ] Members UI.
- [ ] Messages UI.
- [ ] Moderation UI.
- [ ] Escalations UI.
- [ ] Analytics UI.

---

# 49. Final Execution Order

```text
CURRENT
│
├── Create Community ✅
├── Create Group ✅
│
▼
Audit Existing Code
│
▼
Read Community
│
▼
Read Group
│
▼
Sync PostgreSQL
│
▼
Participants
│
▼
Webhook
│
▼
Incoming Messages
│
▼
Outgoing Messages
│
▼
Participant Lifecycle
│
▼
Reconciliation
│
▼
n8n
│
▼
AI
│
▼
Moderation
│
▼
Escalation
│
▼
Onboarding
│
▼
Broadcast / Reminder
│
▼
Vue Operational Dashboard
│
▼
Analytics
│
▼
Production Pilot
```

---

# 50. Next Action Sekarang

**Jangan lanjut ke AI dahulu.**

Task berikutnya:

> **TASK-001 — Audit existing Evolution Go integration**, lalu **TASK-002 — Read/List Community**.

Vertical slice yang harus dibuktikan:

```text
Limestones Community
      ↓
Group
      ↓
Member
      ↓
Message
      ↓
Evolution Go
      ↓
Express Webhook
      ↓
PostgreSQL
      ↓
GET /api/v1/groups/:id/messages
```

Setelah pipeline ini stabil, n8n dan AI dapat ditambahkan tanpa membuat arsitektur rapuh.

---

# 51. Definition of Done Dokumen Ini

Dokumen dianggap selesai digunakan jika tim/agent:

1. Tidak merusak Create Community yang sudah berhasil.
2. Tidak merusak Create Group yang sudah berhasil.
3. Menyelesaikan data synchronization lebih dahulu.
4. Menyelesaikan webhook dan message persistence.
5. Membuktikan incoming/outgoing messaging.
6. Membuktikan participant lifecycle.
7. Baru menambahkan n8n.
8. Baru menambahkan AI.
9. AI berjalan dalam shadow mode pada pilot awal.
10. Semua data inti tetap melalui Express + PostgreSQL.

---

**END OF DOCUMENT**
