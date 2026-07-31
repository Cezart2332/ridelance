import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

import { DASHBOARD_TOKENS } from '../dashboardTheme'

/**
 * Comutatorul-pilulă folosit peste tot în dashboard (Luna/Anul, Bolt/Uber, perioadă).
 * Un singur stil, ca toate paginile să arate la fel.
 */
export const pillToggleSx: SxProps<Theme> = {
  bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.05),
  borderRadius: DASHBOARD_TOKENS.radius.full,
  p: 0.4,
  '& .MuiToggleButtonGroup-grouped': {
    border: 0,
    px: 2,
    py: 0.4,
    minHeight: 32,
    borderRadius: `${DASHBOARD_TOKENS.radius.full}px !important`,
    color: DASHBOARD_TOKENS.textMuted,
    fontWeight: 800,
    fontSize: '0.8rem',
    textTransform: 'none',
    '&.Mui-selected': {
      bgcolor: DASHBOARD_TOKENS.paper,
      color: DASHBOARD_TOKENS.accent,
      boxShadow: DASHBOARD_TOKENS.shadow.sm,
      '&:hover': { bgcolor: DASHBOARD_TOKENS.paper },
    },
  },
}
