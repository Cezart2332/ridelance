/**
 * Contul în care a intrat un admin, ținut minte cât trăiește fila.
 *
 * Tokenul primit la intrarea în contul unui client e scurt, iar cel de reîmprospătare rămâne al
 * adminului. Fără semnul acesta, prima reîmprospătare (tokenul expirat, pagina reîncărcată) aducea
 * înapoi sesiunea de admin în mijlocul contului clientului, iar adminul vedea „Nu ai acces aici”.
 * Cu el, reîmprospătarea cere din nou intrarea în același cont (`refreshSession.ts`).
 *
 * `sessionStorage`, nu `localStorage`: e al filei în care s-a intrat în cont; celelalte file ale
 * adminului rămân ale lui. Aici stă doar cine e clientul — dreptul de a intra în contul lui îl
 * verifică serverul la fiecare cerere, după sesiunea de admin.
 */
const KEY = 'rl-impersonation'

export interface ImpersonationTarget {
  userId: string
  name: string
}

export function readImpersonationTarget(): ImpersonationTarget | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ImpersonationTarget>
    return typeof parsed.userId === 'string' && typeof parsed.name === 'string'
      ? { userId: parsed.userId, name: parsed.name }
      : null
  } catch {
    return null
  }
}

export function storeImpersonationTarget(target: ImpersonationTarget): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(target))
  } catch {
    // Fără stocare, intrarea în cont merge oricum până la prima reîmprospătare.
  }
}

export function clearImpersonationTarget(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Nimic de șters.
  }
}
