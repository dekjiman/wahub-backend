import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/api-response.js';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    // Admins
    'admin.view', 'admins.view',
    'admin.create', 'admins.create',
    'admin.edit', 'admins.edit',
    'admin.delete', 'admins.delete',
    // Members
    'member.view', 'members.view',
    'member.create', 'members.create',
    'member.edit', 'members.edit',
    'member.warning', 'members.warning',
    // Groups
    'group.view', 'groups.view',
    'group.create', 'groups.create',
    'group.edit', 'groups.edit',
    'group.manage', 'groups.manage',
    'group.delete', 'groups.delete',
    'group.ai_control', 'groups.ai_control',
    // Communities
    'community.view', 'communities.view',
    'community.create', 'communities.create',
    'community.edit', 'communities.edit',
    'community.delete', 'communities.delete',
    // Broadcasts
    'broadcast.view', 'broadcasts.view',
    'broadcast.create', 'broadcasts.create',
    'broadcast.approve', 'broadcasts.approve',
    // Moderation
    'moderation.view', 'moderations.view',
    'moderation.approve', 'moderations.approve',
    'moderation.reject', 'moderations.reject',
    'moderation.execute', 'moderations.execute',
    // Escalations
    'escalation.view', 'escalations.view',
    'escalation.assign', 'escalations.assign',
    'escalation.update', 'escalations.update',
    // Dashboard
    'dashboard.view', 'dashboards.view',
    'dashboard.analytics', 'dashboards.analytics',
    // Settings
    'settings.view', 'settings.manage', 'settings.edit',
    // Audit
    'audit.view', 'audits.view',
    // Integrations
    'integration.view', 'integrations.view',
    'integration.refresh', 'integrations.refresh',
    // Workflows
    'workflow.view', 'workflows.view',
    // Analytics
    'analytics.view',
  ],
  business_manager: [
    'admin.view', 'admins.view',
    'admin.create', 'admins.create',
    'admin.edit', 'admins.edit',
    'member.view', 'members.view',
    'member.create', 'members.create',
    'member.edit', 'members.edit',
    'member.warning', 'members.warning',
    'group.view', 'groups.view',
    'group.create', 'groups.create',
    'group.edit', 'groups.edit',
    'group.manage', 'groups.manage',
    'group.delete', 'groups.delete',
    'community.view', 'communities.view',
    'community.create', 'communities.create',
    'community.edit', 'communities.edit',
    'community.delete', 'communities.delete',
    'broadcast.view', 'broadcasts.view',
    'broadcast.create', 'broadcasts.create',
    'broadcast.approve', 'broadcasts.approve',
    'moderation.view', 'moderations.view',
    'moderation.approve', 'moderations.approve',
    'moderation.reject', 'moderations.reject',
    'moderation.execute', 'moderations.execute',
    'escalation.view', 'escalations.view',
    'escalation.assign', 'escalations.assign',
    'escalation.update', 'escalations.update',
    'dashboard.view', 'dashboards.view',
    'dashboard.analytics', 'dashboards.analytics',
    'settings.view', 'settings.manage',
    'audit.view', 'audits.view',
    'integration.view', 'integrations.view',
    'integration.refresh', 'integrations.refresh',
    'workflow.view', 'workflows.view',
    'analytics.view',
  ],
  area_manager: [
    'admin.view', 'admins.view',
    'member.view', 'members.view',
    'member.create', 'members.create',
    'member.edit', 'members.edit',
    'member.warning', 'members.warning',
    'group.view', 'groups.view',
    'group.edit', 'groups.edit',
    'community.view', 'communities.view',
    'broadcast.view', 'broadcasts.view',
    'moderation.view', 'moderations.view',
    'moderation.approve', 'moderations.approve',
    'moderation.reject', 'moderations.reject',
    'escalation.view', 'escalations.view',
    'escalation.update', 'escalations.update',
    'dashboard.view', 'dashboards.view',
    'dashboard.analytics', 'dashboards.analytics',
    'integration.view', 'integrations.view',
    'analytics.view',
  ],
  support: [
    'admin.view', 'admins.view',
    'member.view', 'members.view',
    'member.warning', 'members.warning',
    'group.view', 'groups.view',
    'community.view', 'communities.view',
    'broadcast.view', 'broadcasts.view',
    'moderation.view', 'moderations.view',
    'moderation.approve', 'moderations.approve',
    'moderation.reject', 'moderations.reject',
    'escalation.view', 'escalations.view',
    'escalation.update', 'escalations.update',
    'dashboard.view', 'dashboards.view',
    'analytics.view',
  ],
  viewer: [
    'admin.view', 'admins.view',
    'member.view', 'members.view',
    'group.view', 'groups.view',
    'community.view', 'communities.view',
    'broadcast.view', 'broadcasts.view',
    'moderation.view', 'moderations.view',
    'escalation.view', 'escalations.view',
    'dashboard.view', 'dashboards.view',
    'analytics.view',
  ],
};

export const getRolePermissions = (role: string): string[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole) {
      return ApiResponse.error(
        res,
        { code: 'UNAUTHORIZED', message: 'User role not found' },
        401
      );
    }

    const permissions = getRolePermissions(userRole);
    if (!permissions.includes(permission)) {
      return ApiResponse.error(
        res,
        {
          code: 'FORBIDDEN',
          message: `Permission denied: ${permission} required`,
        },
        403
      );
    }

    next();
  };
};
