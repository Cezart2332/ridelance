import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { useAppSelector } from '../../store/hooks'
import { ErrorPage } from '../common/ErrorPage'
import { roleForPath, roleOwnsPath } from './loginDestination'

/**
 * Pagina e a unui singur rol. Altcineva ajuns aici — dintr-un link vechi, din istoric, de pe
 * contul dinainte — vede 403, cu rolul paginii și al contului lui, nu un dashboard în care
 * fiecare cerere e refuzată de server fără nicio explicație.
 */
export function RoleAreaGate({ children }: { children: ReactNode }) {
  const role = useAppSelector((s) => s.auth.role)
  const { pathname } = useLocation()

  if (!roleOwnsPath(role, pathname)) return <ErrorPage code={403} requiredRole={roleForPath(pathname)} />
  return <>{children}</>
}
