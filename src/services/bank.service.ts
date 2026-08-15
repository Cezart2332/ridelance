import { api } from '../lib/axios';

export interface BankInstitutionDto {
  id: string;
  name: string;
  logo: string | null;
}

export type BankConnectionStatus = 'Created' | 'Pending' | 'Linked' | 'Expired' | 'Error' | 'Revoked';

export interface BankAccountDto {
  ibanMasked: string | null;
  currency: string | null;
  ownerName: string | null;
}

/**
 * O conexiune apărută la provider pe care nu am putut-o atribui fără echivoc.
 *
 * Apare doar când revendicarea a refuzat să ghicească — două conexiuni noi, sau două conectări
 * în curs în același timp. Utilizatorul spune care e a lui.
 */
export interface BankConnectionCandidateDto {
  providerConnectionId: string;
  institutionName: string | null;
  institutionLogo: string | null;
  createdAtUtc: string | null;
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
  /** Linkul de conectare e de unică folosință; după el, așteptarea se oprește. */
  linkExpiresAtUtc: string | null;
  candidates: BankConnectionCandidateDto[];
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

export interface InitiateConnectionDto {
  link: string;
  expiresAtUtc: string | null;
}

export const bankService = {
  getInstitutions: async (): Promise<BankInstitutionDto[]> => {
    const response = await api.get<BankInstitutionDto[]>('/bank/institutions');
    return response.data;
  },

  /**
   * Citirea stării e și momentul în care se face revendicarea: providerul nu ne anunță când
   * cineva a terminat conectarea, deci aflăm exact când întrebăm.
   */
  getConnection: async (): Promise<BankConnectionDto | null> => {
    const response = await api.get<BankConnectionDto | null>('/bank/connection');
    return response.data;
  },

  /** `institutionId` null lasă alegerea băncii în ecranul providerului. */
  initiateConnection: async (institutionId: string | null): Promise<InitiateConnectionDto> => {
    const response = await api.post<InitiateConnectionDto>('/bank/connection', { institutionId });
    return response.data;
  },

  chooseConnection: async (providerConnectionId: string): Promise<BankConnectionDto> => {
    const response = await api.post<BankConnectionDto>('/bank/connection/choose', { providerConnectionId });
    return response.data;
  },

  getTransactions: async (params: {
    year: number;
    month: number;
    page: number;
    pageSize: number;
  }): Promise<BankTransactionsDto> => {
    const response = await api.get<BankTransactionsDto>('/bank/transactions', { params });
    return response.data;
  },

  disconnect: async (): Promise<void> => {
    await api.delete('/bank/connection');
  },
};
