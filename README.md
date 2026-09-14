# Dashboard Starteria

Repositorio mixto de Starteria: contratos, harness, auditorias, estado documental y superficies de implementacion controlada.

Este repo no debe tratarse como runtime productivo certificado por defecto. La presencia de frontend, backend, Prisma, runtime o tests no autoriza por si sola cambios productivos.

Desde DS-05 y DS-06 existen pilotos frontend de producto autorizados por slice y documentados en `docs/design-system/`. Nuevas migraciones frontend deben tener alcance explicito, leer la autoridad aplicable y preservar Core, AI, permisos, esquemas, rutas y semantica de producto salvo autorizacion especifica.

## Punto de entrada

- Estado actual: `CURRENT_STATE.md`
- Instrucciones neutrales para agentes: `AGENTS.md`
- Mapa de autoridad: `doc/STARTERIA_AUTHORITY.md`
- Core Contract: `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
- Portfolio Entry activo: `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- ADRs del harness: `docs/adr/ADR-INDEX.md`
- ADRs de producto: `doc/product-adr/ADR-INDEX.md`
- Sistema de diseño y pilotos por slice: `docs/design-system/`

## E2E

El E2E de producto fue validado en el checkout productivo/autorizado `Dashboardstarteria`.

Este repositorio conserva el harness y la documentación asociada. No es el entorno que ejecuta la runtime productiva ni debe presentarse como si contuviera una aplicación productiva certificada.

Portfolio Post-Entry Continuation fue observado como `IMPLEMENTED / LOCALLY VALIDATED` en el checkout productivo autorizado, incluyendo backend + DB, browser E2E through Portfolio Home y casos representativos del harness. Esa observación no aprueba por sí misma el contrato propuesto.

## Comandos del harness

Diez comandos de chat sobre los contratos de `doc/`:

```text
/starteria             mapa: qué comando usar en cada situación
/starteria-afilar      entrevista por rondas para afilar una idea difusa
/starteria-autoridad   qué contrato manda, si hay conflicto, si hace falta ADR
/starteria-caso        convierte una conversación real en un caso nuevo
/starteria-revisar     revisa un caso antes de correrlo, para que el número signifique algo
/starteria-probar      corre un caso del AI Harness y lo puntúa
/starteria-patron      busca la causa común entre varias corridas que fallaron
/starteria-decision    registra un ADR de producto
/starteria-cierre      deja el estado escrito para la próxima sesión
/starteria-glosario    explica un término del contrato
```

**Empezá por `/starteria`.** Es el mapa: dada tu situación, te dice cuál de los otros nueve
corresponde, así no hace falta acordarse de la lista.

De los diez, nueve corren sin instalar nada más. `/starteria-patron` necesita memoria indexada
(gbrain) porque lee corridas viejas; es la única con esa dependencia, y `ADR-010` la nombra.

## Instalar

Es un plugin, y corre en dos runtimes desde una sola carpeta `skills/` — sin archivos duplicados
(`ADR-011`).

### Claude Code

**Desde el marketplace**, para usarlo en cualquier repo:

```text
/plugin marketplace add DarkCodePE/harness-starteria
/plugin install starteria-harness@darkcodepe
```

**Desde una ruta local**, para probarlo mientras se desarrolla:

```text
/plugin marketplace add /home/orlando/Desktop/harness-starteria
/plugin install starteria-harness@darkcodepe
```

Después de instalar, `/plugin` los lista.

### Codex

**Dentro de este repo** no hay que instalar nada: el symlink `.agents/skills → ../skills` está
commiteado y Codex lo sigue al escanear.

```text
cd <este repo>
codex
/skills        # deberían aparecer los diez starteria*
```

**No está verificado todavía.** Nadie corrió esto en Codex: lo estructural sí se comprobó (las diez
skills con frontmatter completo, el manifiesto válido), el descubrimiento real no. Es el primer
criterio abierto de `ADR-011 §5`. Lo que se degrada en Codex y por qué está en
[`codex/README.md`](codex/README.md), sin tapar: la fase 1 de `/starteria-probar` pierde el
aislamiento que en Claude Code impone el runtime, y `disable-model-invocation` no se honra.

### Lo que el plugin NO se lleva

Los contratos de `doc/`. Son de Starteria, no del harness, y un plugin instalado en otro repo no
debería arrastrarlos. Si instalás el plugin donde no hay `doc/`, los comandos van a pedirte que
pegues el contrato que necesiten en vez de inventarlo.

Tampoco se lleva `.mcp.json` ni nada que quede suelto en la raíz. El paquete que se distribuye es
`plugins/starteria-harness/`, generado por `scripts/sync-plugin-mirror.sh` desde `skills/` y
`agents/`: lo que no está en esa lista no entra. Eso cierra la fuga que `ADR-008 §4` había dejado
declarada y abierta.

## Organización

| Carpeta | Contenido |
|---|---|
| `doc/` | Contratos y autoridad de producto de Starteria |
| `doc/product-adr/` | ADRs de producto, separados de los ADRs del harness |
| `skills/starteria*` | Los diez comandos — fuente única, la leen los dos runtimes |
| `agents/` | El subagente de fase 1 de `/starteria-probar` |
| `plugins/starteria-harness/` | Paquete de distribución, **generado**: no editar a mano |
| `codex/` | Cómo corre en Codex y qué se degrada ahí |
| `scripts/` | Verificación del productor y generación del mirror |
| `docs/` | PRD, dominio, arquitectura, lifecycle, plan e historial del harness |
| `docs/adr/` | ADRs y decisiones del harness |

## Las dos verificaciones no se mezclan

Es `ADR-009`, y es la distinción que más cuesta perder de vista:

- **`scripts/verify.sh`** comprueba que el *plugin* cargue: manifiestos válidos, diez skills con
  frontmatter completo, la tabla de `AGENTS.md` al día, el mirror sin deriva. Una máquina puede
  hacerlo, y hay que correrlo a mano.
- **`/starteria-probar`** comprueba que el *agente de Portfolio Entry* se comporte bien. Eso lo
  verifica una persona, y no hay forma de automatizarlo sin volverlo mentira.

## Lo que este harness no hace

**No verifica nada solo.** Nada corre en segundo plano: no hay hooks, ni CI que puntúe casos, ni
proceso que despierte. `verify.sh` existe pero comprueba estructura, no comportamiento, y alguien
tiene que escribirlo en una terminal. Si nadie ejecuta `/starteria-probar`, nadie sabe si el agente
de Portfolio Entry sigue cumpliendo sus contratos. Es `ADR-003`, y es una decisión registrada, no un
descuido.

**No decide.** Interpreta, compara, marca huecos y recomienda. Aprobar, confirmar y decidir sigue
siendo responsabilidad humana, de acuerdo con los invariantes y contratos vigentes de Starteria.
Ningún comando promueve un documento a `aceptado`: eso lo firma una persona (`ADR-007`).

## Regla principal

La presencia de codigo en el arbol no autoriza cambios productivos. Cualquier incorporacion o evolucion productiva requiere una decision explicita previa y reporte de alcance.
