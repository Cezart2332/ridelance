import type { ReactNode } from 'react'
import { Alert, Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import { AUTH_DENSITY, VERY_SHORT } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'

interface AuthFormHeaderProps {
  title: string
  subtitle: string
  /** Eroare de la server. Stă deasupra titlului, cu `role="alert"` — niciodată în toast. */
  error?: ReactNode
}

/**
 * Titlul formularului devine `<h1>` doar pe mobil, unde panoul de brand (care ține h1-ul real)
 * nu se randează. Pe desktop rămâne un `h2` vizual identic, ca pagina să aibă un singur h1.
 */
export function AuthFormHeader({ title, subtitle, error }: AuthFormHeaderProps) {
  const theme = useTheme()
  const isMobile = !useMediaQuery(theme.breakpoints.up('md'))
  // Sub 640px înălțime alert-ul trece pe un singur rând, fără iconiță, ca să nu împingă
  // formularul afară din ecran.
  const isShort = useMediaQuery('(max-height:640px)')

  return (
    <Box sx={AUTH_DENSITY.headerToFields}>
      {error && (
        <Alert
          severity="error"
          role="alert"
          icon={isShort ? false : undefined}
          sx={{ mb: 3, borderRadius: `${TOKENS.radius.md}px`, [VERY_SHORT]: { mb: 2 } }}
        >
          {error}
        </Alert>
      )}

      <Typography
        component={isMobile ? 'h1' : 'h2'}
        sx={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: TOKENS.ink }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{ ...AUTH_DENSITY.titleToSubtitle, color: TOKENS.textMuted, [VERY_SHORT]: { display: 'none' } }}
      >
        {subtitle}
      </Typography>
    </Box>
  )
}
