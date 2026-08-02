import { Box, Stack } from '@mui/material'
import { motion } from 'motion/react'

import { useMotionTokens } from '../motion'
import { completedCount, type StepView } from '../stepModel'
import { RailProgress } from './RailProgress'
import { StepRailItem } from './StepRailItem'

/**
 * Rail-ul de checklist: toți pașii vizibili simultan, progresul sus, pasul activ expandat.
 * Nu are skeleton — pașii sunt cunoscuți de la început, nu se încarcă.
 */
export function StepRail({
  steps,
  activeKey,
  uncheckingKeys,
  onSelect,
}: {
  steps: StepView[]
  activeKey: string | null
  uncheckingKeys: string[]
  onSelect: (step: StepView) => void
}) {
  const { reduced, step: stepTransition } = useMotionTokens()

  return (
    <Stack spacing={2}>
      <RailProgress done={completedCount(steps)} total={steps.length} />

      <Box
        component={motion.ol}
        layout={reduced ? false : true}
        transition={stepTransition}
        sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.6 }}
      >
        {steps.map((step) => (
          <StepRailItem
            key={step.key}
            step={step}
            active={step.key === activeKey}
            unchecking={uncheckingKeys.includes(step.key)}
            onSelect={onSelect}
          />
        ))}
      </Box>
    </Stack>
  )
}
