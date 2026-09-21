# Calibración del dataset ADR-027

Estado: auditoría y evaluación experimental, 2026-09-20. No promueve contratos ni certifica producto V2.

## Alcance autorizado

Pedido: revisar los casos existentes y ampliar la evaluación. Slice del Manifest: Harness V2
(`ACTIVE TEST BASELINE candidate`, evidencia `TESTING`). Solo dataset, instrumentación de
evaluación, tests del evaluador y documentación. Las reglas de runtime no se modifican.

```text
V2_CHANGE_GUARDRAIL_CHECK
Slice: HARNESS_V2 / evaluación diagnóstica ADR-027
Authority: pedido del usuario; backend/docs/adr/ADR-027-methodology-agent-harness.md (Accepted)
Manifest status: baseline candidata; no promoción
Current route: harness.eval.runner → mocks GROUND/INTERPRET → diagnóstico → métricas
Legacy dependencies: get_agent_routing_hint como control mecánico Step 0
Semantic owner: UNKNOWN para autoridad productiva; MAY_DEFINE_NEW_BEHAVIOR: NO
V1 assumptions detected: entrada diagnóstica no equivale a Portfolio Entry ni crea objetos
Adapter required: no; únicamente infraestructura de evaluación
Tests protecting current behavior: test_harness_eval_runner.py (6 pasan antes del cambio)
Tests required for V2: esta evaluación no es conformidad integral V2
Authority conflict: rutas documentales ausentes; §26/§27 no localizados en la fuente
Proceed: YES para auditoría/dataset/evaluador; NO para redefinir producto
```

## Fuentes y alcance de su autoridad

- [ADR-027](../../../backend/docs/adr/ADR-027-methodology-agent-harness.md): estado `Accepted`.
  Define el diagnóstico, cortocircuitos, configuración y comparación mecánica.
- [Methodology OS v1](sources/Starteria_Agent_Methodology_OS_v1.md): copia exacta de
  `/home/orlando/Desktop/Dashboardstarteria/docs/methodology/Starteria_Agent_Methodology_OS_v1.md`.
  Estado original `canonical-draft`, conservado. §2–4 procedencia, §8–10 diagnóstico,
  §11 packs, §14 gates, §19 prohibiciones, §21 quince familias.
- [Ecosistema v1](sources/Starteria_Ecosistema_Logico_Metodologico_v1.md): copia exacta del
  mismo directorio; versión 1.0, sin declaración de aprobación. §4 separa dimensiones,
  §9 roles, §10 gates. Estas copias son referencias de auditoría, no nuevas autoridades.
- [Configuración ejecutable](../../../ai-service/harness/config/methodology.yaml): versión
  1.0.0; evidencia de implementación para mapeos de agentes/packs y umbrales.
- `CURRENT_STATE.md`, `STARTERIA_V2_MANIFEST.md`, `docs/STARTERIA_AUTHORITY.md` y guardrails
  V2: consultados. El Core v0.3 referenciado no está en su ruta canónica; el archivo
  `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` declara v0.2 «Por validar» y no
  sustituye silenciosamente v0.3. El mapa de la skill de autoridad también está desactualizado.

No hizo falta investigación externa: las etiquetas de Starteria se contrastan con sus propias
fuentes. Hyperresearch fue inspeccionado como herramienta opcional; no se ejecutó una búsqueda.

```text
CONFLICT
Contract: Methodology OS v1 (canonical-draft), índice §0–22
Requirement: expectativas trazables a secciones existentes
Current document/code: ADR-027 y dataset atribuyen concretos a §26 y pipeline a §27
Observed mismatch: esas secciones no están en las dos copias locales encontradas
Risk: ajustar etiquetas por resultados de un modelo y darles falsa autoridad documental
Recommended treatment: UPDATE referencias verificables; conservar incertidumbre explícita
Requires ADR: no para corregir evidencia; decisión documental si aparece otra versión
```

El diagnóstico `route` recomienda un agente para trabajar; no confirma una clasificación
corporativa, aprueba un Step, autoriza una inversión ni ejecuta un handoff. Esa frontera explica
por qué faltantes downstream no impiden toda investigación. Las decisiones fuertes siguen
sujetas a §6/§14 y no quedan certificadas por este dataset.

## Qué hace el sistema y qué evalúa esta suite

El repositorio combina gobernanza documental, Portfolio Lead/Entry, backend, frontend y
`ai-service`. Esta auditoría sigue el diagnóstico de ADR-027 dentro de `ai-service`; no
pretende certificar las demás superficies ni transformar Smart Entry en una puerta automática
hacia Steps. La frontera productiva Portfolio → Initiative sigue gobernada por sus contratos.

Recorrido comprobado:

```text
raw_input
  → INTAKE: normalizar request
  → GROUND: campos + procedencia; detectar conflictos/unknowns críticos
  → INTERPRET: perfil multidimensional provisional
  → CONFIRM: evaluar gates
       ├─ RequireConfirmation → EMIT confirm, sin agente
       ├─ Block → EMIT escalate, sin agente
       └─ Allow/Review
            → CLASSIFY_ROUTE: primera regla coincidente de methodology.yaml
            → METHOD_HINT: adjuntar pack/version
            → GATE: escanear rationale/condiciones de ruta
            → EMIT: decisión + trace
```

`run_classify_route` sobrescribe el Step del perfil según la tabla. Por eso horizonte y duración
no eligen Step. `run_method_hint` adjunta la versión del pack; no prueba que se haya cumplido
la evidencia requerida del pack. El orquestador puede usar una recomendación para invocar un
agente, pero la evaluación termina antes de ese trabajo downstream.

- `deterministic`: GROUND e INTERPRET desde fixtures; mide funcionamiento condicionado a ellos.
- `live`: GROUND e INTERPRET con modelo; mezcla calidad de extracción y de interpretación.
- `jev`: ambos brazos reciben GROUND del fixture, comparan clasificadores INTERPRET distintos.
  No mide extracción; se preservó esta funcionalidad existente del workspace.
- Baseline: lookup mecánico con Step 0, sin preguntas, extracción ni clasificación. Es un
  control débil explícito. Ganarle no demuestra superioridad frente a un LLM con un prompt
  competente, ni frente a un caller que ya conoce el Step.

## Revisión individual de los 12 casos originales

Se conservaron los 12 IDs y todos sus `raw_input`. Se cambiaron fixtures/expectativas con
razones documentales, antes de correr la suite ampliada.

| Caso | Veredicto y corrección | Fundamento |
|---|---|---|
| `ventas-growth` | `confirm` → `route`, **provisional**. Falta palanca, pero investigar puede descubrirla; retirar cita no comprobable a §26. Si aparece esa versión, readjudicar. | OS §10.1–2; falta de fuente para la obligación específica de confirmar ingresos/rotación/demanda. |
| `orden-compra` | Mantener research, **provisional**. Objetivo de reducir errores pasa a `inferred`. Retirar exigencia de `systemic`, H1 y pack sistémico sin alcance que los sustente. | OS §3, §10.3/5. Se agrega un caso transversal inequívoco para pack sistémico. |
| `excel-powerbi-ambiguo` | Confirmar. Migrar se registra como solución propuesta, no como resultado de negocio conocido; objetivo desconocido crítico. | OS §8.3, §10.2. |
| `piloto-reconstruct` | Reconstruir. Eliminar «resultados del piloto» como hecho extraído: no se aportaron resultados. `evidence=unknown`, no crítico para reconstrucción. | OS §2–3, §10.2, §19. |
| `idea-ambigua` | Mantener confirmación por objetivo ausente. Añadir sentinelas contra objetivos inventados. | OS §8.3/21. |
| `solucion-disfrazada` | Mantener confirmación. Chatbot no especifica resultado. Añadir contraste con implementación elegida y objetivo explícito. | OS §8.3/21. |
| `tarea-ligera` | Mantener ruta ligera y profundidad light. No puntuar correction ni H1 por defecto; no se suministran esos hechos. | OS §10.2/5, §19. |
| `proyecto-6-meses` | `route` → `confirm`. Un plazo y tres áreas no explican qué debe entregarse. Añadir contraste con resultado acordado. | OS §8.3; §10.2 exige resultado claro para plan_coordinate. |
| `datos-contradictorios` | Mantener confirmación. «Definir responsable» es inferencia; Ana/Beto son declaraciones relatadas. Retirar fuente ficticia `system`: no hubo acceso al sistema. | OS §3–4. |
| `readiness-bajo` | Mantener ruta para preparar implementación. Readiness es campo propio declarado, no baseline inferido. Eliminar activación artificial de `baseline_estimated`. | OS §3/10.2/21; Ecosistema §4 separa dimensiones. |
| `info-sensible` | Mantener escalación por red_line. No inventar persona decisora ni tratarlo como asesoría legal. | ADR-027 S.6; OS §15. |
| `dependencia-ti` | Mantener research como **provisional**. Falta aclarar si API es propuesta o decisión ya tomada. Contraste nuevo sí explicita implementación. | OS §10.2/14. |

La clasificación `supported` significa expectativa trazable a las reglas leídas, **no acuerdo
humano independiente**. `provisional` impide presentar esas tres etiquetas como verdad
inequívoca; el scorecard publica sus resultados por separado. Las dimensiones no declaradas en
`expected_*` no se puntúan: los valores que el schema obliga a incluir en INTERPRET no se
convierten automáticamente en etiquetas de oro.

## Cobertura nueva

Dataset v2.0.0: **36 casos**, 24 nuevos; 23 route, 11 confirm y 2 escalate. Cobertura temática
15/15 de OS §21, con seis rutas diagnósticas, cuatro estados de horizonte y packs explícitos
cuando la entrada permite exigirlos. La cobertura temática no prueba exhaustividad de cada regla.

| Familia §21 | Casos representativos |
|---|---|
| Idea ambigua | `idea-ambigua` |
| Solución disfrazada | `solucion-disfrazada`, contraste `chatbot-implementacion` |
| Tarea ligera | `tarea-ligera`, `datos-sinteticos` |
| Proyecto de seis meses | `proyecto-6-meses`, `proyecto-6-meses-acotado` |
| Implementación decidida | `chatbot-implementacion`, `powerbi-implementacion`, `formulario-implementacion` |
| Proceso sistémico | `proceso-sistemico` |
| Exploración de mercado | `exploracion-mercado`, `horizonte-h2`, `horizonte-h3` |
| Importada con gaps | `piloto-reconstruct`, `importada-con-gaps` |
| Datos contradictorios | `datos-contradictorios`, control `owner-coincidente` |
| Contexto desactualizado | `contexto-desactualizado` |
| Sobredimensionada | `iniciativa-sobredimensionada` |
| Readiness bajo | `readiness-bajo` |
| Decisión de cerrar | `decision-cerrar` (bloqueo de cierre sin autoridad, no cierre exitoso) |
| Dependencia de TI | `dependencia-ti`, `dependencia-ti-decidida` |
| Información sensible | `info-sensible`, `sensible-con-gaps` |

Adicionales: diseño frente a implementación; baseline inferido a partir de dos conteos frente
a baseline desconocido; cinco gaps con máximo tres preguntas; confianza no evaluable;
instrucciones adversariales sin objetivo; H1/H2/H3 con contexto de negocio explícito; plazo
largo que no permite inferir H3. Los contrastes no son todos pares mínimos de una sola variable:
varios aportan contexto adicional deliberadamente para volver inequívoca la ruta.

## Correcciones del evaluador

Antes, las seis pruebas iniciales pasaban, pero el test principal solo verificaba kind/agente.
Todos los `forbidden_facts` estaban vacíos y ningún caso exigía horizonte. Por tanto, un 100%
no detectaba varias de las diferencias descritas arriba.

Ahora:

- routing comprueba kind, ausencia de agente cuando se bloquea, agente y Step cuando se enruta;
- clasificación compara dimensiones declaradas y method pack, con denominador por dimensión;
- gates requieren las causas esperadas y 1–3 preguntas para confirmar;
- los tests inspeccionan el trace: bloqueo sin routing downstream, sin llamadas LLM y sin
  convertir campos a confirmed;
- sentinelas de hechos inventados aparecen en diez casos; solo esos casos con grounding
  observado votan en `hallucination_rate`; baseline sin extracción da `null`, no 0%;
- la precisión entre rutas de confianza alta considera también errores de clasificación;
- el grader no otorga PASS por puntaje a una ruta/pack incorrectos;
- las marcas por caso incluyen gates y clasificación, no solo nombre de agente;
- los reportes incluyen versión, procedencia, taxonomía, contrastes y separación de etiquetas
  supported/provisional. En una muestra parcial la cobertura se calcula para esa muestra.

## Límites y hallazgos abiertos

1. **No hay validación humana independiente de etiquetas.** Los tres casos provisionales son
   especialmente inadecuados para declarar error inequívoco de un modelo live. Se deben
   readjudicar con quien posee autoridad sobre metodología; no ajustar por mayoría de modelos.
2. **Hermético es condicional.** INTERPRET ya trae la ruta esperada. La precisión de clasificación
   100% en este modo comprueba replay/mapeo, no descubrimiento correcto. El caso adversarial
   tampoco demuestra resistencia real a prompt injection sin ejecutar GROUND live.
3. **Horizonte no es duración ni Step.** El dataset exige H1/H2/H3 únicamente donde el texto
   explicita distancia respecto al negocio actual. Un trimestre o seis meses no bastan.
4. **No todas las dimensiones se evalúan.** `intent`, `unit`, `uncertainty` y pertinencia semántica
   de preguntas/roles todavía no tienen un grader de acuerdo humano. Evitar afirmar que
   se certificó toda la clasificación multidimensional.
5. **Alucinación es un detector de substrings, no una tasa universal.** Puede omitir paráfrasis,
   hechos no enumerados y falsos negativos; una negación que contiene el sentinel puede
   producir falso positivo. No mide cobertura de procedencia ni factualidad general.
6. **Confianza no está calibrada probabilísticamente.** La métrica histórica denominada
   `confidence_calibration` es acierto entre decisiones high/route; no ECE, Brier ni fiabilidad
   de probabilidades. Ningún resultado permite afirmar «confianza calibrada al 100%».
7. **Calidad de siguiente acción es un proxy estructural.** Contar preguntas o campos no evalúa
   utilidad, elección del rol, ni prosa downstream. El score numérico no sustituye el verdict
   y los checks de routing/gates/clasificación.
8. **Scope de gates.** La configuración actual trata unidad inferida como soft gate, mientras
   OS §6/14 exige confirmación para decisiones fuertes. El runtime no garantiza la resolución
   del rol de escalación ni todos los campos de regularización de soft gates exigidos por OS §14.
   Esta suite interpreta route como recomendación diagnóstica, no autorización organizacional.
9. **Datos outdated.** El gate `critical_unknown` solo reconoce unknown. El caso nuevo muestra
   por separado el objetivo vigente desconocido; no prueba que un `outdated` aislado bloquee.
10. **Prohibiciones textuales.** El scanner actual revisa rationale/condiciones en la ruta normal;
    CONFIRM puede saltar esa etapa. Estos tests no certifican todo texto emitido ni prosa del
    agente downstream. Cualquier corrección del runtime requiere su propia slice.
11. **Cierre y Steps.** La tabla diagnóstica no contiene una ruta Step 4 de cierre/decisión. El
    caso de cierre prueba pedir autoridad/evidencia; no se inventó una implementación de cierre.
12. **Distribución sintética.** Las 36 entradas son ejemplos diseñados, sin datos de frecuencia
    productiva ni conjunto holdout. No se pueden extrapolar porcentajes a tráfico real.

```text
CONFLICT
Contract: Methodology OS §6/14 y ADR-027 S.4
Requirement: confirmación de interpretaciones decisionales; unidad no confirmada como bloqueo
Current document/code: methodology.yaml unit_inferred es soft gate (peso 0.15)
Observed mismatch: route puede emitirse con unidad inferida; soft gates no incluyen toda la regularización exigida
Risk: consumir una recomendación como autorización de decisión fuerte
Recommended treatment: KEEP diagnóstico experimental; ADD frontera y auditoría; decisión antes de cambiar gates de producto
Requires ADR: yes si se modifica la autoridad humana o el gating productivo
```

## Evidencia y reproducción

- Baseline de tests previo: 6/6 tests del evaluador pasaron con los 12 casos originales.
- Después: **129/129 tests** del harness, incluido evaluador, integración y compatibilidad Jev.
- Ruff: sin hallazgos en los seis archivos Python modificados/añadidos para la evaluación.
- [Scorecard legible](scorecard-deterministic-v2.md) y [JSON por caso](scorecard-deterministic-v2.json).
- Fixture routing/gates/clasificación: 36 casos sin fallos. Sentinelas: 0 hits en 10 casos
  medibles. **Cero llamadas LLM**; no se ejecutó evaluación live ni se midió precisión del modelo.
- Baseline mecánico: 3/36 aciertos kind/agente/Step (8.33%). La comparación usa una nueva
  composición de casos y criterios ampliados: no comparar porcentajes directamente con v1.

Desde `ai-service/`:

```bash
uv run --extra dev python -m pytest tests/test_harness_eval_runner.py tests/test_harness_dataset_calibration.py -q
uv run --extra dev python -m harness.eval.runner --mode deterministic --out harness/eval/out/scorecard-v2.json
```

Revisión estructural: `graft map`, contexto de GoldenCase/run_eval/scorecard y MCP codebase-memory
sobre `ai-service`, generación inicial `2026-09-20T14:58:47Z`, nivel Verify. Cobertura consultada
para dataset, runner, métricas, grader, contratos, etapas, epistemic, gates y tests del evaluador.
Los archivos examinados no tenían gaps registrados; cache y outputs de eval están excluidos del
grafo. Se leyeron las fuentes concretas para las afirmaciones materiales; la cobertura del grafo
no se considera prueba de completitud. Al finalizar, la cobertura detectó los archivos editados
como metadata_changed y el test nuevo como not_tracked respecto a la generación inicial;
se regeneraron ambos índices después de revisar las fuentes y ejecutar los tests.

Hashes SHA-256 de las referencias copiadas (sin modificaciones):

```text
13d7abb5341d0faf0ef7b23e78802fe2c2f3e9d157d6f5ec78b8ef39b2641acd  Starteria_Agent_Methodology_OS_v1.md
bf33314fc4d88f4cd1b97f34944905914ab39f2d2e8fe2877f16fc28e2881019  Starteria_Ecosistema_Logico_Metodologico_v1.md
```

```text
V2_CHANGE_CLOSURE_CHECK
V2 contract satisfied: evaluación experimental documentada; no certificación funcional V2
V2 route active: no se modificó ruta productiva
V1 consumer remaining: baseline mecánico conservado como control explícito
Legacy compatibility documented: ADR-027 y este informe
E2E passed: no E2E de producto ejecutado; tests de integración del harness pasan
Manifest updated: no promoción de autoridad ni cambio de estado productivo
Retirement action: KEEP_COMPAT
Migration status: PARTIAL; alcance de auditoría/dataset completado
```
