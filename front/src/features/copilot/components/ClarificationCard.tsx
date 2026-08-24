import React from 'react';

export function ClarificationCard({ missingInformation }: { missingInformation: string[] }) {
  if (missingInformation.length === 0) return null;
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-label="Aclaración requerida">
      <p className="text-sm text-amber-950" style={{ fontWeight: 700 }}>Necesito algunos datos antes de proponer una acción.</p>
      <p className="mt-2 text-sm text-amber-800">
        Responde en el mismo campo con: {missingInformation.join(', ')}.
      </p>
    </section>
  );
}

