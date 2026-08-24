import React from 'react';
import type { CopilotMessageDto } from '../domain/copilot.types';

export function CopilotMessageList({ messages }: { messages: CopilotMessageDto[] }) {
  if (messages.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
        Describe lo que necesitas registrar en el portafolio. Starteria preparará una propuesta antes de modificar datos.
      </p>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Conversación Portfolio Copilot">
      {messages.map((message) => (
        <li key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
              message.role === 'user'
                ? 'bg-slate-950 text-white'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            <p>{message.content}</p>
            {message.sourceReferences.length > 0 && (
              <p className={`mt-2 text-xs ${message.role === 'user' ? 'text-slate-300' : 'text-slate-500'}`}>
                Fuente: {message.sourceReferences.map((ref) => ref.label ?? ref.id).join(', ')}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

