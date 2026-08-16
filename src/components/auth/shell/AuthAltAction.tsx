import { Box, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { AUTH_DENSITY } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'

interface AuthAltActionProps {
  prompt: string
  linkLabel: string
  to: string
}

/**
 * Linkul de sub CTA, ca în mockup — fără divider „sau" între ele. Duplică intenționat destinația
 * segmented control-ului de sus: e aceeași pereche de rute, doar că una e la îndemână după ce
 * termini de citit formularul.
 */
export function AuthAltAction({ prompt, linkLabel, to }: AuthAltActionProps) {
  return (
    <Box sx={{ ...AUTH_DENSITY.ctaToDivider, textAlign: 'center' }}>
      <Typography variant="body2" component="span" sx={{ color: TOKENS.textMuted }}>
        {prompt}{' '}
      </Typography>
      <Link component={RouterLink} to={to} underline="hover" variant="body2" sx={{ fontWeight: 600 }}>
        {linkLabel}
      </Link>
    </Box>
  )
}
