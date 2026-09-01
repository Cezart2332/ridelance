import { Stack, Typography } from '@mui/material'

import { TOKENS } from '../../constants/tokens'
import { BCR_DISCOUNT, bcrDiscountedLei } from '../../data/bcrDiscount'

/**
 * Prețul unui plan, cu reducerea BCR aplicată când e bifată.
 *
 * Aceeași componentă pe landing, pe pagina de Abonamente și la alegerea planului din aplicație.
 * Erau trei randări diferite ale aceleiași cifre și ajunseseră să arate altfel: una cu notă
 * anuală, una fără, iar landingul rămăsese cu prețul întreg chiar și după ce se bifa reducerea.
 *
 * Când reducerea e activă, prețul întreg rămâne pe ecran, tăiat. Fără el, cine revine peste o lună
 * n-ar înțelege de ce plătește altceva decât ține minte — iar rândul de dedesubt spune exact când
 * se întâmplă asta.
 */

interface PlanPriceProps {
  /** Prețul lunar, în lei. Cel real, dinaintea reducerii. */
  monthlyLei: number
  /** Ce scrie după sumă: „/ lună", „ lei / lună". Vine de la apelant, ca formatările să nu difere. */
  unit: string
  /** Reducerea BCR e bifată. `false` pe planurile care n-o primesc. */
  discounted: boolean
  align?: 'left' | 'center'
  /** Landingul scrie prețul mai mic decât pagina de Abonamente. */
  size?: 'md' | 'lg'
}

const formatLei = (value: number) =>
  value.toLocaleString('ro-RO', { maximumFractionDigits: 2 })

export function PlanPrice({
  monthlyLei,
  unit,
  discounted,
  align = 'left',
  size = 'lg',
}: PlanPriceProps) {
  const amount = discounted ? bcrDiscountedLei(monthlyLei) : monthlyLei
  const big = size === 'lg' ? '1.9rem' : '1.25rem'

  return (
    <>
      <Stack
        direction="row"
        spacing={0.6}
        sx={{
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          rowGap: 0.2,
          mt: 0.5,
        }}
      >
        {discounted && (
          <Typography
            component="s"
            sx={{
              color: TOKENS.textSubtle,
              fontWeight: 700,
              fontSize: size === 'lg' ? '1.05rem' : '0.95rem',
              textDecorationThickness: '1.5px',
            }}
          >
            {formatLei(monthlyLei)}
          </Typography>
        )}

        <Typography
          sx={{
            color: TOKENS.primaryStrong,
            fontWeight: 900,
            fontSize: big,
            lineHeight: 1.1,
          }}
        >
          {formatLei(amount)} lei
        </Typography>

        <Typography sx={{ color: TOKENS.textMuted, fontWeight: 700, fontSize: '0.9rem' }}>
          {unit}
        </Typography>
      </Stack>

      {discounted && (
        // Cifra de mai sus e adevărată o jumătate de an. Cât ține și ce urmează după se scriu aici,
        // nu într-un asterisc: e diferența dintre o reducere și o schimbare de preț.
        <Typography
          sx={{
            color: TOKENS.primaryStrong,
            fontSize: '0.78rem',
            fontWeight: 700,
            mt: 0.4,
            textAlign: align === 'center' ? 'center' : 'left',
          }}
        >
          primele {BCR_DISCOUNT.months} luni, apoi {formatLei(monthlyLei)} lei
        </Typography>
      )}
    </>
  )
}
