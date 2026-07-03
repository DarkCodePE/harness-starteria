import { describe, expect, it, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, waitFor } from '@testing-library/react';

// El provider monta global en RootLayout (incluida la landing pública). La
// hidratación desde el backend solo debe dispararse con sesión autenticada:
// un visitante anónimo no debe generar llamadas autenticadas (401 → refresh
// fallido → redirect a /auth) desde una ruta pública.
vi.mock('../../../../app/services/portfolioService', () => ({
  listStrategicFronts: vi.fn(),
  listChallenges: vi.fn(),
  listInitiatives: vi.fn(),
}));

vi.mock('../../../../app/context/AppContext', () => ({
  useApp: vi.fn(),
}));

import * as portfolioService from '../../../../app/services/portfolioService';
import { useApp } from '../../../../app/context/AppContext';
import { PortfolioLeadProvider } from '../PortfolioLeadContext';

const listStrategicFronts = portfolioService.listStrategicFronts as ReturnType<typeof vi.fn>;
const mockedUseApp = useApp as unknown as ReturnType<typeof vi.fn>;

function renderProvider() {
  return render(
    <PortfolioLeadProvider>
      <div data-testid="child" />
    </PortfolioLeadProvider>,
  );
}

describe('PortfolioLeadProvider — hidratación gateada por sesión', () => {
  beforeEach(() => {
    listStrategicFronts.mockReset();
    mockedUseApp.mockReset();
  });

  it('NO llama al backend cuando el visitante es anónimo (landing pública)', async () => {
    mockedUseApp.mockReturnValue({ isAuthenticated: false, authLoading: false });
    renderProvider();
    // Esperar un macrotask: si fuese a llamar, ya habría disparado el efecto.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(listStrategicFronts).not.toHaveBeenCalled();
  });

  it('NO llama al backend mientras la sesión aún se está resolviendo', async () => {
    mockedUseApp.mockReturnValue({ isAuthenticated: false, authLoading: true });
    renderProvider();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(listStrategicFronts).not.toHaveBeenCalled();
  });

  it('hidrata desde el backend cuando hay sesión autenticada', async () => {
    mockedUseApp.mockReturnValue({ isAuthenticated: true, authLoading: false });
    listStrategicFronts.mockResolvedValue([]);
    renderProvider();
    await waitFor(() => expect(listStrategicFronts).toHaveBeenCalledTimes(1));
  });
});
