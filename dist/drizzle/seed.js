"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_js_1 = require("../src/config/database.js");
const schema_js_1 = require("./schema.js");
const password_js_1 = require("../src/utils/password.js");
async function seed() {
    console.log('Seeding initial data into database...');
    // 1. Admins
    const superAdminPassword = await (0, password_js_1.hashPassword)('password123');
    const [superAdmin] = await database_js_1.db
        .insert(schema_js_1.admins)
        .values({
        name: 'Super Admin',
        email: 'admin@wahub.com',
        passwordHash: superAdminPassword,
        role: 'super_admin',
        phone: '6281234567890',
        status: 'active',
    })
        .onConflictDoNothing()
        .returning();
    const [supportAdmin] = await database_js_1.db
        .insert(schema_js_1.admins)
        .values({
        name: 'Support Agent',
        email: 'support@wahub.com',
        passwordHash: superAdminPassword,
        role: 'support',
        phone: '6281298765432',
        status: 'active',
    })
        .onConflictDoNothing()
        .returning();
    // 2. Communities
    const [techCommunity] = await database_js_1.db
        .insert(schema_js_1.communities)
        .values({
        name: 'Limestone Tech Community',
        description: 'Komunitas Pengembang & Teknologi Limestone Hub',
        whatsappCommunityId: '120363001@g.us',
        status: 'active',
    })
        .onConflictDoNothing()
        .returning();
    // 3. Groups
    const [devGroup] = await database_js_1.db
        .insert(schema_js_1.groups)
        .values({
        communityId: techCommunity?.id,
        whatsappGroupJid: '1203631001@g.us',
        name: 'Dev Talk & Support',
        description: 'Grup diskusi developer & bantuan teknis',
        groupType: 'regular',
        aiEnabled: true,
        autoWelcome: true,
        autoFaq: true,
        autoModeration: true,
        memberCount: 2,
        messageCountToday: 5,
    })
        .onConflictDoNothing()
        .returning();
    // 4. Members
    const [member1] = await database_js_1.db
        .insert(schema_js_1.members)
        .values({
        whatsappNumber: '628111222333',
        displayName: 'Budi Santoso',
        phone: '628111222333',
        email: 'budi@example.com',
        area: 'Jakarta',
        businessType: 'Retail',
        businessName: 'Toko Budi',
        status: 'active',
    })
        .onConflictDoNothing()
        .returning();
    const [member2] = await database_js_1.db
        .insert(schema_js_1.members)
        .values({
        whatsappNumber: '628555666777',
        displayName: 'Siti Aminah',
        phone: '628555666777',
        email: 'siti@example.com',
        area: 'Bandung',
        businessType: 'F&B',
        businessName: 'Kopi Siti',
        status: 'active',
    })
        .onConflictDoNothing()
        .returning();
    // 5. Group Members
    if (devGroup && member1) {
        await database_js_1.db
            .insert(schema_js_1.groupMembers)
            .values({ groupId: devGroup.id, memberId: member1.id, role: 'admin' })
            .onConflictDoNothing();
    }
    if (devGroup && member2) {
        await database_js_1.db
            .insert(schema_js_1.groupMembers)
            .values({ groupId: devGroup.id, memberId: member2.id, role: 'member' })
            .onConflictDoNothing();
    }
    // 6. System Settings
    await database_js_1.db
        .insert(schema_js_1.systemSettings)
        .values([
        {
            key: 'site_name',
            value: 'Limestone Hub Dashboard',
            category: 'general',
            description: 'Nama aplikasi admin dashboard',
        },
        {
            key: 'ai_auto_moderation',
            value: 'true',
            type: 'boolean',
            category: 'automation',
            description: 'Enable AI Moderation for all groups',
        },
        {
            key: 'broadcast_rate_limit',
            value: '50',
            type: 'number',
            category: 'broadcast',
            description: 'Pesan per menit untuk broadcast',
        },
    ])
        .onConflictDoNothing();
    // 7. Integrations
    await database_js_1.db
        .insert(schema_js_1.integrations)
        .values([
        {
            name: 'Evolution API WhatsApp Gateway',
            type: 'whatsapp',
            status: 'connected',
            config: { url: 'http://localhost:8080' },
        },
        {
            name: 'OpenAI GPT-4o-mini',
            type: 'openai',
            status: 'connected',
            config: { model: 'gpt-4o-mini' },
        },
        {
            name: 'PostgreSQL Database',
            type: 'postgresql',
            status: 'connected',
            config: { host: 'localhost', port: 5432 },
        },
    ])
        .onConflictDoNothing();
    console.log('Seeding completed successfully!');
    process.exit(0);
}
seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
