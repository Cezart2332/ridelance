import { api } from '../lib/axios'

/** Stadiul unui prieten invitat: fără cont, în onboarding, cu abonament activ, fără abonament, cont închis. */
export type ReferralStage = 'Invited' | 'Onboarding' | 'Active' | 'Inactive' | 'Closed'

export interface Referral {
  email: string
  name: string | null
  invitedAtUtc: string | null
  joinedAtUtc: string | null
  accepted: boolean
  stage: ReferralStage
}

export interface Referrals {
  code: string
  link: string
  referrals: Referral[]
}

/** Codul de recomandare, invitațiile trimise și, pentru admin, ale oricărui client. */
export const referralsService = {
  mine: async (): Promise<Referrals> => (await api.get<Referrals>('/referrals/me')).data,
  invite: async (email: string): Promise<Referrals> => (await api.post<Referrals>('/referrals/invitations', { email })).data,
  ofClient: async (userId: string): Promise<Referrals> =>
    (await api.get<Referrals>(`/admin/clients/${userId}/referrals`)).data,
}

/** Codul din linkul de invitație (`/inregistrare?ref=`), ținut până la înregistrare. */
const STORED_CODE = 'ridelance.referralCode'

export function rememberReferralCode(code: string | null) {
  const value = code?.trim().toUpperCase()
  if (!value || value.length > 16) return
  try {
    localStorage.setItem(STORED_CODE, value)
  } catch {
    // Fără stocare (fereastră privată): codul merge doar cât stă omul pe pagină.
  }
}

export function storedReferralCode(): string | null {
  try {
    return localStorage.getItem(STORED_CODE)
  } catch {
    return null
  }
}

export function forgetReferralCode() {
  try {
    localStorage.removeItem(STORED_CODE)
  } catch {
    // nimic de șters
  }
}

export const REFERRAL_STAGE_LABELS: Record<ReferralStage, string> = {
  Invited: 'Neacceptată',
  Onboarding: 'În onboarding',
  Active: 'Abonament activ',
  Inactive: 'Fără abonament activ',
  Closed: 'Cont închis',
}

export function formatReferralDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}
