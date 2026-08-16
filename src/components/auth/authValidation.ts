import { getErrorMessage } from '../../utils/errorHandler'

/** Aliniat cu `RegisterUserCommandValidator` din backend. */
export const MIN_PASSWORD_LENGTH = 8

// Suficient cât să prindă greșelile de tipar. Validarea reală a adresei o face backendul, la
// fel ca trimiterea efectivă a emailului — un regex mai strict ar respinge adrese valide.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Introdu adresa de email.'
  if (!EMAIL_PATTERN.test(trimmed)) return 'Adresă de email invalidă.'
  return null
}

export function validateLoginPassword(value: string): string | null {
  if (!value) return 'Introdu parola.'
  return null
}

export function validateNewPassword(value: string): string | null {
  if (!value) return 'Introdu parola.'
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Parola trebuie să aibă minim ${MIN_PASSWORD_LENGTH} caractere.`
  }
  return null
}

export function validateTerms(accepted: boolean): string | null {
  if (!accepted) return 'Trebuie să accepți termenii pentru a continua.'
  return null
}

export type StrengthTone = 'weak' | 'medium' | 'strong'

export interface PasswordStrength {
  /** 0–4, folosit direct ca procent (`score * 25`) în bara de progres. */
  score: 0 | 1 | 2 | 3 | 4
  label: string
  tone: StrengthTone
}

export function passwordStrength(value: string): PasswordStrength {
  if (!value) return { score: 0, label: '', tone: 'weak' }

  let points = 0
  if (value.length >= MIN_PASSWORD_LENGTH) points += 1
  if (value.length >= 12) points += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) points += 1
  if (/\d/.test(value) || /[^\w\s]/.test(value)) points += 1

  if (value.length < MIN_PASSWORD_LENGTH) return { score: 1, label: 'Prea scurtă', tone: 'weak' }
  if (points <= 2) return { score: 2, label: 'Acceptabilă', tone: 'medium' }
  if (points === 3) return { score: 3, label: 'Bună', tone: 'medium' }
  return { score: 4, label: 'Puternică', tone: 'strong' }
}

export interface AuthErrorInfo {
  message: string
  /** La 409 pe înregistrare are sens să oferim scurtătura către login. */
  showLoginLink?: boolean
}

/**
 * Mesajele merg pe codul de status, nu pe `detail`-ul backendului: acela e în engleză și, la
 * login, ar spune dacă adresa există sau nu (enumeration attack). Un singur mesaj pentru
 * credențiale greșite, indiferent care câmp e greșit.
 *
 * Atenție la 400: `UserErrors.InvalidCredentials` e un `Error.Failure`, iar `CustomResults` îl
 * mapează pe 400, nu pe 401. Le tratăm pe amândouă.
 */
export function mapAuthError(err: unknown, mode: 'login' | 'register'): AuthErrorInfo {
  const status = (err as { response?: { status?: number } })?.response?.status

  if (mode === 'register' && status === 409) {
    return { message: 'Există deja un cont cu acest email.', showLoginLink: true }
  }
  if (mode === 'login' && (status === 400 || status === 401)) {
    return { message: 'Email sau parolă incorectă.' }
  }
  if (status === 429) {
    return { message: 'Prea multe încercări. Reîncearcă în câteva minute.' }
  }
  if (status && status >= 500) {
    return { message: 'Ceva n-a mers bine. Încearcă din nou.' }
  }

  // Erori de rețea/timeout — `getErrorMessage` are deja mesaje în română pentru ele; la
  // validările de 400 de la register lăsăm textul backendului, e specific și util.
  return { message: getErrorMessage(err, 'Ceva n-a mers bine. Încearcă din nou.') }
}
