/**
 * ADR-026 v2: subir un documento (PDF/docx/txt/md) como contexto de la revisión. Compacto,
 * pensado para vivir en el AssistantPanel. Valida tipo/tamaño en cliente; la extracción y la
 * regeneración ocurren en el backend (POST /initial-reviews/:id/add-document).
 */
import React, { useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (debe coincidir con MAX_DOC_BYTES del backend)
const ACCEPT = '.pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown';
const EXT_OK = /\.(pdf|docx?|txt|md|text|markdown)$/i;

export function validateDocument(file: File): string | null {
  if (file.size === 0) return 'El documento está vacío.';
  if (file.size > MAX_BYTES) return 'El documento supera 10 MB.';
  if (!EXT_OK.test(file.name) && !/pdf|word|text|markdown/i.test(file.type)) {
    return 'Formato no soportado. Usa PDF, Word (.docx) o texto (.txt/.md).';
  }
  return null;
}

export interface ReviewDocumentDropzoneProps {
  onUpload: (file: File) => void;
  busy?: boolean;
  disabled?: boolean;
}

export function ReviewDocumentDropzone({ onUpload, busy, disabled }: ReviewDocumentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const blocked = busy || disabled;

  const pick = (file: File | undefined) => {
    if (!file) return;
    const err = validateDocument(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onUpload(file);
  };

  return (
    <div>
      <button
        type="button"
        data-testid="doc-dropzone"
        disabled={blocked}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!blocked) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!blocked) pick(e.dataTransfer.files?.[0]); }}
        className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${
          dragOver ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-300 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
        }`}
      >
        <Paperclip size={13} />
        {busy ? 'Procesando documento…' : 'Adjuntar documento (PDF, Word, txt) como contexto'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        data-testid="doc-input"
        className="sr-only"
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }}
      />
      {error && <p role="alert" className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
