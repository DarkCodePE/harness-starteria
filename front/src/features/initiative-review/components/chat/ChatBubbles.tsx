/**
 * ADR-026 (IRC-03): componentes de presentación del chat del asistente.
 *
 * Extraídos del scaffold legacy `features/initial-review` (solo la CAPA VISUAL; la lógica
 * de preguntas hardcodeadas y el mockGenerator NO se migran). Reutilizados por
 * AssistantPanel sobre el flujo API-backed (ADR-025).
 */
import React from 'react';
import { Sparkles } from 'lucide-react';

export function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3" data-testid="assistant-bubble">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-white">
        <Sparkles size={14} />
      </div>
      <div className="max-w-[78%] rounded-3xl rounded-tl-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
        {children}
      </div>
    </div>
  );
}

export function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end" data-testid="user-bubble">
      <div className="max-w-[78%] rounded-3xl rounded-tr-md bg-indigo-600 px-4 py-3 text-sm leading-6 text-white shadow-sm">
        {children}
      </div>
    </div>
  );
}

export function MinimalProgress({ currentIndex, total }: { currentIndex: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label="Progreso de revisión">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={`h-1.5 rounded-full transition-all ${index <= currentIndex ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-200'}`}
        />
      ))}
    </div>
  );
}

export function TypingIndicator({ label = 'Starteria está actualizando tu iniciativa' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 pl-11 text-sm text-slate-500" data-testid="assistant-typing">
      <span>{label}</span>
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
      </span>
    </div>
  );
}
