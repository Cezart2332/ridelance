import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAppSelector } from '../../store/hooks'
import { roleOwnsPath } from './loginDestination'

/**
 * Pagina e a unui singur rol. Altcineva ajuns aici — dintr-un link vechi, din istoric, de pe
 * contul dinainte — pleacă la `/app`, care îl duce în dashboardul lui, nu rămâne în onboardingul
 * PFA cu un cont de admin.
 */
export function RoleAreaGate({ children }: { children: ReactNode }) {
  const role = useAppSelector((s) => s.auth.role)
  const { pathname } = useLocation()

  if (!roleOwnsPath(role, pathname)) return <Navigate to="/app" replace />
  return <>{children}</>
}
