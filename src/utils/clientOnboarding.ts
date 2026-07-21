import type { SubscriptionResponse } from '../services/stripe.service'

export function canAccessDashboard(sub: SubscriptionResponse | null): boolean {
  return sub?.pfaStatus === 'Approved' &&
    sub.onboardingSectionsValidated &&
    (sub.status === 'Active' || sub.status === 'ActivePendingBilling') &&
    sub.dashboardAccessGranted
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
