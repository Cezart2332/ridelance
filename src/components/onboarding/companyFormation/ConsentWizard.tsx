import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Button, Checkbox, FormControlLabel, LinearProgress, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'

import type { LegalConsentStep } from '../../../services/companyFormation.service'
import { PanelCard } from '../PanelCard'
import { TOKENS, displaySx } from '../onboardingTheme'

/** Cât așteptăm după bifare înainte să avansăm singuri, ca userul să vadă ce a bifat. */
const AUTO_ADVANCE_MS = 400

function Stepper({ total, current, accepted }: { total: number; current: number; accepted: boolean[] }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }} aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const done = accepted[i]
        const active = i === current
        return (
          <Box
            key={i}
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              backgroundColor: done
                ? alpha(TOKENS.success, 0.14)
                : active
                  ? TOKENS.primary
                  : 'transparent',
              border: done
                ? `1px solid ${alpha(TOKENS.success, 0.4)}`
                : active
                  ? 'none'
                  : `1px solid ${TOKENS.border}`,
            }}
          >
            {done && <CheckRoundedIcon sx={{ fontSize: 14, color: TOKENS.success }} />}
          </Box>
        )
      })}
    </Stack>
  )
}

interface ConsentWizardProps {
  steps: LegalConsentStep[]
  /** Se apelează o singură dată, când toate declarațiile au fost acceptate. */
  onComplete: () => void
  disabled?: boolean
}

/**
 * Wizardul celor cinci declarații. Revenirea la un pas anterior nu debifează ce s-a acceptat
 * deja — omul recitește, nu reîncepe.
 */
export function ConsentWizard({ steps, onComplete, disabled }: ConsentWizardProps) {
  const [current, setCurrent] = useState(0)
  const [accepted, setAccepted] = useState<boolean[]>(() => steps.map(() => false))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const step = steps[current]
  const isLast = current === steps.length - 1
  const allAccepted = accepted.every(Boolean)

  const advance = () => {
    // Și clicul pe „Continuă", și timerul duc aici: fără asta s-ar chema amândouă.
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null

    if (isLast) {
      onComplete()
      return
    }
    setCurrent((c) => c + 1)
  }

  const toggle = (checked: boolean) => {
    const next = accepted.map((value, i) => (i === current ? checked : value))
    setAccepted(next)

    if (timerRef.current) clearTimeout(timerRef.current)
    if (!checked) return

    // Avans automat, ca în fluxul de referință. Butonul rămâne, pentru tastatură și
    // pentru cine bifează din greșeală.
    timerRef.current = setTimeout(() => {
      if (isLast && !next.every(Boolean)) return
      advance()
    }, AUTO_ADVANCE_MS)
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography aria-live="polite" sx={{ color: TOKENS.textMuted, fontWeight: 600, fontSize: '0.9rem' }}>
          Pasul {current + 1} din {steps.length}
        </Typography>
        <Stepper total={steps.length} current={current} accepted={accepted} />
      </Stack>

      <LinearProgress
        variant="determinate"
        value={((current + (accepted[current] ? 1 : 0)) / steps.length) * 100}
        sx={{
          height: 4,
          borderRadius: 2,
          backgroundColor: alpha(TOKENS.ink, 0.07),
          '& .MuiLinearProgress-bar': { backgroundColor: TOKENS.primary },
        }}
      />

      <PanelCard title={step.title}>
        <Stack spacing={2}>
          <Typography sx={{ color: TOKENS.ink, lineHeight: 1.65 }}>{step.body}</Typography>

          <Box
            sx={{
              borderRadius: `${TOKENS.radius.md}px`,
              border: `1px solid ${accepted[current] ? alpha(TOKENS.success, 0.45) : TOKENS.border}`,
              backgroundColor: accepted[current] ? alpha(TOKENS.success, 0.06) : 'transparent',
              px: 1.5,
              py: 0.5,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={accepted[current]}
                  onChange={(e) => toggle(e.target.checked)}
                  disabled={disabled}
                  sx={{ '&.Mui-checked': { color: TOKENS.success } }}
                />
              }
              label={step.checkboxLabel}
              sx={{ alignItems: 'flex-start', py: 1, '& .MuiCheckbox-root': { pt: 0 } }}
            />
          </Box>
        </Stack>
      </PanelCard>

      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between' }}>
        <Button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={disabled || current === 0}
          sx={{ textTransform: 'none', fontWeight: 700, color: TOKENS.textMuted }}
        >
          Înapoi
        </Button>
        <Button
          variant="contained"
          onClick={advance}
          disabled={disabled || !accepted[current] || (isLast && !allAccepted)}
          sx={{
            ...displaySx,
            textTransform: 'none',
            fontWeight: 700,
            backgroundColor: TOKENS.primary,
            '&:hover': { backgroundColor: TOKENS.primaryStrong },
          }}
        >
          Continuă
        </Button>
      </Stack>
    </Stack>
  )
}
