import type { SubscriptionResponse } from '../services/stripe.service'

export function isAwaitingPfaForm(sub: SubscriptionResponse | null): boolean {
  return !sub?.pfaStatus
}

export function isAwaitingAdminApproval(sub: SubscriptionResponse | null): boolean {
  return sub?.pfaStatus === 'Rejected'
}

export function isAwaitingBillingGate(_sub: SubscriptionResponse | null): boolean {
  // Bypassed: user requested to not display or gate access behind the countdown screen
  return false
}

export function canAccessDashboard(sub: SubscriptionResponse | null): boolean {
  return sub?.pfaStatus === 'Approved' &&
    (sub.status === 'Active' || sub.status === 'ActivePendingBilling') &&
    sub.dashboardAccessGranted
}

/** Client onboarding route for a known subscription snapshot. */
export function resolveClientPath(sub: SubscriptionResponse | null): string {
  if (!sub) return '/inregistrare/pfa'
  if (isAwaitingPfaForm(sub)) return '/inregistrare/pfa'
  if (sub.pfaStatus === 'Pending') return '/app/dashboard?section=documents'
  if (isAwaitingAdminApproval(sub)) return '/app/pending-approval'
  if (isAwaitingBillingGate(sub)) return '/app/pending-access'
  if (sub.pfaStatus === 'Approved' && !canAccessDashboard(sub)) return '/inregistrare/abonament'
  if (canAccessDashboard(sub)) return '/app/dashboard'
  return '/app'
}
