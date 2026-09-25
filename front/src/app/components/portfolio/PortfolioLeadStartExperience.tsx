import React, { useState } from 'react';
import {
  ArrowRight,
  Eye,
  Rocket,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { PortfolioLeadContextStrip } from './PortfolioLeadPageElements';
import { createOrReuseStrategicFramingFromSource } from '../../../features/portfolio-lead/strategic-framing/service';

type StartOptionTone = 'emerald' | 'amber' | 'violet' | 'sky';

type StartOption = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  badge: string;
  tone: StartOptionTone;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  muted?: boolean;
};

const optionToneClasses: Record<StartOptionTone, string> = {
  emerald: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
  amber: 'border-amber-200 bg-amber-50/80 text-amber-900',
  violet: 'border-violet-200 bg-violet-50/80 text-violet-900',
  sky: 'border-sky-200 bg-sky-50/80 text-sky-900',
};

const iconToneClasses: Record<StartOptionTone, string> = {
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  violet: 'text-violet-700',
  sky: 'text-sky-700',
};

export function PortfolioLeadStartExperience({
  importOpen,
  onImportOpenChange,
  onNavigate,
}: {
  importOpen: boolean;
  onImportOpenChange: (open: boolean) => void;
  onNavigate: (path: string) => void;
}) {
  const [directOpen, setDirectOpen] = useState(false);
  const [existingOpen, setExistingOpen] = useState(false);
  const [direct, setDirect] = useState({ intendedMovement: '', whyItMatters: '', movementSignalValue: '', decisionToEnable: '' });
  const [sourceType, setSourceType] = useState<'strategic_front' | 'challenge' | 'initiative'>('strategic_front');
  const [sourceId, setSourceId] = useState('');
  const [directIdempotencyKey, setDirectIdempotencyKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const startFraming = async (input: Parameters<typeof createOrReuseStrategicFramingFromSource>[0], key?: string) => {
    setBusy(true); setError(null);
    try { const result = await createOrReuseStrategicFramingFromSource(input, key); onNavigate(result.workspacePath); }
    catch (err) { setError(err instanceof Error ? err.message : 'No pudimos iniciar Strategic Framing.'); }
    finally { setBusy(false); }
  };

  const options: StartOption[] = [
    {
      id: 'framing',
      title: 'Crear frente estratégico',
      description: 'Define una prioridad del negocio, su KPI y los retos que la activan.',
      actionLabel: 'Iniciar framing',
      badge: 'Prioridad',
      tone: 'emerald',
      icon: Sparkles,
      onClick: () => { setDirectIdempotencyKey(`direct-${Date.now()}-${Math.random().toString(36).slice(2)}`); setDirectOpen(true); },
    },
    {
      id: 'import',
      title: 'Importar iniciativas existentes',
      description: 'Sube Excel, texto o documentos para ordenarlos por frente y reto.',
      actionLabel: 'Preparar importación',
      badge: 'Siguiente paso',
      tone: 'amber',
      icon: UploadCloud,
      onClick: () => onImportOpenChange(true),
      muted: true,
    },
    {
      id: 'existing',
      title: 'Revisar algo que ya existe',
      description: 'Revisa un Frente, Reto o iniciativa existente en Strategic Framing sin modificar su registro canónico.',
      actionLabel: 'Abrir revisión estratégica',
      badge: 'Existing Portfolio',
      tone: 'violet',
      icon: Eye,
      onClick: () => setExistingOpen(true),
    },
    {
      id: 'initiative',
      title: 'Crear iniciativa individual',
      description: 'Registra una iniciativa independiente para desarrollarla con Step 0–4.',
      actionLabel: 'Ir a iniciativas',
      badge: 'Step 0–4',
      tone: 'sky',
      icon: Rocket,
      onClick: () => onNavigate('/portfolio/iniciativas'),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#fff4dc_0%,#ffffff_55%,#eaf2ff_100%)] p-6 shadow-sm md:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] tracking-[0.18em] text-slate-500">
            <Sparkles size={12} />
            PUNTO DE ENTRADA
          </div>
          <h1 className="mt-4 text-3xl text-slate-950 md:text-4xl" style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
            ¿Cómo quieres iniciar?
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-[15px]">
            Elige si quieres partir desde una prioridad estratégica, un reto concreto o información que ya existe.
          </p>
        </div>

        <PortfolioLeadContextStrip
          items={[
            { label: 'Ruta segura', value: 'Sin flujo real todavía' },
            { label: 'Importación', value: 'Siguiente fase' },
            { label: 'Secuencia', value: 'Frente → Reto → Activación → Iniciativas → Decisión' },
          ]}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {options.map(option => {
          const Icon = option.icon;
          return (
            <Card key={option.id} className={`border p-0 shadow-sm ${optionToneClasses[option.tone]}`}>
              <CardHeader className="gap-4 px-6 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 ring-1 ring-black/5 ${iconToneClasses[option.tone]}`}>
                    <Icon size={18} />
                  </div>
                  <Badge variant="outline" className="border-white/70 bg-white/85 text-slate-700">
                    {option.badge}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-950" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {option.title}
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm text-slate-600">
                    {option.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <Button
                  type="button"
                  variant={option.muted ? 'secondary' : 'outline'}
                  className="w-full justify-center rounded-2xl"
                  onClick={option.onClick}
                >
                  {option.actionLabel}
                  <ArrowRight size={14} />
                </Button>
                {option.muted ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Todavía no abre un flujo real. Solo prepara la entrada de importación.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-7">
        <div className="max-w-3xl">
          <p className="text-xs text-slate-500" style={{ fontWeight: 700 }}>SECUENCIA STARTERÍA</p>
          <h2 className="mt-1 text-xl text-slate-950" style={{ fontWeight: 700 }}>Frente estratégico → Reto → Activación → Iniciativas → Decisión</h2>
          <p className="mt-2 text-sm text-slate-600">
            La pantalla solo ayuda a elegir el punto de entrada correcto. El flujo detallado seguirá en los pasos existentes.
          </p>
        </div>
      </section>

      {error ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}</div> : null}

      {directOpen ? (
        <section className="rounded-[28px] border border-emerald-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl text-slate-950" style={{ fontWeight: 700 }}>Estructurar una prioridad, reto o necesidad</h2>
          <p className="mt-1 text-sm text-slate-600">No necesitas clasificarlo como Frente o Reto. Esa lectura permanece provisional.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">Qué quieres mover *<textarea value={direct.intendedMovement} onChange={event => setDirect({ ...direct, intendedMovement: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
            <label className="text-sm font-semibold text-slate-700">Por qué importa<textarea value={direct.whyItMatters} onChange={event => setDirect({ ...direct, whyItMatters: event.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
            <label className="text-sm font-semibold text-slate-700">Señal de movimiento<textarea value={direct.movementSignalValue} onChange={event => setDirect({ ...direct, movementSignalValue: event.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">Decisión que habilita<textarea value={direct.decisionToEnable} onChange={event => setDirect({ ...direct, decisionToEnable: event.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
          </div>
          <div className="mt-4 flex gap-3"><Button type="button" disabled={busy || !direct.intendedMovement.trim()} onClick={() => startFraming({ sourceMode: 'enterprise_direct', ...direct }, directIdempotencyKey)}>Continuar a Strategic Framing</Button><Button type="button" variant="secondary" onClick={() => setDirectOpen(false)}>Cancelar</Button></div>
        </section>
      ) : null}

      {existingOpen ? (
        <section className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl text-slate-950" style={{ fontWeight: 700 }}>Revisar algo que ya existe</h2>
          <p className="mt-1 text-sm text-slate-600">Introduce el identificador de un registro que ya puedes consultar.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Tipo<select value={sourceType} onChange={event => setSourceType(event.target.value as typeof sourceType)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"><option value="strategic_front">Strategic Front</option><option value="challenge">Challenge</option><option value="initiative">Initiative Portfolio</option></select></label>
            <label className="text-sm font-semibold text-slate-700">ID de origen<input value={sourceId} onChange={event => setSourceId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
          </div>
          <div className="mt-4 flex gap-3"><Button type="button" disabled={busy || !sourceId.trim()} onClick={() => startFraming({ sourceMode: 'existing_portfolio', sourceType, sourceId })}>Revisar en Strategic Framing</Button><Button type="button" variant="secondary" onClick={() => setExistingOpen(false)}>Cancelar</Button></div>
        </section>
      ) : null}

      <Dialog open={importOpen} onOpenChange={onImportOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importación en la siguiente fase</DialogTitle>
            <DialogDescription>
              En el siguiente paso podrás subir Excel, texto o documentos para que Starteria detecte iniciativas y proponga frentes y retos.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Por ahora esta pantalla solo prepara el punto de entrada. No sube archivos ni clasifica datos todavía.
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => onImportOpenChange(false)} className="rounded-2xl">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
