import { api } from '../lib/axios';

export interface BankInstitutionDto {
  /** Codul băncii la furnizor („BT", „BCR", …), nu un identificator de-al nostru. */
  id: string;
  name: string;
  logo: string | null;
  /** Banca cere numele de utilizator pe care clientul îl folosește la ea. */
  requiresPsuId: boolean;
  /** Banca cere să spunem dacă e cont de persoană fizică sau de firmă. */
  requiresPsuIdType: boolean;
  /** Banca cere IBAN-ul contului pentru care se dă acordul. */
  requiresIban: boolean;
}

export type BankConnectionStatus = 'Created' | 'Pending' | 'Linked' | 'Expired' | 'Error' | 'Revoked';

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
  /** Autorizarea la bancă are termen; după el, așteptarea se oprește. */
  linkExpiresAtUtc: string | null;
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
  /** Adresa băncii, unde utilizatorul autorizează accesul. */
  link: string;
  expiresAtUtc: string | null;
}

/** Ce trimite ecranul de conectare. Câmpurile opționale sunt cerute doar de anumite bănci. */
export interface InitiateConnectionInput {
  bankCode: string;
  psuId?: string | null;
  psuIdType?: string | null;
  psuCorporateId?: string | null;
  iban?: string | null;
  tcAccepted: boolean;
}

export const bankService = {
  getInstitutions: async (): Promise<BankInstitutionDto[]> => {
    const response = await api.get<BankInstitutionDto[]>('/bank/institutions');
    return response.data;
  },

  /**
   * Citirea stării e și momentul finalizării: furnizorul nu ne sună înapoi când cineva termină
   * autorizarea la bancă, deci aflăm exact când întrebăm.
   */
  getConnection: async (): Promise<BankConnectionDto | null> => {
    const response = await api.get<BankConnectionDto | null>('/bank/connection');
    return response.data;
  },

  /** Deschide consimțământul și întoarce adresa băncii unde se autorizează. */
  initiateConnection: async (input: InitiateConnectionInput): Promise<InitiateConnectionDto> => {
    const response = await api.post<InitiateConnectionDto>('/bank/connection', input);
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
