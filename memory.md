# Memoria del proyecto - Cambios recientes

## Contexto vigente
- La rama activa del PR es `feat-step1-architecture-capture-synthesis-v2`.
- El PR abierto es `#4`: `Centro de mando para Portfolio Lead`.
- `main` reorganizo el frontend bajo `front/src`; los cambios nuevos deben respetar esa estructura.
- El build del frontend se ejecuta desde `front` con `npm.cmd run build`.

## Cambios principales
- Se convirtio `/portfolio/inicio` en un centro de mando para Portfolio Lead.
- Se agrego `/portfolio/iniciar` como punto de entrada para elegir entre crear frente, importar iniciativas futuras, crear reto o ir a iniciativas.
- Se agrego una cola de atencion para priorizar bloqueos, decisiones y retos listos.
- Se centralizaron reglas de dominio de Portfolio Lead en `front/src/features/portfolio-lead/domain/rules.ts`.
- Se movio `src/features/portfolio-lead` a `front/src/features/portfolio-lead`.
- Se movio `src/app/step0` a `front/src/app/step0`.
- Se adapto `front/src/app/context/AppContext.tsx` para soportar `challengeLink`.
- Step 0 conserva contexto heredado cuando una iniciativa nace desde un reto.

## Decisiones a respetar
- Prevalece la version mas reciente de Portfolio Lead de esta rama.
- No crear pantallas paralelas si el ajuste cabe dentro del flujo actual.
- La importacion de iniciativas es solo una entrada preparada; todavia no sube archivos, no clasifica datos y no publica informacion.
- La IA puede orientar y analizar, pero no debe inventar evidencia ni asumir validaciones no realizadas.
- Cada cambio relevante debe quedar documentado con un ADR en `docs`.

## Archivos de referencia
- `docs/adr-2026-05-17-portfolio-lead-command-center.md`
- `docs/adr-2026-05-17-resolucion-conflictos-front-main.md`
- `docs/starteria-step-logic.md`
- `docs/starteria-ux-writing.md`
- `docs/starteria-review-rules.md`

## Verificacion reciente
- `npm.cmd run build` desde `front` compila correctamente.
- El build muestra advertencia no bloqueante por chunk grande.
- `npm install` en `front` reporto vulnerabilidades heredadas del arbol actual de dependencias.

## Notas para proximos agentes
- Antes de editar pantallas o componentes, identificar step y modulo, objetivo funcional, riesgos del flujo actual, propuesta UX/UI y UX Writing.
- Mantener copy en espanol latino claro.
- Mantener visible la informacion ancla cuando un modulo dependa de datos previos.
- Evitar limpiar trailing whitespace masivo de archivos de `main` dentro de cambios funcionales no relacionados.
