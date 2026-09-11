# Portfolio Entry Findings Register

| Finding ID | Fecha | Sesion | Tipo | Severidad | Evidencia | Frecuencia | Causa probable | Accion | Owner | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `REPORTING-DEBT` | 2026-09-11 | Phase 5 live runs | observabilidad | S3 baja | Reports muestran findings como `F-REVERSE_ALIGNMENT` o `F-INTENT` bajo "FAILURE DISTRIBUTION" aunque `contract_result` sea PASS. | Multiple live reports | El reporter agrupa failure codes y qualitative findings en la misma seccion. | Separar failures hard/contractuales de findings cualitativos en reportes. | [PENDIENTE] | open |
| `UTF8-DEBT` | 2026-09-11 | Phase 5 docs/artifacts | metodologia | S3 baja | Algunos documentos existentes muestran mojibake en palabras con acentos y caracteres de diagramas degradados. | Multiple docs/artifacts | Encoding historico inconsistente o render previo no UTF-8. | Auditar y normalizar encoding de documentos/artefactos afectados sin reescritura semantica. | [PENDIENTE] | open |
| `DS-OBS-01` | 2026-09-11 | `2026-09-11T07-55-20-504Z` | modelo | S2 media | En multi-turn, DeepSeek interpreto una aceleradora interna como `solution` y activo Reverse Alignment, aunque tambien detecto la ambiguedad entre solution y contenedor de portfolio. | 1 run observed | Tendencia de DeepSeek a activar Reverse Alignment ante entidades que parecen solucion organizacional. | Mantener como observacion; ampliar muestra antes de cambiar prompts o contratos. | [PENDIENTE] | open |
| `DS-OBS-02` | 2026-09-11 | `2026-09-11T07-55-20-504Z` | modelo | S3 baja | El intent evoluciono a `portfolio_prioritization`, pero `current_frame` permanecio como `portfolio_first`. | 1 run observed | Lectura conservadora del framing actual. | Mantener como observacion cualitativa; revisar con mas casos multi-turn. | [PENDIENTE] | open |
| `DS-OBS-03` | 2026-09-11 | Phase 5 DeepSeek handoffs | metodologia | S2 media | Algunos gaps portfolio-level fueron enviados a `INITIATIVE_SETUP` en Handoff. | Observado en muestra pequena | Routing metodologico ligeramente prematuro en gap resolution. | Medir frecuencia antes de modificar schema, evaluator o prompts. | [PENDIENTE] | open |
| `DS-OBS-04` | 2026-09-11 | Phase 5 DeepSeek runs | modelo | S3 baja | DeepSeek produjo mas ambiguities, missing links, alternativas y razonamiento que OpenAI para inputs comparables. | Multiple DeepSeek runs | Mayor expansion explicativa del modelo. | Medir impacto en latencia, tokens y densidad UX antes de optimizar. | [PENDIENTE] | open |
| `MODEL-ID-DEBT` | 2026-09-11 | Phase 5 live runs | observabilidad | S2 media | Los runs deben distinguir requested model, provider-reported model y alias/effective model, especialmente por routing temporal de `deepseek-v4-flash` a V4.1-Flash. | All live providers | Metadata actual no separa explicitamente todos los campos de identidad/versionado. | Registrar `requested_model`, `provider_reported_model`, provider, fecha, prompt manifest hash, schema hash y candidate manifest. | [PENDIENTE] | open |
| `COST-LATENCY-DEBT` | 2026-09-11 | Phase 5 live runs | rendimiento | S2 media | Existen mediciones de tokens por run, pero no una comparacion formal de coste/latencia por provider con muestra suficiente. | Phase 5 | La fase priorizo compatibilidad y conducta, no benchmark economico completo. | Crear medicion formal por provider antes de optimizar routing o default. | [PENDIENTE] | open |

## Tipos

- bug
- usabilidad
- narrativa
- contrato
- metodologia
- permisos
- seguridad
- rendimiento
- observabilidad
- valor
- adopcion
- comercial
- modelo
- fuera de alcance

## Severidad

- S0 critica
- S1 alta
- S2 media
- S3 baja
- oportunidad

## Reglas

- No convertir cada observacion en cambio de producto.
- No mezclar bugs bloqueantes con preferencias cualitativas.
- Registrar evidencia y frecuencia.
- Consolidar duplicados.
- Marcar explicitamente si bloquea Phase 5 o el MVP.
- No modificar contratos, prompts o evaluator por una observacion aislada.
