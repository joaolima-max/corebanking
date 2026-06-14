export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    timestamp: string;
    total: number;
    page: number;
    limit: number;
    cursor?: string;
  };
}

export type OrganizationType = 'BASS' | 'WHITE_LABEL' | 'COMPANY' | 'MERCHANT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_MFA';
export type AccountType = 'OPERATIONAL' | 'RESERVE' | 'SETTLEMENT' | 'CLIENT' | 'ESCROW';
export type AccountStatus = 'ACTIVE' | 'BLOCKED' | 'CLOSED';
export type LedgerAccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type EntryDirection = 'DEBIT' | 'CREDIT';
export type JournalEntryStatus = 'POSTED' | 'VOIDED';
