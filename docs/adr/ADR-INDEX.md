# Registro de ADR del harness

Las decisiones de diseño de **esta herramienta**: por qué probar tiene dos fases, por qué no hay
gates, por qué las skills no viven donde las pidieron. Decisiones durables.

## Hay dos series de ADR y no se mezclan

| | ADR de **harness** (esta serie) | ADR de **producto** (Starteria) |
|---|---|---|
| Qué cambian | cómo funciona la herramienta | una regla del producto |
| Dónde viven | `docs/adr/` | serían nivel 2 de la cadena de autoridad, junto a `doc/` |
| Formato | el de este archivo | Development Harness §4.6, plantilla en `/starteria-decision` |
| Quién los escribe | quien mantiene el harness | quien gobierna el producto |
| Cuántos hay | 7 | **ninguno todavía** |

`ADR-001` de una serie no tiene nada que ver con `ADR-001` de la otra. Cuando
`/starteria-decision` redacte el primer ADR de producto, va a ser el `ADR-001` **de esa serie**, y
no se numera después del séptimo de acá.

## Todos están en `proposed`, a propósito

Ninguno está `accepted` porque `accepted` significa que una persona lo aprobó, y eso no lo puede
hacer la herramienta que los escribió. Es `ADR-007` aplicado a sí mismo.

Para firmar uno: `status: accepted`, `aprobado_por: <tu nombre>`, `aprobado_en: <fecha>`.

## Índice

| ID | Título | Estado | Lo que se paga |
|----|--------|--------|----------------|
| [ADR-001](ADR-001-skills-en-claude-skills-no-en-el-clon.md) | Las skills viven en `.claude/skills/`, no dentro del clon de mattpocock | proposed | quedan mezcladas con las skills de ruflo |
| [ADR-002](ADR-002-probar-separa-responder-de-puntuar.md) | `/starteria-probar` separa responder de puntuar, y declara la contaminación | proposed | correr un caso cuesta dos pasos |
| [ADR-003](ADR-003-sin-gates-la-verificacion-es-humana-y-se-declara.md) | Sin gates: nada se verifica solo, y el harness lo dice en voz alta | proposed | si nadie corre nada, nadie se entera |
| [ADR-004](ADR-004-alcance-v01-portfolio-entry.md) | El alcance de v0.1 es Portfolio Entry, no Starteria entero | proposed | las suites están incrustadas en dos comandos |
| [ADR-005](ADR-005-citar-doc-no-copiarlo.md) | Los comandos citan `doc/`; solo dos archivos derivan contenido | proposed | `RUBRICA.md` puede quedar vieja sin fallar |
| [ADR-006](ADR-006-un-cuerpo-de-markdown-dos-runtimes.md) | Un cuerpo de markdown para Claude Code y ChatGPT, con el renombrado como precio | proposed | el armado de ChatGPT es manual |
| [ADR-007](ADR-007-el-harness-no-escribe-en-doc.md) | El harness no escribe en `doc/`, y ningún comando promueve a `aceptado` | proposed | los casos redactados esperan a que alguien los integre |

La columna de la derecha existe porque un registro de decisiones que solo cuenta las ventajas no
sirve para revisarlas después.

## Formato

Frontmatter con `id`, `title`, `status`, `type`, `date`, `deciders`, `supersedes`, `superseded_by`,
`aprobado_por`, `aprobado_en`, `review_trigger` y `tags`. Cuerpo en seis secciones: contexto y
problema, decisión, alternativas consideradas, consecuencias (positivas y negativas), criterios de
aceptación, gatillos de revisión, más historial.

Tomado del harness del BCR (`docs/adr/`), sin los campos `hu` y `spec`, que son de su flujo de
historias de usuario y acá no aplican.
