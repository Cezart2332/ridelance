import { HOME_TOKENS } from '../../tokens'

/** Setup comun tuturor graficelor (spec §4): fără axe vizibile, doar gridlines orizontale. */
export const gridProps = {
  strokeDasharray: '3 3',
  stroke: HOME_TOKENS.border.subtle,
  vertical: false,
} as const

export const axisProps = {
  tick: { fill: HOME_TOKENS.text.tertiary, fontSize: 12 },
  axisLine: false,
  tickLine: false,
} as const
