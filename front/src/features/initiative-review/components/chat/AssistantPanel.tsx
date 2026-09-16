/**
 * ADR-026 (IRC-03): shell del asistente conversacional (panel derecho).
 *
 * Presentación pura + estado local del input. NO contiene lógica de agenda: recibe los
 * mensajes ya resueltos y notifica el envío por callback. El orquestador (IRC-04) es quien
 * deriva los mensajes desde el review y mapea cada envío a add-context/strategic-answers.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { AssistantBubble, UserBubble, TypingIndicator } from './ChatBubbles';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: React.ReactNode;
}

export interface AssistantPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  busy?: boolean; // el snapshot se está regenerando → TypingIndicator + input bloqueado
  disabled?: boolean; // la conversación terminó (p.ej. ruta confirmada)
  placeholder?: string;
  toolbar?: React.ReactNode; // selector de modo (IRC-04), renderizado sobre el input
  footer?: React.ReactNode; // acciones bajo el input (p.ej. confirmar ruta — IRC-06)
}

export function AssistantPanel({ messages, onSend, busy, disabled, placeholder, toolbar, footer }: AssistantPanelProps) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll al último mensaje o al indicador de escritura. `scrollIntoView` puede no
  // existir en entornos de test (jsdom) → optional call sobre el método.
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages.length, busy]);

  const canSend = text.trim().length > 0 && !busy && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <aside
      data-testid="assistant-panel"
      aria-label="Asistente de revisión"
      className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-slate-50"
    >
      <header className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Asistente Starteria</p>
        <p className="text-xs text-slate-500">Te ayudo a completar tu iniciativa antes de confirmar la ruta.</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4" data-testid="assistant-history">
        {messages.map((m) =>
          m.role === 'assistant' ? (
            <AssistantBubble key={m.id}>{m.content}</AssistantBubble>
          ) : (
            <UserBubble key={m.id}>{m.content}</UserBubble>
          ),
        )}
        {busy && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-200 p-3">
        {toolbar && <div className="mb-2">{toolbar}</div>}
        <div className="flex items-end gap-2">
          <textarea
            data-testid="assistant-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            disabled={busy || disabled}
            rows={2}
            placeholder={disabled ? 'La conversación terminó.' : (placeholder ?? 'Escribe tu respuesta, contexto o duda…')}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none disabled:bg-slate-100"
          />
          <button
            type="button"
            data-testid="assistant-send"
            onClick={submit}
            disabled={!canSend}
            aria-label="Enviar"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
        {footer && <div className="mt-2">{footer}</div>}
      </div>
    </aside>
  );
}
