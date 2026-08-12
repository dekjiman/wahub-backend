import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { getAuthToken } from './helpers.js';

describe('Auth Module', () => {
  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@wahub.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('admin@wahub.com');
    expect(res.body.data.user.role).toBe('super_admin');
  });

  it('should fail login with invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@wahub.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.errors[0].code).toBe('INVALID_CREDENTIALS');
  });

  it('should fetch current admin with /me endpoint', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@wahub.com');
    expect(res.body.data.permissions).toContain('admin.view');
  });
});
