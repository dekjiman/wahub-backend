import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { getAuthToken } from './helpers.js';

const { mockCommunityJid, mockGroupJid, currentCommunityJid } = vi.hoisted(() => {
  const ts = Date.now().toString().slice(-7);
  return {
    mockCommunityJid: `120363429${ts}@g.us`,
    mockGroupJid: `120363439${ts}@g.us`,
    currentCommunityJid: { value: '' },
  };
});

vi.mock('../services/evolution.service.js', () => ({
  EvolutionService: {
    createCommunity: vi.fn(async () => ({ JID: mockCommunityJid })),
    createGroup: vi.fn(async () => ({ jid: mockGroupJid })),
    addGroupsToCommunity: vi.fn(
      async (_instanceName: string, communityJid: string, groupJids: string[]) => {
        currentCommunityJid.value = communityJid;
        return { added: groupJids, failed: [] };
      }
    ),
    findGroupInfo: vi.fn(async () => ({ LinkedParentJID: currentCommunityJid.value })),
    sendText: vi.fn(async () => ({ id: 'MSG_OUTBOUND_TEST_123' })),
  },
}));

describe('Communities and Groups Module', () => {
  let token: string;
  let communityId: string;
  let groupId: string;

  it('should list and create communities', async () => {
    token = await getAuthToken();
    const createRes = await request(app)
      .post('/api/v1/communities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Business Community ${Date.now()}`,
        description: 'Testing community creation',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toContain('Test Business Community');
    communityId = createRes.body.data.id;

    const listRes = await request(app)
      .get('/api/v1/communities')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);
  });

  it('should create and manage group', async () => {
    const createGroupRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Alpha Testers Group',
        community_id: communityId,
      });

    expect(createGroupRes.status).toBe(201);
    expect(createGroupRes.body.data.name).toBe('Alpha Testers Group');
    groupId = createGroupRes.body.data.id;

    // Pause AI
    const pauseRes = await request(app)
      .post(`/api/v1/groups/${groupId}/pause-ai`)
      .set('Authorization', `Bearer ${token}`)
      .send({ minutes: 30 });

    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.data.ai_enabled).toBe(false);

    // Resume AI
    const resumeRes = await request(app)
      .post(`/api/v1/groups/${groupId}/resume-ai`)
      .set('Authorization', `Bearer ${token}`);

    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.ai_enabled).toBe(true);

    // Get group metrics
    const metricsRes = await request(app)
      .get(`/api/v1/groups/${groupId}/metrics`)
      .set('Authorization', `Bearer ${token}`);

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.data).toHaveProperty('total_members');

    // Get group messages (TASK-009)
    const messagesRes = await request(app)
      .get(`/api/v1/groups/${groupId}/messages?page=1&limit=10`)
      .set('Authorization', `Bearer ${token}`);

    expect(messagesRes.status).toBe(200);
    expect(messagesRes.body.success).toBe(true);
    expect(Array.isArray(messagesRes.body.data)).toBe(true);
    expect(messagesRes.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: expect.any(Number),
    });

    // Send group message (TASK-010)
    const sendRes = await request(app)
      .post(`/api/v1/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'text',
        text: 'Halo member Limestones!',
      });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.data.text).toBe('Halo member Limestones!');
    expect(sendRes.body.data.direction).toBe('outbound');

    // Verify RBAC protection: viewer role should be forbidden from sending messages (Anti-Ban & Role Check)
    const { generateToken } = await import('../utils/jwt.js');
    const viewerToken = generateToken({
      sub: 'viewer-uuid-123',
      email: 'viewer@wahub.com',
      role: 'viewer',
    });

    const forbiddenRes = await request(app)
      .post(`/api/v1/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        type: 'text',
        text: 'Forbidden attempt by viewer',
      });

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.errors[0].code).toBe('FORBIDDEN');
  });
});



