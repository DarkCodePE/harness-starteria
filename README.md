# harness-starteria

Harness publico de producto para Portfolio Entry de Starteria.

Este repositorio contiene contratos, comandos de trabajo, ADRs de harness y estado documental. No contiene ni debe incorporar `backend/`, `front/`, Prisma, runtime ni tests productivos salvo decision explicita.

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

Este repositorio conserva el harness y la documentacion asociada. No es el entorno que ejecuta la runtime productiva ni debe presentarse como si contuviera una aplicacion productiva certificada.

Portfolio Post-Entry Continuation fue observado como `IMPLEMENTED / LOCALLY VALIDATED` en el checkout productivo autorizado, incluyendo backend + DB, browser E2E through Portfolio Home y casos representativos del harness. Esa observacion no aprueba por si misma el contrato propuesto.

## Comandos del harness

Los comandos de chat viven en `.claude/skills/starteria*` y trabajan sobre los contratos de `doc/`.

```text
/starteria             mapa: que comando usar en cada situacion
/starteria-afilar      entrevista por rondas para afilar una idea
/starteria-autoridad   que contrato manda, si hay conflicto, si hace falta ADR
/starteria-probar      corre un caso del AI Harness y lo puntua
/starteria-caso        convierte una conversacion real en un caso nuevo
/starteria-decision    registra un ADR
/starteria-cierre      deja el estado escrito para la proxima sesion
/starteria-glosario    explica un termino del contrato
```

## Organizacion

| Carpeta | Contenido |
|---|---|
| `doc/` | Contratos, autoridad y ADRs de producto |
| `.claude/skills/starteria*` | Comandos del harness |
| `docs/` | PRD, dominio, arquitectura, lifecycle, plan e historial del harness |
| `docs/adr/` | ADRs del harness |

## Regla principal

El harness protege contratos; no redefine Starteria ni incorpora runtime productivo.
