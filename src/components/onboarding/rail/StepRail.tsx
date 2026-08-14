import { Box, Stack } from '@mui/material'
import { motion } from 'motion/react'

import type { MicroStepView } from '../microStepTypes'
import { useMotionTokens } from '../motion'
import { completedCount, type StepView } from '../stepModel'
import { RailProgress } from './RailProgress'
import { StepRailItem } from './StepRailItem'
import { StepRailSubSteps } from './StepRailSubSteps'

/**
 * Rail-ul de checklist: toți pașii vizibili simultan, progresul sus, pasul activ expandat.
 * Nu are skeleton — pașii sunt cunoscuți de la început, nu se încarcă.
 */
export function StepRail({
  steps,
  activeKey,
  uncheckingKeys,
  onSelect,
  subSteps = [],
  onSelectSubStep,
  estimate,
}: {
  steps: StepView[]
  activeKey: string | null
  uncheckingKeys: string[]
  onSelect: (step: StepView) => void
  /** Micro-pașii pasului activ. Apar doar sub el, niciodată sub ceilalți. */
  subSteps?: MicroStepView[]
  onSelectSubStep?: (id: string) => void
  /** Timp estimat pentru pasul curent, afișat sub bară. */
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
        sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.6 }}
      >
        {steps.map((step) => (
          <StepRailItem
            key={step.key}
            step={step}
            active={step.key === activeKey}
            unchecking={uncheckingKeys.includes(step.key)}
            onSelect={onSelect}
          >
            {step.key === activeKey && subSteps.length > 0 && (
              <StepRailSubSteps steps={subSteps} onSelect={onSelectSubStep} />
            )}
          </StepRailItem>
        ))}
      </Box>
    </Stack>
  )
}
