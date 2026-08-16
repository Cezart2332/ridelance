import { Box, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { AuthLayout } from './shell/AuthLayout'
import { AuthFormHeader } from './shell/AuthFormHeader'
import { ROUTES } from '../../constants/routes'
import { TOKENS } from '../../constants/tokens'

/**
 * Stub, intenționat: linkul „Ai uitat parola?" trebuie să ducă undeva, dar fluxul de resetare
 * nu există încă — backendul are doar `users/change-password`, care cere sesiune activă.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthFormHeader
        title="Resetare parolă"
        subtitle="Fluxul de resetare e în lucru."
      />

      <Box>
        <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
          Până îl lansăm, scrie-ne la{' '}
          <Link href="mailto:contact@ridelance.ro" underline="hover">
            contact@ridelance.ro
          </Link>{' '}
          și îți resetăm parola manual.
        </Typography>

        <Typography variant="body2" sx={{ mt: 3 }}>
          <Link component={RouterLink} to={ROUTES.login} underline="hover" sx={{ fontWeight: 600 }}>
            Înapoi la autentificare
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  )
}
