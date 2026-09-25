# Starteria — Public Entry Continuation Ownership & Profile Audit v0.1

**Estado:** `AUDIT COMPLETE / IMPLEMENTATION NOT AUTHORIZED`  
**Fecha:** 2026-09-25  
**Alcance:** ownership, actor/profile y continuación después de Public Entry  
**No modifica:** frontend, backend, rutas, DB, schemas, Portfolio runtime, Initiative runtime, Steps ni el harness congelado.

## 1. Repository guard

```text
repository_root: C:/Users/User/proyect-starteria/harness-starteria-clean
origin: https://github.com/DarkCodePE/harness-starteria.git
branch: feat/portfolio-entry-decision-readiness-harness
status_before_change: clean
result: PASS
```

`Dashboardstarteria` no se utilizó como checkout ni como autoridad. Sus
referencias en documentos existentes se tratan únicamente como evidencia
histórica/observada.

## 2. Authority and audit basis

La lectura activa es:

- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`, v0.3 candidata, requiere re-test;
- `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`, contrato de experiencia aprobado como base;
- `doc/product-adr/ADR-003-public-entry-registration-continuation-boundary.md`, `PROPOSED`;
- `doc/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md`, `PROPOSED FOR REVIEW`;
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md`, contrato de activación/handoff en borrador;
- `docs/portfolio-entry/testing/PORTFOLIO_ENTRY_ADR003_RECONCILIATION_AND_NEGATIVE_GUARDS_v0.1.md`, auditoría previa, sin autorización de implementación.

El resultado de este documento es una lectura de autoridad y current state,
no una decisión de aceptación de ADR-003.

## 3. Identity, business role and current job

La distinción operativa necesaria es:

```text
USER IDENTITY  = quién está autenticado o reclamando una sesión
BUSINESS ROLE  = qué responsabilidad/autoridad tiene en un contexto de negocio
CURRENT JOB    = qué intenta hacer ahora y sobre qué contexto
```

La misma identidad puede ser Portfolio Lead en un portafolio e Initiative
Owner en una iniciativa distinta. Registro/login prueba continuidad de identidad
y sesión; no prueba autoridad organizacional, ownership, alineamiento, KPI ni
activación.

## 4. Actor and profile concepts found

| Concepto usado | Fuente/autoridad | Responsabilidad y autoridad observada | Superficie de continuación | Estado |
|---|---|---|---|---|
| `Portfolio Lead` / Portfolio Lead funcional | Core §5; Portfolio Entry Contract; ADR-028/029 | Gobierna el portafolio completo: frentes, retos, cobertura, seguimiento, desbloqueo y preparación de decisiones. La organización designa uno o varios; comparten responsabilidad. | Portfolio Entry; `/portfolio/*`; `/portfolio/inicio`; activación posterior | Actual como concepto; la rama pública de ADR-003 sigue propuesta |
| `Initiative Owner` | Core §5; Activation/Handoff Contract | Desarrolla una iniciativa concreta, coordina trabajo/equipo, aporta evidencia y recomienda. Su ownership debe ser aceptado explícitamente. | Initiative Overview, Project y Steps de una iniciativa concreta | Actual como responsabilidad; no equivale a Portfolio Lead |
| `Business Decision Authority` | Core §5.3; Activation/Handoff Contract | Autoridad configurable por tipo, alcance, umbral y mandato. Puede ser persona o grupo; no se infiere por cargo o acceso. | Recibe/autoriza decisiones específicas; no es destino automático de Public Entry | Actual y transversal |
| `Sponsor` | Core; `PORTFOLIO_TO_INITIATIVE_ACTIVATION_*`; backend authz ADRs | Contexto ejecutivo/estratégico o participante de checkpoint. Puede recibir visibilidad/solicitud y emitir señal, pero no tiene aprobación universal. | Contexto de Strategic Front/Challenge/Initiative; sponsor checkpoint | Actual en runtime/documentación, con semántica de autoridad específica |
| `Challenge Owner` / responsable del Reto | Búsqueda documental y Core | No aparece congelado como un actor independiente con routing propio. El Core habla de Portfolio Leads responsables del Reto y de autoridad de decisión configurable. | Reto/Portfolio, no destino público independiente | Ambiguo; no usar como perfil de ruta sin decisión |
| Owner de Strategic Front | Core §13 y documentos Portfolio | El Frente tiene sponsor/responsable cuando corresponda, pero no hay un perfil de continuación pública independiente establecido. | Strategic Front/Portfolio | Ambiguo; requiere contexto canónico y autoridad |
| `organization member` / miembro de organización | Contratos de Portfolio/Activation y permisos | Membresía/permiso de contexto; no es sinónimo de Portfolio Lead ni de Initiative Owner. | Portfolio o Initiative según membresía y handoff | Concepto de autorización, no perfil suficiente por sí solo |
| `invitee` / persona invitada | Activation/Handoff Contract | Recibe una propuesta de responsabilidad/participación y debe aceptarla explícitamente. | Initiative Overview/pre-start después de aceptar | Actual como patrón de handoff; ruta Public Entry específica no auditada |
| Public/unregistered user | Portfolio Entry Contract; ADR-003 | Persona con necesidad, iniciativa o input provisional. Puede declarar intención, no autoridad organizacional. | Public Entry, handoff provisional; Portfolio por defecto después de auth | Actual como condición de entrada |
| Returning authenticated user | ADR-003; auth routes; Portfolio continuation contract | Identidad conocida; el rol/contexto relevante debe resolverse por sesión, permisos y contexto canónico, no por login solo. | Portfolio, Initiative explícita o recuperación provisional | Actual como condición técnica; perfil de negocio puede ser desconocido |
| Project owner / `ownerId` | `ProjectService.createProject`; `AppContext`; auth/runtime legacy | En el runtime legacy, quien crea el Project queda como owner y miembro `Owner`. | Project/Step 0..4 | Infraestructura actual; no autoridad para Public Entry V2 |
| Pilot owner / claimant | ADR-018; `PilotClaimService`; `createPilotProject` | El claimant autenticado importa la propuesta del pilot a su cuenta; el flujo lo trata como owner del Project. | `/continuar-piloto` → Project/Steps | `LEGACY_COMPAT`; supuesto de ownership no válido como default V2 |

### Finding

El repositorio tiene actores de responsabilidad suficientemente definidos para
Portfolio Lead e Initiative Owner, pero no tiene un perfil canónico equivalente
para `Challenge Owner`, owner de Strategic Front o una persona autenticada sin
rol/contexto de negocio resuelto. Esos huecos no deben rellenarse con persona,
texto o cargo inferido.

## 5. Entry modes

### A. Public need / requirement

Actor: persona pública, potencialmente Portfolio Lead, sin que esa hipótesis
sea todavía autoridad. Contexto: necesidad, problema, oportunidad, obligación o
incertidumbre declarada. No existe entidad canónica. Job: entender y estructurar
provisionalmente lo que necesita conseguir. Continuación: handoff provisional;
tras auth, Portfolio-oriented confirmation/continuation por defecto.

### B. Public initiative

Actor: persona pública con una iniciativa/proyecto razonablemente definido.
Contexto: iniciativa declarada, todavía no canónica en Starteria. Job: conectar
la iniciativa con intención, cambio esperado, señal y criterio de continuidad;
no empezar Steps automáticamente. Continuación: Portfolio por defecto, con
reverse alignment y confirmación. No se transforma el término “initiative” en
`INITIATIVE_ENTRY`.

### C. Existing Portfolio continuation

Actor: usuario autenticado con membresía/permiso de Portfolio conocido. Contexto:
Portfolio canónico existente. Job: gobernar, revisar, activar, seguir o decidir
sobre el portafolio. Continuación: Portfolio Home/Portfolio context. No se
redirige a Project/Steps por el mero hecho de autenticar.

### D. Explicit Initiative handoff

Actor: invitee o Initiative Owner en un contexto específico. Contexto: Initiative
canónica existente o handoff autorizado que la identifica, con responsabilidad
propuesta y aceptación. Job: asumir/realizar el trabajo de esa iniciativa y
entrar a su workspace. Continuación: Initiative Overview y Steps únicamente
después de elegibilidad, permisos, ownership/activation y autoridad requeridos.

### E. Legacy Project/pilot continuation

Actor asumido por legacy: claimant/registrant como owner operativo del Project.
Contexto: pilot code o PublicDraft. Job asumido: convertir la propuesta pública
en Project y abrir Step 0. Continuación: Project/Steps. Clasificación: solo
compatibilidad; no es el modelo canónico de Public Entry.

### F. Returning provisional Public Entry

Actor: usuario que inició una sesión pública y luego registra, inicia sesión o
regresa. Contexto: `PortfolioEntryDraft`/handoff provisional versionado, con
procedencia, gaps y open items. Job: recuperar el mismo entendimiento y elegir
la continuación válida. Continuación: restaurar contexto y confirmar/corregir;
Portfolio por defecto si no existe handoff Initiative explícito.

### G. Existing Initiative return

Actor: Initiative Owner/participant autorizado ya vinculado a una Initiative.
Contexto: entidad y permisos canónicos existentes. Job: continuar trabajo ya
asignado. Continuación: Initiative/Steps según lifecycle, sin pasar por Public
Entry ni convertir de nuevo.

## 6. Continuation matrix

| Entry mode | Actor/context | Canonical entity already exists? | Current job | Default continuation | Allowed exception | Forbidden shortcut | Confirmation needed? | Authority dependency | Provenance requirement |
|---|---|---:|---|---|---|---|---|---|---|
| Public need | Persona pública; rol de negocio aún no establecido | NO | Aclarar necesidad y cambio deseado | Provisional handoff → Portfolio context after auth | Explicit later Portfolio/Initiative handoff | Registration → Project/Steps; keyword/persona routing | Sí, para representación de intención; no otorga autoridad | Server-owned session/profile; Portfolio permission for canonical context | Raw input, extracted vs inferred, unresolved context, revision |
| Public initiative | Persona pública con iniciativa declarada | NO | Reverse alignment y criterio de continuidad | Portfolio-oriented confirmation/continuation | Initiative only if canonical Initiative/handoff already exists or is explicitly authorized | “Dice initiative” → Initiative/Step 0 | Sí, handoff fields; ownership/authority separately | Initiative eligibility, permission, owner/activation authority | Initiative claim source, handoff version, user confirmation, unresolved gaps |
| Existing Portfolio continuation | Authenticated member with Portfolio scope | YES: Portfolio | Gobernar/revisar/activar/decidir | Portfolio Home/context | Explicit activation/invitation into a specific Initiative | Default Project/Steps from login or CTA | Context confirmation where pending; not re-registration | Membership/permission and decision authority per action | Portfolio context, membership, source snapshots, review state |
| Explicit Initiative handoff | Invitee/assigned Initiative Owner | YES: Initiative, or authorized handoff establishes it | Accept responsibility and work on that Initiative | Initiative Overview/pre-start; Steps only when lifecycle allows | Same person may also be Portfolio Lead, but must accept Initiative responsibility explicitly | Portfolio role alone → Steps; invitation without acceptance → active Steps | Yes: invitation/handoff acceptance and any activation gate | Initiative owner acceptance, permission, activation readiness, decision authority | Canonical Initiative ID, inviter/authority, invitation, acceptance, inherited lineage |
| Legacy Project/pilot continuation | Pilot claimant treated by legacy as Project owner | Pilot lead exists; Project may be created | Resume pilot proposal as Project | Compatibility Project/Steps route only | Existing pilot compatibility or explicitly authorized Initiative continuation | Treat pilot claim as current V2 Public Entry contract | Claim/auth confirmation; not sufficient for organizational authority | Legacy claim token + existing permissions; separate from V2 profile | Pilot code/claim token, lead/proposal snapshot, audit log, `pilotLeadId` |
| Returning provisional Public Entry | Returning registrant/authenticated session owner | NO canonical business entity; provisional handoff exists | Resume same context without repetition | Restore handoff → Portfolio-oriented confirmation | Explicit Initiative profile/handoff satisfying all gates | Reclassify by last message, registration or old draft | Confirm/correct provisional revision | Session ownership, target profile, permissions and authority | Versioned snapshot, provenance, open items, superseded revisions |
| Existing Initiative return | Existing authorized owner/participant | YES: Initiative/Project | Continue assigned Initiative work | Existing Initiative/Steps surface | Portfolio view for governance if separately permitted | Create a new Project from the returning session | Existing assignment/lifecycle gates, not Public Entry confirmation | Project/Initiative permissions and lifecycle | Existing entity ID, role assignment, lifecycle state, activity history |

## 7. Routing invariant

Routing must not be derived only from model interpretation, the word
“initiative”, sophistication, registration status, CTA/query parameters or the
last message. The durable routing inputs are:

1. canonical Portfolio/Initiative context;
2. explicit server-owned continuation profile;
3. explicit invitation/handoff and its issuer/authority;
4. accepted responsibility where Initiative work is involved;
5. permissions and activation/conversion eligibility;
6. user-confirmed provisional revision, without treating it as organizational truth.

`USER IDENTITY`, `BUSINESS ROLE` and `CURRENT JOB` are separate fields of the
decision. A person may occupy multiple roles in different contexts.

## 8. Portfolio-first invariant

```text
If Public Entry has no pre-existing canonical Initiative or explicit authorized
Initiative handoff, authenticated continuation defaults to Portfolio context.
```

**Evaluation: `SUPPORTED` as the current target invariant.** It is explicitly
supported by ADR-003, the Portfolio continuation contract and the reconciliation
audit. It is not yet a claim that the canonical registration integration is
implemented or approved: ADR-003 remains `PROPOSED`, and the checkout contains
legacy routes alongside candidate Portfolio services.

The operational refinement still required is a server-owned profile/context
audit, especially for invitation continuation and authenticated users whose
business role is unknown.

## 9. Legitimate Initiative / Steps exception

Direct Initiative/Steps continuation is legitimate only when all conditions below
hold:

1. A canonical Initiative/Project already exists for the user/context, **or** an
   explicit authorized handoff/invitation establishes that exact Initiative.
2. The session has an explicit `INITIATIVE_ENTRY` profile established before
   conversion; registration cannot establish it.
3. The handoff is present, versioned, provenance-linked and relevant fields are
   confirmed/corrected.
4. Conversion/continuation eligibility is true and the authenticated user owns
   the session and has required permission.
5. Initiative ownership, activation readiness, organizational authority and
   required approvals are satisfied separately.
6. The operation is idempotent and routed through the canonical
   Initiative/Project boundary.

Text such as “initiative”, a solution-first input, a user account, a public
claim, or a Portfolio Lead role alone does not satisfy these criteria. No new
rule is created here to preserve the legacy Project behavior.

## 10. Sponsor behavior

Sponsor is a combination of:

- contextual stakeholder associated with a Strategic Front, Challenge or
  Initiative;
- possible recipient of status, support or checkpoint context;
- possible decision authority only when the specific configured governance rule
  grants that authority.

Sponsor is **not** a default continuation destination for Public Entry and is
not automatically the Initiative Owner, day-to-day operator or universal
approver. The relevant decision authority must be resolved per decision,
scope, threshold and mandate.

## 11. Unknown profile / role handling

If authentication identifies the person but Starteria does not know the relevant
business role or canonical context:

- do not invent Portfolio Lead, Initiative Owner, Sponsor or owner status;
- preserve the provisional handoff, provenance, unresolved items and revision;
- enter Portfolio-oriented confirmation/continuation when no explicit Initiative
  context exists;
- ask for or resolve the missing context/permission through the proper boundary;
- do not create Project, Initiative, Step 0 or activation as a fallback.

If the user is authenticated but has no authorized Portfolio scope, the safe
behavior is a pending/confirmation state or an explicit handoff request—not a
silent Project conversion. The exact UI/API behavior remains an implementation
question outside this audit.

## 12. Legacy path audit

| Path/symbol | Embedded actor/job assumption | Classification | Treatment |
|---|---|---|---|
| `/auth/continue/:draftId` | A public proposal registrant can resume a draft/pilot signup after auth. The legacy consumer can continue toward a Project path. | `COMPATIBILITY_ONLY`; `DEPRECATION_TARGET` at Public Entry boundary | Keep only for existing consumers while replacement/profile audit is performed. It must not define new semantics. |
| `/public/continuar` | Holder of a pilot code is the person entitled to resume the submitted initiative. | `COMPATIBILITY_ONLY` | Resume-by-code only; no equivalence to canonical Portfolio handoff. |
| `/continuar-piloto` | Authenticated claimant is allowed to import the pilot proposal as their Project and proceed in Steps. | `COMPATIBILITY_ONLY`; `DEPRECATION_TARGET` as public default | Preserve for pilot compatibility; do not route new Public Entry by default. |
| `createProjectFromPublicDraft` | Authenticated user is the Project owner; public draft is sufficiently initiative-ready; Project/Step 0 is the immediate job. | `ROLE_ASSUMPTION_BUG` at the V2 Public Entry boundary; `DEPRECATION_TARGET` | Directly conflicts with provisional/no-canonicalization and Portfolio-first target. |
| Pilot claim / `consume-claim` | Claiming identity selects the account that owns the resulting Project; pilot proposal maps into Project/Step 0. | `COMPATIBILITY_ONLY` | Keep idempotent pilot compatibility only; preserve claim/proposal provenance. |
| `ProjectService.createProject` | Generic creation caller becomes `ownerId`; linked challenge can materialize Step 0; legacy public callers treat creation as continuation. | `VALID_ROLE_BASED_CONTINUATION` only for explicit Initiative flows; `ROLE_ASSUMPTION_BUG` when used as Public Entry default | Keep service for governed Initiative lifecycle; it cannot be the auth side effect of Public Entry. |

## 13. Compatibility-only paths and deprecation targets

Compatibility-only:

- `/auth/continue/:draftId` while it has live legacy consumers;
- `/public/continuar` and pilot-code resume;
- `/continuar-piloto` and `consume-claim` for already-supported pilots;
- `ProjectService.createProject` for existing explicit Initiative/productive
  flows, not as a Public Entry semantic owner.

Deprecation targets at the Public Entry boundary:

- direct public draft → Project/Step 0;
- `createProjectFromPublicDraft` from `AuthPage`;
- pilot claim as the default continuation of a new Public Entry;
- any route that maps registration alone to Project/Steps.

Existing Initiative/Steps surfaces remain valid for existing governed Initiative
work and explicit Initiative continuation.

## 14. Stale conflicts and ambiguous findings

The prior ADR-003 reconciliation reported two `STALE_CONFLICT` findings and two
`AMBIGUOUS` findings. This audit does not rewrite historical documents.

### 14.1 Stale conflicts resolved by this model

1. **“Post-entry contract absent.”** The contract exists at
   `doc/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md`;
   its status is proposed, not approved. The distinction is now explicit.
2. **Observed implementation confused with target authority.** The mixed
   checkout (candidate Portfolio continuation plus legacy Project/pilot paths)
   is current-state evidence; ADR-003’s Portfolio-first conditional model is
   the proposed target. Neither status is silently promoted.

### 14.2 Ambiguities clarified, not silently resolved

1. **Invitation continuation ownership:** the Activation/Handoff Contract
   defines invitee acceptance and Initiative ownership, but the concrete Public
   Entry → invitation route and permission chain remain unaudited. It cannot be
   merged with registration semantics by inference.
2. **Authenticated profile establishment:** auth/session identity and runtime
   platform roles exist, but a single server-owned mapping from identity to the
   relevant business context/profile for this boundary is not evidenced across
   all paths. This audit therefore requires explicit context/profile evidence
   before Initiative routing.

## 15. Unresolved ownership questions

- Which canonical object stores the server-owned continuation profile and its
  version for every Public Entry session?
- What exact invitation issuer/authority can establish `INITIATIVE_ENTRY`?
- Does an invitation identify an existing Initiative, or can it create a
  pre-start handoff without an Initiative ID?
- What minimum Portfolio membership/permission is required for an unknown-role
  authenticated user to enter Portfolio confirmation?
- Which configured authority resolves Challenge Owner / Strategic Front owner
  when those concepts appear in source material?
- When one person is both Portfolio Lead and Initiative Owner, where is the
  explicit acceptance of the second responsibility recorded?
- Which existing consumers of `/auth/continue/:draftId` remain live, and what is
  their retirement condition?

## 16. Handoff Contract readiness

```text
CONTINUATION_MATRIX_COMPLETE: YES
OWNERSHIP_PROFILE_MODEL_COMPLETE: NO
```

**Readiness: `READY_WITH_EXPLICIT_EXCEPTIONS`.**

One candidate Public Entry → Product Handoff Contract can now be defined for
the common Portfolio-first path, with an explicit Initiative exception and
legacy compatibility boundary. It is not ready to be treated as an approved
or implementation-authorizing contract until ADR-003 is accepted and the
invitation/profile ownership questions above are resolved or represented as
explicit contract states.

**Additional ADR required now: `NO`.** ADR-003 already contains the needed
product boundary. A separate ADR is required only if the invitation audit or
profile decision introduces a materially different authority model.

## 17. Recommended next slice

`ADR-003 acceptance + server-owned continuation profile and invitation route audit`

The slice should first inventory every registration, claim, invitation and
continuation consumer; establish explicit profile ownership and negative guards;
then define the candidate Product Handoff Contract. Legacy pilot paths should
remain compatibility-only until consumers and retirement conditions are proven.

## 18. Files changed

```text
docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONTINUATION_OWNERSHIP_PROFILE_AUDIT_v0.1.md
```

No runtime, route, DB, schema, Portfolio, Initiative, Steps or frozen Portfolio
Entry harness files were changed.

