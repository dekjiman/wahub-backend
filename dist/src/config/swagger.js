"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
exports.swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Wahub Backend REST API',
        version: '1.0.0',
        description: 'Full REST API specification for Limestone Hub — Admin Dashboard managing WhatsApp Community, Groups, Members, AI Automation, Moderation, Broadcasts, and System Integrations.',
        contact: {
            name: 'Engineering Team',
        },
    },
    servers: [
        {
            url: '/api/v1',
            description: 'API Base Path v1',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Provide Bearer JWT token obtained from POST /auth/login',
            },
        },
        schemas: {
            AuthUser: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: {
                        type: 'string',
                        enum: [
                            'super_admin',
                            'business_manager',
                            'area_manager',
                            'support',
                            'viewer',
                        ],
                    },
                    avatar_url: { type: 'string', nullable: true },
                    permissions: { type: 'array', items: { type: 'string' } },
                },
            },
            Admin: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string' },
                    avatar_url: { type: 'string', nullable: true },
                    phone: { type: 'string', nullable: true },
                    status: { type: 'string', enum: ['active', 'inactive'] },
                    last_login_at: { type: 'string', nullable: true },
                    created_at: { type: 'string' },
                },
            },
            Member: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    whatsapp_number: { type: 'string' },
                    display_name: { type: 'string' },
                    phone: { type: 'string', nullable: true },
                    email: { type: 'string', nullable: true },
                    area: { type: 'string', nullable: true },
                    business_type: { type: 'string', nullable: true },
                    business_name: { type: 'string', nullable: true },
                    avatar_url: { type: 'string', nullable: true },
                    status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
                    warning_count: { type: 'integer' },
                    joined_at: { type: 'string' },
                    last_active_at: { type: 'string', nullable: true },
                },
            },
            Community: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    whatsapp_community_id: { type: 'string', nullable: true },
                    cover_image_url: { type: 'string', nullable: true },
                    status: { type: 'string', enum: ['active', 'inactive'] },
                    group_count: { type: 'integer' },
                },
            },
            Group: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    community_id: { type: 'string', nullable: true },
                    whatsapp_group_jid: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    group_type: {
                        type: 'string',
                        enum: ['regular', 'announcement', 'support'],
                    },
                    ai_enabled: { type: 'boolean' },
                    ai_paused_until: { type: 'string', nullable: true },
                    auto_welcome: { type: 'boolean' },
                    auto_faq: { type: 'boolean' },
                    auto_moderation: { type: 'boolean' },
                    member_count: { type: 'integer' },
                    message_count_today: { type: 'integer' },
                    status: { type: 'string', enum: ['active', 'inactive'] },
                },
            },
            Broadcast: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    created_by: { type: 'string' },
                    title: { type: 'string' },
                    content: { type: 'string' },
                    message_type: {
                        type: 'string',
                        enum: ['text', 'image', 'video', 'document'],
                    },
                    media_url: { type: 'string', nullable: true },
                    target_type: { type: 'string', enum: ['community', 'group', 'member'] },
                    target_ids: { type: 'array', items: { type: 'string' } },
                    status: {
                        type: 'string',
                        enum: [
                            'draft',
                            'pending_approval',
                            'approved',
                            'sending',
                            'sent',
                            'failed',
                        ],
                    },
                    scheduled_at: { type: 'string', nullable: true },
                    sent_at: { type: 'string', nullable: true },
                    total_recipients: { type: 'integer' },
                    total_sent: { type: 'integer' },
                    total_failed: { type: 'integer' },
                    created_at: { type: 'string' },
                },
            },
            ModerationAlert: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    group_id: { type: 'string' },
                    group_name: { type: 'string' },
                    member_id: { type: 'string' },
                    member_name: { type: 'string' },
                    chat_log_id: { type: 'string' },
                    alert_type: {
                        type: 'string',
                        enum: ['spam', 'flood', 'toxic', 'link', 'other'],
                    },
                    severity: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'critical'],
                    },
                    description: { type: 'string' },
                    status: {
                        type: 'string',
                        enum: ['pending', 'approved', 'rejected', 'executed'],
                    },
                    reviewed_by: { type: 'string', nullable: true },
                    reviewed_at: { type: 'string', nullable: true },
                    action_taken: { type: 'string', nullable: true },
                    created_at: { type: 'string' },
                },
            },
            Escalation: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    group_id: { type: 'string' },
                    group_name: { type: 'string' },
                    member_id: { type: 'string' },
                    member_name: { type: 'string' },
                    assigned_to: { type: 'string', nullable: true },
                    assigned_name: { type: 'string', nullable: true },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'urgent'],
                    },
                    status: {
                        type: 'string',
                        enum: ['open', 'in_progress', 'resolved', 'closed'],
                    },
                    sla_deadline: { type: 'string', nullable: true },
                    resolved_at: { type: 'string', nullable: true },
                    created_at: { type: 'string' },
                },
            },
            ChatLog: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    group_id: { type: 'string' },
                    group_name: { type: 'string' },
                    member_id: { type: 'string' },
                    member_name: { type: 'string' },
                    direction: { type: 'string', enum: ['inbound', 'outbound'] },
                    content: { type: 'string' },
                    message_type: {
                        type: 'string',
                        enum: ['text', 'image', 'video', 'document', 'audio'],
                    },
                    is_from_ai: { type: 'boolean' },
                    sentiment: {
                        type: 'string',
                        enum: ['positive', 'neutral', 'negative'],
                        nullable: true,
                    },
                    topic: { type: 'string', nullable: true },
                    is_spam: { type: 'boolean' },
                    is_flagged: { type: 'boolean' },
                    sent_at: { type: 'string' },
                },
            },
            SystemSetting: {
                type: 'object',
                properties: {
                    key: { type: 'string' },
                    value: { type: 'string' },
                    type: {
                        type: 'string',
                        enum: ['string', 'number', 'boolean', 'json'],
                    },
                    category: { type: 'string' },
                    description: { type: 'string', nullable: true },
                },
            },
            Integration: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    type: { type: 'string' },
                    status: { type: 'string', enum: ['connected', 'disconnected', 'error'] },
                    config: { type: 'object' },
                    last_synced_at: { type: 'string', nullable: true },
                },
            },
            WorkflowRun: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    trigger_type: { type: 'string', enum: ['webhook', 'schedule', 'manual'] },
                    status: {
                        type: 'string',
                        enum: ['running', 'success', 'failed', 'timeout'],
                    },
                    input_data: { type: 'object', nullable: true },
                    output_data: { type: 'object', nullable: true },
                    error_message: { type: 'string', nullable: true },
                    duration_ms: { type: 'integer', nullable: true },
                    started_at: { type: 'string' },
                    completed_at: { type: 'string', nullable: true },
                },
            },
            AuditLog: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    admin_id: { type: 'string' },
                    admin_name: { type: 'string' },
                    action: { type: 'string' },
                    entity_type: { type: 'string' },
                    entity_id: { type: 'string', nullable: true },
                    before_data: { type: 'object', nullable: true },
                    after_data: { type: 'object', nullable: true },
                    ip_address: { type: 'string', nullable: true },
                    created_at: { type: 'string' },
                },
            },
        },
    },
    security: [{ bearerAuth: [] }],
    tags: [
        { name: 'Auth', description: 'Authentication & Session Management' },
        { name: 'Admins', description: 'Admin Users & Roles Management' },
        { name: 'Members', description: 'WhatsApp Group Members & Warnings' },
        { name: 'Communities', description: 'WhatsApp Communities Management' },
        { name: 'Groups', description: 'WhatsApp Groups & AI Controls' },
        { name: 'Dashboard', description: 'KPI Summary, Service Health & Activity Feed' },
        { name: 'Broadcasts', description: 'WhatsApp Mass Broadcast Management' },
        { name: 'Moderation', description: 'AI Moderation Alerts & Actions' },
        { name: 'Escalations', description: 'Support Tickets & Admin Escalations' },
        { name: 'Settings', description: 'System Configuration Settings' },
        { name: 'Analytics', description: 'Growth, Sentiment, Topics & Delivery Data' },
        { name: 'Chat Logs', description: 'Group Chat Messages & AI Analyses' },
        { name: 'Integrations', description: 'Third-party Integration Status & Sync' },
        { name: 'Workflows', description: 'Automated Workflow Execution Logs' },
        { name: 'Audit Logs', description: 'Administrative Action Logs' },
        { name: 'Webhooks', description: 'Evolution API Webhook Receivers' },
    ],
    paths: {
        '/health': {
            get: {
                tags: ['Dashboard'],
                summary: 'Service Health Check',
                security: [],
                responses: { 200: { description: 'Healthy status response' } },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login admin user',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', example: 'admin@wahub.com' },
                                    password: { type: 'string', example: 'password123' },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Authenticated successfully' } },
            },
        },
        '/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Logout admin user',
                responses: { 204: { description: 'No content' } },
            },
        },
        '/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Get currently logged in admin details',
                responses: { 200: { description: 'Admin profile data' } },
            },
        },
        '/auth/forgot-password': {
            post: {
                tags: ['Auth'],
                summary: 'Request password reset token',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: { email: { type: 'string' } },
                            },
                        },
                    },
                },
                responses: { 204: { description: 'Request accepted' } },
            },
        },
        '/auth/reset-password': {
            post: {
                tags: ['Auth'],
                summary: 'Reset password using token',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['token', 'password'],
                                properties: {
                                    token: { type: 'string' },
                                    password: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: { 204: { description: 'Password reset successful' } },
            },
        },
        '/admins': {
            get: {
                tags: ['Admins'],
                summary: 'List all admin users',
                responses: { 200: { description: 'List of admins' } },
            },
            post: {
                tags: ['Admins'],
                summary: 'Create a new admin user',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Admin' } } },
                },
                responses: { 201: { description: 'Admin created' } },
            },
        },
        '/admins/{id}': {
            patch: {
                tags: ['Admins'],
                summary: 'Update an admin user',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Admin updated' } },
            },
            delete: {
                tags: ['Admins'],
                summary: 'Delete an admin user',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 204: { description: 'Admin deleted' } },
            },
        },
        '/members': {
            get: {
                tags: ['Members'],
                summary: 'List all community members',
                responses: { 200: { description: 'List of members' } },
            },
            post: {
                tags: ['Members'],
                summary: 'Create a new member',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Member' } } },
                },
                responses: { 201: { description: 'Member created' } },
            },
        },
        '/members/{id}': {
            patch: {
                tags: ['Members'],
                summary: 'Update member profile',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Member updated' } },
            },
        },
        '/members/{id}/groups': {
            get: {
                tags: ['Members'],
                summary: "Get member's group memberships",
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Groups list' } },
            },
        },
        '/members/{id}/warnings': {
            get: {
                tags: ['Members'],
                summary: "Get member's warnings",
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Warnings list' } },
            },
            post: {
                tags: ['Members'],
                summary: 'Issue a warning to member',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['violation_type', 'reason'],
                                properties: {
                                    violation_type: { type: 'string' },
                                    reason: { type: 'string' },
                                    severity: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: 'Warning issued' } },
            },
        },
        '/members/{id}/messages': {
            get: {
                tags: ['Members'],
                summary: "Get member's message logs",
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Messages list' } },
            },
        },
        '/communities': {
            get: {
                tags: ['Communities'],
                summary: 'List all communities',
                responses: { 200: { description: 'Communities list' } },
            },
            post: {
                tags: ['Communities'],
                summary: 'Create a community',
                responses: { 201: { description: 'Community created' } },
            },
        },
        '/communities/{id}/groups': {
            get: {
                tags: ['Communities'],
                summary: 'List groups in community',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Groups list' } },
            },
        },
        '/groups': {
            get: {
                tags: ['Groups'],
                summary: 'List all WhatsApp groups',
                responses: { 200: { description: 'Groups list' } },
            },
            post: {
                tags: ['Groups'],
                summary: 'Create/Connect a group',
                responses: { 201: { description: 'Group created' } },
            },
        },
        '/groups/{id}': {
            patch: {
                tags: ['Groups'],
                summary: 'Update group settings',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Group updated' } },
            },
        },
        '/groups/{id}/members': {
            get: {
                tags: ['Groups'],
                summary: 'Get group members',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Group members list' } },
            },
        },
        '/groups/{id}/metrics': {
            get: {
                tags: ['Groups'],
                summary: 'Get group activity metrics',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Group metrics' } },
            },
        },
        '/groups/{id}/pause-ai': {
            post: {
                tags: ['Groups'],
                summary: 'Pause AI automation in group',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: { type: 'object', properties: { minutes: { type: 'number', example: 60 } } },
                        },
                    },
                },
                responses: { 200: { description: 'AI paused' } },
            },
        },
        '/groups/{id}/resume-ai': {
            post: {
                tags: ['Groups'],
                summary: 'Resume AI automation in group',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'AI resumed' } },
            },
        },
        '/dashboard/summary': {
            get: {
                tags: ['Dashboard'],
                summary: 'Get KPI dashboard summary',
                responses: { 200: { description: 'Summary counters' } },
            },
        },
        '/dashboard/health': {
            get: {
                tags: ['Dashboard'],
                summary: 'Get system & service health status',
                responses: { 200: { description: 'Health status array' } },
            },
        },
        '/dashboard/recent-activities': {
            get: {
                tags: ['Dashboard'],
                summary: 'Get recent admin activity logs',
                responses: { 200: { description: 'Recent activity array' } },
            },
        },
        '/broadcasts': {
            get: {
                tags: ['Broadcasts'],
                summary: 'List all broadcasts',
                responses: { 200: { description: 'Broadcasts list' } },
            },
            post: {
                tags: ['Broadcasts'],
                summary: 'Create a broadcast draft',
                responses: { 201: { description: 'Broadcast created' } },
            },
        },
        '/broadcasts/{id}': {
            get: {
                tags: ['Broadcasts'],
                summary: 'Get broadcast details',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Broadcast detail' } },
            },
        },
        '/broadcasts/{id}/recipients': {
            get: {
                tags: ['Broadcasts'],
                summary: 'Get broadcast recipients status',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Recipients list' } },
            },
        },
        '/broadcasts/{id}/status': {
            patch: {
                tags: ['Broadcasts'],
                summary: 'Update broadcast status',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Status updated' } },
            },
        },
        '/broadcasts/{id}/approve': {
            post: {
                tags: ['Broadcasts'],
                summary: 'Approve and dispatch broadcast',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Approved and sending' } },
            },
        },
        '/moderation/alerts': {
            get: {
                tags: ['Moderation'],
                summary: 'List AI moderation alerts',
                responses: { 200: { description: 'Moderation alerts list' } },
            },
        },
        '/moderation/alerts/{id}': {
            get: {
                tags: ['Moderation'],
                summary: 'Get moderation alert details',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Alert detail' } },
            },
        },
        '/moderation/alerts/{id}/approve': {
            post: {
                tags: ['Moderation'],
                summary: 'Approve moderation alert',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Alert approved' } },
            },
        },
        '/moderation/alerts/{id}/reject': {
            post: {
                tags: ['Moderation'],
                summary: 'Reject moderation alert',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Alert rejected' } },
            },
        },
        '/moderation/alerts/{id}/execute': {
            post: {
                tags: ['Moderation'],
                summary: 'Execute moderation action',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Action executed' } },
            },
        },
        '/escalations': {
            get: {
                tags: ['Escalations'],
                summary: 'List support escalations',
                responses: { 200: { description: 'Escalations list' } },
            },
        },
        '/escalations/{id}': {
            get: {
                tags: ['Escalations'],
                summary: 'Get escalation detail',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Escalation detail' } },
            },
        },
        '/escalations/{id}/comments': {
            get: {
                tags: ['Escalations'],
                summary: 'Get escalation comments',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Comments list' } },
            },
            post: {
                tags: ['Escalations'],
                summary: 'Add comment to escalation',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 201: { description: 'Comment added' } },
            },
        },
        '/escalations/{id}/assign': {
            post: {
                tags: ['Escalations'],
                summary: 'Assign escalation to admin',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Escalation assigned' } },
            },
        },
        '/escalations/{id}/status': {
            patch: {
                tags: ['Escalations'],
                summary: 'Update escalation status',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Status updated' } },
            },
        },
        '/settings': {
            get: {
                tags: ['Settings'],
                summary: 'Get all system settings',
                responses: { 200: { description: 'System settings list' } },
            },
        },
        '/settings/{key}': {
            patch: {
                tags: ['Settings'],
                summary: 'Update setting value',
                parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Setting updated' } },
            },
        },
        '/analytics/growth': {
            get: {
                tags: ['Analytics'],
                summary: 'Get community growth metrics',
                responses: { 200: { description: 'Growth data' } },
            },
        },
        '/analytics/sentiment': {
            get: {
                tags: ['Analytics'],
                summary: 'Get sentiment distribution',
                responses: { 200: { description: 'Sentiment data' } },
            },
        },
        '/analytics/topics': {
            get: {
                tags: ['Analytics'],
                summary: 'Get topic distribution',
                responses: { 200: { description: 'Topics data' } },
            },
        },
        '/analytics/spam': {
            get: {
                tags: ['Analytics'],
                summary: 'Get spam trends',
                responses: { 200: { description: 'Spam data' } },
            },
        },
        '/analytics/delivery': {
            get: {
                tags: ['Analytics'],
                summary: 'Get broadcast message delivery rates',
                responses: { 200: { description: 'Delivery data' } },
            },
        },
        '/analytics/message-activity': {
            get: {
                tags: ['Analytics'],
                summary: 'Get inbound vs outbound message volume over time',
                responses: { 200: { description: 'Message activity data' } },
            },
        },
        '/analytics/heatmaps': {
            get: {
                tags: ['Analytics'],
                summary: 'Get day-of-week and hour-of-day message heatmaps',
                responses: { 200: { description: 'Heatmap data' } },
            },
        },
        '/analytics/moderation-summary': {
            get: {
                tags: ['Analytics'],
                summary: 'Get moderation alerts summary by status and type',
                responses: { 200: { description: 'Moderation summary' } },
            },
        },
        '/analytics/export/members': {
            get: {
                tags: ['Analytics'],
                summary: 'Export community members list as CSV file',
                responses: { 200: { description: 'CSV file download' } },
            },
        },
        '/analytics/export/messages': {
            get: {
                tags: ['Analytics'],
                summary: 'Export chat log messages as CSV file',
                responses: { 200: { description: 'CSV file download' } },
            },
        },
        '/analytics/export/moderation': {
            get: {
                tags: ['Analytics'],
                summary: 'Export moderation alerts as CSV file',
                responses: { 200: { description: 'CSV file download' } },
            },
        },
        '/broadcasts/{id}/send': {
            post: {
                tags: ['Broadcasts'],
                summary: 'Instantly send an approved or draft broadcast with anti-ban batching',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Broadcast sending status' } },
            },
        },
        '/escalations/{id}/resolve': {
            post: {
                tags: ['Escalations'],
                summary: 'Resolve ticket and resume AI automation on target group',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Escalation resolved' } },
            },
        },
        '/internal/ai-analyses': {
            post: {
                tags: ['Integrations'],
                summary: 'Internal n8n endpoint: Save AI analysis result',
                responses: { 201: { description: 'Analysis saved' } },
            },
        },
        '/internal/moderation-alerts': {
            post: {
                tags: ['Integrations'],
                summary: 'Internal n8n endpoint: Create moderation alert',
                responses: { 201: { description: 'Alert created' } },
            },
        },
        '/chat-logs': {
            get: {
                tags: ['Chat Logs'],
                summary: 'List chat log messages',
                responses: { 200: { description: 'Chat logs list' } },
            },
        },
        '/chat-logs/{id}': {
            get: {
                tags: ['Chat Logs'],
                summary: 'Get chat log message details',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Chat log detail' } },
            },
        },
        '/chat-logs/member/{memberId}': {
            get: {
                tags: ['Chat Logs'],
                summary: "Get member's chat log messages",
                parameters: [{ name: 'memberId', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Member chat logs' } },
            },
        },
        '/integrations': {
            get: {
                tags: ['Integrations'],
                summary: 'List third-party integrations',
                responses: { 200: { description: 'Integrations list' } },
            },
        },
        '/integrations/{id}/refresh': {
            post: {
                tags: ['Integrations'],
                summary: 'Refresh integration status',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Integration status updated' } },
            },
        },
        '/workflows': {
            get: {
                tags: ['Workflows'],
                summary: 'List automated workflow execution runs',
                responses: { 200: { description: 'Workflow runs list' } },
            },
        },
        '/workflows/{id}/retry': {
            post: {
                tags: ['Workflows'],
                summary: 'Retry a failed workflow run',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Workflow retried' } },
            },
        },
        '/audit-logs': {
            get: {
                tags: ['Audit Logs'],
                summary: 'List admin audit logs',
                responses: { 200: { description: 'Audit logs list' } },
            },
        },
        '/webhook/evolution': {
            post: {
                tags: ['Webhooks'],
                summary: 'Handle incoming webhooks from Evolution API',
                security: [],
                responses: { 200: { description: 'Webhook processed' } },
            },
        },
    },
};
