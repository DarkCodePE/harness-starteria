import React, { useRef } from 'react';
import { Loader2, Upload } from 'lucide-react';

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export interface PublicUploadButtonProps {
  /**
   * Called once a valid PDF (≤10MB) is picked. When omitted (or the feature
   * flag is off) the button falls back to `onUnavailable` — preserving the
   * original "Próximamente" stub behaviour with zero visual change.
   */
  onFileSelected?: (file: File) => void;
  /** Legacy fallback: shown when uploads are unavailable / feature flag off. */
  onUnavailable?: () => void;
  /** Surface a validation error to the caller (e.g. wrong type / too large). */
  onValidationError?: (message: string) => void;
  /** Disables the picker and shows a spinner while an upload is in flight. */
  busy?: boolean;
  /** Master switch — when false the legacy stub behaviour is used. */
  enabled?: boolean;
}

export function validatePublicPdf(file: File): string | null {
  const isPdf =
    file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) return 'Solo se admiten archivos PDF.';
  if (file.size > MAX_PDF_BYTES) return 'El PDF supera el límite de 10 MB.';
  if (file.size === 0) return 'El archivo está vacío.';
  return null;
}

export function PublicUploadButton({
  onFileSelected,
  onUnavailable,
  onValidationError,
  busy = false,
  enabled = false,
}: PublicUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Feature flag off OR no upload handler → behave exactly like the old stub.
  const usesStub = !enabled || !onFileSelected;

  const handleClick = () => {
    if (busy) return;
    if (usesStub) {
      onUnavailable?.();
      return;
    }
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow re-picking the same file later.
    event.target.value = '';
    if (!file) return;
    const error = validatePublicPdf(file);
    if (error) {
      onValidationError?.(error);
      return;
    }
    onFileSelected?.(file);
  };

  return (
    <>
      {!usesStub && (
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={handleChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ fontWeight: 700 }}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {busy ? 'Procesando documento...' : 'Subir documento'}
      </button>
    </>
  );
}
