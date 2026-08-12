import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { WebhooksService } from '../modules/webhooks/webhooks.service.js';
import { db } from '../config/database.js';
import { chatLogs } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const messageId = `WEBHOOK_TEST_${Date.now()}`;

describe('Webhook Receiver (/api/v1/webhooks/evolution-go)', () => {
  it('should accept a valid Message webhook and store it', async () => {
    const payload = {
      event: 'Message',
      data: {
        Info: {
          ID: messageId,
          Chat: '120363422925079691@g.us',
          Sender: '6281319995895@s.whatsapp.net',
          IsFromMe: false,
          IsGroup: true,
          PushName: 'Budi Webhook Test',
          Timestamp: '2026-08-12T05:00:00Z',
        },
        Message: { conversation: 'Halo admin, apakah ada promo minggu ini?' },
      },
      instanceName: 'wahub-main',
    };

    const res = await request(app)
      .post('/api/v1/webhooks/evolution-go')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data.received).toBe(true);
    expect(res.body.data.duplicate).toBe(false);
    expect(res.body.data.eventId).toBeTruthy();

    // Process event asynchronously & verify persistence in chatLogs (TASK-008)
    await WebhooksService.processEvent(res.body.data.eventId);

    const [storedLog] = await db
      .select()
      .from(chatLogs)
      .where(eq(chatLogs.whatsappMsgId, messageId));

    expect(storedLog).toBeDefined();
    expect(storedLog.content).toBe('Halo admin, apakah ada promo minggu ini?');
    expect(storedLog.direction).toBe('inbound');
  });

  it('should ignore a duplicate webhook (same external event id)', async () => {
    const payload = {
      event: 'Message',
      data: {
        Info: {
          ID: messageId,
          Chat: '120363422925079691@g.us',
          Sender: '6281319995895@s.whatsapp.net',
          IsFromMe: false,
          IsGroup: true,
          PushName: 'Budi Webhook Test',
          Timestamp: '2026-08-12T05:00:00Z',
        },
        Message: { conversation: 'Halo admin, apakah ada promo minggu ini?' },
      },
      instanceName: 'wahub-main',
    };

    const res = await request(app)
      .post('/api/v1/webhooks/evolution-go')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data.received).toBe(true);
    expect(res.body.data.duplicate).toBe(true);
  });

  it('should process participant.update webhook (add/remove) (TASK-011)', async () => {
    const groupJid = `120363${Date.now()}@g.us`;
    const participantJid = '628999888777@s.whatsapp.net';

    const joinPayload = {
      event: 'participant.update',
      data: {
        groupJid,
        action: 'add',
        participants: [participantJid],
        pushName: 'Participant Test User',
      },
    };

    const res = await request(app)
      .post('/api/v1/webhooks/evolution-go')
      .send(joinPayload);

    expect(res.status).toBe(200);
    expect(res.body.data.eventId).toBeTruthy();

    await WebhooksService.processEvent(res.body.data.eventId);

    const { groups, members, groupMembers } = await import('../../drizzle/schema.js');
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.whatsappGroupJid, groupJid));

    expect(group).toBeDefined();

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.whatsappNumber, '628999888777'));

    expect(member).toBeDefined();

    const [gm] = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, group.id));

    expect(gm).toBeDefined();
    expect(gm.status).toBe('active');
  });

  it('should reject payloads without an event field', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/evolution-go')
      .send({ data: { Info: { ID: 'X' } } });

    expect(res.status).toBe(400);
  });
});


