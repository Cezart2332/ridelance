import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { KeyboardEvent } from 'react'

import type { ConsultoOffice } from '../../../services/companyFormation.service'
import { TOKENS } from '../onboardingTheme'

/**
 * Alegerea zonei în care primești sediul social, pentru cine nu are unde să-l declare.
 *
 * O grilă de carduri, nu un `<Select>`: sunt paisprezece opțiuni scurte, toate egale ca
 * importanță, iar alegerea e geografică — pe carduri se citesc dintr-o privire, într-o listă
 * derulantă trebuie deschise și parcurse.
 *
 * Prețul nu apare deloc aici. La pasul ăsta întrebarea e „unde", nu „cât"; suma are ecranul ei
 * de plată, iar repetată pe paisprezece carduri ar fi doar zgomot.
 *
 * Semantica rămâne de radiogroup, cu tot ce implică: săgețile mută selecția, Space/Enter
 * confirmă, `aria-checked` spune adevărul.
 */

const PREVIOUS = ['ArrowUp', 'ArrowLeft']
const NEXT = ['ArrowDown', 'ArrowRight']

export function OfficeZonePicker({
  offices,
  value,
  onChange,
  disabled,
}: {
  offices: ConsultoOffice[]
  value: string | null
  onChange: (officeId: string) => void
  disabled?: boolean
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || ![...PREVIOUS, ...NEXT].includes(event.key)) return
    event.preventDefault()

    const current = offices.findIndex((o) => o.id === value)
    const step = NEXT.includes(event.key) ? 1 : -1
    const next =
      current < 0
        ? step > 0
          ? 0
          : offices.length - 1
        : (current + step + offices.length) % offices.length

    onChange(offices[next].id)
  }

  return (
    <Box
      role="radiogroup"
      aria-label="Zona sediului social"
      onKeyDown={handleKeyDown}
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
        },
      }}
    >
      {offices.map((office, index) => {
        const selected = office.id === value
        // Un singur tab-stop pentru tot grupul, ca la radio-urile native.
        const tabIndex = selected || (value === null && index === 0) ? 0 : -1

        return (
          <Stack
            key={office.id}
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : tabIndex}
            onClick={disabled ? undefined : () => onChange(office.id)}
            sx={{
              position: 'relative',
              gap: 0.4,
              minHeight: 92,
              justifyContent: 'center',
              px: 2,
              py: 1.75,
              cursor: disabled ? 'not-allowed' : 'pointer',
              borderRadius: `${TOKENS.radius.lg}px`,
              border: `1.5px solid ${selected ? TOKENS.primary : TOKENS.border}`,
              backgroundColor: selected ? TOKENS.primarySoft : TOKENS.paper,
              opacity: disabled ? 0.6 : 1,
              transition: `border-color ${TOKENS.duration} ${TOKENS.easing}, background-color ${TOKENS.duration} ${TOKENS.easing}`,
              '&:hover':
                disabled || selected
                  ? {}
                  : { borderColor: TOKENS.primaryEdge, backgroundColor: alpha(TOKENS.primary, 0.04) },
              '&:focus-visible': { outline: `2px solid ${TOKENS.primary}`, outlineOffset: 2 },
            }}
          >
            {selected && (
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: TOKENS.primary,
                }}
              >
                <CheckRoundedIcon sx={{ fontSize: 14, color: '#fff' }} />
              </Box>
            )}

            <PlaceRoundedIcon
              sx={{ fontSize: 18, color: selected ? TOKENS.primaryStrong : TOKENS.textSubtle }}
            />
            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: TOKENS.ink, pr: 2.5 }}>
              {office.zona}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted }}>
              {office.judet}
            </Typography>
          </Stack>
        )
      })}
    </Box>
  )
}
