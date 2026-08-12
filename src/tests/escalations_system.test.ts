import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { getAuthToken } from './helpers.js';

vi.mock('../modules/communities/communities.service.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../modules/communities/communities.service.js')>();
  return {
    CommunitiesService: {
      ...mod.CommunitiesService,
      syncFromWhatsApp: vi.fn(async (instanceName: string) => ({
        instance: instanceName,
        found: 0,
        created: 0,
        updated: 0,
        deactivated: 0,
      })),
    },
  };
});

vi.mock('../modules/groups/groups.service.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../modules/groups/groups.service.js')>();
  return {
    GroupsService: {
      ...mod.GroupsService,
      syncFromWhatsApp: vi.fn(async (instanceName: string) => ({
        instance: instanceName,
        found: 0,
        created: 0,
        updated: 0,
        deactivated: 0,
      })),
    },
  };
});


describe('Escalations, Integrations, Workflows & Audit Logs', () => {
  let token: string;


  it('should list escalations', async () => {
    token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/escalations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should list integrations', async () => {
    const res = await request(app)
      .get('/api/v1/integrations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should list workflows', async () => {
    const res = await request(app)
      .get('/api/v1/workflows')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should list audit logs', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should execute reconciliation job (TASK-012)', async () => {
    const { ReconciliationService } = await import('../services/reconciliation.service.js');
    const res = await request(app)
      .post('/api/v1/whatsapp/reconcile')
      .set('Authorization', `Bearer ${token}`)
      .send({ instance_name: 'wahub-main' });

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);

    const directRes = await ReconciliationService.runReconciliation('wahub-main');
    expect(directRes.success).toBe(true);
  });
});

