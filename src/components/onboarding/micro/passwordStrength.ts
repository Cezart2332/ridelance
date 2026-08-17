import { TOKENS } from '../onboardingTheme'

/**
 * Puterea unei parole, ca indicator vizual. Nu e o regulă de validare — aceea trăiește în
 * `field.validate` din config și e cea care blochează „Continuă". Aici doar spunem cât de ușor
 * de ghicit e ce s-a tastat.
 *
 * Stă într-un fișier fără componente ca să nu rupă fast refresh.
 */
export function passwordStrength(value: string): { score: number; label: string; color: string } {
  let points = 0
  if (value.length >= 8) points++
  if (value.length >= 12) points++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) points++
  if (/\d/.test(value)) points++
  if (/[^\w\s]/.test(value)) points++

  if (points <= 2) return { score: 33, label: 'Parolă slabă', color: TOKENS.dangerBase }
  if (points === 3) return { score: 66, label: 'Parolă acceptabilă', color: TOKENS.pendingBase }
  return { score: 100, label: 'Parolă puternică', color: TOKENS.success }
}
