import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { getAuthToken } from './helpers.js';

describe('Members Module', () => {
  let token: string;
  let memberId: string;
  const testPhone = `628${Date.now().toString().slice(-9)}`;

  it('should list all members', async () => {
    token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/members')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should create a member', async () => {
    const res = await request(app)
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        whatsapp_number: testPhone,
        display_name: 'Member Test User',
        area: 'Surabaya',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.whatsapp_number).toBe(testPhone);
    memberId = res.body.data.id;
  });

  it('should update member details', async () => {
    expect(memberId).toBeDefined();
    const res = await request(app)
      .patch(`/api/v1/members/${memberId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        business_name: 'Super Biz',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.business_name).toBe('Super Biz');
  });

  it('should issue warning to member', async () => {
    expect(memberId).toBeDefined();
    const res = await request(app)
      .post(`/api/v1/members/${memberId}/warnings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        violation_type: 'Spamming',
        reason: 'Sending promo links',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.violation_type).toBe('Spamming');
  });
});
