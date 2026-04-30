# ADR-010: Authentication & Authorization — 6-Role Implementation

## Status
Accepted

## Date
2026-04-01

## Context

ADR-003 established JWT authentication with refresh token rotation. ADR-004 defined a 4-role RBAC model (`owner`, `mentor`, `admin`, `leader`). ADR-009 designed the migration to a 6-role model with role-gated state transitions and sponsor checkpoints. However, **none of ADR-009's design has been implemented**.

The platform profiles (defined in `backend/docs/Perfiles del dashboard.xlsx`) specify 6 distinct roles:

| Role | Platform Representation | Key Capabilities |
|------|------------------------|------------------|
| **Participante** | Creates and develops initiatives | Create projects, edit steps, invite collaborators, request mentoring, upload evidence, submit for review |
| **Mentor** | Expert assigned to accompany initiatives | Review advances, approve/reject steps, leave actionable feedback, hold expert sessions |
| **Admin** | Management and governance of the workspace | Manage dashboard, assign participants/sponsors/mentors, monitor metrics, configure spaces |
| **Sponsor** | Strategic leader assigned to give direction | View advances, participate in checkpoints (Steps 0, 2, 4), validate strategic alignment |
| **Colaborador** | Team member invited to co-create | Edit modules (with permission), upload evidence, comment, prepare deliverables |
| **Viewer/Invitado** | Read-only access | View advances, comment if enabled, attend presentations |

Additionally, the frontend currently uses **mock authentication** (hardcoded MOCK_USERS in AppContext.tsx) and must be connected to the real backend API.

### Gap Analysis

| Component | Current State | Target State |
|-----------|--------------|--------------|
| Prisma Role enum | `owner, mentor, admin, leader` | `participante, mentor, admin, sponsor, colaborador, viewer` |
| TypeScript Role type | `'owner' \| 'mentor' \| 'admin' \| 'leader'` | `'participante' \| 'mentor' \| 'admin' \| 'sponsor' \| 'colaborador' \| 'viewer'` |
| Auth middleware | `requireRole()` with 4 roles | `requireRole()` with 6 roles + `requireTransitionAuth()` |
| State machine | Structural validation only | Role-gated transitions with composite guards |
| Sponsor checkpoints | Not implemented | SponsorCheckpoint entity + lifecycle service |
| Colaborador permissions | Not implemented | Module-level permissions on TeamMember |
| Frontend auth | Mock users in AppContext | Real API calls with JWT + refresh token rotation |

## Decision

### 1. Database Migration (Prisma Schema)

**1.1 Role Enum Migration**

```sql
-- Rename existing roles
ALTER TYPE "Role" RENAME VALUE 'owner' TO 'participante';
ALTER TYPE "Role" RENAME VALUE 'leader' TO 'viewer';
-- Add new roles
ALTER TYPE "Role" ADD VALUE 'sponsor';
ALTER TYPE "Role" ADD VALUE 'colaborador';
```

**1.2 New SponsorCheckpoint Model**

Added to Prisma schema with fields: projectId, stepNumber (0|2|4), sponsorId, status (PENDING|APPROVED|FLAGGED|EXPIRED|SKIPPED), strategicFeedback, alignmentSignal, focusRecommendation, expiresAt. Unique constraint on `[projectId, stepNumber]`.

**1.3 TeamMember Extension**

Add `modulePermissions String[]` to TeamMember for colaborador module-level access control.

### 2. Backend Auth & Authorization Updates

**2.1 Type System**
- `Role = 'participante' | 'mentor' | 'admin' | 'sponsor' | 'colaborador' | 'viewer'`
- JWT payload updated with new role values

**2.2 Auth Service**
- `participante` can self-register (replaces `owner`)
- Other roles created by admin only
- Registration schema updated with new role validation

**2.3 Auth Middleware**
- `requireRole()` accepts 6 roles
- `resolveProjectAccess()` updated per ADR-009 Section 7
- New `requireTransitionAuth()` middleware combines structural + role + guard validation

**2.4 Transition Guards (State Machine)**
- `roleTransitionMap`: every `entity:fromStatus:toStatus` mapped to allowed roles
- Composite guards: `guardViewerReadOnly`, `guardNoSelfApproval`, `guardColaboradorModuleAccess`, `guardStepApprovalRequiresMentorSession`, `guardSponsorCheckpoint`
- `validateTransitionWithRole()` replaces `validateTransition()`

### 3. Sponsor Checkpoint Module

New module at `backend/modules/sponsor/`:
- `sponsor.controller.ts` — HTTP handlers for checkpoint CRUD + respond
- `sponsor.service.ts` — Checkpoint lifecycle (create, respond, expire, skip)
- `sponsor.router.ts` — Routes mounted at `/api/v1/sponsor`
- `sponsor.schemas.ts` — Zod validation for checkpoint responses

Endpoints:
```
POST   /api/v1/sponsor/checkpoints              # Create checkpoint (admin/system)
GET    /api/v1/sponsor/checkpoints/:id           # Get checkpoint details
PATCH  /api/v1/sponsor/checkpoints/:id/respond   # Sponsor responds (sponsor only)
PATCH  /api/v1/sponsor/checkpoints/:id/skip      # Admin skips checkpoint
GET    /api/v1/sponsor/projects/:projectId       # List checkpoints for project
```

### 4. Frontend Auth Integration

Replace mock auth in `AppContext.tsx` with:
- New `src/app/services/api.ts` — Axios instance with base URL, interceptors for JWT attachment and refresh
- New `src/app/services/auth.service.ts` — login(), register(), logout(), refreshToken(), getMe()
- Updated `AppContext.tsx` — Real API calls, token storage in memory (access) + httpOnly cookie (refresh)
- Updated `AuthPage.tsx` — Remove demo accounts section, real form submission

### 5. Implementation Phases

| Phase | Scope | Dependencies |
|-------|-------|-------------|
| **Phase 1** | Prisma schema migration + types | None |
| **Phase 2** | Auth middleware + service updates | Phase 1 |
| **Phase 3** | Transition guards in state machine | Phase 1, Phase 2 |
| **Phase 4** | Sponsor checkpoint module | Phase 1 |
| **Phase 5** | Frontend API integration | Phase 2 |
| **Phase 6** | Integration testing + deployment | All phases |

## Consequences

### Positive
- Complete alignment between Excel profile definitions and code
- Every state transition is role-gated (closes ADR-006 gap)
- Frontend connected to real auth (no more mock users in production)
- Sponsor strategic input captured at critical milestones
- Colaboradores can contribute without risking unauthorized state changes

### Negative
- Database migration required (role rename affects existing users)
- Frontend refactor touches the central AppContext
- 6 roles × N transitions increases authorization surface area

### Risks & Mitigations
- **Risk:** Migration breaks existing JWT tokens → **Mitigation:** Force re-login after deployment
- **Risk:** Sponsor checkpoints ignored → **Mitigation:** Soft gate design (don't block progress)
- **Risk:** Frontend regression → **Mitigation:** Keep mock fallback behind env flag during transition

## References
- ADR-003: Authentication (JWT + refresh token rotation)
- ADR-004: Authorization (4-role RBAC)
- ADR-006: State Machine for Project/Step Lifecycle
- ADR-009: Six-Role Model Integration with State Machine
- `backend/docs/Perfiles del dashboard.xlsx`: Role definitions
