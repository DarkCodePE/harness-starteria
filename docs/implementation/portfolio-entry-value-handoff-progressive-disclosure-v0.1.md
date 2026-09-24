# Portfolio Entry — Progressive Disclosure VH-2 v0.1

## 1. Jerarquía anterior

VH-1 dejó cuatro bloques dominantes en la primera vista: `Esto estoy entendiendo`, `Decisión que necesitas habilitar`, `Cómo lo abordaría Starteria` y `Lo que todavía puede cambiar la decisión`. La ruta completa de Starteria y la traza de conversación seguían siendo visibles como contenido secundario, mientras que el razonamiento, supuestos, alternativas y procedencia detallada estaban repartidos entre estructuras de datos y bloques de presentación.

## 2. Nueva jerarquía progresiva

La primera vista mantiene los cuatro bloques VH-1. Después aparece una única disclosure nativa, cerrada inicialmente, con el label `Ver análisis completo`. El CTA de continuidad permanece después de esa disclosure.

## 3. Lo que permanece en primera vista

- entendimiento sintetizado y resultado deseado;
- decisión que necesita habilitarse;
- hasta tres movimientos iniciales de Starteria;
- hasta tres elementos materiales que pueden cambiar la decisión;
- procedencia compacta;
- acciones `Continuar con mi portafolio` y `Ajustar esta lectura` sin cambios semánticos.

## 4. Lo que pasa al análisis expandido

Cuando el usuario abre `Ver análisis completo`, se muestran condicionalmente:

- `Por qué llegamos a esta lectura`, usando el rationale estructurado existente;
- `Supuestos que estamos usando`, usando assumption y known context, con distinción provisional/procedencia;
- `Contexto todavía abierto`, con pendientes adicionales y sus resoluciones existentes;
- `Evidencia o claridad que ayudaría`, únicamente para evidencia adicional no consumida por la primera vista;
- `Otras formas de empezar`, con alternative approaches existentes;
- `Ruta completa en Starteria`, como lista vertical compacta;
- `Fuente de la lectura`, con etiquetas humanas de provenance;
- la traza de conversación existente.

No se muestra chain-of-thought ni se fabrican rationale, supuestos, evidencia, KPI, baselines o targets.

## 5. Mapeo de conservación de información

| Datos actuales | Primera vista | Análisis expandido | Omitido intencionalmente |
| --- | --- | --- | --- |
| `understanding`, `desired_outcome` | Entendimiento | — | Nada |
| `decision_to_enable` | Decisión | — | Nada |
| Primeros tres `starteria_path` | Abordaje | Ruta completa | — |
| Primeros tres pendientes/evidencias | Gaps | Referenciados por contexto adicional cuando aplica | Duplicación literal |
| Pendientes restantes y `gap_resolution_map` | — | Contexto abierto y resolución | Nada disponible |
| `evidence_or_clarity_needed` restante | — | Evidencia o claridad adicional | Nada disponible |
| `recommended_approach.rationale` y `assumption` | — | Rationale y supuestos | Si no existe el campo |
| `alternative_approaches` | — | Otras formas de empezar | Si está vacío |
| `provenance_summary` y provenance estructurada | Chips compactos | Fuente de la lectura | `source_path`/IDs técnicos |
| `conversation` | — | Traza de conversación | Si está vacía |
| CTA y correction flow | CTA visible | — | Nada |

## 6. Secciones condicionales

Rationale, supuestos, contexto adicional, evidencia adicional, alternativas, ruta y procedencia solo se renderizan cuando existe contenido estructurado. La ausencia de esos campos no crea contenido sintético.

## 7. Procedencia

Se conservan etiquetas humanas para `USER_DECLARED`, `EXTRACTED_FROM_USER_TEXT`, `AI_INFERRED` y `AI_SUGGESTED`. La implementación no expone `source_path` ni identificadores internos. Las sugerencias continúan marcadas como propuestas/provisionales y no se convierten en confirmaciones humanas.

## 8. Comportamiento responsive

La ruta expandida usa una lista vertical y el análisis usa un contenedor fluido, sin grid horizontal de cinco pasos. La composición sigue siendo apilable en viewport móvil de 390px; el E2E existente conserva una captura móvil del handoff.

## 9. Accesibilidad

Se usa `<details>/<summary>` como disclosure padre: cerrado por defecto, operable con teclado y compatible con el foco visible del sistema de diseño. La jerarquía mantiene un `h1` de la lectura, `h2` para los bloques primarios y `h3` para las secciones expandidas. No se cambia el estado de sesión al abrir/cerrar.

## 10. CTA sin cambios

`Continuar con mi portafolio` y `Ajustar esta lectura` conservan destino, handlers, disabled state y orden después de la entrega de valor. VH-2 no modifica conversión, claim, autenticación ni semántica de runtime.

## 11. Archivos cambiados

- `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx`
- `front/src/features/portfolio-entry/public/__tests__/PortfolioEntryExperience.test.tsx`
- `front/e2e/portfolio-entry-conversion.spec.ts`
- este reporte

## 12. Tests

- typecheck frontend: PASS;
- tests focales de `PortfolioEntryExperience`: PASS, 19 tests;
- E2E de Portfolio Entry: PASS, 8 escenarios;
- `git diff --check`: PASS antes del commit.

## 13. Limitaciones conocidas

La disclosure no persiste su estado, por diseño: abrir/cerrar es estado local de presentación. La evidencia que ya aparece entre los tres elementos de primera vista no se repite dentro de la expansión; solo se muestran elementos adicionales. Las etiquetas visibles dependen de los campos estructurados presentes en el handoff.
