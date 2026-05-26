# ADR 2026-05-17 - Resolucion de conflictos con main y estructura front

## Estado
Aceptado

## Contexto
El PR de Portfolio Lead quedo con conflictos porque `main` reorganizo el frontend bajo `front/src`, agrego servicios de API y movio la configuracion de build a `front/vite.config.ts`.

La rama actual tenia la version mas reciente del centro de mando de Portfolio Lead, el punto de entrada `/portfolio/iniciar`, reglas de dominio y el Step 0 con contexto heredado desde reto. Esa version debia prevalecer sin romper la nueva estructura de `main`.

## Decision
Se mantiene la estructura de `main` con frontend en `front/src`.

Se reubican los modulos de la rama dentro de esa estructura:
- `src/features/portfolio-lead` pasa a `front/src/features/portfolio-lead`.
- `src/app/step0` pasa a `front/src/app/step0`.
- Los componentes y paginas de Portfolio Lead quedan en `front/src/app`.

Se conserva la implementacion mas reciente de la rama para:
- Centro de mando de Portfolio Lead.
- Punto de entrada `/portfolio/iniciar`.
- Step 0 con contexto heredado desde reto.
- Normalizacion de estados y reglas de dominio de Portfolio Lead.

Se adapta el `AppContext` nuevo de `main` para soportar `challengeLink`, de modo que crear una iniciativa desde un reto mantenga visible la informacion ancla en Step 0.

## Consecuencias
Positivas:
- El PR queda alineado con la estructura actual de `main`.
- La version funcional mas reciente de Portfolio Lead no se pierde durante el merge.
- Step 0 puede seguir diferenciando iniciativas independientes e iniciativas vinculadas a retos.

Riesgos:
- El frontend depende ahora de instalar dependencias dentro de `front`.
- El build sigue mostrando advertencia de chunk grande; no bloquea, pero conviene revisarlo en una optimizacion posterior.

## Verificacion
- Se ejecuto `npm.cmd run build` desde `front`.
- El build termino correctamente.
