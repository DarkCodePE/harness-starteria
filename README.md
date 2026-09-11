# harness-starteria

Harness de producto para **Portfolio Entry** de Starteria, pensado para gente de lead y de producto
que no es técnica.

Ocho comandos de chat sobre los contratos de `doc/`. Funcionan en Claude Code (`/comando`) y en
ChatGPT (como Proyecto).

```text
/starteria             el mapa: qué comando para qué situación
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

```
/plugin marketplace add DarkCodePE/harness-starteria
/plugin install starteria-harness@darkcodepe
```

**Desde una ruta local**, para probarlo mientras se desarrolla o para usarlo en otro harness de esta
misma máquina:

```
/plugin marketplace add /home/orlando/Desktop/harness-starteria
/plugin install starteria-harness@darkcodepe
```

Los ocho comandos aparecen escribiendo `/starteria`. Después de instalar, `/plugin` los lista.

**Lo que el plugin NO se lleva:** los contratos de `doc/`. Son de Starteria, no del harness, y un
plugin instalado en otro repo no debería arrastrarlos. Si instalás el plugin donde no hay `doc/`,
los comandos van a pedirte que pegues el contrato que necesiten en vez de inventarlo.

## Cómo está organizado

| Carpeta | Qué hay |
|---|---|
| `doc/` | Los contratos de Starteria. La autoridad. El harness no los toca |
| `skills/starteria*` | Los ocho comandos |
| `docs/` | Por qué el harness está hecho así: PRD, dominio, arquitectura, ciclos de vida, plan |
| `docs/adr/` | Las siete decisiones, con sus alternativas y su costo |

## Lo que este harness no hace

**No verifica nada solo.** No hay scripts, ni hooks, ni nada corriendo en segundo plano. Si nadie
ejecuta `/starteria-probar`, nadie sabe si el agente de Portfolio Entry se rompió. Es una decisión
registrada, no un descuido: `docs/adr/ADR-003`.

**No decide.** Interpreta, compara, marca huecos y recomienda. Aprobar, confirmar y decidir sigue
siendo de una persona, que es el invariante INV-03 del Core Contract aplicado a la herramienta que
gobierna ese contrato.

## Estado

v0.1 escrito y verificado por estructura. **Sin correr end to end todavía**: el plan de pruebas está
en `docs/PLAN.md`, fase 2.
