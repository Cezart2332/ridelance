import { Box, ButtonBase } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { AUTH_COLORS } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'

export type AccountType = 'Client' | 'CarPoster'

const OPTIONS = [
  { value: 'Client' as const, title: 'PFA' },
  { value: 'CarPoster' as const, title: 'SRL' },
]

interface AccountTypeChoiceProps {
  value: AccountType
  onChange: (value: AccountType) => void
  disabled?: boolean
}

/**
 * Tipul de cont se alege obligatoriu aici, nu în onboarding: onboardingul există doar pentru PFA,
 * iar un cont de SRL nu trece prin el niciodată. Decide și rolul (`UserRole`) și dashboardul unde
 * aterizezi.
 *
 * Arată ca un comutator cu două poziții, pe rândul câmpurilor, ca să nu rupă ritmul formularului.
 */
export function AccountTypeChoice({ value, onChange, disabled = false }: AccountTypeChoiceProps) {
  return (
    <Box
      role="radiogroup"
      aria-label="Tipul contului"
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0.5,
        p: 0.5,
        borderRadius: `${TOKENS.radius.md + 2}px`,
        backgroundColor: AUTH_COLORS.input,
        border: `1px solid ${AUTH_COLORS.border}`,
      }}
    >
      {OPTIONS.map((option) => {
        const active = option.value === value
        return (
          <ButtonBase
            key={option.value}
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            sx={{
              minHeight: 40,
              borderRadius: `${TOKENS.radius.md}px`,
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: active ? AUTH_COLORS.onPrimary : AUTH_COLORS.textMuted,
              backgroundColor: active ? AUTH_COLORS.primary : 'transparent',
              transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
              '&:hover': {
                color: active ? AUTH_COLORS.onPrimary : AUTH_COLORS.text,
                backgroundColor: active ? AUTH_COLORS.primary : alpha('#fff', 0.04),
              },
            }}
          >
            {option.title}
          </ButtonBase>
        )
      })}
    </Box>
  )
}
