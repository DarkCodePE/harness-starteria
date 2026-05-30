import { updatePublicDraft } from './publicDraftStorage';

const PILOT_LEADS_KEY = 'starteria.publicPilot.leads';

export type PilotInterestStatus = 'submitted';

export interface PilotInterestPayload {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  consentAccepted: boolean;
}

export interface PublicPilotLead extends PilotInterestPayload {
  id: string;
  draftId: string;
  status: PilotInterestStatus;
  createdAt: string;
}

export type PilotInterestEventName =
  | 'pilot_interest_started'
  | 'pilot_interest_submitted'
  | 'pilot_interest_failed';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function createPilotCode(): string {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ST-PILOT-${suffix}`;
}

function readLeads(): PublicPilotLead[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(PILOT_LEADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLeads(leads: PublicPilotLead[]): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(PILOT_LEADS_KEY, JSON.stringify(leads));
}

export function trackPilotInterestEvent(eventName: PilotInterestEventName, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const detail = { event: eventName, ...payload };
  window.dispatchEvent(new CustomEvent(eventName, { detail }));

  const dataLayer = (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
  dataLayer?.push(detail);
}

export async function submitPilotInterest(draftId: string, payload: PilotInterestPayload): Promise<PublicPilotLead> {
  const lead: PublicPilotLead = {
    id: createPilotCode(),
    draftId,
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || undefined,
    organization: payload.organization?.trim() || undefined,
    consentAccepted: payload.consentAccepted,
    status: 'submitted',
    createdAt: new Date().toISOString(),
  };

  const leads = readLeads();
  writeLeads([lead, ...leads.filter(item => item.draftId !== draftId)]);
  updatePublicDraft(draftId, { status: 'pilot_interest_submitted' });

  return lead;
}

export function getPilotInterestByDraftId(draftId: string): PublicPilotLead | null {
  return readLeads().find(lead => lead.draftId === draftId) ?? null;
}
