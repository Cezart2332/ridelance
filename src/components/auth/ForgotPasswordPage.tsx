import { Box, Link, Typography } from '@mui/material'
import { AuthLayout } from './shell/AuthLayout'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { AuthSwitchLink } from './shell/AuthSwitchLink'
import { AUTH_COLORS } from './shell/authShellSx'
import { ROUTES } from '../../constants/routes'

/**
 * Stub, intenționat: linkul „Ai uitat parola?" trebuie să ducă undeva, dar fluxul de resetare
 * nu există încă — backendul are doar `users/change-password`, care cere sesiune activă.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthFormHeader
        title="Resetare parolă"
        subtitle={<AuthSwitchLink prompt="Ți-ai amintit parola?" linkLabel="Autentifică-te" to={ROUTES.login} />}
      />

      <Box>
        <Typography variant="body2" sx={{ color: AUTH_COLORS.textMuted }}>
          Fluxul de resetare e în lucru. Până îl lansăm, scrie-ne la{' '}
          <Link href="mailto:contact@ridelance.ro" underline="hover" sx={{ color: AUTH_COLORS.primary, fontWeight: 600 }}>
            contact@ridelance.ro
          </Link>{' '}
          și îți resetăm parola manual.
        </Typography>
      </Box>
    </AuthLayout>
  )
}
