import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import { Box, ButtonBase, Skeleton, Stack, Typography } from '@mui/material'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import type { OnboardingChecklistItem } from '../../../services/onboarding.service'
import { AutosaveIndicator } from '../AutosaveIndicator'
import { useAutosaveSnapshot } from '../autosaveStore'
import { useMotionTokens } from '../motion'
import { SHELL } from '../shellTokens'
import type { StepView } from '../stepModel'
import { useMicroSteps } from '../useMicroSteps'

/**
 * Rail-ul dreapta: pasul curent, desfăcut în ecranele lui.
 *
 * Sursa e parcursul real al utilizatorului (`useMicroSteps().steps`) — adică exact ramura pe care
 * merge el, după ce `visibleWhen` a tăiat restul. O listă statică de documente n-ar fi putut spune
 * asta: cine lucrează doar pe Uber nu are ce vedea la Bolt.
 *
 * Pentru ecranele de upload, verdictul vine tot de la server (`step.checklist`) — „încărcat" nu e
 * același lucru cu „acceptat", iar motivul respingerii îl știe doar backendul.
 *
 * Un singur card. Fără sub-card pentru inel (un card în card nu separă nimic de nimic) și fără
 * bloc de „datele tale sunt protejate": nu e o informație pe care o caută cineva în mijlocul unui
 * upload, iar repetată pe fiecare ecran devine zgomot. Politica de date își are locul ei.
 */

/** Starea unui rând din listă: parcursul (done/current/todo) sau verdictul serverului. */
type ItemState = 'done' | 'current' | 'todo' | 'verifying' | 'rejected'

interface RailItem {
  key: string
  label: string
  state: ItemState
  note?: string | null
  /** Doar ecranele deja parcurse sunt clicabile — înainte nu se sare. */
  goTo?: () => void
}

const ITEM_STATE: Record<ItemState, { label: string | null; icon: ReactNode | null; color: string }> =
  {
    done: {
      label: null,
      icon: <CheckRoundedIcon sx={{ fontSize: 13 }} />,
      color: SHELL.pos,
    },
    current: { label: 'Acum', icon: null, color: SHELL.brand },
    todo: { label: null, icon: null, color: SHELL.text.tertiary },
    verifying: {
      label: 'În verificare',
      icon: <HourglassTopRoundedIcon sx={{ fontSize: 12 }} />,
      color: SHELL.warn,
    },
    rejected: {
      label: 'Respins',
      icon: <CloseRoundedIcon sx={{ fontSize: 13 }} />,
      color: SHELL.neg,
    },
  }

/** Verdictul serverului pentru un document, dacă pasul are checklist. */
const SERVER_STATE: Record<OnboardingChecklistItem['state'], ItemState> = {
  missing: 'todo',
  uploaded: 'done',
  verifying: 'verifying',
  rejected: 'rejected',
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

/**
 * Ecranele pasului curent, în ordinea în care le parcurge chiar acest utilizator. Verdictul de
 * document, când există, bate starea derivată din parcurs: un upload făcut și respins nu e „gata".
 */
function useRailItems(step: StepView | null): RailItem[] {
  const micro = useMicroSteps()
  const checklist = step?.checklist ?? []

  if (micro.steps.length === 0) {
    // Pas nemigrat (sau shell fără config): rămâne lista de documente a serverului.
    return checklist.map((item) => ({
      key: item.key,
      label: item.label,
      state: SERVER_STATE[item.state],
      note: item.note,
    }))
  }

  const currentIndex = micro.current?.index ?? 0

  return micro.steps.map((view) => {
    const category = view.def.document?.category
    const verdict = category ? checklist.find((item) => item.key === category) : undefined

    // Documentul are verdict propriu doar după ce a fost încărcat; „missing" n-ar spune nimic în
    // plus față de poziția în parcurs.
    const state: ItemState =
      verdict && verdict.state !== 'missing'
        ? SERVER_STATE[verdict.state]
        : view.done
          ? 'done'
          : view.current
            ? 'current'
            : 'todo'

    return {
      key: view.def.id,
      label: view.def.railLabel,
      state,
      note: verdict?.note,
      goTo:
        view.index <= currentIndex || view.done ? () => micro.goTo(view.def.id) : undefined,
    }
  })
}

function ChecklistCard({ step }: { step: StepView | null }) {
  const items = useRailItems(step)

  if (step === null || items.length === 0) {
    return null
  }

  const done = items.filter((i) => i.state === 'done').length

  return (
    <Card>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: SHELL.text.primary }}>
        Ce ai de făcut aici
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

      <Stack spacing={0.25}>
        {items.map((item) => (
          <ItemRow key={item.key} item={item} />
        ))}
      </Stack>
    </Card>
  )
}

function ItemRow({ item }: { item: RailItem }) {
  const tone = ITEM_STATE[item.state]
  const isCurrent = item.state === 'current'

  const body = (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: 'flex-start',
        width: '100%',
        px: 1,
        py: 0.75,
        borderRadius: SHELL.radius.input,
        backgroundColor: isCurrent ? SHELL.brandSoft : 'transparent',
      }}
    >
      {/* Bulină de stare, nu index: numerotarea aparține pașilor mari din rail-ul stâng. */}
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
          border: tone.icon
            ? 'none'
            : `${isCurrent ? 2 : 1}px ${isCurrent ? 'solid' : 'dashed'} ${
                isCurrent ? SHELL.brand : SHELL.border.strong
              }`,
        }}
      >
        {tone.icon}
      </Box>

      <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
        <Typography
          sx={{
            fontSize: 13,
            lineHeight: 1.4,
            fontWeight: isCurrent ? 600 : 400,
            color: item.state === 'todo' ? SHELL.text.secondary : SHELL.text.primary,
          }}
        >
          {item.label}
        </Typography>
        {/* „Gata" și „urmează" se citesc din bulină; scriem doar ce nu se vede din ea. */}
        {tone.label && (
          <Typography sx={{ fontSize: 12, color: tone.color, fontWeight: 500 }}>
            {tone.label}
          </Typography>
        )}
        {/* Motivul respingerii stă pe rând, nu într-un tooltip. */}
        {item.note && (
          <Typography sx={{ fontSize: 12, color: SHELL.text.secondary, mt: 0.25 }}>
            {item.note}
          </Typography>
        )}
      </Box>
    </Stack>
  )

  if (!item.goTo) return body

  return (
    <ButtonBase
      onClick={item.goTo}
      aria-current={isCurrent ? 'step' : undefined}
      sx={{
        display: 'block',
        width: '100%',
        borderRadius: SHELL.radius.input,
        textAlign: 'left',
        '&:hover': { backgroundColor: isCurrent ? 'transparent' : SHELL.bg.surface2 },
      }}
    >
      {body}
    </ButtonBase>
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
