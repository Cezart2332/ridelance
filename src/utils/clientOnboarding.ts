import type { SubscriptionResponse } from '../services/stripe.service'

/**
 * Cine intră în dashboard: dosarul PFA aprobat, onboardingul complet și un abonament valid.
 *
 * `dashboardAccessGranted` nu mai e o condiție. Era poarta jobului de luni 15:00: cine plătea
 * marți rămânea cu contul blocat până lunea următoare, deși plătise. Jobul a dispărut, deci și
 * condiția — plata reușită dă acces pe loc.
 *
 * `ActivePendingBilling` rămâne acceptat pentru rândurile scrise înainte de schimbare; statusul
 * nu se mai scrie, dar abonamentele vechi îl poartă și sunt tot valide.
 */
export function canAccessDashboard(sub: SubscriptionResponse | null): boolean {
  return sub?.pfaStatus === 'Approved' &&
    sub.onboardingSectionsValidated &&
    (sub.status === 'Active' || sub.status === 'ActivePendingBilling')
}

export function isSuspendedSubscription(sub: SubscriptionResponse | null): boolean {
  return sub?.status === 'Expired' || sub?.status === 'Suspended'
}

/** Client onboarding route for a known subscription snapshot. */
export function resolveClientPath(sub: SubscriptionResponse | null): string {
  // Onboardingul (PFA + cele 3 secțiuni de documente) se face fără acces la panel.
  if (!sub || !sub.onboardingSectionsValidated) return '/onboarding'
  if (isSuspendedSubscription(sub)) return '/inregistrare/abonament?reason=suspended'
  if (!canAccessDashboard(sub)) return '/inregistrare/abonament'
  return '/app/dashboard'
}
