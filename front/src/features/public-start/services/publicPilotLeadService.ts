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
import {
  updatePublicDraft,
  getPublicDraft,
  savePublicDraft,
  getAnonymousSessionId,
  createPublicDraftId,
} from './publicDraftStorage';
import type { PublicDraft, PublicDraftOutput, PublicDraftSourceType } from '../domain/types';

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

/** Snapshot of the one-pager sent WITH the lead so the code can be redeemed. */
interface ProposalSnapshot {
  inputText?: string;
  sourceType?: string;
  title?: string;
  aiOutput?: PublicDraftOutput;
}

/** What the backend returns when a pilotCode is redeemed (no contact PII). */
interface PilotResumeDto {
  pilotCode: string;
  status: string;
  name: string;
  organization?: string | null;
  proposal: ProposalSnapshot | null;
  createdAt: string;
}

/** Outcome of redeeming a code: the lead metadata + the rehydrated draft (if any). */
export interface PilotResumeResult {
  pilotCode: string;
  name: string;
  organization?: string | null;
  /** A fresh sessionStorage draftId to continue at `/auth/continue/:draftId`, or null when the proposal wasn't recoverable (legacy lead). */
  draftId: string | null;
  createdAt: string;
}

/** Build the proposal snapshot from the locally-stored draft, if present. */
function snapshotFromDraft(draftId: string): ProposalSnapshot | undefined {
  const draft = getPublicDraft(draftId);
  if (!draft) return undefined;
  return {
    inputText: draft.inputText,
    sourceType: draft.sourceType,
    title: draft.aiOutput?.proposalTitle,
    aiOutput: draft.aiOutput,
  };
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
    // Capture the one-pager WITH the lead so the pilotCode can later be redeemed
    // to resume the initiative (the draft otherwise dies with the tab session).
    proposal: snapshotFromDraft(draftId),
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

/**
 * Redeem a pilotCode (`ST-PILOT-XXXX`) to resume the initiative. Looks up the
 * lead server-side and, when the proposal snapshot is available, rehydrates it
 * into a fresh sessionStorage draft so the user can continue at
 * `/auth/continue/:draftId`. Rejects on network/validation/404 so the caller
 * can surface "código no encontrado".
 */
export async function resumeWithPilotCode(rawCode: string): Promise<PilotResumeResult> {
  const code = rawCode.trim().toUpperCase();
  const { data: response } = await publicApi.get<ApiResponse<PilotResumeDto>>(
    `/public/pilot-leads/${encodeURIComponent(code)}`,
  );
  const dto = response.data;

  let draftId: string | null = null;
  if (dto.proposal?.aiOutput) {
    draftId = createPublicDraftId();
    const nowIso = new Date().toISOString();
    const draft: PublicDraft = {
      id: draftId,
      anonymousSessionId: getAnonymousSessionId(),
      mode: 'initiative',
      inputText: dto.proposal.inputText ?? '',
      sourceType: (dto.proposal.sourceType as PublicDraftSourceType) ?? 'text',
      aiOutput: dto.proposal.aiOutput,
      status: 'edited',
      createdAt: dto.createdAt,
      updatedAt: nowIso,
      // 24h to continue the resumed session; matches the public-draft TTL spirit.
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    savePublicDraft(draft);
  }

  return {
    pilotCode: dto.pilotCode,
    name: dto.name,
    organization: dto.organization ?? null,
    draftId,
    createdAt: dto.createdAt,
  };
}
