import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { getAuthToken } from './helpers.js';

describe('Dashboard Module', () => {
  let token: string;

  it('should fetch dashboard summary', async () => {
    token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total_communities');
    expect(res.body.data).toHaveProperty('total_groups');
    expect(res.body.data).toHaveProperty('total_members');
  });

  it('should fetch service health', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/health')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should fetch recent activities', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/recent-activities')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
