import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { getAuthToken } from './helpers.js';

describe('Admins Module', () => {
  let token: string;
  let createdAdminId: string;

  it('should list all admins', async () => {
    token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/admins')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should create a new admin', async () => {
    const res = await request(app)
      .post('/api/v1/admins')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Manager',
        email: 'testmanager@wahub.com',
        password: 'password123',
        role: 'business_manager',
        phone: '628999888777',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('testmanager@wahub.com');
    createdAdminId = res.body.data.id;
  });

  it('should update an admin', async () => {
    const res = await request(app)
      .patch(`/api/v1/admins/${createdAdminId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Manager Name',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Manager Name');
  });

  it('should delete an admin', async () => {
    const res = await request(app)
      .delete(`/api/v1/admins/${createdAdminId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
