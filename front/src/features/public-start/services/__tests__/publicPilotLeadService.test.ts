/**
 * Tests for publicPilotLeadService (TASK-012 / SPEC-003 §Flujo B).
 *
 * Locks the API-backed contract + the localStorage idempotency cache:
 *   - submit POSTs to /public/pilot-leads and returns the server lead (pilotCode)
 *   - a successful submit is cached and retrievable by draftId
 *   - a network failure rejects WITHOUT caching (no false "submitted" state)
 *
 * The service builds its own bare axios instance, so we mock `axios.create`.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));
vi.mock('axios', () => ({
  default: { create: () => ({ post: postMock }) },
}));

import {
  submitPilotInterest,
  getPilotInterestByDraftId,
  type PilotInterestPayload,
} from '../publicPilotLeadService';

const DRAFT_ID = 'draft-pilot-1';
const PAYLOAD: PilotInterestPayload = {
  name: '  Ana Rodríguez ',
  email: '  Ana@Example.com ',
  phone: ' +51 999 888 777 ',
  organization: ' Efectiva ',
  consentAccepted: true,
};

function okResponse() {
  return {
    data: {
      success: true,
      data: { id: 'lead-uuid-1', pilotCode: 'ST-PILOT-AB12', status: 'submitted', createdAt: '2026-05-29T12:00:00.000Z' },
    },
  };
}

beforeEach(() => {
  postMock.mockReset();
  window.localStorage.clear();
});

describe('publicPilotLeadService', () => {
  it('POSTs trimmed/normalized data and returns the server lead', async () => {
    postMock.mockResolvedValue(okResponse());

    const lead = await submitPilotInterest(DRAFT_ID, PAYLOAD);

    expect(postMock).toHaveBeenCalledTimes(1);
    const [url, body] = postMock.mock.calls[0];
    expect(url).toBe('/public/pilot-leads');
    expect(body).toMatchObject({
      draftId: DRAFT_ID,
      name: 'Ana Rodríguez',
      email: 'ana@example.com',
      organization: 'Efectiva',
      consentAccepted: true,
    });

    expect(lead.id).toBe('lead-uuid-1');
    expect(lead.pilotCode).toBe('ST-PILOT-AB12');
    expect(lead.status).toBe('submitted');
  });

  it('caches a successful submit, retrievable by draftId', async () => {
    postMock.mockResolvedValue(okResponse());
    expect(getPilotInterestByDraftId(DRAFT_ID)).toBeNull();

    await submitPilotInterest(DRAFT_ID, PAYLOAD);

    const cached = getPilotInterestByDraftId(DRAFT_ID);
    expect(cached?.pilotCode).toBe('ST-PILOT-AB12');
    expect(cached?.email).toBe('ana@example.com');
  });

  it('rejects on network failure and does NOT cache (no false submitted state)', async () => {
    postMock.mockRejectedValue(new Error('Network Error'));

    await expect(submitPilotInterest(DRAFT_ID, PAYLOAD)).rejects.toThrow();
    expect(getPilotInterestByDraftId(DRAFT_ID)).toBeNull();
  });
});
