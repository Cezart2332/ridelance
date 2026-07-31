import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { formatLei } from './formatLei'

/** Bară de proporție cu două segmente și 2px de suprafață între ele. */
export function SplitBar({ first, second, firstColor, secondColor }: {
  first: number
  second: number
  firstColor?: string
  secondColor?: string
}) {
  const total = first + second
  const firstPct = total > 0 ? (first / total) * 100 : 0

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '2px',
        height: 8,
        borderRadius: 999,
        overflow: 'hidden',
        bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.06),
      }}
    >
      {total > 0 && (
        <>
          <Box sx={{ width: `${firstPct}%`, bgcolor: firstColor ?? DASHBOARD_TOKENS.accent }} />
          <Box sx={{ flex: 1, bgcolor: secondColor ?? DASHBOARD_TOKENS.accentSoft }} />
        </>
      )}
    </Box>
  )
}

/**
 * O linie din defalcare: punct colorat, etichetă, procent, sumă.
 * Suma se scrie mereu — `accentSoft` singur nu are contrast suficient pe alb.
 */
export function BreakdownRow({ color, label, value, share }: {
  color: string
  label: string
  value: number
  share?: string | null
}) {
  return (
    <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography noWrap sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.85rem', flex: 1, minWidth: 0 }}>
        {label}
      </Typography>
      {share && (
        <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
          {share}
        </Typography>
      )}
      <Typography
        sx={{
          color: DASHBOARD_TOKENS.ink,
          fontWeight: 800,
          fontSize: '0.88rem',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          textAlign: 'right',
        }}
      >
        {formatLei(value)}
      </Typography>
    </Stack>
  )
}

export default SplitBar
