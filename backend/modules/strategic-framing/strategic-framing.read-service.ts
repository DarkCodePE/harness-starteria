import type {
  DerivedFramingItem,
  FramingProvenance,
  StrategicFramingReadInput,
  StrategicFramingReadModel,
} from './strategic-framing.types';

export class StrategicFramingReadService {
  compose(input: StrategicFramingReadInput): StrategicFramingReadModel {
    const anchor = input.anchor ?? null;
    const workItems = input.workItems ?? [];
    const connections = input.strategicConnections ?? [];
    const conditions = input.advancementConditions ?? [];
    const sourceRefs = refs(anchor?.sourceRefs);
    const parentRefs = input.canonicalContext?.sourceRefs ?? [];
    const parentStatus = input.canonicalContext?.strategicFrontId ? 'known' : hasProvisionalParent(anchor) ? 'provisional' : 'unresolved';
    const parentLabel = input.canonicalContext?.strategicFrontLabel ?? null;

    const anchorStatus = toAnchorStatus(anchor?.status);
    const signals = conditionsToSignals(conditions);
    const blockers = [
      ...(anchorStatus === 'anchor_conflicting' ? ['El anchor contiene informacion conflictiva.'] : []),
      ...conditions.filter((condition) => condition.severity === 'blocking').map((condition) => condition.statement),
      ...input.proposedMutations
        ?.filter((mutation) => mutation.materiality === 'material' && mutation.status === 'proposed' && mutation.uncertainty === 'high')
        .map((mutation) => mutation.rationale ?? `La propuesta ${mutation.id} requiere revision material.`) ?? [],
    ];
    const softGaps = conditions.filter((condition) => condition.severity !== 'blocking').map((condition) => condition.statement);
    const existingWork = workItems.map((item) => {
      const connection = connections.find((candidate) => candidate.workItemId === item.id);
      return {
        id: item.id,
        label: item.proposedName ?? item.rawLabel,
        stateHint: item.currentStateHint ?? null,
        ownerCandidate: item.ownerCandidate ?? null,
        alignment: {
          status: toAlignmentStatus(connection?.status),
          provenance: connection?.provenanceStatus ?? null,
        },
        sourceRefs: unique([...refs(item.sourceRefs), `work_item:${item.id}`]),
      };
    });
    const scope = assessScope(anchor, workItems, input.canonicalContext);
    const hasUnknownAlignment = existingWork.some((item) => item.alignment.status === 'alignment_unknown' || item.alignment.status === 'unknown');
    const hasConflict = blockers.length > 0 && (anchorStatus === 'anchor_conflicting' || conditions.some((condition) => condition.severity === 'blocking'));
    const sufficiencyStatus = hasConflict ? 'conflicting' : anchorStatus === 'anchor_insufficient' || anchorStatus === 'anchor_provisional' || !anchor
      ? 'insufficient' : 'sufficient';

    return {
      context: input.context,
      anchor: {
        id: anchor?.id ?? null,
        status: anchorStatus,
        intendedMovement: anchor?.outcomeStatement ?? null,
        whyItMatters: anchor?.contextSummary ?? null,
        signal: anchor ? {
          status: toSignalStatus(anchor.businessSignalStatus),
          value: anchor.businessSignalValue ?? null,
        } : null,
        decisionToEnable: anchor?.decisionToEnable ?? null,
        parentContext: { status: parentStatus, label: parentLabel, sourceRefs: unique(parentRefs) },
        provenance: provenanceEntries(sourceRefs, anchor?.provenanceStatus),
      },
      scopeAssessment: scope,
      existingWork,
      framingSignals: signals,
      sufficiency: {
        status: sufficiencyStatus,
        blockers: unique(blockers),
        softGaps: unique(softGaps),
        optionalContext: input.canonicalContext?.initiativeId ? [] : ['No hay contexto de iniciativa gobernado en esta lectura.'],
      },
      nextBestAction: nextAction({ anchorStatus, hasConflict, hasUnknownAlignment, scope, parentStatus, existingWorkCount: existingWork.length }),
      generatedAt: (input.now ?? (() => new Date()))().toISOString(),
    };
  }
}

function nextAction(input: { anchorStatus: string; hasConflict: boolean; hasUnknownAlignment: boolean; scope: StrategicFramingReadModel['scopeAssessment']; parentStatus: string; existingWorkCount: number }): StrategicFramingReadModel['nextBestAction'] {
  if (input.hasConflict) return { kind: 'resolve_conflict', reason: 'Hay informacion material conflictiva que debe revisarse antes de avanzar.' };
  if (input.anchorStatus === 'anchor_insufficient' || input.anchorStatus === 'anchor_provisional' || input.anchorStatus === 'unknown') return { kind: 'clarify_anchor', reason: 'El contexto disponible no basta para sostener el siguiente movimiento.' };
  if (input.scope.level === 'challenge_like' && input.parentStatus === 'unresolved') return { kind: 'review_parent_context', reason: 'El contexto parece challenge-like, pero no hay un Strategic Front confirmado.' };
  if (input.hasUnknownAlignment) return { kind: 'review_alignment', reason: 'Hay trabajo existente cuya relacion con el anchor sigue sin resolver.' };
  if (input.existingWorkCount === 0) return { kind: 'inspect_existing_work', reason: 'El anchor es suficiente, pero aun no hay trabajo existente visible para contrastarlo.' };
  return { kind: 'ready_for_structured_framing', reason: 'Existe contexto suficiente para continuar hacia framing estructurado, sin crear objetos canonicos.' };
}

function assessScope(anchor: StrategicFramingReadInput['anchor'], workItems: NonNullable<StrategicFramingReadInput['workItems']>, canonicalContext: StrategicFramingReadInput['canonicalContext']): StrategicFramingReadModel['scopeAssessment'] {
  const text = [anchor?.outcomeStatement, anchor?.contextSummary, ...workItems.flatMap((item) => [item.rawLabel, item.proposedName, item.proposedPurpose])].filter(Boolean).join(' ').toLowerCase();
  if (anchor?.status === 'anchor_insufficient' || anchor?.status === 'anchor_provisional') return { level: 'unresolved', confidence: 'unknown', rationale: ['El anchor no es suficiente para clasificar el alcance.'], provenance: ['anchor:status'], canonicalized: false };
  if (canonicalContext?.strategicFrontId) return { level: 'front_like', confidence: 'high', rationale: ['Existe un Strategic Front confirmado en el contexto de lectura.'], provenance: canonicalContext.sourceRefs ?? ['canonical:strategic_front'], canonicalized: false };
  if (/\b(challenge|problema|friccion|riesgo|bloqueo|dolor)\b/.test(text)) return { level: 'challenge_like', confidence: 'low', rationale: ['El lenguaje fuente contiene señales de problema o bloqueo.'], provenance: ['derived:textual-signal'], canonicalized: false };
  if (/\b(iniciativa|proyecto|implementar|entregar|ejecutar)\b/.test(text)) return { level: 'initiative_like', confidence: 'low', rationale: ['El lenguaje fuente describe trabajo de ejecución.'], provenance: ['derived:textual-signal'], canonicalized: false };
  return { level: 'unresolved', confidence: 'unknown', rationale: ['No existe evidencia suficiente para clasificar el alcance.'], provenance: [], canonicalized: false };
}

function conditionsToSignals(conditions: NonNullable<StrategicFramingReadInput['advancementConditions']>): StrategicFramingReadModel['framingSignals'] {
  const result: StrategicFramingReadModel['framingSignals'] = { observations: [], drivers: [], gaps: [], opportunities: [] };
  conditions.forEach((condition, index) => {
    const kind = condition.type === 'business_signal' ? 'observation' : condition.type === 'critical_dependency' ? 'driver' : condition.type === 'decision_path' || condition.type === 'required_context' || condition.type === 'ownership_visibility' ? 'gap' : null;
    if (!kind) return;
    const item: DerivedFramingItem = { id: `derived-condition:${condition.id ?? index}`, kind, statement: condition.statement, sourceRefs: unique([...refs(condition.sourceRefs), condition.id ? `advancement_condition:${condition.id}` : 'derived:advancement_condition']), provenance: toItemProvenance(condition.provenanceStatus), confidence: condition.severity === 'blocking' ? 'medium' : 'low', canonical: false };
    result[`${kind}s` as 'observations' | 'drivers' | 'gaps'].push(item);
  });
  return result;
}

function toAnchorStatus(status?: string | null): StrategicFramingReadModel['anchor']['status'] { return ['anchor_insufficient', 'anchor_provisional', 'anchor_sufficient', 'anchor_confirmed', 'anchor_conflicting'].includes(status ?? '') ? status as StrategicFramingReadModel['anchor']['status'] : 'unknown'; }
function toSignalStatus(status?: string | null): NonNullable<StrategicFramingReadModel['anchor']['signal']>['status'] { return ['confirmed', 'proxy', 'suggested', 'unknown', 'conflicting'].includes(status ?? '') ? status as any : 'unknown'; }
function toAlignmentStatus(status?: string | null): StrategicFramingReadModel['existingWork'][number]['alignment']['status'] { return ['confirmed_alignment', 'probable_alignment', 'partial_alignment', 'alignment_unknown', 'possible_misalignment', 'confirmed_misalignment', 'out_of_current_priority'].includes(status ?? '') ? status as any : status ? 'unknown' : 'alignment_unknown'; }
function hasProvisionalParent(anchor: StrategicFramingReadInput['anchor']): boolean { return anchor?.provenanceStatus === 'ai_inferred' || anchor?.provenanceStatus === 'ai_suggested'; }
function toItemProvenance(status?: string | null): DerivedFramingItem['provenance'] { return status === 'ai_inferred' || status === 'ai_suggested' || status === 'user_confirmed' || status === 'extracted' ? status : 'derived'; }
function refs(value: unknown): string[] { if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string'); if (value && typeof value === 'object') return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => typeof item === 'string' ? [`${key}:${item}`] : []); return []; }
function provenanceEntries(sourceRefs: string[], status?: string | null): Array<{ sourceRef: string; kind: FramingProvenance }> { const kind = status === 'ai_inferred' || status === 'ai_suggested' || status === 'user_confirmed' || status === 'extracted' ? status : 'unknown'; return unique(sourceRefs).map((sourceRef) => ({ sourceRef, kind })); }
function unique(values: string[]): string[] { return [...new Set(values.filter(Boolean))]; }
