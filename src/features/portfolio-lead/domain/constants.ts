import type { ExecutiveOutputStatus, InitiativePortfolioStatus, PortfolioRole } from './types';

export const PORTFOLIO_LEAD_ROUTE_BASE = '/portfolio';
export const PORTFOLIO_LEAD_HOME_PATH = '/portfolio/inicio';
export const PORTFOLIO_LEAD_DEMO_EMAIL = 'portfolio@starteria.io';

export const PORTFOLIO_LEAD_ALLOWED_ROLES: PortfolioRole[] = ['portfolio_lead'];

export const ACTIVE_FRONT_STATUSES = ['active', 'tracking'] as const;
export const NON_ACTIVE_INITIATIVE_STATUSES: InitiativePortfolioStatus[] = ['bloqueada', 'cerrada'];
export const DECISION_RELEVANT_INITIATIVE_STATUSES: InitiativePortfolioStatus[] = ['bloqueada', 'lista_para_decision'];
export const FINAL_EXECUTIVE_OUTPUT_STATUSES: ExecutiveOutputStatus[] = [
  'aprobado',
  'aprobado_con_ajustes',
  'rechazado',
  'transferido',
  'escalado_a_segunda_fase',
  'cerrado',
];
