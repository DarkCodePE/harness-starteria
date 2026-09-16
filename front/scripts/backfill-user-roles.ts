/**
 * backfill-user-roles.ts — migración de ADR-029 fase 1 (issue #160 cierra la fase 2).
 *
 * Copia el rol escalar al array: `roles = [role]` para toda fila que aún no lo tenga.
 *
 * POR QUÉ HACE FALTA, y por qué el array NO tiene `@default`:
 * verificado contra Postgres, un `Role[] @default([participante])` hace que el
 * ALTER TABLE rellene TODAS las filas existentes con `{participante}` — un admin
 * quedaría indistinguible de un participante real y perdería sus privilegios en
 * silencio. Sin default, las filas sin migrar quedan en NULL, que sí es una señal
 * inequívoca, y este script las convierte.
 *
 * Idempotente: sólo toca filas con `roles` NULL o vacío, así que la segunda
 * corrida no cambia nada. Se puede correr repetidamente durante la transición.
 *
 * Uso (desde front/, donde viven el cliente de prisma y el .env):
 *   cd front && npm run db:backfill-roles
 *
 * Vive en front/scripts/ y no en backend/scripts/ a propósito: no hay node_modules
 * en la raíz del repo, así que un script bajo backend/ no resuelve '@prisma/client'
 * (el `backfill-challenge-team.ts` que hay allí falla por eso mismo). Los verify-*.ts
 * de este directorio son el precedente que sí corre.
 *
 * Deploy: correr DESPUÉS de `prisma db push` (el cambio de schema es aditivo — ADR-018).
 * No es una precondición de corrección para los lectores: `rolesForUser` cae a `role`
 * mientras el array esté vacío, así que el orden de despliegue no puede romper nada.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function backfillUserRoles(): Promise<{ migrated: number; skipped: number }> {
  // `roles` es nullable en la base (Prisma lo expone como [] al leer), así que
  // el filtro tiene que cubrir NULL y array vacío. Se hace en SQL crudo porque
  // `isEmpty` de Prisma no alcanza a las filas NULL previas al ALTER TABLE.
  const migrated = await prisma.$executeRaw`
    UPDATE "User"
       SET "roles" = ARRAY["role"]::"Role"[]
     WHERE "roles" IS NULL OR cardinality("roles") = 0
  `;

  const total = await prisma.user.count();

  return { migrated, skipped: total - migrated };
}

// Ejecutar en directo (no cuando lo importa un test).
if (process.argv[1] && process.argv[1].includes('backfill-user-roles')) {
  backfillUserRoles()
    .then(({ migrated, skipped }) => {
      // eslint-disable-next-line no-console
      console.log(`Backfill User.roles completo: migrated=${migrated}, skipped=${skipped}`);
      return prisma.$disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Fatal:', err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
