import { ACTIVE_SKIN } from '../components/dashboard/dashboardSkin'

/**
 * Fundalul platformei: alb cu o tentă din albastrul logoului, nu gri neutru.
 *
 * Valorile sunt `primary` amestecat în alb — 5,5% pentru fundalul de pagină, 8,5% pentru banda
 * alternativă. Scrise ca hex, nu calculate: fundalul e prima culoare pe care o vede orice ecran,
 * iar o funcție de amestec ar face-o să depindă de ordinea de evaluare a modulelor.
 *
 * `paper` rămâne alb curat. Tenta există ca să se vadă ceva sub carduri: dacă și cardurile ar fi
 * colorate, n-ar mai avea față de ce să se desprindă și pagina ar arăta doar spălăcită.
 */
const SITE_TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#F6FCFE',
  surfaceAlt: '#F1FBFE',
  border: 'rgba(0, 0, 0, 0.06)',
  borderHover: 'rgba(0, 0, 0, 0.12)',
  textMain: '#1a1a2e',
  textMuted: 'rgba(26, 26, 46, 0.6)',
  textSubtle: 'rgba(26, 26, 46, 0.4)',
  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    lg: '0 4px 16px rgba(0,0,0,0.08)',
    xl: '0 8px 30px rgba(0,0,0,0.10)',
    glow: '0 2px 8px rgba(92,203,245,0.12)',
  },
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  duration: '200ms',
}

/**
 * Componentele site-ului public refolosite în dashboardul de client (mașinile din „Servicii”,
 * întrebările frecvente din „Suport”, asigurările) citesc tokenii ăștia. În pielea de panou
 * (`dashboardSkin`) primesc culorile panoului, ca să nu rămână carduri albe pe fundal negru.
 * Pe site pielea e mereu cea implicită, deci valorile de mai sus rămân neatinse.
 */
const PANEL_LIGHT: typeof SITE_TOKENS = {
  ...SITE_TOKENS,
  paper: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  shadow: { ...SITE_TOKENS.shadow, md: '0 1px 2px rgba(15,23,42,0.05)', lg: '0 1px 3px rgba(15,23,42,0.08)', xl: '0 4px 12px rgba(15,23,42,0.08)' },
}

const PANEL_DARK: typeof SITE_TOKENS = {
  ...PANEL_LIGHT,
  ink: '#FAFAFA',
  primaryStrong: '#8ADAF8',
  paper: '#131316',
  surface: '#09090B',
  surfaceAlt: '#1C1C1F',
  border: '#27272A',
  borderHover: '#3F3F46',
  textMain: '#FAFAFA',
  textMuted: '#A1A1AA',
  textSubtle: '#71717A',
  shadow: { sm: 'none', md: 'none', lg: 'none', xl: '0 12px 32px rgba(0,0,0,0.6)', glow: '0 0 0 3px rgba(92,203,245,0.28)' },
}

export const TOKENS: typeof SITE_TOKENS =
  ACTIVE_SKIN === 'panel-dark' ? PANEL_DARK : ACTIVE_SKIN === 'panel-light' ? PANEL_LIGHT : SITE_TOKENS
