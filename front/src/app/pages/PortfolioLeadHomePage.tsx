import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import {
  getAttentionQueue,
  getHomeCommandCenterModel,
  getPortfolioHomeExperienceModel,
  PortfolioSummaryCards,
  usePortfolioLead,
} from '../../features/portfolio-lead';
import { PortfolioLeadBreadcrumbs } from '../components/portfolio/PortfolioLeadPageElements';
import {
  PendingDecisionsSection,
  PortfolioAttentionQueueSection,
  PortfolioPrimaryActionRail,
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

  const commandCenter = useMemo(() => getHomeCommandCenterModel(portfolioState), [portfolioState]);
  const attentionQueue = useMemo(() => getAttentionQueue(portfolioState), [portfolioState]);

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PortfolioLeadBreadcrumbs items={[{ label: 'Portfolio Lead', path: '/portfolio/inicio' }, { label: 'Inicio' }]} />

      <PortfolioWelcomeBanner
        title={model.banner.title}
        subtitle={model.banner.subtitle}
        actions={model.banner.actions}
        onNavigate={path => navigate(path)}
      />

      <PortfolioPrimaryActionRail summary={commandCenter.summary} onNavigate={path => navigate(path)} />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-7">
        <div className="max-w-3xl">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>SNAPSHOT EJECUTIVO</p>
          <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Lo más importante del portafolio en una sola lectura.</h2>
          <p className="mt-2 text-sm text-slate-600">
            Frentes, retos, iniciativas, bloqueos y decisiones que marcan el ritmo.
          </p>
        </div>

        <PortfolioSummaryCards items={model.summaryCards} />
      </section>

      <PortfolioAttentionQueueSection items={attentionQueue} onNavigate={path => navigate(path)} />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-7">
        <div className="max-w-3xl">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>FRENTES ESTRATÉGICOS</p>
          <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Cada frente muestra avance, cobertura, bloqueos y siguiente acción.</h2>
          <p className="mt-2 text-sm text-slate-600">
            Aquí se ve qué frente existe, cómo se encuentra y qué falta por abordar.
          </p>
        </div>

        {strategicFronts.length === 0 ? (
          <div className="mt-5">
            <PortfolioLeadEmptyState
              eyebrow="Portafolio en arranque"
              title="Todavía no hay frentes estratégicos"
              description="Crea el primer frente para ordenar prioridades y abrir la secuencia de trabajo."
              steps={['Crear frente', 'Crear reto', 'Activar', 'Recibir iniciativas', 'Decidir']}
              primaryAction={{ label: 'Crear primer frente estratégico', onClick: () => navigate('/portfolio/frentes-estrategicos') }}
              secondaryAction={{
                label: 'Importar iniciativas existentes',
                disabled: true,
                helper: 'Siguiente fase. Sube Excel, texto o documentos para clasificarlos por frente y reto.',
              }}
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

      <PendingDecisionsSection items={model.pendingDecisions} onNavigate={path => navigate(path)} />

      <RecentActivitySection items={model.recentActivity} />
    </div>
  );
}
