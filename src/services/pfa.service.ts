import { api } from '../lib/axios';

export interface PfaMonthlyIncome {
  id: string | null;
  pfaRegistrationId: string;
  year: number;
  month: number;
  venitCash: number;
  venitCard: number;
  venitBolt: number;
  venitUber: number;
  taxeEstimate: number;
  venitTotal: number;
  updatedAtUtc: string | null;
  isProcessed: boolean;
  processedAtUtc: string | null;
  processedByUserId: string | null;
  processedByUserName: string | null;
}

export interface PfaInternalNote {
  id: string;
  pfaRegistrationId: string;
  year: number;
  month: number;
  content: string;
  createdByUserId: string;
  createdByUserName: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface PfaActivityLog {
  id: string;
  pfaRegistrationId: string;
  activityType: string;
  description: string;
  createdAtUtc: string;
  performedByUserId: string;
  performedByUserName: string;
}

export interface PfaFiscalProfile {
  id: string | null;
  pfaRegistrationId: string;
  taxationSystem: string;
  isVatPayer: boolean;
  hasEmployees: boolean;
  accountingRegime: string;
  specialVatCodeStatus: string;
  specialVatCodeObtainedAtUtc: string | null;
  specialVatCodeDocumentId: string | null;
  uberStatus: string;
  boltStatus: string;
  otherPlatformsStatus: string;
  cashRevenueStatus: string;
  cashRegisterStatus: string;
  vehicleUsageType: string;
  vehicleSupportingDocumentLabel: string | null;
  vehicleSupportingDocumentId: string | null;
  updatedAtUtc: string | null;
}

export interface PfaPlatformAccount {
  id: string | null;
  pfaRegistrationId: string;
  provider: 'Uber' | 'Bolt' | string;
  kind: 'Driver' | 'Fleet' | string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  hasPassword: boolean;
  status: string;
  configuredAtUtc: string | null;
  updatedAtUtc: string | null;
}

export interface PfaFleetConsent {
  id: string | null;
  pfaRegistrationId: string;
  fleetAccountsAccepted: boolean;
  fleetAccountsAcceptedAtUtc: string | null;
  boltApiAccepted: boolean;
  boltApiAcceptedAtUtc: string | null;
  consentTextVersion: string;
}

export interface PfaFiscalSettings {
  fiscalProfile: PfaFiscalProfile;
  platformAccounts: PfaPlatformAccount[];
  fleetConsent: PfaFleetConsent;
}

export interface UpsertPfaFiscalProfileRequest {
  specialVatCodeStatus: string;
  specialVatCodeObtainedAtUtc?: string | null;
  specialVatCodeDocumentId?: string | null;
  uberStatus: string;
  boltStatus: string;
  otherPlatformsStatus: string;
  cashRevenueStatus: string;
  cashRegisterStatus: string;
  vehicleUsageType: string;
  vehicleSupportingDocumentLabel?: string | null;
  vehicleSupportingDocumentId?: string | null;
}

export interface UpsertPfaPlatformAccountItem {
  provider: 'Uber' | 'Bolt';
  kind: 'Driver' | 'Fleet';
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  password?: string | null;
  status?: string | null;
}

export interface UpsertPfaMonthlyIncomeRequest {
  year: number;
  month: number;
  venitCash: number;
  venitCard: number;
  venitBolt: number;
  venitUber: number;
}

export interface CreatePfaRequest {
  registrationType: string;
  fullName?: string;
  phone?: string;
  contractDuration?: number;
  street?: string;
  number?: string;
  city?: string;
  county?: string;
  isOwner: boolean;
}

export const pfaService = {
  create: async (data: CreatePfaRequest): Promise<string> => {
    // Returns the Guid of the newly created PFA Registration
    const response = await api.post<string>('/pfa-registrations', data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/pfa-registrations');
    return response.data;
  },
  
  updateStatus: async (id: string, status: string, reviewNote?: string, cui?: string, documentId?: string) => {
    const response = await api.put(`/pfa-registrations/${id}/status`, { 
      status, 
      reviewNote,
      cui,
      documentId
    });
    return response.data;
  },

  getMonthlyIncome: async (pfaId: string, year: number, month: number): Promise<PfaMonthlyIncome> => {
    const response = await api.get<PfaMonthlyIncome>(`/pfa-registrations/${pfaId}/monthly-income`, {
      params: { year, month },
    });
    return response.data;
  },

  upsertMonthlyIncome: async (
    pfaId: string,
    data: UpsertPfaMonthlyIncomeRequest
  ): Promise<PfaMonthlyIncome> => {
    const response = await api.put<PfaMonthlyIncome>(`/pfa-registrations/${pfaId}/monthly-income`, data);
    return response.data;
  },

  processMonthlyIncome: async (
    pfaId: string,
    year: number,
    month: number,
    isProcessed: boolean
  ): Promise<PfaMonthlyIncome> => {
    const response = await api.put<PfaMonthlyIncome>(
      `/pfa-registrations/${pfaId}/monthly-income/process`,
      null,
      { params: { year, month, isProcessed } }
    );
    return response.data;
  },

  getInternalNotes: async (pfaId: string, year?: number, month?: number): Promise<PfaInternalNote[]> => {
    const response = await api.get<PfaInternalNote[]>(`/pfa-registrations/${pfaId}/internal-notes`, {
      params: { year, month }
    });
    return response.data;
  },

  createInternalNote: async (pfaId: string, year: number, month: number, content: string): Promise<PfaInternalNote> => {
    const response = await api.post<PfaInternalNote>(`/pfa-registrations/${pfaId}/internal-notes`, {
      year,
      month,
      content
    });
    return response.data;
  },

  updateInternalNote: async (noteId: string, content: string): Promise<PfaInternalNote> => {
    const response = await api.put<PfaInternalNote>(`/pfa-registrations/internal-notes/${noteId}`, {
      content
    });
    return response.data;
  },

  deleteInternalNote: async (noteId: string): Promise<void> => {
    await api.delete(`/pfa-registrations/internal-notes/${noteId}`);
  },

  getActivityLogs: async (pfaId: string): Promise<PfaActivityLog[]> => {
    const response = await api.get<PfaActivityLog[]>(`/pfa-registrations/${pfaId}/activity-logs`);
    return response.data;
  },

  getContabilStats: async (): Promise<{
    totalClients: number;
    docsToVerify: number;
    missingMonthlyDocs: number;
    readyToProcess: number;
    processedThisMonth: number;
    unreadMessages: number;
    monthLabel: string;
  }> => {
    const response = await api.get('/pfa-registrations/contabil-stats');
    return response.data;
  },

  getFiscalSettings: async (pfaId: string): Promise<PfaFiscalSettings> => {
    const response = await api.get<PfaFiscalSettings>(`/pfa-registrations/${pfaId}/fiscal-profile`);
    return response.data;
  },

  updateFiscalProfile: async (
    pfaId: string,
    data: UpsertPfaFiscalProfileRequest
  ): Promise<PfaFiscalProfile> => {
    const response = await api.put<PfaFiscalProfile>(`/pfa-registrations/${pfaId}/fiscal-profile`, data);
    return response.data;
  },

  updatePlatformAccounts: async (
    pfaId: string,
    accounts: UpsertPfaPlatformAccountItem[]
  ): Promise<PfaPlatformAccount[]> => {
    const response = await api.put<PfaPlatformAccount[]>(
      `/pfa-registrations/${pfaId}/platform-accounts`,
      { accounts }
    );
    return response.data;
  },

  markFleetConfigured: async (
    pfaId: string,
    provider: 'Uber' | 'Bolt'
  ): Promise<PfaPlatformAccount> => {
    const response = await api.post<PfaPlatformAccount>(
      `/pfa-registrations/${pfaId}/fleet-configured`,
      { provider }
    );
    return response.data;
  },

  acceptFleetConsent: async (
    pfaId: string,
    data: { fleetAccountsAccepted: boolean; boltApiAccepted: boolean }
  ): Promise<PfaFleetConsent> => {
    const response = await api.post<PfaFleetConsent>(
      `/pfa-registrations/${pfaId}/fleet-consent`,
      data
    );
    return response.data;
  },
};
