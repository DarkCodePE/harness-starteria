import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStrategicFramingLensSuggestions } from '../service';
import { useStrategicFramingLensSuggestions } from '../useStrategicFramingLensSuggestions';

vi.mock('../service', () => ({ getStrategicFramingLensSuggestions: vi.fn() }));

const getLens = vi.mocked(getStrategicFramingLensSuggestions);
const resultFor = (version: number) => ({ stateId: 'state-1', stateVersion: version, sourceMode: 'enterprise_direct' as const, depthHint: 'standard' as const, suggestions: [{ lens: 'technology' as const, label: 'Technology', reason: 'Razón', materialQuestion: 'Pregunta', sourceRefs: [], confidence: 'medium' as const }], generatedAt: '2026-09-24T10:00:00.000Z' });

describe('useStrategicFramingLensSuggestions', () => {
  beforeEach(() => { vi.clearAllMocks(); getLens.mockResolvedValue(resultFor(1)); });

  it('loads by state id, retries reads, and resets local interaction on saved version changes', async () => {
    const { result, rerender } = renderHook(({ version }) => useStrategicFramingLensSuggestions('state-1', version), { initialProps: { version: 1 } });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.explore('technology'));
    act(() => result.current.hide(result.current.suggestions[0]));
    expect(result.current.hiddenCount).toBe(1);
    getLens.mockResolvedValueOnce(resultFor(2));
    rerender({ version: 2 });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(getLens).toHaveBeenCalledTimes(2);
    expect(result.current.hiddenCount).toBe(0);
    expect(result.current.expandedLens).toBeNull();
    expect(result.current.suggestions).toHaveLength(1);
  });
});
