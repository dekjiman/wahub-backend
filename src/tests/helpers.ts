import request from 'supertest';
import { app } from '../app.js';

export async function getAuthToken(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'admin@wahub.com',
      password: 'password123',
    });

  return res.body.data.token;
}
