import type { ReactNode } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { DASHBOARD_TOKENS } from '../dashboardTheme'

export interface StatCardProps {
  label: string
  value: string
  helper?: string
  /** Accent = cifra principală a ecranului; default = restul. */
  variant?: 'default' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  onClick?: () => void
}

const VALUE_SIZE = {
  sm: { xs: '1.15rem', md: '1.25rem' },
  md: { xs: '1.35rem', md: '1.5rem' },
  lg: { xs: '1.9rem', md: '2.2rem' },
} as const

/** Etichetă sus, cifră jos. Aceeași formă peste tot, ca tile-urile să se alinieze. */
export function StatCard({ label, value, helper, variant = 'default', size = 'md', icon, onClick }: StatCardProps) {
  const accent = variant === 'accent'

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: { xs: 2, md: 2.4 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${accent ? alpha(DASHBOARD_TOKENS.accent, 0.28) : DASHBOARD_TOKENS.border}`,
        bgcolor: accent ? DASHBOARD_TOKENS.accentWash : DASHBOARD_TOKENS.paper,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 180ms ease',
        '&:hover': onClick ? { borderColor: alpha(DASHBOARD_TOKENS.accent, 0.45) } : undefined,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {icon && (
          <Box sx={{ display: 'grid', placeItems: 'center', color: DASHBOARD_TOKENS.accent, '& svg': { fontSize: 16 } }}>
            {icon}
          </Box>
        )}
        <Typography
          noWrap
          sx={{
            color: accent ? DASHBOARD_TOKENS.accent : DASHBOARD_TOKENS.textMuted,
            fontWeight: 700,
            fontSize: '0.78rem',
            letterSpacing: 0.1,
            minWidth: 0,
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        sx={{
          color: DASHBOARD_TOKENS.ink,
          fontWeight: 900,
          fontSize: VALUE_SIZE[size],
          lineHeight: 1.15,
          mt: 0.7,
          letterSpacing: -0.6,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>

      {helper && (
        <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 600, fontSize: '0.74rem', mt: 0.4 }}>
          {helper}
        </Typography>
      )}
    </Paper>
  )
}

export default StatCard
