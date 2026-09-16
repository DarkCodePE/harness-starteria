import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Circle } from 'lucide-react';
import type { PublicEditorQuestionStatus } from './PublicQuestionCard';

/**
 * Status-pill styling shared with the editor; kept in lockstep with the
 * STATUS_COPY in `PublicProposalEditor.tsx` so the trigger and options render
 * the same colors and copy as the previous vertical list.
 */
const STATUS_COPY: Partial<Record<PublicEditorQuestionStatus, { label: string; className: string }>> = {
  complete: { label: 'Completo', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  missing: { label: 'Falta completar', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  needs_improvement: { label: 'Necesita precision', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  ai_refined: { label: 'Afinado con IA', className: 'border-violet-200 bg-violet-50 text-violet-700' },
};

export type PublicFieldDropdownItem<TId extends string = string> = {
  id: TId;
  label: string;
  status: PublicEditorQuestionStatus;
};

/**
 * Accessible field selector — replaces the previous vertical button list in
 * `PublicProposalEditor`. Implements a minimal listbox combobox pattern
 * (button + popover panel) so it stays composable with the existing Tailwind
 * aesthetic. Keyboard support:
 *   - Enter / Space / ArrowDown / ArrowUp on the trigger opens the panel.
 *   - ArrowDown / ArrowUp navigate options (wrap-around).
 *   - Home / End jump to first / last option.
 *   - Enter selects the highlighted option; Escape closes without changing.
 *   - Outside-clicks and Tab close the panel.
 */
export function PublicFieldDropdown<TId extends string>({
  items,
  activeId,
  onSelect,
}: {
  items: PublicFieldDropdownItem<TId>[];
  activeId: TId;
  onSelect: (id: TId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(() => {
    const idx = items.findIndex(item => item.id === activeId);
    return idx >= 0 ? idx : 0;
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxRef = useRef<HTMLUListElement | null>(null);

  const activeItem = items.find(item => item.id === activeId) ?? items[0];

  // Anchor the highlight to the active field each time the panel opens.
  useEffect(() => {
    if (!open) return;
    const idx = items.findIndex(item => item.id === activeId);
    setHighlightIndex(idx >= 0 ? idx : 0);
  }, [open, activeId, items]);

  // Close on outside click / Escape when the panel is open.
  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Keep focus inside the listbox once it opens for predictable keyboard nav.
  useEffect(() => {
    if (open) listboxRef.current?.focus();
  }, [open]);

  const choose = (id: TId) => {
    onSelect(id);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onListboxKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex(prev => (prev + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setHighlightIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setHighlightIndex(items.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const item = items[highlightIndex];
      if (item) choose(item.id);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  const triggerStatus = STATUS_COPY[activeItem.status] ?? STATUS_COPY.review!;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Seleccionar campo"
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={onTriggerKeyDown}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-900 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100"
      >
        <span className="flex min-w-0 items-center gap-2" style={{ fontWeight: 800 }}>
          {activeItem.status === 'complete' || activeItem.status === 'ai_refined'
            ? <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
            : <Circle size={15} className="shrink-0 text-slate-300" />}
          <span className="truncate">{activeItem.label}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${triggerStatus.className}`} style={{ fontWeight: 800 }}>
            {triggerStatus.label}
          </span>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <ul
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          aria-label="Campos editables"
          onKeyDown={onListboxKeyDown}
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl focus:outline-none"
        >
          {items.map((item, index) => {
            const isActive = item.id === activeId;
            const isHighlight = index === highlightIndex;
            const statusCopy = STATUS_COPY[item.status] ?? STATUS_COPY.review!;
            return (
              <li
                key={item.id}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => choose(item.id)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${isHighlight ? 'bg-indigo-50 text-indigo-950' : 'text-slate-700'} ${isActive ? 'ring-1 ring-indigo-200' : ''}`}
              >
                <span className="flex min-w-0 items-center gap-2" style={{ fontWeight: 750 }}>
                  {item.status === 'complete' || item.status === 'ai_refined'
                    ? <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                    : <Circle size={15} className="shrink-0 text-slate-300" />}
                  <span className="truncate">{item.label}</span>
                </span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${statusCopy.className}`} style={{ fontWeight: 800 }}>
                  {statusCopy.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
