import type { ReactNode } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'

import { DASHBOARD_TOKENS } from '../dashboardTheme'

export interface PanelProps {
  title?: string
  subtitle?: string
  /** Colțul din dreapta sus — buton, chip, toggle. */
  action?: ReactNode
  /**
   * Conținutul umple pe verticală tot spațiul rămas (grafice, liste cu scroll intern).
   * Fără el, panoul se întinde cât conținutul.
   */
  fill?: boolean
  /** Padding mai mic, pentru panouri dense sau nested. */
  dense?: boolean
  children: ReactNode
}

/** Cardul alb standard al dashboardului. Toate blocurile sunt unul din astea. */
export function Panel({ title, subtitle, action, fill, dense, children }: PanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: dense ? { xs: 1.8, md: 2.2 } : { xs: 2.2, md: 2.6 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.paper,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        /*
         * `height: 100%` face panoul să umple celula de grilă, ca două panouri alăturate să fie
         * egale. Într-o coloană flex însă, aceeași regulă îl lăsa să fie comprimat sub conținutul
         * lui: panoul primea înălțimea calculată de flexbox, iar tabelul dinăuntru curgea peste
         * panoul următor.
         *
         * `minHeight: fit-content` spune exact ce lipsea — umple cât poți, dar niciodată mai
         * puțin decât conținutul — și nu schimbă nimic în grile, unde oricum era mai înalt.
         */
        height: '100%',
        minHeight: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      {(title || action) && (
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.8, flexShrink: 0 }}
        >
          <Box sx={{ minWidth: 0 }}>
            {title && (
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1rem' }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem', mt: 0.3, lineHeight: 1.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Stack>
      )}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: 0,
          ...(fill ? { display: 'flex', flexDirection: 'column' } : null),
        }}
      >
        {children}
      </Box>
    </Paper>
  )
}

export default Panel
