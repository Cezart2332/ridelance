import { Box, Divider, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { AUTH_DENSITY } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'

interface AuthAltActionProps {
  prompt: string
  linkLabel: string
  to: string
}

/**
 * Singurul mecanism de comutare între login și register. Segmented control-ul din mockup a
 * dispărut: două surse de adevăr pentru aceeași acțiune încurcă, iar register duce în onboarding,
 * deci nu e o simplă schimbare de stare a aceluiași formular.
 */
export function AuthAltAction({ prompt, linkLabel, to }: AuthAltActionProps) {
  return (
    <>
      <Divider sx={{ ...AUTH_DENSITY.ctaToDivider, color: TOKENS.textMuted }}>
        <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
          sau
        </Typography>
      </Divider>

      <Box sx={{ ...AUTH_DENSITY.dividerToAlt, textAlign: 'center' }}>
        <Typography variant="body2" component="span" sx={{ color: TOKENS.textMuted }}>
          {prompt}{' '}
        </Typography>
        <Link
          component={RouterLink}
          to={to}
          underline="hover"
          variant="body2"
          sx={{ fontWeight: 600 }}
        >
          {linkLabel}
        </Link>
      </Box>
    </>
  )
}
