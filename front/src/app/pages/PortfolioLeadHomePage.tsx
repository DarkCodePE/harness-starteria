import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
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
import { PortfolioCopilotDrawer, PortfolioCopilotLauncher } from '../../features/copilot';
import { isPortfolioCopilotEnabled } from '../services/featureFlags';
import { PortfolioBootstrapHome, usePortfolioBootstrap } from '../../features/portfolio-lead/bootstrap';

export function PortfolioLeadHomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const portfolioState = usePortfolioLead();
  const [copilotOpen, setCopilotOpen] = useState(false);

  const entryContinuationId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('portfolioEntryContinuationId');
  }, [location.search]);
  const bootstrap = usePortfolioBootstrap(entryContinuationId);

  const firstName = 'Ana';

  const model = useMemo(
    () => getPortfolioHomeExperienceModel(portfolioState, firstName),
    [portfolioState],
  );

  const commandCenter = useMemo(() => getHomeCommandCenterModel(portfolioState), [portfolioState]);

  const showPortfolioCopilot = isPortfolioCopilotEnabled();

  if (entryContinuationId) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        <PortfolioLeadBreadcrumbs items={[{ label: 'Portfolio Lead', path: '/portfolio/inicio' }, { label: 'Inicio' }]} />
        <PortfolioBootstrapHome
          data={bootstrap.data}
          status={bootstrap.status}
          error={bootstrap.error}
          onRetry={bootstrap.retry}
          onUpdateAnchor={bootstrap.updateAnchor}
          onConfirmAnchor={bootstrap.confirmAnchor}
          onPasteWorkItems={bootstrap.pasteWorkItems}
          onUploadImportFile={bootstrap.uploadImportFile}
          onCommitImportBatch={bootstrap.commitImportBatch}
          onAddManualWorkItem={bootstrap.addManualWorkItem}
          onDeclareNoExistingWork={bootstrap.declareNoExistingWork}
          onUpdateWorkItem={bootstrap.updateWorkItem}
          onRemoveWorkItem={bootstrap.removeWorkItem}
          onAnalyzeWorkItems={bootstrap.analyzeWorkItems}
          onConfirmProposedMutation={bootstrap.confirmProposedMutation}
          onCorrectProposedMutation={bootstrap.correctProposedMutation}
          onRejectProposedMutation={bootstrap.rejectProposedMutation}
          onLeaveProposedMutationPending={bootstrap.leaveProposedMutationPending}
          onPublishFirstReading={bootstrap.publishFirstReading}
          analysisStatus={bootstrap.analysisStatus}
          analysisError={bootstrap.analysisError}
          publishStatus={bootstrap.publishStatus}
          publishError={bootstrap.publishError}
          importStatus={bootstrap.importStatus}
          importError={bootstrap.importError}
          activeImport={bootstrap.activeImport}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PortfolioLeadBreadcrumbs items={[{ label: 'Portfolio Lead', path: '/portfolio/inicio' }, { label: 'Inicio' }]} />

      <PortfolioWelcomeBanner
        title={model.banner.title}
        subtitle={model.banner.subtitle}
        actions={model.banner.actions}
        onNavigate={path => navigate(path)}
      />

      {showPortfolioCopilot && (
        <div className="flex justify-end">
          <PortfolioCopilotLauncher onClick={() => setCopilotOpen(true)} />
          {copilotOpen && (
            <PortfolioCopilotDrawer
              open={copilotOpen}
              onOpenChange={setCopilotOpen}
              onPortfolioRefresh={portfolioState.refreshPortfolioData}
            />
          )}
        </div>
      )}

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
