import { createContext, useContext } from 'react'
import type { PlanKey, SubscriptionResponse } from '../../services/stripe.service'

/**
 * Ce poate face clientul după plan, pentru meniu și rute. Serverul verifică la fel
 * (`PlanAccess`); aici doar nu arătăm ce n-ar merge.
 *
 * PFAlone: își ține singur registrele și are generatorul de declarații; nu are contabil.
 * PFA Full: contabilul ține registrele și face declarațiile; Open Banking și casa de marcat incluse.
 */
export interface PlanAccess {
  plan: PlanKey | null
  managesOwnBooks: boolean
  includesOpenBanking: boolean
  includesCashRegister: boolean
}

/** Până se știe planul: ca la PFA Full, fără nimic în plus de arătat. */
export const DEFAULT_PLAN_ACCESS: PlanAccess = {
  plan: null,
  managesOwnBooks: false,
  includesOpenBanking: true,
  includesCashRegister: true,
}

export function planAccessOf(sub: SubscriptionResponse | null): PlanAccess {
  if (!sub) return DEFAULT_PLAN_ACCESS
  return {
    plan: sub.plan,
    managesOwnBooks: sub.canManageRegisters === true,
    includesOpenBanking: sub.includesOpenBanking ?? true,
    includesCashRegister: sub.includesCashRegister ?? true,
  }
}

export const PlanAccessContext = createContext<PlanAccess>(DEFAULT_PLAN_ACCESS)

export const usePlanAccess = () => useContext(PlanAccessContext)
