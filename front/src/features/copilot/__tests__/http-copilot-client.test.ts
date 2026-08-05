import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../app/services/api', () => {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  return {
    default: { get, post, patch },
    parseApiError: vi.fn(() => ({ code: 'UNKNOWN', message: 'Error' })),
  };
});

import api from '../../../app/services/api';
import { HttpCopilotClient } from '../api/http-copilot-client';

const apiMock = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

const client = new HttpCopilotClient();

function ok<T>(data: T) {
  return Promise.resolve({ data: { success: true, data } });
}

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
  apiMock.patch.mockReset();
});

describe('HttpCopilotClient', () => {
  it('crea conversación sin enviar usuario ni organización', async () => {
    apiMock.post.mockReturnValueOnce(ok({ id: 'c1' }));
    await client.createConversation();
    expect(apiMock.post).toHaveBeenCalledWith('/copilot/conversations', {});
  });

  it('envía mensaje al endpoint conversacional', async () => {
    apiMock.post.mockReturnValueOnce(ok({ id: 'response' }));
    await client.sendMessage('c1', 'Crear frente');
    expect(apiMock.post).toHaveBeenCalledWith('/copilot/conversations/c1/messages', { content: 'Crear frente' });
  });

  it('edita acción con versión esperada y payload', async () => {
    apiMock.patch.mockReturnValueOnce(ok({ id: 'a1' }));
    await client.updateAction('a1', { expectedVersion: 2, proposedPayload: { name: 'F1' } });
    expect(apiMock.patch).toHaveBeenCalledWith('/copilot/actions/a1', {
      expectedVersion: 2,
      proposedPayload: { name: 'F1' },
    });
  });

  it('aprueba, rechaza y ejecuta sin aceptar actores en body', async () => {
    apiMock.post.mockReturnValue(ok({ id: 'ok' }));
    await client.approveAction('a1', 2);
    await client.rejectAction('a1', { expectedVersion: 2, reason: 'No aplica' });
    await client.executeAction('a1', { expectedVersion: 2 }, 'portfolio-copilot:a1:key');

    expect(apiMock.post).toHaveBeenNthCalledWith(1, '/copilot/actions/a1/approve', { expectedVersion: 2 });
    expect(apiMock.post).toHaveBeenNthCalledWith(2, '/copilot/actions/a1/reject', {
      expectedVersion: 2,
      reason: 'No aplica',
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      3,
      '/copilot/actions/a1/execute',
      { expectedVersion: 2 },
      { headers: { 'Idempotency-Key': 'portfolio-copilot:a1:key' } },
    );
  });
});

