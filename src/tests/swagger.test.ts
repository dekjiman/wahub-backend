import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Swagger Documentation', () => {
  it('should return complete OpenAPI 3.0 spec at /api/docs', async () => {
    const res = await request(app).get('/api/docs');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.info.title).toBe('Wahub Backend REST API');
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(30);
    expect(res.body.tags.length).toBe(16);
  });

  it('should serve Swagger UI at /api/docs/ui/', async () => {
    const res = await request(app).get('/api/docs/ui/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });
});
