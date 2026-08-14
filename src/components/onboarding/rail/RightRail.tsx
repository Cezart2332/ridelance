import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import { Box, CircularProgress, Skeleton, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import type { OnboardingChecklistItem } from '../../../services/onboarding.service'
import { AutosaveIndicator } from '../AutosaveIndicator'
import { useAutosaveSnapshot } from '../autosaveStore'
import { SHELL } from '../shellTokens'
import type { StepView } from '../stepModel'

/**
 * Rail-ul dreapta: ce mai lipsește din pasul curent.
 *
 * Derivat **exclusiv** din răspunsul serverului (`step.checklist`). Nu recalculează nimic: dacă
 * inelul ar număra altfel decât lista de sub el, unul din ele ar fi greșit — și n-ai ști care.
 */
const ITEM_STATE: Record<
  OnboardingChecklistItem['state'],
  { label: string; icon: ReactNode; color: string }
> = {
  missing: {
    label: 'Lipsește',
    icon: <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 18 }} />,
    color: SHELL.text.tertiary,
  },
  uploaded: {
    label: 'Încărcat',
    icon: <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />,
    color: SHELL.pos,
  },
  verifying: {
    label: 'În verificare',
    icon: <HourglassEmptyRoundedIcon sx={{ fontSize: 18 }} />,
    color: SHELL.warn,
  },
  rejected: {
    label: 'Respins',
    icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />,
    color: SHELL.neg,
  },
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        p: '20px',
        borderRadius: SHELL.radius.card,
        border: `1px solid ${SHELL.border.subtle}`,
        backgroundColor: SHELL.bg.surface,
        boxShadow: SHELL.shadow.card,
      }}
    >
      {title && (
        <Typography
          sx={{ fontSize: 15, fontWeight: 600, color: SHELL.text.primary, mb: 1.5 }}
        >
          {title}
        </Typography>
      )}
      {children}
    </Box>
  )
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={56}
        thickness={4}
        sx={{ color: SHELL.border.subtle }}
      />
      <CircularProgress
        variant="determinate"
        value={percent}
        size={56}
        thickness={4}
        sx={{
          color: SHELL.brand,
          position: 'absolute',
          left: 0,
          '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: SHELL.text.primary, ...SHELL.tabular }}>
          {percent}%
        </Typography>
      </Box>
    </Box>
  )
}

export function RightRail({
  step,
  loading,
}: {
  step: StepView | null
  /** Checklistul vine din același payload ca pașii; `null` cât timp se încarcă. */
  loading: boolean
}) {
  // Panoul curent își publică starea de salvare; rail-ul doar o afișează.
  const autosave = useAutosaveSnapshot()

  return (
    <Stack spacing={2}>
      {loading ? (
        // Skeleton, nu spinner centrat: forma finală e cunoscută, deci se poate schița.
        <Card>
          <Skeleton variant="rounded" height={56} width={56} />
          <Skeleton sx={{ mt: 2 }} />
          <Skeleton width="70%" />
        </Card>
      ) : (
        <ChecklistCard step={step} />
      )}

      {autosave && (
        <Card>
          <AutosaveIndicator
            status={autosave.status}
            savedAt={autosave.savedAt}
            onRetry={autosave.retry}
          />
        </Card>
      )}

      <Card>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
          <LockRoundedIcon sx={{ fontSize: 18, color: SHELL.text.tertiary, mt: '2px' }} />
          <Typography sx={{ fontSize: 13, color: SHELL.text.secondary, lineHeight: 1.55 }}>
            Documentele tale sunt criptate și le folosim doar pentru dosarele pe care le depunem în
            numele tău. Le poți șterge oricând din contul tău.
          </Typography>
        </Stack>
      </Card>
    </Stack>
  )
}

function ChecklistCard({ step }: { step: StepView | null }) {
  const items = step?.checklist ?? []

  if (step === null) {
    return (
      <Card title="Progres">
        <Typography sx={{ fontSize: 13, color: SHELL.text.secondary }}>
          Nu e nimic de urmărit acum.
        </Typography>
      </Card>
    )
  }

  // Un pas fără documente obligatorii (eligibilitate, fiscal) n-are checklist — și nu inventăm unul.
  if (items.length === 0) {
    return (
      <Card title="Progres">
        <Typography sx={{ fontSize: 13, color: SHELL.text.secondary }}>
          Pasul „{step.label}” nu cere documente. Urmează întrebările din ecranul principal.
        </Typography>
      </Card>
    )
  }

  const done = items.filter((i) => i.state === 'uploaded').length

  return (
    <Card title="Progres">
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
        <ProgressRing done={done} total={items.length} />
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: SHELL.text.primary, ...SHELL.tabular }}>
            {done} din {items.length}
          </Typography>
          <Typography sx={{ fontSize: 13, color: SHELL.text.secondary }}>{step.label}</Typography>
        </Box>
      </Stack>

      <Stack spacing={1.25}>
        {items.map((item) => {
          const tone = ITEM_STATE[item.state]
          return (
            <Box key={item.key}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                <Box sx={{ color: tone.color, display: 'flex', mt: '1px' }}>{tone.icon}</Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 13, color: SHELL.text.primary, lineHeight: 1.45 }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: tone.color }}>
                    {tone.label}
                  </Typography>
                  {/* Motivul respingerii stă pe rând, nu într-un tooltip. */}
                  {item.note && (
                    <Typography sx={{ fontSize: 12, color: SHELL.text.secondary, mt: 0.25 }}>
                      {item.note}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>
          )
        })}
      </Stack>
    </Card>
  )
}
