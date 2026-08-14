import { Box, Stack } from '@mui/material'
import { motion } from 'motion/react'

import { useMotionTokens } from '../motion'
import { completedCount, type StepView } from '../stepModel'
import { RailProgress } from './RailProgress'
import { StepRailItem } from './StepRailItem'

/**
 * Rail-ul stâng: unde ai ajuns în flux. Atât.
 *
 * Cardul de progres plus cei șase pași numerotați. Nu mai desfășoară sub-pașii pasului curent:
 * ce ai de făcut acum e scris în coloana centrală și numărat în rail-ul dreapta, iar a treia
 * copie a aceleiași liste nu adăuga nimic — doar te punea să compari trei locuri ca să fii sigur
 * că spun același lucru.
 */
export function StepRail({
  steps,
  activeKey,
  onSelect,
  estimate,
}: {
  steps: StepView[]
  activeKey: string | null
  onSelect: (step: StepView) => void
  /** Timp estimat pentru pasul curent, afișat în cardul de progres. */
  estimate?: string | null
}) {
  const { reduced, step: stepTransition } = useMotionTokens()

  return (
    <Stack spacing={2}>
      <RailProgress
        done={completedCount(steps)}
        total={steps.length}
        position={Math.max(1, steps.findIndex((s) => s.key === activeKey) + 1)}
        stepLabel={steps.find((s) => s.key === activeKey)?.label ?? null}
        estimate={estimate}
      />

      <Box
        component={motion.ol}
        layout={reduced ? false : true}
        transition={stepTransition}
        sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}
      >
        {steps.map((step) => (
          <StepRailItem
            key={step.key}
            step={step}
            active={step.key === activeKey}
            onSelect={onSelect}
          />
        ))}
      </Box>
    </Stack>
  )
}
