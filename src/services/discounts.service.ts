import { api } from '../lib/axios';

export interface DiscountCode {
  id: string;
  code: string;
  amountOffBani: number | null;
  percentOff: number | null;
  currency: string | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  active: boolean;
  /** For subscriptions: true discounts every payment, false only the first one. */
  appliesToAllPayments: boolean;
  expiresAtUtc: string | null;
  createdAtUtc: string;
}

export interface CreateDiscountCodeRequest {
  code: string;
  amountOffBani?: number | null;
  percentOff?: number | null;
  maxRedemptions?: number | null;
  appliesToAllPayments: boolean;
  expiresAtUtc?: string | null;
}

export const discountsService = {
  async list(): Promise<DiscountCode[]> {
    const res = await api.get<DiscountCode[]>('/admin/discounts');
    return res.data;
  },

  async create(data: CreateDiscountCodeRequest): Promise<DiscountCode> {
    const res = await api.post<DiscountCode>('/admin/discounts', data);
    return res.data;
  },

  async setActive(id: string, active: boolean): Promise<DiscountCode> {
    const res = await api.post<DiscountCode>(`/admin/discounts/${id}/active`, { active });
    return res.data;
  },
};
