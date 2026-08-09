import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { useMotionTokens } from '../motion'
import { displaySx, stateColors, TOKENS } from '../onboardingTheme'
import { stepStateLabel, type StepView } from '../stepModel'
import { StepStatusIcon } from './StepStatusIcon'

const TONE_BORDER: Record<StepView['state'], string> = {
  locked: TOKENS.border,
  todo: TOKENS.border,
  in_progress: TOKENS.primary,
  pending_review: stateColors('pending').border,
  approved: TOKENS.border,
  rejected: stateColors('danger').border,
}

/**
 * Un pas din rail. Doar pasul activ e expandat — restul rămân o linie, ca să încapă toți șase
 * pe ecran fără scroll. Blocatele nu sunt clicabile, dar rămân vizibile: driverul trebuie să
 * vadă cât a mai rămas, nu doar unde e.
 */
export function StepRailItem({
  step,
  active,
  unchecking,
  onSelect,
  children,
}: {
  step: StepView
  active: boolean
  unchecking: boolean
  onSelect: (step: StepView) => void
  /** Sub-pașii pasului activ. Stau în afara `ButtonBase` — un buton nu poate conține butoane. */
  children?: ReactNode
}) {
  const { step: stepTransition, reduced } = useMotionTokens()
  const locked = step.state === 'locked'

  return (
    <Box
      component={motion.li}
      layout={reduced ? false : 'position'}
      transition={stepTransition}
      aria-current={active ? 'step' : undefined}
      sx={{ listStyle: 'none' }}
    >
      <Box
        component={motion.div}
        layout={reduced ? false : true}
        transition={stepTransition}
        // Shake scurt când un pas validat e întors pe respins — schimbarea nu trebuie să fie silențioasă.
        animate={unchecking && !reduced ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
        sx={{
          borderRadius: `${TOKENS.radius.lg}px`,
          border: `1px solid ${TONE_BORDER[step.state]}`,
          backgroundColor: active ? TOKENS.paper : 'transparent',
          boxShadow: active ? TOKENS.shadow.sm : 'none',
          opacity: locked ? 0.4 : 1,
          overflow: 'hidden',
        }}
      >
        <ButtonBase
          disabled={locked}
          onClick={() => onSelect(step)}
          sx={{
            width: '100%',
            display: 'block',
            textAlign: 'left',
            px: 1.5,
            py: 1.35,
            cursor: locked ? 'not-allowed' : 'pointer',
            '&.Mui-disabled': { pointerEvents: 'auto', cursor: 'not-allowed' },
            '&:hover': locked ? {} : { backgroundColor: 'rgba(26, 26, 46, 0.02)' },
          }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.4 }}>
            <StepStatusIcon state={step.state} order={step.order} unchecking={unchecking} />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  ...displaySx,
                  fontWeight: active ? 700 : 600,
                  fontSize: '0.9rem',
                  color: TOKENS.ink,
                  lineHeight: 1.25,
                }}
              >
                {step.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: stateColors(
                    step.state === 'approved'
                      ? 'success'
                      : step.state === 'pending_review'
                        ? 'pending'
                        : step.state === 'rejected'
                          ? 'danger'
                          : 'neutral',
                  ).fg,
                  mt: 0.1,
                }}
              >
                {stepStateLabel(step.state)}
              </Typography>
            </Box>
          </Stack>

          {/* Singurul text de sub titlu: motivul pentru care pasul e blocat sau respins.
              Fără el driverul n-are cum să afle de ce nu poate merge mai departe. */}
          {step.reason && (
            <Typography
              sx={{
                pl: '44px',
                pt: 0.8,
                fontSize: '0.76rem',
                lineHeight: 1.45,
                color: step.state === 'rejected' ? TOKENS.danger : TOKENS.textMuted,
                fontWeight: step.state === 'rejected' ? 600 : 500,
              }}
            >
              {step.reason}
            </Typography>
          )}
        </ButtonBase>

        {children}
      </Box>
    </Box>
  )
}
