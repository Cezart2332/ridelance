import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { TOKENS } from '../../../constants/tokens'
import type { Car } from '../../../services/cars.service'
import { getDiscountSavings, hasActiveDiscount } from '../../../utils/carPricing'
import { approxDailyPrice, formatLei } from '../../../utils/vehiclePricing'

/**
 * Cardul de preț și CTA (spec §5) — singurul loc din pagină care cere o decizie.
 *
 * Unitatea e săptămâna, fără excepție. Echivalentul zilnic apare cu „≈", mic și gri, exact ca să
 * nu poată fi citit drept tarif. Nu există nicio sumă totală, nicio taxă și niciun element de
 * checkout: pagina generează un lead, iar prețul final se stabilește la telefon.
 *
 * Selectorul de durată din spec lipsește pentru că nu avem tarife pe trepte în date — un selector
 * care nu schimbă prețul e doar un buton care minte. Durata se alege în formular.
 */

interface VehiclePriceCardProps {
  car: Car
  /** Mașina nu e disponibilă: CTA-ul devine listă de așteptare. */
  waitlist: boolean
  onRequest: () => void
  /** Cardul inline de pe mobil nu are umbră proprie; cel din coloană da. */
  elevated?: boolean
}

const CONTACT_EMAIL = 'contact@ridelance.ro'

export function VehiclePriceCard({ car, waitlist, onRequest, elevated = true }: VehiclePriceCardProps) {
  const discounted = hasActiveDiscount(car)
  const savings = getDiscountSavings(car)

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: `${TOKENS.radius.xl}px`,
        border: `1px solid ${TOKENS.border}`,
        backgroundColor: TOKENS.paper,
        boxShadow: elevated ? TOKENS.shadow.lg : 'none',
      }}
    >
      {discounted && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
          <Typography
            sx={{ color: TOKENS.textSubtle, fontSize: '0.9rem', textDecoration: 'line-through' }}
          >
            {formatLei(car.oldPrice!)} lei
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.2,
              borderRadius: `${TOKENS.radius.sm}px`,
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#B42318',
              backgroundColor: alpha('#B42318', 0.08),
            }}
          >
            −{formatLei(savings)} lei
          </Box>
        </Stack>
      )}

      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
        <Typography
          sx={{
            fontSize: '2.4rem',
            fontWeight: 900,
            lineHeight: 1,
            color: TOKENS.ink,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {formatLei(car.pricePerWeek)}
        </Typography>
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: TOKENS.textMuted }}>
          lei / săptămână
        </Typography>
      </Stack>

      <Typography sx={{ mt: 0.5, fontSize: '0.82rem', color: TOKENS.textSubtle }}>
        ≈ {formatLei(approxDailyPrice(car.pricePerWeek))} lei / zi
      </Typography>

      {car.garantie != null && car.garantie > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 2,
            pt: 2,
            alignItems: 'center',
            borderTop: `1px solid ${TOKENS.border}`,
            color: TOKENS.textMuted,
          }}
        >
          <SavingsOutlinedIcon sx={{ fontSize: 18, color: TOKENS.textSubtle }} />
          <Typography sx={{ fontSize: '0.85rem' }}>
            Garanție {formatLei(car.garantie)} lei, restituită la predarea mașinii
          </Typography>
        </Stack>
      )}

      <Button
        fullWidth
        variant="contained"
        onClick={onRequest}
        sx={{
          mt: 2.5,
          py: 1.6,
          borderRadius: `${TOKENS.radius.md}px`,
          fontWeight: 800,
          fontSize: '1rem',
          textTransform: 'none',
          boxShadow: 'none',
          backgroundColor: TOKENS.primaryStrong,
          '&:hover': { backgroundColor: TOKENS.primaryStrong, boxShadow: TOKENS.shadow.glow },
        }}
      >
        {waitlist ? 'Anunță-mă când e liberă' : 'Solicită mașina'}
      </Button>

      <Button
        fullWidth
        variant="outlined"
        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Întrebare: ${car.brand} ${car.model} ${car.year}`)}`}
        startIcon={<MailOutlineRoundedIcon />}
        sx={{
          mt: 1.25,
          py: 1.4,
          borderRadius: `${TOKENS.radius.md}px`,
          fontWeight: 700,
          textTransform: 'none',
          color: TOKENS.ink,
          borderColor: TOKENS.borderHover,
          '&:hover': { borderColor: TOKENS.ink, backgroundColor: alpha(TOKENS.ink, 0.02) },
        }}
      >
        Întreabă-ne pe email
      </Button>

      <Typography sx={{ mt: 1.5, fontSize: '0.78rem', color: TOKENS.textSubtle, textAlign: 'center' }}>
        Fără plată online. Te contactăm pentru confirmare și programare.
      </Typography>
    </Box>
  )
}
