# STARTERIA — PORTFOLIO_BOOTSTRAP_HOME_LOGIC_CONTRACT_v0.1

**Versión:** v0.1  
**Estado:** PROPUESTO PARA REVISIÓN  
**Vertical slice:** Portfolio Bootstrap + Portfolio Home V1  
**Usuario principal:** Portfolio Lead  
**Tipo:** Experience Logic Contract  
**Propósito:** Congelar la lógica de producto y gobernanza que permite continuar desde Portfolio Entry hacia un Portfolio Home útil, progresivo y orientado a decisión, sin convertir Home en un workspace de Initiative Owner.

---

# 0. Autoridad y subordinación

Este contrato está subordinado a:

1. `STARTERIA_CORE_LOGIC_CONTRACT`
2. ADRs aprobados aplicables
3. `ROLE_BOUNDARY_PORTFOLIO_LEAD_VS_INITIATIVE_OWNER`
4. `PORTFOLIO_LEAD_ANTI_DRIFT_GUARDRAILS`
5. `PORTFOLIO_LEAD_ACCEPTANCE_TESTS`

Y utiliza como referencias de experiencia:

- `STARTERIA_CRAZY8S_E2E_BASE_LOGIC_v0.1`
- Portfolio Entry contracts vigentes
- Portfolio Continuation / confirmed snapshot
- PRDs históricos de Portfolio Lead e importación únicamente cuando no contradigan autoridad superior
- hallazgos de entrevista con Catalina como evidencia de diseño, no como autoridad Core

Este documento NO puede redefinir silenciosamente:

- la separación Portfolio vs Initiative;
- la jerarquía canónica corporativa vigente;
- Step 0–4;
- autoridad humana;
- reglas de canonicalización;
- procedencia;
- activación de iniciativas;
- estados Core de evidencia;
- decisiones organizacionales.

Si una decisión de UX propuesta aquí entra en conflicto con un invariante Core:

```text
STOP
→ identificar conflicto
→ ADR CANDIDATE si se propone cambiar Core
→ resolver autoridad
→ actualizar contrato
```

---

# 1. Problema que resuelve este vertical slice

Portfolio Entry ya permite que Starteria comprenda inicialmente:

- qué intenta mover el usuario;
- qué decisión necesita habilitar;
- qué contexto conoce;
- qué contexto falta;
- qué lectura inicial recomienda;
- qué incertidumbre permanece;
- qué provenance tiene la información;
- qué fue confirmado antes del registro.

Después del registro y Portfolio Continuation, el problema ya NO es:

> “¿Qué quiere hacer este usuario?”

El problema pasa a ser:

> **¿Cómo convierte Starteria esa comprensión inicial en una primera capacidad real de gobernar un portafolio?**

Portfolio Home debe cerrar la transición entre:

```text
Starteria entendió mi situación
```

y:

```text
Starteria empieza a mostrarme
qué trabajo existe alrededor,
cómo se conecta,
qué falta,
qué podría impedir que avance,
y qué debería revisar ahora.
```

---

# 2. Usuario y Job principal

## 2.1 Usuario principal

`Portfolio Lead`

Pregunta primaria:

> **¿Estamos dedicando esfuerzo a las iniciativas correctas, conectadas con las prioridades correctas, con suficiente visibilidad, evidencia y condiciones para decidir qué hacer después?**

## 2.2 Job de Portfolio Bootstrap

> **Transformar contexto confirmado desde Entry + trabajo existente de la organización en una primera lectura gobernable del portafolio, sin exigir que el usuario reconstruya manualmente la ontología de Starteria.**

## 2.3 Job de Portfolio Home

Cuando existe poca estructura:

> **Ayudarme a construir visibilidad útil alrededor de lo que quiero mover.**

Cuando el portafolio ya tiene suficiente información:

> **Mostrarme qué requiere atención hoy y por qué.**

## 2.4 Job que NO pertenece a Home

> ¿Cómo desarrollamos, diseñamos, validamos o experimentamos esta iniciativa concreta?

Ese job pertenece al Initiative Owner y al Core de Iniciativas.

---

# 3. Tesis de producto de este slice

Portfolio Home NO es:

- una pantalla vacía después del registro;
- un dashboard de métricas ficticias;
- un launcher de Steps;
- un wizard de taxonomía;
- un gestor de proyectos;
- un backlog;
- una herramienta de tareas;
- un chat como superficie principal;
- una colección de entidades CRUD.

Portfolio Home es:

> **un workspace progresivo de gobernanza que conecta intención, trabajo existente, claridad, condiciones para avanzar, atención y decisiones.**

Flujo conceptual:

```text
INTENCIÓN CONFIRMADA
        ↓
TRABAJO EXISTENTE
        ↓
CONEXIÓN ESTRUCTURADA
        ↓
LO QUE SABEMOS / NO SABEMOS
        ↓
CONDICIONES QUE PODRÍAN IMPEDIR AVANCE
        ↓
ATENCIÓN
        ↓
DECISIÓN / SIGUIENTE MOVIMIENTO DE PORTFOLIO
```

---

# 4. Principios invariantes de experiencia

## PH-INV-01 — Home continúa desde Entry

Portfolio Home nunca debe comportarse como si el usuario empezara de cero.

Debe consumir el snapshot confirmado proveniente de Portfolio Entry / Portfolio Continuation.

Debe hacer visible, con lenguaje natural:

- qué entendió Starteria;
- qué fue confirmado;
- qué permanece provisional;
- qué falta;
- cuál es la siguiente acción recomendada.

## PH-INV-02 — Context first, objects second

La experiencia no obliga al usuario a empezar creando:

```text
Frente
→ Reto
→ Iniciativa
```

La estructura visible debe emerger progresivamente desde la realidad del usuario.

La ontología canónica puede existir por debajo, pero la UX utiliza la mínima estructura que genere valor.

## PH-INV-03 — El primer salto de valor es conectar intención con trabajo real

Cuando el anchor estratégico es suficientemente claro, la primera acción recomendada por defecto es:

> **incorporar o identificar el trabajo/iniciativas que ya existen alrededor de lo que se quiere mover.**

No es por defecto:

- crear frente;
- crear reto;
- crear iniciativa;
- abrir Step 0.

## PH-INV-04 — Si el anchor es insuficiente, no se fuerza incorporación prematura

Si todavía no existe suficiente claridad sobre resultado deseado, prioridad, decisión o señal interpretable, Home puede recomendar completar primero ese anchor.

Esto es una excepción gobernada por estado, no un onboarding obligatorio para todos.

## PH-INV-05 — Alignment y advancement son dimensiones distintas

Starteria debe distinguir:

### Strategic connection
> ¿Por qué existe este trabajo y con qué prioridad/resultado se relaciona?

De:

### Advancement conditions
> ¿Qué falta o qué podría impedir que este trabajo avance hacia una decisión o implementación?

Una iniciativa puede estar estratégicamente relacionada y, al mismo tiempo, no tener condiciones suficientes para avanzar.

## PH-INV-06 — Advancement conditions no es un score opaco

Starteria no debe resumir readiness como porcentaje, maturity score o semáforo sin explicación.

Debe mostrar condiciones observables.

```text
✓ resultado relacionado
? señal/KPI pendiente
! dependencia de Operaciones
? autoridad de decisión no identificada
```

## PH-INV-07 — IA propone; humano confirma; sistema registra

Patrón obligatorio:

```text
AI analysis
→ suggestion / proposed mutation
→ human review
→ explicit confirmation
→ canonical change
```

Nunca:

```text
AI_INFERRED
→ CANONICAL
```

## PH-INV-08 — Home no activa Initiative Core

Portfolio Home puede identificar una iniciativa, contextualizarla, revisar relación, registrar información, proponer owner y preparar activation readiness.

Portfolio Home NO puede activar automáticamente la iniciativa, asignar silenciosamente Initiative Owner, abrir automáticamente Step 0 ni asumir que una iniciativa importada debe entrar a Steps.

## PH-INV-09 — Home muestra síntesis ejecutiva, no ejecución detallada

Home puede mostrar estado, relación estratégica, evidencia disponible, gaps, bloqueos, dependencias, decisión pendiente y siguiente movimiento.

No muestra como centro de experiencia entrevistas, experimentos, prototipos, tareas, deliverables de Step o detalle metodológico.

## PH-INV-10 — Reto puede ocultarse en UX, no eliminarse del dominio silenciosamente

La UX puede representar casos simples como:

```text
Prioridad
→ Iniciativa
```

si introducir Reto no genera valor para el usuario.

Eso NO significa que Reto haya dejado de ser obligatorio a nivel Core.

Modificar esa regla requiere `ADR CANDIDATE`.

---

# 5. Entradas del contrato

## 5.1 Portfolio Entry confirmed snapshot

Puede incluir:

- `understanding`
- `desired_outcome`
- `decision_to_enable`
- `recommended_approach`
- `alternative_approaches`
- `known_context`
- `unresolved_context`
- `gap_resolution_map`
- `evidence_or_clarity_needed`
- `starteria_path`
- `recommended_cta`
- `provenance_summary`
- `handoff_status`

## 5.2 Portfolio Continuation

Debe aportar snapshot confirmado, identidad del usuario, organización/workspace cuando exista, provenance de confirmaciones y cambios realizados durante claim/continuation.

## 5.3 Información agregada después del registro

Puede llegar por input manual, lista pegada, archivo, futura conexión, contexto confirmado de organización, iniciativas existentes, evidencias y decisiones del sistema.

## 5.4 Información downstream

Cuando ya existen iniciativas operativas, Home puede consumir resúmenes estructurados de estado, owner, evidencia, bloqueos, dependencias, decisión requerida, contribución y signals.

No duplica el Core de Iniciativas.

---

# 6. Taxonomía de información y persistencia

Toda información material debe pertenecer a uno de estos estados conceptuales.

## RAW_ENTRY
Información original del usuario antes de interpretación. No es canónica por existir.

## EXTRACTED
Información identificada directamente desde una fuente. Debe conservar referencia a fuente.

## AI_INFERRED
Interpretación razonable, pero no declarada explícitamente. No puede mutar contexto canónico sin confirmación.

## AI_SUGGESTED
Propuesta generada por IA: KPI candidato, posible relación, posible overlap, estructura sugerida o siguiente acción. No es verdad organizacional.

## USER_CONFIRMED
Información confirmada explícitamente por una persona autorizada.

## CANONICAL
Estado vigente de un objeto gobernado. Debe conservar provenance, actor que confirmó, fecha, versión y relación con estado anterior cuando hubo cambio material.

## PENDING
Información necesaria o útil que todavía no está disponible. No debe inventarse para completar UI.

## CONFLICTING
Dos o más fuentes sostienen información materialmente incompatible. El conflicto debe hacerse visible. No resolver automáticamente.

---

# 7. Portfolio Anchor

## 7.1 Definición

`Portfolio Anchor` es la mínima referencia suficientemente clara que permite organizar trabajo alrededor de una intención.

Puede incluir:

- prioridad / resultado deseado;
- decisión a habilitar;
- KPI/señal cuando exista;
- horizonte cuando exista;
- contexto relevante;
- source/provenance.

No requiere que todos los campos estén completos.

## 7.2 Estados conceptuales

```text
anchor_insufficient
anchor_provisional
anchor_sufficient
anchor_confirmed
anchor_conflicting
```

## 7.3 Regla

`anchor_sufficient` NO significa estrategia corporativa aprobada, Frente Estratégico automáticamente creado, KPI definitivo o Challenge creado.

Significa únicamente que existe suficiente contexto para comenzar a organizar trabajo sin fabricar una intención.

---

# 7A. Bootstrap Experience Contract — B0–B5

Esta sección congela la secuencia de experiencia mínima para construir el portfolio inicial sin obligar al usuario a configurar la ontología de Starteria.

Principio rector:

> **Starteria pide información únicamente cuando mejora una lectura o decisión actual; no pide campos para completar el modelo de datos.**

La experiencia se organiza en seis momentos. No son Steps metodológicos ni un wizard rígido. Home puede adaptar o saltar un momento cuando el estado ya esté resuelto por información previa.

---

## B0 — Continue from Entry

### User job

> Reconocer que Starteria conserva lo ya entendido antes del registro.

### System job

- recuperar el confirmed snapshot;
- separar confirmado, provisional, pendiente y conflictivo;
- construir o actualizar el Portfolio Anchor;
- evitar repetir preguntas ya resueltas.

### Información indispensable

- intención / resultado / prioridad interpretable;
- contexto mínimo;
- provenance del snapshot.

### Información opcional

- KPI/señal;
- baseline;
- target;
- horizonte;
- sponsor;
- autoridad de decisión;
- restricciones.

### IA permitida

- resumir;
- organizar;
- señalar gaps;
- detectar conflicto.

### Human checkpoint

Confirmar o corregir únicamente cuando la interpretación material haya cambiado o siga siendo ambigua.

### Exit condition

Existe una lectura de anchor con estado explícito.

### Prohibido

- crear StrategicFront automáticamente;
- crear Challenge;
- crear Initiative;
- abrir Steps.

---

## B1 — Confirm / complete anchor

### User job

> Dar suficiente claridad para que Starteria pueda ordenar trabajo alrededor de lo que quiero mover.

### System job

Determinar si existe un anchor suficiente sin exigir estrategia completa.

### Información indispensable

1. qué se quiere mover;
2. contexto mínimo que permita interpretarlo.

### Información preferida pero no universalmente obligatoria

- decisión que se quiere habilitar;
- KPI o señal.

### Información opcional

- baseline;
- target;
- horizonte;
- sponsor;
- autoridad;
- restricciones.

### IA permitida

- proponer wording;
- sugerir KPI/señal como `AI_SUGGESTED`;
- señalar ambigüedad.

### Human checkpoint

Confirmación si se convierte una prioridad, señal o decisión en contexto canónico.

### Exit condition

`anchor_sufficient` o `anchor_confirmed`.

### Prohibido

- bloquear por ausencia de baseline/target cuando todavía no son necesarios;
- fabricar una métrica;
- crear Frente únicamente para completar estructura.

---

## B2 — Bring existing work

### User job

> Llevar a Starteria el trabajo que ya existe sin rehacerlo desde cero.

### System job

Ofrecer una entrada de bajo esfuerzo y preservar la fuente original.

### Vías P0 conceptuales

- pegar una lista/texto;
- añadir manualmente;
- declarar que todavía no existen iniciativas.

### Vías posteriores

- XLSX / CSV;
- documentos;
- conectores.

### Información mínima por work item

- nombre o descripción breve.

### Información deseable cuando exista

- qué intenta conseguir;
- estado aproximado;
- owner/área;
- señal/KPI;
- decisión pendiente;
- dependencia conocida.

### Regla de estado aproximado

Bootstrap no exige Step 0–4. Puede utilizar categorías simples como:

```text
idea / candidata
en marcha
pausada
terminada
no lo sé
```

### IA permitida

- detectar work items;
- extraer información explícita;
- mantener provenance.

### Human checkpoint

No se requiere confirmar cada extracción todavía.

### Exit condition

Existe al menos un work item detectado o el usuario declaró explícitamente que no existe trabajo actual.

### Prohibido

- publicar automáticamente;
- convertir cada elemento detectado en Initiative canónica;
- reconstruir Steps como requisito del bootstrap.

---

## B3 — AI provisional structuring

### User job

> Entender cómo Starteria interpreta lo que ya existe antes de adoptarlo como estructura.

### System job

Producir una lectura provisional explicable.

### Puede proponer

- iniciativas/work items detectados;
- relaciones con el Portfolio Anchor;
- agrupamientos/focos candidatos;
- posibles overlaps;
- señales/KPI mencionadas o candidatas;
- dependencias;
- decision-path gaps;
- información faltante.

### Output esperado

Cada propuesta material debe incluir, cuando corresponda:

- valor propuesto;
- fuente;
- rationale;
- uncertainty/confidence;
- estado `AI_INFERRED` o `AI_SUGGESTED`;
- información faltante.

### Human checkpoint

Todavía no se publica nada.

### Exit condition

Existe staging revisable.

### Prohibido

- declarar alineamiento como hecho;
- declarar duplicidad definitiva;
- crear objetos estratégicos definitivos;
- convertir gaps en blockers sin contexto del movimiento.

---

## B4 — Human material review

### User job

> Confirmar únicamente las decisiones estructurales que importan para gobernar el portfolio.

### System job

Reducir la carga de revisión a cambios materiales.

### Requiere confirmación humana cuando aplique

- publicación de work item como Initiative;
- relación estratégica material;
- creación de estructura estratégica propuesta;
- cambio de relación padre;
- alineamiento material;
- owner organizacional cuando se vuelva canónico.

### Acciones mínimas

- confirmar;
- corregir;
- dejar pendiente;
- descartar.

### No requiere confirmación individual

- orden visual;
- resumen no persistido;
- agrupamiento temporal;
- sugerencia que no muta estado.

### Exit condition

Existe un conjunto suficiente de información confirmada para publicar una primera estructura gobernable.

### Prohibido

- formularios extensos por iniciativa;
- obligar a resolver todos los gaps;
- exigir información metodológica de Initiative Owner.

---

## B5 — Publish first portfolio reading

### User job

> Obtener una primera lectura útil de qué trabajo existe, cómo se conecta y qué requiere atención.

### System job

Publicar únicamente información permitida por las reglas de canonicalización y generar una lectura de Portfolio.

### Primera lectura mínima

Debe poder mostrar:

1. qué se quiere mover;
2. trabajo identificado;
3. strategic connections confirmadas/provisionales diferenciadas;
4. información relevante pendiente;
5. advancement conditions relevantes;
6. señales de atención;
7. una next-best Portfolio action.

### Ejemplo de salida

```text
5 iniciativas identificadas
3 relacionadas claramente
1 relación necesita confirmación
1 sin conexión clara

También observamos:
2 sin señal/KPI identificable
1 dependencia relevante
1 decision path poco claro
1 posible solapamiento
```

### Human checkpoint

La publicación no equivale a activar ninguna iniciativa.

### Exit condition

Home puede operar al menos como `HOME-D — Portfolio inicial estructurado`.

### Prohibido

- activar Initiative Core;
- abrir Step 0;
- convertir actividad en impacto;
- presentar AI inference como verdad confirmada.

---

## 7A.1 Contrato mínimo de información del Bootstrap

La primera estructura de Portfolio puede existir con cuatro grupos:

```text
INTENT
¿Qué queremos mover?

WORK
¿Qué trabajo existe?

CONNECTION
¿Por qué creemos que está relacionado?

GOVERNANCE GAPS
¿Qué falta aclarar para poder decidir mejor?
```

Todo dato adicional incrementa calidad, pero no debe convertirse automáticamente en requisito de entrada.

## 7A.2 Capas de disclosure

### Nivel 1 — visible inmediatamente

Portfolio:
- qué queremos mover;
- decisión a habilitar cuando exista.

Work item:
- qué es;
- para qué parece existir;
- estado general.

### Nivel 2 — gobernanza

- KPI/señal;
- owner;
- relación estratégica;
- dependencia;
- decisión;
- evidencia disponible.

### Nivel 3 — profundidad

- baseline;
- target;
- fuentes;
- restricciones;
- stakeholders;
- capacidad;
- uncertainty;
- provenance;
- history.

## 7A.3 Restricción anti-Method leakage

Bootstrap no debe solicitar:

- hipótesis de solución;
- HMW;
- entrevistas;
- experimentos;
- prototipos;
- Test Cards;
- learning goals;
- plan de medición detallado;
- metodología de validación.

Si la interacción dominante empieza a responder “¿cómo vamos a validar/desarrollar esta iniciativa?”, existe Initiative Owner drift.

---

# 8. Strategic Connection

## 8.1 Propósito

Representar la relación entre trabajo/iniciativa y aquello que la organización intenta mover.

## 8.2 Estados conceptuales

```text
confirmed_alignment
probable_alignment
partial_alignment
alignment_unknown
possible_misalignment
confirmed_misalignment
out_of_current_priority
```

## 8.3 Reglas

- similitud semántica no prueba alineamiento;
- IA puede proponer `probable_alignment`;
- un humano autorizado confirma alineamiento material;
- toda relación material conserva rationale + provenance;
- una iniciativa puede permanecer temporalmente `alignment_unknown`.

## 8.4 No confundir

```text
aligned
!= valuable
!= validated
!= ready_to_execute
!= impacting_business
```

---

# 9. Advancement Conditions

## 9.1 Propósito

Mostrar las condiciones conocidas que permiten o dificultan que un objeto de Portfolio avance hacia una decisión o movimiento organizacional.

## 9.2 Dimensiones iniciales P0

### A. Business signal

```text
confirmed
proxy
suggested
unknown
conflicting
```

Pregunta: ¿Existe una señal/KPI suficientemente clara para saber qué debería cambiar?

### B. Decision path

```text
clear
partial
unknown
conflicting
```

Pregunta: ¿Sabemos qué decisión se quiere habilitar y quién tiene autoridad o participación material?

### C. Critical dependencies

```text
none_known
identified
unresolved
blocking
unknown
```

Ejemplos: IT, Data, Compliance, Legal, Procurement, Operations, Commercial, external partner.

### D. Required context / perspective

```text
sufficient_for_now
missing_context
missing_perspective
unknown
```

Pregunta: ¿Existe una perspectiva relevante todavía ausente para interpretar correctamente la iniciativa?

### E. Ownership visibility

```text
known
proposed
missing
conflicting
```

No equivale todavía a Activation Readiness del Core.

## 9.3 Regla de severidad

La ausencia de una condición NO bloquea universalmente.

Su impacto depende del movimiento que el usuario intenta realizar.

```text
exploración temprana
+ dependencia IT desconocida
→ puede continuar como riesgo visible

activación de piloto integrado
+ dependencia IT no resuelta
→ puede convertirse en blocker
```

---

# 10. Estados de experiencia de Portfolio Home

## HOME-A — Bootstrap / recién llegado

Condición: Entry confirmado, anchor disponible al menos parcialmente y pocas o ninguna iniciativa estructurada.

Debe mostrar:

1. qué entendió Starteria;
2. qué información está confirmada;
3. qué permanece abierto;
4. siguiente acción principal;
5. cómo empezará a construirse la visibilidad.

No debe mostrar métricas 0/0/0 como centro, gráficos vacíos, Steps o taxonomía completa.

## HOME-B — Anchor claro, sin trabajo incorporado

Condición: `anchor_sufficient` o `anchor_confirmed`; no existen iniciativas suficientes para lectura portfolio.

Acción principal:

> **Conectar el trabajo existente alrededor de esta prioridad.**

Opciones de experiencia: importar, pegar lista, añadir manualmente o declarar que todavía no existen iniciativas.

## HOME-C — Intake / trabajo detectado pendiente de revisión

Condición: existen elementos detectados; todavía no son todos canónicos.

Debe mostrar qué detectó Starteria, qué relación propone, qué falta, qué necesita confirmación, provenance y conflictos.

El staging es diferente del portfolio publicado.

## HOME-D — Portfolio inicial estructurado

Condición: existen iniciativas publicadas/confirmadas suficientes.

Debe empezar a mostrar strategic connection, possible overlap, gaps, missing business signal, unresolved dependencies, missing decision path, information conflicts y próximos movimientos.

## HOME-E — Portfolio activo

Job principal:

> **¿Qué requiere mi atención hoy?**

La prioridad visual cambia de bootstrap a atención.

Debe poder mostrar alertas materialmente relevantes, decisiones pendientes, cambios upstream, bloqueos, gaps, nuevas solicitudes e información que requiere revisión.

## HOME-F — Decision-ready

Condición: existe suficiente contexto/evidencia para preparar una decisión material.

Home debe hacer visible la decisión, mostrar rationale/evidencia disponible, identificar faltantes y dirigir al espacio de decisión correspondiente.

Home NO toma la decisión automáticamente.

---

# 11. Regla de next-best Portfolio action

Home debe intentar mostrar una sola acción primaria.

El ranking conceptual debe considerar:

1. ¿Existe anchor suficiente?
2. ¿Existe trabajo real incorporado?
3. ¿Existen relaciones estratégicas sin revisar?
4. ¿Existen advancement conditions críticas?
5. ¿Existe una decisión pendiente?
6. ¿Existe una contradicción material?
7. ¿Existe una alerta más urgente que el onboarding?

Ejemplos:

```text
anchor_insufficient
→ completar qué se quiere mover

anchor_sufficient + no initiatives
→ incorporar trabajo existente

initiatives_detected + mappings_unconfirmed
→ revisar propuesta de organización

portfolio_populated + critical_dependency
→ revisar dependencia

decision_ready
→ revisar decisión
```

No debe utilizar una secuencia fija para todos.

---

# 12. Information Architecture — lógica, no layout

## 12.1 Navegación primaria candidata

```text
Inicio
Prioridades
Iniciativas
Decisiones
Reportes
```

`Reto` no necesita ser navegación primaria V1. Puede emerger dentro de Prioridad cuando aporte estructura.

Esta es una decisión UX, no una modificación del dominio.

## 12.2 Workspace

El workspace actual debe contener información gobernada sobre el objeto/contexto seleccionado.

Puede incluir context summary, known/missing, objects, relations, attention, proposed changes y action.

## 12.3 Copilot

El Copilot es contextual al workspace, no la interfaz principal.

Su contrato específico se definirá en Fase 3.

---

# 13. Attention / Signals — taxonomía conceptual V1

Este contrato define semántica mínima, no engine.

## `misalignment`
Aparece cuando existe evidencia suficiente para cuestionar la relación entre iniciativa y prioridad. No se dispara solo por baja similitud textual.

## `possible_overlap`
Aparece cuando dos o más iniciativas podrían estar abordando problema/espacio similar, mecanismo similar, población/contexto similar o KPI/señal similar. Debe presentarse como hipótesis revisable, no como duplicado confirmado.

## `coverage_gap`
Aparece cuando existe una prioridad/reto reconocido y no hay trabajo suficiente o identificado abordando una parte material. No significa automáticamente “crear nueva iniciativa”.

## `blocker`
Aparece cuando una condición conocida impide materialmente el siguiente movimiento actual. Debe indicar qué bloquea, por qué importa, quién puede intervenir y qué movimiento queda afectado.

## `missing_evidence`
Aparece cuando una afirmación material o una decisión necesita evidencia que todavía no existe o no está trazada. No prescribe automáticamente un experimento.

## `decision_required`
Aparece cuando existe una elección organizacional pendiente que afecta continuidad, capacidad, prioridad, inversión, activación o cierre.

## `team_request`
Representa una solicitud explícita proveniente de Initiative/equipo. No debe mezclarse semánticamente con señales generadas por el sistema.

## `missing_business_signal`
Aparece cuando existe trabajo o reto, pero no está suficientemente claro qué señal/KPI permitiría evaluar su contribución.

## `unresolved_dependency`
Aparece cuando una dependencia relevante fue identificada, afecta un movimiento futuro y todavía no tiene resolución suficiente.

## `missing_decision_path`
Aparece cuando no está suficientemente claro qué decisión se necesita, quién debe participar, quién tiene autoridad o bajo qué condición se decidirá.

## `information_conflict`
Aparece cuando fuentes relevantes sostienen información incompatible. Nunca resolver mediante selección silenciosa.

---

# 14. IA en Portfolio Home

## 14.1 Puede

- interpretar contexto visible;
- resumir;
- detectar gaps;
- comparar iniciativas;
- proponer relaciones;
- detectar posibles overlaps;
- señalar contradicciones;
- sugerir business signals;
- identificar posibles dependencias;
- proponer next-best Portfolio action;
- preparar cambios;
- explicar por qué algo requiere atención;
- estructurar contenido no estructurado.

## 14.2 No puede

- canonicalizar inferencias;
- confirmar alineamiento;
- aprobar prioridad;
- aprobar reto;
- activar reto;
- activar iniciativa;
- asignar Initiative Owner sin confirmación;
- abrir Steps automáticamente;
- decidir inversión;
- decidir continuidad;
- inventar KPI;
- inventar evidencia;
- convertir ausencia de información en conclusión negativa;
- declarar duplicidad definitiva por similitud.

## 14.3 Explicabilidad mínima

Toda recomendación material debe poder mostrar:

```text
qué propone
por qué
qué información utilizó
qué falta
qué nivel de certeza/provenance tiene
qué acción humana corresponde
```

No requiere mostrar chain-of-thought.

---

# 15. Human checkpoints

Portfolio Lead o persona autorizada debe confirmar, según materialidad:

- prioridad / resultado material;
- KPI/señal cuando se vuelva canónica;
- mapping material de una iniciativa;
- alineamiento estratégico;
- creación/publicación de estructura propuesta;
- cambio de relación padre;
- activación;
- ownership organizacional;
- cambios materiales;
- decisión de continuidad/inversión/cierre.

No necesita confirmar cada resumen, cada reordenamiento visual, toda inferencia trivial o recomendaciones que no mutan estado.

---

# 16. Proposed mutations

Toda mutación preparada por IA debe existir conceptualmente como:

```text
ProposedMutation
├── target_object
├── mutation_type
├── current_value
├── proposed_value
├── rationale
├── source_refs[]
├── provenance
├── confidence / uncertainty
├── materiality
└── confirmation_required
```

Estados:

```text
proposed
reviewed
confirmed
rejected
superseded
expired
```

`confirmed` permite aplicar la mutación según reglas del objeto.

---

# 17. Bootstrap intake / incorporación de trabajo existente

## 17.1 Objetivo

Permitir al Portfolio Lead llevar a Starteria lo que ya existe sin rehacerlo manualmente.

## 17.2 Principio

```text
ingest
→ detect
→ structure provisionally
→ review
→ confirm
→ publish/canonicalize
```

No:

```text
ingest
→ auto-publish
```

## 17.3 V1 puede soportar conceptualmente

- texto pegado;
- lista manual;
- CSV/XLSX;
- otros formatos cuando el Tech Spec lo permita.

Este contrato no define parsers.

## 17.4 Resultado provisional

Puede identificar initiatives/work items, owners mencionados, posibles prioridades, señales, dependencias, decisiones, fuentes, relaciones candidatas y conflictos.

## 17.5 Regla

Incorporar trabajo existente NO obliga a reconstruir Step 0–4 en Home.

El estado metodológico detallado pertenece downstream y puede analizarse posteriormente cuando sea relevante.

---

# 18. Progressive disclosure

## 18.1 El usuario no debe aprender toda la taxonomía para empezar

Lenguaje preferido V1:

- prioridad;
- objetivo;
- foco;
- iniciativas;
- decisiones;
- atención.

Lenguaje Core como Frente Estratégico, Reto, Contribution Contract o Activation Readiness puede aparecer cuando sea necesario.

## 18.2 Reto emerge cuando aporta valor

Ejemplos:

- varias iniciativas responden a un mismo espacio;
- se necesita activar trabajo;
- se analiza cobertura;
- existen distintas respuestas;
- se necesita gobernar una decisión común.

## 18.3 No esconder consecuencias materiales

Progressive disclosure no significa ocultar provenance, incertidumbre, conflictos, estado de confirmación o autoridad.

---

# 19. Primeros 5 minutos — contrato de experiencia

## T+0
Usuario entra a Portfolio Home y debe reconocer continuidad: Starteria recuerda qué intentaba mover y qué confirmó antes de registrarse.

## T+30 segundos
Debe poder entender qué cree Starteria que quiere mover, qué está confirmado, qué falta y cuál es el siguiente paso.

## T+1 minuto
Debe comprender cómo conseguirá valor: conectar el trabajo real existente con esa intención.

## T+2 minutos
Debe poder ejecutar una acción de bajo esfuerzo: importar, pegar lista, añadir elementos o indicar que todavía no existen iniciativas.

## T+3–5 minutos
Si incorporó trabajo, Starteria debería poder producir una lectura provisional como:

```text
5 iniciativas detectadas

3 parecen relacionadas con esta prioridad
1 relación necesita confirmación
1 todavía no muestra una conexión clara

También observamos:
2 sin señal/KPI identificable
1 dependencia relevante
1 decisión de continuidad poco clara
1 posible solapamiento
```

Todo elemento debe conservar estado de confirmación/provenance.

### Outcome deseado

> **Starteria ya entiende qué quiero mover y ahora me está ayudando a ordenar el trabajo real alrededor de ello y a ver qué podría impedir que avance.**

---

# 20. Connections con otros espacios

## Prioridades
Home puede mostrar resumen, detectar gaps, navegar y proponer revisión. No redefine el contrato completo de Prioridades.

## Retos
Home puede mostrar cuando existen, exponer cobertura/attention y sugerir que falta estructura. No obliga a crear Reto por estética.

## Iniciativas
Home consume lectura ejecutiva. No se convierte en workspace operativo.

## Teams
Home puede mostrar owner, team request, missing perspective y dependencia. No gestiona tareas del equipo.

## Decisions
Home puede detectar/priorizar decisiones. La decisión se registra en su espacio/contrato correspondiente.

## Reports
Home puede dirigir a reportes o mostrar reportability gaps. No convierte Home en generador de decks.

## Steps
Solo downstream después de:

- iniciativa identificada/registrada;
- contextualización suficiente;
- activación explícita;
- Initiative Owner;
- transición consciente.

---

# 21. Restricciones V1

Portfolio Home V1 NO debe:

1. crear automáticamente un Frente desde Entry;
2. crear automáticamente un Reto;
3. crear automáticamente una Initiative canónica desde inferencia;
4. activar iniciativa;
5. abrir Step 0;
6. mostrar Steps como CTA principal;
7. pedir experimentos/prototipos;
8. convertirse en task manager;
9. mostrar gráficos ficticios;
10. producir health scores opacos;
11. usar maturity score organizacional;
12. implementar Contribution Requests complejos;
13. implementar workflow de colaboración completo;
14. resolver automáticamente conflicts;
15. tratar avance operativo como impacto;
16. tratar alineamiento como contribución probada;
17. tratar valor positivo como implementation readiness;
18. tratar implementation readiness como scale readiness;
19. exigir KPI definitivo en contextos exploratorios;
20. exigir Reto visible cuando no agrega valor;
21. duplicar detalle de Initiative Core;
22. inventar datos para llenar dashboard;
23. mostrar ceros vacíos como valor principal;
24. transformar cada gap en bloqueo;
25. construir un nuevo playbook metodológico de Portfolio.

---

# 22. Out of scope específico de v0.1

No se define aquí:

- schema técnico final;
- endpoints;
- DB;
- parsers;
- import pipeline;
- UI visual exacta;
- Copilot prompt;
- Copilot agent contract completo;
- alert engine;
- scoring;
- thresholds;
- notification engine;
- report generator;
- challenge readiness engine;
- maturity model;
- Steps reconstruction;
- integrations;
- permissions técnicos;
- analytics implementation.

---

# 23. Success criteria del producto

## 23.1 Comprensión

Un Portfolio Lead nuevo puede explicar:

> “Starteria entiende qué quiero mover, conecta el trabajo existente y me muestra qué requiere revisión o decisión.”

No debería describirlo únicamente como dashboard, gestor de proyectos, chatbot o metodología de innovación.

## 23.2 Continuidad

El usuario no siente que el registro destruyó el contexto obtenido en Entry.

## 23.3 Time to first portfolio value

En los primeros minutos, el usuario puede obtener una lectura útil sin tener que crear manualmente toda la jerarquía.

## 23.4 Next action clarity

El usuario identifica sin ayuda qué hacer a continuación.

## 23.5 Provenance integrity

Ninguna inferencia material aparece como confirmada sin provenance/estado.

## 23.6 Canonicalization safety

`AI_INFERRED` o `AI_SUGGESTED` nunca pasan silenciosamente a `CANONICAL`.

## 23.7 Portfolio Lead alignment

La experiencia prioriza alinear, mapear, comparar, revisar, gobernar, decidir y reportar.

## 23.8 Initiative Owner drift

Material drift = FAIL.

---

# 24. Métricas candidatas para validar el slice

No son todavía targets cerrados.

- `time_to_understand_home`
- `time_to_first_portfolio_value`
- `bootstrap_completion_rate`
- `initiative_intake_started`
- `initiative_intake_completed`
- `mapping_confirmation_rate`
- `correction_rate_of_ai_suggestions`
- `next_action_success_rate`
- `attention_item_open_rate`
- `attention_item_action_rate`
- `canonicalization_correction_rate`
- `user_confidence_in_provenance`
- `portfolio_lead_alignment`
- `initiative_owner_drift_rate`

---

# 25. Casos mínimos que el futuro Harness debe cubrir

1. recién registrado, sin iniciativas;
2. prioridad clara sin KPI;
3. portfolio-first con muchas iniciativas;
4. solution-first correctamente reverse-aligned;
5. reporting-first;
6. iniciativas con relación estratégica incierta;
7. posible overlap;
8. decisión pendiente;
9. fuentes contradictorias;
10. Copilot intenta mutar sin confirmación;
11. dependencia crítica sin resolver;
12. iniciativa alineada pero sin decision path;
13. iniciativa con señal positiva pero implementation conditions no resueltas;
14. usuario sin iniciativas todavía;
15. Reto no necesario visualmente en un caso simple;
16. Home intenta abrir Step 0 automáticamente — HARD FAIL.

Evaluadores mínimos:

```text
portfolio_lead_alignment
initiative_owner_drift
decision_usefulness
information_clarity
next_action_clarity
provenance_integrity
canonicalization_safety
advancement_condition_usefulness
ontology_overexposure
```

Material Initiative Owner drift impide PASS.

---

# 26. Anti-patterns

## AP-01 — CRUD onboarding

```text
create front
→ create challenge
→ create initiative
```

como secuencia obligatoria de primera experiencia.

## AP-02 — Empty dashboard

```text
0 priorities
0 challenges
0 initiatives
0 decisions
```

como centro de Home.

## AP-03 — Copilot as product

Chat dominante sin estructura persistente visible.

## AP-04 — AI auto-publish

Inferencia IA convertida directamente en objeto corporativo.

## AP-05 — Step leakage

Home recomienda experimentos, prototipos o Step 0.

## AP-06 — readiness score

Un número sustituye explicación de condiciones.

## AP-07 — activity = value

Número de iniciativas activas usado como proxy de contribución o impacto.

## AP-08 — collaboration bureaucracy

Forzar participantes/roles permanentes solo porque una perspectiva puede ser útil.

## AP-09 — ontology-first navigation

Exigir al usuario entender todos los objetos del Core para empezar.

---

# 27. Decisiones diferidas

Requieren contrato posterior, test o ADR:

1. campos exactos mínimos de Portfolio Anchor;
2. cuándo un anchor pasa de provisional a sufficient;
3. reglas exactas de severidad de advancement conditions;
4. cuándo dependency = blocker;
5. cuándo mostrar Reto explícitamente;
6. cómo representar una prioridad sin crear todavía StrategicFront canónico;
7. relación exacta entre Home intake y futuro ImportSession;
8. criterio exacto de publication/canonicalization de iniciativas importadas;
9. taxonomía final de attention signals;
10. ranking exacto de next-best action;
11. Copilot UX exacta;
12. mutation approval UX;
13. permission model;
14. organización multi-Portfolio Lead;
15. real-time team requests;
16. maturity/capability model;
17. cuándo reconstruir Step state para iniciativas existentes.

---

# 28. Definition of Done — Logic Contract

Antes de avanzar al Copilot Contract:

- [ ] rol Portfolio Lead preservado;
- [ ] Home continúa desde Entry;
- [ ] estados Home A–F aprobados;
- [ ] Portfolio Anchor aprobado;
- [ ] Strategic Connection aprobado;
- [ ] Advancement Conditions aprobado;
- [ ] provenance/canonicalization aprobados;
- [ ] next-best action lógica aprobada;
- [ ] attention taxonomy conceptual aprobada;
- [ ] human checkpoints aprobados;
- [ ] proposed mutations aprobadas;
- [ ] first-5-min journey aprobado;
- [ ] restrictions/out-of-scope aprobados;
- [ ] no conflicto conocido con Core;
- [ ] ADR candidates identificados;
- [ ] no existe Step leakage.

---

# 29. ADR Candidates

## ADR-CANDIDATE-01 — Optional Challenge in canonical domain

Solo activar si se propone que `Challenge/Reto` deje de ser obligatorio también en el modelo Core.

Este contrato NO toma esa decisión.

---

# 30. Principio final

> **Portfolio Home debe empezar desde lo que Starteria ya sabe, conectar esa intención con el trabajo real existente y hacer visible qué conexión, información o condición organizacional falta para que el Portfolio Lead pueda gobernar y decidir mejor.**

Y:

> **Home organiza y prepara decisiones de Portfolio; no desarrolla iniciativas.**
