import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { getAuthToken } from './helpers.js';

describe('Analytics & Settings Modules', () => {
  let token: string;

  it('should fetch growth analytics', async () => {
    token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/analytics/growth')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should fetch sentiment analytics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/sentiment')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should fetch message activity, heatmaps, and moderation summary (TASK-018)', async () => {
    const actRes = await request(app)
      .get('/api/v1/analytics/message-activity?period=30d')
      .set('Authorization', `Bearer ${token}`);

    expect(actRes.status).toBe(200);
    expect(Array.isArray(actRes.body.data)).toBe(true);

    const heatRes = await request(app)
      .get('/api/v1/analytics/heatmaps')
      .set('Authorization', `Bearer ${token}`);

    expect(heatRes.status).toBe(200);
    expect(Array.isArray(heatRes.body.data)).toBe(true);

    const modRes = await request(app)
      .get('/api/v1/analytics/moderation-summary')
      .set('Authorization', `Bearer ${token}`);

    expect(modRes.status).toBe(200);
    expect(modRes.body.data.total_alerts).toBeGreaterThanOrEqual(0);
  });

  it('should export members, messages, and moderation data in CSV format (TASK-018)', async () => {
    const memExport = await request(app)
      .get('/api/v1/analytics/export/members')
      .set('Authorization', `Bearer ${token}`);

    expect(memExport.status).toBe(200);
    expect(memExport.header['content-type']).toContain('text/csv');
    expect(memExport.text).toContain('ID,WhatsApp Number');

    const msgExport = await request(app)
      .get('/api/v1/analytics/export/messages')
      .set('Authorization', `Bearer ${token}`);

    expect(msgExport.status).toBe(200);
    expect(msgExport.header['content-type']).toContain('text/csv');
    expect(msgExport.text).toContain('ID,Group ID');

    const modExport = await request(app)
      .get('/api/v1/analytics/export/moderation')
      .set('Authorization', `Bearer ${token}`);

    expect(modExport.status).toBe(200);
    expect(modExport.header['content-type']).toContain('text/csv');
    expect(modExport.text).toContain('ID,Group ID');
  });

  it('should get and update system settings', async () => {
    const listRes = await request(app)
      .get('/api/v1/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    const updateRes = await request(app)
      .patch('/api/v1/settings/site_name')
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 'Limestone Hub Pro' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.value).toBe('Limestone Hub Pro');
  });
});

