/**
 * MVP-P0-02 — la autoría de la activación del reto deja de perderse al recargar.
 *
 * De las 23 mutaciones del provider, 20 ya persistían. Estas 3 no: se veían guardadas en
 * pantalla y morían en la recarga, porque `Challenge` ni siquiera tenía columnas donde
 * guardarlas. La prueba de que era deuda conocida es que `reconcileChallenge` preservaba
 * estos campos a mano del estado local, para que `adaptChallenge` no los pisara con
 * defaults. Estos tests fijan lo contrario: cada mutación llega al backend, y si el
 * backend la rechaza el estado vuelve atrás en vez de mentirle al usuario.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';

vi.mock('../../../../app/services/portfolioService', () => ({
  listStrategicFronts: vi.fn(),
  listChallenges: vi.fn(),
  listInitiatives: vi.fn(),
  updateChallenge: vi.fn(),
}));

vi.mock('../../../../app/context/AppContext', () => ({
  useApp: vi.fn(),
}));

import * as portfolioService from '../../../../app/services/portfolioService';
import { useApp } from '../../../../app/context/AppContext';
import { PortfolioLeadProvider, usePortfolioLead } from '../PortfolioLeadContext';
import type { PortfolioLeadContextValue } from '../../domain/types';

const updateChallenge = portfolioService.updateChallenge as ReturnType<typeof vi.fn>;
const mockedUseApp = useApp as unknown as ReturnType<typeof vi.fn>;

const CHALLENGE_ID = 'challenge-open'; // del set de demo (enableDemoData)

/** Expone el value del context para poder invocar las mutaciones desde el test. */
function renderWithContext() {
  const ref: { current: PortfolioLeadContextValue | null } = { current: null };
  function Probe() {
    ref.current = usePortfolioLead();
    return null;
  }
  render(
    <PortfolioLeadProvider enableDemoData>
      <Probe />
    </PortfolioLeadProvider>,
  );
  return ref;
}

function challengeById(ctx: PortfolioLeadContextValue, id: string) {
  return ctx.challenges.find((c) => c.id === id)!;
}

describe('PortfolioLeadProvider — persistencia de la autoría de activación (MVP-P0-02)', () => {
  beforeEach(() => {
    updateChallenge.mockReset();
    mockedUseApp.mockReset();
    mockedUseApp.mockReturnValue({ isAuthenticated: true, authLoading: false });
    updateChallenge.mockResolvedValue({ id: CHALLENGE_ID, title: 'X', strategicFrontId: 'front-ops' });
  });

  it('updateChallengeActivationInputs persiste el objeto COMPLETO, no el parche', async () => {
    const ctx = renderWithContext();
    act(() => {
      ctx.current!.updateChallengeActivationInputs(CHALLENGE_ID, { urgency: 'alta' });
    });

    await waitFor(() => expect(updateChallenge).toHaveBeenCalledTimes(1));
    const [id, payload] = updateChallenge.mock.calls[0];
    expect(id).toBe(CHALLENGE_ID);
    // La columna es un Json que se reemplaza entero y zod exige los 9 ejes: mandar sólo
    // `urgency` dejaría el reto con una activación a medio describir.
    expect(payload.activationInputs.urgency).toBe('alta');
    expect(Object.keys(payload.activationInputs)).toHaveLength(9);
    expect(payload.activationInputs.dependency).toBeTruthy();
  });

  it('updateChallengeActivationRecommendationNote llega al backend', async () => {
    const ctx = renderWithContext();
    act(() => {
      ctx.current!.updateChallengeActivationRecommendationNote(CHALLENGE_ID, 'Conviene squad asignado.');
    });

    await waitFor(() => expect(updateChallenge).toHaveBeenCalledTimes(1));
    expect(updateChallenge.mock.calls[0][1].activationRecommendationNote).toBe('Conviene squad asignado.');
  });

  it('updateChallengeActivationMessageDraft llega al backend', async () => {
    const ctx = renderWithContext();
    act(() => {
      ctx.current!.updateChallengeActivationMessageDraft(CHALLENGE_ID, 'Equipo, abrimos el reto.');
    });

    await waitFor(() => expect(updateChallenge).toHaveBeenCalledTimes(1));
    expect(updateChallenge.mock.calls[0][1].activationMessageDraft).toBe('Equipo, abrimos el reto.');
  });

  it('si el backend rechaza, el estado REVIERTE en vez de mostrar algo que no se guardó', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    updateChallenge.mockRejectedValue(new Error('500'));

    const ctx = renderWithContext();
    const antes = challengeById(ctx.current!, CHALLENGE_ID).activationMessageDraft;

    act(() => {
      ctx.current!.updateChallengeActivationMessageDraft(CHALLENGE_ID, 'texto que no se guardara');
    });

    await waitFor(() =>
      expect(challengeById(ctx.current!, CHALLENGE_ID).activationMessageDraft).toBe(antes),
    );
    consoleError.mockRestore();
  });
});
