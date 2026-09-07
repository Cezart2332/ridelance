import { api } from '../lib/axios'

export interface FleetCompany {
  cui: string
  name: string
  address: string | null
  city: string | null
  county: string | null
  registrationNumber: string | null
  vatPayer: boolean
  postalCode: string | null
  caen: string | null
  registrationDate: string | null
  status: string | null
  vatOnCollection: boolean | null
}
export interface FleetProgress {
  completedStep: number
  company: FleetCompany | null
  pendingCompany: FleetCompany | null
  position: string | null
  platforms: string[]
  vehicleCount: number
  bankDeferred: boolean
  oblioDeferred: boolean
  bcrRequested: boolean
  bcrEligibleAtUtc: string | null
  cycle: 'Monthly' | 'Annual'
  completedAtUtc: string | null
  checkoutClientSecret: string | null
  checkoutAttemptId: string | null
}
export interface FleetState {
  progress: FleetProgress
  dashboardAllowed: boolean
  email: string
  phone: string | null
  emailVerified: boolean
  phoneVerified: boolean
  firstName: string
  lastName: string
  bankConnected: boolean
  oblioConnected: boolean
  amountDueBani: number
  regularAmountBani: number
  monthlyAmountBani: number
  annualAmountBani: number
  legacyAccount: boolean
  /**
   * Confirmarea emailului și a telefonului blochează pasul.
   *
   * Fals cât timp furnizorii de email și SMS nu sunt configurați: un cod care nu poate fi livrat
   * nu verifică nimic, doar oprește înrolarea. Serverul decide, nu pagina — altfel butonul ar
   * putea fi activ pentru o poartă pe care API-ul o aplică oricum.
   */
  contactVerificationRequired: boolean
}
export interface FleetInput {
  step: number
  cui?: string
  confirmCompany?: boolean
  firstName?: string
  lastName?: string
  position?: string
  otherPosition?: string
  platforms?: string[]
  vehicleCount?: number
  deferred?: boolean
  bcrRequested?: boolean
  cycle?: 'Monthly' | 'Annual'
  termsAccepted?: boolean
  privacyAccepted?: boolean
}
export const fleetOnboardingService = {
  get: async () => (await api.get<FleetState>('/fleet-onboarding')).data,
  save: async (input: FleetInput) =>
    (await api.put<FleetState>('/fleet-onboarding', input)).data,
  checkout: async () =>
    (await api.post<{ clientSecret: string }>('/fleet-onboarding/checkout'))
      .data,
  cancelCheckout: async () =>
    (await api.delete<FleetState>('/fleet-onboarding/checkout')).data,
}
