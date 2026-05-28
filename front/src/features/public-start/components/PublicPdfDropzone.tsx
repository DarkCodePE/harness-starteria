import React, { useCallback, useRef, useState } from 'react';
import { FileText, UploadCloud } from 'lucide-react';
import { validatePublicPdf } from './PublicUploadButton';

const ACCEPTED_MIME = 'application/pdf';

interface PublicPdfDropzoneProps {
  /** Called with a validated PDF (≤10MB) the user picked or dropped. */
  onFileSelected: (file: File) => void;
  /** Called when the picked file fails validation (wrong type / too large). */
  onValidationError?: (message: string) => void;
}

/**
 * Visible drag-and-drop area for uploading a PDF on the public landing.
 * Replaces the small "Subir documento" button as the primary upload affordance:
 * drop a PDF onto the card, or click anywhere on it to open the file picker.
 *
 * Busy state is handled at the page level — when an upload is in flight the
 * parent (`PublicStartPage`) swaps the entire `PublicQuickInput` for
 * `PublicUploadProgress`, so this component does not need to render a spinner.
 */
export function PublicPdfDropzone({
  onFileSelected,
  onValidationError,
}: PublicPdfDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      const error = validatePublicPdf(file);
      if (error) {
        onValidationError?.(error);
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected, onValidationError],
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    handleFile(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-picking the same file
    handleFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Arrastra un PDF o haz click para seleccionar"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="public-pdf-dropzone"
      data-drag-active={dragActive ? 'true' : 'false'}
      className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
        dragActive
          ? 'border-indigo-400 bg-indigo-50'
          : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          dragActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {dragActive ? <FileText size={18} /> : <UploadCloud size={18} />}
      </div>
      <p
        className="text-sm text-slate-700"
        style={{ fontWeight: 750 }}
      >
        {dragActive ? 'Suelta el PDF para subirlo' : 'Arrastra tu PDF aquí o haz click para seleccionar'}
      </p>
      <p className="text-[11px] text-slate-500">
        Solo PDF · máximo 10 MB · {ACCEPTED_MIME}
      </p>
    </div>
  );
}
