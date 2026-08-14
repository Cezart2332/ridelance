import { Box, Button, Stack, Typography } from '@mui/material'

import { TOKENS } from '../../../constants/tokens'
import { formatLei } from '../../../utils/vehiclePricing'

/**
 * Bara fixă de jos, pe mobil (spec §5).
 *
 * Apare abia după ce cardul inline a ieșit din ecran: cât timp prețul e vizibil oricum, o bară
 * peste conținut e doar spațiu furat. `safe-area-inset-bottom` ține butonul deasupra barei de
 * navigație de pe iPhone.
 */
interface VehicleMobilePriceBarProps {
  pricePerWeek: number
  waitlist: boolean
  visible: boolean
  onRequest: () => void
}

export function VehicleMobilePriceBar({
  pricePerWeek,
  waitlist,
  visible,
  onRequest,
}: VehicleMobilePriceBarProps) {
  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1100,
        display: { xs: 'block', md: 'none' },
        px: 2,
        pt: 1.5,
        pb: 'calc(12px + env(safe-area-inset-bottom))',
        backgroundColor: TOKENS.paper,
        borderTop: `1px solid ${TOKENS.border}`,
        boxShadow: TOKENS.shadow.xl,
        transform: visible ? 'translateY(0)' : 'translateY(120%)',
        transition: `transform 240ms ${TOKENS.easing}`,
        // Ascunsă înseamnă și inertă: altfel butonul rămâne accesibil cu tastatura de sub ecran.
        visibility: visible ? 'visible' : 'hidden',
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: TOKENS.ink,
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {formatLei(pricePerWeek)} lei
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: TOKENS.textSubtle }}>pe săptămână</Typography>
        </Box>

        <Button
          variant="contained"
          onClick={onRequest}
          sx={{
            ml: 'auto',
            px: 3,
            py: 1.4,
            minHeight: 44,
            flexShrink: 0,
            borderRadius: `${TOKENS.radius.md}px`,
            fontWeight: 800,
            textTransform: 'none',
            boxShadow: 'none',
            backgroundColor: TOKENS.primaryStrong,
            '&:hover': { backgroundColor: TOKENS.primaryStrong },
          }}
        >
          {waitlist ? 'Anunță-mă' : 'Solicită mașina'}
        </Button>
      </Stack>
    </Box>
  )
}
