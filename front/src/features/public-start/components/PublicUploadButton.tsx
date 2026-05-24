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
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
      style={{ fontWeight: 700 }}
    >
      <Upload size={15} />
      Subir documento
    </button>
  );
}
