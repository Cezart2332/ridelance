import { api } from '../lib/axios'

/**
 * Plățile unei închirieri.
 *
 * Se **înregistrează**, nu se încasează prin platformă: banii trec direct între flotă și chiriaș.
 * De aceea n-are status de plată — ar sugera o încasare pe care n-o face RIDElance.
 */

export type PaymentMethod = 'Cash' | 'BankTransfer' | 'Card' | 'Other'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: 'Numerar',
  BankTransfer: 'Transfer bancar',
  Card: 'Card',
  Other: 'Altă metodă',
}

export interface RentalPayment {
  id: string
  amountBani: number
  paidOnUtc: string
  method: PaymentMethod
  notes: string | null
}

export interface RentalPayments {
  contractValueBani: number
  recordedBani: number
  /** Poate fi negativ: s-a încasat mai mult decât valoarea contractului. */
  remainingBani: number
  payments: RentalPayment[]
}

export interface PaymentInput {
  amountBani: number
  paidOnUtc: string
  method: PaymentMethod
  notes: string | null
}

export const rentalPaymentsService = {
  async get(rentalId: string): Promise<RentalPayments> {
    const res = await api.get<RentalPayments>(`/rentals/${rentalId}/payments`)
    return res.data
  },

  async add(rentalId: string, input: PaymentInput): Promise<void> {
    await api.post(`/rentals/${rentalId}/payments`, input)
  },

  async remove(paymentId: string): Promise<void> {
    await api.delete(`/rentals/payments/${paymentId}`)
  },
}
