import { alpha } from '@mui/material/styles'

import { DASHBOARD_TOKENS } from '../dashboardTheme'

/**
 * Tokenii paginii „Acasă" (spec §1), exprimați ca obiect TS pentru că aplicația
 * stilizează prin `sx`, nu prin Tailwind. Accentul brand rămâne cel al aplicației;
 * verdele/ambra/roșul apar exclusiv cu sens semantic — profit / rezervă / cost.
 */
export const HOME_TOKENS = {
  bg: {
    app: '#F5F6F8',
    surface: '#FFFFFF',
    surface2: '#FAFBFC',
  },
  text: {
    primary: '#101828',
    secondary: '#667085',
    tertiary: '#98A2B3',
  },
  border: {
    subtle: '#EAECF0',
    strong: '#D0D5DD',
  },
  brand: {
    600: DASHBOARD_TOKENS.accent,
    500: DASHBOARD_TOKENS.accentSoft,
    50: alpha(DASHBOARD_TOKENS.accent, 0.08),
  },
  pos: { 600: '#067647', 50: '#ECFDF3' },
  warn: { 600: '#B54708', 50: '#FFFAEB' },
  neg: { 600: '#B42318', 50: '#FEF3F2' },
  platform: {
    bolt: '#34D186',
    uber: '#111827',
  },
  radius: {
    card: '16px',
    tile: '14px',
    input: '10px',
    pill: '999px',
  },
  shadow: {
    card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
    hover: '0 4px 8px rgba(16,24,40,.06), 0 12px 24px rgba(16,24,40,.08)',
  },
} as const

export type HomeTone = 'brand' | 'positive' | 'warning' | 'negative' | 'neutral'

/** Perechea fundal/prim-plan a unui ton semantic — folosită de icon-box și badge-uri. */
export function toneColors(tone: HomeTone): { fg: string; bg: string } {
  switch (tone) {
    case 'positive':
      return { fg: HOME_TOKENS.pos[600], bg: HOME_TOKENS.pos[50] }
    case 'warning':
      return { fg: HOME_TOKENS.warn[600], bg: HOME_TOKENS.warn[50] }
    case 'negative':
      return { fg: HOME_TOKENS.neg[600], bg: HOME_TOKENS.neg[50] }
    case 'neutral':
      return { fg: HOME_TOKENS.text.secondary, bg: HOME_TOKENS.bg.surface2 }
    default:
      return { fg: HOME_TOKENS.brand[600], bg: HOME_TOKENS.brand[50] }
  }
}

/** Cifrele monetare nu au voie să „danseze" între rânduri. */
export const tabularNums = { fontVariantNumeric: 'tabular-nums' } as const

/**
 * Motion-ul din §7 e discret și dispare complet la `prefers-reduced-motion`.
 * Media query-ul e evaluat în CSS, nu în JS, ca să nu depindă de un re-render.
 */
export const reducedMotionSafe = (styles: Record<string, unknown>) => ({
  ...styles,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'none',
  },
})
