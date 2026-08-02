import { createContext } from 'react'

import type { DocumentSummary } from '../../services/document.service'
import type { EligibilityProfile, OnboardingState } from '../../services/onboarding.service'
import type { StepView } from './stepModel'

/** Un pas validat care tocmai a fost întors pe „respins” de admin — declanșează toast + un-check. */
export interface RejectionAlert {
  keys: string[]
  labels: string[]
  nonce: number
}

export interface OnboardingContextValue {
  state: OnboardingState | null
  documents: DocumentSummary[]
  eligibility: EligibilityProfile | null
  steps: StepView[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  rejectionAlert: RejectionAlert | null
  dismissRejectionAlert: () => void
  /** Folosit de `useOnboardingResource` — nu apela direct din panouri. */
  registerResource: (key: string, fetcher: () => Promise<unknown>) => () => void
  resources: Record<string, unknown>
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null)
