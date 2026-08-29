/**
 * initiative-read-only.test.ts — ADR-030 (MVP-P1-02), nivel SERVICIO.
 *
 * `initiative-state-machine.test.ts` fija la regla en abstracto. Esto comprueba el
 * comportamiento que pide la feature: **pausar ⇒ solo lectura**, y que se comprueba EN EL
 * SERVIDOR. Deshabilitar el boton en la UI seria decoracion — el mismo error que ADR-029
 * erradico en autorizacion.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectService } from '../../projects/project.service';
import { AppError } from '../../../shared/errors/AppError';

function makeService(metaStatuses: string[]) {
  const projectUpdate = vi.fn().mockResolvedValue({ id: 'p1' });
  const prisma: any = {
    initiativePortfolioMeta: {
      findMany: vi.fn().mockResolvedValue(metaStatuses.map(status => ({ status }))),
    },
    // `updateStep0` llama a syncInitiativeProgress al final. No es lo que se prueba aqui,
    // pero sin estos stubs falla (no-fatal) y ensucia la salida con stacks que no son señal.
    project: { update: projectUpdate, findUnique: vi.fn().mockResolvedValue(null) },
    initiativeCycle: { findFirst: vi.fn().mockResolvedValue(null) },
  };
  const service = new ProjectService(prisma);
  // getProject hace su propia autorizacion y lecturas; aqui lo que se prueba es el guard
  // de ciclo de vida que corre DESPUES, asi que se neutraliza.
  vi.spyOn(service, 'getProject').mockResolvedValue({ id: 'p1' } as any);
  return { service, projectUpdate };
}

async function capture(fn: () => Promise<unknown>): Promise<AppError> {
  try {
    await fn();
  } catch (err) {
    return err as AppError;
  }
  throw new Error('se esperaba un AppError y la llamada tuvo exito');
}

describe('ADR-030 · una iniciativa pausada o cerrada es de solo lectura', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('rechaza la escritura de Step 0 con 409 cuando esta pausada', async () => {
    const { service, projectUpdate } = makeService(['paused']);

    const err = await capture(() => service.updateStep0('p1', 'u1', 'participante' as any, { foo: 'bar' } as any));

    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('INITIATIVE_READ_ONLY');
    expect(projectUpdate, 'no debia llegar a escribir').not.toHaveBeenCalled();
  });

  it('tambien cuando esta cerrada, y con el deletreo legacy `cerrada`', async () => {
    for (const status of ['closed', 'cerrada']) {
      const { service, projectUpdate } = makeService([status]);
      const err = await capture(() => service.updateStep0('p1', 'u1', 'participante' as any, {} as any));
      expect(err.statusCode, status).toBe(409);
      expect(projectUpdate, status).not.toHaveBeenCalled();
    }
  });

  it('`bloqueada` NO congela: trabajar en ella es como se desbloquea', async () => {
    const { service, projectUpdate } = makeService(['bloqueada']);

    await service.updateStep0('p1', 'u1', 'participante' as any, {} as any);

    expect(projectUpdate).toHaveBeenCalledTimes(1);
  });

  it('una iniciativa en curso escribe con normalidad', async () => {
    const { service, projectUpdate } = makeService(['en_step_2']);

    await service.updateStep0('p1', 'u1', 'participante' as any, {} as any);

    expect(projectUpdate).toHaveBeenCalledTimes(1);
  });

  it('un proyecto suelto (sin meta de portafolio) no tiene ciclo que respetar', async () => {
    const { service, projectUpdate } = makeService([]);

    await service.updateStep0('p1', 'u1', 'participante' as any, {} as any);

    expect(projectUpdate).toHaveBeenCalledTimes(1);
  });

  it('si CUALQUIERA de sus metas esta congelada, congela', async () => {
    // Una iniciativa puede estar vinculada a mas de un reto; basta que uno la haya cerrado.
    const { service, projectUpdate } = makeService(['en_step_2', 'closed']);

    const err = await capture(() => service.updateStep0('p1', 'u1', 'participante' as any, {} as any));

    expect(err.statusCode).toBe(409);
    expect(projectUpdate).not.toHaveBeenCalled();
  });
});
