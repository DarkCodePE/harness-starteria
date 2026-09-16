import React, { useId, useState } from 'react';
import { Loader2, SendHorizonal } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Textarea } from '../../../app/components/ui/textarea';
import { cn } from '../../../app/components/ui/utils';
import { CompanyContextSelector, SelectedCompanyContext } from '../../../app/components/company-context/CompanyContextSelector';

interface InitiativeComposerProps {
  value: string;
  onChange: (value: string) => void;
  companyContext: SelectedCompanyContext | null;
  onCompanyContextChange: (value: SelectedCompanyContext | null) => void;
  onSubmit: () => void;
  busy: boolean;
  error?: string | null;
  emptyCompanyMessage?: string | null;
}

export function InitiativeComposer({
  value,
  onChange,
  companyContext,
  onCompanyContextChange,
  onSubmit,
  busy,
  error,
  emptyCompanyMessage,
}: InitiativeComposerProps) {
  const inputId = useId();
  const helpId = useId();
  const errorId = useId();
  const [focused, setFocused] = useState(false);
  const canSubmit = value.trim().length >= 40 && !busy;

  return (
    <div className="mt-6" aria-busy={busy}>
      <div
        data-testid="initiative-composer"
        className={cn(
          'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition',
          'hover:border-indigo-200',
          focused && 'border-indigo-400 ring-4 ring-indigo-100',
        )}
      >
        <label htmlFor={inputId} className="sr-only">Describe tu iniciativa</label>
        <Textarea
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-describedby={`${helpId}${error ? ` ${errorId}` : ''}`}
          rows={8}
          placeholder="Describe lo que quieres lograr, resolver o poner en marcha..."
          className="max-h-72 min-h-48 resize-y border-0 bg-white px-5 py-5 text-base leading-6 shadow-none outline-none focus-visible:ring-0 md:text-sm"
        />
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:items-start sm:justify-between">
          <CompanyContextSelector
            value={companyContext}
            onChange={onCompanyContextChange}
            onEmptySubmitMessage={emptyCompanyMessage}
          />
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="h-10 w-full shrink-0 bg-indigo-600 px-4 font-semibold hover:bg-indigo-700 sm:w-auto"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
            <span className="inline-block min-w-[112px]">{busy ? 'Revisando...' : 'Revisar propuesta'}</span>
          </Button>
        </div>
      </div>
      <p id={helpId} className="mt-3 text-xs text-slate-500">
        Escribe al menos 40 caracteres. Evita incluir informacion sensible o confidencial.
      </p>
      {error && <p id={errorId} role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
