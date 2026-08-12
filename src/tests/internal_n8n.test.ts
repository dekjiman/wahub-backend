import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { db } from '../config/database.js';
import { webhookEvents } from '../../drizzle/schema.js';

describe('Internal API & n8n Integration (TASK-013)', () => {
  const internalToken = env.N8N_INTERNAL_TOKEN;

  it('should reject request without valid internal service token', async () => {
    const res = await request(app).get('/api/internal/events/invalid-uuid');

    expect(res.status).toBe(401);
    expect(res.body.errors[0].code).toBe('UNAUTHORIZED');
  });

  it('should get event by ID via internal API', async () => {
    const [inserted] = await db
      .insert(webhookEvents)
      .values({
        provider: 'evolution_go',
        eventType: 'Message',
        payload: { text: 'n8n test' },
      })
      .returning();

    const res = await request(app)
      .get(`/api/internal/events/${inserted.id}`)
      .set('Authorization', `Bearer ${internalToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(inserted.id);
    expect(res.body.data.event_type).toBe('Message');
  });

  it('should post ai-analysis via internal API', async () => {
    const res = await request(app)
      .post('/api/internal/ai-analyses')
      .set('Authorization', `Bearer ${internalToken}`)
      .send({
        analysis_type: 'moderation_sentiment',
        result: { is_spam: false, sentiment: 'positive' },
        confidence: 0.98,
        model_used: 'gpt-4o-mini',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.analysis_type).toBe('moderation_sentiment');
    expect(res.body.data.result.sentiment).toBe('positive');
  });

  it('should post moderation-alert via internal API', async () => {
    const res = await request(app)
      .post('/api/internal/moderation-alerts')
      .set('Authorization', `Bearer ${internalToken}`)
      .send({
        alert_type: 'spam',
        severity: 'high',
        description: 'Spam detected by n8n AI workflow',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.alert_type).toBe('spam');
    expect(res.body.data.severity).toBe('high');
  });

  it('should post escalation ticket via internal API', async () => {
    const res = await request(app)
      .post('/api/internal/escalations')
      .set('Authorization', `Bearer ${internalToken}`)
      .send({
        title: 'Customer complaint needs human support',
        description: 'Member requested escalation',
        priority: 'high',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Customer complaint needs human support');
    expect(res.body.data.status).toBe('open');
  });

  it('should record workflow-run via internal API', async () => {
    const res = await request(app)
      .post('/api/internal/workflow-runs')
      .set('Authorization', `Bearer ${internalToken}`)
      .send({
        name: 'WF-01 Incoming Message Analysis',
        trigger_type: 'webhook',
        status: 'completed',
        duration_ms: 120,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('WF-01 Incoming Message Analysis');
    expect(res.body.data.status).toBe('completed');
  });
});
