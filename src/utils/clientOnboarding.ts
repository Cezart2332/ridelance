import type { SubscriptionResponse } from '../services/stripe.service'

export function isAwaitingPfaForm(sub: SubscriptionResponse | null): boolean {
  return !!sub && !sub.pfaStatus
}

export function isAwaitingAdminApproval(sub: SubscriptionResponse | null): boolean {
  return sub?.pfaStatus === 'Pending' || sub?.pfaStatus === 'Rejected'
}

export function isAwaitingBillingGate(sub: SubscriptionResponse | null): boolean {
  // Bypassed: user requested to not display or gate access behind the countdown screen
  return false
}

export function canAccessDashboard(sub: SubscriptionResponse | null): boolean {
  // Bypassed: direct access is allowed once the PFA is approved
  return sub?.pfaStatus === 'Approved'
}

/** Client onboarding route for a known subscription snapshot. */
export function resolveClientPath(sub: SubscriptionResponse | null): string {
  if (!sub) return '/inregistrare/abonament'
  if (isAwaitingPfaForm(sub)) return '/inregistrare/pfa'
  if (isAwaitingAdminApproval(sub)) return '/app/pending-approval'
  if (isAwaitingBillingGate(sub)) return '/app/pending-access'
  if (canAccessDashboard(sub)) return '/app/dashboard'
  return '/app'
}
