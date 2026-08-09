import { Stack, Typography } from '@mui/material'

import { HOME_TOKENS, tabularNums } from '../tokens'
import { formatPercent } from '../format'

interface DeltaBadgeProps {
  value: number
  previous: number | null
  /** Pentru comisioane, o creștere e o veste proastă. */
  invert?: boolean
  comparisonLabel: string
}

/**
 * Delta față de perioada anterioară echivalentă. Dacă nu există date de comparat
 * sau perioada anterioară e zero, nu se randează nimic — „0%" ar minți.
 *
 * Fără pill colorat plin (spec §5.4): patru pastile pline într-un rând de șase carduri
 * aglomerau colțurile și concurau cu cifrele. Rămân triunghiul și procentul, colorate.
 * Direcția e purtată și de formă, nu doar de culoare.
 */
export function DeltaBadge({ value, previous, invert, comparisonLabel }: DeltaBadgeProps) {
  if (previous === null || previous === 0) return null

  const ratio = (value - previous) / Math.abs(previous)
  if (!Number.isFinite(ratio) || Math.abs(ratio) < 0.0005) return null

  const isUp = ratio > 0
  const isGood = invert ? !isUp : isUp
  const color = isGood ? HOME_TOKENS.pos[600] : HOME_TOKENS.neg[600]

  return (
    <Stack
      direction="row"
      spacing={0.4}
      title={comparisonLabel}
      aria-label={`${isUp ? 'În creștere' : 'În scădere'} cu ${formatPercent(Math.abs(ratio), 1)} ${comparisonLabel}`}
      sx={{ alignItems: 'center', flexShrink: 0 }}
    >
      <Typography aria-hidden component="span" sx={{ fontSize: 8, lineHeight: 1, color }}>
        {isUp ? '▲' : '▼'}
      </Typography>
      <Typography
        component="span"
        sx={{ ...tabularNums, fontSize: 12, lineHeight: 1.4, fontWeight: 600, color }}
      >
        {formatPercent(Math.abs(ratio), 1)}
      </Typography>
    </Stack>
  )
}
