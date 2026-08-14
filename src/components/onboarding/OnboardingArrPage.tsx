import { OnboardingRunner } from './micro/OnboardingRunner'

/** Pasul ARR (`config/arr.ts`) rulează din config. Ecranele sunt carduri de întrebări, nu un panou. */
export default function OnboardingArrPage() {
  return <OnboardingRunner />
}
