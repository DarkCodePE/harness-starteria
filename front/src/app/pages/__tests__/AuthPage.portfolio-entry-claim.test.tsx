import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AuthPage } from '../AuthPage';

const navigateSpy = vi.hoisted(() => vi.fn());
const appMocks = vi.hoisted(() => ({
  createProjectFromPublicDraft: vi.fn(),
}));
const portfolioEntryMocks = vi.hoisted(() => ({
  readPendingPortfolioEntryClaim: vi.fn(() => ({ sessionId: 'session-1', credential: 'entry-token' })),
  clearPendingPortfolioEntryClaim: vi.fn(),
  clearPortfolioEntryCurrentSession: vi.fn(),
  getPortfolioEntrySession: vi.fn(() => Promise.resolve({ revision: 7 })),
  claimPortfolioEntrySession: vi.fn(() => Promise.resolve({ ownership: { state: 'CLAIMED' } })),
  saveClaimedPortfolioEntrySession: vi.fn(),
  savePortfolioEntryClaimedNotice: vi.fn(),
  trackPortfolioEntryEvent: vi.fn(),
}));

vi.mock('react-router', () => ({
  useNavigate: () => navigateSpy,
}));

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    login: vi.fn(),
    register: vi.fn(),
    googleSignIn: vi.fn(),
    isAuthenticated: true,
    user: { id: 'user-1', role: 'participante' },
    createProjectFromPublicDraft: appMocks.createProjectFromPublicDraft,
  }),
}));

vi.mock('../../components/auth/GoogleSignInButton', () => ({
  GoogleSignInButton: () => null,
}));

vi.mock('../../../features/public-start/services/publicPilotLeadService', () => ({
  getPendingPilotClaim: () => ({ claimToken: 'pilot-token' }),
}));

vi.mock('../../../features/portfolio-entry/public', () => portfolioEntryMocks);

vi.mock('../../../features/portfolio-entry/public/idempotency', () => ({
  createIdempotencyKey: () => 'claim-key',
}));

describe('AuthPage Portfolio Entry claim continuation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('claims pending Portfolio Entry before any pilot/PublicDraft conversion path', async () => {
    render(<AuthPage />);

    await waitFor(() => {
      expect(portfolioEntryMocks.claimPortfolioEntrySession).toHaveBeenCalledWith(
        'session-1',
        'entry-token',
        { expectedRevision: 7, idempotencyKey: 'claim-key' },
      );
    });

    expect(portfolioEntryMocks.clearPendingPortfolioEntryClaim).toHaveBeenCalled();
    expect(portfolioEntryMocks.clearPortfolioEntryCurrentSession).toHaveBeenCalled();
    expect(portfolioEntryMocks.saveClaimedPortfolioEntrySession).toHaveBeenCalledWith({ sessionId: 'session-1' });
    expect(portfolioEntryMocks.savePortfolioEntryClaimedNotice).toHaveBeenCalledWith('session-1');
    expect(appMocks.createProjectFromPublicDraft).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/public/start', { replace: true });
    expect(navigateSpy).not.toHaveBeenCalledWith('/continuar-piloto', expect.anything());
  });
});
