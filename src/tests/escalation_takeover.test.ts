import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { getAuthToken } from './helpers.js';
import { WebhooksService } from '../modules/webhooks/webhooks.service.js';
import { db } from '../config/database.js';
import { escalations, groups } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

describe('Escalation Tickets & Human Takeover (TASK-016)', () => {
  let token: string;

  it('should create an escalation ticket via REST API and pause group AI (Human Takeover)', async () => {
    token = await getAuthToken();

    // Fetch a group ID for target
    const groupsRes = await request(app)
      .get('/api/v1/groups')
      .set('Authorization', `Bearer ${token}`);

    const targetGroupId = groupsRes.body.data[0]?.id;
    if (!targetGroupId) return;

    const createRes = await request(app)
      .post('/api/v1/escalations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Member requires billing support',
        description: 'Manual escalation created by admin',
        group_id: targetGroupId,
        priority: 'high',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toBe('Member requires billing support');
    expect(createRes.body.data.status).toBe('open');

    // Verify group AI is paused for 24h
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, targetGroupId));

    expect(group).toBeDefined();
    expect(group.aiPausedUntil).not.toBeNull();

    // Resolve escalation and verify AI is resumed
    const resolveRes = await request(app)
      .post(`/api/v1/escalations/${createRes.body.data.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'Issue resolved by admin' });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe('resolved');

    const [updatedGroup] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, targetGroupId));

    expect(updatedGroup.aiPausedUntil).toBeNull();
  });

  it('should auto-trigger escalation & human takeover when member sends "butuh admin"', async () => {
    const msgId = `TAKEOVER_TEST_${Date.now()}`;
    const payload = {
      event: 'Message',
      data: {
        Info: {
          ID: msgId,
          Chat: '120363422925079691@g.us',
          Sender: '6281319995895@s.whatsapp.net',
          IsFromMe: false,
          IsGroup: true,
          PushName: 'Help User',
          Timestamp: new Date().toISOString(),
        },
        Message: { conversation: 'Halo, saya butuh admin untuk bantuan pembayaran' },
      },
      instanceName: 'wahub-main',
    };

    const res = await request(app)
      .post('/api/v1/webhooks/evolution-go')
      .send(payload);

    expect(res.status).toBe(200);

    await WebhooksService.processEvent(res.body.data.eventId);

    const [esc] = await db
      .select()
      .from(escalations)
      .where(eq(escalations.title, 'Human Support Requested by Member'));

    expect(esc).toBeDefined();
    expect(esc.status).toBe('open');
  });
});
