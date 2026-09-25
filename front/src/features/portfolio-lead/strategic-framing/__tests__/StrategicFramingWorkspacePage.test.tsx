import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StrategicFramingWorkspacePage } from '../StrategicFramingWorkspacePage';
import { getStrategicFramingState, updateStrategicFramingState } from '../service';

vi.mock('../service', () => ({ getStrategicFramingState: vi.fn(), updateStrategicFramingState: vi.fn() }));

const getState = vi.mocked(getStrategicFramingState);
const updateState = vi.mocked(updateStrategicFramingState);
const base = {
  id: 'state-1', sourceMode: 'enterprise_direct', intendedMovement: 'Mover conversión', whyItMatters: 'Importa mucho', movementSignalStatus: 'proxy' as const,
  movementSignalValue: '10%', horizonContext: 'Este año', decisionToEnable: 'Decidir inversión', subjectLevel: 'challenge_like' as const,
  scopeAssessment: { confidence: 'medium', rationale: ['La señal apunta a un reto'] }, parentStatus: 'unresolved' as const,
  parentContext: { label: null, sourceRefs: ['trusted:parent'] }, sufficiency: { status: 'insufficient', blockers: ['Falta evidencia'], softGaps: ['Contexto'], optionalContext: ['Benchmark'] },
  version: 1, createdAt: '2026-09-24T10:00:00.000Z', updatedAt: '2026-09-24T10:00:00.000Z',
};

function renderPage() { return render(<MemoryRouter initialEntries={['/portfolio/framing/state-1']}><Routes><Route path="/portfolio/framing/:stateId" element={<StrategicFramingWorkspacePage />} /></Routes></MemoryRouter>); }

describe('StrategicFramingWorkspacePage SF-3C', () => {
  beforeEach(() => { vi.clearAllMocks(); getState.mockResolvedValue(base); updateState.mockResolvedValue({ ...base, version: 2, intendedMovement: 'Nuevo movimiento', updatedAt: '2026-09-24T11:00:00.000Z' }); });

  it('loads and renders provisional source/version/timestamp and all editable/read-only context', async () => {
    renderPage();
    expect(await screen.findByText('Provisional')).toBeInTheDocument();
    expect(screen.getByText(/Entrada corporativa/)).toBeInTheDocument();
    expect(screen.getByText(/Versión 1/)).toBeInTheDocument();
    expect(screen.getByText(/24[/-]9[/-]2026/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mover conversión')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Importa mucho')).toBeInTheDocument();
    expect(screen.getByText('Falta evidencia')).toBeInTheDocument();
    expect(screen.getAllByText('Contexto').length).toBeGreaterThan(0);
    expect(screen.getByText('Benchmark')).toBeInTheDocument();
    const subject = screen.getByLabelText('Clasificación actual') as HTMLSelectElement;
    expect([...subject.options].map(option => option.text)).toEqual(expect.arrayContaining(['Frente estratégico posible', 'Reto o problema específico', 'Iniciativa o intervención', 'Aún por definir']));
    expect(screen.getByText('Contexto estratégico aún no resuelto')).toBeInTheDocument();
    expect(screen.queryByText('Crear frente')).not.toBeInTheDocument();
    expect(screen.queryByText('Crear reto')).not.toBeInTheDocument();
    expect(screen.queryByText(/Copilot/i)).not.toBeInTheDocument();
  });

  it('renders all four user-facing subject levels and keeps the parent correction editable', async () => {
    renderPage(); await screen.findByText('Provisional');
    const subject = screen.getByLabelText('Clasificación actual') as HTMLSelectElement;
    expect([...subject.options].map(option => option.text)).toEqual(expect.arrayContaining([
      'Frente estratégico posible', 'Reto o problema específico', 'Iniciativa o intervención', 'Aún por definir',
    ]));
    expect(screen.getByLabelText('Estado del contexto')).toBeEnabled();
    expect(screen.getByLabelText('Descripción humana del contexto')).toBeEnabled();
  });

  it('shows sufficiency blockers, soft gaps and optional context as read-only evidence', async () => {
    renderPage(); await screen.findByText('Provisional');
    expect(screen.getByText('Bloqueos')).toBeInTheDocument();
    expect(screen.getByText('Brechas suaves')).toBeInTheDocument();
    expect(screen.getByText('Contexto opcional')).toBeInTheDocument();
    expect(screen.getByText('Falta evidencia')).toBeInTheDocument();
    expect(screen.getByText('Benchmark')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /suficiencia|bloqueos|brechas|opcional/i })).not.toBeInTheDocument();
  });

  it('edits allowed fields, saves only the draft with expectedVersion, and updates server version', async () => {
    renderPage(); await screen.findByText('Provisional');
    fireEvent.change(screen.getByLabelText('Movimiento intencionado'), { target: { value: 'Nuevo movimiento' } });
    fireEvent.change(screen.getByLabelText('Por qué importa'), { target: { value: 'Nueva razón' } });
    fireEvent.change(screen.getByLabelText('Estado del contexto'), { target: { value: 'provisional' } });
    fireEvent.change(screen.getByLabelText('Descripción humana del contexto'), { target: { value: 'Contexto humano' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(updateState).toHaveBeenCalledWith('state-1', expect.objectContaining({ expectedVersion: 1, intendedMovement: 'Nuevo movimiento', whyItMatters: 'Nueva razón', parentStatus: 'provisional', parentLabel: 'Contexto humano' })));
    expect(await screen.findByText(/Versión 2/)).toBeInTheDocument();
  });

  it('cancel restores server response and sufficiency remains non-editable', async () => {
    renderPage(); await screen.findByText('Provisional');
    const movement = screen.getByLabelText('Movimiento intencionado');
    fireEvent.change(movement, { target: { value: 'Borrador local' } });
    expect(screen.getByRole('button', { name: 'Cancelar cambios' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar cambios' }));
    expect(screen.getByDisplayValue('Mover conversión')).toBeInTheDocument();
    expect(screen.queryByLabelText('Bloqueos')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Falta evidencia/ })).not.toBeInTheDocument();
  });

  it('does not retry stale saves and offers explicit reload of latest state', async () => {
    updateState.mockRejectedValueOnce({ code: 'SF_PROVISIONAL_STATE_STALE', message: 'stale' });
    getState.mockResolvedValueOnce(base).mockResolvedValueOnce({ ...base, version: 3, intendedMovement: 'Versión remota' });
    renderPage(); await screen.findByText('Provisional');
    fireEvent.change(screen.getByLabelText('Movimiento intencionado'), { target: { value: 'Local' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(/actualizado en otra sesión/)).toBeInTheDocument();
    expect(updateState).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Recargar versión' }));
    await waitFor(() => expect(getState).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('heading', { name: 'Versión remota' })).toBeInTheDocument();
  });

  it.each([
    ['SF_PROVISIONAL_STATE_NOT_FOUND', 'No encontramos este framing provisional.'],
    ['SF_PROVISIONAL_STATE_FORBIDDEN', 'No tienes acceso a este framing.'],
    ['GENERIC', 'No pudimos cargar este framing.'],
  ])('handles load error %s', async (code, message) => {
    getState.mockRejectedValueOnce({ code, message: 'failure' }); renderPage();
    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});
