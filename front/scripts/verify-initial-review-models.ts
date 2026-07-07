/**
 * verify-initial-review-models.ts — IR-B1 (ADR-025).
 *
 * Verificación de integración de los modelos de la revisión inicial guiada contra
 * Postgres real. Prueba el round-trip completo y la INVARIANTE crítica de idempotencia
 * (RB-IR-017/018): a lo sumo una RouteConfirmation por revisión (@@unique reviewId).
 *
 * Crea datos temporales, valida, y limpia SIEMPRE (incluso ante fallo). Re-ejecutable.
 *
 * Uso (desde front/, donde viven el client Prisma + .env):
 *   cd front && npx tsx scripts/verify-initial-review-models.ts
 *
 * Requiere: `prisma db push` aplicado (esquema aditivo, ADR-018/025).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
}

async function main() {
  const stamp = Date.now();
  const created: { userId?: string; reviewId?: string; snapshotId?: string; projectId?: string } = {};

  try {
    // 1. Usuario temporal (owner de la revisión).
    const user = await prisma.user.create({
      data: {
        email: `ir-b1-${stamp}@starteria.test`,
        name: 'IR-B1 Verify',
        initials: 'IV',
        role: 'participante',
      },
    });
    created.userId = user.id;

    // 2. InitialReview (draft → generated).
    const review = await prisma.initialReview.create({
      data: {
        ownerId: user.id,
        status: 'generated',
        originalInput: 'Quiero mejorar el proceso de aprobación de compras menores.',
        addedContext: ['El proceso hoy se hace por correo.'],
      },
    });
    created.reviewId = review.id;
    assert(review.status === 'generated', 'review status persiste');

    // 3. Snapshot v1 (los 6 bloques congelados como JSON tipado).
    const snapshot = await prisma.initialReviewSnapshot.create({
      data: {
        reviewId: review.id,
        version: 1,
        originalInput: review.originalInput,
        understandingSummary: 'Reducir demoras en aprobaciones de compras menores.',
        suggestedChallengeType: 'correccion',
        selectedChallengeType: 'correccion',
        challengeTypeReason: 'Busca reducir una fricción operativa existente.',
        informationReadiness: 'medium',
        critique: { solid: 'Fricción clara', weak: 'Falta frecuencia', risky: 'Salto a solución', recommendedAdjustment: 'Delimitar proceso', mainRisk: 'Solución prematura' },
        strategicQuestions: [{ id: 'q1', question: '¿Dónde debería empezar?', options: ['Un proceso'], allowsUnknown: true, status: 'unanswered', shouldCarryToStep0: true }],
        improvedProposal: { suggestedName: 'Optimización de aprobación de compras menores', improvedDescription: 'Reducir demoras...', initialFocus: 'Operaciones', expectedImpact: 'Menor tiempo', nextRecommendedStep: 'Completar Step 0' },
        routePreview: [{ step: 0, name: 'Ordenar contexto', whatWillHappen: '...', expectedOutput: 'Card inicial', status: 'active' }],
        createdBy: user.id,
      },
    });
    created.snapshotId = snapshot.id;
    assert(snapshot.version === 1, 'snapshot v1');

    // Unicidad de versión: (reviewId, version) no permite duplicado.
    let dupVersionBlocked = false;
    try {
      await prisma.initialReviewSnapshot.create({
        data: {
          reviewId: review.id, version: 1, originalInput: 'x', understandingSummary: 'x',
          suggestedChallengeType: 'correccion', selectedChallengeType: 'correccion',
          critique: {}, strategicQuestions: [], improvedProposal: {}, routePreview: [], createdBy: user.id,
        },
      });
    } catch { dupVersionBlocked = true; }
    assert(dupVersionBlocked, '@@unique([reviewId, version]) bloquea snapshot duplicado');

    // 4. Project materializado (origin + snapshot link) — lo que hará createProject (IR-B4).
    const project = await prisma.project.create({
      data: {
        name: 'Optimización de aprobación de compras menores',
        ownerId: user.id,
        status: 'DRAFT',
        origin: 'from_initial_review',
        initialReviewSnapshotId: snapshot.id,
      },
    });
    created.projectId = project.id;
    assert(project.origin === 'from_initial_review', 'Project.origin persiste');
    assert(project.initialReviewSnapshotId === snapshot.id, 'Project ligado al snapshot');

    // 5. RouteConfirmation (idempotente por reviewId).
    const rc = await prisma.routeConfirmation.create({
      data: {
        reviewId: review.id,
        snapshotId: snapshot.id,
        confirmedBy: user.id,
        selectedChallengeType: 'correccion',
        createdProjectId: project.id,
        status: 'initiative_created',
      },
    });
    assert(rc.createdProjectId === project.id, 'RouteConfirmation liga el Project creado');

    // 6. INVARIANTE de idempotencia: una segunda confirmación para la misma revisión falla.
    let secondConfirmBlocked = false;
    try {
      await prisma.routeConfirmation.create({
        data: { reviewId: review.id, snapshotId: snapshot.id, confirmedBy: user.id, selectedChallengeType: 'correccion', status: 'pending' },
      });
    } catch { secondConfirmBlocked = true; }
    assert(secondConfirmBlocked, '@@unique(reviewId) impide 2 confirmaciones (RB-IR-017/018)');

    // 7. Relaciones resuelven en ambos sentidos.
    const reviewWith = await prisma.initialReview.findUnique({
      where: { id: review.id },
      include: { confirmation: true, snapshots: true },
    });
    assert(reviewWith?.confirmation?.id === rc.id, 'review.confirmation (1:1) resuelve');
    assert(reviewWith?.snapshots.length === 1, 'review.snapshots resuelve');

    const projWith = await prisma.project.findUnique({
      where: { id: project.id },
      include: { initialReviewSnapshot: true, routeConfirmation: true },
    });
    assert(projWith?.initialReviewSnapshot?.id === snapshot.id, 'project.initialReviewSnapshot resuelve');
    assert(projWith?.routeConfirmation?.id === rc.id, 'project.routeConfirmation resuelve');

    console.log('✅ IR-B1 OK — modelos InitialReview/Snapshot/RouteConfirmation + idempotencia + relaciones verificados.');
  } finally {
    // Cleanup determinista (respeta FKs): confirmation → project → snapshot → review → user.
    if (created.reviewId) await prisma.routeConfirmation.deleteMany({ where: { reviewId: created.reviewId } });
    if (created.projectId) await prisma.project.delete({ where: { id: created.projectId } }).catch(() => {});
    if (created.reviewId) await prisma.initialReview.delete({ where: { id: created.reviewId } }).catch(() => {});
    if (created.userId) await prisma.user.delete({ where: { id: created.userId } }).catch(() => {});
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ IR-B1 FALLÓ:', err.message);
  process.exit(1);
});
