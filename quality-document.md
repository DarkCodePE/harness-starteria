# Documento de Calidad — Starteria

Instantánea de calidad por dominio de producto y capa arquitectónica. Leerlo antes de comenzar una
sesión para saber dónde el código base es más débil; actualizarlo después de cada sesión significativa.

**Escala de calificación:**

- **A**: Toda la verificación pasando, arquitectura limpia, legible para agentes, tests estables
- **B**: Verificación pasando, mayormente limpio, brechas menores en legibilidad o cobertura de tests
- **C**: Parcialmente funcionando, brechas conocidas, algunas áreas difíciles de entender para los agentes
- **D**: No funcionando, o problemas estructurales importantes

---

## Dominios de Producto

| Dominio | Calificación | Verificación | Legibilidad del Agente | Estabilidad de Tests | Brechas Clave | Última Actualización |
|---------|-------------|-------------|----------------------|---------------------|---------------|---------------------|
| Admisión (chooser Paso 0 + PDF autofill) | A | e2e passing (`pdf-autofill.spec.ts`, `public-pdf-autofill.spec.ts`) | Buena | Estable | — | 2026-07-02 |
| Steps 1–4 (flujo del participante) | B | Fix mergeado (#117) sin test de regresión dedicado | Buena | Estable en unit | Falta test de regresión de "steps vacíos + hidratación Step 1" | 2026-07-02 |
| Portfolio-lead (frente→reto→iniciativa) | B | e2e `team-inheritance.spec.ts` passing; persistencia de mutaciones (#104) sin evidencia ejecutable | Buena (ADR-023/024) | Estable | Integración con flujo de steps aún no existe (`portfolio-steps-integration`, prioridad 1) | 2026-07-02 |
| Projects (creación + validación) | B | Validación 3–200 mergeada (#91) sin evidencia ejecutable registrada | Buena | Estable en unit | Falta test que cubra la validación inline vs 422 | 2026-07-02 |
| Landing / hero | B | Sin verificación automatizada (cambio visual, `e7dd34e`) | Buena | N/A | Solo verificable manualmente | 2026-07-02 |

## Capas Arquitectónicas

| Capa | Calificación | Enforcement de Límites | Legibilidad del Agente | Brechas Clave | Última Actualización |
|------|-------------|----------------------|----------------------|---------------|---------------------|
| Front (React + Vite, `front/src`) | B | Rutas centralizadas en `front/src/app/routes.ts` | Buena | Providers de portfolio con estado local no siempre persistido | 2026-07-02 |
| Backend (tsx + API, `front` workspace) | B | Validación de entrada en endpoints principales | Buena | — | 2026-07-02 |
| Datos (Prisma + Postgres vía docker compose) | B | Esquema Prisma único | Buena | e2e requiere `npm run docker:up` (no corre en baseline `./init.sh`) | 2026-07-02 |
| Infra de tests (vitest unit + Playwright e2e) | A | Unit baseline en `./init.sh` (606 tests verdes) | Buena | e2e no forma parte de la baseline automática | 2026-07-02 |

## Historial de Cambios

### 2026-07-02

- Cambios: instantánea inicial, derivada de `feature_list.json`, `claude-progress.md` (sesión 001) y el log de commits.
- Dominios promovidos: —
- Degradados: —
- Nuevas brechas identificadas: features mergeadas sin evidencia ejecutable (#117, #104, #91); e2e fuera de la baseline.
- Brechas cerradas: —
