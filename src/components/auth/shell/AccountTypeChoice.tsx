import { Box, ButtonBase, Typography } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { alpha } from '@mui/material/styles'
import { ROOMY } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'

export type AccountType = 'Client' | 'CarPoster'

const OPTIONS = [
  {
    value: 'Client' as const,
    tag: 'P',
    title: 'PFA',
    hint: 'Pentru activitatea ta individuală',
    help: 'Vei primi dashboardul dedicat administrării activității PFA.',
  },
  {
    value: 'CarPoster' as const,
    tag: 'F',
    title: 'Flotă',
    hint: 'Pentru mașini, cereri și documente',
    help: 'Vei primi dashboardul pentru mașini, cereri, documente și administrarea flotei.',
  },
]

interface AccountTypeChoiceProps {
  value: AccountType
  onChange: (value: AccountType) => void
  disabled?: boolean
}

/**
 * Tipul de cont se alege obligatoriu aici, nu în onboarding: onboardingul există doar pentru PFA,
 * iar un cont de flotă nu trece prin el niciodată. E singura ramificație reală dinainte de crearea
 * contului, fiindcă decide și rolul (`UserRole`) și dashboardul unde aterizezi.
 */
export function AccountTypeChoice({ value, onChange, disabled = false }: AccountTypeChoiceProps) {
  const selected = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0]

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
                gridTemplateColumns: '34px 1fr 18px',
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
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: `${TOKENS.radius.md}px`,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  backgroundColor: active ? alpha(TOKENS.primary, 0.18) : TOKENS.surfaceAlt,
                  color: active ? TOKENS.primaryStrong : TOKENS.textMuted,
                }}
              >
                {option.tag}
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: TOKENS.ink }}>
                  {option.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', color: TOKENS.textMuted, [ROOMY]: { display: 'none' } }}
                >
                  {option.hint}
                </Typography>
              </Box>

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

      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 1, color: TOKENS.textMuted, [ROOMY]: { display: 'none' } }}
      >
        {selected.help}
      </Typography>
    </Box>
  )
}
