import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Stack, Typography } from '@mui/material'
import type { KeyboardEvent } from 'react'

import type { MicroStepDef } from '../microStepTypes'
import { TOKENS } from '../onboardingTheme'
import { useMicroSteps } from '../useMicroSteps'

/**
 * Bifuri multiple, în același limbaj vizual ca `ChoiceGroup` — doar că se pot alege mai multe.
 *
 * Rândurile arată la fel ca la o întrebare cu variante fiindcă sunt același gest: alegi dintr-o
 * listă. Diferența (una sau mai multe) o comunică forma indicatorului, pătrat în loc de cerc.
 */
export function MicroMultiStep({ def }: { def: MicroStepDef }) {
  const { answers, answer } = useMicroSteps()

  const stored = answers[def.id]
  const selected = Array.isArray(stored) ? stored : []

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    answer(def.id, next)
  }

  return (
    <Stack component="ul" role="group" aria-label={def.title} sx={{ listStyle: 'none', m: 0, p: 0, gap: 1.25 }}>
      {(def.choices ?? []).map((choice) => {
        const checked = selected.includes(choice.value)

        const onKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
          if (event.key !== ' ' && event.key !== 'Enter') return
          event.preventDefault()
          toggle(choice.value)
        }

        return (
          <Stack
            key={choice.value}
            component="li"
            direction="row"
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onClick={() => toggle(choice.value)}
            onKeyDown={onKeyDown}
            sx={{
              alignItems: 'center',
              gap: 2,
              minHeight: 56,
              px: 2.5,
              py: 1.5,
              cursor: 'pointer',
              borderRadius: `${TOKENS.radius.lg}px`,
              border: `1.5px solid ${checked ? TOKENS.primary : TOKENS.border}`,
              backgroundColor: checked ? TOKENS.primarySoft : TOKENS.paper,
              transition: `border-color ${TOKENS.duration} ${TOKENS.easing}, background-color ${TOKENS.duration} ${TOKENS.easing}`,
              '&:hover': { borderColor: checked ? TOKENS.primary : TOKENS.primaryEdge },
              '&:focus-visible': { outline: `2px solid ${TOKENS.primary}`, outlineOffset: 2 },
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 20,
                height: 20,
                flexShrink: 0,
                borderRadius: `${TOKENS.radius.xs}px`,
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                border: `1.5px solid ${checked ? TOKENS.primary : TOKENS.borderHover}`,
                backgroundColor: checked ? TOKENS.primary : 'transparent',
              }}
            >
              {checked && <CheckRoundedIcon sx={{ fontSize: 14 }} />}
            </Box>

            <Typography variant="subtitle2" sx={{ color: TOKENS.ink, fontWeight: checked ? 600 : 500 }}>
              {choice.title}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}

