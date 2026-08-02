import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import { Box } from '@mui/material'
import { AnimatePresence, motion } from 'motion/react'

import { useMotionTokens } from '../motion'
import { stateColors, tabularSx, TOKENS } from '../onboardingTheme'
import type { StepViewState } from '../stepModel'

const TONE: Record<StepViewState, Parameters<typeof stateColors>[0]> = {
  locked: 'neutral',
  todo: 'neutral',
  in_progress: 'accent',
  pending_review: 'pending',
  approved: 'success',
  rejected: 'danger',
}

/**
 * Checkmark desenat prin stroke — un singur moment de satisfacție per pas.
 * `unchecking` îl derulează înapoi, când adminul întoarce o decizie deja validată.
 */
function Checkmark({ color, unchecking }: { color: string; unchecking: boolean }) {
  const { check } = useMotionTokens()
  return (
    <Box component={motion.svg} viewBox="0 0 24 24" fill="none" sx={{ width: 16, height: 16 }} aria-hidden>
      <motion.path
        d="M4 12.5L9.5 18L20 6.5"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: unchecking ? 0 : 1 }}
        transition={check}
      />
    </Box>
  )
}

/**
 * Pastila de status a unui pas. Fiecare stare are icon sau cifră proprie — culoarea nu e
 * niciodată singurul semnal (spec §10).
 */
export function StepStatusIcon({
  state,
  order,
  unchecking = false,
  size = 30,
}: {
  state: StepViewState
  order: number
  unchecking?: boolean
  size?: number
}) {
  const tone = stateColors(TONE[state])
  const { pulse } = useMotionTokens()

  const content = () => {
    switch (state) {
      case 'locked':
        return <LockRoundedIcon sx={{ fontSize: size * 0.47 }} aria-hidden />
      case 'pending_review':
        return <HourglassTopRoundedIcon sx={{ fontSize: size * 0.5 }} aria-hidden />
      case 'rejected':
        return <PriorityHighRoundedIcon sx={{ fontSize: size * 0.55 }} aria-hidden />
      case 'approved':
        return <Checkmark color={tone.fg} unchecking={unchecking} />
      default:
        return (
          <Box component="span" sx={{ ...tabularSx, fontSize: size * 0.42, fontWeight: 800 }}>
            {order + 1}
          </Box>
        )
    }
  }

  return (
    <Box
      component={motion.span}
      // Pulse foarte subtil, doar cât să comunice „se lucrează la asta”.
      animate={state === 'pending_review' && pulse ? { opacity: [0.55, 1, 0.55] } : { opacity: 1 }}
      transition={state === 'pending_review' ? pulse : undefined}
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
        border: state === 'todo' ? `1px solid ${TOKENS.border}` : 'none',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.15 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {content()}
        </motion.span>
      </AnimatePresence>
    </Box>
  )
}
