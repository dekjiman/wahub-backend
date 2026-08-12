# Product Requirements Document (PRD)

## WhatsApp Community & Group Automation Platform (MVP)

### Version
v0.1 (Demo / MVP)

### Document Status
Draft

### Owner
Product & Engineering

### Last Updated
10 August 2026

---

# 1. Product Overview

## Summary

Platform automation untuk mengelola WhatsApp Community dan Group menggunakan n8n sebagai orchestration engine dan Evolution API sebagai WhatsApp gateway. Sistem mampu menerima event dari beberapa grup WhatsApp, menjalankan workflow otomatis, memanggil AI/LLM, menyimpan data, dan mengirim respon kembali ke grup atau admin.

Fokus MVP adalah demonstrasi automation lintas grup di bawah satu community, termasuk welcome automation, FAQ automation, AI moderation, dan daily summary.

---

# 2. Goals

## Primary Goal

Membangun demo platform yang mampu mengotomasi operasional WhatsApp Community melalui workflow yang dapat dikonfigurasi.

## Success Criteria

- Terhubung ke minimal 1 WhatsApp account
- Mengelola minimal 3 grup dalam satu community
- Menjalankan automation secara real-time
- Menghasilkan daily summary otomatis
- Menampilkan analytics sederhana

---

# 3. Non-Goals (MVP)

- Pembuatan WhatsApp Community melalui API
- Multi-device synchronization management
- Billing & subscription
- Multi-tenant enterprise management
- Mobile application
- Advanced permission management

---

# 4. Users

## Community Admin

Mengelola seluruh grup di bawah community.

Kebutuhan:
- Monitoring aktivitas grup
- Mengirim announcement
- Menerima summary
- Moderasi otomatis

## Moderator

Mengelola satu atau beberapa grup.

Kebutuhan:
- Notifikasi spam
- Welcome member
- FAQ automation

## Community Member

Peserta grup.

Kebutuhan:
- Mendapat jawaban cepat
- Mendapat informasi community
- Interaksi yang lebih terstruktur

---

# 5. Core Use Cases

## UC-01 Welcome Automation

Trigger:
- Member baru bergabung ke grup

Flow:
- Ambil nama member
- Generate welcome message
- Mention member
- Kirim guideline grup

Output:

Selamat datang @Budi 👋
Silakan baca pinned message dan perkenalkan diri.

---

## UC-02 FAQ Automation

Trigger:
- Pesan masuk mengandung keyword tertentu

Contoh:
- cara daftar
- jadwal
- link
- dokumentasi

Flow:
- Deteksi keyword
- Ambil jawaban dari knowledge base
- Reply otomatis

---

## UC-03 AI Moderator

Trigger:
- Pesan spam
- Link berulang
- Flood message

Flow:
- Deteksi pelanggaran
- Hitung frekuensi
- Warn user
- Notify admin

---

## UC-04 Daily Summary

Trigger:
- Schedule (18:00)

Flow:
- Ambil pesan hari ini
- Ringkas menggunakan LLM
- Kirim ke grup admin / announcement

Output:

Ringkasan hari ini:
- 12 pertanyaan deployment
- 4 bug report
- 3 request fitur
- Topik populer: AI Gateway

---

## UC-05 Cross-Group Escalation

Trigger:
- AI mendeteksi topik tertentu

Contoh:
- bug
- pembayaran
- support

Flow:
- Ringkas pesan
- Forward ke grup terkait
- Mention moderator

---

# 6. Functional Requirements

## WhatsApp Gateway

- Connect via QR
- Receive message
- Receive group event
- Receive participant event
- Send message
- Send mention
- Get group metadata

## Workflow Engine

- Event-driven workflow
- Conditional routing
- Schedule workflow
- Retry mechanism
- Logging

## AI Integration

- LLM completion
- Summarization
- Classification
- Intent detection
- Toxicity detection (optional)

## Knowledge Base

- FAQ
- Documents
- Links
- Group-specific rules

## Storage

- Message log
- Event log
- Member activity
- Automation history

---

# 7. System Architecture

## High Level Architecture

WhatsApp App (Mobile)
        │
 Linked Devices (QR)
        │
Evolution API
        │
Webhook / REST API
        │
n8n Orchestrator
        │
 ┌─────────────┬──────────────┬──────────────┐
 │             │              │
LLM        PostgreSQL      Redis
 │             │              │
Analytics    Workflow      Cache
        │
Admin Dashboard (Future)

---

# 8. Technology Stack

## Core

### Orchestrator

n8n

Role:
- Workflow automation
- Routing
- Scheduling
- Integration hub

### WhatsApp Gateway

Evolution API v2

Role:
- WhatsApp connection
- Group events
- Messaging
- Participant events

### Database

PostgreSQL

Role:
- Messages
- Groups
- Communities
- Members
- Automation logs

### Cache

Redis

Role:
- Session cache
- Rate limit
- Temporary workflow state

### AI Layer

OpenAI API
atau
OpenRouter
atau
Local Ollama

Role:
- Summarization
- Classification
- FAQ
- Moderation

### Containerization

Docker Compose

Deployment:
- Single server
- Home server
- VPS
- Cloud VM

---

# 9. Data Model (Simplified)

## communities

- id
- name
- description

## groups

- id
- community_id
- whatsapp_group_jid
- name

## members

- id
- whatsapp_number
- display_name

## messages

- id
- group_id
- member_id
- content
- timestamp

## workflows

- id
- name
- trigger
- enabled

## automation_logs

- id
- workflow_id
- status
- execution_time

---

# 10. Event Flow

## Incoming Message

Evolution API
→ Webhook
→ n8n
→ Detect Group
→ Identify Community
→ Execute Workflow
→ AI / DB
→ Response
→ Evolution API
→ WhatsApp Group

## Member Join

Evolution API
→ participant.add
→ n8n
→ Fetch Member
→ Generate Welcome
→ Send Mention
→ Log Event

---

# 11. n8n Workflow Modules

## Workflow A

Welcome Member

Trigger:
participant.add

Steps:
1. Get group
2. Get member
3. Generate message
4. Send mention
5. Save log

---

## Workflow B

FAQ

Trigger:
message.upsert

Steps:
1. Detect keyword
2. Lookup FAQ
3. Generate answer
4. Reply
5. Log

---

## Workflow C

AI Summary

Trigger:
Cron 18:00

Steps:
1. Fetch today messages
2. Summarize
3. Format report
4. Send to announcement group

---

## Workflow D

Moderation

Trigger:
message.upsert

Steps:
1. Detect spam
2. Count frequency
3. Warn user
4. Notify admin
5. Save incident

---

# 12. MVP Demo Scenario

## Community

Tech Community

Groups:
- Announcements
- General Discussion
- AI Learning
- Product Feedback

## Demo Sequence

1. User joins AI Learning
2. Bot welcomes member
3. User asks:
   - cara deploy?
4. Bot answers from knowledge base
5. User sends repeated links
6. Moderator warning triggered
7. At 18:00 summary sent to Announcements

---

# 13. Deployment

## Docker Services

- evolution-api
- n8n
- postgres
- redis
- ollama (optional)

## Ports

Evolution API:
8080

n8n:
5678

PostgreSQL:
5432

Redis:
6379

Ollama:
11434

---

# 14. Security

## Authentication

- Evolution API key
- n8n basic auth
- Internal network communication

## Secrets

Store via environment variables:
- OPENAI_API_KEY
- EVOLUTION_API_KEY
- POSTGRES_PASSWORD
- REDIS_PASSWORD

## Access Control

- Admin workflows
- Read-only analytics
- Webhook signature validation

---

# 15. Future Roadmap

## Phase 2

- Multi-community support
- Multi-tenant architecture
- Dashboard UI
- Broadcast management
- Approval workflow

## Phase 3

- CRM integration
- Ticketing integration
- Payment integration
- Voice note transcription
- Document OCR
- AI agent memory

## Phase 4

- SaaS platform
- Team collaboration
- Workflow builder UI
- Marketplace
- Enterprise deployment

---

# 16. Deliverables

## Infrastructure

- Docker Compose
- Environment configuration
- Evolution API instance
- PostgreSQL schema

## Automation

- Welcome workflow
- FAQ workflow
- Moderation workflow
- Summary workflow

## Documentation

- API integration guide
- n8n workflow documentation
- Deployment guide
- Demo guide

---

# 17. MVP Definition of Done

- WhatsApp account connected
- 3 groups operational
- Real-time message automation
- Welcome automation active
- FAQ automation active
- Daily summary active
- Basic moderation active
- Docker deployment reproducible
- Documentation completed

---

End of Document
