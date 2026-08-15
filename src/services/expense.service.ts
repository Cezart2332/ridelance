import { api } from '../lib/axios';

/** Confirmarea utilizatorului. Doar `Confirmed` intră în profitul real estimat. */
export type ExpenseStatus = 'Draft' | 'Confirmed';

/** De unde au venit datele: completate de om sau citite de pe document. */
export type ExpenseSource = 'Manual' | 'Ocr';

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
  /** Verificarea RIDElance: `Pending` | `Verified` | `Rejected`. Separată de `status`. */
  documentStatus: string;
  originalFileName: string;
  fileSize: number;
  uploadedAtUtc: string;
  createdAtUtc: string;
  createdByUserId: string;
  /** Data de pe document, în format ISO. `year`/`month` rămân perioada contabilă. */
  expenseDate: string | null;
  supplierName: string | null;
  vatAmount: number | null;
  currency: string;
  documentTypeLabel: string | null;
  source: ExpenseSource;
  status: ExpenseStatus;
}

export interface CreateDeductibleExpensePayload {
  catalogCategory: string;
  itemName: string;
  deductibleLabel: string;
  amountRon?: number | null;
  year: number;
  month: number;
  file: File;
  expenseDate?: string | null;
  supplierName?: string | null;
  vatAmount?: number | null;
  documentTypeLabel?: string | null;
}

export interface UpdateDeductibleExpensePayload {
  catalogCategory: string;
  itemName: string;
  deductibleLabel: string;
  amountRon: number | null;
  year: number;
  month: number;
  expenseDate: string | null;
  supplierName: string | null;
  vatAmount: number | null;
  documentTypeLabel: string | null;
  /** `false` lasă cheltuiala ciornă: salvată, dar în afara calculelor. */
  confirm: boolean;
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
    if (payload.expenseDate) {
      formData.append('expenseDate', payload.expenseDate);
    }
    if (payload.supplierName) {
      formData.append('supplierName', payload.supplierName);
    }
    if (payload.vatAmount != null) {
      formData.append('vatAmount', String(payload.vatAmount));
    }
    if (payload.documentTypeLabel) {
      formData.append('documentTypeLabel', payload.documentTypeLabel);
    }

    const response = await api.post<DeductibleExpense>(
      `/pfa-registrations/${pfaRegistrationId}/deductible-expenses`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  /** Confirmarea de după OCR: corectezi ce s-a citit greșit și decizi dacă intră în calcul. */
  updateForPfa: async (
    pfaRegistrationId: string,
    expenseId: string,
    payload: UpdateDeductibleExpensePayload,
  ): Promise<DeductibleExpense> => {
    const response = await api.put<DeductibleExpense>(
      `/pfa-registrations/${pfaRegistrationId}/deductible-expenses/${expenseId}`,
      payload,
    );
    return response.data;
  },
};
