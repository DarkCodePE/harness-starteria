import api from './api';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface CompanyContextVersion {
  id: string;
  versionNumber: number;
  contextScore: number;
  contextLevel: 'INITIAL' | 'BASIC' | 'USEFUL' | 'SOLID';
}

export interface CompanyArea {
  id: string;
  name: string;
  description?: string | null;
  leadRole?: string | null;
}

export interface ContextSource {
  id: string;
  sourceType: 'WEBSITE' | 'LINKEDIN' | 'FILE';
  status: string;
  url?: string | null;
  originalFilename?: string | null;
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  country: string;
  employeeRange?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  scope: 'PERSONAL' | 'ORGANIZATION';
  status: string;
  versions?: CompanyContextVersion[];
  areas?: CompanyArea[];
  sources?: ContextSource[];
}

export interface ContextScore {
  score: number;
  level: 'INITIAL' | 'BASIC' | 'USEFUL' | 'SOLID';
  label: string;
  missing: string[];
  breakdown: { coverage: number; evidence: number; freshness: number };
}

export interface CreateCompanyPayload {
  name: string;
  sector: string;
  country: string;
  employeeRange?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  areaName?: string;
}

export interface CreateAreaPayload {
  name: string;
  description?: string;
  leadRole?: string;
}

export async function listCompanies(): Promise<Company[]> {
  const { data } = await api.get<ApiEnvelope<Company[]>>('/companies');
  return data.data;
}

export async function createCompany(payload: CreateCompanyPayload): Promise<Company> {
  const { data } = await api.post<ApiEnvelope<Company>>('/companies', payload);
  return data.data;
}

export async function getCompanyScore(companyId: string): Promise<ContextScore> {
  const { data } = await api.get<ApiEnvelope<ContextScore>>(`/companies/${companyId}/context/score`);
  return data.data;
}

export async function listAreas(companyId: string): Promise<CompanyArea[]> {
  const { data } = await api.get<ApiEnvelope<CompanyArea[]>>(`/companies/${companyId}/areas`);
  return data.data;
}

export async function createArea(companyId: string, payload: CreateAreaPayload): Promise<CompanyArea> {
  const { data } = await api.post<ApiEnvelope<CompanyArea>>(`/companies/${companyId}/areas`, payload);
  return data.data;
}

export async function uploadCompanySource(companyId: string, file: File, areaId?: string): Promise<unknown> {
  const query = areaId ? `?areaId=${encodeURIComponent(areaId)}` : '';
  const { data } = await api.post<ApiEnvelope<unknown>>(`/companies/${companyId}/sources/upload${query}`, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': file.name,
    },
  });
  return data.data;
}

export async function readInitiativeCompanyContext(projectId: string): Promise<unknown> {
  const { data } = await api.get<ApiEnvelope<unknown>>(`/initiatives/${projectId}/company-context`);
  return data.data;
}
