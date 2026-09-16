import { AISuggestionPanel } from './AISuggestionPanel';
import { AttentionItem } from './AttentionItem';
import { ContextSummary } from './ContextSummary';
import { DecisionSupportSummary } from './DecisionSupportSummary';
import { EmptyState } from './EmptyState';
import { HumanReviewBlock } from './HumanReviewBlock';
import { InlineInsight } from './InlineInsight';
import { NextAction } from './NextAction';
import { PageHeader } from './PageHeader';
import { ProposedMutationCard } from './ProposedMutationCard';
import { ReviewSummary } from './ReviewSummary';
import { DomainStatusBadge } from '../status';
import { ReviewDisposition } from './ReviewDisposition';

const sampleActions = [
  { id: 'review', label: 'Review', tone: 'secondary' as const },
  { id: 'apply', label: 'Apply', tone: 'primary' as const },
  { id: 'dismiss', label: 'Dismiss', tone: 'ghost' as const },
];

export function DSPatternValidationSurface() {
  return (
    <section className="space-y-6 rounded-ds-lg border border-border-default bg-surface-default p-6 text-text-primary">
      <div className="space-y-4">
        <PageHeader
          breadcrumb="Portfolio / Demo"
          eyebrow="Validation"
          title="Strategic front overview"
          description="Mock page header with optional status, metadata and actions."
          status={<DomainStatusBadge status="requires_review" />}
          metadata={[
            { label: 'Owner', value: 'Portfolio Lead' },
            { label: 'Horizon', value: 'Q4' },
          ]}
          primaryAction={{ id: 'create', label: 'Create challenge' }}
          secondaryActions={[{ id: 'export', label: 'Export', tone: 'secondary' }]}
        />
        <PageHeader
          density="compact"
          title="Compact review surface"
          status={<DomainStatusBadge status="confirmed" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EmptyState
          eyebrow="Portfolio"
          title="No initiatives are linked yet"
          description="Use this space to explain what is absent, why it matters and what to do next."
          primaryAction={{ id: 'link', label: 'Link initiative' }}
          secondaryAction={{ id: 'create', label: 'Create new', tone: 'secondary' }}
        >
          Mock demo content only.
        </EmptyState>
        <EmptyState
          eyebrow="Challenge"
          title="No evidence has been added"
          description="Evidence can be attached later by product logic without changing this pattern."
          primaryAction={{ id: 'add', label: 'Add evidence' }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <NextAction
          title="Complete the minimum evidence"
          description="This action is supplied by the page, not calculated inside the component."
          context="Context: Step workspace demo"
          primaryAction={{ id: 'continue', label: 'Continue' }}
          secondaryAction={{ id: 'review', label: 'Review context', tone: 'secondary' }}
        />
        <ContextSummary
          title="Inherited context"
          description="A lightweight summary of supplied context items."
          items={[
            { label: 'Challenge', value: 'Reduce onboarding drop-off', source: 'Based on confirmed challenge context' },
            { label: 'Decision needed', value: 'Whether to expand the pilot', metadata: 'Due this quarter' },
          ]}
        />
      </div>

      <div className="grid gap-3">
        <AttentionItem
          severity="info"
          title="New context available"
          description="A new document can be reviewed when useful."
          primaryAction={{ id: 'open', label: 'Open' }}
        />
        <AttentionItem
          severity="warning"
          title="Coverage needs review"
          description="The supplied state says this item requires review."
          reason="Reason: owner confirmation is pending."
          metadata={[{ label: 'Source', value: 'Mock data' }]}
          primaryAction={{ id: 'review', label: 'Review' }}
        />
        <AttentionItem
          severity="danger"
          title="Blocked decision"
          description="The page can represent a blocked condition without deciding why it is blocked."
          primaryAction={{ id: 'resolve', label: 'Resolve' }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InlineInsight
          rationale={['Same target segment', 'Similar KPI', 'Scope still broad']}
          actions={[{ id: 'review', label: 'Review suggestion', tone: 'secondary' }]}
        >
          This challenge still looks too broad to activate responsibly.
        </InlineInsight>

        <AISuggestionPanel
          suggestion="Narrow the challenge to onboarding drop-off before choosing activation mode."
          why={['The current wording contains two outcomes', 'Evidence points to one main friction area']}
          provenance={[{ label: 'Based on', value: 'this challenge and confirmed evidence' }]}
          actions={sampleActions}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewSummary
          source="ai"
          title="AI review summary"
          disposition="REQUIRES_REVIEW"
          summary="Starteria found useful structure but missing evidence."
          strengths={['Clear target segment']}
          gaps={['Evidence source is still missing']}
          nextAction="Ask a human reviewer before treating this as confirmed."
          actions={[{ id: 'review', label: 'Review', tone: 'secondary' }]}
        />
        <ReviewSummary
          source="human"
          title="Human review summary"
          disposition="USER_CONFIRMED"
          reviewer="Nadia Torres"
          role="Mentor"
          summary="The reviewer confirmed the framing and left one improvement note."
          strengths={['Decision criterion is visible']}
          actions={[{ id: 'open', label: 'Open review', tone: 'secondary' }]}
        />
      </div>

      <DecisionSupportSummary
        summary="A short supplied synthesis for decision support."
        keyEvidence={['5 interviews completed', 'Drop-off concentrated in onboarding']}
        strategicQuestions={[
          { id: 'q1', question: 'Does the evidence answer the original risk?' },
          { id: 'q2', question: 'What condition would justify expanding the pilot?' },
        ]}
        conclusion="The supplied conclusion says the initiative can continue, but not yet scale."
        uncertaintyNote="Attribution remains uncertain."
        routes={[
          { id: 'iterate', label: 'Iterate', tone: 'secondary' },
          { id: 'scale', label: 'Scale', tone: 'primary' },
          { id: 'close', label: 'Close with learning', tone: 'ghost' },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <ReviewDisposition status="UNREVIEWED" />
        <ReviewDisposition status="REQUIRES_REVIEW" />
        <ReviewDisposition status="USER_CONFIRMED" />
        <ReviewDisposition status="USER_REJECTED" />
        <ReviewDisposition status="SUPERSEDED" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HumanReviewBlock
          title="Mentor review"
          reviewer="Ariadna Santos"
          role="Mentor"
          status="USER_CONFIRMED"
          comment="The evidence is enough to continue, but the decision brief should name the operating risk."
          timestamp="Today"
          actions={[
            { id: 'request_changes', label: 'Request changes', tone: 'secondary' },
            { id: 'confirm', label: 'Confirm', tone: 'primary' },
          ]}
        />

        <ProposedMutationCard
          current="Expand the onboarding automation initiative across all channels."
          suggestion="Run a limited onboarding pilot in the digital channel first."
          why={['Lower implementation risk', 'Current evidence comes from digital funnel data']}
          actions={[
            { id: 'apply', label: 'Apply', tone: 'primary' },
            { id: 'keep_current', label: 'Keep current', tone: 'secondary' },
            { id: 'edit', label: 'Edit', tone: 'ghost' },
            { id: 'reject', label: 'Reject', tone: 'destructive' },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AISuggestionPanel state="loading" loadingLabel="Reviewing coverage..." />
        <AISuggestionPanel
          state="error"
          actions={[{ id: 'try_again', label: 'Try again', tone: 'secondary' }]}
        />
      </div>
    </section>
  );
}
