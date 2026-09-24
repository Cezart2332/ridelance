import { Box, Link, Stack, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { useEffect, useRef } from 'react'

import { TOKENS } from '../onboardingTheme'

const fill = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`

export interface AutoAdvanceCountdown {
  /** Cât se așteaptă înainte de trecerea mai departe. */
  delayMs: number
  /** Schimbat, repornește numărătoarea (un răspuns nou, altă tastă). */
  restartKey: string
  /** Nu numărăm (o eroare pe ecran). */
  paused: boolean
}

interface AutoAdvanceFooterProps {
  /** Ce lipsește ca ecranul să fie gata. Se afișează doar când nu se poate merge mai departe. */
  reasons?: string[]
  countdown?: AutoAdvanceCountdown | null
  /** Omul a ales să rămână pe ecran. */
  stayed?: boolean
  /** Se lucrează (se salvează răspunsul, se trimite ceva). */
  busy?: boolean
  /** Numărătoarea s-a terminat: mergem mai departe. */
  onDone: () => void
  /** „Rămân aici”. */
  onStay: () => void
}

/**
 * Footerul cardului de onboarding, fără „Continuă”: un ecran terminat trece singur mai departe.
 * Cât numără, o bară arată că urmează pasul următor, iar „Rămân aici” oprește trecerea (cine a
 * revenit pe un ecran ca să-l recitească). Un ecran neterminat spune ce mai lipsește.
 */
export function AutoAdvanceFooter({ reasons = [], countdown, stayed, busy, onDone, onStay }: AutoAdvanceFooterProps) {
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  const running = countdown != null && !countdown.paused && !stayed && !busy
  const delay = countdown?.delayMs ?? 0
  const restartKey = countdown?.restartKey ?? ''

  useEffect(() => {
    if (!running) return undefined
    const timer = window.setTimeout(() => onDoneRef.current?.(), delay)
    return () => window.clearTimeout(timer)
  }, [running, delay, restartKey])

  if (busy) {
    return (
      <Typography role="status" sx={{ fontSize: '0.85rem', color: TOKENS.textMuted, textAlign: { sm: 'right' } }}>
        Se salvează…
      </Typography>
    )
  }

  if (countdown && stayed) {
    return (
      <Typography role="status" sx={{ fontSize: '0.85rem', color: TOKENS.textMuted, textAlign: { sm: 'right' } }}>
        Ai rămas pe acest ecran. Când schimbi ceva, mergem mai departe singuri; poți alege și alt pas din listă.
      </Typography>
    )
  }

  if (countdown) {
    return (
      <Stack spacing={0.75} role="status" aria-live="polite" data-testid="auto-advance">
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: TOKENS.textMuted }}>
            {countdown.paused ? 'Mergem mai departe când se rezolvă eroarea.' : 'Continuăm automat…'}
          </Typography>
          {!countdown.paused && (
            <Link component="button" type="button" underline="hover" onClick={onStay} sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Rămân aici
            </Link>
          )}
        </Stack>
        <Box sx={{ height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: TOKENS.border }}>
          {running && (
            <Box
              key={restartKey}
              sx={{
                height: '100%',
                backgroundColor: TOKENS.primary,
                transformOrigin: 'left',
                animation: `${fill} ${delay}ms linear forwards`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none', transform: 'scaleX(1)', opacity: 0.4 },
              }}
            />
          )}
        </Box>
      </Stack>
    )
  }

  if (reasons.length === 0) return null

  return (
    <Stack role="status" aria-live="polite" spacing={0.25} sx={{ alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
      {reasons.map((reason) => (
        <Typography key={reason} sx={{ fontSize: '0.85rem', color: TOKENS.textMuted }}>
          {reason}
        </Typography>
      ))}
    </Stack>
  )
}
