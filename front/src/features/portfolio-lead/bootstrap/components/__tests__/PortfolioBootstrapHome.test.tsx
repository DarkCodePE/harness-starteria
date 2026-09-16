import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PortfolioBootstrapHome } from '../PortfolioBootstrapHome';
import { makeBootstrap, makeBootstrapWithFirstReading, makeBootstrapWithProposedMutations, makeBootstrapWithWorkItems } from '../../testing/bootstrapFixtures';

function props(overrides = {}) {
  return {
    data: makeBootstrap('anchor_confirmed'),
    status: 'ready' as const,
    error: null,
    onRetry: vi.fn(),
    onUpdateAnchor: vi.fn(),
    onConfirmAnchor: vi.fn(),
    onPasteWorkItems: vi.fn().mockResolvedValue(undefined),
    onUploadImportFile: vi.fn().mockResolvedValue(undefined),
    onCommitImportBatch: vi.fn().mockResolvedValue(undefined),
    onAddManualWorkItem: vi.fn().mockResolvedValue(undefined),
    onDeclareNoExistingWork: vi.fn().mockResolvedValue(undefined),
    onUpdateWorkItem: vi.fn().mockResolvedValue(undefined),
    onRemoveWorkItem: vi.fn().mockResolvedValue(undefined),
    onAnalyzeWorkItems: vi.fn().mockResolvedValue(undefined),
    onConfirmProposedMutation: vi.fn().mockResolvedValue(undefined),
    onCorrectProposedMutation: vi.fn().mockResolvedValue(undefined),
    onRejectProposedMutation: vi.fn().mockResolvedValue(undefined),
    onLeaveProposedMutationPending: vi.fn().mockResolvedValue(undefined),
    onPublishFirstReading: vi.fn().mockResolvedValue(undefined),
    analysisStatus: 'idle' as const,
    analysisError: null,
    publishStatus: 'idle' as const,
    publishError: null,
    importStatus: 'idle' as const,
    importError: null,
    activeImport: null,
    ...overrides,
  };
}

describe('PortfolioBootstrapHome', () => {
  it('renders HOME_A with Entry context, pending context, one primary CTA, and no drift vocabulary', () => {
    render(
      <PortfolioBootstrapHome
        {...props({ data: makeBootstrap('anchor_insufficient') })}
      />,
    );

    expect(screen.getByTestId('portfolio-bootstrap-home-a')).toBeInTheDocument();
    expect(screen.getByText('innovar mas')).toBeInTheDocument();
    expect(screen.getByText('Contexto minimo para organizar el trabajo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ajustar Anchor/i })).toBeInTheDocument();
    expect(screen.queryByText(/Crear frente estrategico/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Crear reto/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Step 0/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/HMW|Test Card|prototype/i)).not.toBeInTheDocument();
  });

  it('renders HOME_B with the controlled bring-existing-work CTA and no legacy onboarding route', () => {
    const { container } = render(
      <PortfolioBootstrapHome
        {...props({ data: makeBootstrap('anchor_confirmed') })}
      />,
    );

    expect(screen.getByTestId('portfolio-bootstrap-home-b')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Incorporar trabajo existente/i })).toBeInTheDocument();
    expect(container.innerHTML).not.toContain('/portfolio/iniciar');
  });

  it('edit saves without confirming', async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const confirm = vi.fn().mockResolvedValue(undefined);
    render(
      <PortfolioBootstrapHome
        {...props({ data: makeBootstrap('anchor_sufficient'), onUpdateAnchor: update, onConfirmAnchor: confirm })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Editar Anchor/i }));
    fireEvent.change(screen.getByLabelText(/Esto entendimos/i), {
      target: { value: 'Reducir abandono en onboarding B2B corregido' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar ajustes/i }));

    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    expect(confirm).not.toHaveBeenCalled();
  });

  it('explicit confirm changes visual status only after server success', async () => {
    const confirm = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <PortfolioBootstrapHome
        {...props({ data: makeBootstrap('anchor_sufficient'), onConfirmAnchor: confirm })}
      />,
    );

    expect(screen.getByText('Suficiente, sin confirmar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar punto de partida/i }));
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    expect(screen.getByText('Suficiente, sin confirmar')).toBeInTheDocument();

    rerender(
      <PortfolioBootstrapHome
        {...props({ data: makeBootstrap('anchor_confirmed'), onConfirmAnchor: confirm })}
      />,
    );

    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });

  it('shows a recoverable error instead of an operational dashboard when Bootstrap API fails', () => {
    const retry = vi.fn();
    render(
      <PortfolioBootstrapHome
        {...props({ data: null, status: 'error' as const, error: 'No autorizado.', onRetry: retry })}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar el Bootstrap de Portfolio');
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('opens B2 from HOME_B without using the legacy start route', () => {
    const { container } = render(<PortfolioBootstrapHome {...props()} />);

    fireEvent.click(screen.getByRole('button', { name: /Incorporar trabajo existente/i }));

    expect(screen.getByTestId('portfolio-bootstrap-work-intake')).toBeInTheDocument();
    expect(screen.getByText(/Que trabajo existe hoy alrededor de esto/i)).toBeInTheDocument();
    expect(container.innerHTML).not.toContain('/portfolio/iniciar');
  });

  it('paste mode sends raw text and renders provisional items in HOME_C', async () => {
    const paste = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<PortfolioBootstrapHome {...props({ onPasteWorkItems: paste })} />);

    fireEvent.click(screen.getByRole('button', { name: /Incorporar trabajo existente/i }));
    fireEvent.change(screen.getByLabelText(/Pega nombres de iniciativas/i), {
      target: { value: 'Nuevo onboarding digital\nChatbot de soporte\nPrograma loyalty\nMigracion CRM' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Agregar trabajo/i }));

    await waitFor(() => expect(paste).toHaveBeenCalledWith('Nuevo onboarding digital\nChatbot de soporte\nPrograma loyalty\nMigracion CRM'));
    rerender(<PortfolioBootstrapHome {...props({ data: makeBootstrapWithWorkItems(), onPasteWorkItems: paste })} />);

    expect(screen.getByText('1 elementos detectados')).toBeInTheDocument();
    expect(screen.getByText('Nuevo onboarding digital')).toBeInTheDocument();
    expect(screen.getByText(/Provisional - pegado por usuario/i)).toBeInTheDocument();
  });

  it('uploads CSV/XLSX as provisional import with preview and editable mapping', async () => {
    const upload = vi.fn().mockResolvedValue(undefined);
    const commit = vi.fn().mockResolvedValue(undefined);
    const activeImport = {
      id: 'imp-1',
      bootstrapSessionId: 'bs-1',
      fileName: 'portfolio.xlsx',
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: 1200,
      fileHash: 'hash-1',
      status: 'mapping_required' as const,
      rowCount: 2,
      sheetName: 'Sheet1',
      rawHeaders: ['Initiative', 'Owner', 'Status', 'Objective', 'KPI', 'Notes'],
      confirmedMapping: null,
      suggestedMapping: {
        label: 'Initiative',
        owner: 'Owner',
        state: 'Status',
        purpose: 'Objective',
        signal: 'KPI',
        notes: 'Notes',
      },
      previewRows: [
        {
          rowNumber: 2,
          rawRow: {
            Initiative: 'Nuevo onboarding digital',
            Owner: 'Ana',
            Status: 'Active',
            Objective: 'Reducir abandono',
            KPI: 'Activation rate',
            Notes: 'solution-first',
          },
        },
      ],
      warnings: [],
      uploadedBy: 'user-1',
      createdAt: '2026-09-14T10:00:00.000Z',
      updatedAt: '2026-09-14T10:00:00.000Z',
    };
    const { rerender } = render(<PortfolioBootstrapHome {...props({ onUploadImportFile: upload, onCommitImportBatch: commit })} />);

    fireEvent.click(screen.getByRole('button', { name: /Incorporar trabajo existente/i }));
    fireEvent.click(screen.getByRole('button', { name: /Subir Excel o CSV/i }));
    fireEvent.change(screen.getByLabelText(/Subir Excel o CSV/i), {
      target: { files: [new File(['Initiative\nNuevo onboarding digital'], 'portfolio.csv', { type: 'text/csv' })] },
    });
    await waitFor(() => expect(upload).toHaveBeenCalledOnce());

    rerender(<PortfolioBootstrapHome {...props({ activeImport, onUploadImportFile: upload, onCommitImportBatch: commit })} />);
    expect(screen.getByText('portfolio.xlsx')).toBeInTheDocument();
    expect(screen.getByText('Nuevo onboarding digital')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/KPI \/ senal/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Incorporar como trabajo provisional/i }));

    await waitFor(() => expect(commit).toHaveBeenCalledWith(activeImport, expect.objectContaining({
      label: 'Initiative',
      signal: null,
    })));
    expect(screen.queryByText(/Crear frente estrategico|Crear reto|Step 0|HMW|Test Card/i)).not.toBeInTheDocument();
  });

  it('runs B3 analysis only when existing work is present and shows processing copy', async () => {
    const analyze = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <PortfolioBootstrapHome
        {...props({
          data: makeBootstrapWithWorkItems(),
          onAnalyzeWorkItems: analyze,
        })}
      />,
    );

    const cta = screen.getByRole('button', { name: /Analizar trabajo detectado/i });
    expect(cta).toBeEnabled();
    fireEvent.click(cta);
    await waitFor(() => expect(analyze).toHaveBeenCalledOnce());

    rerender(
      <PortfolioBootstrapHome
        {...props({
          data: makeBootstrapWithWorkItems(),
          onAnalyzeWorkItems: analyze,
          analysisStatus: 'processing' as const,
        })}
      />,
    );
    expect(screen.getByText('Starteria esta organizando esta primera lectura.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analizar trabajo detectado/i })).toBeDisabled();
  });

  it('does not run B3 analysis when no existing work was declared', async () => {
    const analyze = vi.fn().mockResolvedValue(undefined);
    const data = makeBootstrapWithWorkItems();
    render(
      <PortfolioBootstrapHome
        {...props({
          data: {
            ...data,
            bootstrapSession: { ...data.bootstrapSession, existingWorkStatus: 'no_existing_work' },
            workItems: [],
          },
          onAnalyzeWorkItems: analyze,
        })}
      />,
    );

    const cta = screen.getByRole('button', { name: /Analizar trabajo detectado/i });
    expect(cta).toBeDisabled();
    fireEvent.click(cta);
    expect(analyze).not.toHaveBeenCalled();
  });

  it('shows read-only provisional proposals after analysis without confirming alignment', () => {
    render(<PortfolioBootstrapHome {...props({ data: makeBootstrapWithProposedMutations() })} />);

    expect(screen.getByTestId('portfolio-bootstrap-proposed-structure')).toBeInTheDocument();
    expect(screen.getByText('Pendiente de tu revision')).toBeInTheDocument();
    expect(screen.getByText('Primera lectura provisional')).toBeInTheDocument();
    expect(screen.getByText('AI_SUGGESTED')).toBeInTheDocument();
    expect(screen.getByText('AI_INFERRED')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revisar propuesta/i })).toBeEnabled();
    expect(screen.queryByText(/confirmed_alignment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Crear frente estrategico|Crear reto|Crear iniciativa y continuar|Step 0/i)).not.toBeInTheDocument();
  });

  it('opens material review and reviews mutations independently', async () => {
    const confirmMutation = vi.fn().mockResolvedValue(undefined);
    const rejectMutation = vi.fn().mockResolvedValue(undefined);
    const leavePending = vi.fn().mockResolvedValue(undefined);
    render(
      <PortfolioBootstrapHome
        {...props({
          data: makeBootstrapWithProposedMutations(),
          onConfirmProposedMutation: confirmMutation,
          onRejectProposedMutation: rejectMutation,
          onLeaveProposedMutationPending: leavePending,
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Revisar propuesta/i }));

    expect(screen.getByTestId('portfolio-bootstrap-material-review')).toBeInTheDocument();
    expect(screen.getAllByText('Nuevo onboarding digital').length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getAllByRole('button', { name: /^Confirmar$/i })[0]);
    await waitFor(() => expect(confirmMutation).toHaveBeenCalledWith('pm-1'));
    fireEvent.click(screen.getAllByRole('button', { name: /^Dejar pendiente$/i })[1]);
    await waitFor(() => expect(leavePending).toHaveBeenCalledWith('pm-2'));
    expect(rejectMutation).not.toHaveBeenCalled();
  });

  it('saves corrections without confirming them', async () => {
    const correctMutation = vi.fn().mockResolvedValue(undefined);
    const confirmMutation = vi.fn().mockResolvedValue(undefined);
    render(
      <PortfolioBootstrapHome
        {...props({
          data: makeBootstrapWithProposedMutations(),
          onCorrectProposedMutation: correctMutation,
          onConfirmProposedMutation: confirmMutation,
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Revisar propuesta/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /Corregir/i })[0]);
    fireEvent.change(screen.getByLabelText(/Correccion propuesta/i), { target: { value: 'partial_alignment' } });
    fireEvent.change(screen.getByLabelText(/Motivo de correccion/i), { target: { value: 'Solo cubre una parte de la prioridad' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar correccion/i }));

    await waitFor(() => expect(correctMutation).toHaveBeenCalledWith(
      'pm-1',
      expect.objectContaining({ status: 'partial_alignment', rationale: 'Solo cubre una parte de la prioridad' }),
      'Solo cubre una parte de la prioridad',
    ));
    expect(confirmMutation).not.toHaveBeenCalled();
  });

  it('publishes the first reading from completed material review', async () => {
    const publish = vi.fn().mockResolvedValue(undefined);
    const data = makeBootstrapWithProposedMutations();
    data.proposedMutations = data.proposedMutations.map((mutation) => ({ ...mutation, status: 'confirmed' }));
    render(<PortfolioBootstrapHome {...props({ data, onPublishFirstReading: publish })} />);

    fireEvent.click(screen.getByRole('button', { name: /Generar primera lectura del portafolio/i }));

    await waitFor(() => expect(publish).toHaveBeenCalledOnce());
  });

  it('shows processing while first reading is being consolidated', () => {
    const data = makeBootstrapWithProposedMutations();
    data.proposedMutations = data.proposedMutations.map((mutation) => ({ ...mutation, status: 'confirmed' }));
    render(<PortfolioBootstrapHome {...props({ data, publishStatus: 'processing' })} />);

    expect(screen.getByText(/Starteria esta consolidando tu primera lectura del portafolio/i)).toBeInTheDocument();
  });

  it('renders HOME_E first reading with attention and inspectable provenance', () => {
    render(<PortfolioBootstrapHome {...props({ data: makeBootstrapWithFirstReading('HOME_E') })} />);

    expect(screen.getByTestId('portfolio-first-reading')).toBeInTheDocument();
    expect(screen.getByText(/Primera lectura del portafolio/i)).toBeInTheDocument();
    expect(screen.getByText(/Requiere atencion/i)).toBeInTheDocument();
    expect(screen.getByTestId('portfolio-attention-item')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Ver trazabilidad de la lectura/i));
    expect(screen.getByText(/Anchor version: 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Step 0|HMW|Test Card|prototype/i)).not.toBeInTheDocument();
  });

  it('renders HOME_D first reading without material attention', () => {
    render(<PortfolioBootstrapHome {...props({ data: makeBootstrapWithFirstReading('HOME_D') })} />);

    expect(screen.getByText(/Portfolio inicial estructurado/i)).toBeInTheDocument();
    expect(screen.getByText(/No hay atencion material publicada en esta lectura/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mantener y revisar la lectura inicial del portfolio/i })).toBeInTheDocument();
  });

  it('manual mode adds one provisional item', async () => {
    const addManual = vi.fn().mockResolvedValue(undefined);
    render(<PortfolioBootstrapHome {...props({ onAddManualWorkItem: addManual })} />);

    fireEvent.click(screen.getByRole('button', { name: /Incorporar trabajo existente/i }));
    fireEvent.click(screen.getByRole('button', { name: /Anadir manualmente/i }));
    fireEvent.change(screen.getByLabelText(/Nombre o descripcion breve/i), { target: { value: 'Chatbot de soporte' } });
    fireEvent.change(screen.getByLabelText(/Que intenta conseguir/i), { target: { value: 'Reducir tickets repetitivos' } });
    fireEvent.change(screen.getByLabelText(/Estado aproximado/i), { target: { value: 'active' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar trabajo/i }));

    await waitFor(() => expect(addManual).toHaveBeenCalledWith({
      label: 'Chatbot de soporte',
      purpose: 'Reducir tickets repetitivos',
      currentStateHint: 'active',
    }));
  });

  it('persists explicit no-existing-work without fake items or drift vocabulary', async () => {
    const none = vi.fn().mockResolvedValue(undefined);
    render(<PortfolioBootstrapHome {...props({ onDeclareNoExistingWork: none })} />);

    fireEvent.click(screen.getByRole('button', { name: /Incorporar trabajo existente/i }));
    fireEvent.click(screen.getByRole('button', { name: /Todavia no tenemos iniciativas/i }));
    fireEvent.click(screen.getByRole('button', { name: /Todavia no tenemos iniciativas activas/i }));

    await waitFor(() => expect(none).toHaveBeenCalledOnce());
    expect(screen.queryByText(/Step 0|HMW|Test Card|experiment|prototype/i)).not.toBeInTheDocument();
  });
});
