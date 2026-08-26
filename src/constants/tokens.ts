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
export const TOKENS = {
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
