import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class EvolutionService {
  private static getHeaders() {
    return {
      'Content-Type': 'application/json',
      apikey: env.EVOLUTION_API_KEY,
    };
  }

  private static instanceQuery(instanceName: string) {
    return `?instance=${encodeURIComponent(instanceName)}`;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    const url = `${env.EVOLUTION_API_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const text = await response.text();
        logger.error(
          `Evolution Go error: ${response.status} ${response.statusText} at ${endpoint} - ${text}`
        );
        return null;
      }

      const payload = (await response.json()) as { data?: T };
      return payload.data ?? (payload as unknown as T);
    } catch (error) {
      logger.error(`Evolution Go connection failed at ${endpoint}:`, error);
      return null;
    }
  }

  // Instance Management
  static async createInstance(data: {
    instanceName: string;
    number?: string;
    webhookUrl?: string;
  }) {
    return this.request('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        name: data.instanceName,
        token: env.EVOLUTION_API_KEY,
      }),
    });
  }

  static async getConnectionState(instanceName: string) {
    return this.request<any>(`/instance/status${this.instanceQuery(instanceName)}`, {
      method: 'GET',
    });
  }

  static async connect(instanceName: string, webhookUrl?: string) {
    return this.request<any>(`/instance/connect${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        phone: '',
        ...(webhookUrl ? { webhookUrl } : {}),
        subscribe: ['MESSAGE', 'GROUP', 'CONNECTION'],
      }),
    });
  }

  static async fetchInstances() {
    return this.request<any[]>('/instance/all', {
      method: 'GET',
    });
  }

  static async healthCheck() {
    return this.request<{ status: string }>('/server/ok', {
      method: 'GET',
    });
  }

  static async getQr(instanceName: string) {
    return this.request<any>(`/instance/qr${this.instanceQuery(instanceName)}`, {
      method: 'GET',
    });
  }

  static async disconnect(instanceName: string) {
    return this.request(`/instance/disconnect${this.instanceQuery(instanceName)}`, {
      method: 'POST',
    });
  }

  static async logout(instanceName: string) {
    return this.request(`/instance/logout${this.instanceQuery(instanceName)}`, {
      method: 'DELETE',
    });
  }

  static async pair(instanceName: string, phone: string) {
    return this.request(`/instance/pair${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        phone,
      }),
    });
  }

  static async deleteInstance(instanceName: string) {
    const instances = await this.fetchInstances();
    const instance = (instances || []).find(
      (item) => item?.name === instanceName || item?.id === instanceName
    );
    const targetId = instance?.id ?? instanceName;
    return this.request(`/instance/delete/${encodeURIComponent(targetId)}`, {
      method: 'DELETE',
    });
  }

  // Messaging
  static async sendText(
    instanceName: string,
    number: string,
    text: string,
    delay = 1000
  ) {
    return this.request(`/send/text${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        number,
        text,
        delay,
      }),
    });
  }

  static async sendMedia(
    instanceName: string,
    number: string,
    type: 'image' | 'video' | 'document' | 'audio',
    url: string,
    caption?: string
  ) {
    return this.request(`/send/media${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        number,
        type,
        url,
        caption,
      }),
    });
  }

  // Groups
  static async fetchGroups(instanceName: string) {
    return this.request<any[]>(`/group/list${this.instanceQuery(instanceName)}`, {
      method: 'GET',
    });
  }

  static async findGroupInfo(instanceName: string, groupJid: string) {
    return this.request(`/group/info${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({ groupJid }),
    });
  }

  static async getParticipants(instanceName: string, groupJid: string) {
    const info = await this.findGroupInfo(instanceName, groupJid);
    return info ?? null;
  }

  static async createGroup(
    instanceName: string,
    groupName: string,
    participants: string[]
  ) {
    return this.request(`/group/create${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        groupName,
        participants,
      }),
    });
  }

  static async updateGroupName(
    instanceName: string,
    groupJid: string,
    name: string
  ) {
    return this.request(`/group/name${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        name,
      }),
    });
  }

  static async updateGroupDescription(
    instanceName: string,
    groupJid: string,
    description: string
  ) {
    return this.request(`/group/description${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        description,
      }),
    });
  }

  static async updateGroupInfo(
    instanceName: string,
    groupJid: string,
    description: string
  ) {
    return this.updateGroupDescription(instanceName, groupJid, description);
  }

  static async getInviteCode(instanceName: string, groupJid: string) {
    return this.request(`/group/invitelink${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        reset: false,
      }),
    });
  }

  static async addGroupParticipants(
    instanceName: string,
    groupJid: string,
    participants: string[]
  ) {
    return this.request(`/group/participant${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        action: 'add',
        participants,
      }),
    });
  }

  static async removeGroupParticipants(
    instanceName: string,
    groupJid: string,
    participants: string[]
  ) {
    return this.request(`/group/participant${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        action: 'remove',
        participants,
      }),
    });
  }


  // Communities (Evolution Go only)
  static async createCommunity(instanceName: string, name: string) {
    return this.request(`/community/create${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        communityName: name,
      }),
    });
  }

  static async addGroupsToCommunity(
    instanceName: string,
    communityJid: string,
    groups: string[]
  ) {
    return this.request(`/community/add${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        communityJid,
        groupJid: groups,
      }),
    });
  }

  static async removeGroupsFromCommunity(
    instanceName: string,
    communityJid: string,
    groups: string[]
  ) {
    return this.request(`/community/remove${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        communityJid,
        groupJid: groups,
      }),
    });
  }

  static async fetchCommunities(instanceName: string) {
    const groups = await this.fetchGroups(instanceName);
    return (groups || []).filter((group) => group && group.IsParent === true);
  }

  static async getCommunityInfo(instanceName: string, communityJid: string) {
    return this.findGroupInfo(instanceName, communityJid);
  }

  static async updateCommunity(
    instanceName: string,
    communityJid: string,
    name?: string,
    description?: string
  ) {
    if (name) {
      const nameResult = await this.updateGroupName(instanceName, communityJid, name);
      if (!nameResult) return null;
    }
    if (description) {
      return this.updateGroupDescription(instanceName, communityJid, description);
    }
    return this.findGroupInfo(instanceName, communityJid);
  }

  static async deleteCommunity(instanceName: string, communityJid: string) {
    return this.request(`/community/remove${this.instanceQuery(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({
        communityJid,
        groupJid: [],
      }),
    });
  }
}
