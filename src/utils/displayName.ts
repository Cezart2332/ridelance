/**
 * Numele de afișat al unui cont, cu un singur fallback pentru toată aplicația.
 *
 * De la RL-05 contul se creează doar cu email și parolă — numele vine mai târziu, din buletin.
 * Orice loc care concatena `firstName + ' ' + lastName` ar afișa acum un spațiu gol, iar
 * `firstName[0]` ar da `undefined` la inițiale. Regula stă aici, o singură dată.
 *
 * Perechea de pe server e `Domain.Users.UserDisplayName` — ține-le identice.
 */

const FALLBACK = 'Contul meu'

interface NamedAccount {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

const localPartOf = (email?: string | null): string => {
  if (!email) return ''
  const at = email.indexOf('@')
  return at > 0 ? email.slice(0, at) : email
}

/** Numele complet, dacă există. Altfel partea locală a emailului, altfel „Contul meu”. */
export function displayName(account: NamedAccount | null | undefined): string {
  if (!account) return FALLBACK

  const full = `${account.firstName ?? ''} ${account.lastName ?? ''}`.trim()
  if (full) return full

  return localPartOf(account.email).trim() || FALLBACK
}

/** Inițialele pentru avatar. Cad pe prima literă a numelui afișat, nu pe `undefined`. */
export function initials(account: NamedAccount | null | undefined): string {
  const first = account?.firstName?.trim()
  const last = account?.lastName?.trim()

  if (first || last) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
  }

  return displayName(account).charAt(0).toUpperCase() || 'U'
}

/** Numele lipsește complet — actele oficiale au nevoie de el, restul aplicației nu. */
export const hasNoName = (account: NamedAccount | null | undefined): boolean =>
  !`${account?.firstName ?? ''} ${account?.lastName ?? ''}`.trim()
