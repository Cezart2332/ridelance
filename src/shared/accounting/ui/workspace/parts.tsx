import type { ReactNode } from 'react'
import { Box, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material'

import type { Period } from '../../api/types'
import { formatPeriod } from '../../format'
import { currentCalendarPeriod, HAIRLINE, INK, initials, recentPeriods, TONES, type Cell, type Tone } from './status'

/** Bulină + un cuvânt, pe fundalul tonului. */
export function StatusPill({ cell }: { cell: Cell | null }) {
  if (!cell) {
    return (
      <Typography component="span" sx={{ color: 'var(--rl-text-subtle)', fontSize: 14 }}>
        —
      </Typography>
    )
  }
  const tone = TONES[cell.tone]
  const pill = (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        bgcolor: tone.bg,
        color: tone.text,
        fontWeight: 600,
        fontSize: 13,
        whiteSpace: 'nowrap',
      }}
    >
      <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: tone.dot, flexShrink: 0 }} />
      {cell.label}
    </Box>
  )
  return cell.title ? (
    <Tooltip title={cell.title}>
      <Box component="span" sx={{ display: 'inline-flex' }}>
        {pill}
      </Box>
    </Tooltip>
  ) : (
    pill
  )
}

export function Dot({ tone, size = 10 }: { tone: Tone; size?: number }) {
  return <Box component="span" sx={{ width: size, height: size, borderRadius: '50%', bgcolor: TONES[tone].dot, flexShrink: 0 }} />
}

export function Panel({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Box sx={{ bgcolor: 'var(--rl-card)', border: `1px solid ${HAIRLINE}`, borderRadius: '10px', minWidth: 0, ...sx }}>
      {children}
    </Box>
  )
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        bgcolor: 'var(--rl-muted)',
        color: INK,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.34,
      }}
    >
      {initials(name) || '?'}
    </Box>
  )
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <Typography component="h1" sx={{ m: 0, fontSize: 20, fontWeight: 650, letterSpacing: '-0.025em', color: INK }}>
      {children}
    </Typography>
  )
}

export function SectionTitle({ tone, title, count }: { tone?: Tone; title: string; count?: number }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
      {tone && <Dot tone={tone} />}
      <Typography component="h2" sx={{ m: 0, fontSize: 14, fontWeight: 600, color: INK }}>
        {title}
      </Typography>
      {count !== undefined && <Typography sx={{ fontSize: 14, color: 'var(--rl-text-muted)' }}>{count}</Typography>}
    </Stack>
  )
}

export function MonthSelect({ value, current, onChange }: { value: Period; current: Period; onChange: (period: Period) => void }) {
  const calendar = currentCalendarPeriod()
  const options = recentPeriods(calendar > current ? calendar : current)
  if (!options.includes(value)) options.unshift(value)
  return (
    <TextField select label="Luna" value={value} onChange={(event) => onChange(event.target.value)} sx={{ minWidth: 180 }}>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {formatPeriod(option)}{option === calendar ? ' · în curs' : ''}
        </MenuItem>
      ))}
    </TextField>
  )
}
