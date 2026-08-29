import { Box, ButtonBase, Typography } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { alpha } from '@mui/material/styles'
import { TOKENS } from '../../../constants/tokens'

export type AccountType = 'Client' | 'CarPoster'

/**
 * Doar numele formei juridice. Inițiala din pastilă („P", „S") repeta prima literă a cuvântului
 * de lângă ea, iar descrierile explicau ceva ce alegătorul știe deja despre propria firmă —
 * două rânduri de text pentru o alegere între două cuvinte.
 */
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
 * iar un cont de SRL nu trece prin el niciodată. E singura ramificație reală dinainte de crearea
 * contului, fiindcă decide și rolul (`UserRole`) și dashboardul unde aterizezi.
 */
export function AccountTypeChoice({ value, onChange, disabled = false }: AccountTypeChoiceProps) {
  return (
    <Box>
      <Typography
        component="p"
        variant="body2"
        sx={{ mb: 1, fontWeight: 600, color: TOKENS.ink }}
        id="account-type-label"
      >
        Cum vei folosi RIDElance?
      </Typography>

      <Box
        role="radiogroup"
        aria-labelledby="account-type-label"
        sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}
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
                display: 'grid',
                gridTemplateColumns: '1fr 18px',
                alignItems: 'center',
                gap: 1,
                p: 1.25,
                textAlign: 'left',
                borderRadius: `${TOKENS.radius.lg}px`,
                backgroundColor: active ? alpha(TOKENS.primary, 0.08) : TOKENS.paper,
                border: `1px solid ${active ? alpha(TOKENS.primary, 0.5) : TOKENS.border}`,
                transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': { borderColor: active ? alpha(TOKENS.primary, 0.5) : TOKENS.borderHover },
              }}
            >
              <Typography
                sx={{ minWidth: 0, fontSize: '0.875rem', fontWeight: 700, color: TOKENS.ink }}
              >
                {option.title}
              </Typography>

              <CheckRoundedIcon
                sx={{
                  fontSize: 18,
                  color: TOKENS.primaryStrong,
                  opacity: active ? 1 : 0,
                  transition: `opacity ${TOKENS.duration} ${TOKENS.easing}`,
                }}
              />
            </ButtonBase>
          )
        })}
      </Box>
    </Box>
  )
}
