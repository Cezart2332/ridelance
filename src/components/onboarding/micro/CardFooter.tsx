import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { Button, Stack, Typography } from '@mui/material'

import { TOKENS } from '../onboardingTheme'

interface CardFooterProps {
  label?: string
  disabled?: boolean
  /**
   * De ce e butonul dezactivat, în cuvinte. Regulă globală pe onboarding: un buton gri fără
   * explicație lasă utilizatorul să ghicească ce lipsește (spec fix-uri §10.4).
   */
  reasons?: string[]
  onContinue?: () => void
  /**
   * Când continuarea e o navigare, nu o acțiune, footerul randează o ancoră.
   *
   * Contează pentru ieșirea din onboarding către dashboard: un buton nu se poate deschide în tab
   * nou și nu se anunță ca link cititoarelor de ecran, deși exact asta face.
   */
  href?: string
}

/**
 * Footerul cardului: un singur buton, la dreapta, cu motivul dedesubt când e blocat.
 *
 * „Înapoi" stă în topbar — dublat în două locuri, niciunul nu mai e evident.
 */
export function CardFooter({
  label = 'Continuă',
  disabled,
  reasons,
  onContinue,
  href,
}: CardFooterProps) {
  const blockers = disabled ? (reasons ?? []) : []

  return (
    <Stack spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'flex-end' } }}>
      <Button
        variant="contained"
        size="large"
        disabled={disabled}
        {...(href ? { href } : { onClick: onContinue })}
        endIcon={<ArrowForwardRoundedIcon />}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        {label}
      </Button>

      {blockers.length > 0 && (
        <Stack
          role="status"
          aria-live="polite"
          spacing={0.25}
          sx={{ alignItems: { xs: 'flex-start', sm: 'flex-end' } }}
        >
          {blockers.map((reason) => (
            <Typography key={reason} sx={{ fontSize: '0.8rem', color: TOKENS.textMuted }}>
              {reason}
            </Typography>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
