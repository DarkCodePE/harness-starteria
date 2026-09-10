# Plan del harness

**Versión:** v0.1
**Fecha:** 2026-09-10
**Estado:** fase 1 hecha, fase 2 sin empezar

Este es el plan versionado dentro del repo. Antes vivía en `~/.claude/plans/`, fuera del proyecto,
donde nadie del equipo lo iba a encontrar.

## Por qué existe el harness

`doc/` tiene nueve documentos y treinta y dos casos de prueba que nadie puede correr sin media hora
de lectura previa. La persona que más necesita el resultado, la que gobierna el portafolio, es la
que no va a hacer esa lectura. El detalle está en `PRD.md` §1.

## Las decisiones que fijaron el plan

Todas están argumentadas en `adr/`, con sus alternativas y su costo. Acá van solo para que se
entienda la forma del trabajo.

| Decisión | ADR |
|---|---|
| Skills en `.claude/skills/`, con prefijo `starteria-` | `ADR-001` |
| `/starteria-probar` separa responder de puntuar | `ADR-002` |
| Sin gates: nada se verifica solo, y se declara | `ADR-003` |
| Alcance v0.1: Portfolio Entry | `ADR-004` |
| Citar `doc/`, no copiarlo, salvo tres derivados | `ADR-005` |
| Un cuerpo de markdown para los dos runtimes | `ADR-006` |
| El harness no escribe en `doc/` | `ADR-007` |

## Fase 1: construir. Hecha

**Los ocho comandos**, en `.claude/skills/starteria*`:
`/starteria` (router), `/starteria-afilar`, `/starteria-autoridad`, `/starteria-probar`,
`/starteria-caso`, `/starteria-decision`, `/starteria-cierre`, `/starteria-glosario`.

**Los archivos de apoyo**: `MAPA-DE-DOCUMENTOS.md`, `GLOSARIO.md`, `PARA-CHATGPT.md`, `RUBRICA.md`,
`REGISTRO.md`, `PLANTILLA.md` de caso y `PLANTILLA-ADR.md`. Quince archivos, unas 9.300 palabras.

**Los documentos del harness**, en `docs/`: este plan, `PRD.md`, `DDD.md`, `ARCHITECTURE.md`,
`LIFECYCLE.md` y los siete ADR con su índice.

**Un puntero** en `CLAUDE.md` para que cualquier sesión de Claude Code sepa que el harness existe.

### Verificación estructural, corrida

| Qué | Resultado |
|---|---|
| Los 8 `name:` coinciden con su carpeta | OK |
| 7 user-invocable, glosario model-invocable | OK |
| Enlaces internos entre archivos del harness | 0 rotos |
| Em-dashes en el cuerpo del harness | 0 |
| Los 9 archivos de `doc/` que cita el mapa existen | OK |
| Los 3 que el mapa declara ausentes, siguen ausentes | confirmado |
| Los 32 ids de caso coinciden con el AI Harness | OK |
| Los 9 fallos duros de `RUBRICA.md` coinciden con §3, en orden | OK |
| El clon de `skills/` quedó intacto | `git status` vacío |

## Fase 2: probar. Sin empezar

Esto es lo que separa un harness escrito de un harness que sirve. Ninguno de estos pasos lo puede
dar la herramienta sola.

1. **Sesión nueva de Claude Code.** Escribir `/starteria` y confirmar que aparecen los ocho.
2. **`/starteria-probar PE-B03`** de punta a punta. Es el caso más diagnóstico: solution-first puro,
   tiene que disparar reverse alignment y no debe crear objetos canónicos. Verificar que la fase 1
   corre aislada, que salen las siete dimensiones puntuadas, los fallos duros y la capa de fallo.
3. **`/starteria-autoridad`** con un cambio que contradiga INV-03, por ejemplo "que la IA apruebe el
   frente sola". Tiene que emitir `CONFLICT` y pedir ADR, no elegir una lectura.
4. **`/starteria-glosario`**: preguntar qué es reverse alignment en medio de otra conversación y ver
   si salta sin que lo invoquen.
5. **Montar el Proyecto de ChatGPT** siguiendo `PARA-CHATGPT.md` y repetir los pasos 2 y 3.
6. **La prueba que importa:** alguien de producto que no vio esto antes corre el paso 2 sin ayuda.
   Si necesita que le expliquen qué es un fallo duro, el glosario o la rúbrica fallaron, y se
   arreglan ahí, no en la conversación.

## Fase 3: usar. Depende de la 2

El protocolo del AI Harness §18, que ya está escrito y solo hay que ejecutar:

- **Round 1**: 20 a 25 casos, una corrida cada uno. Errores gruesos.
- **Round 2**: los que fallaron y los ambiguos, tres corridas cada uno. Estabilidad.
- **Round 3**: casos reales de usuario, con `/starteria-caso`. UX y utilidad.

El criterio de salida hacia Tech Spec está en `LIFECYCLE.md` §4.

## Lo que quedó afuera, y por qué

| Fuera | Motivo |
|---|---|
| Verificación mecánica | `ADR-003`. Contradice la postura y el usuario no técnico no la puede correr |
| Suites parametrizadas por experiencia | `ADR-004`. Generalizar con un solo caso produce la abstracción equivocada |
| Empaquetado como plugin instalable | No hace falta mientras el harness viva en este repo |
| Bundle generado para ChatGPT | `ADR-006`. Es una copia más que envejece |
| Tocar `skills/`, el clon de mattpocock | `ADR-001`. Es de otro proyecto |
| Los ADR de producto | `ADR-007`. Los escribe una persona cuando haya una decisión que registrar |

## Riesgos vivos

Los cinco están en `PRD.md` §6 con su contención. Los tres que **no tienen contención mecánica**,
por decisión y no por olvido:

- Nadie corre el harness y nadie se entera.
- El `EXPECTED` de un caso nuevo se copia de lo que contestó el agente, y entonces ese caso nunca
  falla.
- `RUBRICA.md`, `GLOSARIO.md` o `MAPA-DE-DOCUMENTOS.md` quedan viejos respecto de `doc/`: no fallan,
  contestan distinto.

Decirlos es la contención. Es menos que un chequeo y más que nada.
