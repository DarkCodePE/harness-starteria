import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import {
  buildChallengeActivationMessageDraft,
  buildDefaultActivationInputs,
  buildDecisionRecommendation,
  buildExecutiveOutput,
  buildSeededChallengeInitiatives,
  deriveChallengeActivationRecommendation,
  patchChallenge,
  syncChallengeSummaries,
} from '../domain/actions';
import {
  DEFAULT_CHALLENGES,
  DEFAULT_EXECUTIVE_OUTPUTS,
  DEFAULT_INITIATIVES,
  DEFAULT_INITIATIVE_OVERLAPS,
  DEFAULT_PORTFOLIO_DECISIONS,
  DEFAULT_STRATEGIC_FRONTS,
} from '../domain/mockData';
import {
  getDecisionsByInitiativeId,
  getExecutiveOutputByInitiativeId,
  getFrontById,
} from '../domain/selectors';
import type {
  Challenge,
  ChallengeActivationMode,
  CreateChallengeInput,
  CreateStrategicFrontInput,
  ExecutiveOutputStatus,
  InvitationStatus,
  PortfolioDecisionOutcome,
  PortfolioLeadContextValue,
  SquadRole,
  StakeholderStatus,
  StrategicFront,
  StrategicFrontStatus,
} from '../domain/types';

const PortfolioLeadContext = createContext<PortfolioLeadContextValue | null>(null);

export function PortfolioLeadProvider({ children }: { children: ReactNode }) {
  const [strategicFronts, setStrategicFronts] = useState(DEFAULT_STRATEGIC_FRONTS);
  const [challenges, setChallenges] = useState(DEFAULT_CHALLENGES);
  const [initiatives, setInitiatives] = useState(DEFAULT_INITIATIVES);
  const [initiativeOverlaps, setInitiativeOverlaps] = useState(DEFAULT_INITIATIVE_OVERLAPS);
  const [portfolioDecisions, setPortfolioDecisions] = useState(DEFAULT_PORTFOLIO_DECISIONS);
  const [executiveOutputs, setExecutiveOutputs] = useState(DEFAULT_EXECUTIVE_OUTPUTS);

  const value = useMemo<PortfolioLeadContextValue>(() => ({
    strategicFronts,
    challenges,
    initiatives,
    initiativeOverlaps,
    portfolioDecisions,
    executiveOutputs,
    createStrategicFront: input => {
      const front: StrategicFront = {
        id: `front-${Date.now()}`,
        ...input,
        createdAt: new Date().toISOString().split('T')[0],
        lastUpdatedAt: new Date().toISOString().split('T')[0],
        challengeCount: 0,
        initiativeCount: 0,
      };

      setStrategicFronts(prev => [front, ...prev]);
      return front;
    },
    updateStrategicFront: (frontId, input) => {
      setStrategicFronts(prev => prev.map(front => (
        front.id === frontId
          ? { ...front, ...input, lastUpdatedAt: new Date().toISOString().split('T')[0] }
          : front
      )));
    },
    updateStrategicFrontStatus: (frontId, status) => {
      setStrategicFronts(prev => prev.map(front => (
        front.id === frontId
          ? { ...front, status, lastUpdatedAt: new Date().toISOString().split('T')[0] }
          : front
      )));
    },
    createChallenge: input => {
      const challenge: Challenge = {
        id: `challenge-${Date.now()}`,
        ...input,
        createdAt: new Date().toISOString().split('T')[0],
        lastUpdatedAt: new Date().toISOString().split('T')[0],
        challengeOwnerStatus: input.challengeOwnerStatus ?? (input.status === 'draft' ? 'definido' : 'confirmado'),
        sponsorStatus: input.sponsorStatus ?? (input.sponsorName ? 'notificado' : 'definido'),
        openCallStatus: 'inactiva',
        selectedPeople: [],
        assignedSquad: [],
        initiativeCount: 0,
        coverageStatus: 'sin_cobertura',
        visibleToParticipants: false,
        publicationNotes: 'Todavia no esta visible para participantes.',
        activationInputs: {
          ...buildDefaultActivationInputs(input.sponsorStatus ?? 'definido'),
          ...input.activationInputs,
        },
        activationRecommendationNote: '',
        activationMessageDraft: '',
      };

      const front = getFrontById(strategicFronts, input.strategicFrontId);
      const recommendation = deriveChallengeActivationRecommendation(challenge, front);
      challenge.activationRecommendationNote = recommendation.justification;
      challenge.activationMessageDraft = buildChallengeActivationMessageDraft(challenge, recommendation, front);

      setChallenges(prev => [challenge, ...prev]);
      setStrategicFronts(prev =>
        prev.map(front =>
          front.id === input.strategicFrontId ? { ...front, challengeCount: front.challengeCount + 1 } : front,
        ),
      );
      return challenge;
    },
    updateChallenge: (challengeId, input) => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => ({
          ...challenge,
          ...input,
          lastUpdatedAt: new Date().toISOString().split('T')[0],
        })),
      );
    },
    updateChallengeActivationMode: (challengeId, mode) => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => ({
          ...challenge,
          activationMode: mode,
          status: mode === 'mantener_en_definicion'
            ? 'draft'
            : challenge.status === 'draft'
              ? 'listo_para_activar'
              : challenge.status,
          lastUpdatedAt: new Date().toISOString().split('T')[0],
        })),
      );
    },
    updateChallengeActivationInputs: (challengeId, input) => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => {
          const front = getFrontById(strategicFronts, challenge.strategicFrontId);
          const updated = {
            ...challenge,
            activationInputs: {
              ...challenge.activationInputs,
              ...input,
            },
          };
          const recommendation = deriveChallengeActivationRecommendation(updated, front);
          return {
            ...updated,
            activationRecommendationNote: challenge.activationRecommendationNote || recommendation.justification,
            activationMessageDraft: challenge.activationMessageDraft || buildChallengeActivationMessageDraft(updated, recommendation, front),
            lastUpdatedAt: new Date().toISOString().split('T')[0],
          };
        }),
      );
    },
    updateChallengeStakeholderStatus: (challengeId, stakeholder, status) => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => ({
          ...challenge,
          [stakeholder]: status,
          activationInputs: {
            ...challenge.activationInputs,
            sponsorStatus: stakeholder === 'sponsorStatus' ? status : challenge.activationInputs.sponsorStatus,
          },
          status: ['draft', 'listo_para_activar'].includes(challenge.status) ? 'listo_para_activar' : challenge.status,
        })),
      );
    },
    acceptChallengeActivationRecommendation: challengeId => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => {
          const front = getFrontById(strategicFronts, challenge.strategicFrontId);
          const recommendation = deriveChallengeActivationRecommendation(challenge, front);
          return {
            ...challenge,
            activationMode: recommendation.recommendedMode,
            activationRecommendationNote: recommendation.justification,
            activationMessageDraft: buildChallengeActivationMessageDraft(challenge, recommendation, front),
            status: challenge.status === 'draft' ? 'listo_para_activar' : challenge.status,
            lastUpdatedAt: new Date().toISOString().split('T')[0],
          };
        }),
      );
    },
    updateChallengeActivationRecommendationNote: (challengeId, note) => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => ({
          ...challenge,
          activationRecommendationNote: note,
          lastUpdatedAt: new Date().toISOString().split('T')[0],
        })),
      );
    },
    updateChallengeActivationMessageDraft: (challengeId, draft) => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => ({
          ...challenge,
          activationMessageDraft: draft,
          lastUpdatedAt: new Date().toISOString().split('T')[0],
        })),
      );
    },
    activateOpenCall: challengeId => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => ({
          ...challenge,
          openCallStatus: 'activa',
          status: 'activo_interno',
          publicationNotes: 'La convocatoria ya puede prepararse para publicacion.',
        })),
      );
    },
    addSelectedPerson: (challengeId, value) => {
      const normalized = value.trim();
      if (!normalized) return;

      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => ({
          ...challenge,
          selectedPeople: [
            ...challenge.selectedPeople,
            {
              id: `invite-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              value: normalized,
              status: 'pendiente',
            },
          ],
          status: 'activo_interno',
          publicationNotes: 'Ya hay personas objetivo, pero aun falta publicar la invitacion.',
        })),
      );
    },
    updateSelectedPersonStatus: (challengeId, invitationId, status) => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => ({
          ...challenge,
          selectedPeople: challenge.selectedPeople.map(person =>
            person.id === invitationId ? { ...person, status } : person,
          ),
          status: challenge.visibleToParticipants ? challenge.status : 'activo_interno',
        })),
      );
    },
    addSquadMember: (challengeId, value, role) => {
      const normalized = value.trim();
      if (!normalized) return;

      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => ({
          ...challenge,
          assignedSquad: [
            ...challenge.assignedSquad,
            {
              id: `squad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              value: normalized,
              role,
            },
          ],
          status: 'activo_interno',
          publicationNotes: 'El squad ya esta definido internamente.',
        })),
      );
    },
    updateSquadMemberRole: (challengeId, memberId, role) => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => ({
          ...challenge,
          assignedSquad: challenge.assignedSquad.map(member =>
            member.id === memberId ? { ...member, role } : member,
          ),
        })),
      );
    },
    confirmAssignedSquad: challengeId => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => ({
          ...challenge,
          status: challenge.assignedSquad.length > 0 ? 'activo_interno' : 'listo_para_activar',
          publicationNotes: challenge.assignedSquad.length > 0
            ? 'El reto ya quedo activado internamente con squad asignado.'
            : challenge.publicationNotes,
        })),
      );
    },
    activateChallenge: challengeId => {
      setChallenges(prev =>
        patchChallenge(prev, challengeId, challenge => {
          if (!challenge.challengeOwner.trim() || challenge.challengeOwnerStatus !== 'confirmado') {
            return {
              ...challenge,
              publicationNotes: 'Falta challenge owner confirmado para activar el reto.',
            };
          }

          const activationMode = challenge.activationMode;
          const isPublishedMode = activationMode === 'convocatoria_abierta' || activationMode === 'personas_seleccionadas' || activationMode === 'innovacion_abierta_partner_externo';

          return {
            ...challenge,
            visibleToParticipants: isPublishedMode,
            lastPublishedAt: isPublishedMode ? new Date().toISOString().split('T')[0] : challenge.lastPublishedAt,
            publicationNotes: challenge.sponsorStatus === 'confirmado'
              ? 'El reto ya quedo activado con sponsor confirmado.'
              : 'El reto se activo sin sponsor confirmado. Conviene monitorear riesgo de destrabe.',
            status: isPublishedMode ? 'recibiendo_iniciativas' : 'activo_interno',
          };
        }),
      );
    },
    publishChallenge: challengeId => {
      setChallenges(prev =>
        syncChallengeSummaries(
          patchChallenge(prev, challengeId, challenge => ({
            ...challenge,
            visibleToParticipants: true,
            publicationNotes:
              challenge.activationMode === 'convocatoria_abierta'
                ? 'Visible para participantes como reto abierto.'
                : challenge.activationMode === 'personas_seleccionadas'
                  ? 'Visible solo para participantes invitados.'
                  : 'Visible para el squad asignado como reto ya publicado.',
            lastPublishedAt: new Date().toISOString().split('T')[0],
            status: 'publicado',
          })),
          initiatives,
        ),
      );
    },
    loadChallengeCoverageDemo: challengeId => {
      const challenge = challenges.find(item => item.id === challengeId);
      if (!challenge) return;
      const front = getFrontById(strategicFronts, challenge.strategicFrontId);
      if (!front) return;
      const existing = initiatives.some(item => item.challengeId === challengeId);
      if (existing) return;

      const seeded = buildSeededChallengeInitiatives(challenge, front);
      const updatedInitiatives = [...seeded, ...initiatives];
      setInitiatives(updatedInitiatives);
      setPortfolioDecisions(prev => [...seeded.map(buildDecisionRecommendation), ...prev]);
      setChallenges(prev => syncChallengeSummaries(prev, updatedInitiatives));
      setStrategicFronts(prev =>
        prev.map(current =>
          current.id === front.id ? { ...current, initiativeCount: current.initiativeCount + seeded.length } : current,
        ),
      );
      setInitiativeOverlaps(prev => [...prev]);
    },
    createExecutiveOutput: (initiativeId, recommendation) => {
      const existing = getExecutiveOutputByInitiativeId(executiveOutputs, initiativeId);
      if (existing) return existing;

      const initiative = initiatives.find(item => item.id === initiativeId);
      if (!initiative) return null;
      const challenge = challenges.find(item => item.id === initiative.challengeId);
      if (!challenge) return null;

      const created = buildExecutiveOutput(
        initiative,
        challenge,
        recommendation,
        getDecisionsByInitiativeId(portfolioDecisions, initiativeId)[0]?.summary,
      );

      setExecutiveOutputs(prev => [created, ...prev]);
      return created;
    },
    updateExecutiveOutputStatus: (outputId, status) => {
      setExecutiveOutputs(prev =>
        prev.map(item =>
          item.id === outputId
            ? {
                ...item,
                status,
                timeline: [
                  ...item.timeline.slice(0, 2),
                  { label: `Estado actual: ${status.replaceAll('_', ' ')}`, note: 'La salida ejecutiva ya registro un nuevo hito post-decision.' },
                ],
              }
            : item,
        ),
      );
    },
  }), [challenges, executiveOutputs, initiativeOverlaps, initiatives, portfolioDecisions, strategicFronts]);

  return <PortfolioLeadContext.Provider value={value}>{children}</PortfolioLeadContext.Provider>;
}

export function usePortfolioLead() {
  const context = useContext(PortfolioLeadContext);
  if (!context) throw new Error('usePortfolioLead must be used within PortfolioLeadProvider');
  return context;
}

export type {
  Challenge,
  ChallengeActivationMode,
  ChallengeCoverageStatus,
  ChallengeStatus,
  ChallengeType,
  CreateChallengeInput,
  CreateStrategicFrontInput,
  ExecutiveOutput,
  ExecutiveOutputStatus,
  Initiative,
  InitiativeOverlap,
  InitiativePortfolioStatus,
  InitiativeStep,
  InitiativeStepProgressState,
  InvitationStatus,
  PortfolioAlert,
  PortfolioDecision,
  PortfolioDecisionItem,
  PortfolioDecisionOutcome,
  PortfolioInitiative,
  PortfolioLeadContextValue,
  PortfolioLeadState,
  PortfolioLeadSummary,
  SquadRole,
  StakeholderStatus,
  StrategicFront,
  StrategicFrontPriority,
  StrategicFrontStatus,
} from '../domain/types';
