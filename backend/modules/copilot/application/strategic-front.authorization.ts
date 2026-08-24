import type { Role } from '../../../shared/types/user.types';
import { PORTFOLIO_CREATE_STRATEGIC_FRONT_PERMISSION } from './capability-registry';

export type StrategicFrontAuthorizationUser = {
  id: string;
  role: Role;
  organizationId?: string | null;
};

export type OrganizationAccessSnapshot = {
  organizationExists: boolean;
  isMember: boolean;
  membershipRole?: string | null;
};

export interface OrganizationAccessReader {
  getOrganizationAccess(userId: string, organizationId: string): Promise<OrganizationAccessSnapshot>;
}

export type AuthorizationResult =
  | {
      allowed: true;
      permission: typeof PORTFOLIO_CREATE_STRATEGIC_FRONT_PERMISSION;
      reason: 'platform_admin' | 'authorized_organization_member';
    }
  | {
      allowed: false;
      permission: typeof PORTFOLIO_CREATE_STRATEGIC_FRONT_PERMISSION;
      reason: 'organization_not_found' | 'role_not_allowed' | 'not_organization_member';
    };

const CREATE_FRONT_ROLES = new Set<Role>(['admin', 'mentor']);

export async function canCreateStrategicFront(
  user: StrategicFrontAuthorizationUser,
  organizationId: string,
  accessReader: OrganizationAccessReader,
): Promise<AuthorizationResult> {
  const access = await accessReader.getOrganizationAccess(user.id, organizationId);
  if (!access.organizationExists) {
    return {
      allowed: false,
      permission: PORTFOLIO_CREATE_STRATEGIC_FRONT_PERMISSION,
      reason: 'organization_not_found',
    };
  }

  if (!CREATE_FRONT_ROLES.has(user.role)) {
    return {
      allowed: false,
      permission: PORTFOLIO_CREATE_STRATEGIC_FRONT_PERMISSION,
      reason: 'role_not_allowed',
    };
  }

  if (user.role === 'admin') {
    return {
      allowed: true,
      permission: PORTFOLIO_CREATE_STRATEGIC_FRONT_PERMISSION,
      reason: 'platform_admin',
    };
  }

  if (!access.isMember && user.organizationId !== organizationId) {
    return {
      allowed: false,
      permission: PORTFOLIO_CREATE_STRATEGIC_FRONT_PERMISSION,
      reason: 'not_organization_member',
    };
  }

  return {
    allowed: true,
    permission: PORTFOLIO_CREATE_STRATEGIC_FRONT_PERMISSION,
    reason: 'authorized_organization_member',
  };
}
