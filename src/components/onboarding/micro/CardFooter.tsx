import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { Button, Stack, Typography } from '@mui/material'

import { TOKENS } from '../onboardingTheme'

interface CardFooterProps {
  /** Text discret în stânga — de ce se poate continua, sau ce urmează. */
  hint?: string
  label?: string
  disabled?: boolean
  onContinue: () => void
}

/**
 * Footerul cardului. Butonul de „Înapoi" stă în topbar, nu aici: dublat în două locuri, niciunul
 * nu mai e evident.
 */
export function CardFooter({ hint, label = 'Continuă', disabled, onContinue }: CardFooterProps) {
  return (
    <Stack
      direction={{ xs: 'column-reverse', sm: 'row' }}
      sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}
    >
      <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>
        {hint ?? 'Poți reveni oricând la pasul anterior.'}
      </Typography>

      <Button
        variant="contained"
        size="large"
        disabled={disabled}
        onClick={onContinue}
        endIcon={<ArrowForwardRoundedIcon />}
        sx={{ flexShrink: 0 }}
      >
        {label}
      </Button>
    </Stack>
  )
}
