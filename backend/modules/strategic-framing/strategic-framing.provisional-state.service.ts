import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { can, type Permission } from '../../shared/authz/permissions';
import type {
  StrategicFramingCorrection,
  StrategicFramingParentContextStatus,
  StrategicFramingProvisionalSourceMode,
  StrategicFramingProvisionalState,
  StrategicFramingProvisionalSubject,
  StrategicFramingReadModel,
} from './strategic-framing.types';

type Db = PrismaClient | any;
type JsonRecord = Record<string, unknown>;

export class StrategicFramingProvisionalStateService {
  constructor(private readonly prisma: PrismaClient, private readonly now: () => Date = () => new Date()) {}

  async initializeFromReadSnapshot(input: {
    snapshot: StrategicFramingReadModel;
    logicalContextKey: string;
    actorUserId: string;
    organizationId?: string | null;
    permissions: ReadonlySet<Permission>;
  }): Promise<StrategicFramingProvisionalState> {
    this.assertPermission(input.permissions, 'portfolio:read');
    const sourceMode = normalizeSourceMode(input.snapshot.context.sourceMode, input.snapshot.context.sourceContinuationId);
    const logicalContextKey = namespaceLogicalContextKey(sourceMode, input.organizationId ?? null, input.logicalContextKey);
    const db: Db = this.prisma as Db;
    const existing = await db.strategicFramingProvisionalState.findUnique({ where: { userId_logicalContextKey: { userId: input.actorUserId, logicalContextKey } } });
    if (existing) {
      this.assertScope(existing, input.actorUserId, input.organizationId);
      return toState(existing);
    }

    const data = fromSnapshot(input.snapshot, sourceMode, logicalContextKey, input.actorUserId, input.organizationId ?? null, this.now());
    try {
      const created = await db.strategicFramingProvisionalState.create({ data });
      return toState(created);
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      const concurrent = await db.strategicFramingProvisionalState.findUnique({ where: { userId_logicalContextKey: { userId: input.actorUserId, logicalContextKey } } });
      if (!concurrent) throw error;
      this.assertScope(concurrent, input.actorUserId, input.organizationId);
      return toState(concurrent);
    }
  }

  async getCurrent(input: { stateId: string; actorUserId: string; organizationId?: string | null; permissions: ReadonlySet<Permission> }): Promise<StrategicFramingProvisionalState> {
    this.assertPermission(input.permissions, 'portfolio:read');
    const state = await (this.prisma as Db).strategicFramingProvisionalState.findUnique({ where: { id: input.stateId } });
    if (!state) throw AppError.notFound('Estado provisional de Strategic Framing', 'SF_PROVISIONAL_STATE_NOT_FOUND');
    this.assertScope(state, input.actorUserId, input.organizationId);
    return toState(state);
  }

  async correct(input: { stateId: string; actorUserId: string; organizationId?: string | null; permissions: ReadonlySet<Permission>; expectedVersion: number; correction: StrategicFramingCorrection; reason?: string | null }): Promise<StrategicFramingProvisionalState> {
    this.assertPermission(input.permissions, 'portfolio:write');
    const db: Db = this.prisma as Db;
    return this.prisma.$transaction(async (tx) => {
      const current = await (tx as Db).strategicFramingProvisionalState.findUnique({ where: { id: input.stateId } });
      if (!current) throw AppError.notFound('Estado provisional de Strategic Framing', 'SF_PROVISIONAL_STATE_NOT_FOUND');
      this.assertScope(current, input.actorUserId, input.organizationId);
      if (current.version !== input.expectedVersion) throw staleCorrectionError(input.expectedVersion, current.version);
      try {
        await (tx as Db).strategicFramingProvisionalStateHistory.create({ data: { stateId: current.id, version: current.version, actorUserId: input.actorUserId, action: 'human_correction', reason: input.reason ?? null, snapshot: snapshotOf(current), createdAt: this.now() } });
      } catch (error) {
        if (isUniqueConstraintError(error)) throw staleCorrectionError(input.expectedVersion, current.version);
        throw error;
      }
      const safeCorrection = input.correction.parentContext === undefined
        ? input.correction
        : { ...input.correction, parentContext: { ...input.correction.parentContext, sourceRefs: parentSourceRefs(current.parentContext) } };
      const updated = await (tx as Db).strategicFramingProvisionalState.updateMany({ where: { id: current.id, version: input.expectedVersion }, data: { ...allowedCorrection(safeCorrection), provenance: mergeCorrectionProvenance(current.provenance, input.actorUserId), version: { increment: 1 }, updatedAt: this.now() } });
      if (updated.count !== 1) throw staleCorrectionError(input.expectedVersion, current.version + 1);
      const next = await (tx as Db).strategicFramingProvisionalState.findUnique({ where: { id: current.id } });
      if (!next) throw AppError.notFound('Estado provisional de Strategic Framing', 'SF_PROVISIONAL_STATE_NOT_FOUND');
      return toState(next);
    });
  }

  private assertPermission(permissions: ReadonlySet<Permission>, permission: Permission): void {
    if (!can(permissions, permission)) throw AppError.forbidden('No autorizado.', 'SF_PROVISIONAL_STATE_FORBIDDEN');
  }

  private assertScope(state: { userId: string; organizationId: string | null }, actorUserId: string, organizationId?: string | null): void {
    if (state.userId !== actorUserId || (state.organizationId !== null && state.organizationId !== (organizationId ?? null))) throw AppError.forbidden('No autorizado.', 'SF_PROVISIONAL_STATE_FORBIDDEN');
  }
}

function namespaceLogicalContextKey(sourceMode: StrategicFramingProvisionalSourceMode, organizationId: string | null, rawKey: string): string {
  return `sf3b:${JSON.stringify({ version: 1, sourceMode, organizationId, rawKey })}`;
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
}

function staleCorrectionError(expectedVersion: number, currentVersion: number): AppError {
  return AppError.conflict(`La corrección SF-3B está desactualizada. Versión esperada ${expectedVersion}, actual ${currentVersion}.`, 'SF_PROVISIONAL_STATE_STALE');
}

function normalizeSourceMode(mode: string, continuationId?: string | null): StrategicFramingProvisionalSourceMode {
  if (mode === 'public_entry' || mode === 'enterprise_direct' || mode === 'existing_portfolio') return mode;
  if (mode === 'bootstrap' && continuationId) return 'public_entry';
  if (mode === 'bootstrap') return 'enterprise_direct';
  throw AppError.badRequest('El modo de origen no es compatible con SF-3B.', 'SF_PROVISIONAL_SOURCE_MODE_UNSUPPORTED');
}

function fromSnapshot(snapshot: StrategicFramingReadModel, sourceMode: StrategicFramingProvisionalSourceMode, key: string, userId: string, organizationId: string | null, now: Date): JsonRecord {
  const parent = snapshot.anchor.parentContext;
  return { userId, organizationId, sourceMode, logicalContextKey: key, sourceRefs: sourceRefs(snapshot), provenance: snapshot.anchor.provenance, intendedMovement: snapshot.anchor.intendedMovement ?? null, whyItMatters: snapshot.anchor.whyItMatters ?? null, movementSignalStatus: snapshot.anchor.signal?.status ?? null, movementSignalValue: snapshot.anchor.signal?.value ?? null, horizonContext: null, decisionToEnable: snapshot.anchor.decisionToEnable ?? null, subjectLevel: snapshot.scopeAssessment.level, scopeAssessment: snapshot.scopeAssessment, rationaleUncertainty: null, parentStatus: parent.status === 'unknown' ? 'unresolved' : parent.status, parentContext: { label: parent.label ?? null, sourceRefs: parent.sourceRefs }, sufficiencyStatus: snapshot.sufficiency.status, blockers: snapshot.sufficiency.blockers, softGaps: snapshot.sufficiency.softGaps, optionalContext: snapshot.sufficiency.optionalContext, version: 1, createdAt: now, updatedAt: now };
}

function allowedCorrection(correction: StrategicFramingCorrection): JsonRecord {
  const data: JsonRecord = {};
  for (const key of ['intendedMovement', 'whyItMatters', 'movementSignalStatus', 'movementSignalValue', 'horizonContext', 'decisionToEnable', 'subjectLevel', 'scopeAssessment', 'rationaleUncertainty'] as const) if (correction[key] !== undefined) data[key] = correction[key];
  if (correction.parentStatus !== undefined) data.parentStatus = correction.parentStatus;
  if (correction.parentContext !== undefined) {
    // sourceRefs are trusted evidence owned by SF-3B. A browser correction may
    // change the human label, but can never erase or replace that evidence.
    data.parentContext = { label: correction.parentContext.label ?? null, sourceRefs: correction.parentContext.sourceRefs ?? [] };
  }
  if (correction.sufficiency !== undefined) { data.sufficiencyStatus = correction.sufficiency.status; data.blockers = correction.sufficiency.blockers; data.softGaps = correction.sufficiency.softGaps; data.optionalContext = correction.sufficiency.optionalContext; }
  return data;
}

function sourceRefs(snapshot: StrategicFramingReadModel): string[] { return [...new Set([...snapshot.anchor.provenance.map((item) => item.sourceRef), ...snapshot.anchor.parentContext.sourceRefs, ...snapshot.scopeAssessment.provenance])]; }
function mergeCorrectionProvenance(value: unknown, actorUserId: string): JsonRecord { return { original: value, correction: { actorUserId, kind: 'human_corrected' } }; }
function snapshotOf(value: any): JsonRecord { const { id, createdAt, updatedAt, ...snapshot } = value; return snapshot; }
function parentSourceRefs(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  const refs = (value as { sourceRefs?: unknown }).sourceRefs;
  return Array.isArray(refs) ? refs.filter((ref): ref is string => typeof ref === 'string') : [];
}
function toState(value: any): StrategicFramingProvisionalState { return { ...value, sourceRefs: value.sourceRefs as string[], provenance: value.provenance as StrategicFramingProvisionalState['provenance'], scopeAssessment: value.scopeAssessment as StrategicFramingProvisionalState['scopeAssessment'], parentContext: value.parentContext as StrategicFramingProvisionalState['parentContext'], sufficiency: { status: value.sufficiencyStatus, blockers: value.blockers as string[], softGaps: value.softGaps as string[], optionalContext: value.optionalContext as string[] }, createdAt: new Date(value.createdAt).toISOString(), updatedAt: new Date(value.updatedAt).toISOString() }; }
