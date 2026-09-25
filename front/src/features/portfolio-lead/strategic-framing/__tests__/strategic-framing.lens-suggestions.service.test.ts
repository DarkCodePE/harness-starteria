import api from '../../../../app/services/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStrategicFramingLensSuggestions } from '../service';

vi.mock('../../../../app/services/api', () => ({
  default: { get: vi.fn() },
  parseApiError: (error: unknown) => error,
}));

const get = vi.mocked(api.get);

describe('getStrategicFramingLensSuggestions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads the state-scoped endpoint without a request body or client overrides', async () => {
    get.mockResolvedValueOnce({ data: { success: true, data: { stateId: 'state/1', stateVersion: 3, sourceMode: 'public_entry', depthHint: 'light', suggestions: [], generatedAt: '2026-09-24T10:00:00.000Z' } } } as never);
    await expect(getStrategicFramingLensSuggestions('state/1')).resolves.toMatchObject({ stateId: 'state/1', stateVersion: 3 });
    expect(get).toHaveBeenCalledWith('/strategic-framing/states/state%2F1/lens-suggestions');
  });
});
