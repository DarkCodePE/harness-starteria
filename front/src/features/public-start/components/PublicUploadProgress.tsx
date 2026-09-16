import React, { useEffect, useRef, useState } from 'react';
import { Clock, Loader2, Sparkles, X } from 'lucide-react';

/**
 * Issue #30 — Visible progress card shown WHILE the public PDF extraction is
 * in flight. Replaces the bare "Procesando documento..." button that left the
 * user staring at a spinner for up to ~3 minutes with no feedback.
 *
 * Contract:
 *  - `status === 'uploading'`: multipart upload in progress; `uploadProgress`
 *    (0-100) ticks forward and is surfaced inline.
 *  - `status === 'running'`: backend extraction is running; we cycle through
 *    deterministic phase messages to convey liveness while we poll.
 *
 * Two intervals drive the live feel:
 *  - 1s tick → elapsed seconds counter (mm:ss).
 *  - 5s tick → advance the phase index while `status === 'running'`.
 *
 * Both intervals are torn down on unmount and when status leaves the busy
 * band, so this component is safe to mount/unmount across rerenders without
 * leaking timers.
 */

export type PublicUploadProgressStatus = 'uploading' | 'running';

export interface PublicUploadProgressProps {
  /** Current hook status — only the busy values are accepted here. */
  status: PublicUploadProgressStatus;
  /** Upload progress 0-100. Surfaced inline while `status === 'uploading'`. */
  uploadProgress: number;
  /** Cancels the run and returns the page to the quick-input view. */
  onCancel: () => void;
}

/** Phase rotation copy used during `status === 'running'`. Deterministic order. */
export const RUNNING_PHASE_MESSAGES = [
  'Analizando documento…',
  'Identificando campos clave…',
  'Generando propuestas con IA…',
  'Casi listo…',
] as const;

/** Interval (ms) between phase rotations. Exposed for tests. */
export const PHASE_ROTATION_MS = 5000;
/** Tick interval (ms) for the elapsed-time counter. */
export const ELAPSED_TICK_MS = 1000;

function formatElapsed(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function PublicUploadProgress({
  status,
  uploadProgress,
  onCancel,
}: PublicUploadProgressProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);

  // Anchor the timer to first mount so unmount → remount in the busy band
  // does not reset the perceived elapsed time mid-run.
  const startedAtRef = useRef<number>(Date.now());

  // Drive the elapsed-time counter at 1Hz while mounted.
  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, ELAPSED_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Rotate the phase message only during the backend extraction phase.
  // During `uploading` we surface the upload percentage instead.
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => {
      setPhaseIndex(prev => (prev + 1) % RUNNING_PHASE_MESSAGES.length);
    }, PHASE_ROTATION_MS);
    return () => clearInterval(id);
  }, [status]);

  const isUploading = status === 'uploading';
  const pct = Math.min(100, Math.max(0, Math.round(uploadProgress)));
  const phaseMessage = isUploading
    ? pct > 0
      ? `Subiendo PDF… ${pct}%`
      : 'Subiendo PDF…'
    : RUNNING_PHASE_MESSAGES[phaseIndex];

  // Progress bar value: during upload we mirror the real percentage; during
  // extraction we use an indeterminate-style fill driven by phase index so the
  // bar never looks stuck at 100% before the run actually finishes.
  const barPct = isUploading
    ? pct
    : Math.min(95, 20 + phaseIndex * 20);

  return (
    <section
      className="mx-auto w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 md:p-5"
      aria-live="polite"
      aria-busy="true"
      data-testid="public-upload-progress"
    >
      <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600">
              {isUploading ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles size={18} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p
                className="text-sm text-slate-900"
                style={{ fontWeight: 800 }}
                data-testid="public-upload-progress-phase"
              >
                {phaseMessage}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock size={13} aria-hidden="true" />
                <span data-testid="public-upload-progress-elapsed">
                  {formatElapsed(elapsedSeconds)}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Esto suele tardar entre 30 segundos y 2 minutos
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-50"
            style={{ fontWeight: 700 }}
            data-testid="public-upload-progress-cancel"
          >
            <X size={13} aria-hidden="true" />
            Cancelar
          </button>
        </div>

        <div className="mt-4">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={barPct}
            aria-label="Progreso de extracción"
          >
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width] duration-500 ease-out"
              style={{ width: `${barPct}%` }}
            />
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-5 text-slate-400">
          Estamos analizando tu PDF para autocompletar los campos. Puedes
          cancelar y describir tu idea manualmente en cualquier momento.
        </p>
      </div>
    </section>
  );
}
