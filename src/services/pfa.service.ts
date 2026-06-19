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
};
