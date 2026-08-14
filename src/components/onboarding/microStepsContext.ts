import { createContext } from 'react'

import type { MicroStepAnswer, MicroStepAnswers, MicroStepView } from './microStepTypes'

export interface MicroStepsValue {
  /** Micro-pașii vizibili ai pasului mare curent, în ordine. Gol pentru pașii încă nemigrați. */
  steps: MicroStepView[]
  current: MicroStepView | null
  /** Răspunsurile din sesiunea curentă. Verdictele vin de la server, astea dau doar parcursul. */
  answers: MicroStepAnswers
  answer: (id: string, value: MicroStepAnswer) => void
  goTo: (id: string) => void
  next: () => void
  back: () => void
  canGoBack: boolean
  /** Contor global, peste tot onboardingul: „Pasul {position} din {total}". */
  position: number
  total: number
  percent: number
}

export const MicroStepsContext = createContext<MicroStepsValue | null>(null)
