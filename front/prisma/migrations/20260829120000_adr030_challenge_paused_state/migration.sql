-- ADR-030 (Fase 1, MVP-P1-01): la pausa del reto es un ESTADO, no un flag.
--
-- Produccion se sincroniza con `prisma db push` y no necesita este fichero (no tiene
-- historial `_prisma_migrations`; ver ADR-018). El stack e2e SI provisiona con
-- `prisma migrate deploy`, asi que sin esta migracion los tests de transiciones fallan con:
--   invalid input value for enum "ChallengeStatus": "pausado"  (SQLSTATE 22P02)
--
-- `ADD VALUE` es aditivo: no reescribe filas ni rompe los valores existentes. En
-- PostgreSQL 12+ puede ejecutarse dentro de la transaccion de la migracion siempre que
-- el valor nuevo no se USE en esa misma transaccion. Aqui no se usa: la columna de abajo
-- declara el TIPO, no el valor, y nace NULL.
ALTER TYPE "ChallengeStatus" ADD VALUE IF NOT EXISTS 'pausado';

-- `pausedFromStatus` recuerda de donde vino la pausa para reanudar sin adivinar.
-- Nullable y sin default: solo tiene valor mientras el reto esta pausado.
ALTER TABLE "Challenge" ADD COLUMN "pausedFromStatus" "ChallengeStatus";
