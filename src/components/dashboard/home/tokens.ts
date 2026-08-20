import { alpha } from '@mui/material/styles'

import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { NUMERIC_TEXT } from '../ui/numeric'

/**
 * Tokenii paginii „Acasă", exprimați ca obiect TS pentru că aplicația stilizează prin `sx`,
 * nu prin Tailwind. Accentul brand rămâne cel al aplicației; verdele/ambra/roșul apar
 * exclusiv cu sens semantic — profit / rezervă / cost.
 *
 * Regula cromatică (spec §5.1), fără excepții:
 *   1. accentul  = metrica principală, brand, elemente interactive
 *   2. verde/roșu = doar semantic (creștere/scădere, încasare/cheltuială)
 *   3. ambru      = doar fiscalitate și avertismente
 */
export const HOME_TOKENS = {
  bg: {
    // Fundalul REAL al zonei de conținut, setat de AppLayout pe containerul rădăcină.
    // Bara sticky trebuie să-l folosească opac, altfel conținutul se vede prin ea.
    app: DASHBOARD_TOKENS.surface,
    surface: '#FFFFFF',
    surface2: '#FAFBFC',
  },
  text: {
    primary: NUMERIC_TEXT.primary,
    secondary: NUMERIC_TEXT.secondary,
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
  /**
   * Rampa ambru e singura familie cu patru trepte: cele patru componente ale rezervei
   * de taxe sunt toate obligații fiscale, deci se disting prin luminozitate, nu prin hue.
   */
  warn: { 600: '#B54708', 500: '#D08128', 400: '#E5AC63', 200: '#F3D6A8', 50: '#FFFAEB' },
  neg: { 600: '#B42318', 50: '#FEF3F2' },
  platform: {
    bolt: '#34D186',
    uber: '#111827',
  },
  radius: {
    card: '14px',
    tile: '14px',
    input: '10px',
    pill: '999px',
  },
  /**
   * Umbra e dublă și foarte subtilă: un strat de 1px care definește muchia și unul difuz
   * care ridică suprafața. O singură umbră mare arată bălos, niciuna arată plat.
   */
  shadow: {
    card: '0 1px 2px rgba(15,23,42,.04), 0 2px 6px rgba(15,23,42,.04)',
    hover: '0 1px 2px rgba(15,23,42,.05), 0 8px 20px rgba(15,23,42,.07)',
    /** Muchia de jos a barei sticky, o dată ce s-a condensat. */
    bar: '0 1px 3px rgba(16,24,40,.06)',
    /** Segmentul selectat dintr-un segmented control — „pastilă ridicată". */
    raised: '0 1px 2px rgba(16,24,40,.06)',
  },
} as const

/**
 * Pragul de la care blocul de cifre stă *lângă* graficul mare, nu deasupra lui.
 *
 * Nu e un breakpoint MUI fiindcă niciunul nu cade unde trebuie: sidebar-ul mănâncă 280px, deci
 * la `lg` (1200) coloana de span 7 ar avea ~500px, adică trei tile-uri de ~155px — prea înguste
 * pentru „2.140,0 km" la 30px. De la 1400 în sus sunt ~200px fiecare și încape.
 *
 * Îl folosesc și grila, și tile-ul: doar sub layout-ul ăsta eticheta unui KPI are nevoie de
 * două rânduri.
 */
export const SPLIT_ROW = '@media (min-width:1400px)'

export type HomeTone = 'brand' | 'positive' | 'warning' | 'negative' | 'neutral'

/** Perechea fundal/prim-plan a unui ton semantic — folosită de badge-uri și stări. */
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

/** Reexportat din `ui/numeric` — pagina Acasă îl importa de aici înainte să fie comun. */
export { tabularNums } from '../ui/numeric'

/**
 * Motion-ul e discret și dispare complet la `prefers-reduced-motion`.
 * Media query-ul e evaluat în CSS, nu în JS, ca să nu depindă de un re-render.
 */
export const reducedMotionSafe = (styles: Record<string, unknown>) => ({
  ...styles,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'none',
  },
})
