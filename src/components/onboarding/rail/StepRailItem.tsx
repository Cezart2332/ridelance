import { Box, ButtonBase, Stack, Tooltip, Typography } from '@mui/material'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { useMotionTokens } from '../motion'
import { SHELL } from '../shellTokens'
import { stepStateLabel, type StepView } from '../stepModel'
import { StepStatusIcon } from './StepStatusIcon'

const STATE_COLOR: Record<StepView['state'], string> = {
  locked: SHELL.text.tertiary,
  todo: SHELL.text.secondary,
  in_progress: SHELL.brand,
  pending_review: SHELL.warn,
  approved: SHELL.pos,
  rejected: SHELL.neg,
}

/**
 * Un pas din rail — un RÂND, nu un card.
 *
 * Înainte toți cei șase pași erau carduri cu border și fundal, deci un ecran cu cinci pași
 * blocați era cinci suprafețe mari pe care nu poți da click. Acum singura suprafață din rail e
 * pasul curent: restul sunt rânduri, iar cele blocate se comprimă și ies din tab order — nu au
 * ce face acolo cineva care navighează cu tastatura.
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

  const row = (
    <Box
      component={motion.div}
      layout={reduced ? false : true}
      transition={stepTransition}
      // Shake scurt când un pas validat e întors pe respins — schimbarea nu trebuie să fie silențioasă.
      animate={unchecking && !reduced ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
      sx={{
        borderRadius: SHELL.radius.card,
        // Doar pasul curent e o suprafață. Restul sunt rânduri pe fundalul rail-ului.
        border: active ? `1px solid ${SHELL.brand}` : '1px solid transparent',
        backgroundColor: active ? SHELL.brandSoft : 'transparent',
        opacity: locked ? 0.55 : 1,
        overflow: 'hidden',
      }}
    >
      <ButtonBase
        disabled={locked}
        // Un pas blocat nu e o destinație: scos din tab order, dar rămâne vizibil ca reper.
        tabIndex={locked ? -1 : 0}
        onClick={() => onSelect(step)}
        sx={{
          width: '100%',
          display: 'block',
          textAlign: 'left',
          px: 1.25,
          // Rândurile blocate se comprimă: ocupă cât informația lor, nu cât una activă.
          py: locked ? 0.75 : 1.1,
          cursor: locked ? 'not-allowed' : 'pointer',
          '&.Mui-disabled': { pointerEvents: 'auto', cursor: 'not-allowed' },
          '&:hover': locked ? {} : { backgroundColor: SHELL.bg.surface2 },
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
          <StepStatusIcon state={step.state} order={step.order} unchecking={unchecking} size={26} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                color: SHELL.text.primary,
                lineHeight: 1.3,
              }}
            >
              {step.label}
            </Typography>
            {/* Statusul se scrie doar când spune ceva în plus față de iconiță. */}
            {!locked && step.state !== 'todo' && (
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: STATE_COLOR[step.state] }}>
                {stepStateLabel(step.state)}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Motivul respingerii rămâne pe rând: e o instrucțiune, nu o notă de subsol.
            Motivul blocării a devenit tooltip — se repeta identic pe fiecare pas blocat. */}
        {step.reason && step.state === 'rejected' && (
          <Typography
            sx={{
              pl: '38px',
              pt: 0.6,
              fontSize: 12,
              lineHeight: 1.45,
              color: SHELL.neg,
              fontWeight: 600,
            }}
          >
            {step.reason}
          </Typography>
        )}
      </ButtonBase>

      {children}
    </Box>
  )

  return (
    <Box
      component={motion.li}
      layout={reduced ? false : 'position'}
      transition={stepTransition}
      aria-current={active ? 'step' : undefined}
      sx={{ listStyle: 'none' }}
    >
      {locked && step.reason ? (
        <Tooltip title={step.reason} placement="right">
          {/* Tooltip are nevoie de un element care primește evenimente; butonul e disabled. */}
          <Box>{row}</Box>
        </Tooltip>
      ) : (
        row
      )}
    </Box>
  )
}
