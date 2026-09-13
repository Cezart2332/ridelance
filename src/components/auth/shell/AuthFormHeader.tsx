import type { ReactNode } from 'react'
import { Alert, Box, Typography } from '@mui/material'
import { AUTH_COLORS, AUTH_DENSITY } from './authShellSx'

interface AuthFormHeaderProps {
  title: string
  /** Rândul de sub titlu — de obicei „Ai deja un cont? Autentifică-te", cu link. */
  subtitle: ReactNode
  /** Eroare de la server. Stă deasupra titlului, cu `role="alert"` — niciodată în toast. */
  error?: ReactNode
}

/** Titlul formularului. Logoul de sus nu e un heading, deci titlul ăsta e `<h1>`-ul paginii. */
export function AuthFormHeader({ title, subtitle, error }: AuthFormHeaderProps) {
  return (
    <Box sx={AUTH_DENSITY.headerToFields}>
      {error && (
        <Alert severity="error" role="alert" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Typography
        component="h1"
        sx={{
          fontSize: { xs: '1.9rem', md: '2.35rem' },
          fontWeight: 500,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: AUTH_COLORS.text,
        }}
      >
        {title}
      </Typography>

      <Typography variant="body2" component="div" sx={{ mt: 1.25, color: AUTH_COLORS.textMuted }}>
        {subtitle}
      </Typography>
    </Box>
  )
}
