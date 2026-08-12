import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { getAuthToken } from './helpers.js';

describe('Broadcast Engine & Recipient Tracking (TASK-017)', () => {
  let token: string;
  let broadcastId: string;

  it('should create a broadcast and trigger send via REST API with recipient tracking', async () => {
    token = await getAuthToken();

    // Fetch a group ID for target
    const groupsRes = await request(app)
      .get('/api/v1/groups')
      .set('Authorization', `Bearer ${token}`);

    const targetGroupId = groupsRes.body.data[0]?.id;
    if (!targetGroupId) return;

    // 1. Create Broadcast
    const createRes = await request(app)
      .post('/api/v1/broadcasts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Flash Sale Promo Broadcast Engine Test',
        content: 'Promo spesial hari ini diskon 50%! Kunjungi link berikut.',
        message_type: 'text',
        target_type: 'group',
        target_ids: [targetGroupId],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toBe('Flash Sale Promo Broadcast Engine Test');
    expect(createRes.body.data.status).toBe('draft');
    broadcastId = createRes.body.data.id;

    // 2. Trigger send via POST /api/v1/broadcasts/:id/send
    const sendRes = await request(app)
      .post(`/api/v1/broadcasts/${broadcastId}/send`)
      .set('Authorization', `Bearer ${token}`);

    expect(sendRes.status).toBe(200);
    expect(['sending', 'sent', 'completed', 'partial_failed', 'failed']).toContain(
      sendRes.body.data.status
    );

    // 3. Fetch recipients status
    const recipientsRes = await request(app)
      .get(`/api/v1/broadcasts/${broadcastId}/recipients`)
      .set('Authorization', `Bearer ${token}`);

    expect(recipientsRes.status).toBe(200);
    expect(Array.isArray(recipientsRes.body.data)).toBe(true);
    expect(recipientsRes.body.data.length).toBeGreaterThan(0);
    expect(recipientsRes.body.data[0].status).toBeTruthy();
  });
});
