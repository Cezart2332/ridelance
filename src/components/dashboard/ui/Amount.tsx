import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { visuallyHidden } from '@mui/utils'

import { NUMERIC_TEXT, tabularNums } from './numeric'

export type AmountSize = 'hero' | 'kpi' | 'card' | 'row' | 'axis'

/** Treptele din spec §4.3 — dimensiunea părții întregi, în px. */
const SIZE_PX: Record<AmountSize, number> = {
  hero: 36,
  kpi: 30,
  card: 22,
  row: 14,
  axis: 11,
}

interface AmountProps {
  value: number
  /** `lei`, `h`, `km`, `lei/h`. Lipsește pe numere pure (curse, procente). */
  unit?: string
  size?: AmountSize
  /** Implicit 2. Orele și kilometrii cer 1; numerele întregi, 0. */
  decimals?: number
  /** Culoarea părții întregi. Zecimalele și unitatea rămân mereu secundare. */
  color?: string
  weight?: number
  sx?: SxProps<Theme>
}

/**
 * Orice sumă afișată pe dashboard trece pe aici (spec §4.3). Rezolvă simultan trei lucruri
 * pe care fiecare card le rezolva altfel: formatarea ro-RO, alinierea pe grilă și ierarhia.
 *
 * Zecimalele se randează la 60% din partea întreagă, unitatea la 50%, ambele în
 * `text.secondary`. Ochiul citește ordinul de mărime instant, iar cardul respiră — e
 * detaliul care apropie cel mai mult de referință.
 *
 * Cifrele fragmentate în trei `<span>`-uri ar fi citite bucată cu bucată de un screen
 * reader, așa că partea vizibilă e `aria-hidden` și textul complet stă alături, ascuns.
 */
export function Amount({
  value,
  unit,
  size = 'row',
  decimals = 2,
  color = NUMERIC_TEXT.primary,
  weight = 600,
  sx,
}: AmountProps) {
  const px = SIZE_PX[size]

  // Rotunjirea se face înaintea semnului: altfel un −0,001 ar afișa „−0,00".
  const rounded = Number(value.toFixed(decimals))
  const negative = rounded < 0

  const parts = new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).formatToParts(Math.abs(rounded))

  const decimalIndex = parts.findIndex((part) => part.type === 'decimal')
  const join = (from: number, to?: number) =>
    parts
      .slice(from, to)
      .map((part) => part.value)
      .join('')

  const integer = decimalIndex === -1 ? join(0) : join(0, decimalIndex)
  const fraction = decimalIndex === -1 ? '' : join(decimalIndex)

  // Minusul tipografic (U+2212) are lățimea unei cifre, deci coloana rămâne aliniată;
  // hyphen-minus e mai scurt și trage rândul din grilă.
  const sign = negative ? '−' : ''
  const spoken = `${sign}${integer}${fraction}${unit ? ` ${unit}` : ''}`

  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'baseline', ...sx }}>
      <Box
        component="span"
        aria-hidden
        sx={{
          ...tabularNums,
          fontSize: px,
          fontWeight: weight,
          lineHeight: 1.15,
          color,
          // Cifrele mari au nevoie de strângere ca să nu pară rărite; sub 24px, aceeași
          // valoare le-ar face să se atingă.
          letterSpacing: px >= 24 ? '-0.02em' : undefined,
        }}
      >
        {sign}
        {integer}
        {fraction && (
          <Box
            component="span"
            sx={{ fontSize: '0.6em', fontWeight: 500, color: NUMERIC_TEXT.secondary }}
          >
            {fraction}
          </Box>
        )}
      </Box>

      {unit && (
        <Box
          component="span"
          aria-hidden
          sx={{
            ...tabularNums,
            ml: '4px',
            fontSize: px * 0.5,
            fontWeight: 500,
            color: NUMERIC_TEXT.secondary,
          }}
        >
          {unit}
        </Box>
      )}

      <Box component="span" sx={visuallyHidden}>
        {spoken}
      </Box>
    </Box>
  )
}
