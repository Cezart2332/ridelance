import { Box, CircularProgress, Stack, Typography } from '@mui/material'

import { tabularSx, TOKENS } from '../onboardingTheme'

/**
 * Progresul, ca inel. Ocupă cât un buton, deci încape în topbar fără să împingă nimic — iar
 * cifra din mijloc spune la ce ecran ești fără să mai fie nevoie de o propoziție lângă.
 */
export function StepProgressRing({
  position,
  total,
  percent,
  size = 44,
}: {
  position: number
  total: number
  percent: number
  size?: number
}) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexShrink: 0 }}>
      <Box sx={{ position: 'relative', width: size, height: size, display: 'grid' }}>
        {/* Traseul complet, sub inel: fără el procentul mic n-ar avea față de ce să se citească. */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={3.5}
          aria-hidden
          sx={{ gridArea: '1 / 1', color: TOKENS.primaryTint }}
        />
        <CircularProgress
          variant="determinate"
          value={percent}
          size={size}
          thickness={3.5}
          aria-label="Progresul înrolării"
          sx={{
            gridArea: '1 / 1',
            color: TOKENS.primary,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
              transition: `stroke-dashoffset 300ms ${TOKENS.easing}`,
            },
          }}
        />
        <Typography
          sx={{
            ...tabularSx,
            gridArea: '1 / 1',
            display: 'grid',
            placeItems: 'center',
            fontSize: size > 36 ? '0.78rem' : '0.7rem',
            fontWeight: 700,
            color: TOKENS.ink,
          }}
        >
          {position}
        </Typography>
      </Box>

      <Typography variant="caption" sx={{ ...tabularSx, color: TOKENS.textMuted, whiteSpace: 'nowrap' }}>
        Pasul {position} din {total}
      </Typography>
    </Stack>
  )
}
