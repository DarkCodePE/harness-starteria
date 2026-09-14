# Qué documento manda en cada nivel

El Development Harness §2 define una cadena de autoridad, pero la define en abstracto
("Experience Logic Contract", "Agent Contract"). Este archivo dice cuál de los archivos reales de
`doc/` ocupa cada lugar, y cuáles todavía no existen.

**Para qué sirve:** cuando dos documentos dicen cosas distintas, gana el de arriba. Cuando la
implementación contradice cualquiera de ellos, la implementación está desactualizada hasta que
alguien decida lo contrario y lo escriba.

## La cadena

| # | Nivel | Archivo en `doc/` | Estado |
|---|---|---|---|
| 1 | Core Logic Contract | `CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` | existe, v0.2 |
| 2 | ADRs aprobados | *(ninguno todavía)* | **vacío** |
| 3 | Experience Logic Contract | `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | **NO EXISTE** |
| 4 | Agent Contract | `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` | existe, v0.1 |
| 5 | Skill Contracts | `entry-01-intent-detection_SKILL_v0.1.md`<br>`entry-02-context-extraction_SKILL_v0.1.md`<br>`entry-03-reverse-alignment_SKILL_v0.1.md`<br>`entry-04-question-planner_SKILL_v0.1.md` | existen, v0.1 |
| 6 | Technical Spec | `PORTFOLIO_ENTRY_TECH_SPEC.md` | **NO EXISTE** |
| 7 | PRDs | *(ninguno)* | vacío |
| 8 | Prototipos, mockups, prompts | *(fuera de `doc/`)* | n/a |
| 9 | Implementación actual | *(todavía no hay código)* | n/a |

## Los tres documentos que se dan por existentes y no están

Esto no es una queja, es información operativa: si un comando te manda a leerlos, no los vas a
encontrar.

**`PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`** es el hueco que más pesa. El AI Harness lo lista como
su **primera** fuente de autoridad, y el Agent Contract cuelga de él. Sin ese documento, las
preguntas de nivel experiencia (quién entra a Pantalla 1, qué Job resuelve, cuándo se considera
terminada) no tienen dónde resolverse, y terminan resolviéndose por defecto dentro del Agent
Contract, que es un nivel más abajo del que les corresponde. Cuando `/starteria-autoridad` te diga
"esto es nivel 3", vas a chocar con esto.

**`PORTFOLIO_ENTRY_TECH_SPEC.md`** todavía no debería existir: el criterio de salida del AI Harness
(§19) dice que recién se pasa a Tech Spec cuando ningún caso tiene fallo duro y el 85% está en PASS.
Su ausencia es correcta hoy. Deja de serlo el día que alguien empiece a implementar.

**`STARTERIA_AUTHORITY.md`** lo cita el Development Harness §5 como primera lectura obligatoria de
cualquier agente. No está. Su contenido, la cadena de autoridad, es lo que estás leyendo acá.

## Los dos documentos que no están en la cadena

No son contratos de producto: son las reglas de cómo se trabaja.

- **`STARTERIA_DEVELOPMENT_HARNESS_v0.1.md`**: la doctrina. Jerarquía de autoridad, cuándo hace
  falta un ADR, qué reporta un agente cuando encuentra un conflicto, y el orden
  hipótesis → contrato → casos → schema → implementación.
- **`PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md`**: los casos de prueba. Nueve suites (A a I), las siete
  dimensiones de puntaje, los fallos duros, la taxonomía de fallo y el criterio de salida. Es lo que
  corre `/starteria-probar`.

## Cómo se usa esto en una discusión

Alguien dice "en el mockup la pantalla ya crea la iniciativa". El mockup es nivel 8. El Core
Contract (nivel 1) dice en INV-03 que la IA no crea objetos canónicos, y el Agent Contract §16 lo
repite con la lista exacta. Gana el nivel 1: el mockup está proponiendo un cambio de Core, y eso
necesita un ADR antes de dibujarse, no después.

Ese es el movimiento completo. `/starteria-autoridad` lo hace por vos y deja el conflicto escrito.
