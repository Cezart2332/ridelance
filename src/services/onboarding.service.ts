import { api } from '../lib/axios'

export type OnboardingSectionStatus =
  | 'Locked'
  | 'InProgress'
  | 'AwaitingValidation'
  | 'Validated'
  | 'Rejected'

export interface OnboardingSectionState {
  key: string
  status: OnboardingSectionStatus
  note: string | null
  submittedAtUtc: string | null
  validatedAtUtc: string | null
}

export interface OnboardingState {
  pfaRegistrationId: string | null
  pfaStatus: string | null
  registrationType: string | null
  pfaReviewNote: string | null
  hasPaidInfiintare: boolean
  sections: OnboardingSectionState[]
  allSectionsValidated: boolean
}

export const onboardingService = {
  /** Starea de onboarding a userului curent. */
  async getState(): Promise<OnboardingState> {
    const { data } = await api.get<OnboardingState>('/onboarding/state')
    return data
  },

  /** Trimite o secțiune de documente la validare. */
  async submitSection(key: string): Promise<void> {
    await api.post(`/onboarding/sections/${key}/submit`)
  },

  /** Starea de onboarding a unui dosar (admin/contabil). */
  async getForRegistration(pfaId: string): Promise<OnboardingState> {
    const { data } = await api.get<OnboardingState>(`/pfa-registrations/${pfaId}/onboarding`)
    return data
  },

  /** Adminul validează o secțiune. */
  async validateSection(pfaId: string, key: string): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/sections/${key}/validate`)
  },

  /** Adminul respinge o secțiune, cu motiv obligatoriu. */
  async rejectSection(pfaId: string, key: string, note: string): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/sections/${key}/reject`, { note })
  },
}
