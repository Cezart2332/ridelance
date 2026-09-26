import type { ReactNode } from 'react'

import type { ActionMenuItem } from '../../../../components/admin'
import type { PfaAccountingSummary } from '../../api/types'

/** Acțiunile din meniul „⋯” al dosarului și dialogurile lor (F7: inactivare, dosar de predare). */
export function useDossierMenu(summary: PfaAccountingSummary | null, onChanged: () => void): { items: ActionMenuItem[]; dialogs: ReactNode } {
  // Completat în F7.
  void onChanged
  return { items: summary ? [] : [], dialogs: null }
}
