import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'

import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { STEPS, type StepId } from './wizardModel'

/**
 * Coloana de pași din stânga formularului.
 *
 * Pașii deja vizitați rămân clicabili: fluxul nu e o poartă, ci un cuprins. Cineva care își
 * amintește la pasul 5 că a greșit prețul trebuie să se poată întoarce fără să reparcurgă tot.
 */
interface StepRailProps {
  active: StepId
  visited: Set<StepId>
  /** Pașii cu câmpuri obligatorii goale, marcați ca atare abia după ce au fost vizitați. */
  incomplete: Set<StepId>
  onSelect: (step: StepId) => void
}

export function StepRail({ active, visited, incomplete, onSelect }: StepRailProps) {
  return (
    <Stack
      component="nav"
      aria-label="Pașii adăugării"
      spacing={0.6}
      sx={{ flexShrink: 0, width: { xs: '100%', md: 232 } }}
    >
      {STEPS.map((step, index) => {
        const isActive = step.id === active
        const isVisited = visited.has(step.id)
        const needsWork = isVisited && incomplete.has(step.id)
        const isDone = isVisited && !needsWork && !isActive

        return (
          <ButtonBase
            key={step.id}
            onClick={() => onSelect(step.id)}
            aria-current={isActive ? 'step' : undefined}
            sx={{
              justifyContent: 'flex-start',
              gap: 1.4,
              width: '100%',
              px: 1.4,
              py: 1.2,
              borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
              textAlign: 'left',
              border: `1px solid ${isActive ? alpha(DASHBOARD_TOKENS.primary, 0.3) : 'transparent'}`,
              backgroundColor: isActive ? alpha(DASHBOARD_TOKENS.primary, 0.09) : 'transparent',
              '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.05) },
              '&:focus-visible': { outline: `2px solid ${DASHBOARD_TOKENS.primaryStrong}`, outlineOffset: 2 },
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 28,
                height: 28,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: isActive || isDone ? DASHBOARD_TOKENS.paper : DASHBOARD_TOKENS.textMuted,
                bgcolor: isActive
                  ? DASHBOARD_TOKENS.primaryStrong
                  : isDone
                    ? DASHBOARD_TOKENS.accent
                    : needsWork
                      ? alpha(DASHBOARD_TOKENS.stateWarning, 0.15)
                      : alpha(DASHBOARD_TOKENS.ink, 0.07),
                border: needsWork ? `1px solid ${alpha(DASHBOARD_TOKENS.stateWarning, 0.4)}` : 'none',
              }}
            >
              {isDone ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : index + 1}
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  color: isActive ? DASHBOARD_TOKENS.primaryStrong : DASHBOARD_TOKENS.ink,
                }}
              >
                {step.title}
              </Typography>
              <Typography noWrap sx={{ fontSize: '0.74rem', color: DASHBOARD_TOKENS.textMuted }}>
                {needsWork ? 'Câmpuri necompletate' : step.hint}
              </Typography>
            </Box>
          </ButtonBase>
        )
      })}
    </Stack>
  )
}
