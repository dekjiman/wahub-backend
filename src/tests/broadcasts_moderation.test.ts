import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { getAuthToken } from './helpers.js';

describe('Broadcasts & Moderation Modules', () => {
  let token: string;
  let broadcastId: string;
  let alertId: string;

  it('should create and approve a broadcast', async () => {
    token = await getAuthToken();

    // Fetch a group ID for target
    const groupsRes = await request(app)
      .get('/api/v1/groups')
      .set('Authorization', `Bearer ${token}`);
    
    const targetGroupId = groupsRes.body.data[0]?.id;
    if (!targetGroupId) return;

    const createRes = await request(app)
      .post('/api/v1/broadcasts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Weekly Announcement',
        content: 'Halo anggota grup, ini pesan pengumuman mingguan.',
        target_type: 'group',
        target_ids: [targetGroupId],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toBe('Weekly Announcement');
    broadcastId = createRes.body.data.id;

    const approveRes = await request(app)
      .post(`/api/v1/broadcasts/${broadcastId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(approveRes.status).toBe(200);
    expect(['sending', 'sent', 'approved']).toContain(approveRes.body.data.status);
  });

  it('should list moderation alerts', async () => {
    const res = await request(app)
      .get('/api/v1/moderation/alerts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      alertId = res.body.data[0].id;
    }
  });

  it('should approve, reject, and execute a moderation alert (TASK-015)', async () => {
    const { db } = await import('../config/database.js');
    const { moderationAlerts } = await import('../../drizzle/schema.js');

    // Insert test moderation alert
    const [insertedAlert] = await db
      .insert(moderationAlerts)
      .values({
        alertType: 'spam',
        severity: 'high',
        description: 'Spam violation for moderation test',
        status: 'pending',
      })
      .returning();

    // 1. Approve
    const approveRes = await request(app)
      .post(`/api/v1/moderation/alerts/${insertedAlert.id}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('approved');

    // 2. Reject
    const rejectRes = await request(app)
      .post(`/api/v1/moderation/alerts/${insertedAlert.id}/reject`)
      .set('Authorization', `Bearer ${token}`);

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('rejected');

    // 3. Execute action
    const executeRes = await request(app)
      .post(`/api/v1/moderation/alerts/${insertedAlert.id}/execute`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action_taken: 'warn' });

    expect(executeRes.status).toBe(200);
    expect(executeRes.body.data.status).toBe('executed');
    expect(executeRes.body.data.action_taken).toBe('warn');
  });
});

