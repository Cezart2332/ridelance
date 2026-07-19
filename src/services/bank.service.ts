import { api } from '../lib/axios';

export interface BankInstitutionDto {
  id: string;
  name: string;
  logo: string | null;
  maxHistoricalDays: number;
}

export type BankConnectionStatus =
  | 'Created'
  | 'Pending'
  | 'Linked'
  | 'Expired'
  | 'Error'
  | 'Revoked';

export interface BankAccountDto {
  ibanMasked: string | null;
  currency: string | null;
  ownerName: string | null;
}

export interface BankConnectionDto {
  status: BankConnectionStatus;
  institutionId: string;
  institutionName: string;
  institutionLogo: string | null;
  consentExpiresAtUtc: string | null;
  linkedAtUtc: string | null;
  lastSyncedAtUtc: string | null;
  errorMessage: string | null;
  accounts: BankAccountDto[];
}

export interface BankTransactionDto {
  id: string;
  bookingDate: string | null;
  amount: number;
  currency: string;
  counterpartyName: string | null;
  remittanceInfo: string | null;
  isPending: boolean;
}

export interface BankTransactionsDto {
  items: BankTransactionDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalIn: number;
  totalOut: number;
}

export const bankService = {
  async getInstitutions(): Promise<BankInstitutionDto[]> {
    const { data } = await api.get<BankInstitutionDto[]>('/bank/institutions');
    return data;
  },

  async getConnection(): Promise<BankConnectionDto | null> {
    const { data } = await api.get<BankConnectionDto | null>('/bank/connection');
    return data ?? null;
  },

  async initiateConnection(institutionId: string): Promise<{ link: string }> {
    const { data } = await api.post<{ link: string }>('/bank/connection', { institutionId });
    return data;
  },

  async finalizeConnection(reference: string, code?: string | null): Promise<BankConnectionDto> {
    const { data } = await api.post<BankConnectionDto>('/bank/connection/finalize', {
      reference,
      code: code ?? null,
    });
    return data;
  },

  async getTransactions(params: {
    year?: number;
    month?: number;
    page?: number;
    pageSize?: number;
  }): Promise<BankTransactionsDto> {
    const { data } = await api.get<BankTransactionsDto>('/bank/transactions', { params });
    return data;
  },

  async disconnect(): Promise<void> {
    await api.delete('/bank/connection');
  },
};
