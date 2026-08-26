import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { TOKENS } from '../../constants/tokens'

/**
 * Comutatorul de deasupra cardurilor de abonament: audiență (PFA / flotă) sau ciclu (lunar / anual).
 *
 * Trăiește aici, nu în pagină, fiindcă îl folosesc două ecrane — pagina publică de Abonamente și
 * alegerea planului de după onboarding. Scris de două ori, ar fi ajuns să arate diferit exact
 * acolo unde utilizatorul face aceeași alegere.
 */
export function Switcher<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (next: T) => void
  options: { value: T; label: string; badge?: string }[]
}) {
  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      onChange={(_, next: T | null) => {
        // `null` vine când se apasă opțiunea deja activă. Nu există „niciuna".
        if (next) onChange(next)
      }}
      sx={{
        backgroundColor: alpha(TOKENS.ink, 0.04),
        borderRadius: TOKENS.radius.full,
        p: 0.5,
        gap: 0.5,
        '& .MuiToggleButton-root': {
          border: 'none',
          borderRadius: `${TOKENS.radius.full}px !important`,
          px: 3,
          py: 1,
          fontWeight: 800,
          fontSize: '0.9rem',
          textTransform: 'none',
          color: TOKENS.textMuted,
          '&.Mui-selected': {
            backgroundColor: TOKENS.paper,
            color: TOKENS.ink,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': { backgroundColor: TOKENS.paper },
          },
        },
      }}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
          {option.badge && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 0.9,
                py: 0.2,
                borderRadius: TOKENS.radius.full,
                backgroundColor: alpha(TOKENS.primary, 0.18),
                color: TOKENS.primaryStrong,
                fontSize: '0.72rem',
                fontWeight: 900,
              }}
            >
              {option.badge}
            </Box>
          )}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

