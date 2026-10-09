import { OnboardingRunner } from './micro/OnboardingRunner'

/** Pasul „ARR & Cont Flotă” (`config/arrFleet.ts`) rulează din config, ca ceilalți pași. */
export default function OnboardingArrFleetPage() {
  return <OnboardingRunner />
}
