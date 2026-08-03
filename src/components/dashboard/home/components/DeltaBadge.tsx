import { Stack, Typography } from '@mui/material'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'

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
 * sau perioada anterioară e zero, badge-ul nu se randează — „0%" ar minți.
 * Direcția e purtată și de săgeată, nu doar de culoare.
 */
export function DeltaBadge({ value, previous, invert, comparisonLabel }: DeltaBadgeProps) {
  if (previous === null || previous === 0) return null

  const ratio = (value - previous) / Math.abs(previous)
  if (!Number.isFinite(ratio) || Math.abs(ratio) < 0.0005) return null

  const isUp = ratio > 0
  const isGood = invert ? !isUp : isUp
  const Icon = isUp ? ArrowUpwardRoundedIcon : ArrowDownwardRoundedIcon

  return (
    <Stack
      direction="row"
      spacing={0.3}
      title={comparisonLabel}
      aria-label={`${isUp ? 'În creștere' : 'În scădere'} cu ${formatPercent(Math.abs(ratio), 1)} ${comparisonLabel}`}
      sx={{
        alignItems: 'center',
        flexShrink: 0,
        px: 0.8,
        py: 0.25,
        borderRadius: HOME_TOKENS.radius.pill,
        bgcolor: isGood ? HOME_TOKENS.pos[50] : HOME_TOKENS.neg[50],
      }}
    >
      <Icon aria-hidden sx={{ fontSize: 13, color: isGood ? HOME_TOKENS.pos[600] : HOME_TOKENS.neg[600] }} />
      <Typography
        component="span"
        sx={{
          ...tabularNums,
          fontSize: '0.72rem',
          fontWeight: 700,
          color: isGood ? HOME_TOKENS.pos[600] : HOME_TOKENS.neg[600],
        }}
      >
        {formatPercent(Math.abs(ratio), 1)}
      </Typography>
    </Stack>
  )
}
