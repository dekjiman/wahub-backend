import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Webhook Event Handler', () => {
  it('should accept incoming messages.upsert webhook from Evolution API', async () => {
    const payload = {
      event: 'messages.upsert',
      data: {
        key: {
          remoteJid: '1203631001@g.us',
          fromMe: false,
          id: 'MSG_WEBHOOK_TEST_123',
          participant: '628777888999@s.whatsapp.net',
        },
        pushName: 'Budi Webhook Test',
        message: {
          conversation: 'Halo admin, apakah ada promo diskon minggu ini?',
        },
        instanceName: 'wahub-main',
      },
    };

    const res = await request(app)
      .post('/webhook/evolution')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data.received).toBe(true);
  });

  it('should accept participant.update webhook', async () => {
    const payload = {
      event: 'participant.update',
      data: {
        groupJid: '1203631001@g.us',
        participant: '628111999888@s.whatsapp.net',
        action: 'add',
        instanceName: 'wahub-main',
      },
    };

    const res = await request(app)
      .post('/api/v1/webhook/evolution')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data.received).toBe(true);
  });
});
