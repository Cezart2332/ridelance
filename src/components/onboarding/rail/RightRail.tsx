import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import type { OnboardingChecklistItem } from '../../../services/onboarding.service'
import { AutosaveIndicator } from '../AutosaveIndicator'
import { useAutosaveSnapshot } from '../autosaveStore'
import { useMotionTokens } from '../motion'
import { SHELL } from '../shellTokens'
import type { StepView } from '../stepModel'

/**
 * Rail-ul dreapta: ce mai lipsește din pasul curent.
 *
 * Derivat **exclusiv** din răspunsul serverului (`step.checklist`). Nu recalculează nimic: dacă
 * inelul ar număra altfel decât lista de sub el, unul din ele ar fi greșit — și n-ai ști care.
 *
 * Un singur card. Fără sub-card pentru inel (un card în card nu separă nimic de nimic) și fără
 * bloc de „datele tale sunt protejate": nu e o informație pe care o caută cineva în mijlocul unui
 * upload, iar repetată pe fiecare ecran devine zgomot. Politica de date își are locul ei.
 */
const ITEM_STATE: Record<
  OnboardingChecklistItem['state'],
  { label: string; icon: ReactNode | null; color: string }
> = {
  missing: { label: 'Lipsește', icon: null, color: SHELL.text.tertiary },
  uploaded: { label: 'Încărcat', icon: <CheckRoundedIcon sx={{ fontSize: 13 }} />, color: SHELL.pos },
  verifying: {
    label: 'În verificare',
    icon: <HourglassTopRoundedIcon sx={{ fontSize: 12 }} />,
    color: SHELL.warn,
  },
  rejected: { label: 'Respins', icon: <CloseRoundedIcon sx={{ fontSize: 13 }} />, color: SHELL.neg },
}

function Card({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: SHELL.radius.card,
        border: `1px solid ${SHELL.border.subtle}`,
        backgroundColor: SHELL.bg.surface,
        boxShadow: SHELL.shadow.card,
      }}
    >
      {children}
    </Box>
  )
}

export function RightRail({ step, loading }: { step: StepView | null; loading: boolean }) {
  // Panoul curent își publică starea de salvare; rail-ul doar o afișează.
  const autosave = useAutosaveSnapshot()

  return (
    <Stack spacing={2}>
      {loading ? (
        // Skeleton, nu spinner centrat: forma finală e cunoscută, deci se poate schița.
        <Card>
          <Skeleton width="45%" />
          <Skeleton variant="circular" height={44} width={44} sx={{ my: 1.5 }} />
          <Skeleton />
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
    </Stack>
  )
}

function ChecklistCard({ step }: { step: StepView | null }) {
  const items = step?.checklist ?? []

  if (step === null) {
    return null
  }

  // Un pas fără documente obligatorii (eligibilitate, fiscal) n-are checklist — și nu inventăm unul.
  if (items.length === 0) {
    return (
      <Card>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: SHELL.text.primary }}>
          Progres
        </Typography>
        <Typography sx={{ fontSize: 13, color: SHELL.text.secondary, mt: 0.5 }}>
          Pasul „{step.label}” nu cere documente. Răspunde la întrebările din stânga.
        </Typography>
      </Card>
    )
  }

  const done = items.filter((i) => i.state === 'uploaded').length

  return (
    <Card>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: SHELL.text.primary }}>
        Ce mai lipsește
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1.5, mb: 2 }}>
        <Ring done={done} total={items.length} />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ ...SHELL.tabular, fontSize: 15, fontWeight: 600, color: SHELL.text.primary }}
          >
            {done} din {items.length}
          </Typography>
          <Typography noWrap sx={{ fontSize: 12, color: SHELL.text.secondary }}>
            {step.label}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1.25}>
        {items.map((item) => {
          const tone = ITEM_STATE[item.state]
          return (
            <Stack key={item.key} direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
              {/* Bulină de stare, nu index: numerotarea aparține pașilor din rail-ul stâng. */}
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  mt: '1px',
                  flexShrink: 0,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#FFFFFF',
                  backgroundColor: tone.icon ? tone.color : 'transparent',
                  border: tone.icon ? 'none' : `1px dashed ${SHELL.border.strong}`,
                }}
              >
                {tone.icon}
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: 13, color: SHELL.text.primary, lineHeight: 1.4 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: 12, color: tone.color, fontWeight: 500 }}>
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
          )
        })}
      </Stack>
    </Card>
  )
}

/** Același inel ca în cardul de progres din stânga, la altă scară — un singur limbaj vizual. */
function Ring({ done, total }: { done: number; total: number }) {
  const size = 44
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const { step } = useMotionTokens()

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <Box component="svg" viewBox={`0 0 ${size} ${size}`} sx={{ width: size, height: size }} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={SHELL.border.subtle}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={SHELL.brand}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
          transition={step}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Box>
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <Typography
          sx={{ ...SHELL.tabular, fontSize: 11, fontWeight: 600, color: SHELL.text.primary }}
        >
          {percent}%
        </Typography>
      </Box>
    </Box>
  )
}
