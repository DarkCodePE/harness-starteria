import { AlertTriangle, GitBranch, RotateCcw, SplitSquareHorizontal, Undo2 } from 'lucide-react';

export type CriticalChangeAction = 'update_route' | 'keep_previous_route' | 'split_phases' | 'back_and_edit';

interface CriticalChangeReviewProps {
  previousValue: unknown;
  nextValue: unknown;
  reason: string;
  affectedCheckpoints: string[];
  affectedOutputs: string[];
  affectedNextStep: string;
  newVersion: number;
  onAction: (action: CriticalChangeAction) => void;
  disabled?: boolean;
}

const ACTIONS: Array<{ id: CriticalChangeAction; label: string; icon: typeof GitBranch }> = [
  { id: 'update_route', label: 'Actualizar ruta', icon: GitBranch },
  { id: 'keep_previous_route', label: 'Mantener ruta anterior', icon: RotateCcw },
  { id: 'split_phases', label: 'Dividir en fases', icon: SplitSquareHorizontal },
  { id: 'back_and_edit', label: 'Volver y editar', icon: Undo2 },
];

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === '') return 'Sin valor registrado';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export function CriticalChangeReview({
  previousValue,
  nextValue,
  reason,
  affectedCheckpoints,
  affectedOutputs,
  affectedNextStep,
  newVersion,
  onAction,
  disabled,
}: CriticalChangeReviewProps) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 text-amber-600" size={18} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm text-amber-950" style={{ fontWeight: 700 }}>Revisar cambio critico</h2>
          <p className="mt-1 text-xs text-amber-800">Este cambio no se aplicara silenciosamente. La configuracion anterior se conserva y los outputs dependientes quedaran en revision.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-amber-100 bg-white p-3">
          <p className="text-[11px] uppercase text-slate-500" style={{ fontWeight: 700 }}>Valor anterior</p>
          <p className="mt-1 break-words text-sm text-slate-800">{formatValue(previousValue)}</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-white p-3">
          <p className="text-[11px] uppercase text-slate-500" style={{ fontWeight: 700 }}>Nuevo valor</p>
          <p className="mt-1 break-words text-sm text-slate-800">{formatValue(nextValue)}</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-amber-100 bg-white p-3">
        <p className="text-[11px] uppercase text-slate-500" style={{ fontWeight: 700 }}>Motivo del cambio</p>
        <p className="mt-1 text-sm text-slate-800">{reason || 'Pendiente de explicar'}</p>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <ImpactList title="Checkpoints afectados" items={affectedCheckpoints} />
        <ImpactList title="Outputs afectados" items={affectedOutputs} />
        <div className="rounded-lg border border-amber-100 bg-white p-3">
          <p className="text-[11px] uppercase text-slate-500" style={{ fontWeight: 700 }}>Siguiente Step afectado</p>
          <p className="mt-1 text-sm text-slate-800">{affectedNextStep}</p>
          <p className="mt-2 text-xs text-slate-500">Nueva version: v{newVersion}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={() => onAction(action.id)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ fontWeight: 700 }}
            >
              <Icon size={15} />
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ImpactList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-amber-100 bg-white p-3">
      <p className="text-[11px] uppercase text-slate-500" style={{ fontWeight: 700 }}>{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{item}</span>
        ))}
      </div>
    </div>
  );
}
