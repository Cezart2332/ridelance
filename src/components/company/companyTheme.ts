import type { CompanyPageContent, CompanyPageTheme } from '../../services/company.service'

/**
 * Culorile mini-site-ului unei firme.
 *
 * Firma are control complet — accent, fundal, suprafață, text, butoane, vălul de peste cover.
 * Asta e alegerea făcută deliberat: o paletă închisă ar fi fost mai sigură vizual, dar o flotă
 * care are o culoare de brand nu vrea „cea mai apropiată dintre zece".
 *
 * Plasa de siguranță e în editor, nu în restricție: contrastul se calculează în timp real și se
 * avertizează când textul devine greu de citit. Un avertisment lăsat neascultat rămâne alegerea
 * proprietarului; o culoare interzisă ar fi fost alegerea noastră.
 */

export const DEFAULT_COMPANY_THEME: CompanyPageTheme = {
  accent: '#5CCBF5',
  background: '#FFFFFF',
  surface: '#F6FCFE',
  text: '#1A1A2E',
  buttonText: '#FFFFFF',
  heroOverlay: '#0B1220',
  heroOverlayOpacity: 55,
}

export const EMPTY_PAGE_CONTENT: CompanyPageContent = {
  highlights: [],
  schedule: [],
  coverageAreas: [],
  coverageNote: null,
  faq: [],
}

/** Puncte de pornire, nu constrângeri: după ce alegi una, fiecare culoare rămâne editabilă. */
export const THEME_PRESETS: { id: string; label: string; theme: CompanyPageTheme }[] = [
  { id: 'ridelance', label: 'RIDElance', theme: DEFAULT_COMPANY_THEME },
  {
    id: 'noapte',
    label: 'Noapte',
    theme: {
      accent: '#7DD3FC',
      background: '#0F172A',
      surface: '#16233C',
      text: '#E8EEF9',
      buttonText: '#0B1220',
      heroOverlay: '#020617',
      heroOverlayOpacity: 60,
    },
  },
  {
    id: 'smarald',
    label: 'Smarald',
    theme: {
      accent: '#0F9D6E',
      background: '#FFFFFF',
      surface: '#F0FAF5',
      text: '#12241C',
      buttonText: '#FFFFFF',
      heroOverlay: '#052E22',
      heroOverlayOpacity: 55,
    },
  },
  {
    id: 'chihlimbar',
    label: 'Chihlimbar',
    theme: {
      accent: '#D97706',
      background: '#FFFDF8',
      surface: '#FDF3E3',
      text: '#2A1C08',
      buttonText: '#FFFFFF',
      heroOverlay: '#2A1C08',
      heroOverlayOpacity: 50,
    },
  },
  {
    id: 'grafit',
    label: 'Grafit',
    theme: {
      accent: '#E2483D',
      background: '#F7F7F8',
      surface: '#FFFFFF',
      text: '#1B1B1F',
      buttonText: '#FFFFFF',
      heroOverlay: '#101014',
      heroOverlayOpacity: 62,
    },
  },
  {
    id: 'indigo',
    label: 'Indigo',
    theme: {
      accent: '#5B57E8',
      background: '#FBFBFF',
      surface: '#F1F0FE',
      text: '#191735',
      buttonText: '#FFFFFF',
      heroOverlay: '#191735',
      heroOverlayOpacity: 58,
    },
  },
]

/** Completează cu implicitele orice culoare lipsă — un profil vechi n-are temă salvată. */
export function normalizeTheme(theme: Partial<CompanyPageTheme> | null | undefined): CompanyPageTheme {
  return {
    accent: hexOr(theme?.accent, DEFAULT_COMPANY_THEME.accent),
    background: hexOr(theme?.background, DEFAULT_COMPANY_THEME.background),
    surface: hexOr(theme?.surface, DEFAULT_COMPANY_THEME.surface),
    text: hexOr(theme?.text, DEFAULT_COMPANY_THEME.text),
    buttonText: hexOr(theme?.buttonText, DEFAULT_COMPANY_THEME.buttonText),
    heroOverlay: hexOr(theme?.heroOverlay, DEFAULT_COMPANY_THEME.heroOverlay),
    heroOverlayOpacity: clamp(theme?.heroOverlayOpacity ?? DEFAULT_COMPANY_THEME.heroOverlayOpacity, 0, 90),
  }
}

export function normalizeContent(content: Partial<CompanyPageContent> | null | undefined): CompanyPageContent {
  return {
    highlights: content?.highlights ?? [],
    schedule: content?.schedule ?? [],
    coverageAreas: content?.coverageAreas ?? [],
    coverageNote: content?.coverageNote ?? null,
    faq: content?.faq ?? [],
  }
}

const HEX = /^#[0-9a-fA-F]{6}$/

export function isHex(value: string | null | undefined): boolean {
  return typeof value === 'string' && HEX.test(value)
}

function hexOr(value: string | null | undefined, fallback: string): string {
  return isHex(value) ? value!.toUpperCase() : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Variabilele CSS ale mini-site-ului.
 *
 * Tema se aplică pe un singur container, prin variabile, tocmai ca să nu poată ieși din el: bara
 * de navigare și subsolul RIDElance rămân în culorile platformei chiar dacă firma își pune fundal
 * negru. Un tematizator global ar fi făcut pagina firmei să pară că a preluat tot site-ul.
 */
export function themeVars(theme: CompanyPageTheme): Record<string, string> {
  return {
    '--cs-accent': theme.accent,
    '--cs-accent-soft': withAlpha(theme.accent, 0.12),
    '--cs-accent-line': withAlpha(theme.accent, 0.28),
    '--cs-bg': theme.background,
    '--cs-surface': theme.surface,
    '--cs-text': theme.text,
    '--cs-text-muted': withAlpha(theme.text, 0.66),
    '--cs-text-subtle': withAlpha(theme.text, 0.45),
    '--cs-border': withAlpha(theme.text, 0.12),
    '--cs-button-text': theme.buttonText,
    '--cs-hero-overlay': theme.heroOverlay,
  }
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = toRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function toRgb(hex: string): { r: number; g: number; b: number } {
  const safe = isHex(hex) ? hex : DEFAULT_COMPANY_THEME.text
  return {
    r: parseInt(safe.slice(1, 3), 16),
    g: parseInt(safe.slice(3, 5), 16),
    b: parseInt(safe.slice(5, 7), 16),
  }
}

/** Luminanța relativă din WCAG 2.1. */
function luminance(hex: string): number {
  const { r, g, b } = toRgb(hex)
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Raportul de contrast dintre două culori, 1..21. */
export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground)
  const b = luminance(background)
  const [light, dark] = a > b ? [a, b] : [b, a]
  return (light + 0.05) / (dark + 0.05)
}

/** Alb sau negru — care se citește mai bine pe fundalul dat. */
export function readableOn(background: string): string {
  return contrastRatio('#FFFFFF', background) >= contrastRatio('#000000', background) ? '#FFFFFF' : '#000000'
}
