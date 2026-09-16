import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, FileUp, Pencil, Plus, RotateCw, Trash2 } from 'lucide-react';
import { projectBootstrapHome } from '../projection/bootstrapHomeProjection';
import type {
  ManualPortfolioBootstrapWorkItemInput,
  PortfolioBootstrapAnchor,
  PortfolioBootstrapImportBatch,
  PortfolioBootstrapImportMapping,
  PortfolioBootstrapResponse,
  UpdatePortfolioBootstrapAnchorInput,
  UpdatePortfolioBootstrapWorkItemInput,
} from '../services/portfolioBootstrapClient';

export function PortfolioBootstrapHome({
  data,
  status,
  error,
  onRetry,
  onUpdateAnchor,
  onConfirmAnchor,
  onPasteWorkItems,
  onUploadImportFile = async () => undefined,
  onCommitImportBatch = async () => undefined,
  onAddManualWorkItem,
  onDeclareNoExistingWork,
  onUpdateWorkItem,
  onRemoveWorkItem,
  onAnalyzeWorkItems,
  onConfirmProposedMutation,
  onCorrectProposedMutation,
  onRejectProposedMutation,
  onLeaveProposedMutationPending,
  onPublishFirstReading,
  analysisStatus,
  analysisError,
  publishStatus,
  publishError,
  importStatus,
  importError,
  activeImport,
}: {
  data: PortfolioBootstrapResponse | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  analysisStatus?: 'idle' | 'processing' | 'error';
  analysisError?: string | null;
  onRetry: () => void;
  onUpdateAnchor: (input: UpdatePortfolioBootstrapAnchorInput) => Promise<void>;
  onConfirmAnchor: () => Promise<void>;
  onPasteWorkItems: (text: string) => Promise<void>;
  onUploadImportFile?: (file: File) => Promise<void>;
  onCommitImportBatch?: (batch: PortfolioBootstrapImportBatch, mapping: PortfolioBootstrapImportMapping) => Promise<void>;
  onAddManualWorkItem: (input: ManualPortfolioBootstrapWorkItemInput) => Promise<void>;
  onDeclareNoExistingWork: () => Promise<void>;
  onUpdateWorkItem: (workItemId: string, input: UpdatePortfolioBootstrapWorkItemInput) => Promise<void>;
  onRemoveWorkItem: (workItemId: string) => Promise<void>;
  onAnalyzeWorkItems: () => Promise<void>;
  onConfirmProposedMutation: (mutationId: string) => Promise<void>;
  onCorrectProposedMutation: (mutationId: string, proposedValue: unknown, reviewNote?: string) => Promise<void>;
  onRejectProposedMutation: (mutationId: string, reviewNote?: string) => Promise<void>;
  onLeaveProposedMutationPending: (mutationId: string, reviewNote?: string) => Promise<void>;
  onPublishFirstReading: () => Promise<void>;
  publishStatus?: 'idle' | 'processing' | 'error';
  publishError?: string | null;
  importStatus?: 'idle' | 'uploading' | 'committing' | 'error';
  importError?: string | null;
  activeImport?: PortfolioBootstrapImportBatch | null;
}) {
  const projection = useMemo(() => data ? projectBootstrapHome(data) : null, [data]);
  const [workIntakeOpen, setWorkIntakeOpen] = useState(false);

  if (status === 'loading' || status === 'idle') {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
        <p className="text-sm font-semibold text-slate-900">Cargando contexto de Portfolio...</p>
        <p className="mt-1 text-sm text-slate-600">Estamos recuperando el punto de partida persistido.</p>
      </section>
    );
  }

  if (status === 'error' || !projection) {
    return (
      <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div>
            <h2 className="text-base font-semibold">No pudimos cargar el Bootstrap de Portfolio</h2>
            <p className="mt-1 text-sm">{error ?? 'El contexto de entrada no esta disponible ahora.'}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100"
            >
              <RotateCw size={16} />
              Reintentar
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (projection.homeState === 'HOME_D' || projection.homeState === 'HOME_E') {
    return <PortfolioFirstReading projection={projection} />;
  }

  if (projection.homeState === 'HOME_C') {
    return (
      <PortfolioBootstrapWorkIntake
        projection={projection}
        onPasteWorkItems={onPasteWorkItems}
        onUploadImportFile={onUploadImportFile}
        onCommitImportBatch={onCommitImportBatch}
        onAddManualWorkItem={onAddManualWorkItem}
        onDeclareNoExistingWork={onDeclareNoExistingWork}
        onUpdateWorkItem={onUpdateWorkItem}
        onRemoveWorkItem={onRemoveWorkItem}
        onAnalyzeWorkItems={onAnalyzeWorkItems}
        onConfirmProposedMutation={onConfirmProposedMutation}
        onCorrectProposedMutation={onCorrectProposedMutation}
        onRejectProposedMutation={onRejectProposedMutation}
        onLeaveProposedMutationPending={onLeaveProposedMutationPending}
        onPublishFirstReading={onPublishFirstReading}
        analysisStatus={analysisStatus ?? 'idle'}
        analysisError={analysisError ?? null}
        publishStatus={publishStatus ?? 'idle'}
        publishError={publishError ?? null}
        importStatus={importStatus ?? 'idle'}
        importError={importError ?? null}
        activeImport={activeImport ?? projection.importBatches[0] ?? null}
      />
    );
  }

  return projection.homeState === 'HOME_B' || workIntakeOpen ? (
    workIntakeOpen ? (
      <PortfolioBootstrapWorkIntake
        projection={projection}
        onPasteWorkItems={onPasteWorkItems}
        onUploadImportFile={onUploadImportFile}
        onCommitImportBatch={onCommitImportBatch}
        onAddManualWorkItem={onAddManualWorkItem}
        onDeclareNoExistingWork={onDeclareNoExistingWork}
        onUpdateWorkItem={onUpdateWorkItem}
        onRemoveWorkItem={onRemoveWorkItem}
        onAnalyzeWorkItems={onAnalyzeWorkItems}
        onConfirmProposedMutation={onConfirmProposedMutation}
        onCorrectProposedMutation={onCorrectProposedMutation}
        onRejectProposedMutation={onRejectProposedMutation}
        onLeaveProposedMutationPending={onLeaveProposedMutationPending}
        onPublishFirstReading={onPublishFirstReading}
        analysisStatus={analysisStatus ?? 'idle'}
        analysisError={analysisError ?? null}
        publishStatus={publishStatus ?? 'idle'}
        publishError={publishError ?? null}
        importStatus={importStatus ?? 'idle'}
        importError={importError ?? null}
        activeImport={activeImport ?? projection.importBatches[0] ?? null}
      />
    ) : (
      <PortfolioBootstrapHomeB
        projection={projection}
        onUpdateAnchor={onUpdateAnchor}
        onConfirmAnchor={onConfirmAnchor}
        onOpenWorkIntake={() => setWorkIntakeOpen(true)}
      />
    )
  ) : (
    <PortfolioBootstrapHomeA projection={projection} onUpdateAnchor={onUpdateAnchor} onConfirmAnchor={onConfirmAnchor} />
  );
}

function PortfolioBootstrapHomeA({
  projection,
  onUpdateAnchor,
  onConfirmAnchor,
}: {
  projection: NonNullable<ReturnType<typeof projectBootstrapHome>>;
  onUpdateAnchor: (input: UpdatePortfolioBootstrapAnchorInput) => Promise<void>;
  onConfirmAnchor: () => Promise<void>;
}) {
  const conflict = projection.anchor.status === 'anchor_conflicting';
  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="portfolio-bootstrap-home-a">
      <BootstrapHeader
        eyebrow="Portfolio Bootstrap"
        title="Completemos el punto de partida del portfolio"
        status={projection.anchor.status}
        provenanceLabel={projection.provenanceLabel}
      />
      <AnchorSummary anchor={projection.anchor} />
      <ContextList title="Todavia falta aclarar" items={projection.missingContext} empty="No hay faltantes detectados." />
      <AnchorEditor anchor={projection.anchor} onSave={onUpdateAnchor} />
      <PrimaryAction
        label={conflict ? 'Revisar contradiccion' : projection.canConfirm ? 'Confirmar punto de partida' : 'Ajustar Anchor'}
        description={projection.nextAction.reason}
        onClick={projection.canConfirm ? onConfirmAnchor : undefined}
        disabled={!projection.canConfirm && !conflict}
      />
    </section>
  );
}

function PortfolioBootstrapHomeB({
  projection,
  onUpdateAnchor,
  onConfirmAnchor,
  onOpenWorkIntake,
}: {
  projection: NonNullable<ReturnType<typeof projectBootstrapHome>>;
  onUpdateAnchor: (input: UpdatePortfolioBootstrapAnchorInput) => Promise<void>;
  onConfirmAnchor: () => Promise<void>;
  onOpenWorkIntake: () => void;
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm" data-testid="portfolio-bootstrap-home-b">
      <BootstrapHeader
        eyebrow="Ya tenemos un punto de partida"
        title={projection.anchor.outcomeStatement}
        status={projection.anchor.status}
        provenanceLabel={projection.provenanceLabel}
      />
      <AnchorSummary anchor={projection.anchor} />
      <ContextList title="Informacion conocida" items={projection.knownContext} empty="Aun no hay contexto adicional." />
      <AnchorEditor anchor={projection.anchor} onSave={onUpdateAnchor} />
      {projection.anchor.status !== 'anchor_confirmed' ? (
        <button
          type="button"
          onClick={onConfirmAnchor}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
        >
          <CheckCircle2 size={16} />
          Confirmar punto de partida
        </button>
      ) : null}
      <PrimaryAction
        label="Incorporar trabajo existente"
        description="Conecta el trabajo que ya existe alrededor de esta prioridad."
        onClick={onOpenWorkIntake}
      />
    </section>
  );
}

function PortfolioBootstrapWorkIntake({
  projection,
  onPasteWorkItems,
  onUploadImportFile,
  onCommitImportBatch,
  onAddManualWorkItem,
  onDeclareNoExistingWork,
  onUpdateWorkItem,
  onRemoveWorkItem,
  onAnalyzeWorkItems,
  onConfirmProposedMutation,
  onCorrectProposedMutation,
  onRejectProposedMutation,
  onLeaveProposedMutationPending,
  onPublishFirstReading,
  analysisStatus,
  analysisError,
  publishStatus,
  publishError,
  importStatus,
  importError,
  activeImport,
}: {
  projection: NonNullable<ReturnType<typeof projectBootstrapHome>>;
  onPasteWorkItems: (text: string) => Promise<void>;
  onUploadImportFile: (file: File) => Promise<void>;
  onCommitImportBatch: (batch: PortfolioBootstrapImportBatch, mapping: PortfolioBootstrapImportMapping) => Promise<void>;
  onAddManualWorkItem: (input: ManualPortfolioBootstrapWorkItemInput) => Promise<void>;
  onDeclareNoExistingWork: () => Promise<void>;
  onUpdateWorkItem: (workItemId: string, input: UpdatePortfolioBootstrapWorkItemInput) => Promise<void>;
  onRemoveWorkItem: (workItemId: string) => Promise<void>;
  onAnalyzeWorkItems: () => Promise<void>;
  onConfirmProposedMutation: (mutationId: string) => Promise<void>;
  onCorrectProposedMutation: (mutationId: string, proposedValue: unknown, reviewNote?: string) => Promise<void>;
  onRejectProposedMutation: (mutationId: string, reviewNote?: string) => Promise<void>;
  onLeaveProposedMutationPending: (mutationId: string, reviewNote?: string) => Promise<void>;
  onPublishFirstReading: () => Promise<void>;
  analysisStatus: 'idle' | 'processing' | 'error';
  analysisError: string | null;
  publishStatus: 'idle' | 'processing' | 'error';
  publishError: string | null;
  importStatus: 'idle' | 'uploading' | 'committing' | 'error';
  importError: string | null;
  activeImport: PortfolioBootstrapImportBatch | null;
}) {
  const [mode, setMode] = useState<'paste' | 'manual' | 'upload' | 'none'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [manual, setManual] = useState({ label: '', purpose: '', currentStateHint: 'unknown' });
  const [mappingDraft, setMappingDraft] = useState<PortfolioBootstrapImportMapping>({});
  const [saving, setSaving] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const hasItems = projection.workItems.length > 0;
  const noWork = projection.existingWorkStatus === 'no_existing_work';
  const hasProposals = projection.proposedMutations.some((mutation) => mutation.status === 'proposed' || mutation.status === 'reviewed');
  const analyzing = analysisStatus === 'processing';
  const publishing = publishStatus === 'processing';

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="portfolio-bootstrap-work-intake">
      <BootstrapHeader
        eyebrow="Portfolio Bootstrap"
        title="Que trabajo existe hoy alrededor de esto?"
        status={projection.anchor.status}
        provenanceLabel={projection.provenanceLabel}
      />
      <AnchorSummary anchor={projection.anchor} />
      <div className="flex flex-wrap gap-2">
        <ModeButton label="Pegar una lista" active={mode === 'paste'} onClick={() => setMode('paste')} />
        <ModeButton label="Anadir manualmente" active={mode === 'manual'} onClick={() => setMode('manual')} />
        <ModeButton label="Subir Excel o CSV" active={mode === 'upload'} onClick={() => setMode('upload')} />
        <ModeButton label="Todavia no tenemos iniciativas" active={mode === 'none'} onClick={() => setMode('none')} />
      </div>

      {mode === 'paste' ? (
        <form
          className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            await onPasteWorkItems(pasteText);
            setPasteText('');
            setSaving(false);
          }}
        >
          <label className="block text-sm font-semibold text-slate-700">
            Pega nombres de iniciativas, proyectos o trabajos que ya estan en marcha. Una linea por elemento funciona mejor.
            <textarea
              value={pasteText}
              onChange={(event) => setPasteText(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900"
            />
          </label>
          <button
            type="submit"
            disabled={saving || !pasteText.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus size={16} />
            {saving ? 'Agregando...' : 'Agregar trabajo'}
          </button>
        </form>
      ) : null}

      {mode === 'manual' ? (
        <form
          className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            await onAddManualWorkItem({
              label: manual.label,
              purpose: manual.purpose || undefined,
              currentStateHint: manual.currentStateHint as ManualPortfolioBootstrapWorkItemInput['currentStateHint'],
            });
            setManual({ label: '', purpose: '', currentStateHint: 'unknown' });
            setSaving(false);
          }}
        >
          <input
            aria-label="Nombre o descripcion breve"
            value={manual.label}
            onChange={(event) => setManual({ ...manual, label: event.target.value })}
            placeholder="Nombre o descripcion breve"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <textarea
            aria-label="Que intenta conseguir"
            value={manual.purpose}
            onChange={(event) => setManual({ ...manual, purpose: event.target.value })}
            placeholder="Que intenta conseguir"
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <select
            aria-label="Estado aproximado"
            value={manual.currentStateHint}
            onChange={(event) => setManual({ ...manual, currentStateHint: event.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="unknown">No lo se</option>
            <option value="idea">Idea</option>
            <option value="candidate">Candidata</option>
            <option value="active">En marcha</option>
            <option value="paused">Pausada</option>
            <option value="completed">Terminada</option>
          </select>
          <button
            type="submit"
            disabled={saving || !manual.label.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus size={16} />
            {saving ? 'Agregando...' : 'Agregar trabajo'}
          </button>
        </form>
      ) : null}

      {mode === 'upload' ? (
        <ImportWorkItemsPanel
          activeImport={activeImport}
          importStatus={importStatus}
          importError={importError}
          mappingDraft={mappingDraft}
          onMappingChange={setMappingDraft}
          onUpload={async (file) => {
            setMappingDraft({});
            await onUploadImportFile(file);
          }}
          onCommit={async (batch, mapping) => {
            await onCommitImportBatch(batch, mapping);
            setMappingDraft({});
          }}
        />
      ) : null}

      {mode === 'none' ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <button
            type="button"
            onClick={async () => {
              setSaving(true);
              await onDeclareNoExistingWork();
              setSaving(false);
            }}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <CheckCircle2 size={16} />
            {saving ? 'Guardando...' : 'Todavia no tenemos iniciativas activas'}
          </button>
        </div>
      ) : null}

      {noWork ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          Perfecto. Starteria puede conservar este punto de partida y ayudarte a decidir como abordar esta prioridad mas adelante.
        </div>
      ) : (
        <WorkItemList items={projection.workItems} onUpdateWorkItem={onUpdateWorkItem} onRemoveWorkItem={onRemoveWorkItem} />
      )}

      {analyzing ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-950" aria-live="polite">
          Starteria esta organizando esta primera lectura.
        </div>
      ) : null}

      {analysisStatus === 'error' ? (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          {analysisError ?? 'No pudimos analizar el trabajo detectado.'}
        </div>
      ) : null}

      {publishing ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-950" aria-live="polite">
          Starteria esta consolidando tu primera lectura del portafolio.
        </div>
      ) : null}

      {publishStatus === 'error' ? (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          {publishError ?? 'No pudimos generar la primera lectura del portafolio.'}
        </div>
      ) : null}

      {projection.proposedMutations.length > 0 ? <ProposedStructureSummary projection={projection} /> : null}

      {reviewOpen ? (
        <MaterialReviewPanel
          projection={projection}
          onConfirm={onConfirmProposedMutation}
          onCorrect={onCorrectProposedMutation}
          onReject={onRejectProposedMutation}
          onLeavePending={onLeaveProposedMutationPending}
        />
      ) : null}

      {projection.analysisSummary.materialReviewComplete ? (
        <PrimaryAction
          label="Generar primera lectura del portafolio"
          description="Publica una lectura ejecutiva versionada sin convertir el Bootstrap en objetos canonicos."
          onClick={onPublishFirstReading}
          disabled={publishing}
        />
      ) : hasItems || noWork ? (
        <PrimaryAction
          label={hasProposals ? 'Revisar propuesta' : 'Analizar trabajo detectado'}
          description={hasProposals
            ? 'Pendiente de tu revision. La propuesta sigue siendo provisional.'
            : noWork
              ? 'No hay trabajo declarado para analizar en B3.'
              : 'Organiza el trabajo detectado en una primera lectura provisional.'}
          disabled={noWork || analyzing}
          onClick={hasProposals ? () => setReviewOpen(true) : hasItems ? onAnalyzeWorkItems : undefined}
        />
      ) : null}
    </section>
  );
}

function ImportWorkItemsPanel({
  activeImport,
  importStatus,
  importError,
  mappingDraft,
  onMappingChange,
  onUpload,
  onCommit,
}: {
  activeImport: PortfolioBootstrapImportBatch | null;
  importStatus: 'idle' | 'uploading' | 'committing' | 'error';
  importError: string | null;
  mappingDraft: PortfolioBootstrapImportMapping;
  onMappingChange: (mapping: PortfolioBootstrapImportMapping) => void;
  onUpload: (file: File) => Promise<void>;
  onCommit: (batch: PortfolioBootstrapImportBatch, mapping: PortfolioBootstrapImportMapping) => Promise<void>;
}) {
  const batch = activeImport;
  const mapping = batch ? { ...batch.suggestedMapping, ...batch.confirmedMapping, ...mappingDraft } : mappingDraft;
  const busy = importStatus === 'uploading' || importStatus === 'committing';
  const previewRows = batch?.previewRows.slice(0, 5) ?? [];
  const mappingFields: Array<{ key: keyof PortfolioBootstrapImportMapping; label: string; required?: boolean }> = [
    { key: 'label', label: 'Nombre', required: true },
    { key: 'owner', label: 'Responsable' },
    { key: 'state', label: 'Estado' },
    { key: 'purpose', label: 'Objetivo' },
    { key: 'signal', label: 'KPI / senal' },
    { key: 'notes', label: 'Notas' },
  ];

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4" data-testid="portfolio-import-panel">
      <label className="block text-sm font-semibold text-slate-700">
        Sube un CSV o Excel con iniciativas, proyectos o trabajos existentes.
        <input
          aria-label="Subir Excel o CSV"
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={busy}
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = event.target.files?.[0];
            if (file) await onUpload(file);
            input.value = '';
          }}
          className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
        />
      </label>

      {busy ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-950" aria-live="polite">
          {importStatus === 'uploading' ? 'Leyendo archivo...' : 'Importando elementos provisionales...'}
        </div>
      ) : null}

      {importStatus === 'error' ? (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          {importError ?? 'No pudimos importar el archivo.'}
        </div>
      ) : null}

      {batch ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-slate-900">{batch.fileName}</p>
              <p className="text-slate-600">{batch.rowCount} filas detectadas{batch.sheetName ? ` en ${batch.sheetName}` : ''}.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {batch.status === 'imported' ? 'Importado' : 'Preview provisional'}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {mappingFields.map((field) => (
              <label key={field.key} className="text-xs font-semibold uppercase text-slate-500">
                {field.label}{field.required ? ' *' : ''}
                <select
                  value={mapping[field.key] ?? ''}
                  onChange={(event) => onMappingChange({ ...mappingDraft, [field.key]: event.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-900"
                >
                  <option value="">Sin mapear</option>
                  {batch.rawHeaders.map((header) => (
                    <option key={`${field.key}-${header}`} value={header}>{header}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Fila</th>
                  {batch.rawHeaders.map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {previewRows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className="px-3 py-2 font-semibold">{row.rowNumber}</td>
                    {batch.rawHeaders.map((header) => <td key={`${row.rowNumber}-${header}`} className="px-3 py-2">{row.rawRow[header] ?? ''}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {batch.warnings.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              {batch.warnings.slice(0, 3).map((warning) => (
                <p key={`${warning.code}-${warning.rowNumber ?? warning.message}`}>{warning.rowNumber ? `Fila ${warning.rowNumber}: ` : ''}{warning.message}</p>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            disabled={busy || !mapping.label || batch.status === 'imported'}
            onClick={() => onCommit(batch, mapping)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <FileUp size={16} />
            {batch.status === 'imported' ? 'Elementos incorporados' : 'Incorporar como trabajo provisional'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PortfolioFirstReading({ projection }: { projection: NonNullable<ReturnType<typeof projectBootstrapHome>> }) {
  const reading = projection.latestReading;
  if (!reading) return null;
  const attentionItems = reading.primaryAttentionItems ?? [];
  const sourceSnapshot = reading.sourceSnapshot as {
    workItems?: Array<{ id: string }>;
    strategicConnections?: Array<{ id: string }>;
    advancementConditions?: Array<{ id: string }>;
    unresolvedProposals?: Array<{ id: string }>;
  } | null;

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="portfolio-first-reading">
      <BootstrapHeader
        eyebrow={projection.homeState === 'HOME_E' ? 'Portfolio activo' : 'Portfolio inicial estructurado'}
        title="Primera lectura del portafolio"
        status={projection.anchor.status}
        provenanceLabel={`Lectura v${reading.version} publicada por Portfolio Lead`}
      />
      <AnchorSummary anchor={projection.anchor} />

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryField label="Trabajo identificado" value={`${reading.totalWorkItems} elementos`} />
        <SummaryField label="Conexiones confirmadas" value={String(reading.confirmedConnections)} />
        <SummaryField label="Con incertidumbre" value={String(reading.uncertainConnections)} />
        <SummaryField label="Atencion" value={String(attentionItems.filter((item) => item.severity !== 'info').length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReadingSection title="Que quieres mover" items={[projection.anchor.outcomeStatement, projection.anchor.contextSummary, projection.anchor.decisionToEnable].filter(Boolean) as string[]} />
        <ReadingSection title="Trabajo identificado" items={projection.workItems.map((item) => item.proposedName ?? item.rawLabel)} />
        <ReadingSection
          title="Como se conecta"
          items={[
            `${reading.confirmedConnections} relaciones confirmadas por revision humana.`,
            `${reading.uncertainConnections} relaciones o propuestas conservan incertidumbre visible.`,
            reading.confirmedMisalignmentCount > 0 ? `${reading.confirmedMisalignmentCount} relaciones cuestionadas.` : null,
          ].filter(Boolean) as string[]}
        />
        <ReadingSection
          title="Que falta"
          items={[
            reading.signalGapCount ? `${reading.signalGapCount} sin senal de negocio clara.` : null,
            reading.unresolvedDependencyCount ? `${reading.unresolvedDependencyCount} dependencias sin resolver.` : null,
            reading.decisionPathGapCount ? `${reading.decisionPathGapCount} rutas de decision poco claras.` : null,
            reading.requiredContextGapCount ? `${reading.requiredContextGapCount} contextos requeridos pendientes.` : null,
            reading.ownershipGapCount ? `${reading.ownershipGapCount} ownerships pendientes.` : null,
          ].filter(Boolean) as string[]}
          empty="No hay faltantes materiales publicados en esta lectura."
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-slate-950">Requiere atencion</h2>
        </div>
        {attentionItems.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {attentionItems.map((item, index) => (
              <li key={`${item.type}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3" data-testid="portfolio-attention-item">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-700">{item.statement}</p>
                    <p className="mt-2 text-xs text-slate-500">{item.whyItMatters}</p>
                  </div>
                  <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                    {item.severity}
                  </span>
                </div>
                {item.nextAction ? <p className="mt-2 text-xs font-semibold text-slate-600">{item.nextAction}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No hay atencion material publicada en esta lectura.</p>
        )}
      </div>

      <PrimaryAction
        label={reading.nextBestAction}
        description="Lectura versionada desde el Bootstrap revisado, sin crear objetos canonicos ni activar iniciativas."
      />

      <details className="rounded-lg border border-slate-200 bg-white p-4" data-testid="portfolio-reading-provenance">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-950">
          <Eye size={16} />
          Ver trazabilidad de la lectura
        </summary>
        <div className="mt-3 grid gap-3 text-xs text-slate-600 md:grid-cols-2">
          <p>Anchor version: {reading.sourceAnchorVersion}</p>
          <p>Bootstrap hash: {reading.sourceBootstrapVersion.slice(0, 12)}</p>
          <p>Work items: {sourceSnapshot?.workItems?.length ?? 0}</p>
          <p>Conexiones: {sourceSnapshot?.strategicConnections?.length ?? 0}</p>
          <p>Condiciones: {sourceSnapshot?.advancementConditions?.length ?? 0}</p>
          <p>Pendientes: {sourceSnapshot?.unresolvedProposals?.length ?? 0}</p>
        </div>
      </details>
    </section>
  );
}

function ReadingSection({ title, items, empty = 'Pendiente' }: { title: string; items: string[]; empty?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-600">{empty}</p>
      )}
    </div>
  );
}

function ProposedStructureSummary({ projection }: { projection: NonNullable<ReturnType<typeof projectBootstrapHome>> }) {
  const proposed = projection.proposedMutations.filter((mutation) => mutation.status === 'proposed');
  return (
    <div className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/70 p-4" data-testid="portfolio-bootstrap-proposed-structure">
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Pendiente de tu revision</p>
          <h2 className="text-base font-semibold text-slate-950">Primera lectura provisional</h2>
        </div>
        <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-900">
          {projection.latestAnalysisRun?.analyzerMode === 'real_ai' ? 'AI asistida' : 'Deterministica'}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryField label="Propuestas" value={String(projection.analysisSummary.total)} />
        <SummaryField label="Conexiones" value={String(projection.analysisSummary.strategicConnections)} />
        <SummaryField label="Condiciones" value={String(projection.analysisSummary.advancementConditions)} />
        <SummaryField label="Atencion" value={String(projection.analysisSummary.attentionSignals + projection.analysisSummary.conflicts)} />
      </div>

      <ul className="space-y-2">
        {proposed.slice(0, 6).map((mutation) => (
          <li key={mutation.id} className="rounded-lg border border-indigo-100 bg-white p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">{proposalTitle(mutation)}</p>
                <p className="mt-1 text-sm text-slate-600">{proposalText(mutation)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                  {mutation.provenanceStatus === 'ai_inferred' ? 'AI_INFERRED' : 'AI_SUGGESTED'}
                </span>
                <span className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                  incertidumbre {mutation.uncertainty}
                </span>
              </div>
            </div>
            {mutation.rationale ? <p className="mt-2 text-xs text-slate-500">{mutation.rationale}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
        active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

function WorkItemList({
  items,
  onUpdateWorkItem,
  onRemoveWorkItem,
}: {
  items: NonNullable<ReturnType<typeof projectBootstrapHome>>['workItems'];
  onUpdateWorkItem: (workItemId: string, input: UpdatePortfolioBootstrapWorkItemInput) => Promise<void>;
  onRemoveWorkItem: (workItemId: string) => Promise<void>;
}) {
  if (items.length === 0) {
    return <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Aun no hay trabajo provisional agregado.</p>;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-950">{items.length} elementos detectados</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">{item.proposedName ?? item.rawLabel}</p>
              {item.proposedPurpose ? <p className="mt-1 text-sm text-slate-600">{item.proposedPurpose}</p> : null}
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Provisional - {sourceTypeLabel(item.sourceType)} - {stateHintLabel(item.currentStateHint)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const label = window.prompt('Nombre o descripcion breve', item.proposedName ?? item.rawLabel);
                  if (label?.trim()) void onUpdateWorkItem(item.id, { label });
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={16} />
                Editar
              </button>
              <button
                type="button"
                onClick={() => void onRemoveWorkItem(item.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Trash2 size={16} />
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MaterialReviewPanel({
  projection,
  onConfirm,
  onCorrect,
  onReject,
  onLeavePending,
}: {
  projection: NonNullable<ReturnType<typeof projectBootstrapHome>>;
  onConfirm: (mutationId: string) => Promise<void>;
  onCorrect: (mutationId: string, proposedValue: unknown, reviewNote?: string) => Promise<void>;
  onReject: (mutationId: string, reviewNote?: string) => Promise<void>;
  onLeavePending: (mutationId: string, reviewNote?: string) => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState('partial_alignment');
  const [correctionNote, setCorrectionNote] = useState('');
  const groups = groupMutationsByWorkItem(projection);
  const openMutations = projection.proposedMutations.filter((mutation) => (
    mutation.status === 'proposed' || (mutation.status === 'reviewed' && mutation.correctedAt)
  ));

  async function act(mutationId: string, action: () => Promise<void>) {
    setBusyId(mutationId);
    try {
      await action();
      setCorrectingId(null);
      setCorrectionNote('');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4" data-testid="portfolio-bootstrap-material-review">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Revision material</p>
          <h2 className="text-base font-semibold text-slate-950">Revisa cada propuesta antes de gobernarla</h2>
          <p className="mt-1 text-sm text-slate-600">
            Confirmar aplica estado Bootstrap gobernado. Corregir solo guarda tu ajuste hasta que confirmes.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
          {projection.analysisSummary.confirmed} confirmadas - {projection.analysisSummary.rejected} rechazadas - {projection.analysisSummary.pending} pendientes
        </span>
      </div>

      {openMutations.length > 0 ? (
        <button
          type="button"
          data-review-action="leave-pending-remaining"
          disabled={Boolean(busyId)}
          onClick={() => act('batch-pending', async () => {
            for (const mutation of openMutations) {
              await onLeavePending(mutation.id);
            }
          })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Dejar pendientes restantes
        </button>
      ) : null}

      {groups.map((group) => (
        <section key={group.id} className="space-y-3 rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-950">{group.label}</h3>
          <ul className="space-y-3">
            {group.mutations.map((mutation) => (
              <li key={mutation.id} data-testid={`portfolio-bootstrap-mutation-${mutation.id}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{proposalTitle(mutation)}</p>
                    <p className="mt-1 text-sm text-slate-700">{proposalText(mutation)}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {mutation.statusLabel ?? statusLabelForMutation(mutation.status)} - {mutation.provenanceStatus === 'ai_inferred' ? 'AI_INFERRED' : 'AI_SUGGESTED'}
                    </p>
                    {mutation.originalProposedValue ? (
                      <p className="mt-1 text-xs text-slate-500">Conserva propuesta original para trazabilidad.</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SmallActionButton
                      label="Confirmar"
                      action="confirm"
                      disabled={busyId === mutation.id || mutation.status === 'confirmed' || mutation.status === 'rejected'}
                      onClick={() => act(mutation.id, () => onConfirm(mutation.id))}
                    />
                    <SmallActionButton
                      label="Corregir"
                      action="correct"
                      disabled={busyId === mutation.id || mutation.status === 'confirmed' || mutation.status === 'rejected'}
                      onClick={() => {
                        setCorrectingId(mutation.id);
                        setCorrectionStatus(defaultCorrectionStatus(mutation));
                      }}
                    />
                    <SmallActionButton
                      label="Dejar pendiente"
                      action="leave-pending"
                      disabled={busyId === mutation.id || mutation.status === 'confirmed' || mutation.status === 'rejected'}
                      onClick={() => act(mutation.id, () => onLeavePending(mutation.id))}
                    />
                    <SmallActionButton
                      label="Rechazar"
                      action="reject"
                      disabled={busyId === mutation.id || mutation.status === 'confirmed' || mutation.status === 'rejected'}
                      onClick={() => act(mutation.id, () => onReject(mutation.id))}
                    />
                  </div>
                </div>

                {correctingId === mutation.id ? (
                  <form
                    className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const currentValue = mutation.proposedValue as Record<string, unknown>;
                      void act(mutation.id, () => onCorrect(mutation.id, {
                        ...currentValue,
                        status: correctionStatus,
                        rationale: correctionNote || currentValue.rationale,
                      }, correctionNote || undefined));
                    }}
                  >
                    <select
                      aria-label="Correccion propuesta"
                      value={correctionStatus}
                      onChange={(event) => setCorrectionStatus(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="confirmed_alignment">Parece relacionada</option>
                      <option value="partial_alignment">Relacion parcial</option>
                      <option value="alignment_unknown">Todavia no esta claro</option>
                      <option value="confirmed_misalignment">No parece relacionada</option>
                      <option value="out_of_current_priority">Fuera de la prioridad actual</option>
                    </select>
                    <textarea
                      aria-label="Motivo de correccion"
                      value={correctionNote}
                      onChange={(event) => setCorrectionNote(event.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="Motivo opcional"
                    />
                    <button
                      type="submit"
                      disabled={busyId === mutation.id}
                      className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                    >
                      Guardar correccion
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SmallActionButton({
  label,
  action,
  disabled,
  onClick,
}: {
  label: string;
  action: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-review-action={action}
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      {label}
    </button>
  );
}

function groupMutationsByWorkItem(projection: NonNullable<ReturnType<typeof projectBootstrapHome>>) {
  const workItemsById = new Map(projection.workItems.map((item) => [item.id, item]));
  const groups = new Map<string, {
    id: string;
    label: string;
    mutations: Array<NonNullable<ReturnType<typeof projectBootstrapHome>>['proposedMutations'][number] & { statusLabel?: string }>;
  }>();
  for (const mutation of projection.proposedMutations) {
    const key = mutation.targetId ?? 'portfolio';
    const item = mutation.targetId ? workItemsById.get(mutation.targetId) : null;
    const label = item ? item.proposedName ?? item.rawLabel : 'Portfolio Anchor';
    if (!groups.has(key)) groups.set(key, { id: key, label, mutations: [] });
    groups.get(key)?.mutations.push(mutation);
  }
  return [...groups.values()];
}

function defaultCorrectionStatus(mutation: NonNullable<ReturnType<typeof projectBootstrapHome>>['proposedMutations'][number]): string {
  const value = mutation.proposedValue as { status?: string } | null;
  return value?.status === 'probable_alignment' ? 'partial_alignment' : value?.status ?? 'partial_alignment';
}

function statusLabelForMutation(status: string): string {
  const labels: Record<string, string> = {
    proposed: 'Necesita tu confirmacion',
    reviewed: 'Revisada, pendiente de confirmacion si fue corregida',
    confirmed: 'Confirmada por Portfolio Lead',
    rejected: 'Rechazada',
    superseded: 'Reemplazada por analisis posterior',
    expired: 'Expirada',
  };
  return labels[status] ?? status;
}

function proposalTitle(
  mutation: NonNullable<ReturnType<typeof projectBootstrapHome>>['proposedMutations'][number],
): string {
  const labels: Record<string, string> = {
    strategic_connection: 'Conexion estrategica propuesta',
    advancement_condition: 'Condicion de avance propuesta',
    portfolio_anchor: 'Atencion sobre el Anchor',
    work_item: 'Ajuste provisional de trabajo',
  };
  return labels[mutation.targetType] ?? 'Propuesta provisional';
}

function proposalText(
  mutation: NonNullable<ReturnType<typeof projectBootstrapHome>>['proposedMutations'][number],
): string {
  const value = mutation.proposedValue as {
    status?: string;
    type?: string;
    statement?: string;
    severity?: string;
    conflict?: string;
  } | null;
  if (value?.statement) return value.statement;
  if (value?.conflict) return value.conflict;
  if (value?.status) return `Estado sugerido: ${value.status}`;
  if (value?.type) return `Tipo sugerido: ${value.type}`;
  return 'Propuesta pendiente de revision humana.';
}

function BootstrapHeader({
  eyebrow,
  title,
  status,
  provenanceLabel,
}: {
  eyebrow: string;
  title: string;
  status: PortfolioBootstrapAnchor['status'];
  provenanceLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          {statusLabel(status)}
        </span>
        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            <Eye size={14} />
            Procedencia
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-lg">
            {provenanceLabel}
          </div>
        </details>
      </div>
    </div>
  );
}

function AnchorSummary({ anchor }: { anchor: PortfolioBootstrapAnchor }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <SummaryField label="Esto entendimos" value={anchor.outcomeStatement} />
      <SummaryField label="Contexto conocido" value={anchor.contextSummary} />
      <SummaryField label="Decision a habilitar" value={anchor.decisionToEnable} />
      <SummaryField label="Senal de negocio" value={anchor.businessSignalValue ?? signalLabel(anchor.businessSignalStatus)} />
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-900">{value || 'Pendiente'}</p>
    </div>
  );
}

function ContextList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-600">{empty}</p>
      )}
    </div>
  );
}

function AnchorEditor({
  anchor,
  onSave,
}: {
  anchor: PortfolioBootstrapAnchor;
  onSave: (input: UpdatePortfolioBootstrapAnchorInput) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    outcomeStatement: anchor.outcomeStatement,
    contextSummary: anchor.contextSummary ?? '',
    decisionToEnable: anchor.decisionToEnable ?? '',
    businessSignalValue: anchor.businessSignalValue ?? '',
  });

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        <Pencil size={16} />
        Editar Anchor
      </button>
    );
  }

  return (
    <form
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        await onSave({
          outcomeStatement: form.outcomeStatement,
          contextSummary: form.contextSummary || null,
          decisionToEnable: form.decisionToEnable || null,
          businessSignalValue: form.businessSignalValue || null,
        });
        setSaving(false);
        setEditing(false);
      }}
    >
      <EditorField label="Esto entendimos" value={form.outcomeStatement} onChange={(value) => setForm({ ...form, outcomeStatement: value })} />
      <EditorField label="Contexto conocido" value={form.contextSummary} onChange={(value) => setForm({ ...form, contextSummary: value })} />
      <EditorField label="Decision a habilitar" value={form.decisionToEnable} onChange={(value) => setForm({ ...form, decisionToEnable: value })} />
      <EditorField label="Senal de negocio" value={form.businessSignalValue} onChange={(value) => setForm({ ...form, businessSignalValue: value })} />
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? 'Guardando...' : 'Guardar ajustes'}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function EditorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={2}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900"
      />
    </label>
  );
}

function PrimaryAction({
  label,
  description,
  disabled,
  onClick,
}: {
  label: string;
  description: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-950">Siguiente accion</p>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <CheckCircle2 size={16} />
        {label}
      </button>
    </div>
  );
}

function sourceTypeLabel(sourceType: 'pasted_text' | 'manual_entry' | 'entry_context' | 'imported_file'): string {
  const labels = {
    pasted_text: 'pegado por usuario',
    manual_entry: 'agregado manualmente',
    entry_context: 'contexto de entrada',
    imported_file: 'importado desde archivo',
  };
  return labels[sourceType];
}

function stateHintLabel(stateHint: string | null): string {
  const labels: Record<string, string> = {
    idea: 'idea',
    candidate: 'candidata',
    active: 'en marcha',
    paused: 'pausada',
    completed: 'terminada',
    unknown: 'estado no declarado',
  };
  return labels[stateHint ?? 'unknown'] ?? 'estado no declarado';
}

function statusLabel(status: PortfolioBootstrapAnchor['status']): string {
  const labels: Record<PortfolioBootstrapAnchor['status'], string> = {
    anchor_insufficient: 'Pendiente',
    anchor_provisional: 'Provisional',
    anchor_sufficient: 'Suficiente, sin confirmar',
    anchor_confirmed: 'Confirmado',
    anchor_conflicting: 'Con conflicto',
  };
  return labels[status];
}

function signalLabel(status: PortfolioBootstrapAnchor['businessSignalStatus']): string {
  const labels: Record<PortfolioBootstrapAnchor['businessSignalStatus'], string> = {
    confirmed: 'Confirmada',
    proxy: 'Proxy disponible',
    suggested: 'Sugerida',
    unknown: 'Pendiente',
    conflicting: 'Con conflicto',
  };
  return labels[status];
}
