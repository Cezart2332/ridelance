import { OnboardingRunner } from './micro/OnboardingRunner'

/**
 * Pasul 1 — Eligibilitate.
 *
 * Ecranele nu se scriu aici: sunt declarate în `config/eligibility.ts` și randate de runner. Ruta
 * rămâne `/onboarding/eligibility` (backendul o are în `OnboardingStepCatalog.cs` și notificările
 * trimit acolo); micro-pasul curent trăiește în `?pas=`.
 */
export default function OnboardingEligibilityPage() {
  return <OnboardingRunner />
}
