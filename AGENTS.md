# AGENTS.md

Entrada neutral para Codex y otros agentes que trabajen sobre este repositorio.

## Naturaleza del repositorio

Este repositorio debe leerse actualmente como un repositorio mixto de Starteria:

- conserva harness publico, contratos, auditorias, estado documental y trazabilidad;
- contiene tambien una superficie de implementacion frontend/backend con tests y E2E;
- la evolucion productiva no queda autorizada por mera presencia de codigo, sino por decision explicita, alcance documentado y lectura de autoridad.

Las slices DS-05 y DS-06 documentan una decision explicita de modificar superficies frontend de producto bajo `front/` sin cambiar Core, backend, esquemas, rutas ni semantica de producto.

No tratar este repositorio como runtime productivo certificado por defecto. Tratarlo como checkout mixto con autoridad documental y con implementacion frontend autorizable por slice cuando exista decision explicita.

## Flujo obligatorio para cada pedido nuevo

Todo pedido nuevo (feature, bug, cambio, idea dicha en una daily) entra por este flujo **antes** de
escribir codigo. Sin HU en Jira no se implementa.

El equipo trabaja en dos frentes y la HU los separa:

- **[Funcional]**: producto. El que y el para que: historia, criterios de aceptacion, reglas de negocio, contrato de `doc/` que manda.
- **[Tecnica]**: desarrollo. El como: areas del repo, enfoque, rebanadas verticales, tests, guardrail V2.

```text
1. clasificar      Jev propone pregunta | acotado | grande; el agente verifica en el repo
                   (si hay duda, el mas pesado; si Jev falla, a mano)
2. grill           entrevista por rondas, cada pregunta marcada [F] o [T]    <- la persona confirma
                   preguntas [F] sin quien las conteste -> estado/hu/<slug>.cuestionario.md
3. brief           estado/hu/<slug>.brief.md                                <- la persona lo aprueba
4. planificar      agente delivery-planner -> estado/hu/<slug>.json -> dry-run
5. crear en Jira   jira-hu-crear.mjs --aplicar                              <- la persona confirma
6. implementar     recien ahora, subtarea [Tecnica] por subtarea, respetando sus bloqueos
7. PR              /pr: cierra la HU (KAN-nnn), CA tildados contra el diff, resumen visual,
                   evidencia antes/despues, peligro de mergear      <- la persona aprueba abrirlo
```

En Claude Code todo eso es un comando: `/hu <el pedido>` (`.claude/skills/hu/SKILL.md`), que
despacha al agente `.claude/agents/delivery-planner.md` y usa la skill `.claude/skills/jira-hu/`.
Otros agentes siguen los mismos pasos leyendo esos tres archivos.

La clasificacion la hace Jev (`.claude/skills/hu/tools/jev-clasificar.mjs`) con preguntas atomicas
sobre el texto, y la clase se deriva en codigo (`docs/analisis-jev/99-donde-no-aplica.md`). Es una
propuesta que se anuncia y la persona corrige.

Reglas que no se saltean:

- **No saltear la entrevista** porque el pedido "ya esta claro": si esta claro, se vacia en una ronda.
- **Los hechos los busca el agente, las decisiones son de la persona.** Nada inventado: lo que no tiene fuente va como `SUPUESTO` o `SIN RESOLVER`.
- **Nunca crear, mover ni cerrar tickets en Jira sin el si explicito** de la persona sobre ese plan.
- **Un pedido que ya tiene HU** (`KAN-nnn`) no se duplica: se lee con `jira-hu.mjs` y se continua desde ahi.
- **Todo PR cierra una HU de Jira** con la plantilla de `.github/PULL_REQUEST_TEMPLATE.md` (la llena `/pr`). Rama: `<tipo>/KAN-nnn-<slug>`. Un PR sin HU se salto el flujo.
- Implementar una subtarea [Tecnica] sigue sujeto a la jerarquia de autoridad y al `V2_CHANGE_GUARDRAIL_CHECK` de abajo.

## Regla de incorporacion productiva controlada

No incorporar, restaurar, copiar ni crear codigo productivo en este repositorio sin una decision explicita y documentada.

Prohibido por defecto, salvo autorizacion explicita de la slice:

- backend productivo;
- frontend productivo;
- Prisma o migraciones productivas;
- runtime de IA productiva;
- tests productivos o E2E productivos;
- secretos, datos reales, dumps, artefactos privados o credenciales.

Los cambios permitidos por defecto son documentales: contratos, harness, auditorias, indices, estado actual, trazabilidad, ADRs documentales y notas de seguridad.

Los cambios frontend de producto estan permitidos solo cuando el pedido declare una slice productiva concreta, lea la autoridad aplicable, preserve Core/AI/permisos/semantica de producto, y deje reporte de implementacion. Los cambios backend, Prisma, IA productiva o Core siguen requiriendo autoridad explicita propia.

## Jerarquia de autoridad

Cuando haya conflicto entre documentos, aplicar este orden y conservar el estado declarado de cada documento:

1. `docs/STARTERIA_AUTHORITY.md`
2. Core Contract, en su estado factual real: `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
3. ADRs de producto aprobados en `docs/product-adr/`
4. Experience Logic Contracts aprobados
5. Agent Contracts
6. Skill Contracts
7. Tech Specs
8. PRDs
9. Prototipos, mockups, prompts experimentales y reportes historicos
10. Implementacion historica presente en el arbol

La presencia de un contrato en este repositorio no lo convierte en aprobado. Mantener siempre su estado: candidate, proposed, approved, deprecated, superseded o historical.

## Contrato activo de Portfolio Entry

Para Portfolio Entry, usar una sola autoridad:

`doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`

No crear otro `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` paralelo si duplica ese contrato. Si el checkout productivo contiene una version aprobada distinta, registrar la diferencia en `CURRENT_STATE.md` o en una auditoria antes de copiar o reemplazar contenido.

## Strategic Framing

Before modifying Portfolio Lead strategic framing behavior, read:

- `docs/STARTERIA_AUTHORITY.md`
- `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
- `docs/portfolio-lead/07-strategic-framing/STRATEGIC_FRAMING_CONTEXT_v0.1.md`

Preserve:

- Core v0.2 as current factual authority;
- human authority;
- adaptive framing depth;
- Strategic Lenses are not mandatory canonical entities;
- Copilot is optional for completing framing;
- AI observations do not automatically create Challenges;
- gaps may remain in observation;
- mental models SF-MM-01...07 must remain traceable to contracts, acceptance tests and implementation slices.

Stop and classify as ADR candidate if implementation requires changing canonical Core/domain semantics.

## Separacion de ADRs

- `docs/adr/` conserva ADRs del harness/documentacion.
- `docs/product-adr/` conserva el indice y la serie de ADRs de producto.
- No mezclar ADRs de producto con `docs/adr/ADR-001...007` del harness.

## Documentos legacy

Todo documento historico o legacy debe abrir con un banner `DEPRECATED`, `SUPERSEDED` o `HISTORICAL`, enlazando a:

- `CURRENT_STATE.md`
- el reemplazo vigente, si existe.

Si el reemplazo vigente no existe, indicarlo de forma explicita en el banner.

## Antes de modificar

Todo cambio de Starteria debe comenzar leyendo, en este orden:

1. `CURRENT_STATE.md`.
2. `STARTERIA_V2_MANIFEST.md`.
3. `docs/STARTERIA_AUTHORITY.md`.
4. `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`.
5. ADRs de producto aprobados relevantes.
6. Experience Contract del slice afectado.
7. Agent / Skill Contracts aplicables.
8. Tech Spec aplicable, si existe.
9. `docs/design-system/STARTERIA_DESIGN_SYSTEM_V2_RESTRUCTURE_BASELINE.md` si el cambio afecta frontend o experiencia visual.
10. `docs/governance/STARTERIA_V2_MIGRATION_GUARDRAILS.md`.
11. `docs/governance/STARTERIA_V2_IMPLEMENTATION_PLAYBOOK.md`.
12. Implementacion actual y tests existentes.

### Regla V2-only

Todo desarrollo nuevo debe corresponder a un slice registrado en `STARTERIA_V2_MANIFEST.md`.

Un artefacto marcado como:

- `HISTORICAL`
- `SUPERSEDED`
- `DEPRECATED`
- `V1_LEGACY`

no puede utilizarse para definir comportamiento nuevo.

Puede consultarse unicamente para:

- dependencias de migracion;
- compatibilidad;
- infraestructura reusable;
- comprension de regresiones;
- trazabilidad historica.

La infraestructura V1 puede reutilizarse cuando corresponda.

La semantica V1 no puede recuperar autoridad por el hecho de estar implementada.

Antes de reutilizar codigo legacy debe clasificarse:

```text
SEMANTIC_OWNER:
V2
LEGACY_COMPAT
UNKNOWN

MAY_DEFINE_NEW_BEHAVIOR:
YES
NO
```

`UNKNOWN` bloquea cambios funcionales hasta realizar auditoria.

### Cambio productivo

Antes de editar codigo productivo, producir el check definido en:

`docs/governance/STARTERIA_V2_MIGRATION_GUARDRAILS.md`

```text
V2_CHANGE_GUARDRAIL_CHECK
```

y seguir el proceso de slice de:

`docs/governance/STARTERIA_V2_IMPLEMENTATION_PLAYBOOK.md`.

Una migracion visual por si sola NO significa que el slice haya migrado a V2.

## Protocolo de conflicto

Si una fuente contradice una autoridad superior, reportar:

```text
CONFLICT
Contract:
Requirement:
Current document/code:
Observed mismatch:
Risk:
Recommended treatment:
KEEP / UPDATE / ADD / DEPRECATE
Requires ADR: yes/no
```

No resolver conflictos de producto de forma silenciosa.
