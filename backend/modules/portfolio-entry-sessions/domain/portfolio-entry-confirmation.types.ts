export const PORTFOLIO_ENTRY_CONFIRMATION_STATUSES = [
  'UNREVIEWED',
  'PARTIALLY_CONFIRMED',
  'CONFIRMED',
  'REVISIONS_REQUESTED',
] as const;

export type PortfolioEntryConfirmationStatus = (typeof PORTFOLIO_ENTRY_CONFIRMATION_STATUSES)[number];

export type PortfolioEntryConfirmationFieldMap = Record<string, unknown>;

export type PortfolioEntryConfirmation = {
  id: string;
  sessionId: string;
  handoffId: string;
  version: number;
  status: PortfolioEntryConfirmationStatus;
  acceptedFields: string[];
  correctedFields: PortfolioEntryConfirmationFieldMap;
  rejectedFields: string[];
  notes?: string;
  confirmedByUserId?: string | null;
  confirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
