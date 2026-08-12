"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("postgres"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL || 'postgresql://wahub:password@localhost:5432/wahub';
const sql = (0, postgres_1.default)(connectionString);
async function migrate() {
    console.log('Running database schema migration script...');
    try {
        // 1. Enums
        await sql `
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
          CREATE TYPE admin_role AS ENUM ('super_admin', 'business_manager', 'area_manager', 'support', 'viewer');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
          CREATE TYPE status AS ENUM ('active', 'inactive', 'banned');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'direction') THEN
          CREATE TYPE direction AS ENUM ('inbound', 'outbound');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
          CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'document', 'audio');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sentiment') THEN
          CREATE TYPE sentiment AS ENUM ('positive', 'neutral', 'negative');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity') THEN
          CREATE TYPE severity AS ENUM ('low', 'medium', 'high', 'critical');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority') THEN
          CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'urgent');
        END IF;
      END $$;
    `;
        // 2. Tables
        await sql `
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role admin_role NOT NULL DEFAULT 'viewer',
        avatar_url TEXT,
        phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active',
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        whatsapp_number VARCHAR(20) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        area VARCHAR(100),
        business_type VARCHAR(100),
        business_name VARCHAR(255),
        avatar_url TEXT,
        status VARCHAR(20) DEFAULT 'active',
        warning_count INT DEFAULT 0,
        joined_at TIMESTAMP DEFAULT NOW(),
        last_active_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS communities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        whatsapp_community_id VARCHAR(100),
        cover_image_url TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
        whatsapp_group_jid VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        group_type VARCHAR(50) DEFAULT 'regular',
        ai_enabled BOOLEAN DEFAULT TRUE,
        ai_paused_until TIMESTAMP,
        auto_welcome BOOLEAN DEFAULT TRUE,
        auto_faq BOOLEAN DEFAULT TRUE,
        auto_moderation BOOLEAN DEFAULT TRUE,
        max_members INT,
        member_count INT DEFAULT 0,
        message_count_today INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
        member_id UUID REFERENCES members(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT group_members_group_id_member_id_unique UNIQUE(group_id, member_id)
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS chat_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES groups(id),
        member_id UUID REFERENCES members(id),
        whatsapp_msg_id VARCHAR(100),
        direction direction NOT NULL,
        content TEXT,
        message_type message_type DEFAULT 'text',
        media_url TEXT,
        is_from_ai BOOLEAN DEFAULT FALSE,
        sentiment sentiment,
        topic VARCHAR(100),
        is_spam BOOLEAN DEFAULT FALSE,
        is_flagged BOOLEAN DEFAULT FALSE,
        reply_to_msg_id VARCHAR(100),
        sent_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_log_id UUID REFERENCES chat_logs(id),
        analysis_type VARCHAR(50) NOT NULL,
        result JSONB NOT NULL,
        confidence NUMERIC(3, 2),
        model_used VARCHAR(100),
        tokens_used INT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS moderation_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES groups(id),
        member_id UUID REFERENCES members(id),
        chat_log_id UUID REFERENCES chat_logs(id),
        alert_type VARCHAR(50) NOT NULL,
        severity severity DEFAULT 'medium',
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by UUID REFERENCES admins(id),
        reviewed_at TIMESTAMP,
        action_taken VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS member_warnings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id UUID REFERENCES members(id),
        group_id UUID REFERENCES groups(id),
        issued_by UUID REFERENCES admins(id),
        violation_type VARCHAR(100) NOT NULL,
        reason TEXT NOT NULL,
        severity VARCHAR(20) DEFAULT 'warning',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS escalations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES groups(id),
        member_id UUID REFERENCES members(id),
        assigned_to UUID REFERENCES admins(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority priority DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'open',
        sla_deadline TIMESTAMP,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS escalation_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        escalation_id UUID REFERENCES escalations(id) ON DELETE CASCADE,
        admin_id UUID REFERENCES admins(id),
        content TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS broadcasts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_by UUID REFERENCES admins(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        media_url TEXT,
        target_type VARCHAR(20) NOT NULL,
        target_ids UUID[] NOT NULL,
        status VARCHAR(20) DEFAULT 'draft',
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        total_recipients INT DEFAULT 0,
        total_sent INT DEFAULT 0,
        total_failed INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS broadcast_recipients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        broadcast_id UUID REFERENCES broadcasts(id) ON DELETE CASCADE,
        group_id UUID REFERENCES groups(id),
        member_id UUID REFERENCES members(id),
        whatsapp_msg_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending',
        sent_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'disconnected',
        config JSONB DEFAULT '{}'::jsonb,
        last_synced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        type VARCHAR(20) DEFAULT 'string',
        category VARCHAR(50),
        description TEXT,
        updated_by UUID REFERENCES admins(id),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID REFERENCES admins(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        before_data JSONB,
        after_data JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
        await sql `
      CREATE TABLE IF NOT EXISTS workflow_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        trigger_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'running',
        input_data JSONB,
        output_data JSONB,
        error_message TEXT,
        duration_ms INT,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `;
        console.log('Database migration script finished successfully!');
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
    finally {
        await sql.end();
    }
}
migrate();
