import { api } from '../lib/axios';

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
  }
};
