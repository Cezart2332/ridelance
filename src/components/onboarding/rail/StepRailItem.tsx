import { Box, ButtonBase, Chip, Stack, Tooltip, Typography } from '@mui/material'

import { SHELL } from '../shellTokens'
import { stepStateLabel, type StepView } from '../stepModel'
import { StepStatusIcon } from './StepStatusIcon'

/**
 * Un pas din rail — un RÂND, nu un card.
 *
 * Conține exact două lucruri: numărul pasului și titlul lui. Statusul îl poartă indexul, care
 * devine iconiță când e cazul; textul de status s-ar repeta pe șase rânduri fără să spună nimic
 * ce iconița nu spune deja. Motivul blocării e tooltip: era identic pe fiecare rând blocat și
 * ocupa mai mult loc decât informația utilă.
 *
 * Singura suprafață din rail e pasul curent. Cinci carduri gri pe care nu poți da click sunt
 * spațiu irosit, deci rândurile blocate se comprimă și ies din tab order.
 */
export function StepRailItem({
  step,
  active,
  onSelect,
}: {
  step: StepView
  active: boolean
  onSelect: (step: StepView) => void
}) {
  const locked = step.state === 'locked'

  const row = (
    <ButtonBase
      disabled={locked}
      // Un pas blocat nu e o destinație: scos din tab order, dar rămâne vizibil ca reper.
      tabIndex={locked ? -1 : 0}
      onClick={() => onSelect(step)}
      aria-label={`${step.label} — ${stepStateLabel(step.state)}`}
      sx={{
        width: '100%',
        display: 'block',
        textAlign: 'left',
        px: 1.25,
        py: locked ? 0.9 : 1.15,
        borderRadius: SHELL.radius.card,
        border: active ? `1px solid ${SHELL.border.subtle}` : '1px solid transparent',
        backgroundColor: active ? SHELL.bg.surface : 'transparent',
        boxShadow: active ? SHELL.shadow.card : 'none',
        opacity: locked ? 0.55 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
        '&.Mui-disabled': { pointerEvents: 'auto', cursor: 'not-allowed' },
        '&:hover': locked || active ? {} : { backgroundColor: SHELL.bg.surface2 },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
        <StepStatusIcon state={step.state} order={step.order} />
        <Typography
          noWrap
          sx={{
            fontWeight: active ? 600 : 500,
            fontSize: 14,
            color: active ? SHELL.text.primary : SHELL.text.secondary,
            lineHeight: 1.3,
          }}
        >
          {step.label}
        </Typography>

        {/* Un pas sărit în modul dev nu are voie să arate ca unul parcurs corect (§13.6). */}
        {step.skippedInDev && (
          <Chip
            label="sărit"
            size="small"
            sx={{ height: 18, fontSize: 10, fontWeight: 700, flexShrink: 0 }}
          />
        )}
      </Stack>
    </ButtonBase>
  )

  return (
    <Box component="li" aria-current={active ? 'step' : undefined} sx={{ listStyle: 'none' }}>
      {step.reason ? (
        <Tooltip title={step.reason} placement="right">
          {/* Tooltip are nevoie de un element care primește evenimente; butonul poate fi disabled. */}
          <Box>{row}</Box>
        </Tooltip>
      ) : (
        row
      )}
    </Box>
  )
}
