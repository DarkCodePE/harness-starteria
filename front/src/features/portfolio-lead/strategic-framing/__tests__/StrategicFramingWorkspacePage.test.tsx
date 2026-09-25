import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StrategicFramingWorkspacePage } from '../StrategicFramingWorkspacePage';
import { getStrategicFramingLensSuggestions, getStrategicFramingState, updateStrategicFramingState } from '../service';

vi.mock('../service', () => ({ getStrategicFramingLensSuggestions: vi.fn(), getStrategicFramingState: vi.fn(), updateStrategicFramingState: vi.fn() }));

const getState = vi.mocked(getStrategicFramingState);
const updateState = vi.mocked(updateStrategicFramingState);
const getLens = vi.mocked(getStrategicFramingLensSuggestions);
const base = {
  id: 'state-1', sourceMode: 'enterprise_direct', intendedMovement: 'Mover conversión', whyItMatters: 'Importa mucho', movementSignalStatus: 'proxy' as const,
  movementSignalValue: '10%', horizonContext: 'Este año', decisionToEnable: 'Decidir inversión', subjectLevel: 'challenge_like' as const,
  scopeAssessment: { confidence: 'medium', rationale: ['La señal apunta a un reto'] }, parentStatus: 'unresolved' as const,
  parentContext: { label: null, sourceRefs: ['trusted:parent'] }, sufficiency: { status: 'insufficient', blockers: ['Falta evidencia'], softGaps: ['Contexto'], optionalContext: ['Benchmark'] },
  version: 1, createdAt: '2026-09-24T10:00:00.000Z', updatedAt: '2026-09-24T10:00:00.000Z',
};

function renderPage() { return render(<MemoryRouter initialEntries={['/portfolio/framing/state-1']}><Routes><Route path="/portfolio/framing/:stateId" element={<StrategicFramingWorkspacePage />} /></Routes></MemoryRouter>); }

describe('StrategicFramingWorkspacePage SF-3C', () => {
  beforeEach(() => { vi.clearAllMocks(); getState.mockResolvedValue(base); getLens.mockResolvedValue({ stateId: 'state-1', stateVersion: 1, sourceMode: 'enterprise_direct', depthHint: 'standard', suggestions: [], generatedAt: '2026-09-24T10:00:00.000Z' }); updateState.mockResolvedValue({ ...base, version: 2, intendedMovement: 'Nuevo movimiento', updatedAt: '2026-09-24T11:00:00.000Z' }); });

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

  it('renders advisory lens details and conservative source wording', async () => {
    getLens.mockResolvedValueOnce({ stateId: 'state-1', stateVersion: 1, sourceMode: 'enterprise_direct', depthHint: 'standard', suggestions: [{ lens: 'technology', label: 'Technology', reason: 'Hay una dependencia técnica material.', materialQuestion: '¿Qué dependencia técnica podría cambiar esta decisión?', sourceRefs: ['source-1', 'source-2'], confidence: 'medium' }], generatedAt: '2026-09-24T10:00:00.000Z' });
    renderPage();
    expect(await screen.findByText('Perspectivas que podrían ayudarte')).toBeInTheDocument();
    expect(screen.getByText('Hay una dependencia técnica material.')).toBeInTheDocument();
    expect(screen.getByText('Relevancia sugerida: media')).toBeInTheDocument();
    expect(screen.getByText('2 fuentes de contexto vinculadas')).toBeInTheDocument();
  });

  it('keeps explore and hide local without dirtying or saving the workspace', async () => {
    getLens.mockResolvedValueOnce({ stateId: 'state-1', stateVersion: 1, sourceMode: 'enterprise_direct', depthHint: 'standard', suggestions: [{ lens: 'technology', label: 'Technology', reason: 'Razón', materialQuestion: 'Pregunta material', sourceRefs: [], confidence: 'low' }], generatedAt: '2026-09-24T10:00:00.000Z' });
    renderPage();
    await screen.findByText('Technology');
    expect(screen.getByText(/Sin fuentes/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Explorar' }));
    expect(screen.getByText(/La exploración es local/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar por ahora' }));
    expect(screen.queryByText('Technology')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurar perspectivas ocultas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
    expect(updateState).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar perspectivas ocultas' }));
    expect(await screen.findByText('Technology')).toBeInTheDocument();
  });

  it('keeps suggestions while draft is dirty and refetches after the saved version changes', async () => {
    getLens.mockResolvedValue({ stateId: 'state-1', stateVersion: 1, sourceMode: 'enterprise_direct', depthHint: 'standard', suggestions: [], generatedAt: '2026-09-24T10:00:00.000Z' });
    renderPage(); await screen.findByText('Perspectivas que podrían ayudarte');
    fireEvent.change(screen.getByLabelText('Movimiento intencionado'), { target: { value: 'Borrador local' } });
    expect(screen.getByText('Las perspectivas se actualizarán cuando guardes estos cambios.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(getLens.mock.calls.length).toBeGreaterThanOrEqual(2));
    expect(updateState).toHaveBeenCalledWith('state-1', expect.objectContaining({ expectedVersion: 1 }));
  });

  it('keeps the workspace functional when lens suggestions fail and retries only the lens read', async () => {
    getLens.mockRejectedValueOnce({ code: 'NETWORK_ERROR', message: 'failure' }).mockResolvedValueOnce({ stateId: 'state-1', stateVersion: 1, sourceMode: 'enterprise_direct', depthHint: 'light', suggestions: [], generatedAt: '2026-09-24T10:00:00.000Z' });
    renderPage();
    expect(await screen.findByText('No pudimos cargar las perspectivas sugeridas.')).toBeInTheDocument();
    expect(screen.getByLabelText('Movimiento intencionado')).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar perspectivas' }));
    expect(await screen.findByText('No vemos una perspectiva adicional materialmente necesaria con la versión guardada actual.')).toBeInTheDocument();
    expect(getState).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Falta evidencia')).toBeInTheDocument();
    expect(screen.queryByText(/100%|completitud|framing completo/i)).not.toBeInTheDocument();
    expect(updateState).not.toHaveBeenCalled();
  });
});
