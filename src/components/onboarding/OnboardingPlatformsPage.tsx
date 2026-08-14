import { OnboardingRunner } from './micro/OnboardingRunner'

/** Pasul platforme (`config/platforms.ts`) rulează din config. Ecranele sunt carduri de întrebări, nu un panou. */
export default function OnboardingPlatformsPage() {
  return <OnboardingRunner />
}
