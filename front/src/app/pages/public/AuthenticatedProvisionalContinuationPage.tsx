import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, CheckCircle2, PencilLine } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useApp } from '../../context/AppContext';
import {
  getAuthenticatedProvisionalContinuation,
  confirmAuthenticatedProvisionalContinuation,
  correctAuthenticatedProvisionalContinuation,
  normalizePortfolioEntryApiError,
} from '../../../features/portfolio-entry/public/portfolioEntryPublicService';
import { createIdempotencyKey } from '../../../features/portfolio-entry/public/idempotency';
import { readClaimedPortfolioEntrySession } from '../../../features/portfolio-entry/public/storage';
import type { PortfolioEntrySessionDto } from '../../../features/portfolio-entry/public/types';

function displayText(value: { value: string } | 'unresolved' | undefined): string {
  if (!value || value === 'unresolved') return 'Todavía necesitamos aclararlo.';
  return value.value;
}

export function AuthenticatedProvisionalContinuationPage() {
  const { isAuthenticated, authLoading } = useApp();
  const navigate = useNavigate();
  const [session, setSession] = useState<PortfolioEntrySessionDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [understoodNeed, setUnderstoodNeed] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }
    const claimed = readClaimedPortfolioEntrySession();
    if (!claimed) {
      setError('No encontramos una entrada guardada en esta cuenta.');
      return;
    }
    let cancelled = false;
    getAuthenticatedProvisionalContinuation(claimed.sessionId)
      .then((next) => {
        if (!cancelled) {
          setSession(next);
          setUnderstoodNeed(next.provisionalContinuation?.payload.understoodNeed.value ?? '');
          setDesiredOutcome(next.provisionalContinuation?.payload.desiredOutcome.value ?? '');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(normalizePortfolioEntryApiError(err).message);
      });
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || (!session && !error)) {
    return <p className="py-16 text-center text-sm text-text-muted">Estamos recuperando lo que ya conversamos.</p>;
  }

  if (error || !session?.provisionalContinuation) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-2xl font-semibold text-text-primary">No pudimos recuperar tu entrada</h1>
          <p className="text-sm leading-6 text-text-secondary">{error ?? 'La información guardada todavía no está disponible.'}</p>
          <Button type="button" variant="outline" onClick={() => navigate('/public/start')}>Volver</Button>
        </CardContent>
      </Card>
    );
  }

  const continuation = session.provisionalContinuation;
  const { payload } = continuation;

  const saveConfirmation = async () => {
    setSaving(true);
    setError(null);
    try {
      const next = editing
        ? await correctAuthenticatedProvisionalContinuation(continuation.sessionId, {
          expectedRevision: continuation.revision,
          idempotencyKey: createIdempotencyKey('portfolio-entry:correction'),
          correctedFields: { understood_need: understoodNeed, desired_outcome: desiredOutcome },
        })
        : await confirmAuthenticatedProvisionalContinuation(continuation.sessionId, {
          expectedRevision: continuation.revision,
          idempotencyKey: createIdempotencyKey('portfolio-entry:confirmation'),
        });
      setSession(next);
      setEditing(false);
    } catch (err) {
      setError(normalizePortfolioEntryApiError(err).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="mx-auto max-w-3xl space-y-6 py-6" data-testid="authenticated-provisional-continuation">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Tu entrada guardada</p>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Esto es lo que entendimos</h1>
        <p className="text-base leading-7 text-text-secondary">Retomamos la misma conversación después de iniciar sesión. No necesitas empezar de nuevo.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Lo que quieres lograr</CardTitle></CardHeader>
        <CardContent className="space-y-4 pb-6 text-sm leading-6 text-text-secondary">
          {editing ? (
            <label className="block space-y-2 text-sm text-text-primary">Qué entendimos de tu necesidad
              <textarea aria-label="Qué entendió Starteria" className="min-h-24 w-full rounded-md border border-border-default p-3" value={understoodNeed} onChange={(event) => setUnderstoodNeed(event.target.value)} />
            </label>
          ) : <p data-testid="understood-need">{displayText(payload.understoodNeed)}</p>}
          <div>
            <p className="font-semibold text-text-primary">Resultado que buscas</p>
            {editing ? (
              <textarea aria-label="Resultado que buscas" className="mt-2 min-h-20 w-full rounded-md border border-border-default p-3" value={desiredOutcome} onChange={(event) => setDesiredOutcome(event.target.value)} />
            ) : <p data-testid="desired-outcome">{displayText(payload.desiredOutcome)}</p>}
          </div>
        </CardContent>
      </Card>

      {payload.knownContext.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Contexto útil que ya conocemos</CardTitle></CardHeader>
          <CardContent className="space-y-3 pb-6 text-sm text-text-secondary">
            {payload.knownContext.map((item) => <p key={item.key}><span className="font-semibold text-text-primary">{item.key}:</span> {item.value}</p>)}
          </CardContent>
        </Card>
      )}

      {(payload.currentOpenItems.length > 0 || payload.organizationalUnknowns.length > 0) && (
        <Card>
          <CardHeader><CardTitle>Lo que todavía necesitamos resolver</CardTitle></CardHeader>
          <CardContent className="space-y-3 pb-6 text-sm leading-6 text-text-secondary">
            {payload.currentOpenItems.map((item, index) => <p key={`open-${index}`} data-testid="open-item">{displayText(item)}</p>)}
            {payload.organizationalUnknowns.map((item) => <p key={item.gap_id} data-testid="organizational-unknown">{item.description}</p>)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Qué puede pasar ahora</CardTitle></CardHeader>
        <CardContent className="space-y-3 pb-6 text-sm leading-6 text-text-secondary">
          <p>{payload.continuationSummary?.description ?? 'Podemos seguir ordenando este contexto antes de tomar una decisión.'}</p>
          {payload.laterWorkItems.length > 0 && <p data-testid="later-work">Hay pasos de preparación que podremos retomar más adelante.</p>}
        </CardContent>
        <div className="flex flex-wrap gap-3 border-t border-border-default px-6 py-4">
          {editing ? (
            <>
              <Button type="button" onClick={saveConfirmation} disabled={saving}>{saving ? 'Guardando…' : 'Guardar corrección'}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving}>Cancelar</Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setEditing(true)}><PencilLine size={16} /> Corregir</Button>
              <Button type="button" onClick={saveConfirmation} disabled={saving}>{saving ? 'Guardando…' : 'Está bien, continuar'} <ArrowRight size={16} /></Button>
            </>
          )}
        </div>
      </Card>

      <p className="flex items-center gap-2 text-xs text-text-muted"><CheckCircle2 size={14} /> Entrada recuperada: {continuation.sessionId}</p>
    </main>
  );
}
