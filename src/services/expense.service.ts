import { api } from '../lib/axios';

export interface DeductibleExpense {
  id: string;
  documentId: string;
  userId: string;
  pfaRegistrationId: string;
  catalogCategory: string;
  itemName: string;
  deductibleLabel: string;
  amountRon: number | null;
  year: number;
  month: number;
  status: string;
  originalFileName: string;
  fileSize: number;
  uploadedAtUtc: string;
  createdAtUtc: string;
  createdByUserId: string;
}

export interface CreateDeductibleExpensePayload {
  catalogCategory: string;
  itemName: string;
  deductibleLabel: string;
  amountRon?: number | null;
  year: number;
  month: number;
  file: File;
}

export const expenseService = {
  getByPfa: async (
    pfaRegistrationId: string,
    year?: number,
    month?: number,
  ): Promise<DeductibleExpense[]> => {
    const response = await api.get<DeductibleExpense[]>(
      `/pfa-registrations/${pfaRegistrationId}/deductible-expenses`,
      { params: { year, month } },
    );
    return response.data;
  },

  createForPfa: async (
    pfaRegistrationId: string,
    payload: CreateDeductibleExpensePayload,
  ): Promise<DeductibleExpense> => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('catalogCategory', payload.catalogCategory);
    formData.append('itemName', payload.itemName);
    formData.append('deductibleLabel', payload.deductibleLabel);
    formData.append('year', String(payload.year));
    formData.append('month', String(payload.month));
    if (payload.amountRon != null && payload.amountRon > 0) {
      formData.append('amountRon', String(payload.amountRon));
    }

    const response = await api.post<DeductibleExpense>(
      `/pfa-registrations/${pfaRegistrationId}/deductible-expenses`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },
};
