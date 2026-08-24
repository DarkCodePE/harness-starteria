import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectHomePage } from '../ProjectHomePage';
import { Step0Page } from '../Step0Page';
import { Step3Page } from '../Step3Page';

const navigate = vi.fn();
vi.mock('react-router', () => ({
  useParams: () => ({ projectId: 'p1' }),
  useNavigate: () => navigate,
}));

const getAdaptiveCore = vi.fn();
const confirmStep2Output = vi.fn();
const confirmStep3Output = vi.fn();
const confirmStep4Output = vi.fn();
vi.mock('../../../features/adaptive-core/services/adaptiveCoreService', () => ({
  getAdaptiveCore: (id: string) => getAdaptiveCore(id),
  confirmAdaptiveCheckpoint: vi.fn(),
  confirmStep0Brief: vi.fn(),
  confirmStep2Output: (...args: any[]) => confirmStep2Output(...args),
  confirmStep3Output: (...args: any[]) => confirmStep3Output(...args),
  confirmStep4Output: (...args: any[]) => confirmStep4Output(...args),
}));

vi.mock('../../../features/adaptive-core/components', () => ({
  AdaptiveCheckpointWorkspace: ({ checkpoint, onConfirmCheckpoint }: any) => (
    <div data-testid="adaptive-workspace">
      <span>{checkpoint?.checkpointKey ?? checkpoint?.code}</span>
      <button type="button" onClick={() => onConfirmCheckpoint?.({})}>Confirmar checkpoint</button>
    </div>
  ),
  CriticalChangeReview: () => null,
}));

vi.mock('../../components/autofill/AutofillField', () => ({
  AutofillField: ({ children, value, onChange }: any) => children({ value, onChange, readOnly: false }),
}));

vi.mock('../../hooks/useAutosave', () => ({
  useAutosave: () => ({ status: 'idle', lastSavedAt: null, error: null }),
}));

vi.mock('../../hooks/usePdfAutofill', () => ({
  usePdfAutofill: () => ({ state: 'idle', files: [], upload: vi.fn(), reset: vi.fn() }),
}));

vi.mock('../../hooks/useStepData', () => ({
  useStepData: () => ({ data: null, isLoading: false, error: null }),
}));

vi.mock('../../services/stepService', () => ({
  getStepData: vi.fn().mockResolvedValue(null),
  saveStepData: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../services/featureFlags', () => ({
  isPdfAutofillEnabled: () => false,
}));

vi.mock('../../services/projectService', () => ({
  getById: vi.fn(),
}));

vi.mock('../../step0/step0Config', async () => {
  const actual = await vi.importActual<any>('../../step0/step0Config');
  return {
    ...actual,
    hasStep0Prefill: () => false,
    getStep0Prefill: () => null,
  };
});

const appState = {
  projects: [] as any[],
  projectsLoading: false,
  setCurrentProject: vi.fn(),
  updateProject: vi.fn(),
  updateStep0: vi.fn(),
  hydrateProjectStep0FromPrefill: vi.fn(),
  getProjectMember: vi.fn(() => null),
  canAccessProject: vi.fn(() => true),
  markSponsorInvitationSent: vi.fn(),
  acceptSponsorInvitation: vi.fn(),
  updateSponsorTouchpoint: vi.fn(),
  addSponsorComment: vi.fn(),
  user: { name: 'Ana', email: 'ana@example.com', role: 'owner' },
};

vi.mock('../../context/AppContext', () => ({
  useApp: () => appState,
  createTeamMember: (email: string) => ({ id: email, email, name: email, role: 'Sponsor', status: 'Pendiente', initials: 'SP' }),
}));

vi.mock('../../portfolio/PortfolioLeadContext', () => ({
  usePortfolioLead: () => ({ challenges: [], strategicFronts: [] }),
}));

const project = {
  id: 'p1',
  name: 'Iniciativa backend authority',
  description: 'No debe usar fallback local.',
  status: 'Draft',
  currentStep: 1,
  step0Status: 'En progreso',
  step0Data: {
    initiativeTitle: 'Iniciativa backend authority',
    initiativeFrame: 'exploracion',
    primaryObjective: 'aprendizaje',
    quePasaQueQuieres: 'Validar problema',
    impactWho: 'Equipo',
    currentEvidence: 'Entrevistas',
    decisionRequested: 'Seguir',
  },
  steps: [
    { id: 's1', number: 1, name: 'Step 1 legacy', status: 'Bloqueado', progress: 0, modules: [] },
    { id: 's2', number: 2, name: 'Step 2 legacy', status: 'Bloqueado', progress: 0, modules: [] },
    { id: 's3', number: 3, name: 'Step 3 legacy', status: 'Bloqueado', progress: 0, modules: [] },
    { id: 's4', number: 4, name: 'Step 4 legacy', status: 'Bloqueado', progress: 0, modules: [] },
  ],
  team: [],
  evidence: [],
  createdAt: '2026-08-04T00:00:00.000Z',
  lastModified: '2026-08-04T00:00:00.000Z',
};

const serverCore = {
  schemaVersion: 'PRD-03-v0.4',
  masterContext: {
    id: 'mc1',
    version: 1,
    routeType: 'server_route',
    depthLevel: 'standard',
    maturity: 'draft',
    knownFacts: [],
    assumptions: [],
    missingCriticalInformation: [],
    risks: [],
    decisions: [],
    contextSnapshots: [],
    createdAt: '2026-08-04T00:00:00.000Z',
  },
  activeStepConfigurationId: 'cfg-0',
  activeCheckpoint: {
    id: 'cp-server',
    step: 0,
    checkpointKey: 'CP-0.1',
    status: 'ready',
    sequence: 1,
    questions: [],
    configurationId: 'cfg-0',
  },
  progressSignal: {
    id: 'sig1',
    step: 0,
    checkpointCode: 'CP-0.1',
    checkpointTitle: 'Server checkpoint',
    health: 'healthy',
    hypothesis: '',
    evidence: '',
    evidenceStrength: 'weak',
    blocker: '',
    actorRequired: '',
    nextAction: 'Accion server.',
    upcomingDecision: '',
    updatedAt: '2026-08-04T00:00:00.000Z',
  },
  stepConfigurations: [
    {
      id: 'cfg-0',
      step: 0,
      version: 1,
      visibleName: 'Step 0 server',
      stablePurpose: 'Server',
      objective: 'Server objective',
      expectedOutput: 'Server output',
      routeType: 'server_route',
      depthLevel: 'standard',
      generatedAt: '2026-08-04T00:00:00.000Z',
      generatedBy: 'backend',
      closureCriteria: [],
      checkpoints: [
        { id: 'cp-server', step: 0, code: 'CP-0.1', title: 'Server checkpoint', purpose: 'Server only', status: 'ready', outputKey: 'Brief', completionCriteria: [], questions: [], gates: [] },
      ],
    },
  ],
  checkpointInstances: [],
  stepOutputs: [],
  auditEvents: [],
};

const serverCoreAtStep = (step: 0 | 1 | 2 | 3 | 4, checkpointKey = `CP-${step}.1`) => ({
  ...serverCore,
  activeStepConfigurationId: `cfg-${step}`,
  activeCheckpoint: {
    id: `cp-${step}`,
    step,
    checkpointKey,
    status: 'ready',
    sequence: 1,
    questions: [],
    configurationId: `cfg-${step}`,
  },
  progressSignal: {
    ...serverCore.progressSignal,
    step,
    checkpointCode: checkpointKey,
    checkpointTitle: `Checkpoint Step ${step}`,
    nextAction: `Continuar Step ${step} desde backend.`,
  },
  stepConfigurations: [0, 1, 2, 3, 4].map((item) => ({
    id: `cfg-${item}`,
    step: item,
    version: 1,
    visibleName: `Step ${item} server`,
    stablePurpose: `Server step ${item}`,
    objective: `Server objective ${item}`,
    expectedOutput: `Server output ${item}`,
    routeType: 'server_route',
    depthLevel: 'standard',
    generatedAt: '2026-08-04T00:00:00.000Z',
    generatedBy: 'backend',
    closureCriteria: [],
    checkpoints: [
      { id: `cp-${item}`, step: item, code: `CP-${item}.1`, title: `Checkpoint Step ${item}`, purpose: 'Server only', status: item === step ? 'ready' : item < step ? 'completed' : 'locked', outputKey: `Step ${item}`, completionCriteria: [], questions: [], gates: [] },
    ],
  })),
  stepOutputs: Array.from({ length: step }, (_, index) => ({
    id: `out-${index}`,
    step: index,
    status: 'confirmed',
    version: 1,
    output: {},
  })),
});

describe('Adaptive authority in pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigate.mockReset();
    appState.projects = [project];
    confirmStep2Output.mockReset();
    confirmStep3Output.mockReset();
    confirmStep4Output.mockReset();
  });

  it('ProjectHome blocks operational Adaptive journey when backend core fails', async () => {
    getAdaptiveCore.mockRejectedValueOnce(new Error('down'));

    render(<ProjectHomePage />);

    expect(await screen.findByText(/No pudimos cargar el estado adaptativo persistido/i)).toBeInTheDocument();
    expect(screen.queryByText(/Step activo:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CP-0\.1/i)).not.toBeInTheDocument();
  });

  it('ProjectHome retry promotes loaded server core to authoritative journey', async () => {
    getAdaptiveCore.mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(serverCore);

    render(<ProjectHomePage />);
    fireEvent.click(await screen.findByRole('button', { name: /Reintentar/i }));

    await waitFor(() => expect(screen.getByText(/Step activo: 0/i)).toBeInTheDocument());
    expect(screen.getAllByText(/Accion server/i).length).toBeGreaterThan(0);
  });

  it('Step0 blocks Adaptive confirmation workspace when backend core fails', async () => {
    getAdaptiveCore.mockRejectedValueOnce(new Error('down'));

    render(<Step0Page />);

    expect(await screen.findByText(/Estado adaptativo no disponible/i)).toBeInTheDocument();
    expect(screen.queryByTestId('adaptive-workspace')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Confirmar checkpoint/i })).not.toBeInTheDocument();
  });

  it('Step0 retry renders confirmation workspace only from server core', async () => {
    getAdaptiveCore.mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(serverCore);

    render(<Step0Page />);
    fireEvent.click(await screen.findByRole('button', { name: /Reintentar/i }));

    await waitFor(() => expect(screen.getByTestId('adaptive-workspace')).toBeInTheDocument());
    expect(screen.getAllByText('CP-0.1').length).toBeGreaterThan(0);
  });

  it('ProjectHome does not allow Step 2 access from legacy approval when server core is still Step 1', async () => {
    appState.projects = [{
      ...project,
      step0Status: 'Completado',
      currentStep: 2,
      steps: [
        { id: 's1', number: 1, name: 'Step 1 legacy', status: 'Aprobado', progress: 100, modules: [] },
        { id: 's2', number: 2, name: 'Step 2 legacy', status: 'En progreso', progress: 10, modules: [] },
        { id: 's3', number: 3, name: 'Step 3 legacy', status: 'Bloqueado', progress: 0, modules: [] },
        { id: 's4', number: 4, name: 'Step 4 legacy', status: 'Bloqueado', progress: 0, modules: [] },
      ],
    }];
    getAdaptiveCore.mockResolvedValueOnce(serverCoreAtStep(1, 'CP-1.3'));

    render(<ProjectHomePage />);

    await waitFor(() => expect(screen.getByText(/Step activo: 1/i)).toBeInTheDocument());
    fireEvent.click(screen.getAllByText(/Step 2: Step 2 server/i).at(-1)!);

    expect(navigate).not.toHaveBeenCalledWith('/projects/p1/step/2');
  });

  it('ProjectHome allows Step 2 access from server core even when legacy state is stale', async () => {
    appState.projects = [{
      ...project,
      step0Status: 'Completado',
      currentStep: 1,
      steps: [
        { id: 's1', number: 1, name: 'Step 1 legacy', status: 'Bloqueado', progress: 0, modules: [] },
        { id: 's2', number: 2, name: 'Step 2 legacy', status: 'Bloqueado', progress: 0, modules: [] },
        { id: 's3', number: 3, name: 'Step 3 legacy', status: 'Bloqueado', progress: 0, modules: [] },
        { id: 's4', number: 4, name: 'Step 4 legacy', status: 'Bloqueado', progress: 0, modules: [] },
      ],
    }];
    getAdaptiveCore.mockResolvedValueOnce(serverCoreAtStep(2, 'CP-2.1'));

    render(<ProjectHomePage />);

    await waitFor(() => expect(screen.getByText(/Step activo: 2/i)).toBeInTheDocument());
    fireEvent.click(screen.getAllByText(/Step 2: Step 2 server/i).at(-1)!);

    expect(navigate).toHaveBeenCalledWith('/projects/p1/step/2');
  });

  it('blocks direct Step 3 route when server core is still Step 2 even if legacy says Step 3 is available', async () => {
    appState.projects = [{
      ...project,
      step0Status: 'Completado',
      currentStep: 3,
      steps: [
        { id: 's1', number: 1, name: 'Step 1 legacy', status: 'Aprobado', progress: 100, modules: [] },
        { id: 's2', number: 2, name: 'Step 2 legacy', status: 'Aprobado', progress: 100, modules: [] },
        { id: 's3', number: 3, name: 'Step 3 legacy', status: 'En progreso', progress: 10, modules: [] },
        { id: 's4', number: 4, name: 'Step 4 legacy', status: 'Bloqueado', progress: 0, modules: [] },
      ],
    }];
    getAdaptiveCore.mockResolvedValueOnce(serverCoreAtStep(2, 'CP-2.3'));

    render(<Step3Page />);

    expect(await screen.findByText(/Step 3 bloqueado/i)).toBeInTheDocument();
    expect(screen.getByText(/El backend Adaptive Core todavia no habilita Step 3/i)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalledWith('/projects/p1/step/4');
  });
});
