import { DomainStatusBadge, type DomainStatus } from './DomainStatusBadge';

const STATUS_GROUPS: Array<{ title: string; statuses: DomainStatus[] }> = [
  { title: 'Workflow', statuses: ['draft', 'active', 'completed', 'blocked', 'closed'] },
  { title: 'Review', statuses: ['unreviewed', 'requires_review', 'confirmed', 'rejected', 'superseded'] },
  { title: 'Feedback', statuses: ['info', 'success', 'warning', 'danger'] },
  { title: 'AI', statuses: ['suggested'] },
];

export function DomainStatusBadgeValidationSurface() {
  return (
    <section className="space-y-4 rounded-lg border border-border-default bg-surface-default p-4 text-text-primary">
      {STATUS_GROUPS.map((group) => (
        <div key={group.title} className="space-y-2">
          <h3 className="text-[var(--type-label-size)] font-semibold leading-[var(--type-label-line-height)] text-text-secondary">
            {group.title}
          </h3>
          <div className="flex flex-wrap gap-2">
            {group.statuses.map((status) => (
              <DomainStatusBadge key={status} status={status} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
