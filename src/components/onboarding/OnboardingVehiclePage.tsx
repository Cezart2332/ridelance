import { OnboardingRunner } from './micro/OnboardingRunner'

/** Pasul vehicul (`config/vehicle.ts`) rulează din config. Ecranele sunt carduri de întrebări, nu un panou. */
export default function OnboardingVehiclePage() {
  return <OnboardingRunner />
}
