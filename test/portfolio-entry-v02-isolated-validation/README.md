# Portfolio Entry v0.2 isolated validation

Estado: `CANDIDATE` / `BLOCKED_PENDING_VALIDATION`.

Este laboratorio ejecuta el runtime candidato de `backend/modules/portfolio-entry-runtime` sin importar el router productivo ni modificar consumidores v0.1. Produce dos resultados separados:

- `CONTRACT CONFORMANCE`: invariantes estructurales y de sesión ya documentadas.
- `HYPOTHESIS VALIDATION`: señales experimentales, siempre `INCONCLUSIVE` sin revisión humana.

La suite es deliberadamente determinista. No llama a un proveedor externo, no persiste en Prisma y no crea objetos de producto. El test se ejecuta explícitamente desde `front/`:

```powershell
npm.cmd exec -- vitest run --config vitest.backend.config.ts ../test/portfolio-entry-v02-isolated-validation/isolated-validation.test.ts
```

El adapter usa la clase `PortfolioEntrySessionController` y los schemas del runtime candidato. La versión de contrato v0.1 y los consumidores v0.1 no se importan ni se editan; las regresiones v0.1 se representan como fixtures de referencia aislados.
