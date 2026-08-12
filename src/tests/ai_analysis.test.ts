import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { WebhooksService } from '../modules/webhooks/webhooks.service.js';
import { db } from '../config/database.js';
import { chatLogs, aiAnalyses, moderationAlerts } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

describe('AI Analysis & Shadow Mode Guardrail (TASK-014)', () => {
  it('should run AI analysis and create shadow mode alert for spam message', async () => {
    const groupJid = `120363aiTestGroup${Date.now()}@g.us`;
    const msgId = `AI_TEST_SPAM_${Date.now()}`;
    const payload = {
      event: 'Message',
      data: {
        Info: {
          ID: msgId,
          Chat: groupJid,
          Sender: '6281319995895@s.whatsapp.net',
          IsFromMe: false,
          IsGroup: true,
          PushName: 'Spam User Test',
          Timestamp: new Date().toISOString(),
        },
        Message: { conversation: 'Daftar sekarang slot gacor jackpot 100x wa.me/628131' },
      },
      instanceName: 'wahub-main',
    };


    const res = await request(app)
      .post('/api/v1/webhooks/evolution-go')
      .send(payload);

    expect(res.status).toBe(200);

    // Process event
    await WebhooksService.processEvent(res.body.data.eventId);

    const [storedLog] = await db
      .select()
      .from(chatLogs)
      .where(eq(chatLogs.whatsappMsgId, msgId));

    expect(storedLog).toBeDefined();
    expect(storedLog.isSpam).toBe(true);
    expect(storedLog.isFlagged).toBe(true);

    // Check aiAnalyses table persistence
    const [analysis] = await db
      .select()
      .from(aiAnalyses)
      .where(eq(aiAnalyses.chatLogId, storedLog.id));

    expect(analysis).toBeDefined();
    expect(analysis.analysisType).toBe('moderation_sentiment');

    // Check Shadow Mode Moderation Alert (status pending for human review)
    const [alert] = await db
      .select()
      .from(moderationAlerts)
      .where(eq(moderationAlerts.chatLogId, storedLog.id));

    expect(alert).toBeDefined();
    expect(alert.status).toBe('pending');
  });

  it('should skip AI analysis for very short messages (cost control)', async () => {
    const groupJid = `120363aiShortGroup${Date.now()}@g.us`;
    const msgId = `AI_TEST_SHORT_${Date.now()}`;
    const payload = {
      event: 'Message',
      data: {
        Info: {
          ID: msgId,
          Chat: groupJid,
          Sender: '6281319995895@s.whatsapp.net',
          IsFromMe: false,
          IsGroup: true,
          PushName: 'User Short',
          Timestamp: new Date().toISOString(),
        },
        Message: { conversation: 'ok' },
      },
      instanceName: 'wahub-main',
    };


    const res = await request(app)
      .post('/api/v1/webhooks/evolution-go')
      .send(payload);

    expect(res.status).toBe(200);

    await WebhooksService.processEvent(res.body.data.eventId);

    const [storedLog] = await db
      .select()
      .from(chatLogs)
      .where(eq(chatLogs.whatsappMsgId, msgId));

    expect(storedLog).toBeDefined();

    const [analysis] = await db
      .select()
      .from(aiAnalyses)
      .where(eq(aiAnalyses.chatLogId, storedLog.id));

    expect(analysis).toBeUndefined();
  });
});
