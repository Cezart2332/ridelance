import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import { Box, Divider, Stack, Typography } from '@mui/material'

import type { DocumentSummary } from '../../../services/document.service'
import { requirementsOf } from '../documentRequirements'
import type { MicroStepView } from '../microStepTypes'
import { displaySx, tabularSx, TOKENS } from '../onboardingTheme'
import type { StepView } from '../stepModel'

interface StepContextPanelProps {
  step: StepView | null
  microSteps: MicroStepView[]
  current: MicroStepView | null
  documents: DocumentSummary[]
}

/** Punctul de progres al unui micro-pas: bifat, curent, sau încă neatins. */
function Bullet({ done, current }: { done: boolean; current: boolean }) {
  if (done) {
    return (
      <Box
        aria-hidden
        sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: TOKENS.success,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <CheckRoundedIcon sx={{ fontSize: 11, color: '#fff' }} />
      </Box>
    )
  }

  return (
    <Box
      aria-hidden
      sx={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        flexShrink: 0,
        border: current ? 'none' : `1px solid ${TOKENS.borderHover}`,
        backgroundColor: current ? TOKENS.primary : 'transparent',
      }}
    />
  )
}

/**
 * Rail-ul din dreapta: unde ești în pasul curent și de ce ți se cere ce ți se cere.
 *
 * Slot independent — dacă interpretarea nu e cea dorită, se scoate fără să atingă restul
 * layoutului. Fără card și fără umbră: e context, nu conținut.
 */
export function StepContextPanel({ step, microSteps, current, documents }: StepContextPanelProps) {
  if (!step) return null

  const uploaded = new Set(documents.map((d) => d.category))
  const requirements = requirementsOf(step.key)
  const minutes = microSteps
    .filter((view) => !view.done)
    .reduce((acc, view) => acc + (view.def.estimatedMinutes ?? 0), 0)

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" component="p" sx={{ color: TOKENS.textSubtle }}>
          Pasul curent
        </Typography>
        <Typography variant="subtitle1" sx={{ ...displaySx, color: TOKENS.ink }}>
          {step.label}
        </Typography>
      </Box>

      {microSteps.length > 0 && (
        <Stack component="ul" spacing={1.25} sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {microSteps.map((view) => (
            <Stack
              key={view.def.id}
              component="li"
              direction="row"
              spacing={1.25}
              sx={{ alignItems: 'center' }}
            >
              <Bullet done={view.done} current={view.current} />
              <Typography
                variant="body2"
                sx={{
                  color: view.current ? TOKENS.ink : TOKENS.textMuted,
                  fontWeight: view.current ? 600 : 400,
                }}
              >
                {view.def.railLabel}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      {current?.def.helpText && (
        <>
          <Divider />
          <Box>
            <Typography variant="overline" component="p" sx={{ color: TOKENS.textSubtle, mb: 0.5 }}>
              De ce cerem asta
            </Typography>
            <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
              {current.def.helpText}
            </Typography>
          </Box>
        </>
      )}

      {requirements.length > 0 && (
        <>
          <Divider />
          <Box>
            <Typography variant="overline" component="p" sx={{ color: TOKENS.textSubtle, mb: 1 }}>
              Ce pregătești
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {requirements.map((requirement) => {
                const has =
                  uploaded.has(requirement.category) ||
                  (requirement.alsoAccepts ?? []).some((alt) => uploaded.has(alt))
                return (
                  <Stack
                    key={requirement.category}
                    component="li"
                    direction="row"
                    spacing={1.25}
                    sx={{ alignItems: 'flex-start' }}
                  >
                    <Bullet done={has} current={false} />
                    <Typography
                      variant="caption"
                      sx={{ color: has ? TOKENS.textSubtle : TOKENS.textMuted }}
                    >
                      {requirement.label}
                    </Typography>
                  </Stack>
                )
              })}
            </Stack>
          </Box>
        </>
      )}

      {minutes > 0 && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: TOKENS.textSubtle }}>
          <ScheduleRoundedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ ...tabularSx }}>
            ~{minutes} min rămase la acest pas
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}
