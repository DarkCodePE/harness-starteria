import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  getHomeCommandCenterModel,
  getPortfolioHomeExperienceModel,
  PortfolioSummaryCards,
  usePortfolioLead,
} from '../../features/portfolio-lead';
import { PortfolioLeadBreadcrumbs } from '../components/portfolio/PortfolioLeadPageElements';
import {
  PortfolioPrimaryActionRail,
  PortfolioWelcomeBanner,
  RecentActivitySection,
  StrategicObjectivesOverview,
} from '../components/portfolio/PortfolioLeadHomeExperience';

export function PortfolioLeadHomePage() {
  const navigate = useNavigate();
  const portfolioState = usePortfolioLead();

  const firstName = 'Ana';

  const model = useMemo(
    () => getPortfolioHomeExperienceModel(portfolioState, firstName),
    [portfolioState],
  );

  const commandCenter = useMemo(() => getHomeCommandCenterModel(portfolioState), [portfolioState]);

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

      <StrategicObjectivesOverview overview={model.strategicOverview} onNavigate={path => navigate(path)} />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-7">
        <div className="max-w-3xl">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>SNAPSHOT EJECUTIVO</p>
          <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Resumen secundario del portafolio.</h2>
          <p className="mt-2 text-sm text-slate-600">
            Indicadores agregados para complementar la lectura por frente estratégico.
          </p>
        </div>

        <PortfolioSummaryCards items={model.summaryCards} />
      </section>

      <RecentActivitySection items={model.recentActivity} />
    </div>
  );
}
