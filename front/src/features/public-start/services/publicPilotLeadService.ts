/* ------------------------------------------------------------------ */
/*  publicPilotLeadService.ts — HTTP layer for the PUBLIC (anonymous)    */
/*  pilot-interest capture (PRD-003 / SPEC-003 / ADR-015).               */
/*                                                                       */
/*  Persists leads through the backend (`POST /public/pilot-leads`).     */
/*  localStorage is kept ONLY as an idempotency/offline cache keyed by   */
/*  draftId — never the source of truth. On a network failure the submit */
/*  rejects so the caller can surface the error and retry; the form data */
/*  lives in component state, so nothing is lost.                        */
/* ------------------------------------------------------------------ */

import axios from 'axios';
import { updatePublicDraft } from './publicDraftStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const PILOT_LEADS_KEY = 'starteria.publicPilot.leads';

// Bare axios instance: no Authorization header, no 401-refresh redirect.
// Anonymous visitors must never be bounced to /auth.
const publicApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

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
  pilotCode: string;
  status: PilotInterestStatus;
  createdAt: string;
}

export type PilotInterestEventName =
  | 'pilot_interest_started'
  | 'pilot_interest_submitted'
  | 'pilot_interest_failed';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PilotLeadDto {
  id: string;
  pilotCode: string;
  status: PilotInterestStatus;
  createdAt: string;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
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

function cacheLead(lead: PublicPilotLead): void {
  const leads = readLeads();
  writeLeads([lead, ...leads.filter(item => item.draftId !== lead.draftId)]);
}

export function trackPilotInterestEvent(
  eventName: PilotInterestEventName,
  payload: Record<string, unknown> = {},
) {
  if (typeof window === 'undefined') return;
  const detail = { event: eventName, ...payload };
  window.dispatchEvent(new CustomEvent(eventName, { detail }));

  const dataLayer = (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
  dataLayer?.push(detail);
}

/**
 * Submit interest in the pilot. Persists server-side and caches the result
 * locally for idempotency. Rejects on network/validation failure so the caller
 * can keep the form and retry.
 */
export async function submitPilotInterest(
  draftId: string,
  payload: PilotInterestPayload,
): Promise<PublicPilotLead> {
  const body = {
    draftId,
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || undefined,
    organization: payload.organization?.trim() || undefined,
    consentAccepted: payload.consentAccepted,
  };

  const { data: response } = await publicApi.post<ApiResponse<PilotLeadDto>>('/public/pilot-leads', body);
  const dto = response.data;

  const lead: PublicPilotLead = {
    id: dto.id,
    draftId,
    pilotCode: dto.pilotCode,
    name: body.name,
    email: body.email,
    phone: body.phone,
    organization: body.organization,
    consentAccepted: payload.consentAccepted,
    status: dto.status,
    createdAt: dto.createdAt,
  };

  cacheLead(lead);
  updatePublicDraft(draftId, { status: 'pilot_interest_submitted' });
  return lead;
}

/** Read a previously-submitted lead from the local idempotency cache. */
export function getPilotInterestByDraftId(draftId: string): PublicPilotLead | null {
  return readLeads().find(lead => lead.draftId === draftId) ?? null;
}
