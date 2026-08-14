import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, ButtonBase, Collapse, Stack, Typography } from '@mui/material'

import type { MicroStepView } from '../microStepTypes'
import { useMotionTokens } from '../motion'
import { SHELL } from '../shellTokens'

/**
 * Sub-pașii pasului activ. Apar doar sub el — o listă completă de micro-pași pentru toți cei șase
 * pași ar fi un perete de bifat, exact ce desființăm.
 *
 * Fără indicator numeric: numerotarea e a pașilor mari. Aici contează doar ce e gata, unde ești și
 * ce urmează.
 */
export function StepRailSubSteps({
  steps,
  onSelect,
}: {
  steps: MicroStepView[]
  onSelect?: (id: string) => void
}) {
  const { reduced } = useMotionTokens()

  return (
    <Collapse in appear={!reduced} timeout={reduced ? 0 : 200}>
      <Stack
        component="ul"
        sx={{ listStyle: 'none', m: 0, pl: '34px', pr: 1.25, pb: 1.25, gap: 0.25 }}
      >
        {steps.map((view) => {
          // Un micro-pas la care nu s-a ajuns încă nu e o destinație — n-are ce arăta.
          const reachable = view.done || view.current

          return (
            <Box component="li" key={view.def.id}>
              <ButtonBase
                disabled={!reachable || !onSelect}
                onClick={() => onSelect?.(view.def.id)}
                sx={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  gap: 1,
                  py: 0.5,
                  px: 0.75,
                  borderRadius: SHELL.radius.input,
                  textAlign: 'left',
                  cursor: reachable ? 'pointer' : 'default',
                  '&.Mui-disabled': { pointerEvents: 'none' },
                  '&:hover': reachable ? { backgroundColor: SHELL.bg.surface2 } : {},
                  '&:focus-visible': { outline: `2px solid ${SHELL.brand}`, outlineOffset: 1 },
                }}
              >
                {view.done ? (
                  <CheckRoundedIcon sx={{ fontSize: 14, color: SHELL.pos, flexShrink: 0 }} />
                ) : (
                  <Box
                    aria-hidden
                    sx={{
                      width: 6,
                      height: 6,
                      ml: '4px',
                      mr: '4px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor: view.current ? SHELL.brand : SHELL.border.strong,
                    }}
                  />
                )}

                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    fontSize: 12.5,
                    fontWeight: view.current ? 600 : 400,
                    color: view.current ? SHELL.text.primary : SHELL.text.secondary,
                  }}
                >
                  {view.def.railLabel}
                </Typography>
              </ButtonBase>
            </Box>
          )
        })}
      </Stack>
    </Collapse>
  )
}
