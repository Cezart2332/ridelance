import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'

/**
 * Reads the user's role from Redux and redirects to the correct dashboard.
 * - Client   → /app/dashboard
 * - Contabil → /contabil
 * - Admin    → /admin
 */
export default function RoleRedirect() {
  const role = useAppSelector((s) => s.auth.role)

  if (role === 'Client') return <Navigate to="/app/dashboard" replace />
  if (role === 'Contabil') return <Navigate to="/contabil" replace />
  if (role === 'Admin') return <Navigate to="/admin" replace />

  // Unrecognised role — ProtectedRoute already guards this, but just in case
  return <Navigate to="/auth" replace />
}
