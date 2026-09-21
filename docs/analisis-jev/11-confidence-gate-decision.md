# 11 — Punto de operación de confianza: continuación de ADR-031

**Fecha:** 2026-09-20. **Estado:** investigación revisada y propuesta; no autorización de despliegue.
**Alcance:** modelo congelado, selección del gate y validación. Sin entrenamiento ni recalibración.
**Procedencia:** continuación en Codex del trabajo de Claude y de la corrida Hyperresearch
`confidence-threshold-human-escalation-cf61b8`. Se reutilizó su corpus, se verificaron fuentes
primarias y se recalcularon límites binomiales. No se ejecutaron ni certificaron los pasos
8–16 de Hyperresearch. Esta revisión corrige conclusiones de su consolidación preliminar.

**Actualización de implementación:** el [brazo experimental de ADR-031](12-adr-031-implementation.md)
separó posteriormente las señales de ruta y unidad. Los hechos sobre `min(route, unit)` y el
scorecard de este informe describen la versión inspeccionada antes de ese cambio.
El [ADR-031 se aprobó después](../../backend/docs/adr/ADR-031-confidence-threshold-for-human-escalation.md)
con el corte operativo provisional 0.50 y Jev por defecto en INTERPRET del harness;
esta investigación conserva sus límites estadísticos.

## Recomendación para Starteria

Mantener el corte experimental vigente mientras se prepara una decisión explícita; **no promover
0.40 ni 0.35 a producción por separar los dos fallos conocidos**. Tampoco copiar las bandas PDF.
Los 23 casos ya usados para explorar cortes/señales son evidencia de desarrollo. La confirmación
de una política nueva requiere casos posteriores, independientes y representativos de su uso.

La propuesta a discutir es separar la confianza sobre `route` de la ambigüedad de `unit`:
una señal por decisión, con motivos de confirmación distinguibles. Quitar `unit` de un score
de ruta no equivale a permitir que una unidad genuinamente ambigua avance sin revisión.
La selección de la señal y su corte se valida como una sola política congelada.

## 1. Qué hacen realmente el código y los pesos

| Elemento | Hecho verificado | Implicación |
|---|---|---|
| `jev._confidence_label` | `min(route_conf, unit_conf)`; high desde 0.75, medium desde 0.50 | El corte low/medium es 0.50; bajar 0.75 no evita este hard gate |
| `gates._pred_confidence_low` | Activa con low, not_evaluable o perfil ausente | La ausencia de respuesta no autoriza avanzar |
| `ambiguous_classification` | Gate **hard**, weight 0.6 | El peso aporta al score, pero cualquier hard gate no-block fuerza confirmación aunque su peso fuese cero |
| `GateLadder.evaluate` | Block depende de `severity: block`; soft gates acumulan score | Peso 0.6, corte 0.50 y threshold confirm 0.60 son objetos distintos |
| `run_confirm` | Corta a EMIT si el veredicto bloquea routing | La confianza baja produce `confirm`; la línea roja produce `escalate` |
| PDF `bandFor` / `confidenceBandFor` | HIGH≥0.8, MED≥0.6, resto LOW | Bandas de propuestas de campos; no prueba de que sea el mismo gate de routing |
| PDF `confirmProposal` | Registra actor, fecha y estado CONFIRMED | Banda HIGH no equivale por sí sola a confirmación humana |

ADR-027 §Decision/S.6 establece la naturaleza categórica de los hard gates y §Effectiveness
exige relación entre low y necesidad de confirmación. No deriva un corte numérico ni demuestra
que el score ponderado sea una probabilidad. Los pesos concretos están en YAML.

Referencias: [Jev](../../ai-service/harness/jev.py), [gates](../../ai-service/harness/gates.py),
[configuración](../../ai-service/harness/config/methodology.yaml),
[CONFIRM](../../ai-service/harness/stages/deterministic.py),
[servicio PDF](../../backend/modules/initiative-pdfs/pdf.service.ts),
[ADR-027](../../backend/docs/adr/ADR-027-methodology-agent-harness.md).
Revisión estructural Verify: índice ai-service generación `2026-09-20T15:14:04Z`, cobertura
sin huecos registrados en estos cuatro archivos Python/YAML y lectura de fuente. Backend sin
proyecto MCP listado: contexto Graft y lectura de los rangos citados. No es auditoría exhaustiva.

**El supuesto del prompt de investigación no está demostrado para Jev.** Su documentación
describe `confidence` como un estadístico de concentración de las probabilidades. No debe
leerse automáticamente como `P(ruta correcta | contexto)`. El mínimo de dos confianzas tampoco
es una probabilidad conjunta calibrada. Los métodos que sólo necesitan un ranking siguen siendo
candidatos; una fórmula de utilidad sobre probabilidades no se traslada directamente a este score.
[TypeSafe, Confidence](https://docs.typesafe.ai/confidence).

## 2. Evidencia local y denominadores

Se recontó `ai-service/harness/eval/out/scorecard.json`, modo jev, dataset 2.0.0, 36 casos.
SHA-256: `6b0bd52493a23d2f435dd079562e7dba3c07c8356fdff963f100d98d0018d29a`.
El archivo está excluido de git; el hash identifica el artefacto inspeccionado, no una publicación.

| Medida, subconjunto expected_kind=route | Texto previo / sonda reportada | Scorecard disponible |
|---|---:|---:|
| Casos | 23 | 23 |
| Aciertos de route | 21 | 21 |
| Confirmaciones | 11 | 10 |
| Ruta correcta pero confirmada | 9 | 8 |
| Aceptados por el pipeline | no desglosado aquí | 13 |
| Errores de route entre aceptados | no desglosado aquí | 0 |

Los fallos del artefacto son `tarea-ligera` y `dependencia-ti`; el segundo está marcado
provisional. Hay tres rutas provisionales. Restringiendo a supported quedan 20 casos y un fallo
de route. No se cambian las etiquetas para mejorar resultados; requieren adjudicación humana.
Una ruta correcta no demuestra que toda confirmación fuera innecesaria: el resultado de interés
del gate incluye unidad, hechos críticos y otras condiciones. Esos motivos deben etiquetarse.

No se encontró en este scorecard la distribución cruda por pregunta necesaria para reproducir
las alternativas `min@0.35` y `route@0.40`. Siguen siendo resultados reportados de una sonda,
no una comparación confirmada en esta revisión. La discrepancia 11/9 frente a 10/8 queda abierta;
no se atribuye a drift ni a una causa inventada. Ver [medición](00-medicion.md) y
[auditoría v2](10-evaluacion-routing-dataset-v2.md), cuya lectura de un scorecard anterior n=12
no debe confundirse con el archivo n=36 presente hoy.

### Cuatro cantidades distintas

Sea E=error de ruta y A=aceptación automática:

- error del clasificador: `P(E)`;
- riesgo selectivo: `P(E | A)`;
- escape por solicitud: `P(E ∩ A)`;
- detección de fallos: `P(no A | E)`.

La cobertura es `P(A)`. Controlar una cantidad no controla automáticamente las otras.
Los dos negativos del enunciado son **dos errores del modelo**, no dos ejemplos de una clase
semántica de routing. El riesgo completo de una política necesita además el criterio humano
de cuándo corresponde confirmar.

El golden dataset fue construido y contiene contrastes/provisionales; no se acreditó que fuera
una muestra i.i.d. de tráfico productivo. Por eso los siguientes números son **cálculos de
planificación bajo un modelo binomial**, no certificados sobre Starteria:

| Escenario de una política fijada independientemente | Resultado exacto |
|---|---:|
| 2 errores en 23; IC bilateral 95% | [1.07%, 28.04%] |
| 2 errores en 23; límite superior unilateral 95% | 24.92% |
| 0 errores entre 13 aceptados; límite superior unilateral 95% | 20.58% |
| 0 errores entre 21 aceptados; mismo límite | 13.29% |
| Capturar 2 de 2 fallos; límite inferior unilateral 95% de sensibilidad | 22.36% |

Si se seleccionó el corte con esos mismos datos, los límites de una política prefijada no son
una validación de la seleccionada. Para cero errores entre m aceptados, `U=1-delta^(1/m)`.
Para k errores, U resuelve `sum(j=0..k) C(m,j) U^j (1-U)^(m-j)=delta`.
Se recalcularon por bisección; referencia metodológica:
[NIST, intervalos binomiales exactos](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm).

## 3. Métodos: garantía, supuestos y n útil

No existe un n mínimo práctico universal. Hay que fijar riesgo objetivo α, nivel de error δ,
cobertura deseada, número de políticas comparadas y población. Un n usado en un paper no es
un mínimo exigido por su teorema.

| Método | Garantía y supuestos | n y aplicación a 23/2 |
|---|---|---|
| Reject option por utilidad (Chow) | Óptimo respecto a costos y posteriores **verdaderos** especificados; no certifica riesgo por muestras | No mínimo muestral para la regla algebraica; 23 no acreditan posteriores ni costos |
| Selective prediction / SGR | Riesgo entre aceptados con alta probabilidad sobre la muestra; modelo/score fijos, muestra i.i.d., procedimiento y corrección de búsqueda válidos | Depende de aceptados y errores. No exige diez fallos, pero puede no certificar un objetivo estricto |
| Split conformal | Cobertura **marginal del conjunto** bajo intercambiabilidad; score fijado independientemente | Cuantil finito estándar: n≥9/19/99 para α=10%/5%/1%. Debajo conserva validez devolviendo un conjunto trivial; no garantiza riesgo entre singleton aceptados |
| Mondrian / cobertura por clase | Cobertura del conjunto condicionada a la clase usada para calibrar, con intercambiabilidad en cada estrato | Mismo piso por estrato. Con dos ejemplos, α<1/3 requiere el comportamiento trivial estándar; NO impide garantía mediante abstenerse de todo |
| Conformal Risk Control (CRC) | Esperanza de pérdida acotada y monótona, funciones de pérdida intercambiables y demás condiciones del teorema | Corrección B/(n+1); para pérdida 0/1 y pérdida empírica cero, 1/24 con n=23. No es un certificado PAC del riesgo del despliegue |
| RCPS | `P(R(λ̂)≤α)≥1−δ` con muestra i.i.d., límites válidos y selección diseñada para familia anidada/monótona | El n útil depende de pérdida y cota; el caso binario se dimensiona con la tabla siguiente, no con un mínimo universal de 1.000 |
| Learn-then-Test | Control de error familiar en tests de riesgo; admite políticas y riesgos no monótonos | Puede no certificar ninguna política. El número/orden de hipótesis y cómo se fijan antes de la evaluación importan |

Fuentes primarias: [Chow](https://doi.org/10.1109/TIT.1970.1054406),
[Geifman–El-Yaniv, SGR](https://arxiv.org/abs/1705.08500),
[Angelopoulos–Bates, conformal](https://arxiv.org/abs/2107.07511),
[CRC](https://arxiv.org/html/2208.02814v4), [RCPS](https://arxiv.org/abs/2101.02703),
[LTT §3.2, clasificación selectiva](https://arxiv.org/html/2110.01052v5).

En este caso, calibrar por clase semántica no equivale a condicionar en «el modelo se equivocó».
Se podría formular otro predictor cuyo resultado fuese error/no-error, pero sería otra
construcción que hay que especificar. El 33.3% no es un límite universal de todo gate con dos fallos.

Para CRC, `1{E y score≥t}` disminuye al subir t: permite controlar escapes por solicitud.
El cociente `P(E ∩ A)/P(A)` puede subir o bajar al cambiar t: **no hereda** esa garantía de
monotonía. Tampoco escalar todo demuestra bajo riesgo selectivo: con cobertura cero es indefinido.

### Planificación exacta, caso favorable de cero errores

Para certificar riesgo entre aceptados ≤α con δ=5%, para **un corte fijo** y m aceptados i.i.d.:
`m ≥ ceil(log(δ)/log(1−α))`. Si se prueban cinco políticas preespecificadas con Bonferroni,
reemplazar δ por δ/5. Esto no legitima una búsqueda adaptativa arbitraria.

| Objetivo α | m aceptados, un corte | m aceptados por política, cinco políticas |
|---|---:|---:|
| 10% | 29 | 44 |
| 5% | 59 | 90 |
| 1% | 299 | 459 |

Son mínimos en un resultado **sin errores**, no potencia suficiente ni promesas de plazo.
Con errores se necesita más. Para observar m aceptados harán falta más de m solicitudes
si existe abstención. Para certificar sensibilidad ≥95% tras capturar todos los fallos,
el mismo cálculo requiere 59 **fallos independientes**, no 59 solicitudes.

## 4. Una señal, min, media o combinación

Si el evento que se quiere proteger es sólo error de ruta, un score de `route` es un baseline
interpretable. Si se debe confirmar por ambigüedad de ruta **o** unidad, `min<τ` representa
exactamente esa disyunción de umbrales. No se ha demostrado que sea la probabilidad del evento
conjunto ni que las dos escalas sean comparables. Una unidad incierta puede explicar carga humana
extra sin ser una señal defectuosa para su propio objetivo.

Promediar diluye un veto: una señal alta puede ocultar una condición crítica baja. Tomar el mínimo
añade rechazos al sumar señales. Multiplicar sólo tiene interpretación conjunta bajo supuestos
específicos de probabilidades e independencia; que Jev procese preguntas aisladas no acredita
independencia estadística de sus errores. Correlación no vuelve inútil una señal automáticamente,
pero sí invalida algunas interpretaciones probabilísticas ingenuas.

Hay evidencia empírica de que información adicional puede mejorar la abstención bajo cambio de
dominio: Kamath et al. comparan scores del modelo con un calibrador supervisado en QA y encuentran
ventajas al incluir datos fuera de dominio. Es evidencia de posibilidad, no de que min/mean o
`unit` mejore aquí; ese calibrador requiere datos y queda fuera del alcance de entrenar este modelo.
[Kamath et al., ACL 2020](https://aclanthology.org/2020.acl-main.503/).

En su apéndice A.2, añadir longitud de pregunta y solapamiento léxico no mejoró la validación;
los autores plantean que pueden dar información engañosa entre dominios. Es evidencia de señales
que no aportaron, no una demostración universal de degradación. También encontraron mala
abstención usando detección de dominio como sustituto de detectar errores (A.3). Para `unit`
no hay aquí una ablación independiente que demuestre daño al objetivo completo del gate.
[Kamath et al., apéndices A.2–A.3](https://aclanthology.org/2020.acl-main.503.pdf).

**Propuesta para ADR-031:** medir `route_score` para ruta y ambigüedad de unidad como motivo
separado. Evaluar una ablación con ambos objetivos etiquetados y la política completa congelada.
No aprender pesos, comparar muchas agregaciones ni descartar `unit` porque sólo se puntuó route.

## 5. Validación y uso del set

| Método | Uso defendible | Lo que sería teatro estadístico |
|---|---|---|
| Holdout | Uno realmente reservado, con conteos e intervalos amplios reconocidos | Presentar partir 23 en 12/11 como certificación precisa; declarar holdout lo ya inspeccionado |
| k-fold | Explorar sensibilidad de un procedimiento; selección dentro de cada fold y separar familias | Ajustar el corte global y luego llamarlo validación cruzada; contar repeticiones como negativos nuevos |
| Bootstrap | Sensibilidad exploratoria, preservando familias y toda la selección | Afirmar que cientos de remuestreos aportan cientos de tipos de fallo |
| Curva riesgo–cobertura/carga | Descripción de candidatos, denominadores e incertidumbre | Llamar validación independiente a la curva usada para elegir su mejor punto |

Con dos fallos, más de dos folds no pueden contener un fallo en cada validación. En el bootstrap
usual de tamaño 23, la probabilidad de no extraer ninguno de los dos es `(21/23)^23≈12.34%`.
Ninguno de estos hechos hace inválido todo remuestreo; limita lo que se puede concluir.
[Cawley–Talbot, sesgo de selección](https://jmlr.org/papers/v11/cawley10a.html).

La elicitación posterior de preferencias no borra haber visto las etiquetas. Recomendación:
usar el set actual para desarrollo y regresión; fijar política, error objetivo y plan de evaluación;
reunir una muestra futura y evaluar una vez o mediante un protocolo secuencial válido. La cobertura
puede estimarse con tráfico sin etiquetar, pero el riesgo necesita resultados etiquetados.

## 6. Presentar la decisión sin monetizar daños

Mostrar por candidato los conteos de solicitudes, confirmaciones, escapes, errores capturados,
otros hard gates, aceptados y pendientes de etiqueta. Adjuntar intervalos con denominador y
supuestos; para este golden dataset, identificarlos como ilustración de incertidumbre.
La tabla histórica de 23 ayuda a discutir opciones; no debe proyectarse como frecuencia productiva.

Pedir al responsable que explicite: qué daño quiere evitar; cuántas revisiones adicionales admite
para evitarlo; capacidad por turno; qué riesgo aceptado sería inaceptable; fecha de revisión.
La práctica de decision curve analysis expresa preferencias mediante probabilidades umbral y
relaciones de daños/beneficios. Adaptar ese modo de presentación a routing es una propuesta de
esta revisión, no una validación clínica transferible a Starteria.
[Van Calster et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC6261531/), texto recuperado previamente
en la bóveda; el acceso web de esta revisión devolvió un control de navegador.

**Corrección de la fórmula del informe anterior.** Supongamos q=P(error), costo C_e por aceptar
un error y C_r por una revisión innecesaria; las otras dos celdas de costo se fijan en cero.
Entonces aceptar cuesta q C_e y revisar cuesta (1−q) C_r. Se revisa cuando
`q > C_r/(C_e+C_r)`, o se acepta cuando `p_correcta ≥ C_e/(C_e+C_r)` con empate resuelto por política.
El informe preliminar aplicaba la segunda fracción a la **probabilidad de error**, invirtiéndola.
Si toda revisión cuesta C_r, incluso si detecta un error, el umbral en q es C_r/C_e bajo revisión
perfecta. Si los humanos también fallan, hay que incluir su riesgo residual. Son derivaciones
condicionadas a una matriz de utilidad, no cortes de Jev deducidos de sus scores.

La capacidad limita el volumen viable; no demuestra seguridad. Si ninguna opción cumple riesgo
y capacidad, el resultado es no certificado y hace falta una decisión operativa. Autorizar routing
interno no confirma hechos ni publica clasificaciones corporativas por sí solo.

## 7. Estabilidad y revisión de la política

Registrar versión del modelo, criterios, agregación y corte, scores por pregunta, respuesta,
motivos de gates, decisión humana, etiqueta posterior y su demora. Monitorear distribución de
scores, cobertura y carga por origen/ruta; con etiquetas, riesgo entre aceptados, escapes por
solicitud y desacuerdo humano. Auditar también una muestra aleatoria de aceptados: observar sólo
rechazados produce sesgo de verificación.

Un cambio de scores no prueba deterioro; scores estables no descartan cambios en P(Y|X).
Monitores etiquetados secuenciales pueden controlar falsas alarmas bajo sus supuestos. No hay
plazo universal para detectar drift con dos errores. Tampoco una confidence sequence para una
media estacionaria cubre automáticamente el riesgo instantáneo bajo drift arbitrario.
[Podkopaev–Ramdas](https://arxiv.org/abs/2110.06177),
[Waudby-Smith–Ramdas](https://arxiv.org/abs/2010.09686).

Se retiran como recomendaciones universales las cifras «35%, 83 o 167 casos» del borrador:
dependían de una construcción secuencial, orden de observaciones y supuesto de cero fallos nuevos.
Fijar alertas, ventanas o método secuencial y acciones de revisión antes de monitorear; no repetir
intervalos fijos hasta que alguno permita declarar éxito. Cambiar el corte inicia una versión nueva.

## 8. Qué no puede concluirse y decisiones pendientes

No se puede certificar seguridad productiva, igualdad de modelos, ausencia de sesgo por ruta,
calibración local de confidence, optimalidad de 0.40, inutilidad de unit, ni estabilidad temporal.
Tampoco se puede identificar el umbral deseable sin riesgo objetivo, capacidad y semántica del
evento que requiere revisión. El informe no elige esos valores por la persona responsable.

Ficha para decidir: owner nominal pendiente; objetivo de riesgo y δ pendientes; capacidad pendiente;
eventos protegidos route/unit pendientes de reconciliación; política candidata y corte pendientes;
etiquetas independientes y muestra futura pendientes. Recomendación: score de ruta y motivo de
unidad separados, rollout evaluado primero en shadow, preservar hard gates y confirmación humana.

## 9. Autoridad y conflictos que quedan visibles

El checkout no contiene `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` ni `docs/product-adr/`,
aunque CURRENT_STATE y Authority los referencian. Se leyó ADR-027 con estado Accepted y la copia
metodológica con estado canonical-draft; esto no sustituye reconciliar la autoridad V2.

```text
CONFLICT
Contract: ADR-027 §S.4/Effectiveness; interpret.system.md §Cómo asignar confidence
Requirement: confirmar ambigüedad de ruta o unidad; preservar autoridad humana
Current document/code: ADR-031 declara quitar unit; jev.py aún usa min(route, unit)
Observed mismatch: decisión de diseño declarada, semántica y aplicación no reconciliadas
Risk: eliminar confirmaciones por unidad ambigua al optimizar sólo route
Recommended treatment: UPDATE ADR-031; medir y proponer motivos separados
Requires ADR: yes (enmienda Proposed existente; aceptación pendiente)
```

```text
CONFLICT
Contract: CURRENT_STATE / STARTERIA_AUTHORITY / Manifest V2
Requirement: autoridad canónica leída y slice explícita antes de cambios funcionales
Current document/code: Core e índice de ADRs canónicos ausentes; ADR-031 en backend/docs/adr
Observed mismatch: adopción declarada frente a brazo Jev experimental sin promoción V2 acreditada
Risk: presentar evidencia experimental como autorización productiva
Recommended treatment: KEEP implementación; UPDATE evidencia y propuesta; reconciliar autoridad
Requires ADR: yes para promover la política; no para documentar estos hallazgos
```

No se cambia runtime, prompts, pesos, contratos ni cortes. La continuación produce evidencia y
una propuesta revisable; no sustituye las decisiones abiertas con una aprobación implícita.
