import { Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { TOKENS } from '../../constants/tokens'
import { BCR_DISCOUNT, bcrDiscountedLei } from '../../data/bcrDiscount'
import type { AdvanceCredit } from '../../data/onboardingAdvance'

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
  /**
   * Ce se întâmplă cu primele facturi, când avansul din onboarding a fost plătit.
   *
   * Când există, cifra mare devine cât se plătește ACUM, iar prețul întreg rămâne tăiat lângă
   * ea. O propoziție sub preț nu ținea locul: cardul continua să strige „199 lei", iar reducerea
   * pe care omul o cumpărase deja se citea ca o notă de subsol.
   *
   * Separat de `discounted`: reducerea BCR schimbă prețul recurent, asta doar primele facturi.
   * Se compun — de aceea creditul se calculează pe suma deja redusă, la apelant.
   */
  advanceCredit?: AdvanceCredit | null
}

const formatLei = (value: number) =>
  value.toLocaleString('ro-RO', { maximumFractionDigits: 2 })

export function PlanPrice({
  monthlyLei,
  unit,
  discounted,
  align = 'left',
  size = 'lg',
  advanceCredit,
}: PlanPriceProps) {
  /** Ce se plătește recurent, după ce se consumă avansul. Reducerea BCR ține de el, nu de prima lună. */
  const recurring = discounted ? bcrDiscountedLei(monthlyLei) : monthlyLei
  /** Ce se plătește ACUM. Asta e cifra mare — restul e context. */
  const amount = advanceCredit ? advanceCredit.firstMonthLei : recurring
  const big = size === 'lg' ? '1.9rem' : '1.25rem'
  // Tăiem prețul întreg de câte ori cifra mare diferă de el, indiferent care reducere a produs-o.
  const struck = amount !== monthlyLei

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
        {struck && (
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

      {/*
        Cifra de mai sus e adevărată o vreme. Cât ține și ce urmează după se scriu aici, nu
        într-un asterisc: e diferența dintre o reducere și o schimbare de preț. Când se suprapun
        avansul și reducerea BCR, rândurile spun secvența în ordine — întâi cât ține prima cifră,
        apoi ce rămâne după ea.
      */}
      {advanceCredit && (
        <Note align={align}>
          {advanceCredit.freeMonths >= 2 ? `primele ${advanceCredit.freeMonths} luni` : 'prima lună'}
          , apoi {formatLei(recurring)} lei
        </Note>
      )}

      {discounted && (
        <Note align={align}>
          {advanceCredit
            ? `reducerea BCR ține ${BCR_DISCOUNT.months} luni, apoi ${formatLei(monthlyLei)} lei`
            : `primele ${BCR_DISCOUNT.months} luni, apoi ${formatLei(monthlyLei)} lei`}
        </Note>
      )}
    </>
  )
}

/** Rândul de sub preț. Aceeași formă pentru toate reducerile, ca să se citească drept listă. */
function Note({ align, children }: { align: 'left' | 'center'; children: ReactNode }) {
  return (
    <Typography
      sx={{
        color: TOKENS.primaryStrong,
        fontSize: '0.78rem',
        fontWeight: 700,
        mt: 0.4,
        textAlign: align === 'center' ? 'center' : 'left',
      }}
    >
      {children}
    </Typography>
  )
}
