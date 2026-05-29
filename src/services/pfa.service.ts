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
};
