# Starteria - Instrucciones del proyecto

## Comienza aqui
- La app vive en `front/`.
- Para iniciar frontend y backend juntos, usa `npm run dev:all` desde `front/`.
- Antes de marcar un trabajo como completo, ejecuta `npm test` desde `front/`.
- Los comandos de shell deben ejecutarse con prefijo `rtk`.

## Que es este producto
Starteria es una plataforma guiada para disenar iniciativas de intraemprendimiento desde un problema real hasta una propuesta probada y presentada con claridad.

No debe comportarse como un CRUD, ni como un formulario plano. Debe sentirse como un playbook secuencial con guia, claridad, criterios de validacion y progreso visible.

## Regla de autoridad
La implementacion actual no es autoridad de producto. Cuando haya diferencias entre documentos, gobierna este orden:

1. `docs/STARTERIA_AUTHORITY.md`
2. Core Contract: `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
3. ADRs aprobados relevantes
4. Experience Logic Contracts
5. Agent Contracts
6. Skill Contracts
7. Tech Specs
8. PRDs
9. Prototipos, mockups y prompts experimentales
10. Implementacion actual

Si un archivo obligatorio no existe en la ruta esperada, localizalo antes de implementar. Si no puede localizarse, reportalo como bloqueo de autoridad para el cambio afectado.

## Orden obligatorio de lectura
Antes de modificar comportamiento de producto:

1. Lee `docs/STARTERIA_AUTHORITY.md`.
2. Lee `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`.
3. Lee `docs/core/STARTERIA_CRAZY8S_E2E_BASE_LOGIC_v0.1.md`.
4. Lee `docs/governance/STARTERIA_DEVELOPMENT_HARNESS_v0.1.md`.
5. Lee el Experience Logic Contract afectado, por ejemplo `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`.
6. Lee ADRs aprobados relevantes.
7. Lee Agent Contracts y Skill Contracts si existen.
8. Lee Tech Specs si existen.
9. Inspecciona la implementacion actual.
10. Ejecuta pruebas baseline relevantes.

No implementes antes de completar esta secuencia o reportar explicitamente cualquier archivo faltante.

## Protocolo de conflicto
Si la implementacion contradice una autoridad superior, deten el cambio afectado y reporta:

```text
CONFLICT
Contract:
Requirement:
Current implementation:
Observed mismatch:
Risk:
Recommended treatment:
KEEP / ADAPT / REMOVE / NEW
Requires ADR: yes/no
```

No resuelvas conflictos de producto de forma silenciosa.

## Protocolo ADR
Marca `Requires ADR: yes` antes de implementar si el cambio:

- modifica un invariante Core;
- cambia una relacion o cardinalidad canonica de dominio;
- vuelve opcional Challenge en el dominio corporativo;
- expande autoridad organizacional de IA;
- altera autoridad humana de decision;
- modifica funciones estables de Step 0-4;
- modifica Adaptive Cycle o semantica de gating;
- canonicaliza automaticamente inferencias de IA;
- requiere una migracion material de dominio.

No trates esos cambios como refactors normales.

## Como debe trabajar el agente
Antes de editar cualquier pantalla o componente:

1. Identifica que step y modulo estas modificando.
2. Explica el objetivo funcional de ese modulo.
3. Explica que no debe romperse del flujo actual.
4. Propon el ajuste UX/UI y UX Writing.
5. Luego implementa el cambio.

## Reglas de diseno
- Mantener la narrativa secuencial por steps.
- No crear pantallas nuevas si el ajuste puede resolverse en el flujo actual.
- Mostrar con claridad que esta bloqueado, que falta y que sigue.
- Mantener visible la informacion ancla cuando un modulo depende de informacion previa.
- Priorizar claridad, acompanamiento y progresion.

## Reglas de UX Writing
- Escribir en espanol latino claro.
- Evitar spanglish innecesario.
- Evitar copy generico.
- Todo texto debe ayudar a entender, decidir o avanzar.
- Cuando haya feedback IA, mostrar:
  - que esta bien
  - que falta
  - siguiente accion recomendada

## Reglas de IA
La IA puede sugerir, analizar, refinar y orientar, pero no debe inventar evidencia ni asumir validaciones no realizadas.

La IA puede:
- extraer;
- clasificar;
- inferir;
- identificar ambiguedad;
- identificar contexto faltante;
- sugerir;
- planear siguientes preguntas.

La IA no puede:
- confirmar estrategia;
- confirmar alineamiento;
- inventar KPI, baseline, target o evidencia;
- crear objetos corporativos canonicos;
- decidir continuidad, inversion o cierre;
- activar Steps;
- convertir inferencias en estado confirmado por el usuario.

## Portfolio Entry - bloqueo de alcance
Para `Pantalla 1 - Portfolio Entry / Landing publica`, el contrato activo es `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`.

Este slice es pre-Core. Solo puede crear estado provisional definido por contrato y no debe crear:

- Organization
- StrategicFront
- Challenge
- Initiative
- Step
- Decision

Tampoco debe modificar:

- comportamiento de Step 0-4;
- Adaptive Cycle;
- checkpoint logic;
- Step sufficiency;
- transition gating;
- Initiative Cycle semantics;
- cardinalidad del dominio corporativo.

## Portfolio Entry - doctrina de implementacion
No reconstruyas `/public/start` desde cero por defecto. Primero audita la implementacion actual y clasifica cada elemento relevante como:

- `KEEP`
- `ADAPT`
- `REMOVE`
- `NEW`

Preserva infraestructura reutilizable si no codifica logica de producto obsoleta: shell publico, layout primitives, design tokens, textarea, botones, auth link, analytics y estados genericos de loading/error.

Evalua contra contrato cualquier comportamiento de producto: headline initiative-first, carga de PDF, submit actual, conversion a Initiative, redireccion a Step 0 y semantica de draft.

No reutilices un modelo existente solo porque su nombre se parece. Antes de mapear `PortfolioEntryDraft` a `PublicDraft`, compara lifecycle, semantica, provenance, conversion, ownership, expiracion y dependencias downstream.

## Portfolio Entry - reporte previo obligatorio
Antes de editar Portfolio Entry, crea `PORTFOLIO_ENTRY_CURRENT_STATE_AUDIT.md` y espera revision antes de implementar.

El reporte debe incluir:

- rutas encontradas;
- componentes frontend;
- state management;
- flujo backend actual;
- modelos de persistencia;
- APIs;
- llamadas y prompts IA actuales;
- analytics;
- tests;
- dependencias hacia Initiative / Step 0;
- matriz `KEEP / ADAPT / REMOVE / NEW`;
- conflictos de contrato identificados;
- candidatos ADR;
- slices de implementacion recomendados.

## Contexto funcional
La logica detallada del producto esta en:
- `docs/starteria-step-logic.md`
- `docs/starteria-ux-writing.md`
- `docs/starteria-review-rules.md`
- `docs/STARTERIA_AUTHORITY.md`
- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- `docs/core/STARTERIA_CRAZY8S_E2E_BASE_LOGIC_v0.1.md`
- `docs/governance/STARTERIA_DEVELOPMENT_HARNESS_v0.1.md`
- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md`

## Reglas tecnicas de texto y codificacion
- Todos los archivos de texto deben mantenerse en UTF-8.
- No introducir emojis ni simbolos decorativos dentro de strings visibles en la UI.
- No usar caracteres Unicode decorativos hardcodeados en labels, titulos, badges o pills.
- Si se necesita un icono visual, usar componentes de icono, no texto pegado.
- No reescribir copy existente fuera de la seccion solicitada.
- Si se modifican strings en espanol, validar que no aparezcan mojibake ni caracteres de reemplazo.
