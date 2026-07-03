# Lista de Verificación de Estado Limpio — Starteria

Revisar antes de cerrar cada sesión. Todos los ítems deben poder marcarse con evidencia real, no de memoria.

- [ ] La ruta de inicio estándar sigue funcionando: `./init.sh` termina sin error (instala deps, genera Prisma client, corre unit tests).
- [ ] La ruta de verificación estándar sigue ejecutándose: `cd front && npm test` (backend + front vitest) en verde.
- [ ] La ruta de smoke de referencia no quedó rota (o su rotura está documentada): `cd front && npm run docker:up && npm run test:e2e` (`front/e2e/pdf-autofill.spec.ts`).
- [ ] El progreso de la sesión está registrado en `claude-progress.md` (entrada de sesión completa, no campos vacíos).
- [ ] `feature_list.json` refleja el estado real: ninguna feature en `passing` sin `evidence` registrada; como máximo una en `in_progress`.
- [ ] No hay ningún paso a medio terminar sin documentar (si lo hay, va a `session-handoff.md`).
- [ ] El repo es seguro para reanudar: cambios commiteados, sin archivos temporales en la raíz.
- [ ] La próxima sesión puede continuar sin reparación manual (comandos de arranque anotados en `session-handoff.md` si cambiaron).
