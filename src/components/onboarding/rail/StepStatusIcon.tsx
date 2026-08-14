import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import { Box } from '@mui/material'

import { SHELL } from '../shellTokens'
import type { StepViewState } from '../stepModel'

/**
 * Indexul pasului, care devine iconiță de status când pasul are ceva de spus.
 *
 * Numărul e forma implicită: e ancora pe care userul o folosește ca să se orienteze („sunt la 3
 * din 6"). Se înlocuiește doar când starea contrazice numărul — finalizat, în verificare, respins,
 * blocat. Cifrele sunt scrise `01`…`06`, ca lățimea rândurilor să nu salte.
 */
const TONE: Record<StepViewState, { fg: string; bg: string; border?: string }> = {
  locked: { fg: SHELL.text.tertiary, bg: 'transparent', border: SHELL.border.subtle },
  todo: { fg: SHELL.text.secondary, bg: 'transparent', border: SHELL.border.strong },
  in_progress: { fg: SHELL.brand, bg: SHELL.brandSoft },
  pending_review: { fg: SHELL.warn, bg: SHELL.warnSoft },
  approved: { fg: SHELL.pos, bg: SHELL.posSoft },
  rejected: { fg: SHELL.neg, bg: SHELL.negSoft },
}

export function StepStatusIcon({
  state,
  order,
  size = 28,
}: {
  state: StepViewState
  order: number
  /** Păstrat pentru compatibilitatea apelanților; animația de „se descheie" a fost scoasă. */
  unchecking?: boolean
  size?: number
}) {
  const tone = TONE[state]

  const content = () => {
    switch (state) {
      case 'locked':
        return <LockRoundedIcon sx={{ fontSize: size * 0.5 }} aria-hidden />
      case 'pending_review':
        return <HourglassTopRoundedIcon sx={{ fontSize: size * 0.5 }} aria-hidden />
      case 'rejected':
        return <PriorityHighRoundedIcon sx={{ fontSize: size * 0.55 }} aria-hidden />
      case 'approved':
        return <CheckRoundedIcon sx={{ fontSize: size * 0.58 }} aria-hidden />
      default:
        return (
          <Box component="span" sx={{ ...SHELL.tabular, fontSize: 12, fontWeight: 600 }}>
            {String(order + 1).padStart(2, '0')}
          </Box>
        )
    }
  }

  return (
    <Box
      component="span"
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: tone.fg,
        backgroundColor: tone.bg,
        border: tone.border ? `1px solid ${tone.border}` : 'none',
      }}
    >
      {content()}
    </Box>
  )
}
