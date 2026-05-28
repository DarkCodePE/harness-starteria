import React from 'react';
import { Upload } from 'lucide-react';

interface PublicUploadButtonProps {
  onUnavailable: () => void;
}

export function PublicUploadButton({ onUnavailable }: PublicUploadButtonProps) {
  return (
    <button
      type="button"
      onClick={onUnavailable}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-sm shadow-slate-200/60 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/25"
      style={{ fontWeight: 720 }}
    >
      <Upload size={14} />
      Subir documento
    </button>
  );
}
