import { describe, expect, it, vi } from 'vitest';
import { canCreateStrategicFront, type OrganizationAccessReader } from '../application/strategic-front.authorization';

function accessReader(snapshot: Awaited<ReturnType<OrganizationAccessReader['getOrganizationAccess']>>): OrganizationAccessReader {
  return {
    getOrganizationAccess: vi.fn(async () => snapshot),
  };
}

describe('canCreateStrategicFront', () => {
  it('autoriza rol admin si la organizacion existe', async () => {
    const result = await canCreateStrategicFront(
      { id: 'admin1', role: 'admin' },
      'org1',
      accessReader({ organizationExists: true, isMember: false }),
    );

    expect(result).toMatchObject({ allowed: true, reason: 'platform_admin' });
  });

  it('autoriza rol mentor si pertenece a la organizacion', async () => {
    const result = await canCreateStrategicFront(
      { id: 'mentor1', role: 'mentor' },
      'org1',
      accessReader({ organizationExists: true, isMember: true, membershipRole: 'member' }),
    );

    expect(result).toMatchObject({ allowed: true, reason: 'authorized_organization_member' });
  });

  it('rechaza rol no autorizado', async () => {
    const result = await canCreateStrategicFront(
      { id: 'viewer1', role: 'viewer' },
      'org1',
      accessReader({ organizationExists: true, isMember: true }),
    );

    expect(result).toMatchObject({ allowed: false, reason: 'role_not_allowed' });
  });

  it('rechaza mentor de otra organizacion', async () => {
    const result = await canCreateStrategicFront(
      { id: 'mentor1', role: 'mentor', organizationId: 'other' },
      'org1',
      accessReader({ organizationExists: true, isMember: false }),
    );

    expect(result).toMatchObject({ allowed: false, reason: 'not_organization_member' });
  });

  it('rechaza organizacion inexistente', async () => {
    const result = await canCreateStrategicFront(
      { id: 'admin1', role: 'admin' },
      'missing',
      accessReader({ organizationExists: false, isMember: false }),
    );

    expect(result).toMatchObject({ allowed: false, reason: 'organization_not_found' });
  });
});
