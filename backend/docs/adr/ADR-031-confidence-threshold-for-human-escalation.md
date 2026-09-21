# ADR-031: Umbral de confianza para escalar a un humano

## Status

Accepted — 2026-09-20. Aprobado expresamente por el responsable en esta sesión:
«activa el INTERPRET DE JEV aprueba el ADR, y activa la reglas para el cambio funcional».
Implementación y guardrail del slice en
[13 — Activación](../../../docs/analisis-jev/13-adr-031-activation.md).

Aprueba Jev como backend por defecto de INTERPRET dentro del harness y la separación de
`unit` del score de ruta. Se mantiene **0.50 como corte operativo provisional** para ambas
preguntas; su riesgo en tráfico real no está certificado. El selector `llm` conserva la
ruta anterior como mecanismo de rollback.

Complementa ADR-027 (`Accepted — 2026-07-24`) sin alterar sus hard gates categóricos.
El [informe de investigación revisado](../../../docs/analisis-jev/11-confidence-gate-decision.md)
contiene garantías, supuestos, tamaños de muestra, fuentes y conflictos de autoridad.

## Updated

2026-09-20 — INTERPRET pasa a **fail-open**. Ante un `JevError` (clave ausente, timeout,
429, respuesta malformada) la etapa cae al backend `llm` en vez de abortar el diagnóstico.

Qué cambió respecto de lo aprobado arriba:

- `harness/harness.py` ya **no** aborta `diagnose()` cuando falta la clave de Jev; registra
  un `WARNING` y continúa. La intención original de esa guarda —no pagar la etapa GROUND en
  una corrida que no puede terminar— deja de aplicar cuando la corrida **sí** termina por el
  backend de rollback.
- `harness/stages/llm_stages.py` captura `JevError` y reintenta por `_interpret_via_llm()`.
  Cualquier otra excepción sigue propagando: fail-open cubre que un tercero esté caído, no
  defectos propios.
- El rastro de auditoría distingue los dos caminos sin campo nuevo: en el fallback,
  `model_provider` y `model_id` conservan los valores del LLM y **no** ganan el marcador
  `+typesafe:`.
- `tests/test_harness_integration.py::test_diagnose_fails_closed_without_jev_key` se
  reemplazó por `test_diagnose_falls_open_to_llm_without_jev_key`. El contrato anterior
  quedó registrado en el docstring del nuevo test.

Motivo: Jev está en el camino crítico de **todo** diagnóstico. El guardrail de `cd.yml`
cubre desplegar sin la clave, pero no la API caída, un timeout bajo carga ni un 429. Es la
misma postura fail-open que ya toman `CostTracker` ante un modelo sin precio y el router de
`jev-router` (*"Jev failure never blocks the CLI"*).

Costo de la decisión: una corrida degradada produce una clasificación de **menor calidad
medida** —`challenge_type` y `depth` son peores en el LLM en algunas dimensiones— sin
interrumpir al usuario. Se prefiere eso a un 503.

2026-09-21 — **Se separa probabilidad de confianza** en el `RouteProfile`.

`docs/jev/confidence.md` distingue dos cantidades que la integración estaba colapsando:

| Campo | Qué es |
|---|---|
| `selected_probabilities` | P de la opción ganadora. **Es lo que RLCD calibra** y lo único que puede mostrarse a un usuario como "la probabilidad que Jev le da a esta ruta". |
| `confidence_scores` | Estadístico **derivado** de la forma de la distribución — *"collapses that shape into a single number"*. TypeSafe lo entrega para poder gatear sin hacer la cuenta. **No es P(acierto).** |
| `probability_distributions` | La distribución completa por pregunta. |

El código guardaba `confidence` bajo el nombre `confidence_scores` —correcto, pero ambiguo
junto a nada más— y **descartaba las probabilidades**, que es justamente lo que el doc dice
que se entrega para poder usar otra medida: *"you are never locked into our definition...
which is exactly why we give you the full `probabilities`"*. Ese campo, además, **no lo leía
nadie**: el único uso en todo el repo era la escritura.

Se conserva la distribución completa para poder calcular después margen sobre la segunda
opción, entropía o una curva de fiabilidad **sin volver a llamar (ni pagar) a Jev**.

**El gate sigue leyendo `confidence`, no la probabilidad.** Dos razones: es la señal que
TypeSafe documenta para umbralizar, y localmente ordenó bien los 23 casos `route` —los dos
fallos fueron sus dos valores más bajos—. Cambiarlo a `probabilities[choice]` exige su propia
evidencia, que todavía no existe.

**Sobre afirmar calibración:** que Jev se entrene con RLCD no prueba que esté calibrado *en
este dominio*. TypeSafe no ha publicado una evaluación de calibración reproducible de forma
independiente. Hasta tener una curva local, el texto de producto debe decir **"probabilidad
estimada por Jev"**, nunca "N% de probabilidad de acertar". Verificarlo exige comprobar que
entre muchas clasificaciones cercanas a 0,70, cerca del 70% aciertan — imposible con 23 casos
y 2 errores.

Nota de versionado: cualquier curva de calibración queda atada también a las `criteria` de
cada pregunta. Las de `intent` y `unit` se escribieron en `harness/jev.py` porque la
metodología solo lista sus etiquetas; reescribirlas invalida la calibración igual que
cambiar de modelo.

## Date

2026-09-20

## Context

ADR-027 exige que `confidence=low` se relacione con casos que requieren confirmación.
Define una propiedad de efectividad, no un corte numérico. Su sección S.6 define hard gates
categóricos, separados de los pesos acumulados de riesgo.

### Dos bandas en dominios distintos

| Dónde | Cortes actuales | Objeto |
|---|---|---|
| `backend/modules/initiative-pdfs/pdf.service.ts`, `bandFor` | HIGH≥0.8, MED≥0.6, resto LOW | Propuestas de campos extraídos de PDF |
| `ai-service/harness/jev.py`, `_confidence_label` | high≥0.75, medium≥0.50, resto low | Etiquetas independientes para ruta y unidad en INTERPRET del harness |

La revisión no identificó una justificación estadística de estos números en ADR-027.
Que difieran no demuestra una inconsistencia: protegen decisiones distintas. Debe documentarse
el criterio de cada una; unificar números requiere evidencia, no sólo uniformidad visual.

### Qué activa confirmación y qué significan los pesos

`ai-service/harness/config/methodology.yaml` declara `ambiguous_classification` como hard gate,
con predicado `confidence_low` y peso 0.6. El predicado también activa con `not_evaluable`
o perfil ausente. `medium` por sí solo no lo activa.

El corte provisional de confianza en Jev es **0.50** para cada señal. El **peso 0.6** contribuye al score de
riesgo; el **threshold confirm 0.60** es otro parámetro. `GateLadder.evaluate` fuerza
`RequireConfirmation` ante un hard gate no-block aunque su peso fuese cero. Cambiar el peso
no desactiva ese veto. La salida por confianza baja es `confirm`; `escalate` corresponde a
otra condición del pipeline. Aquí «escalar a humano» se usa como término general.

La documentación de Jev describe confidence como concentración de probabilidades, no acredita
`P(ruta correcta)` en Starteria. El supuesto de probabilidad calibrada del prompt de investigación
es una hipótesis adicional, no un resultado de estos 23 casos.

### Evidencia observada y discrepancia pendiente

El scorecard anterior al cambio experimental, modo jev, dataset 2.0.0, contiene 36 casos y 23 con `expected_kind=route`.
Su hash y denominadores están en el informe revisado. Los dos brazos obtienen 21/23 aciertos de
ruta; eso es igualdad de conteos observados, no equivalencia estadística de modelos.
Las mediciones descriptivas de p50 son 557 ms y 14.987 ms; las preparaciones de estado entre
brazos diferían en la medición, según la auditoría v2. Estos datos siguen siendo evidencia
exploratoria y no validación de la política activa.

| Medida sobre las 23 rutas | Sesión original | Artefacto recontado |
|---|---:|---:|
| Aciertos de ruta | 21 | 21 |
| Confirmaciones | 11 | 10 |
| Ruta correcta pero confirmada | 9 | 8 |
| Errores entre rutas aceptadas | no desglosado | 0 de 13 |

No se resolvió el origen de la diferencia 11/9 frente a 10/8. Una ruta correcta confirmada
no implica una interrupción innecesaria: falta adjudicar ambigüedad de unidad y los demás
motivos protegidos. No se extrapolan estos conteos a frecuencias productivas.

La sesión original reportó además `min@0.35`: 3 confirmaciones y 2 fallos capturados;
`route@0.40`: 2 confirmaciones y 2 fallos capturados; medias route=0.840 y unit=0.671.
Se conservan como **sondas reportadas, no reproducidas**: el scorecard inspeccionado no contiene
los scores crudos necesarios. Tres etiquetas de ruta son provisionales, incluida una de los
dos errores. El golden dataset construido tampoco acredita muestreo i.i.d. de producción.

## Decision

### Aprobado y activado

1. **Jev es el backend por defecto de INTERPRET en `mode=harness` y `POST /ai/diagnose`.**
   GROUND sigue usando OpenRouter. La ruta `mode=baseline` no cambia. El backend LLM
   anterior está disponible mediante `HARNESS_INTERPRET_BACKEND=llm`; errores de Jev
   abortan el diagnóstico y no disparan un fallback silencioso.
2. **Separar `unit` del score que evalúa error de ruta.** Se aprueba el objetivo de diseño,
   pero no la afirmación de que unit sea inútil. El prompt vigente exige confirmación si ruta
   **o unidad** son genuinamente ambiguas. Jev etiqueta ambas por separado;
   el hard gate confirma si cualquiera es baja, con un motivo identificable. Se mantiene
   el peso original y se monitorea la política completa tras activarla. Eliminar
   una señal de un score de ruta no autoriza ignorar una unidad ambigua.

### Punto de operación y revisión

3. **Aprobar 0.50 como corte operativo provisional** de ruta y unidad al activar Jev.
   No se promueven 0.40 o 0.35 por separar retrospectivamente dos errores. El 0.50
   aprobado para operar tampoco es una garantía estadística de riesgo.
4. Usar los 23 casos ya inspeccionados para desarrollo, sensibilidad y regresión. Congelar
   señal, agregación, corte y población objetivo antes de evaluar nuevos casos independientes.
5. Presentar al responsable una tabla de carga humana, escapes, errores capturados y aceptados,
   con denominadores e incertidumbre. Registrar qué evento se protege, riesgo tolerable,
   confianza estadística, capacidad de revisión, responsable y fecha de revisión.
6. Validar una política fija con una cota de riesgo adecuada; si se comparan varias, aplicar
   selección y corrección válidas (por ejemplo LTT). La cobertura conforme marginal de un
   conjunto no garantiza por sí sola el error entre las decisiones aceptadas.
7. Monitorear scores y carga, y obtener etiquetas también de una muestra de aceptados para
   medir escapes. Versionar cambios y definir el procedimiento de revisión por anticipado.

### Seguimiento posterior a la decisión

- Registrar objetivo cuantificado de riesgo, nivel de confianza, capacidad humana,
  responsable y fecha para una revisión futura del corte. Esto no condiciona el
  corte operativo provisional aprobado aquí.
- Reconciliar conteos y etiquetas provisionales antes de usarlos como evidencia
  para una nueva política.
- Completar la autoridad documental V2 ausente para cambios fuera de esta slice.
- Documentar por separado las bandas PDF; no se presupone que deban igualarse.

## Consequences

La decisión pasa a distinguir corte de confianza, peso de riesgo y veto categórico. Hace visible
el compromiso entre carga de revisión y errores aceptados sin atribuir costos monetarios ficticios.
Preserva la confirmación humana donde corresponde y deja una propuesta verificable.

Con esta muestra no puede certificarse seguridad productiva ni estabilidad temporal. Como ejemplo
de planificación, **59 aceptados independientes sin errores** permiten una cota binomial superior
unilateral del 95% de aproximadamente 5% para una política fijada independientemente. No son
59 solicitudes totales, ni un objetivo de riesgo elegido por este ADR. Con errores o comparación
de varias políticas cambia el requisito. Capturar 2/2 errores tampoco acredita alta sensibilidad.

Mientras faltan datos, permanece incertidumbre sobre el riesgo y la carga reales;
no se presenta «9 interrupciones innecesarias cada 23 rutas» como tasa productiva demostrada.

## Alternatives considered

- **Elicitación con responsables de dominio:** necesaria para preferencias y daños no monetizables;
  puede ser trazable si registra escenarios, restricciones y responsable. No reemplaza validación.
- **Barrer cortes sobre los 23 casos:** útil para explorar candidatos, insuficiente para validar
  el candidato elegido con la misma muestra.
- **Holdout 12/11:** válido si realmente reservado, pero impreciso; dividir después de inspeccionar
  no restaura independencia. k-fold y bootstrap tampoco crean errores independientes nuevos.
- **Copiar 0.8/0.6 de PDF:** no justificado por compartir el nombre confidence.
- **Aprender pesos adicionales:** añade selección con dos fallos; no recomendado en esta etapa.

## Conflicts and authority

El informe revisado registra los conflictos históricos con el prompt route-or-unit y con la autoridad V2.
Los documentos canónicos Core y el directorio `docs/product-adr/` referenciados por Authority no
están presentes en este checkout. La aprobación explícita autoriza esta slice funcional,
sin convertir la ausencia del Core en aprobación global de otras reglas. La serie canónica
se conserva en `backend/docs/adr/` y el índice de producto apunta a ella sin duplicarla.
La implementación mantiene el corte y los pesos; cambia el backend de INTERPRET del harness.
La implementación experimental previa se documenta en
[12 — Implementación de ADR-031](../../../docs/analisis-jev/12-adr-031-implementation.md).

## Related

- [ADR-027](ADR-027-methodology-agent-harness.md) — estado Accepted.
- [Investigación revisada y conflictos](../../../docs/analisis-jev/11-confidence-gate-decision.md).
- [Medición](../../../docs/analisis-jev/00-medicion.md) — resultados y sondas históricos.
- [Auditoría v2](../../../docs/analisis-jev/10-evaluacion-routing-dataset-v2.md).
- [Propuesta INTERPRET](../../../docs/analisis-jev/01-route-profile-interpret.md).
- [Configuración del gate](../../../ai-service/harness/config/methodology.yaml).
- [Implementación experimental](../../../docs/analisis-jev/12-adr-031-implementation.md).
- [Activación funcional](../../../docs/analisis-jev/13-adr-031-activation.md).
