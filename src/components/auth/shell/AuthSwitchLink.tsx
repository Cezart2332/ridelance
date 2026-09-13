import { Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { AUTH_COLORS } from './authShellSx'

interface AuthSwitchLinkProps {
  prompt: string
  linkLabel: string
  to: string
}

/** „Ai deja un cont? Autentifică-te" — rândul de sub titlu care duce pe celălalt formular. */
export function AuthSwitchLink({ prompt, linkLabel, to }: AuthSwitchLinkProps) {
  return (
    <>
      {prompt}{' '}
      <Link
        component={RouterLink}
        to={to}
        underline="always"
        sx={{
          color: AUTH_COLORS.primary,
          fontWeight: 600,
          textUnderlineOffset: 3,
          textDecorationColor: 'rgba(92, 203, 245, 0.45)',
          '&:hover': { textDecorationColor: AUTH_COLORS.primary },
        }}
      >
        {linkLabel}
      </Link>
    </>
  )
}
