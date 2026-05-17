import React from 'react';
import type { StakeholderStatus } from '../../domain/types';

export function ChallengeActivationOwnerStatus({
  challengeOwnerStatus,
  sponsorStatus,
  onChallengeOwnerStatusChange,
  onSponsorStatusChange,
  options,
}: {
  challengeOwnerStatus: StakeholderStatus;
  sponsorStatus: StakeholderStatus;
  onChallengeOwnerStatusChange: (value: StakeholderStatus) => void;
  onSponsorStatusChange: (value: StakeholderStatus) => void;
  options: Array<{ value: StakeholderStatus; label: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatusCard title="Challenge owner" value={challengeOwnerStatus} onChange={onChallengeOwnerStatusChange} options={options} />
      <StatusCard title="Sponsor" value={sponsorStatus} onChange={onSponsorStatusChange} options={options} />
    </div>
  );
}

function StatusCard({
  title,
  value,
  onChange,
  options,
}: {
  title: string;
  value: StakeholderStatus;
  onChange: (value: StakeholderStatus) => void;
  options: Array<{ value: StakeholderStatus; label: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-900" style={{ fontWeight: 700 }}>{title}</p>
      <select value={value} onChange={event => onChange(event.target.value as StakeholderStatus)} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}
