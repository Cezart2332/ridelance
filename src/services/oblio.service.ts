import { api } from '../lib/axios';

export interface OblioStatus {
  configured: boolean;
  cif: string | null;
  seriesName: string | null;
  connectionOk: boolean;
  companyName: string | null;
  availableSeries: string[];
  error: string | null;
}

export interface OblioTestInvoiceRequest {
  clientName?: string;
  amountLei: number;
  description?: string;
}

export interface OblioTestInvoiceResponse {
  seriesName: string;
  number: string;
  link: string;
}

export interface IssuedInvoice {
  id: string;
  clientName: string;
  clientCif: string | null;
  description: string;
  amountBani: number;
  currency: string;
  seriesName: string | null;
  number: string | null;
  link: string | null;
  status: 'Issued' | 'Failed';
  errorMessage: string | null;
  isTest: boolean;
  sentToSpv: boolean;
  createdAtUtc: string;
}

export const oblioService = {
  async getStatus(): Promise<OblioStatus> {
    const res = await api.get<OblioStatus>('/admin/oblio/status');
    return res.data;
  },

  async createTestInvoice(data: OblioTestInvoiceRequest): Promise<OblioTestInvoiceResponse> {
    const res = await api.post<OblioTestInvoiceResponse>('/admin/oblio/test-invoice', data);
    return res.data;
  },

  async getInvoices(limit = 50): Promise<IssuedInvoice[]> {
    const res = await api.get<IssuedInvoice[]>('/admin/oblio/invoices', { params: { limit } });
    return res.data;
  },
};
