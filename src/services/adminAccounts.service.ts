import { api } from '../lib/axios'

/** Un cont de firmă (SRL), cum îl vede adminul în lista „SRL înrolate”. */
export interface AdminSrlAccount {
  userId: string
  companyName: string
  cui: string | null
  contactName: string
  email: string
  phone: string | null
  plan: string
  subscriptionStatus: string
  billingCycle: string | null
  nextBillingDateUtc: string | null
  /** Activ = abonament plătit; inactiv = fără abonament activ. */
  subscriptionActive: boolean
  /** Onboardingul firmei terminat (sau cont dinainte să existe onboardingul). */
  enrolled: boolean
  onboardingStep: number
  carsTotal: number
  carsPublished: number
  /** Anunțuri plătite separat, peste cele incluse în abonament. */
  paidExtraListings: number
  includedListings: number
  companySlug: string | null
  createdAtUtc: string
  lastActivityAtUtc: string | null
  deletedAtUtc: string | null
  deletionReason: string | null
}

export interface ClientAccountStatus {
  userId: string
  deletedAtUtc: string | null
  deletionReason: string | null
}

/**
 * Conturile clienților din admin: lista firmelor și închiderea / redeschiderea unui cont.
 *
 * Închiderea nu șterge nimic: contul nu se mai poate autentifica, abonamentul se oprește în
 * Stripe, anunțurile se retrag din marketplace — iar dosarul, plățile și istoricul rămân.
 */
export const adminAccountsService = {
  async getSrlAccounts(): Promise<AdminSrlAccount[]> {
    const { data } = await api.get<AdminSrlAccount[]>('/admin/srl-accounts')
    return data
  },

  async closeAccount(userId: string, reason?: string): Promise<ClientAccountStatus> {
    const { data } = await api.post<ClientAccountStatus>(`/admin/accounts/${userId}/close`, { reason: reason || null })
    return data
  },

  async reopenAccount(userId: string): Promise<ClientAccountStatus> {
    const { data } = await api.post<ClientAccountStatus>(`/admin/accounts/${userId}/reopen`)
    return data
  },
}
