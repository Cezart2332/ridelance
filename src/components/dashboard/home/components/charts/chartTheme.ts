import { alpha } from '@mui/material/styles'

import { HOME_TOKENS } from '../../tokens'

/**
 * Paleta graficelor (spec §5.3) — **singura** sursă de culoare pentru serii.
 * Nicio componentă de grafic nu are voie să scrie un `fill` sau un `stroke` literal;
 * altfel, peste două luni suntem înapoi la cinci hue-uri fără contract pe același ecran.
 *
 * Serii din aceeași familie de date → rampă monocromă pe accentul brandului.
 * Categorii cu adevărat diferite → hue-uri distincte, desaturate la aceeași
 * luminozitate percepută, ca niciuna să nu „strige" peste celelalte.
 */
export const CHART = {
  /** Metrica principală: încasări nete, profit. */
  1: HOME_TOKENS.brand[600],
  /** Serie secundară. */
  2: '#4FA9C9',
  /** Serie terțiară / fundal de arie. */
  3: '#B3DDEC',
  /** A doua categorie reală — indigo tras spre hue-ul brandului. */
  4: '#3F5FA8',
  /** A treia categorie reală. */
  5: '#0E9F8F',
  /** Taxe și obligații fiscale. Niciodată o serie oarecare. */
  6: HOME_TOKENS.warn[600],
  /** Doar valori negative / cheltuieli. */
  7: HOME_TOKENS.neg[600],
} as const

/**
 * Singura excepție de la regula „un accent": la defalcarea pe platforme culorile de brand
 * chiar codifică informație, așa că verdele are voie să apară. În orice alt grafic
 * platformele se disting prin poziție și label, nu prin culoare.
 */
export const PLATFORM_COLOR = HOME_TOKENS.platform

/**
 * Rampa fiscală: cele patru componente ale rezervei de taxe sunt aceeași familie,
 * deci se disting prin luminozitate. Un al doilea hue ar sugera că una dintre ele
 * e altceva decât o obligație către stat.
 */
export const TAX_RAMP = [
  HOME_TOKENS.warn[600],
  HOME_TOKENS.warn[500],
  HOME_TOKENS.warn[400],
  HOME_TOKENS.warn[200],
] as const

/** Gradientul de sub o linie de arie: 14% sub linie → transparent la bază. */
export const areaGradient = (color: string) => ({
  from: alpha(color, 0.14),
  to: alpha(color, 0),
})

/** Fără grid vertical — verticalele împart graficul în cutii fără să adauge informație. */
export const gridProps = {
  strokeDasharray: '3 3',
  stroke: HOME_TOKENS.border.subtle,
  vertical: false,
} as const

export const axisProps = {
  tick: { fill: HOME_TOKENS.text.tertiary, fontSize: 11 },
  axisLine: false,
  tickLine: false,
} as const
