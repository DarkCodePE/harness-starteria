import { describe, expect, it, vi } from 'vitest';
import { ApprovalService } from '../application/approval.service';
import { deriveActionPlanStatus } from '../application/action-plan-status';
import { createDefaultCapabilityRegistry } from '../application/capability-registry';
import { makeAction, makeConversation, makePlan, makeRepository, validCreateFrontPayload } from './test-utils';

describe('ApprovalService', () => {
  it('aprueba una ProposedAction valida y recalcula el ActionPlan', async () => {
    const repo = makeRepository();
    const service = new ApprovalService(repo, createDefaultCapabilityRegistry());

    const approved = await service.approveProposedAction({
      actionId: 'action1',
      expectedVersion: 1,
      approvedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    });

    expect(approved.status).toBe('approved');
    expect(repo.approveProposedAction).toHaveBeenCalledWith('action1', expect.objectContaining({
      expectedVersion: 1,
      approvedBy: 'mentor1',
    }));
    expect(repo.updateActionPlanStatus).toHaveBeenCalledWith('plan1', 'approved');
    expect(repo.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'copilot.proposed_action.approved',
    }));
  });

  it('rechaza una ProposedAction y bloquea dependientes', async () => {
    const dependent = makeAction({ id: 'action2', dependencyActionIds: ['action1'] });
    const repo = makeRepository({
      findActionPlanById: vi.fn(async () => makePlan({ proposedActions: [makeAction(), dependent] })),
    });
    const service = new ApprovalService(repo, createDefaultCapabilityRegistry());

    const rejected = await service.rejectProposedAction({
      actionId: 'action1',
      expectedVersion: 1,
      rejectedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
      reason: 'No es prioridad',
    });

    expect(rejected.status).toBe('rejected');
    expect(repo.updateProposedActionStatus).toHaveBeenCalledWith('action2', 'blocked');
    expect(repo.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'copilot.proposed_action.rejected',
      details: expect.objectContaining({ reason: 'No es prioridad' }),
    }));
  });

  it('rechaza version incorrecta', async () => {
    const service = new ApprovalService(makeRepository(), createDefaultCapabilityRegistry());

    await expect(service.approveProposedAction({
      actionId: 'action1',
      expectedVersion: 2,
      approvedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    })).rejects.toMatchObject({ code: 'STALE_ACTION_VERSION' });
  });

  it('rechaza permiso insuficiente', async () => {
    const service = new ApprovalService(makeRepository(), createDefaultCapabilityRegistry());

    await expect(service.approveProposedAction({
      actionId: 'action1',
      expectedVersion: 1,
      approvedBy: { id: 'viewer1', role: 'viewer', organizationId: 'org1' },
      organizationId: 'org1',
    })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
  });

  it('rechaza organizacion cruzada entre conversacion y request', async () => {
    const repo = makeRepository({
      findConversationById: vi.fn(async () => makeConversation({ organizationId: 'org2' })),
    });
    const service = new ApprovalService(repo, createDefaultCapabilityRegistry());

    await expect(service.approveProposedAction({
      actionId: 'action1',
      expectedVersion: 1,
      approvedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    })).rejects.toMatchObject({ code: 'ORGANIZATION_ACCESS_DENIED' });
  });

  it('rechaza payload invalido', async () => {
    const repo = makeRepository({
      findProposedActionById: vi.fn(async () => makeAction({
        proposedPayload: validCreateFrontPayload({ sponsorId: 'unsupported' }),
      })),
    });
    const service = new ApprovalService(repo, createDefaultCapabilityRegistry());

    await expect(service.approveProposedAction({
      actionId: 'action1',
      expectedVersion: 1,
      approvedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    })).rejects.toMatchObject({ code: 'INVALID_CAPABILITY_PAYLOAD' });
  });

  it('rechaza capability inexistente', async () => {
    const repo = makeRepository({
      findProposedActionById: vi.fn(async () => makeAction({ capabilityId: 'MissingCapability' })),
    });
    const service = new ApprovalService(repo, createDefaultCapabilityRegistry());

    await expect(service.approveProposedAction({
      actionId: 'action1',
      expectedVersion: 1,
      approvedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    })).rejects.toMatchObject({ code: 'CAPABILITY_NOT_FOUND' });
  });
});

describe('deriveActionPlanStatus', () => {
  it('calcula estados agregados del plan', () => {
    expect(deriveActionPlanStatus([makeAction({ status: 'proposed' })])).toBe('awaiting_confirmation');
    expect(deriveActionPlanStatus([makeAction({ status: 'approved' }), makeAction({ id: 'a2', status: 'proposed' })])).toBe('partially_approved');
    expect(deriveActionPlanStatus([makeAction({ status: 'approved' })])).toBe('approved');
    expect(deriveActionPlanStatus([makeAction({ status: 'executing' })])).toBe('executing');
    expect(deriveActionPlanStatus([makeAction({ status: 'completed' }), makeAction({ id: 'a2', status: 'failed' })])).toBe('partially_completed');
    expect(deriveActionPlanStatus([makeAction({ status: 'completed' })])).toBe('completed');
    expect(deriveActionPlanStatus([makeAction({ status: 'failed' })])).toBe('failed');
  });
});

