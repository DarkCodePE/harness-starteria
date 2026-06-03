import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Flag,
  GitBranch,
  Rocket,
  Sparkles,
  Target,
  Users,
  Lock,
} from 'lucide-react';
import { ProgressBar } from '../ProgressBar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PortfolioLeadEmptyState } from '../../../features/portfolio-lead/components/states/PortfolioLeadEmptyState';
import type {
  PortfolioAttentionQueueItem,
  PortfolioFrontOverviewCard,
  PortfolioImportantChangeCard,
  PortfolioLeadSummary,
  PortfolioPendingDecisionRow,
  PortfolioRecentActivityItem,
  PortfolioWelcomeBannerActionGroup,
  PortfolioStrategicOverviewModel,
  StrategicObjectiveChallengeRow,
  StrategicObjectiveFrontCard,
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

const queueToneClasses: Record<PortfolioAttentionQueueItem['tone'], string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  rose: 'border-rose-200 bg-rose-50 text-rose-900',
  violet: 'border-violet-200 bg-violet-50 text-violet-900',
  sky: 'border-sky-200 bg-sky-50 text-sky-900',
  slate: 'border-slate-200 bg-white text-slate-900',
};

const queueIconMap: Record<PortfolioAttentionQueueItem['iconKey'], React.ComponentType<{ size?: number; className?: string }>> = {
  target: Target,
  flag: Flag,
  rocket: Rocket,
  alert: AlertTriangle,
  lock: Lock,
  check: CheckCircle2,
  sparkles: Sparkles,
  file: FileText,
  decision: GitBranch,
  users: Users,
};

const challengeSeverityClasses: Record<StrategicObjectiveChallengeRow['severity'], { card: string; badge: string; action: string }> = {
  critical: {
    card: 'border-rose-200 bg-rose-50/80',
    badge: 'border-rose-200 bg-rose-100 text-rose-800',
    action: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  attention: {
    card: 'border-amber-200 bg-amber-50/80',
    badge: 'border-amber-200 bg-amber-100 text-amber-800',
    action: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  healthy: {
    card: 'border-emerald-200 bg-emerald-50/80',
    badge: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    action: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  neutral: {
    card: 'border-slate-200 bg-white/80',
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
    action: 'border-slate-200 bg-white text-slate-700',
  },
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
          {actions.tertiary ? (
            <BannerActionButton action={actions.tertiary} onNavigate={onNavigate} emphasis="ghost" />
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function PortfolioPrimaryActionRail({
  summary,
  onNavigate,
}: {
  summary: PortfolioLeadSummary;
  onNavigate: (path: string) => void;
}) {
  const reviewPath = summary.blockedInitiatives > 0 ? '/portfolio/iniciativas' : '/portfolio/retos';
  const reviewLabel = summary.blockedInitiatives > 0 ? 'Revisar bloqueos' : 'Revisar retos';

  const actions = [
    {
      id: 'create-front',
      title: 'Crear frente estratégico',
      description: 'Ordena una prioridad y empieza a mover el portafolio.',
      note: 'Punto de partida visible.',
      actionLabel: 'Crear frente',
      path: '/portfolio/frentes-estrategicos',
      tone: 'emerald' as const,
      icon: Target,
      badge: 'Acción principal',
    },
    {
      id: 'import-initiatives',
      title: 'Importar iniciativas existentes',
      description: 'Sube Excel, texto o documentos para clasificarlos por frente y reto.',
      note: 'Siguiente fase.',
      actionLabel: 'Preparar importación',
      path: '/portfolio/iniciar?mode=import',
      tone: 'slate' as const,
      icon: FileText,
      badge: 'Próximamente',
    },
    {
      id: 'pending-decisions',
      title: 'Revisar decisiones pendientes',
      description: summary.pendingDecisions > 0
        ? `${summary.pendingDecisions} caso(s) ya piden definición.`
        : 'No hay decisiones pendientes por ahora.',
      note: summary.readyForDecisionInitiatives > 0
        ? `${summary.readyForDecisionInitiatives} listas para decisión.`
        : 'Cola tranquila.',
      actionLabel: 'Ir a decisiones',
      path: '/portfolio/decisiones',
      tone: summary.pendingDecisions > 0 ? 'violet' as const : 'sky' as const,
      icon: GitBranch,
      badge: summary.pendingDecisions > 0 ? 'Hay cola' : 'Tranquilo',
    },
    {
      id: 'review-work',
      title: summary.blockedInitiatives > 0 ? 'Revisar bloqueos activos' : 'Revisar retos activos',
      description: summary.blockedInitiatives > 0
        ? `${summary.blockedInitiatives} iniciativa(s) necesitan destrabe.`
        : `${summary.challengesReadyToActivate} reto(s) están listos para activar.`,
      note: summary.blockedInitiatives > 0 ? 'Atención inmediata.' : 'Siguiente avance útil.',
      actionLabel: reviewLabel,
      path: reviewPath,
      tone: summary.blockedInitiatives > 0 ? 'rose' as const : 'amber' as const,
      icon: AlertTriangle,
      badge: summary.blockedInitiatives > 0 ? 'Bloqueos' : 'Retos',
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2">
      {actions.filter(action => action.id === 'create-front' || action.id === 'import-initiatives').map(action => (
        <article key={action.id} className={`rounded-[24px] border p-5 shadow-sm ${action.tone === 'emerald'
          ? 'border-emerald-200 bg-emerald-50/70'
          : action.tone === 'rose'
            ? 'border-rose-200 bg-rose-50/70'
            : action.tone === 'violet'
              ? 'border-violet-200 bg-violet-50/70'
              : action.tone === 'amber'
                ? 'border-amber-200 bg-amber-50/70'
                : 'border-slate-200 bg-white'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-black/5 ${action.tone === 'emerald'
              ? 'bg-white text-emerald-700'
              : action.tone === 'rose'
                ? 'bg-white text-rose-700'
                : action.tone === 'violet'
                  ? 'bg-white text-violet-700'
                  : action.tone === 'amber'
                    ? 'bg-white text-amber-700'
                    : 'bg-slate-100 text-slate-700'}`}>
              <action.icon size={18} />
            </div>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
              {action.badge}
            </Badge>
          </div>

          <h3 className="mt-4 text-base text-slate-950" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            {action.title}
          </h3>
          <p className="mt-2 text-sm text-slate-600">{action.description}</p>
          <p className="mt-3 text-xs text-slate-500">{action.note}</p>

          <div className="mt-4">
            <Button
              type="button"
              variant={action.path ? 'outline' : 'secondary'}
              disabled={!action.path}
              onClick={() => action.path && onNavigate(action.path)}
              className="w-full justify-center rounded-2xl"
            >
              {action.actionLabel}
              {action.path ? <ArrowRight size={14} /> : null}
            </Button>
          </div>
        </article>
      ))}
    </section>
  );
}

export function PortfolioAttentionQueueSection({
  items,
  onNavigate,
}: {
  items: PortfolioAttentionQueueItem[];
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-7">
      <div className="max-w-3xl">
        <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>COLA DE ATENCIÓN</p>
        <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Lo que conviene mirar primero, sin ruido.</h2>
        <p className="mt-2 text-sm text-slate-600">
          Bloqueos, decisiones y retos listos para activar en una sola lectura.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-5">
          <PortfolioLeadEmptyState
            eyebrow="Atención despejada"
            title="No hay señales críticas ahora"
            description="El portafolio está estable. Puedes revisar frentes o seguir alimentando cobertura cuando aparezcan nuevos casos."
            steps={['Sin bloqueos', 'Sin decisiones urgentes', 'Seguimiento activo']}
            primaryAction={{
              label: 'Revisar portafolio',
              onClick: () => onNavigate('/portfolio/inicio'),
            }}
            secondaryAction={{
              label: 'Crear frente',
              onClick: () => onNavigate('/portfolio/frentes-estrategicos'),
              helper: 'Mantén el ritmo con una prioridad clara.',
            }}
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {items.map(item => {
            const Icon = queueIconMap[item.iconKey];
            return (
              <article key={item.id} className={`rounded-[24px] border p-5 ${queueToneClasses[item.tone]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 ring-1 ring-black/5">
                      <Icon size={18} />
                    </div>
                    <div>
                      <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                        {item.badgeLabel}
                      </Badge>
                      <p className="mt-2 text-sm text-slate-900" style={{ fontWeight: 700 }}>
                        {item.title}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-700">{item.subtitle}</p>
                <div className="mt-3 grid gap-2 rounded-2xl border border-white/70 bg-white/70 p-3 text-xs text-slate-600">
                  <QueueMeta label="Frente" value={item.frontName ?? item.contextLabel ?? 'Sin frente visible'} />
                  {item.challengeName ? <QueueMeta label="Reto" value={item.challengeName} /> : null}
                  {item.initiativeName ? <QueueMeta label="Iniciativa" value={item.initiativeName} /> : null}
                  <div className="flex flex-wrap gap-2">
                    <DecisionBadge tone={item.tone === 'rose' ? 'rose' : item.tone === 'violet' ? 'violet' : item.tone === 'amber' ? 'amber' : 'slate'}>
                      {formatAlertType(item.alertType)}
                    </DecisionBadge>
                    <DecisionBadge tone={item.severity === 'Alta' ? 'rose' : item.severity === 'Media' ? 'amber' : 'slate'}>
                      Severidad {item.severity ?? 'Media'}
                    </DecisionBadge>
                  </div>
                  <QueueMeta label="Acción recomendada" value={item.recommendedAction ?? item.actionLabel} />
                </div>

                {item.actionPath ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onNavigate(item.actionPath!)}
                    className="mt-4 w-full justify-center rounded-2xl"
                  >
                    {item.actionLabel}
                    <ArrowRight size={14} />
                  </Button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function StrategicObjectivesOverview({
  overview,
  onNavigate,
}: {
  overview: PortfolioStrategicOverviewModel;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>OBJETIVOS ESTRATEGICOS</p>
          <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>
            Objetivos estrategicos priorizados
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Primero aparecen los frentes que requieren atencion, decisiones o desbloqueo.
          </p>
        </div>
      </div>

      {overview.fronts.length === 0 ? (
        <div className="mt-5">
          <PortfolioLeadEmptyState
            eyebrow="Portafolio en arranque"
            title="Todavía no hay frentes estratégicos"
            description="Crea el primer frente para ordenar prioridades, retos e iniciativas bajo una misma lectura ejecutiva."
            steps={['Crear frente', 'Crear reto', 'Activar', 'Recibir iniciativas', 'Decidir']}
            primaryAction={{ label: 'Crear nuevo frente', onClick: () => onNavigate('/portfolio/frentes-estrategicos') }}
            secondaryAction={{
              label: 'Importar iniciativas existentes',
              onClick: () => onNavigate('/portfolio/iniciar?mode=import'),
              helper: 'Ordena trabajo existente cuando ya haya iniciativas en marcha.',
            }}
          />
        </div>
      ) : (
        <StrategicFrontsPriorityList fronts={overview.fronts} onNavigate={onNavigate} />
      )}
    </section>
  );
}

export const PortfolioStrategicMap = StrategicObjectivesOverview;

export function StrategicFrontsPriorityList({
  fronts,
  onNavigate,
}: {
  fronts: StrategicObjectiveFrontCard[];
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-5">
      {fronts.map((front, index) => (
        <StrategicFrontExecutiveCard
          key={front.id}
          front={front}
          onNavigate={onNavigate}
          isPriorityFront={index === 0}
        />
      ))}
    </div>
  );
}

export function StrategicFrontExecutiveCard({
  front,
  onNavigate,
  isPriorityFront = false,
}: {
  front: StrategicObjectiveFrontCard;
  onNavigate: (path: string) => void;
  isPriorityFront?: boolean;
}) {
  const progressColor = front.statusTone === 'emerald'
    ? 'emerald'
    : front.statusTone === 'amber'
      ? 'amber'
      : front.statusTone === 'rose'
        ? 'red'
        : front.statusTone === 'violet'
          ? 'indigo'
          : 'auto';
  const displayStatusLabel = getExecutiveFrontStatusLabel(front);
  const hasAttention = front.healthStatus === 'requires_attention' || front.healthStatus === 'pending_decision';
  const [expanded, setExpanded] = React.useState(isPriorityFront || hasAttention);
  const showChallengeDetails = expanded || hasAttention;
  const challengeSummary = front.challengesCount === 1 ? '1 reto en seguimiento' : `${front.challengesCount} retos en seguimiento`;
  const actionButtons = showChallengeDetails
    ? [
      { label: 'Ver objetivo', path: front.viewPath },
      { label: 'Crear reto', path: front.createChallengePath },
      { label: 'Importar iniciativas', path: front.importPath },
      { label: 'Generar reporte', path: front.reportPath },
    ]
    : [
      { label: 'Ver objetivo', path: front.viewPath },
      { label: 'Crear reto', path: front.createChallengePath },
      { label: 'Ver mas', path: front.createChallengePath },
    ];

  if (showChallengeDetails) {
    return (
      <ExpandedStrategicFrontCard
        front={front}
        onNavigate={onNavigate}
        onCollapse={() => setExpanded(false)}
      />
    );
  }

  return (
    <CompactStrategicFrontCard
      front={front}
      onNavigate={onNavigate}
      onExpand={() => setExpanded(true)}
    />
  );

  return (
    <article className={`rounded-[24px] border p-5 shadow-sm md:p-6 ${frontToneClasses[front.statusTone]}`}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>Frente estrategico</p>
            <h3 className="mt-2 text-lg text-slate-950 md:text-xl" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              {normalizePortfolioText(front.name)}
            </h3>
            <p
              className="mt-2 max-w-2xl overflow-hidden text-sm leading-6 text-slate-600"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
            >
              {normalizePortfolioText(front.strategicObjective)}
            </p>
          </div>
          <span className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs ${stateBadgeClasses(front.statusTone)}`}>
            {normalizePortfolioText(displayStatusLabel)}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ExecutiveInfoBlock icon={Clock3} label="Horizonte" value={normalizePortfolioText(front.horizon)} />
          <ExecutiveInfoBlock icon={Target} label="KPI principal" value={normalizePortfolioText(front.mainKpi)} />
          <ExecutiveInfoBlock icon={Users} label="Sponsor" value={normalizePortfolioText(front.sponsor)} />
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/85 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <ExecutiveMetricBlock label="Estado actual" value={front.currentValue} />
            <ExecutiveMetricBlock label="Meta" value={front.target} />
          </div>
          <div className="mt-4">
            <div className="flex items-end justify-between gap-3">
              <p className="text-sm text-slate-700" style={{ fontWeight: 700 }}>Avance del frente</p>
              <p className="text-sm text-slate-950" style={{ fontWeight: 700 }}>{front.progressPercent}%</p>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span>Base: {normalizePortfolioText(front.baseline)}</span>
              <span>Actual: {normalizePortfolioText(front.currentValue)}</span>
              <span>Meta: {normalizePortfolioText(front.target)}</span>
            </div>
            <div className="mt-2">
              <ProgressBar value={front.progressPercent} size="md" color={progressColor} showLabel={false} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <CompactMetricChip label="Retos" value={`${front.challengesCount}`} />
          <CompactMetricChip label="Iniciativas" value={`${front.initiativesCount}`} />
          <CompactMetricChip label="Bloqueos" value={`${front.blockersCount}`} tone={front.blockersCount > 0 ? 'rose' : 'slate'} />
          <CompactMetricChip label="Decisiones" value={`${front.pendingDecisionsCount}`} tone={front.pendingDecisionsCount > 0 ? 'violet' : 'slate'} />
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/85 p-4">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>Siguiente accion recomendada</p>
          <p className="mt-2 text-sm text-slate-900" style={{ fontWeight: 700 }}>
            {normalizePortfolioText(front.nextActionLabel)}
          </p>
          <p className="mt-1 text-sm text-slate-600">{normalizePortfolioText(front.nextActionDescription)}</p>
        </div>

        {showChallengeDetails ? (
        <div>
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>Retos asociados</p>
          <div className="mt-3 space-y-2">
            {front.challenges.length > 0 ? front.challenges.map(challenge => (
              <ChallengeMiniCard key={challenge.id} challenge={challenge} onNavigate={onNavigate} />
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-4">
                <p className="text-sm text-slate-700" style={{ fontWeight: 700 }}>Este frente aun no tiene retos definidos.</p>
                <p className="mt-1 text-xs text-slate-500">Siguiente paso: crear el primer reto.</p>
                <button
                  type="button"
                  onClick={() => onNavigate(front.createChallengePath)}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition-colors hover:bg-slate-50"
                  style={{ fontWeight: 700 }}
                >
                  Crear primer reto
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>

          {front.hiddenChallengesCount > 0 ? (
            <button
              type="button"
              onClick={() => onNavigate(front.createChallengePath)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition-colors hover:bg-slate-50"
              style={{ fontWeight: 700 }}
            >
              Ver +{front.hiddenChallengesCount} retos
              <ArrowRight size={13} />
            </button>
          ) : null}
        </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/85 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>Retos asociados</p>
              <p className="mt-1 text-sm text-slate-800" style={{ fontWeight: 700 }}>{challengeSummary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition-colors hover:bg-slate-50"
                style={{ fontWeight: 700 }}
              >
                Ver retos
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => onNavigate(front.createChallengePath)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition-colors hover:bg-slate-50"
                style={{ fontWeight: 700 }}
              >
                Ver detalle
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
        <div className={`grid gap-2 sm:grid-cols-2 ${showChallengeDetails ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
          {actionButtons.map(action => (
            <FrontActionButton key={action.label} label={action.label} path={action.path} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </article>
  );
}

export function CompactStrategicFrontCard({
  front,
  onNavigate,
  onExpand,
}: {
  front: StrategicObjectiveFrontCard;
  onNavigate: (path: string) => void;
  onExpand: () => void;
}) {
  return (
    <article className={`rounded-[20px] border px-4 py-3 shadow-sm ${frontToneClasses[front.statusTone]}`}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(180px,0.65fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${stateBadgeClasses(front.statusTone)}`}>
              {normalizePortfolioText(getExecutiveFrontStatusLabel(front))}
            </span>
            <h3 className="truncate text-base text-slate-950" style={{ fontWeight: 800 }}>
              {normalizePortfolioText(front.name)}
            </h3>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
            <span>KPI: {normalizePortfolioText(front.mainKpi)}</span>
            <span>{normalizePortfolioText(front.currentValue)} a meta {normalizePortfolioText(front.target)}</span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            {front.challengesCount} reto{front.challengesCount === 1 ? '' : 's'} · {front.initiativesCount} iniciativa{front.initiativesCount === 1 ? '' : 's'} · {getFrontAttentionSummary(front)}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">Avance</span>
            <span className="text-lg text-slate-950" style={{ fontWeight: 800 }}>{front.progressPercent}%</span>
          </div>
          <ProgressBar value={front.progressPercent} size="sm" color={getFrontProgressColor(front)} showLabel={false} />
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {front.alerts.length > 0 ? (
            <button
              type="button"
              onClick={onExpand}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 transition-colors hover:bg-amber-100"
              style={{ fontWeight: 800 }}
            >
              Revisar alertas
              <ArrowRight size={13} />
            </button>
          ) : null}
          {front.challengesCount === 0 || front.healthStatus === 'definition' ? (
            <button
              type="button"
              onClick={() => onNavigate(front.createChallengePath)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition-colors hover:bg-slate-50"
              style={{ fontWeight: 800 }}
            >
              Crear reto
              <ArrowRight size={13} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onNavigate(front.primaryActionPath || front.viewPath)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition-colors hover:bg-slate-50"
            style={{ fontWeight: 800 }}
          >
            {normalizePortfolioText(front.primaryActionLabel || 'Ver frente')}
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ExpandedStrategicFrontCard({
  front,
  onNavigate,
  onCollapse,
}: {
  front: StrategicObjectiveFrontCard;
  onNavigate: (path: string) => void;
  onCollapse: () => void;
}) {
  const alerts = front.alerts.length > 0 ? front.alerts : [{
    id: 'no-alerts',
    label: 'Sin alertas criticas',
    actionLabel: 'Ver frente',
    actionPath: front.viewPath,
    tone: 'slate' as const,
  }];

  return (
    <article className={`rounded-[22px] border p-4 shadow-sm md:p-5 ${frontToneClasses[front.statusTone]}`}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_220px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg text-slate-950 md:text-xl" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              {normalizePortfolioText(front.name)}
            </h3>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${stateBadgeClasses(front.statusTone)}`}>
              {normalizePortfolioText(getExecutiveFrontStatusLabel(front))}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            KPI: {normalizePortfolioText(front.mainKpi)} · {normalizePortfolioText(front.currentValue)} a meta {normalizePortfolioText(front.target)}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">Avance</span>
            <span className="text-xl text-slate-950" style={{ fontWeight: 800 }}>{front.progressPercent}%</span>
          </div>
          <ProgressBar value={front.progressPercent} size="md" color={getFrontProgressColor(front)} showLabel={false} />
        </div>
      </div>

      <p className="mt-3 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-sm text-slate-700">
        {front.challengesCount} retos · {front.initiativesCount} iniciativas · {front.blockersCount} bloqueo{front.blockersCount === 1 ? '' : 's'} · {front.pendingDecisionsCount} decision{front.pendingDecisionsCount === 1 ? '' : 'es'}
      </p>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
        <div>
          <p className="text-xs text-slate-500" style={{ fontWeight: 800 }}>Atencion</p>
          <div className="mt-2 space-y-2">
            {alerts.slice(0, 2).map(alert => (
              <button
                key={alert.id}
                type="button"
                onClick={() => onNavigate(alert.actionPath)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-white"
              >
                <span className="line-clamp-1">{normalizePortfolioText(alert.label)}</span>
                <span className="shrink-0 text-slate-950" style={{ fontWeight: 800 }}>{alert.actionLabel}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500" style={{ fontWeight: 800 }}>Retos</p>
          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
            {front.challenges.length > 0 ? front.challenges.map(challenge => (
              <ChallengeDashboardRow key={challenge.id} challenge={challenge} onNavigate={onNavigate} />
            )) : (
              <button
                type="button"
                onClick={() => onNavigate(front.createChallengePath)}
                className="flex w-full items-center justify-between px-3 py-3 text-left text-sm text-slate-700"
              >
                <span>Sin retos definidos</span>
                <span style={{ fontWeight: 800 }}>Crear reto</span>
              </button>
            )}
          </div>
          {front.hiddenChallengesCount > 0 ? (
            <button
              type="button"
              onClick={() => onNavigate(front.createChallengePath)}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition-colors hover:bg-slate-50"
              style={{ fontWeight: 800 }}
            >
              Ver +{front.hiddenChallengesCount} retos
              <ArrowRight size={13} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FrontActionButton label="Ver frente" path={front.viewPath} onNavigate={onNavigate} />
        <FrontActionButton label="Crear reto" path={front.createChallengePath} onNavigate={onNavigate} />
        {front.healthStatus === 'requires_attention' || front.healthStatus === 'pending_decision' ? (
          <FrontActionButton label="Importar iniciativas" path={front.importPath} onNavigate={onNavigate} />
        ) : null}
        <button
          type="button"
          onClick={onCollapse}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          style={{ fontWeight: 700 }}
        >
          Compactar
        </button>
      </div>
    </article>
  );
}

export function ChallengeDashboardRow({
  challenge,
  onNavigate,
}: {
  challenge: StrategicObjectiveChallengeRow;
  onNavigate: (path: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(challenge.actionPath)}
      className="grid w-full gap-2 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 md:grid-cols-[minmax(0,1fr)_120px_120px_auto] md:items-center"
    >
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-950" style={{ fontWeight: 800 }}>{normalizePortfolioText(challenge.name)}</p>
        <p className="mt-0.5 text-xs text-slate-500">{normalizePortfolioText(resolveChallengeCompactStatus(challenge))}</p>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500">Avance</span>
          <span className="text-slate-900" style={{ fontWeight: 800 }}>{challenge.progressPercent}%</span>
        </div>
        <ProgressBar value={challenge.progressPercent} size="sm" color="auto" showLabel={false} />
      </div>
      <span className="text-xs text-slate-600">{getChallengeAlertSummary(challenge)}</span>
      <span className="text-xs text-slate-950 md:text-right" style={{ fontWeight: 800 }}>{getChallengeCtaLabel(challenge)}</span>
    </button>
  );
}

export function ChallengeMiniCard({
  challenge,
  onNavigate,
}: {
  challenge: StrategicObjectiveChallengeRow;
  onNavigate: (path: string) => void;
}) {
  const severity = challengeSeverityClasses[challenge.severity];
  const progressColor = challenge.severity === 'critical'
    ? 'red'
    : challenge.severity === 'attention'
      ? 'amber'
      : challenge.severity === 'healthy'
        ? 'emerald'
        : 'auto';

  return (
    <button
      type="button"
      onClick={() => onNavigate(challenge.actionPath)}
      className={`w-full rounded-2xl border p-4 text-left transition-colors hover:bg-white ${severity.card}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-950" style={{ fontWeight: 700 }}>{normalizePortfolioText(challenge.name)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <DecisionBadge tone="slate">{normalizePortfolioText(challenge.statusLabel)}</DecisionBadge>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${severity.badge}`}>
              {normalizePortfolioText(challenge.attentionLabel)}
            </span>
          </div>
        </div>
        <div className="w-full md:w-36">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">Avance</span>
            <span className="text-xs text-slate-900" style={{ fontWeight: 700 }}>{challenge.progressPercent}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={challenge.progressPercent} size="sm" color={progressColor} showLabel={false} />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <ChallengeMetric label="Iniciativas" value={`${challenge.initiativesCount}`} />
        <ChallengeMetric label="Equipo" value={`${challenge.peopleCount} persona${challenge.peopleCount === 1 ? '' : 's'}`} />
        <ChallengeMetric label="Responsable" value={normalizePortfolioText(challenge.ownerLabel)} />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <p className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700">
          {normalizePortfolioText(challenge.coverageLabel)}
        </p>
        <p className={`rounded-xl border px-3 py-2 text-xs ${severity.action}`}>
          Siguiente: {normalizePortfolioText(challenge.nextActionLabel)}
        </p>
      </div>

      {(challenge.blockerLabel || challenge.pendingDecisionLabel) ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {challenge.blockerLabel ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              Bloqueo: {normalizePortfolioText(challenge.blockerLabel)}
            </p>
          ) : null}
          {challenge.pendingDecisionLabel ? (
            <p className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800">
              Decision pendiente: {normalizePortfolioText(challenge.pendingDecisionLabel)}
            </p>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

export const StrategicFrontStatusCard = StrategicFrontExecutiveCard;
export const ChallengeMiniRow = ChallengeMiniCard;

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

        <div className="grid gap-3 sm:grid-cols-3">
          <FrontStat label="Retos" value={`${front.challengesCount}`} />
          <FrontStat label="Iniciativas" value={`${front.initiativesCount}`} />
          <FrontStat label="Bloqueos" value={`${front.blockedInitiativesCount ?? 0}`} />
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

function ExecutiveInfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-20 items-start gap-3 rounded-2xl border border-white/60 bg-white/80 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-900" style={{ fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  );
}

function ExecutiveMetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-2 text-lg text-slate-950" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
        {normalizePortfolioText(value)}
      </p>
    </div>
  );
}

function CompactMetricChip({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: string;
  tone?: 'slate' | 'rose' | 'violet';
}) {
  const toneClass = tone === 'rose'
    ? 'border-rose-200 bg-rose-50 text-rose-800'
    : tone === 'violet'
      ? 'border-violet-200 bg-violet-50 text-violet-800'
      : 'border-slate-200 bg-white text-slate-700';

  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
      <p className="text-[11px]" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-1 text-base" style={{ fontWeight: 800 }}>{value}</p>
    </div>
  );
}

function ChallengeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2">
      <p className="text-[11px] text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-1 truncate text-xs text-slate-800" style={{ fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function MetricValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</p>
      <p className="mt-1 text-sm text-slate-950" style={{ fontWeight: 700 }}>{normalizePortfolioText(value)}</p>
    </div>
  );
}

function FrontActionButton({
  label,
  path,
  onNavigate,
}: {
  label: string;
  path: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(path)}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors hover:bg-slate-50"
      style={{ fontWeight: 700 }}
    >
      {label}
      <ArrowRight size={14} />
    </button>
  );
}

function QueueMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-slate-500">{label}: </span>
      <span className="text-slate-800" style={{ fontWeight: 700 }}>{normalizePortfolioText(value)}</span>
    </div>
  );
}

function formatAlertType(type: PortfolioAttentionQueueItem['alertType']) {
  const labels = {
    bloqueo: 'Bloqueo',
    decision: 'Decisión',
    baja_cobertura: 'Baja cobertura',
    sin_owner: 'Sin owner',
    falta_evidencia: 'Falta evidencia',
    activacion: 'Activación',
  };
  return type ? labels[type] : 'Alerta';
}

function getExecutiveFrontStatusLabel(front: StrategicObjectiveFrontCard) {
  if (front.challengesCount === 0) return 'Sin retos';
  if (front.statusTone === 'rose') return 'Requiere atención';
  if (front.statusTone === 'violet') return 'Pendiente de decisión';
  if (/cerrado/i.test(normalizePortfolioText(front.statusLabel))) return 'Cerrado';
  if (front.statusTone === 'amber') return 'Requiere atención';
  if (front.statusTone === 'emerald') return 'En seguimiento';
  return normalizePortfolioText(front.statusLabel);
}

function getFrontProgressColor(front: StrategicObjectiveFrontCard): 'indigo' | 'emerald' | 'amber' | 'red' | 'auto' {
  if (front.statusTone === 'rose') return 'red';
  if (front.statusTone === 'amber') return 'amber';
  if (front.statusTone === 'emerald') return 'emerald';
  if (front.statusTone === 'violet') return 'indigo';
  return 'auto';
}

function getFrontAttentionSummary(front: StrategicObjectiveFrontCard) {
  const parts: string[] = [];
  if (front.blockersCount > 0) parts.push(`${front.blockersCount} bloqueo${front.blockersCount === 1 ? '' : 's'}`);
  if (front.pendingDecisionsCount > 0) parts.push(`${front.pendingDecisionsCount} decision${front.pendingDecisionsCount === 1 ? '' : 'es'}`);
  if (front.alerts.some(alert => /cobertura/i.test(alert.label))) parts.push('sin cobertura');
  if (parts.length === 0) return 'sin alertas';
  return parts.join(' · ');
}

function getChallengeAlertSummary(challenge: StrategicObjectiveChallengeRow) {
  if (challenge.blockerLabel) return '1 bloqueo';
  if (challenge.pendingDecisionLabel) return '1 decision';
  if (/sin cobertura/i.test(challenge.coverageLabel)) return 'sin cobertura';
  if (challenge.severity === 'attention') return 'requiere atencion';
  return 'sin alertas';
}

function getChallengeCtaLabel(challenge: StrategicObjectiveChallengeRow) {
  if (challenge.blockerLabel) return 'Revisar';
  if (challenge.pendingDecisionLabel) return 'Revisar';
  if (challenge.nextActionLabel === 'Activar reto') return 'Activar';
  return 'Ver reto';
}

function resolveChallengeCompactStatus(challenge: StrategicObjectiveChallengeRow) {
  if (/sin cobertura/i.test(challenge.coverageLabel)) return 'Sin cobertura';
  return challenge.statusLabel;
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



