import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { adaptProject } from "../src/app/services/project.adapter";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const { ProjectService } = await import("../../backend/modules/projects/project.service");
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdIds: {
    projectId?: string;
    challengeId?: string;
    frontId?: string;
    userId?: string;
  } = {};

  try {
    const user = await prisma.user.create({
      data: {
        email: `portfolio-steps-${suffix}@starteria.test`,
        name: "Participante Integracion",
        passwordHash: "test-only",
        role: "participante",
        initials: "PI",
        skills: [],
      },
    });
    createdIds.userId = user.id;

    const front = await prisma.strategicFront.create({
      data: {
        name: `Frente integracion ${suffix}`,
        description: "Frente temporal para validar el puente portfolio-step.",
        strategicObjective: "Reducir friccion operativa en el proceso critico.",
        whyNow: "La operacion necesita evidencia para decidir este trimestre.",
        mainKpi: "Tiempo de ciclo",
        baseline: "10 dias",
        target: "5 dias",
        horizon: "Q3",
        sponsor: "Sponsor Integracion",
        status: "active",
        priority: "Alta",
      },
    });
    createdIds.frontId = front.id;

    const challenge = await prisma.challenge.create({
      data: {
        strategicFrontId: front.id,
        title: `Reto integracion ${suffix}`,
        name: `Reto integracion ${suffix}`,
        description: "Reto temporal para validar Step 0 heredado.",
        type: "crecimiento",
        whatWeWantToMove: "Disminuir espera entre aprobacion y ejecucion.",
        objective: "Validar una iniciativa que reduzca tiempos sin recapturar contexto.",
        whyNow: "Hay sponsor y equipo disponibles para una prueba corta.",
        successCriteria: "Reducir 30% el tiempo de ciclo.",
        challengeOwner: "Owner Reto Integracion",
        status: "publicado",
        activationMode: "squad_asignado",
        visibleToParticipants: true,
        assignedSquad: {
          create: [
            { value: "participante.integracion@starteria.test", role: "lider" },
            { value: "data.integracion@starteria.test", role: "colaborador" },
          ],
        },
      },
      include: {
        assignedSquad: true,
      },
    });
    createdIds.challengeId = challenge.id;

    const service = new ProjectService(prisma);
    const project = await service.createProject(user.id, {
      name: `Iniciativa vinculada ${suffix}`,
      description: "Debe nacer desde un reto y abrir Step 0 con contexto heredado.",
      challengeLink: {
        challengeId: challenge.id,
        createdFrom: "challenge",
      },
    });
    const rawProject = project as any;
    createdIds.projectId = rawProject.id;

    assert(rawProject.id, "No se creo Project para la iniciativa vinculada.");
    assert(rawProject.currentStep === 0, "El Project vinculado debe iniciar en Step 0.");
    assert(rawProject.step0Status === "IN_PROGRESS", "Step 0 debe quedar en progreso.");
    assert(Array.isArray(rawProject.steps) && rawProject.steps.length === 4, "El Project debe tener Steps 1-4 navegables.");

    const step0Data = rawProject.step0Data ?? {};
    assert(step0Data.mode === "linked_to_challenge", "Step 0 debe quedar en modo linked_to_challenge.");
    assert(step0Data.initiativeTitle === rawProject.name, "Step 0 debe heredar el nombre de la iniciativa.");
    assert(step0Data.specificChallengePart === challenge.whatWeWantToMove, "Step 0 debe heredar que se quiere mover del reto.");
    assert(step0Data.challengeGoalConnection === challenge.objective, "Step 0 debe heredar la conexion con el objetivo del reto.");
    assert(step0Data.additionalStakeholdersDetail.includes("participante.integracion@starteria.test"), "Step 0 debe heredar el squad del reto.");

    assert(Array.isArray(rawProject.portfolioMeta) && rawProject.portfolioMeta.length === 1, "Debe crearse InitiativePortfolioMeta.");
    const meta = rawProject.portfolioMeta[0];
    assert(meta.challengeId === challenge.id, "InitiativePortfolioMeta debe apuntar al reto.");
    assert(meta.strategicFrontId === front.id, "InitiativePortfolioMeta debe apuntar al frente.");
    assert(meta.currentStep === "Step 0", "Portfolio meta debe reflejar Step 0.");
    assert(Array.isArray(meta.teamMembers) && meta.teamMembers.length === 2, "Portfolio meta debe heredar miembros del squad.");

    const adapted = adaptProject(rawProject);
    assert((adapted as any).challengeLink?.challengeId === challenge.id, "El adaptador frontend debe reconstruir challengeLink desde portfolioMeta.");

    console.log("portfolio-steps-integration OK");
    console.log(`projectId=${rawProject.id}`);
    console.log(`challengeId=${challenge.id}`);
  } finally {
    if (createdIds.projectId) {
      await prisma.project.delete({ where: { id: createdIds.projectId } }).catch(() => undefined);
    }
    if (createdIds.challengeId) {
      await prisma.challenge.delete({ where: { id: createdIds.challengeId } }).catch(() => undefined);
    }
    if (createdIds.frontId) {
      await prisma.strategicFront.delete({ where: { id: createdIds.frontId } }).catch(() => undefined);
    }
    if (createdIds.userId) {
      await prisma.user.delete({ where: { id: createdIds.userId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  }
}

main().catch(async error => {
  await prisma.$disconnect().catch(() => undefined);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
