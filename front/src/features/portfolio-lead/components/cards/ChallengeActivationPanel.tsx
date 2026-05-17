import React from 'react';
import type {
  Challenge,
  ChallengeActivationInputs,
  ChallengeActivationMode,
  ChallengeActivationReadiness,
  ChallengeActivationRecommendationModel,
  StakeholderStatus,
} from '../../domain/types';
import { ChallengeActivationMessageDraft } from './ChallengeActivationMessageDraft';
import { ChallengeActivationModeSelector } from './ChallengeActivationModeSelector';
import { ChallengeActivationOwnerStatus } from './ChallengeActivationOwnerStatus';
import { ChallengeActivationReadinessChecklist } from './ChallengeActivationReadinessChecklist';
import { ChallengeActivationRecommendation } from './ChallengeActivationRecommendation';

export function ChallengeActivationPanel({
  challenge,
  readiness,
  recommendation,
  recommendationNote,
  messageDraft,
  activationModeOptions,
  stakeholderOptions,
  inputOptions,
  onInputChange,
  onModeChange,
  onAcceptRecommendation,
  onRecommendationNoteChange,
  onMessageDraftChange,
  onRegenerateMessage,
  onChallengeOwnerStatusChange,
  onSponsorStatusChange,
  children,
}: {
  challenge: Challenge;
  readiness: ChallengeActivationReadiness;
  recommendation: ChallengeActivationRecommendationModel;
  recommendationNote: string;
  messageDraft: string;
  activationModeOptions: Array<{ value: ChallengeActivationMode; label: string; description: string }>;
  stakeholderOptions: Array<{ value: StakeholderStatus; label: string }>;
  inputOptions: Record<keyof ChallengeActivationInputs, Array<{ value: string; label: string }>>;
  onInputChange: <K extends keyof ChallengeActivationInputs>(field: K, value: ChallengeActivationInputs[K]) => void;
  onModeChange: (value: ChallengeActivationMode) => void;
  onAcceptRecommendation: () => void;
  onRecommendationNoteChange: (value: string) => void;
  onMessageDraftChange: (value: string) => void;
  onRegenerateMessage: () => void;
  onChallengeOwnerStatusChange: (value: StakeholderStatus) => void;
  onSponsorStatusChange: (value: StakeholderStatus) => void;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>ACTIVACION DEL RETO</p>
      <p className="mt-2 text-sm text-slate-600">
        Decide la mejor forma de movilizar personas, equipos o capacidades antes de activar el reto.
      </p>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ChallengeActivationRecommendation
          recommendation={recommendation}
          note={recommendationNote}
          onNoteChange={onRecommendationNoteChange}
          onAccept={onAcceptRecommendation}
        />
        <ChallengeActivationReadinessChecklist readiness={readiness} sponsorConfirmed={challenge.sponsorStatus === 'confirmado'} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <ChallengeActivationModeSelector
          value={challenge.activationMode}
          recommendedMode={recommendation.recommendedMode}
          onChange={onModeChange}
          options={activationModeOptions}
        />

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-900" style={{ fontWeight: 700 }}>Inputs para recomendacion</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(
              Object.entries(inputOptions) as Array<[keyof ChallengeActivationInputs, Array<{ value: string; label: string }> ]>
            ).map(([field, options]) => (
              <label key={field} className="block">
                <span className="mb-1.5 block text-sm text-slate-700" style={{ fontWeight: 600 }}>{FIELD_LABELS[field]}</span>
                <select
                  value={String(challenge.activationInputs[field])}
                  onChange={event => onInputChange(field, event.target.value as ChallengeActivationInputs[typeof field])}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ChallengeActivationOwnerStatus
          challengeOwnerStatus={challenge.challengeOwnerStatus}
          sponsorStatus={challenge.sponsorStatus}
          onChallengeOwnerStatusChange={onChallengeOwnerStatusChange}
          onSponsorStatusChange={onSponsorStatusChange}
          options={stakeholderOptions}
        />
      </div>

      {children ? <div className="mt-4">{children}</div> : null}

      <div className="mt-4">
        <ChallengeActivationMessageDraft
          value={messageDraft}
          onChange={onMessageDraftChange}
          onGenerate={onRegenerateMessage}
        />
      </div>
    </section>
  );
}

const FIELD_LABELS: Record<keyof ChallengeActivationInputs, string> = {
  urgency: 'Urgencia',
  timeAvailable: 'Tiempo disponible',
  estimatedEffort: 'Esfuerzo estimado',
  challengeClarity: 'Claridad del reto',
  informationSensitivity: 'Sensibilidad de informacion',
  internalCapacity: 'Capacidad interna',
  technicalNeed: 'Necesidad tecnica',
  sponsorStatus: 'Sponsor',
  dependency: 'Dependencia principal',
};
