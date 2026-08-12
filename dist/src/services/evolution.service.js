"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionService = void 0;
const env_js_1 = require("../config/env.js");
const logger_js_1 = require("../utils/logger.js");
class EvolutionService {
    static getHeaders() {
        return {
            'Content-Type': 'application/json',
            apikey: env_js_1.env.EVOLUTION_API_KEY,
        };
    }
    static instanceQuery(instanceName) {
        return `?instance=${encodeURIComponent(instanceName)}`;
    }
    static async request(endpoint, options = {}) {
        const url = `${env_js_1.env.EVOLUTION_API_URL}${endpoint}`;
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
                logger_js_1.logger.error(`Evolution Go error: ${response.status} ${response.statusText} at ${endpoint} - ${text}`);
                return null;
            }
            const payload = (await response.json());
            return payload.data ?? payload;
        }
        catch (error) {
            logger_js_1.logger.error(`Evolution Go connection failed at ${endpoint}:`, error);
            return null;
        }
    }
    // Instance Management
    static async createInstance(data) {
        return this.request('/instance/create', {
            method: 'POST',
            body: JSON.stringify({
                name: data.instanceName,
                token: env_js_1.env.EVOLUTION_API_KEY,
            }),
        });
    }
    static async getConnectionState(instanceName) {
        return this.request(`/instance/status${this.instanceQuery(instanceName)}`, {
            method: 'GET',
        });
    }
    static async connect(instanceName, webhookUrl) {
        return this.request(`/instance/connect${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                phone: '',
                ...(webhookUrl ? { webhookUrl } : {}),
            }),
        });
    }
    static async fetchInstances() {
        return this.request('/instance/all', {
            method: 'GET',
        });
    }
    static async healthCheck() {
        return this.request('/server/ok', {
            method: 'GET',
        });
    }
    static async getQr(instanceName) {
        return this.request(`/instance/qr${this.instanceQuery(instanceName)}`, {
            method: 'GET',
        });
    }
    static async disconnect(instanceName) {
        return this.request(`/instance/disconnect${this.instanceQuery(instanceName)}`, {
            method: 'POST',
        });
    }
    static async logout(instanceName) {
        return this.request(`/instance/logout${this.instanceQuery(instanceName)}`, {
            method: 'DELETE',
        });
    }
    static async pair(instanceName, phone) {
        return this.request(`/instance/pair${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                phone,
            }),
        });
    }
    static async deleteInstance(instanceName) {
        const instances = await this.fetchInstances();
        const instance = (instances || []).find((item) => item?.name === instanceName || item?.id === instanceName);
        const targetId = instance?.id ?? instanceName;
        return this.request(`/instance/delete/${encodeURIComponent(targetId)}`, {
            method: 'DELETE',
        });
    }
    // Messaging
    static async sendText(instanceName, number, text, delay = 1000) {
        return this.request(`/send/text${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                number,
                text,
                delay,
            }),
        });
    }
    static async sendMedia(instanceName, number, type, url, caption) {
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
    static async fetchGroups(instanceName) {
        return this.request(`/group/list${this.instanceQuery(instanceName)}`, {
            method: 'GET',
        });
    }
    static async findGroupInfo(instanceName, groupJid) {
        return this.request(`/group/info${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({ groupJid }),
        });
    }
    static async getParticipants(instanceName, groupJid) {
        const info = await this.findGroupInfo(instanceName, groupJid);
        return info ?? null;
    }
    static async createGroup(instanceName, groupName, participants) {
        return this.request(`/group/create${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                groupName,
                participants,
            }),
        });
    }
    static async updateGroupName(instanceName, groupJid, name) {
        return this.request(`/group/name${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                groupJid,
                name,
            }),
        });
    }
    static async updateGroupDescription(instanceName, groupJid, description) {
        return this.request(`/group/description${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                groupJid,
                description,
            }),
        });
    }
    static async updateGroupInfo(instanceName, groupJid, description) {
        return this.updateGroupDescription(instanceName, groupJid, description);
    }
    static async getInviteCode(instanceName, groupJid) {
        return this.request(`/group/invitelink${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                groupJid,
                reset: false,
            }),
        });
    }
    static async addGroupParticipants(instanceName, groupJid, participants) {
        return this.request(`/group/participant${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                groupJid,
                action: 'add',
                participants,
            }),
        });
    }
    static async removeGroupParticipants(instanceName, groupJid, participants) {
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
    static async createCommunity(instanceName, name) {
        return this.request(`/community/create${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                communityName: name,
            }),
        });
    }
    static async addGroupsToCommunity(instanceName, communityJid, groups) {
        return this.request(`/community/add${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                communityJid,
                groupJid: groups,
            }),
        });
    }
    static async removeGroupsFromCommunity(instanceName, communityJid, groups) {
        return this.request(`/community/remove${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                communityJid,
                groupJid: groups,
            }),
        });
    }
    static async fetchCommunities(instanceName) {
        const groups = await this.fetchGroups(instanceName);
        return (groups || []).filter((group) => group && group.IsParent === true);
    }
    static async getCommunityInfo(instanceName, communityJid) {
        return this.findGroupInfo(instanceName, communityJid);
    }
    static async updateCommunity(instanceName, communityJid, name, description) {
        if (name) {
            const nameResult = await this.updateGroupName(instanceName, communityJid, name);
            if (!nameResult)
                return null;
        }
        if (description) {
            return this.updateGroupDescription(instanceName, communityJid, description);
        }
        return this.findGroupInfo(instanceName, communityJid);
    }
    static async deleteCommunity(instanceName, communityJid) {
        return this.request(`/community/remove${this.instanceQuery(instanceName)}`, {
            method: 'POST',
            body: JSON.stringify({
                communityJid,
                groupJid: [],
            }),
        });
    }
}
exports.EvolutionService = EvolutionService;
