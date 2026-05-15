import React from 'react';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { ProgressBar } from '../ProgressBar';
import { PortfolioLeadEmptyState } from '../../../features/portfolio-lead/components/states/PortfolioLeadEmptyState';
import type {
  PortfolioFrontOverviewCard,
  PortfolioImportantChangeCard,
  PortfolioPendingDecisionRow,
  PortfolioRecentActivityItem,
  PortfolioWelcomeBannerActionGroup,
} from '../../../features/portfolio-lead/domain/types';

const bannerTone = {
  primary: 'bg-slate-900 text-white shadow-lg shadow-slate-900/10',
  secondary: 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
  ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
} as const;

const frontToneClasses: Record<PortfolioFrontOverviewCard['executiveTone'], string> = {
  emerald: 'border-emerald-200 bg-emerald-50/80',
  amber: 'border-amber-200 bg-amber-50/80',
  rose: 'border-rose-200 bg-rose-50/80',
  violet: 'border-violet-200 bg-violet-50/80',
  slate: 'border-slate-200 bg-white',
};

const activityToneClasses: Record<PortfolioRecentActivityItem['tone'], string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
  slate: 'bg-slate-400',
};

const impactToneClasses: Record<'Impacto alto' | 'Impacto medio' | 'Impacto bajo', string> = {
  'Impacto alto': 'border-rose-200 bg-rose-50 text-rose-800',
  'Impacto medio': 'border-amber-200 bg-amber-50 text-amber-800',
  'Impacto bajo': 'border-slate-200 bg-slate-100 text-slate-700',
};

export function normalizePortfolioText(value?: string) {
  if (!value) return '';
  if (!/[ÃÂ]/.test(value)) return value;
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

export function PortfolioWelcomeBanner({
  title,
  subtitle,
  actions,
  onNavigate,
}: {
  title: string;
  subtitle: string;
  actions: PortfolioWelcomeBannerActionGroup;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#f7f5ee_0%,#ffffff_52%,#eef3fb_100%)] p-6 shadow-sm md:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] tracking-[0.18em] text-slate-500">
            <Sparkles size={12} />
            VISTA EJECUTIVA
          </div>
          <h1 className="mt-4 text-2xl text-slate-950 md:text-3xl" style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
            {normalizePortfolioText(title)}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-[15px]">
            {normalizePortfolioText(subtitle)}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-64">
          <BannerActionButton action={actions.primary} onNavigate={onNavigate} emphasis="primary" />
          <BannerActionButton action={actions.secondary} onNavigate={onNavigate} emphasis="secondary" />
          <BannerActionButton action={actions.tertiary} onNavigate={onNavigate} emphasis="ghost" />
        </div>
      </div>
    </section>
  );
}

export function StrategicFrontOverviewCard({
  front,
  onNavigate,
}: {
  front: PortfolioFrontOverviewCard;
  onNavigate: (path: string) => void;
}) {
  const checklist = front.alerts.length > 0 ? front.alerts : [front.nextAction];
  const checklistHeading = front.executiveState === 'En curso' || front.executiveState === 'Listo para decisión'
    ? 'Seguimiento sugerido'
    : 'Puntos por abordar';

  return (
    <article className={`rounded-[28px] border p-5 md:p-6 ${frontToneClasses[front.executiveTone]}`}>
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>Frente estratégico</p>
            <h3 className="mt-2 text-lg text-slate-950 md:text-xl" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              {normalizePortfolioText(front.name)}
            </h3>
          </div>
          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] text-slate-500">
            {normalizePortfolioText(front.createdLabel || front.lastActivityLabel)}
          </span>
        </div>

        <div>
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>Descripción del frente</p>
          <p className="mt-1 text-sm text-slate-700">
            {normalizePortfolioText(front.objective)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>Señal principal</p>
          <p className="mt-1 text-sm text-slate-900" style={{ fontWeight: 700 }}>
            {normalizePortfolioText(front.mainKpi)}
          </p>
        </div>

        <div>
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm text-slate-700" style={{ fontWeight: 700 }}>Estado de avance del frente</p>
            <p className="text-sm text-slate-900" style={{ fontWeight: 700 }}>{front.progressPercent}%</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Estimado según retos activados e iniciativas en curso.
          </p>
          <div className="mt-2">
            <ProgressBar
              value={front.progressPercent}
              size="md"
              color={front.executiveTone === 'emerald' ? 'emerald' : front.executiveTone === 'amber' ? 'amber' : front.executiveTone === 'rose' ? 'red' : front.executiveTone === 'violet' ? 'indigo' : 'auto'}
              showLabel={false}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FrontStat label="Retos" value={`${front.challengesCount}`} />
          <FrontStat label="Iniciativas" value={`${front.initiativesCount}`} />
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 p-4 backdrop-blur">
          <p className={`inline-flex rounded-full px-3 py-1 text-xs ${stateBadgeClasses(front.executiveTone)}`}>
            {normalizePortfolioText(front.executiveState)}
          </p>
          <p className="mt-3 text-sm text-slate-700">
            {normalizePortfolioText(front.stateReadout || front.detail)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 p-4 backdrop-blur">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{checklistHeading}</p>
          <ul className="mt-3 space-y-2">
            {checklist.map(item => (
              <li key={item} className="flex gap-2 text-sm text-slate-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                <span>{normalizePortfolioText(item)}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(front.actionPath)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors hover:bg-slate-50"
          style={{ fontWeight: 700 }}
        >
          {normalizePortfolioText(front.actionLabel)}
          <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
}

export function ImportantChangesSection({
  items,
  onNavigate,
}: {
  items: PortfolioImportantChangeCard[];
  onNavigate: (path: string) => void;
}) {
  const relevantItems = items.filter(item => resolveImpactLabel(item) !== 'Impacto bajo');

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-7">
      <div className="max-w-3xl">
        <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>CAMBIOS IMPORTANTES DETECTADOS</p>
        <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Solo se muestran hallazgos con impacto real sobre el avance, seguimiento o decisión del portafolio.</h2>
        <p className="mt-2 text-sm text-slate-600">
          Cada tarjeta muestra el frente, el hallazgo, la consecuencia y la acción sugerida.
        </p>
      </div>

      {relevantItems.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
          <p className="text-sm text-slate-700" style={{ fontWeight: 700 }}>No hay cambios relevantes que requieran acción inmediata.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {relevantItems.map(item => (
            <article key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <ImpactBadge label={resolveImpactLabel(item)} />
              <p className="mt-3 text-xs text-slate-500" style={{ fontWeight: 700 }}>Frente estratégico</p>
              <h3 className="mt-2 text-lg text-slate-950" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                {normalizePortfolioText(item.frontName)}
              </h3>
              <p className="mt-2 text-sm text-slate-700" style={{ fontWeight: 700 }}>
                {normalizePortfolioText(item.itemName)}
              </p>

              <div className="mt-4 space-y-4">
                <BlockText label="Detalle analizado" value={normalizePortfolioText(item.whyItMatters)} />
                <BlockText label="Consecuencia" value={normalizePortfolioText(item.risk)} />
                <BlockText label="Acción sugerida" value={normalizePortfolioText(item.suggestedAction)} />
              </div>

              {item.actionPath ? (
                <button
                  type="button"
                  onClick={() => onNavigate(item.actionPath!)}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors hover:bg-slate-50"
                  style={{ fontWeight: 700 }}
                >
                  {normalizePortfolioText(item.actionLabel)}
                  <ArrowRight size={15} />
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function PendingDecisionsSection({
  items,
  onNavigate,
}: {
  items: PortfolioPendingDecisionRow[];
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-7">
      <div className="max-w-3xl">
        <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>DECISIONES PENDIENTES</p>
        <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Iniciativas o retos que ya requieren una decisión para avanzar, escalar, ajustar o cerrar</h2>
        <p className="mt-2 text-sm text-slate-600">
          Usa esta lista para revisar qué caso ya tiene evidencia suficiente y no debería seguir esperando.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
          <p className="text-sm text-slate-700" style={{ fontWeight: 700 }}>No hay decisiones pendientes ahora</p>
          <p className="mt-2 text-sm text-slate-600">La cola está despejada por el momento. El siguiente paso es sostener seguimiento sobre frentes e iniciativas activas.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="hidden grid-cols-[1.2fr_1fr_1.2fr_0.9fr_0.8fr_auto] gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500 xl:grid">
            <span>Decisión requerida</span>
            <span>Frente</span>
            <span>Elemento asociado</span>
            <span>Evidencia</span>
            <span>Urgencia</span>
            <span />
          </div>

          {items.map(item => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1.2fr_0.9fr_0.8fr_auto] xl:items-center">
                <div>
                  <p className="text-sm text-slate-900" style={{ fontWeight: 700 }}>{normalizePortfolioText(item.decision)}</p>
                  <p className="mt-1 text-xs text-slate-500 xl:hidden">{normalizePortfolioText(item.frontName)}</p>
                </div>
                <p className="text-sm text-slate-600">{normalizePortfolioText(item.frontName)}</p>
                <p className="text-sm text-slate-600">{normalizePortfolioText(item.itemName)}</p>
                <DecisionBadge tone={item.evidenceLevel === 'Alta' ? 'violet' : item.evidenceLevel === 'Media' ? 'amber' : 'slate'}>{normalizePortfolioText(item.evidenceLevel)}</DecisionBadge>
                <DecisionBadge tone={item.urgency === 'Alta' ? 'rose' : 'sky'}>{normalizePortfolioText(item.urgency)}</DecisionBadge>
                <button
                  type="button"
                  onClick={() => onNavigate(item.actionPath)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors hover:bg-slate-100"
                  style={{ fontWeight: 700 }}
                >
                  {normalizePortfolioText(item.actionLabel)}
                  <ArrowRight size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function RecentActivitySection({
  items,
}: {
  items: PortfolioRecentActivityItem[];
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-7">
      <div className="max-w-3xl">
        <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>ACTIVIDAD RECIENTE</p>
        <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Movimientos que explican qué cambió últimamente</h2>
        <p className="mt-2 text-sm text-slate-600">
          Un registro liviano para ver si hubo activación, desbloqueo, reporte o decisión sin competir con los frentes estratégicos.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
            <p className="text-sm text-slate-700" style={{ fontWeight: 700 }}>Aún no hay actividad reciente visible</p>
          </div>
        ) : items.map(item => (
          <article key={item.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${activityToneClasses[item.tone]}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-slate-900" style={{ fontWeight: 700 }}>{normalizePortfolioText(item.label)}</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-500">
                  <Clock3 size={11} />
                  {normalizePortfolioText(item.timeLabel)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{normalizePortfolioText(item.description)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ImpactBadge({ label }: { label: 'Impacto alto' | 'Impacto medio' | 'Impacto bajo' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${impactToneClasses[label]}`} style={{ fontWeight: 700 }}>
      {label}
    </span>
  );
}

function resolveImpactLabel(item: PortfolioImportantChangeCard) {
  if (item.impactLabel) return item.impactLabel;
  if (item.tone === 'rose' || item.tone === 'violet') return 'Impacto alto';
  if (item.tone === 'amber' || item.tone === 'sky') return 'Impacto medio';
  return 'Impacto bajo';
}

function BannerActionButton({
  action,
  onNavigate,
  emphasis,
}: {
  action: PortfolioWelcomeBannerActionGroup['primary'];
  onNavigate: (path: string) => void;
  emphasis: 'primary' | 'secondary' | 'ghost';
}) {
  const classes = bannerTone[emphasis];
  const labelClass = emphasis === 'ghost' ? 'justify-start px-0 text-slate-600' : 'justify-center';

  return (
    <button
      type="button"
      onClick={() => action.path && onNavigate(action.path)}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition-colors ${classes} ${labelClass}`}
      style={{ fontWeight: emphasis === 'primary' ? 700 : 600 }}
    >
      <span>{normalizePortfolioText(action.label)}</span>
      {action.path ? <ArrowRight size={15} /> : null}
    </button>
  );
}

function FrontStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-2 text-sm text-slate-900" style={{ fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function BlockText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-1 text-sm text-slate-700">{value}</p>
    </div>
  );
}

function DecisionBadge({ tone, children }: { tone: 'violet' | 'amber' | 'rose' | 'sky' | 'slate'; children: React.ReactNode }) {
  const tones = {
    violet: 'border-violet-200 bg-violet-50 text-violet-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    sky: 'border-sky-200 bg-sky-50 text-sky-800',
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}

function stateBadgeClasses(tone: PortfolioFrontOverviewCard['executiveTone']) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    amber: 'border-amber-200 bg-amber-100 text-amber-800',
    rose: 'border-rose-200 bg-rose-100 text-rose-800',
    violet: 'border-violet-200 bg-violet-100 text-violet-800',
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
  };
  return tones[tone];
}
