/**
 * backfill-initiative-status.ts — ADR-030 fase 1 (MVP-P1-02), reconciliación de vocabulario.
 *
 * Unifica `InitiativePortfolioMeta.status = 'cerrada'` → `'closed'`.
 *
 * POR QUÉ HACE FALTA:
 * dos caminos escribían el MISMO estado con deletreos distintos —
 * `portfolioMetaCompletionUpdate` ponía `cerrada` (legacy) mientras
 * `updateDecisionLifecycleProjectionTx` ponía `closed` (canónico). Preguntar "¿está
 * cerrada?" exigía saber cuál de los dos la había escrito. Desde ADR-030 el servidor
 * sólo escribe `closed`; este script arrastra lo que quedó del régimen anterior.
 *
 * `bloqueada` NO se toca: no es un deletreo alternativo de nada, es otro concepto
 * (impedimento reversible, y sigue aceptando escrituras de step). Confundirlo con
 * `paused` era el otro bug de la reconciliación, no un caso de este backfill.
 *
 * Idempotente: sólo toca filas en `cerrada`, así que la segunda corrida no cambia nada.
 *
 * NO es precondición de corrección: los lectores normalizan con
 * `canonicalInitiativeStatus`, así que una fila sin migrar se comporta igual que una
 * migrada. Por eso puede correrse cuando se quiera, y el orden de despliegue no rompe nada.
 *
 * Uso (desde front/, donde viven el cliente de prisma y el .env):
 *   cd front && npm run db:backfill-initiative-status
 *
 * Prod se sincroniza con `prisma db push` y no aplica migraciones (ADR-018), así que este
 * dato NO se arregla solo con el deploy: hay que correr el script (o el workflow de
 * db-maintenance) explícitamente.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const pending = await prisma.initiativePortfolioMeta.count({
    where: { status: 'cerrada' as any },
  });

  if (pending === 0) {
    console.log('[backfill:initiative-status] nada que migrar (0 filas en `cerrada`).');
    return;
  }

  if (dryRun) {
    console.log(`[backfill:initiative-status] DRY RUN — migraría ${pending} fila(s) 'cerrada' → 'closed'.`);
    return;
  }

  const result = await prisma.initiativePortfolioMeta.updateMany({
    where: { status: 'cerrada' as any },
    data: { status: 'closed' as any },
  });

  const left = await prisma.initiativePortfolioMeta.count({ where: { status: 'cerrada' as any } });
  console.log(`[backfill:initiative-status] migradas=${result.count} restantes=${left}`);
  if (left !== 0) {
    // Si esto salta, algo escribió `cerrada` DURANTE el backfill: hay un escritor legacy vivo.
    throw new Error(`quedaron ${left} filas en 'cerrada' tras el backfill: revisa si algún escritor sigue usando el deletreo legacy`);
  }
}

main()
  .catch(err => {
    console.error('[backfill:initiative-status] falló:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
