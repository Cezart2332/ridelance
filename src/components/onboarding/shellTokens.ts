import { HOME_TOKENS, tabularNums } from '../dashboard/home/tokens'

/**
 * Tokenii shell-ului de onboarding (topbar + rail stânga + rail dreapta).
 *
 * Sunt derivați din `HOME_TOKENS` — sistemul vizual al dashboard-ului „Acasă", care e partea de
 * produs care arată cum trebuie. Rail-urile ieșiseră din el: alt accent (`#5CCBF5` vs `#0E7FA8`),
 * altă scală de radius (4/6/8/12/16 vs 14/10), alte umbre, alt verde și alt roșu. Puse una lângă
 * alta, cele două ecrane păreau două aplicații.
 *
 * IMPORTANT: se folosesc DOAR în componentele de shell. `onboardingTheme.TOKENS` rămâne neatins,
 * ca redesign-ul să nu se scurgă în coloana centrală — condiție de acceptare, nu preferință.
 */
export const SHELL = {
  bg: HOME_TOKENS.bg,
  text: HOME_TOKENS.text,
  border: HOME_TOKENS.border,

  /** Un singur accent, cel din sistemul dashboard-ului. */
  brand: HOME_TOKENS.brand[600],
  brandSoft: HOME_TOKENS.brand[50],

  pos: HOME_TOKENS.pos[600],
  posSoft: HOME_TOKENS.pos[50],
  warn: HOME_TOKENS.warn[600],
  warnSoft: HOME_TOKENS.warn[50],
  neg: HOME_TOKENS.neg[600],
  negSoft: HOME_TOKENS.neg[50],

  radius: HOME_TOKENS.radius,

  /** Exact două niveluri de umbră, ca în spec: suprafețe și elemente ridicate. */
  shadow: { card: HOME_TOKENS.shadow.card, raised: HOME_TOKENS.shadow.hover },

  /** Toate cifrele din rail-uri trec pe aici. */
  tabular: tabularNums,
} as const

/** Lățimile fixe din grid-ul cu 3 coloane. */
export const SHELL_LAYOUT = {
  leftRail: 280,
  rightRail: 320,
  rightRailNarrow: 280,
  contentMaxWidth: 760,
  topbarHeight: 56,
} as const
