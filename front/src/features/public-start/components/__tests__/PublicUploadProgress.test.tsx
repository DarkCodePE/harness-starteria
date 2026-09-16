import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PHASE_ROTATION_MS,
  PublicUploadProgress,
  RUNNING_PHASE_MESSAGES,
} from '../PublicUploadProgress';

/**
 * Issue #30 — visible progress card during the public PDF extraction.
 *
 * These tests focus on the three behaviours the user feedback explicitly
 * called out as missing: an elapsed timer that proves liveness, a rotating
 * phase message during the long backend run, and an inline upload percentage
 * so subjects know the upload itself is progressing. Cancel + cleanup round
 * out the unit surface.
 */

describe('PublicUploadProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the elapsed timer at 00:00 on mount and ticks forward each second', () => {
    render(
      <PublicUploadProgress
        status="running"
        uploadProgress={0}
        onCancel={() => {}}
      />,
    );

    const elapsed = screen.getByTestId('public-upload-progress-elapsed');
    expect(elapsed.textContent).toBe('00:00');

    // Advance 3s — the 1s ticker should have fired three times.
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(elapsed.textContent).toBe('00:03');

    // Cross the minute boundary to exercise the mm:ss formatting.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(elapsed.textContent).toBe('01:03');
  });

  it('rotates the running-phase message after the rotation interval', () => {
    render(
      <PublicUploadProgress
        status="running"
        uploadProgress={0}
        onCancel={() => {}}
      />,
    );

    const phase = screen.getByTestId('public-upload-progress-phase');
    expect(phase.textContent).toBe(RUNNING_PHASE_MESSAGES[0]);

    // One rotation tick → message advances to index 1.
    act(() => {
      vi.advanceTimersByTime(PHASE_ROTATION_MS);
    });
    expect(phase.textContent).toBe(RUNNING_PHASE_MESSAGES[1]);

    // Another rotation tick → index 2.
    act(() => {
      vi.advanceTimersByTime(PHASE_ROTATION_MS);
    });
    expect(phase.textContent).toBe(RUNNING_PHASE_MESSAGES[2]);
  });

  it('surfaces the upload percentage inline while status === uploading', () => {
    const { rerender } = render(
      <PublicUploadProgress
        status="uploading"
        uploadProgress={0}
        onCancel={() => {}}
      />,
    );

    // 0% → no percentage in the message (avoids the noisy "0%" jump).
    expect(screen.getByTestId('public-upload-progress-phase').textContent)
      .toBe('Subiendo PDF…');

    rerender(
      <PublicUploadProgress
        status="uploading"
        uploadProgress={42}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByTestId('public-upload-progress-phase').textContent)
      .toBe('Subiendo PDF… 42%');
  });

  it('does not rotate the phase message while status === uploading', () => {
    render(
      <PublicUploadProgress
        status="uploading"
        uploadProgress={10}
        onCancel={() => {}}
      />,
    );

    const phase = screen.getByTestId('public-upload-progress-phase');
    expect(phase.textContent).toBe('Subiendo PDF… 10%');

    // Even past the rotation interval, the message stays anchored to upload
    // copy — rotation only kicks in once the run is `running`.
    act(() => {
      vi.advanceTimersByTime(PHASE_ROTATION_MS * 3);
    });
    expect(phase.textContent).toBe('Subiendo PDF… 10%');
  });

  it('calls onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <PublicUploadProgress
        status="running"
        uploadProgress={0}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByTestId('public-upload-progress-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('clears both intervals on unmount (no leaked ticks)', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = render(
      <PublicUploadProgress
        status="running"
        uploadProgress={0}
        onCancel={() => {}}
      />,
    );

    // Two intervals are scheduled when `status === 'running'`: the 1s elapsed
    // ticker and the 5s phase rotator. Unmounting must clear both — otherwise
    // they would tick into a stale `setState` and surface React warnings.
    const beforeUnmountCalls = clearSpy.mock.calls.length;
    unmount();
    const afterUnmountCalls = clearSpy.mock.calls.length;

    expect(afterUnmountCalls - beforeUnmountCalls).toBeGreaterThanOrEqual(2);

    // Advancing time post-unmount must not throw or warn — proves the cleanup
    // really did detach the ticks.
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
    }).not.toThrow();
  });

  it('renders the expected-duration helper copy', () => {
    render(
      <PublicUploadProgress
        status="running"
        uploadProgress={0}
        onCancel={() => {}}
      />,
    );

    // Tolerant phrasing per spec — backend can still spike to ~3 min today.
    expect(
      screen.getByText(/Esto suele tardar entre 30 segundos y 2 minutos/i),
    ).toBeInTheDocument();
  });
});
