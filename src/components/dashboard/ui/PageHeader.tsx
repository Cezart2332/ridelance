import type { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'

import { DASHBOARD_TOKENS } from '../dashboardTheme'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Butoane / toggle-uri aliniate dreapta. */
  actions?: ReactNode
}

/** Antetul unei secțiuni. Aceeași greutate și aceeași spațiere pe toate paginile. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        rowGap: 1.2,
        flexShrink: 0,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: DASHBOARD_TOKENS.ink,
            fontWeight: 900,
            fontSize: { xs: '1.25rem', md: '1.4rem' },
            letterSpacing: -0.4,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem', mt: 0.3, lineHeight: 1.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  )
}

export default PageHeader
