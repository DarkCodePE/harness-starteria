# ADR 2026-05-17 - Memoria operativa para agentes

## Estado
Aceptado

## Contexto
Despues de resolver conflictos del PR contra `main`, el proyecto quedo con una reestructura importante: el frontend vive en `front/src`, Portfolio Lead conserva la version mas reciente de la rama y Step 0 mantiene contexto heredado desde reto.

Los siguientes agentes necesitan una referencia breve para no repetir exploracion basica ni romper decisiones recientes.

## Decision
Se crea `memory.md` en la raiz del proyecto como memoria operativa resumida.

El archivo documenta:
- Rama y PR vigentes.
- Cambios principales de Portfolio Lead y Step 0.
- Estructura actual del frontend.
- Decisiones que deben respetarse.
- Archivos de referencia.
- Verificacion reciente.
- Notas de trabajo para agentes.

## Consecuencias
Positivas:
- Los agentes pueden ubicarse rapido antes de editar.
- Se reduce el riesgo de volver a usar rutas antiguas bajo `src`.
- Queda explicita la regla de documentar cambios relevantes con ADR.

Riesgos:
- `memory.md` debe actualizarse cuando cambien decisiones estructurales o de flujo.

## Verificacion
- Cambio documental sin impacto de runtime.
