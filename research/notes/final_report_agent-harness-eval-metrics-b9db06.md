# Medir un harness de agente: qué instrumentos existen y cuál es la unidad correcta

La pregunta de qué tan efectivo es este harness parece necesitar una métrica que falta. No es eso. Las
métricas existen, están formalizadas y tienen números medidos detrás. Lo que casi nunca está fijado
es **la unidad sobre la que se mide**, y cuando la unidad se mueve el número deja de significar algo
aunque la fórmula sea correcta.

Esa es la tesis de este informe, y tiene dos confirmaciones independientes que llegan desde problemas
distintos. RefChecker consiguió **95,0% de acuerdo entre anotadores** en detección de alucinaciones al
cambiar la unidad de la oración a la *tripleta de claim*, con una ganancia de consistencia de 19 a 26
puntos atribuida a la granularidad [1]. Granular Change Accuracy resolvió la medición de diálogo
multi-turno al cambiar la unidad del estado acumulado al **delta entre turnos** [2]. Ninguna de las
dos inventó un algoritmo nuevo: las dos redefinieron qué cosa se cuenta.

Para un harness con contratos escritos eso es una buena noticia, porque fijar la unidad es
precisamente lo que un contrato puede hacer y un benchmark público casi nunca puede.

## 1. Qué se mide cuando se mide un harness y no un modelo

La distinción no es retórica y está reconocida por quienes construyen agentes. Anthropic lo dice sin
rodeos: **"the harness itself is part of what is being tested"**, y **"we're evaluating the harness and
the model working together"** [3]. El andamiaje no es el contexto de la prueba, es parte del objeto
bajo prueba.

El problema es que la literatura de benchmarks todavía no controla ese eje. El trabajo más riguroso
sobre validez de benchmarks de agentes define dos criterios formales: **"Task validity: a task should
be solvable if and only if the agent possesses the target capability"** y **"Outcome validity: the
evaluation result (e.g., tests or checks) truly indicates task success"** [4]. Con su checklist de 44
ítems aplicado a 10 benchmarks, los resultados son duros: **7 de 10 fallan validez de tarea, 7 de 10
validez de resultado, y 10 de 10 fallan en reporte, con el 80% sin reconocer sus propias
debilidades**. Los errores de estimación llegan hasta el 100% en términos relativos:

- **τ-bench**: un agente trivial saca 38% y le gana a GPT-4o.
- **KernelBench**: sobreestima 31% absoluto.
- **OSWorld**: *subestima* a UI-TAR en 28% absoluto [4].

Quienes estudian confiabilidad de agentes admiten el hueco en su propio trabajo. El marco de Princeton
lo escribe como limitación: **"Scaffold diversity. We evaluate each benchmark using a single scaffold
that performs well on the respective benchmark; other scaffolds could yield qualitatively different
reliability profiles"**, y agrega que hacen falta controles **"for model size, training data, and
scaffolding design are needed to disentangle these factors"** [5].

Y cuando la comparación se hace contra juicio humano real, la brecha es medible. METR encontró que
**alrededor del 50% de los PR que pasan SWE-bench-Verified no serían mergeados** por los mantenedores
reales, y que el grader automático puntúa **24,2 puntos porcentuales (SE 2,7) por encima** del juicio
del mantenedor — una sobreestimación de 7x en términos de horizonte temporal [6].

La mitigación aplicada existe y es simple: **fijar el scaffold**. Gaia2 corre todos los modelos con el
mismo andamiaje ReAct para poder atribuir las diferencias al modelo, y su variante de llamadas
paralelas mejoró la eficiencia pero no la exactitud, lo que usan para argumentar que los límites son
intrínsecos al modelo y no artefactos del andamiaje [7].

## 2. Clasificación de intención: benchmarks e instrumentos

Los benchmarks canónicos —CLINC150, BANKING77, HWU64— son **de un solo turno y de etiqueta única**, y
los modelos de última generación superan el 90% de exactitud en los splits estándar [8]. Un estudio
reciente sobre 41 modelos define la saturación formalmente: más del 50% de los modelos por encima del
80% de exactitud [9].

El detalle más útil de ese estudio no es su ranking sino un problema que sufrió adentro: **tuvieron
que excluir un modelo de su propia tabla porque su puntaje de BANKING77 usó el split de test completo
mientras los otros 40 usaron los primeros 500 ejemplos** [9]. La inconsistencia de splits no es una
molestia entre papers: ocurrió entre modelos del mismo experimento, con los mismos autores.

Para un harness la lectura es directa: sin el mismo caso, el mismo esperado y el mismo procedimiento,
dos corridas no son comparables. Y como los conjuntos estándar son de un solo turno, **ninguno sirve
para medir qué pasa cuando alguien cambia de idea a mitad de conversación**. El trabajo sobre
detección en producción construye subconjuntos difíciles por disimilitud semántica precisamente porque
los estándar ya no discriminan [10].

## 3. Extracción con procedencia: cómo se mide que el agente no invente

Acá la taxonomía está madura, y cada instrumento mide algo que los otros no.

- **AIS** es la raíz: define que una salida es atribuible si un lector aceptaría "According to P, s",
  con un pipeline de anotación de dos etapas —primero una compuerta de interpretabilidad, después el
  juicio de atribución— y voto de mayoría de 5 anotadores. Su chequeo de sanidad importa: un modelo
  sin evidencia saca 15% de AIS [11].
- **ALCE** formalizó recall de cita (entailment con la pasarela como premisa) y precisión de cita (una
  cita es irrelevante si quitarla no reduce el soporte), y midió que los mejores modelos **carecen de
  soporte completo de cita el 50% de las veces** en ELI5 [12].
- **FActScore** rompió con AIS explícitamente y por nombre, porque el todo-o-nada asigna 0,0 a las dos
  generaciones aunque la primera sea considerablemente más exacta; su descomposición en hechos
  atómicos mide ChatGPT en 42%, InstructGPT 58% y PerplexityAI 71% [13].
- **AttrScore** reemplazó la etiqueta binaria por tres valores —atribuible, extrapolatorio,
  contradictorio— [14].
- **RefChecker** bajó la granularidad a tripletas de claim, con el resultado de acuerdo entre
  anotadores ya citado [1].

Automatizar esa evaluación es más difícil de lo que parece. **AttributionBench** unificó 7 datasets y
midió que un GPT-3.5 afinado alcanza apenas ~80% de macro-F1; en 321 errores analizados, **más del 66%
vienen de insensibilidad a información de grano fino y el 26,8% de desajuste de acceso a la
información entre humano y modelo** — el anotador ve la página entera, el modelo solo el fragmento
extraído [15]. Y los puntuadores automáticos **no transfieren**: una auditoría de 8 scorers sobre 17
datasets encontró inversión de ranking con Kendall tau de −0,64 entre AttributedQA y LFQA, y un
scorer basado en NLI que cae de 0,90 de AUROC a 0,53, que es azar [16].

## 4. Preguntas de aclaración: por qué las métricas de texto fallan

El veredicto del campo es explícito: las métricas de coincidencia de texto como BLEU y ROUGE **no son
confiables** para generación de preguntas de aclaración, y esa constatación —no una preferencia de
diseño— fue lo que empujó a reformular la tarea como *selección* sobre un conjunto de candidatas, con
el dataset Qulac [17, 18]. La razón es estructural: una pregunta de referencia es **una entre muchas
válidas**, así que la precisión de n-gramas contra una sola referencia está mal apareada con la tarea.

Hay prueba empírica, no solo argumento. En generación zero-shot, **un baseline ingenuo de
plantilla+faceta encabeza BLEU, ROUGE y Coverage por puro calce léxico garantizado**, lo que obligó a
los autores a usar ejes de evaluación humana separados [19]. Una métrica que premia copiar la entrada
esconde exactamente el modo de falla que importa. La alternativa es pragmática: puntuar la pregunta por **la utilidad de la respuesta que provoca** en
lugar de por su parecido superficial [20]. Con datos reales, MIMICS aporta más de 400.000 consultas de
Bing con señales de click y engagement como sustituto de la referencia [21].

Pero el instrumento más relevante para un harness que **planifica** preguntas —decide si preguntar, y
cuántas— es otro. El trabajo que separa *cuándo preguntar* de *qué preguntar* encuadra la primera
tarea como **estimación de incertidumbre y no como clasificación**, exige distinguir incertidumbre
epistémica de aleatoria, y aporta dos métricas concretas: **desempeño bajo un presupuesto fijo de
interacción, b ∈ [0,100]**, y **AUROC adaptado** para clasificar si la aclaración habría ayudado [22].
Ese primer instrumento es exactamente la forma medible de un tope de preguntas: un límite de 0 a 3 no
es una decisión arbitraria de producto, es un punto sobre el eje del presupuesto.

Y advierte de una circularidad que arruina la medición si se ignora: **no se puede evaluar con
justicia una política de cuándo preguntar si las preguntas que generaría son malas**, porque el
desempeño de cada paso está atado al otro. La solución aplicada es **sustitución oracle**: se fija la
calidad de la pregunta y se mide solo la decisión [22]. El baseline que este marco supera es la
entropía semántica, que agrupa generaciones por entailment bidireccional y calcula entropía sobre
significados en vez de tokens [23].

## 5. pass^k: medir consistencia en vez de promedio

La definición formal, del paper que introdujo la métrica: `pass^k` es "the chance that all k i.i.d.
task trials are successful, averaged across tasks", contra `pass@k` que es al menos uno de k. Los
estimadores son `pass^k = E_task[C(c,k)/C(n,k)]` y `pass@k = 1 − E_task[C(n−c,k)/C(n,k)]` [24]. La diferencia práctica es brutal: con una tasa base del 70%, **Pass@3 ≈ 97%
mientras Pass^3 = 34,3%** [25]. Medido sobre agentes reales, gpt-4o con function calling supera el
60% en `pass^1` sobre τ-retail y **cae por debajo del 25% en `pass^8`** [24].

Alrededor de esa idea hay más instrumental: curva de decaimiento de confiabilidad, factor de
amplificación de varianza, score de degradación gradual y punto de inicio del colapso, como familia de
métricas más allá de un `pass@1` de una sola corrida [26]. Y el marco de Princeton propone 12 métricas
en 4 dimensiones —Consistencia, Robustez, Predictibilidad, Seguridad— ancladas explícitamente en
analogías con la aviación civil, la regulación nuclear y IEC SIL-4. Define la consistencia de
resultado como `Cout = 1/T · Σ_t (2·p̂_t − 1)²` sobre K=5 corridas a temperatura 0 [5].

El hallazgo más importante de ese marco es que **capacidad y confiabilidad divergen**: 24 meses de
desarrollo de modelos produjeron solo mejoras marginales de confiabilidad mientras los puntajes de
capacidad subían [5]. Y hay una razón estructural para que nadie lo hubiera notado: los benchmarks se
retiran convencionalmente al 90–95% de saturación atribuyendo los errores residuales a ruido de
etiqueta, **así que a los modelos nunca se los empuja a demostrar consistencia, solo capacidad**;
re-etiquetados, ni los mejores llegan al 100% [27].

## 6. Policy adherence: medir lo que el agente NO debe hacer

Este es el punto donde la métrica de puntaje y el chequeo de política se separan, y el paper de
τ-bench lo dice de su propia recompensa: `r = r_action × r_output` es **necesaria pero no suficiente**
para cumplimiento de política, porque un agente puede pasar los chequeos de recompensa y **aun así
violar la política**, por ejemplo salteándose una confirmación requerida [24].

La consecuencia de diseño es concreta: un conjunto de prohibiciones duras tiene que evaluarse por
separado del puntaje, y un caso con puntaje perfecto y una prohibición violada es un fallo. No es
rigidez: es lo que los autores de la métrica dicen que hace falta. Las extensiones orientadas a
política documentan además los modos de falla del propio grader, con falsos positivos y falsos
negativos de calificación [28], y la auditoría de validez ya citada muestra por qué importa: un agente
trivial que explota el grader puede superar a un modelo frontera [4].

## 7. Validación del juez: quién puntúa al que puntúa

Si la rúbrica la aplica un modelo, la rúbrica misma necesita evaluación. El trabajo más directo
construye suites de validación para jueces LLM y concluye que **ningún juez evaluado resultó
uniformemente confiable**, con la consistencia rompiéndose por cambios simples de formato, paráfrasis,
variaciones de verbosidad y etiqueta invertida [29].

El dato más filoso viene de atribución de citas: sobre CiteME, ChatGPT-4o alcanza **precisión de 1,0
en las cuatro variantes de prompt con recall de 0,16 a 0,38** — es decir, casi no acepta nada
incorrecto pero **rechaza la mayoría de lo correcto**, porque le falta contexto de dominio [30]. Para
una rúbrica eso significa que un puntuador automático produciría **falsos FAIL**: la dirección más
segura del error, y a la vez un puntaje inservible como medida. Fallar cerrado no equivale a medir
bien.

El techo humano en esa misma tarea es 69,7% con 38,2 segundos por pregunta, contra 4,2–18,5% de los
modelos frontera [31]. Y el juez LLM como alternativa tiene su costo declarado: evita los colapsos de
los scorers automáticos pero cuesta unas 100 veces más, es no determinista, y **rechaza o descarta el
15% de los casos** [16].

Hay dos patrones de mitigación que vale adoptar. El primero es **desacoplar al evaluador**: usar para
la verificación un modelo de soporte que nunca participó en la selección ni en la verificación previa,
y tratar las anotaciones cruzadas como acuerdo entre anotadores y **nunca como verdad de oro** [16].
El segundo es fijar la unidad, que es la tesis de este informe [1]. Y una advertencia final: incluso
el benchmark mejor diseñado para adaptación documenta en su propio apéndice una vulnerabilidad de
reward hacking en su verificación blanda con juez LLM [7].

## 8. Adaptación a cambio de objetivo en diálogo multi-turno

Acá está el instrumental más específico y el que más se malinterpreta.

| Métrica | Sobre qué se define | Qué corrige o qué la limita |
|---|---|---|
| **Joint Goal Accuracy** (la estándar) | El estado acumulado, turno a turno | **Una sola predicción errónea pone en cero prácticamente todos los turnos posteriores**, así que la propagación de error castiga de más a los turnos tardíos [32] |
| **Average Goal Accuracy** (la alternativa habitual) | Solo los slots con valor verdadero no vacío | **Orientada a recall y ciega a los falsos positivos** [32] |
| **Relative Slot Accuracy** | Los slots únicos de la unión de predicho y verdadero | Corrige el denominador de las anteriores y con eso recupera discriminación: el spread entre el mejor y el peor de 10 modelos pasa de 1,09 puntos a 5,47 [33] |
| **Flexible Goal Accuracy** | El error de turno, clasificado en localmente incorrecto o heredado de un error anterior | Da crédito parcial con decaimiento exponencial a los errores heredados; sobre MultiWOZ 2.1 un mismo modelo pasa de 53,09% de JGA a 71,04% de FGA [32] |

Pero la que corresponde a la pregunta es **Granular Change Accuracy**, y su nombre es el punto: puntúa
el **cambio**, no el estado. Compara el delta del turno contra el delta predicho y promedia sobre la
cantidad de alteraciones de estado en lugar de sobre la cantidad de turnos, lo que elimina el doble
conteo. Combina precisión y recall de valor y de etiqueta en una media armónica ponderada sobre
conteos de correctos, incorrectos, excedidos y faltantes [2].

El argumento a su favor es un ejemplo de juguete y es contundente: entre dos predictores, uno que
acierta 5 de 7 y otro 1 de 7, **JGA, FGA, AGA y RSA las cuatro ordenan al peor por encima del mejor**;
solo GCA ordena bien, 73,33 contra 15,49 [2]. Además GCA resulta menos sensible a la distribución
desigual de errores que FGA, con correlaciones de 0,40 y 0,59 respectivamente contra una medida de
no-uniformidad [2].

Y ahora el hueco que ningún dataset llena. **Ni SGD ni MultiWOZ anotan cuál turno es el del cambio de
objetivo.** SGD predice solo el delta por turno y reconstruye el objetivo acumulado sumando deltas, y
aunque su simulador cambia de intención hasta cinco veces por escenario, no existe una etiqueta de
*cambio de objetivo* [34]. MultiWOZ lo *produce* deliberadamente: "To model more realistic
conversations, goal changes are encouraged", vía restricciones iniciales que no tienen resultado en la
base y fuerzan un valor alternativo. Pero tampoco lo anota: solo se recupera comparando estados
consecutivos [35].

El benchmark más nuevo con eje de adaptación, Gaia2, tiene un split dedicado de 160 escenarios que
exige *adaptarse dinámicamente a cambios del entorno que son consecuencia de acciones previas del
agente*, como la respuesta a un mail que el agente mandó o la cancelación de un viaje que reservó
[7]. Es el análogo publicado más cercano, y es más angosto de lo que parece: **el objetivo general del
usuario nunca cambia**, y lo que queda superado es un detalle de ejecución. El dato que lo supera
suele venir de un tercero, no del usuario reformulando lo que quiere [7]. Su split de ambigüedad, por
su parte, es **explícitamente de un solo turno: "they do not include a clarification message from the
User"** [7].

Lo que sí conviene copiar de Gaia2 es su forma de puntuar, porque resuelve bien la trampa obvia. El
verificador **no chequea solo el estado final**: es sensible a la secuencia y distingue una
trayectoria donde el agente se equivoca y se corrige de una donde acierta de entrada. Exige que la
acción correctiva aparezca causalmente después del evento que contradice, **sin penalizar la acción
inicial**, que era correcta según la instrucción original [7].

Y una advertencia que llega desde la corrección de anotaciones: cuando MultiWOZ 2.0 pasó a 2.1 se
cambiaron más del 32% de las anotaciones de estado en cerca del 40% de los turnos, y **los cinco
modelos evaluados bajaron su JGA** [36]. Quien corrija un esperado y vea caer el puntaje no está ante
una regresión.

## 9. Qué sobrevive a un presupuesto de puntuación humana

Esta pregunta es derivada —la plantean las ocho secciones anteriores, no el instrumental— y no tiene
literatura propia. Lo que sigue es inferencia sobre evidencia indirecta, no un hallazgo publicado. La evidencia indirecta es consistente y apunta en la misma dirección. Las dos métricas estándar de
diálogo multi-turno correlacionan con juicio humano en **0,33 (JGA) y 0,37 (FGA)** sobre 11
evaluadores y 100 diálogos [32]: explican alrededor de un tercio de lo que ve una persona. El juez LLM
evita los colapsos pero cuesta 100 veces más, no es determinista y descarta el 15% de los casos [16].
Y en la tarea donde se midió el techo humano, las personas alcanzan 69,7% donde los modelos quedan
entre 4,2% y 18,5% [31].

De ahí salen tres recomendaciones que no dependen de tener presupuesto para miles de corridas.

**Primero, fijar la unidad antes de instrumentar.** Es la única intervención que mejoró la medición en
los dos casos donde se probó, y no cuesta corridas: RefChecker pasó a 95,0% de acuerdo cambiando de
oraciones a tripletas [1], y GCA ordenó correctamente lo que cuatro métricas ordenaron mal al pasar
del estado al delta [2]. Con una unidad fija, dos corridas se vuelven comparables; sin ella, la
inconsistencia de splits aparece incluso dentro de un mismo experimento [9].

**Segundo, gastar las lecturas humanas en consistencia y no en cobertura.** `pass^k` con k chico sobre
pocos casos dice más que una corrida sobre muchos, porque el campo ya demostró que capacidad y
confiabilidad divergen [5] y que la costumbre de retirar benchmarks al saturarse impidió medir
consistencia durante años [27]. Un caso corrido tres veces informa más que tres casos corridos una vez.

**Tercero, separar el chequeo de política del puntaje, y desacoplar al evaluador.** Lo primero porque
los propios autores de `pass^k` marcan que su recompensa no absorbe el cumplimiento de política [24];
lo segundo porque el patrón de usar un modelo de soporte que no participó de la selección, y tratar
las anotaciones cruzadas como acuerdo y nunca como verdad de oro, es el que usa la auditoría más
cuidadosa del área [16].

### Los límites de este informe

El propio checklist de validez encontró que 10 de 10 benchmarks auditados fallan en reporte y que el
80% no reconoció sus debilidades [4]. Corresponde no repetirlo. Este informe se produjo con un pipeline de investigación en su modo reducido. No corrió la etapa de
verificación de citas, así que **ninguna cita de este documento fue comprobada contra el cuerpo de su
fuente**. El corpus mismo mide que eso falla seguido: los mejores modelos carecen de soporte completo
de cita la mitad de las veces en respuestas largas [12]. Y la profundidad de búsqueda lo empeora de
forma específica: la exactitud factual cae alrededor de 42% al pasar de 2 a 150 llamadas de
herramienta, mientras la validez de los links y su relevancia se mantienen por encima del 92% [37].
Este trabajo hizo decenas de llamadas. La calidad superficial de sus citas no es evidencia de su
exactitud.

Tres límites más, concretos.

- **Autoridad sin puntaje.** Seis de las fuentes —entre ellas el paper de validez y el trabajo
  original sobre atribución— quedaron sin puntaje de autoridad por límites de tasa de la API de
  conteo de citas, y se incluyeron por decisión manual; un puntaje ausente no es un puntaje bajo,
  pero tampoco es un puntaje.
- **Un eje con incertidumbre.** La correlación de 0,76 y 0,46 citada para la divergencia entre
  capacidad y confiabilidad está en el paper, pero la extracción de texto reordena los paneles de
  figura, así que el eje exacto que correlacionan quedó con incertidumbre; los valores y la dirección
  son sólidos.
- **Sin búsqueda de contraevidencia.** No corrió la etapa que pregunta *qué fuente, si existiera,
  daría vuelta esta conclusión*, que es precisamente la que habría buscado la evidencia en contra de
  la tesis central.

## Sources

[1] REFCHECKER: Reference-based Fine-grained Hallucination Checker and Benchmark for Large Language Models. https://arxiv.org/abs/2405.14486
[2] Granular Change Accuracy: A More Accurate Performance Metric for Dialogue State Tracking. https://arxiv.org/abs/2403.11123
[3] Demystifying evals for AI agents. Anthropic Engineering. https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
[4] Establishing Best Practices for Building Rigorous Agentic Benchmarks. https://arxiv.org/abs/2507.02825
[5] Towards a Science of AI Agent Reliability. https://arxiv.org/abs/2602.16666
[6] Many SWE-bench-Passing PRs Would Not Be Merged into Main. METR. https://metr.org/notes/2026-03-10-many-swe-bench-passing-prs-would-not-be-merged-into-main/
[7] GAIA2 / ARE: benchmarking agents in a dynamic environment (ICLR 2026). https://arxiv.org/abs/2602.11964
[8] Benchmarking Commercial Intent Detection Services with Practice-Driven Evaluations. https://arxiv.org/abs/2012.03929
[9] Selecting Open-Weight Language Models for Zero-Shot Intent Classification: A Systematic Evaluation of 41 Models. https://arxiv.org/abs/2607.27421
[10] HINT3: Raising the bar for Intent Detection in the Wild. https://arxiv.org/abs/2009.13833
[11] Measuring Attribution in Natural Language Generation Models. https://arxiv.org/abs/2112.12870
[12] Enabling Large Language Models to Generate Text with Citations (ALCE). https://arxiv.org/abs/2305.14627
[13] FACTSCORE: Fine-grained Atomic Evaluation of Factual Precision in Long Form Text Generation. https://arxiv.org/abs/2305.14251
[14] Automatic Evaluation of Attribution by Large Language Models (AttrScore). https://arxiv.org/abs/2305.06311
[15] AttributionBench: How Hard is Automatic Attribution Evaluation? https://arxiv.org/abs/2402.15089
[16] Do LLM Attribution Metrics Transfer? Auditing Retrieval-Augmented Generation Evaluation Across Datasets and Constructs. https://arxiv.org/abs/2606.23915
[17] Conversational Information Seeking. https://arxiv.org/abs/2201.08808
[18] Asking Clarifying Questions in Open-Domain Information-Seeking Conversations (Qulac). https://arxiv.org/abs/1907.06554
[19] Zero-shot Clarifying Question Generation for Conversational Search. https://arxiv.org/abs/2301.12660
[20] Alexpaca: Learning Factual Clarification Question Generation Without Examples. https://arxiv.org/abs/2310.11571
[21] MIMICS: A Large-Scale Data Collection for Search Clarification. https://arxiv.org/abs/2006.10174
[22] Clarify When Necessary: Resolving Ambiguity Through Interaction with LMs. https://arxiv.org/abs/2311.09469
[23] Semantic Uncertainty: Linguistic Invariances for Uncertainty Estimation in Natural Language Generation. https://arxiv.org/abs/2302.09664
[24] τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains. https://arxiv.org/abs/2406.12045
[25] Pass@k vs Pass^k: Understanding Agent Reliability. https://www.philschmid.de/agents-pass-at-k
[26] Beyond pass@1: A Reliability Science Framework for Long-Horizon LLM Agents. https://arxiv.org/abs/2603.29231
[27] Do Large Language Model Benchmarks Test Reliability? https://arxiv.org/abs/2502.03461
[28] TAU-bench extension: benchmarking policy-aware agents in realistic settings. Toloka. https://toloka.ai/blog/tau-bench-extension-benchmarking-policy-aware-agents-in-realistic-settings/
[29] Judge Reliability Harness: Stress Testing the Reliability of LLM Judges. https://arxiv.org/abs/2603.05399
[30] CiteGuard: Faithful Citation Attribution for LLMs via Retrieval-Augmented Validation. https://arxiv.org/abs/2510.17853
[31] CiteME: Can Language Models Accurately Cite Scientific Claims? https://arxiv.org/abs/2407.12861
[32] Towards Fair Evaluation of Dialogue State Tracking by Flexible Incorporation of Turn-level Performances. https://arxiv.org/abs/2204.03375
[33] Mismatch between Multi-turn Dialogue and its Evaluation Metric in Dialogue State Tracking. https://arxiv.org/abs/2203.03123
[34] Towards Scalable Multi-Domain Conversational Agents: The Schema-Guided Dialogue Dataset. https://arxiv.org/abs/1909.05855
[35] MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz Dataset for Task-Oriented Dialogue Modelling. https://arxiv.org/abs/1810.00278
[36] MultiWOZ 2.1: Multi-Domain Dialogue State Corrections and State Tracking Baselines. https://arxiv.org/abs/1907.01669
[37] Cited but Not Verified: Parsing and Evaluating Source Attribution in LLM Deep Research Agents. https://arxiv.org/abs/2605.06635
