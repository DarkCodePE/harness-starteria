import { randomUUID } from 'node:crypto';
import type {
  CreateHandoffAssignmentInput,
  HandoffAssignment,
  HandoffAssignmentRepository,
  HandoffReference,
  HandoffReferenceRepository,
} from '../domain/portfolio-handoff-assignment.types';

export class InMemoryPortfolioHandoffAssignmentRepository implements HandoffAssignmentRepository {
  private readonly assignments = new Map<string, HandoffAssignment>();

  async create(input: CreateHandoffAssignmentInput): Promise<HandoffAssignment> {
    const now = new Date();
    const assignment: HandoffAssignment = {
      ...input,
      id: randomUUID(),
      state: 'CREATED',
      version: 1,
      members: input.members.map((member) => ({ ...member, identityKey: member.identityKey.trim().toLowerCase() })),
      createdAt: now,
      updatedAt: now,
    };
    this.assignments.set(assignment.id, assignment);
    return clone(assignment);
  }

  async findById(id: string): Promise<HandoffAssignment | null> {
    const assignment = this.assignments.get(id);
    return assignment ? clone(assignment) : null;
  }
}

export class InMemoryHandoffReferenceRepository implements HandoffReferenceRepository {
  constructor(
    private readonly challenges = new Map<string, HandoffReference>(),
    private readonly initiatives = new Map<string, HandoffReference>(),
  ) {}
  addChallenge(reference: HandoffReference): void { this.challenges.set(reference.id, reference); }
  addInitiative(reference: HandoffReference): void { this.initiatives.set(reference.id, reference); }
  async findChallenge(id: string): Promise<HandoffReference | null> { return this.challenges.get(id) ?? null; }
  async findInitiative(id: string): Promise<HandoffReference | null> { return this.initiatives.get(id) ?? null; }
}

function clone(assignment: HandoffAssignment): HandoffAssignment {
  return { ...assignment, members: assignment.members.map((member) => ({ ...member })), createdAt: new Date(assignment.createdAt), updatedAt: new Date(assignment.updatedAt) };
}
