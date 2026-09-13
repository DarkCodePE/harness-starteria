# harness-starteria

Harness público de producto para **Portfolio Entry** de Starteria, pensado para gente de lead y de producto que no es técnica.

Este repositorio contiene contratos, comandos de trabajo, ADRs de harness y estado documental. No contiene ni debe incorporar `backend/`, `front/`, Prisma, runtime ni tests productivos salvo decisión explícita.

## Punto de entrada

- Estado actual: `CURRENT_STATE.md`
- Instrucciones neutrales para agentes: `AGENTS.md`
- Mapa de autoridad: `doc/STARTERIA_AUTHORITY.md`
- Core Contract: `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
- Portfolio Entry activo: `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- ADRs del harness: `docs/adr/ADR-INDEX.md`
- ADRs de producto: `doc/product-adr/ADR-INDEX.md`

## E2E

El E2E de producto fue validado en el checkout productivo/autorizado `Dashboardstarteria`.

Este repositorio conserva el harness y la documentación asociada. No es el entorno que ejecuta la runtime productiva ni debe presentarse como si contuviera una aplicación productiva certificada.

Portfolio Post-Entry Continuation fue observado como `IMPLEMENTED / LOCALLY VALIDATED` en el checkout productivo autorizado, incluyendo backend + DB, browser E2E through Portfolio Home y casos representativos del harness. Esa observación no aprueba por sí misma el contrato propuesto.

## Comandos del harness

Ocho comandos de chat trabajan sobre los contratos de `doc/`:
Diez comandos de chat sobre los contratos de `doc/`. Funcionan en Claude Code (`/comando`) y en
ChatGPT (como Proyecto).

```text
/starteria             mapa: qué comando usar en cada situación
/starteria-afilar      entrevista por rondas para afilar una idea
/starteria-autoridad   qué contrato manda, si hay conflicto, si hace falta ADR
/starteria-probar      corre un caso del AI Harness y lo puntúa
/starteria-caso        convierte una conversación real en un caso nuevo
/starteria-decision    registra un ADR
/starteria-cierre      deja el estado escrito para la próxima sesión
/starteria-glosario    explica un término del contrato
```

**Empezá por `/starteria`.** Si estás en ChatGPT, por
`skills/starteria/PARA-CHATGPT.md`.

## Instalar

Es un plugin de Claude Code. Dos caminos, según para qué lo quieras.

**Desde el marketplace**, para usarlo en cualquier repo:

```text
```

/plugin marketplace add DarkCodePE/harness-starteria
/plugin install starteria-harness@darkcodepe
```


**Desde una ruta local**, para probarlo mientras se desarrolla o para usarlo en otro harness de esta misma máquina:

```text
```
/plugin marketplace add /home/orlando/Desktop/harness-starteria
/plugin install starteria-harness@darkcodepe
```


Los diez comandos aparecen escribiendo `/starteria`. Después de instalar, `/plugin` los lista.

**Lo que el plugin NO se lleva:** los contratos de `doc/`. Son de Starteria, no del harness, y un
plugin instalado en otro repo no debería arrastrarlos. Si instalás el plugin donde no hay `doc/`,
los comandos van a pedirte que pegues el contrato que necesiten en vez de inventarlo.

## Organización

| Carpeta | Contenido |
|---|---|
| `doc/` | Contratos y autoridad de producto de Starteria |
| `doc/product-adr/` | ADRs de producto, separados de los ADRs del harness |
| `skills/starteria*` | Los diez comandos del harness / plugin |
| `docs/` | PRD, dominio, arquitectura, lifecycle, plan e historial del harness |
| `docs/adr/` | ADRs y decisiones del harness |

## Lo que este harness no hace

**No verifica nada solo.** No hay scripts, hooks ni procesos corriendo en segundo plano. Si nadie ejecuta `/starteria-probar`, el harness no certifica por sí mismo que el agente de Portfolio Entry siga cumpliendo sus contratos. Esta separación entre harness documental y runtime productivo es deliberada.

**No decide.** Interpreta, compara, marca huecos y recomienda. Aprobar, confirmar y decidir sigue siendo responsabilidad humana, de acuerdo con los invariantes y contratos vigentes de Starteria.

## Regla principal

El harness protege contratos; no redefine Starteria ni incorpora runtime productivo.
