import React from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import type { PublicDraftOutput } from '../domain/types';

/**
 * PublicCompletionAdvisor — coach-style card that surfaces what's still
 * missing in the public draft's one-pager, with a visible completion meter
 * and per-field tips.
 *
 * Rendered inside the preview column on `ProgressiveSignupPage` ABOVE the
 * one-pager. When extraction is partial (often because the AI dropped some
 * step0.* fields under transient rate limits), the user now sees a primary
 * UX signal explaining what to do — instead of just "Pendiente por completar"
 * fallbacks in the read-only preview.
 *
 * Hides itself entirely when all editable fields are filled.
 */

export interface AdvisorField {
  /** PublicDraftOutput key — used as React key and to look up the value. */
  id: keyof PublicDraftOutput;
  /** User-facing label rendered in the missing-fields list. */
  label: string;
  /** Friendly one-liner tip shown next to the label when missing. */
  tip: string;
}

/**
 * Editable preview fields the advisor cares about. Stays in sync with the
 * fields the editor exposes (`PublicProposalEditor.FIELDS`) — 6 entries.
 */
export const ADVISOR_FIELDS: AdvisorField[] = [
  {
    id: 'proposalTitle',
    label: 'Nombre de la iniciativa',
    tip: 'Un nombre concreto ayuda a otros a entender de qué se trata sin abrir el documento.',
  },
  {
    id: 'whatToMove',
    label: 'Qué quiere mover',
    tip: 'Describe el cambio que buscas provocar, sin cerrar todavía la solución.',
  },
  {
    id: 'whyNow',
    label: 'Por qué importa ahora',
    tip: 'Conecta urgencia, costo de esperar o ventana de oportunidad.',
  },
  {
    id: 'impactedAudience',
    label: 'A quién impacta',
    tip: 'Nombra personas, equipos, clientes o áreas afectadas directamente.',
  },
  {
    id: 'initialEvidence',
    label: 'Evidencia o señal',
    tip: 'Aunque no la tengas aún, describe la señal que vas a buscar.',
  },
  {
    id: 'supportNeeded',
    label: 'Apoyo necesario',
    tip: 'Aclara si necesitas feedback, permiso para validar, acceso a datos o sponsor.',
  },
];

function valueIsEmpty(value: unknown): boolean {
  if (typeof value !== 'string') return true;
  return value.trim().length === 0;
}

interface PublicCompletionAdvisorProps {
  draftId: string;
  output: PublicDraftOutput;
  /** Override for tests — defaults to react-router's `useNavigate`. */
  onNavigateToEditor?: (draftId: string, fieldId: keyof PublicDraftOutput) => void;
}

export function PublicCompletionAdvisor({
  draftId,
  output,
  onNavigateToEditor,
}: PublicCompletionAdvisorProps) {
  const navigate = useNavigate();

  const total = ADVISOR_FIELDS.length;
  const missing = ADVISOR_FIELDS.filter(field => valueIsEmpty(output[field.id]));
  const filled = total - missing.length;

  if (missing.length === 0) {
    return null;
  }

  const percent = Math.round((filled / total) * 100);
  const half = total / 2;

  // Tri-state thresholds: full (no missing — handled above), >=half, <half.
  const tone: 'amber' | 'indigo' = filled >= half ? 'indigo' : 'amber';
  const statusText =
    tone === 'indigo'
      ? `Buena base. Faltan ${missing.length} campos para que tu propuesta sea más sólida.`
      : `Tu propuesta necesita más detalle antes de presentarla. Faltan ${missing.length} campos clave.`;

  const palette = tone === 'indigo'
    ? {
        card: 'border-indigo-200 bg-indigo-50',
        icon: 'bg-indigo-100 text-indigo-700',
        meterBg: 'bg-indigo-100',
        meterFill: 'bg-indigo-500',
        status: 'text-indigo-900',
        cta: 'border-indigo-300 bg-white text-indigo-800 hover:bg-indigo-100',
        tipBox: 'border-indigo-100 bg-white/70',
        IconCmp: Sparkles,
      }
    : {
        card: 'border-amber-200 bg-amber-50',
        icon: 'bg-amber-100 text-amber-700',
        meterBg: 'bg-amber-100',
        meterFill: 'bg-amber-500',
        status: 'text-amber-900',
        cta: 'border-amber-300 bg-white text-amber-800 hover:bg-amber-100',
        tipBox: 'border-amber-100 bg-white/70',
        IconCmp: AlertCircle,
      };

  const goToEditor = (fieldId: keyof PublicDraftOutput) => {
    if (onNavigateToEditor) {
      onNavigateToEditor(draftId, fieldId);
      return;
    }
    navigate(`/public/draft/${draftId}/edit?focus=${String(fieldId)}`);
  };

  const HeadingIcon = palette.IconCmp;

  return (
    <section
      data-testid="public-completion-advisor"
      className={`rounded-2xl border ${palette.card} p-5 shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${palette.icon}`}>
          <HeadingIcon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-slate-500" style={{ fontWeight: 900, letterSpacing: '0.08em' }}>
            Avance de tu propuesta
          </p>
          <h3 className="mt-1 text-sm text-slate-950" style={{ fontWeight: 850 }}>
            <span data-testid="advisor-meter-label">
              {filled}/{total} campos completos
            </span>
          </h3>
          <div
            className={`mt-2 h-2 w-full overflow-hidden rounded-full ${palette.meterBg}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={filled}
            aria-label="Progreso de la propuesta"
          >
            <div
              data-testid="advisor-meter-fill"
              className={`h-full ${palette.meterFill} transition-all`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className={`mt-3 text-sm leading-6 ${palette.status}`} style={{ fontWeight: 750 }}>
            {statusText}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {missing.map(field => (
          <li
            key={field.id}
            className={`flex flex-col gap-2 rounded-xl border ${palette.tipBox} p-3 sm:flex-row sm:items-center sm:justify-between`}
          >
            <div className="min-w-0">
              <p className="text-sm text-slate-950" style={{ fontWeight: 800 }}>
                {field.label}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">{field.tip}</p>
            </div>
            <button
              type="button"
              onClick={() => goToEditor(field.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${palette.cta}`}
              style={{ fontWeight: 850 }}
            >
              Completar en el editor
              <ChevronRight size={13} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Optional confirmation card to render when nothing is missing — useful if a
 * parent wants to keep visual continuity. Default render of
 * `PublicCompletionAdvisor` returns null in that case; callers that want a
 * positive state can import this directly.
 */
export function PublicCompletionAdvisorComplete() {
  return (
    <section
      data-testid="public-completion-advisor-complete"
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={18} />
        </div>
        <div>
          <h3 className="text-sm text-emerald-950" style={{ fontWeight: 850 }}>
            Tu propuesta está completa.
          </h3>
          <p className="mt-1 text-sm leading-6 text-emerald-800">
            Estás listo para descargar y continuar.
          </p>
        </div>
      </div>
    </section>
  );
}
