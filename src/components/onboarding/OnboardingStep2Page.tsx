import { OnboardingRunner } from './micro/OnboardingRunner'

/** Pasul fiscal (`config/fiscal.ts`) rulează din config. Ecranele sunt carduri de întrebări, nu un panou. */
export default function OnboardingStep2Page() {
  return <OnboardingRunner />
}
