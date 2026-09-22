import { createContext, useContext } from 'react'

import type { FiscalProfile, FiscalProfileStatus } from '../../services/fiscalProfile.service'

export interface PfaFiscalProfileValue {
  taxYear: number
  profile: FiscalProfile | null
  status: FiscalProfileStatus | null
  openForm: () => void
  openHistory: () => void
  /** Modalul automat de la prima accesare. Se cheamă din „Acasă”; serverul ține minte că s-a arătat. */
  promptIfFirstVisit: () => void
}

export const PfaFiscalProfileContext = createContext<PfaFiscalProfileValue | null>(null)

/** `null` în afara dashboardului PFA (de ex. în demo-ul public), unde nu există profil. */
export function usePfaFiscalProfile(): PfaFiscalProfileValue | null {
  return useContext(PfaFiscalProfileContext)
}
