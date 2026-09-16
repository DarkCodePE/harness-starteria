import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../app/components/ui/select';
import type { CreateStrategicFrontPayload, ProposedActionDto, StrategicFrontPriority } from '../domain/copilot.types';
import {
  getStrategicFrontPayload,
  mergeStrategicFrontPayload,
  toEditableStrategicFrontPayload,
  type StrategicFrontEditablePayload,
} from '../mappers/copilot-dto-mappers';

const PRIORITIES: StrategicFrontPriority[] = ['Alta', 'Media', 'Baja'];

export function StrategicFrontActionEditor({
  action,
  disabled,
  onSave,
}: {
  action: ProposedActionDto;
  disabled: boolean;
  onSave: (payload: CreateStrategicFrontPayload) => Promise<void> | void;
}) {
  const basePayload = getStrategicFrontPayload(action);
  const [form, setForm] = useState<StrategicFrontEditablePayload>(() => toEditableStrategicFrontPayload(basePayload));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(toEditableStrategicFrontPayload(basePayload));
    setErrors({});
  }, [action.id, action.version]);

  const update = (field: keyof StrategicFrontEditablePayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'El nombre es obligatorio.';
    if (form.priority && !PRIORITIES.includes(form.priority)) nextErrors.priority = 'Prioridad inválida.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSave(mergeStrategicFrontPayload(basePayload, form));
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre" error={errors.name}>
          <Input
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label="KPI principal">
          <Input value={form.mainKpi ?? ''} onChange={(event) => update('mainKpi', event.target.value)} disabled={disabled} />
        </Field>
        <Field label="Objetivo">
          <Input value={form.objective ?? ''} onChange={(event) => update('objective', event.target.value)} disabled={disabled} />
        </Field>
        <Field label="Prioridad" error={errors.priority}>
          <Select value={form.priority ?? 'Media'} onValueChange={(value) => update('priority', value)} disabled={disabled}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Baseline">
          <Input value={form.baseline ?? ''} onChange={(event) => update('baseline', event.target.value)} disabled={disabled} />
        </Field>
        <Field label="Meta">
          <Input value={form.target ?? ''} onChange={(event) => update('target', event.target.value)} disabled={disabled} />
        </Field>
        <Field label="Horizonte">
          <Input value={form.horizon ?? ''} onChange={(event) => update('horizon', event.target.value)} disabled={disabled} />
        </Field>
        <Field label="Sponsor">
          <Input value={form.sponsor ?? ''} onChange={(event) => update('sponsor', event.target.value)} disabled={disabled} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="outline" onClick={() => void submit()} disabled={disabled}>
          <Save className="size-4" />
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-slate-700">
      <span className="mb-1 block text-xs text-slate-500" style={{ fontWeight: 700 }}>{label}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

