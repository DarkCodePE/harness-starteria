import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import {
  getPortfolioHomeExperienceModel,
  getPortfolioSummary,
  type PortfolioHomeSummaryCard,
  PortfolioSummaryCards,
  usePortfolioLead,
} from '../../features/portfolio-lead';
import { PortfolioLeadBreadcrumbs } from '../components/portfolio/PortfolioLeadPageElements';
import {
  ImportantChangesSection,
  PendingDecisionsSection,
  PortfolioWelcomeBanner,
  RecentActivitySection,
  StrategicFrontOverviewCard,
} from '../components/portfolio/PortfolioLeadHomeExperience';
import { PortfolioLeadEmptyState } from '../../features/portfolio-lead/components/states/PortfolioLeadEmptyState';

export function PortfolioLeadHomePage() {
  const navigate = useNavigate();
  const { user } = useApp();
  const portfolioState = usePortfolioLead();

  const firstName = useMemo(() => {
    const fromUser = user?.name?.trim().split(/\s+/)[0];
    return fromUser || 'Valeria';
  }, [user?.name]);

  const model = useMemo(
    () => getPortfolioHomeExperienceModel(portfolioState, firstName),
    [firstName, portfolioState],
  );

  const portfolioSummary = useMemo(() => getPortfolioSummary(portfolioState), [portfolioState]);

  const summaryCards = useMemo<PortfolioHomeSummaryCard[]>(
    () => [
      {
        id: 'frentes-estrategicos',
        label: 'Frentes estratégicos',
        value: `${portfolioSummary.fronts}`,
        microcopy: 'Frentes creados en el portafolio.',
        tone: portfolioSummary.fronts > 0 ? 'emerald' : 'slate',
        icon: 'fronts',
      },
      {
        id: 'retos',
        label: 'Retos',
        value: `${portfolioSummary.challenges}`,
        microcopy: 'Retos registrados en total.',
        tone: portfolioSummary.challenges > 0 ? 'sky' : 'slate',
        icon: 'challenges',
      },
      {
        id: 'iniciativas',
        label: 'Iniciativas',
        value: `${portfolioSummary.initiatives}`,
        microcopy: 'Iniciativas activas o registradas.',
        tone: portfolioSummary.initiatives > 0 ? 'amber' : 'slate',
        icon: 'blockers',
      },
      {
        id: 'decisiones',
        label: 'Decisiones',
        value: `${portfolioSummary.pendingDecisions}`,
        microcopy: 'Decisiones pendientes o registradas.',
        tone: portfolioSummary.pendingDecisions > 0 ? 'violet' : 'slate',
        icon: 'decisions',
      },
    ],
    [portfolioSummary],
  );

  const strategicFronts = useMemo(
    () =>
      model.strategicFronts.map(front => {
        const sourceFront = portfolioState.strategicFronts.find(item => item.id === front.id);
        return {
          ...front,
          objective: sourceFront?.strategicObjective || front.nextActionDescription,
          stateReadout: front.detail,
        };
      }),
    [model.strategicFronts, portfolioState.strategicFronts],
  );

  const importantChanges = useMemo(
    () =>
      model.importantChanges.map(item => ({
        ...item,
        impactLabel:
          item.impactLabel
          || (item.tone === 'rose' ? 'Impacto alto'
            : item.tone === 'amber' || item.tone === 'violet' || item.tone === 'sky'
              ? 'Impacto medio'
              : 'Impacto bajo'),
      })),
    [model.importantChanges],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PortfolioLeadBreadcrumbs items={[{ label: 'Portfolio Lead', path: '/portfolio/inicio' }, { label: 'Inicio' }]} />

      <PortfolioWelcomeBanner
        title={model.banner.title}
        subtitle={model.banner.subtitle}
        actions={model.banner.actions}
        onNavigate={path => navigate(path)}
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-7">
        <div className="max-w-3xl">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>RESUMEN EJECUTIVO COMPACTO</p>
          <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Vista general del estado actual de las secciones principales del dashboard.</h2>
          <p className="mt-2 text-sm text-slate-600">
            Un vistazo rápido para entender el tamaño actual del portafolio.
          </p>
        </div>

        <PortfolioSummaryCards items={summaryCards} />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-7">
        <div className="max-w-3xl">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>TUS FRENTES ESTRATÉGICOS</p>
          <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Cada frente muestra avance, cobertura, bloqueos y próxima acción recomendada.</h2>
          <p className="mt-2 text-sm text-slate-600">
            Aquí se lee qué frente existe, cómo se encuentra y qué falta por abordar.
          </p>
        </div>

        {strategicFronts.length === 0 ? (
          <div className="mt-5">
            <PortfolioLeadEmptyState
              title="Todavía no hay frentes activos"
              description="Empieza creando un frente estratégico para ordenar las prioridades del portafolio."
              primaryAction={{ label: 'Crear nuevo frente', onClick: () => navigate('/portfolio/frentes-estrategicos') }}
              secondaryAction={{ label: 'Revisar decisiones', onClick: () => navigate('/portfolio/decisiones') }}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {strategicFronts.map(front => (
              <StrategicFrontOverviewCard
                key={front.id}
                front={front}
                onNavigate={path => navigate(path)}
              />
            ))}
          </div>
        )}
      </section>

      <ImportantChangesSection items={importantChanges} onNavigate={path => navigate(path)} />

      <PendingDecisionsSection items={model.pendingDecisions} onNavigate={path => navigate(path)} />

      <RecentActivitySection items={model.recentActivity} />
    </div>
  );
}
