import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Plus, X, AlertCircle, CheckCircle2, Users, ChevronDown, Info } from 'lucide-react';
import { createTeamMember, useApp } from '../context/AppContext';
import { usePortfolioLead } from '../portfolio/PortfolioLeadContext';
import { challengeTypeLabel } from '../portfolio/portfolioLeadCopy';

interface Invite { id: string; email: string; role: 'Editor' | 'Viewer'; status: 'Pendiente' | 'Enviado' }
interface SponsorInvite { id: string; email: string; status: 'Pendiente' | 'Enviado' }

export function CreateProjectPage() {
  const { createProject, setCurrentProject } = useApp();
  const { challenges, strategicFronts } = usePortfolioLead();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Editor' | 'Viewer'>('Editor');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [sponsorEmail, setSponsorEmail] = useState('');
  const [sponsorInvites, setSponsorInvites] = useState<SponsorInvite[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sponsorError, setSponsorError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [createError, setCreateError] = useState<string | null>(null);
  const [sponsorInfoOpen, setSponsorInfoOpen] = useState(false);
  const [sponsorInfoPinned, setSponsorInfoPinned] = useState(false);
  const sponsorInfoRef = useRef<HTMLDivElement>(null);
  const linkedChallengeId = searchParams.get('challengeId') ?? '';
  const linkedChallenge = useMemo(() => challenges.find(item => item.id === linkedChallengeId) ?? null, [challenges, linkedChallengeId]);
  const linkedFront = useMemo(
    () => linkedChallenge ? strategicFronts.find(item => item.id === linkedChallenge.strategicFrontId) ?? null : null,
    [linkedChallenge, strategicFronts],
  );

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const inviteReady = inviteEmail.trim().length > 0;
  const sponsorReady = sponsorEmail.trim().length > 0 && sponsorInvites.length < 2;

  useEffect(() => {
    if (!sponsorInfoOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (sponsorInfoRef.current?.contains(event.target as Node)) return;
      setSponsorInfoOpen(false);
      setSponsorInfoPinned(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSponsorInfoOpen(false);
      setSponsorInfoPinned(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sponsorInfoOpen]);

  // #96: when creating an iniciativa from a reto, pre-fill the team invites with the
  // reto's assigned squad (only members whose value is a valid email — the squad can
  // also hold plain names). Runs once; the user can still add/remove before creating.
  const squadPrefilledRef = useRef(false);
  useEffect(() => {
    if (squadPrefilledRef.current) return;
    const squad = linkedChallenge?.assignedSquad ?? [];
    const squadInvites: Invite[] = squad
      .filter(member => validateEmail(member.value))
      .map(member => ({
        id: `squad-${member.id}`,
        email: member.value,
        role: 'Editor',
        status: 'Pendiente',
      }));
    if (squadInvites.length > 0) {
      setInvites(squadInvites);
      squadPrefilledRef.current = true;
    }
  }, [linkedChallenge]);

  useEffect(() => {
    if (!linkedChallenge) return;
    setName(current => current || linkedChallenge.name || '');
    setDescription(current => current || linkedChallenge.objective || linkedChallenge.whatWeWantToMove || '');
  }, [linkedChallenge]);

  const addInvite = () => {
    if (!inviteEmail.trim()) return;
    if (!validateEmail(inviteEmail)) { setEmailError('El correo no es válido. Verifica que tenga @empresa.com'); return; }
    if (invites.some(i => i.email === inviteEmail) || sponsorInvites.some(i => i.email === inviteEmail)) { setEmailError('Este correo ya fue invitado.'); return; }
    setInvites(prev => [...prev, { id: Date.now().toString(), email: inviteEmail, role: inviteRole, status: 'Pendiente' }]);
    setInviteEmail('');
    setEmailError(null);
  };

  const removeInvite = (id: string) => setInvites(prev => prev.filter(i => i.id !== id));

  const addSponsorInvite = () => {
    if (!sponsorEmail.trim()) return;
    if (!validateEmail(sponsorEmail)) { setSponsorError('El correo del sponsor no es válido.'); return; }
    if (sponsorInvites.length >= 2) { setSponsorError('Solo puedes asignar hasta 2 sponsors por iniciativa.'); return; }
    if (sponsorInvites.some(i => i.email === sponsorEmail) || invites.some(i => i.email === sponsorEmail)) { setSponsorError('Este correo ya fue agregado a la iniciativa.'); return; }
    setSponsorInvites(prev => [...prev, { id: `${Date.now()}-s`, email: sponsorEmail, status: 'Pendiente' }]);
    setSponsorEmail('');
    setSponsorError(null);
  };

  const removeSponsorInvite = (id: string) => setSponsorInvites(prev => prev.filter(i => i.id !== id));

  const handleCreate = async () => {
    // #91: match the backend createProjectSchema (name 3–200) client-side so an invalid
    // name fails fast with a clear message instead of a 422 surfaced as a generic error.
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setStep(1);
      setCreateError('El nombre del proyecto debe tener al menos 3 caracteres.');
      return;
    }
    if (trimmed.length > 200) {
      setStep(1);
      setCreateError('El nombre del proyecto no puede superar 200 caracteres.');
      return;
    }
    setCreateError(null);
    setSaving(true);
    const result = await createProject(
      name.trim(),
      description.trim() || undefined,
      [
        ...invites.map(invite => createTeamMember(invite.email, invite.role)),
        ...sponsorInvites.map(invite => createTeamMember(invite.email, 'Sponsor', 'Pendiente')),
      ],
      linkedChallenge ? { challengeLink: { challengeId: linkedChallenge.id, createdFrom: 'challenge' } } : undefined,
    );
    if (result.success === false) {
      setCreateError(result.error);
      setSaving(false);
      return;
    }
    setCurrentProject(result.project);
    navigate(`/projects/${result.project.id}`);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl text-slate-900" style={{ fontWeight: 700 }}>Crear nueva iniciativa</h1>
          <p className="text-sm text-slate-500">Paso {step} de 2</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {[{ n: 1, label: 'Información básica' }, { n: 2, label: 'Invitar equipo' }].map(({ n, label }) => (
          <div key={n} className="contents">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${step >= n ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`} style={{ fontWeight: 600 }}>
                {step > n ? <CheckCircle2 size={15} /> : n}
              </div>
              <span className={`text-sm ${step >= n ? 'text-slate-800' : 'text-slate-400'}`} style={{ fontWeight: step >= n ? 500 : 400 }}>{label}</span>
            </div>
            {n < 2 && <div className={`flex-1 h-px ${step > n ? 'bg-indigo-300' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {step === 1 ? (
          <div className="space-y-5">
            {linkedChallenge && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-sm text-sky-900" style={{ fontWeight: 600 }}>Crear iniciativa dentro de reto definido</p>
                <p className="mt-1 text-xs text-sky-700">
                  Esta iniciativa quedará vinculada al reto "{linkedChallenge.name}"{linkedFront ? ` del frente ${linkedFront.name}` : ''}.
                </p>
                <p className="mt-2 text-xs text-sky-700">
                  Tipo de reto: {challengeTypeLabel(linkedChallenge.challengeType)}. En Step 0 verás el contexto heredado del reto.
                </p>
                {linkedChallenge.assignedSquad?.some(member => validateEmail(member.value)) && (
                  <p className="mt-2 text-xs text-sky-700" style={{ fontWeight: 600 }}>
                    El squad del reto se precargó como invitaciones del equipo (paso 2). Puedes ajustarlo.
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-800 mb-1.5" style={{ fontWeight: 500 }}>
                Nombre de la iniciativa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setCreateError(null); }}
                placeholder="Ej. Reducir tiempo de onboarding de empleados"
                maxLength={200}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                autoFocus
              />
              {name.trim().length > 0 && name.trim().length < 3 ? (
                <p className="text-xs text-red-600 mt-1">El nombre debe tener al menos 3 caracteres.</p>
              ) : (
                <p className="text-xs text-slate-400 mt-1">Usa el nombre del desafío que vas a resolver (mínimo 3 caracteres).</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-800 mb-1.5" style={{ fontWeight: 500 }}>
                Descripción breve <span className="text-slate-400">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe en 1–2 oraciones el problema que vas a abordar."
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-xs text-indigo-700" style={{ fontWeight: 600 }}>¿Cómo elige un buen nombre?</p>
              <p className="text-xs text-indigo-600 mt-1">Incluye el proceso o área afectada + el resultado esperado. Ejemplo: "Onboarding digital para reducir 3 semanas a 5 días".</p>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={name.trim().length < 3}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm transition-colors"
              style={{ fontWeight: 500 }}
            >
              Continuar → Invitar equipo
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-emerald-800" style={{ fontWeight: 500 }}>"{name}" listo para crear</p>
                {description && <p className="text-xs text-emerald-600 mt-0.5">{description}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-800 mb-1.5" style={{ fontWeight: 500 }}>
                Invitar miembros <span className="text-slate-400">(opcional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => { setInviteEmail(e.target.value); setEmailError(null); }}
                  onKeyDown={e => e.key === 'Enter' && addInvite()}
                  placeholder="correo@empresa.com"
                  className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${emailError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
                />
                <div className="relative">
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as 'Editor' | 'Viewer')}
                    className="appearance-none border border-slate-200 rounded-xl px-3 py-2.5 pr-7 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Lector</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <button
                  onClick={addInvite}
                  aria-label="Agregar integrante"
                  title="Agregar integrante"
                  className={`rounded-xl px-3 py-2.5 text-white transition-colors ${
                    inviteReady ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                >
                  <Plus size={16} />
                </button>
              </div>
              {emailError && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                  <AlertCircle size={11} /> {emailError}
                </p>
              )}
              <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                <p><span style={{ fontWeight: 500 }}>Editor:</span> puede editar módulos y subir evidencias.</p>
                <p><span style={{ fontWeight: 500 }}>Lector:</span> solo puede ver el avance.</p>
              </div>
            </div>

            <div className="border border-indigo-100 bg-indigo-50 rounded-2xl p-4">
              <div className="mb-3">
                <div ref={sponsorInfoRef} className="relative inline-flex items-center gap-1.5">
                  <p className="text-sm text-indigo-900" style={{ fontWeight: 600 }}>Sponsor de la iniciativa (opcional)</p>
                  <button
                    type="button"
                    aria-label="Qué es un sponsor"
                    aria-expanded={sponsorInfoOpen}
                    onMouseEnter={() => setSponsorInfoOpen(true)}
                    onMouseLeave={() => {
                      if (!sponsorInfoPinned) setSponsorInfoOpen(false);
                    }}
                    onClick={() => {
                      const nextPinned = !sponsorInfoPinned;
                      setSponsorInfoPinned(nextPinned);
                      setSponsorInfoOpen(nextPinned || !sponsorInfoOpen);
                    }}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-indigo-600 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <Info size={14} />
                  </button>
                  {sponsorInfoOpen && (
                    <div className="absolute left-0 top-7 z-20 w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-lg">
                      Un sponsor es una persona que puede orientar, respaldar o abrir camino para tu iniciativa dentro de la empresa. Su alineación ayuda a que la propuesta tenga más visibilidad y más posibilidades de avanzar. Si aún no sabes quién debería ser, puedes agregarlo después.
                    </div>
                  )}
                </div>
                <p className="text-xs text-indigo-700 mt-1">Puedes agregarlo ahora o definirlo después.</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={sponsorEmail}
                  onChange={e => { setSponsorEmail(e.target.value); setSponsorError(null); }}
                  onKeyDown={e => e.key === 'Enter' && addSponsorInvite()}
                  placeholder="sponsor@empresa.com"
                  className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${sponsorError ? 'border-red-300 bg-red-50' : 'border-indigo-200 bg-white'}`}
                />
                <button
                  onClick={addSponsorInvite}
                  disabled={sponsorInvites.length >= 2}
                  aria-label="Agregar sponsor"
                  title="Agregar sponsor"
                  className={`rounded-xl px-3 py-2.5 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    sponsorReady ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                >
                  <Plus size={16} />
                </button>
              </div>
              {sponsorError && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                  <AlertCircle size={11} /> {sponsorError}
                </p>
              )}
              <p className="text-xs text-indigo-700 mt-2">Máximo 2 sponsors por iniciativa.</p>
            </div>

            {invites.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500" style={{ fontWeight: 600 }}>INVITACIONES PENDIENTES</p>
                {invites.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-600" style={{ fontWeight: 700 }}>
                      {inv.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{inv.email}</p>
                      <p className="text-xs text-amber-600">{inv.role} · Invitación pendiente</p>
                    </div>
                    <button onClick={() => removeInvite(inv.id)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                      <X size={13} className="text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {sponsorInvites.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500" style={{ fontWeight: 600 }}>SPONSORS ASIGNADOS</p>
                {sponsorInvites.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-600" style={{ fontWeight: 700 }}>
                      {inv.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{inv.email}</p>
                      <p className="text-xs text-indigo-600">Sponsor · Invitación pendiente o por activar</p>
                    </div>
                    <button onClick={() => removeSponsorInvite(inv.id)} className="p-1 hover:bg-indigo-100 rounded-lg transition-colors">
                      <X size={13} className="text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {invites.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <Users size={16} className="text-slate-400" />
                <p className="text-sm text-slate-400">Puedes invitar personas después desde la configuración de la iniciativa.</p>
              </div>
            )}

            {createError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{createError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl py-3 text-sm transition-colors" style={{ fontWeight: 500 }}>
                ← Atrás
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-3 text-sm transition-colors"
                style={{ fontWeight: 500 }}
              >
                {saving ? 'Creando iniciativa…' : 'Crear iniciativa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
