import { useSyncExternalStore } from 'react'

/**
 * Starea cortinei din aplicația mobilă.
 *
 * - `boot`: pornirea — ecran închis la culoare, logoul mare, cât se decide unde ajunge omul.
 * - `toHeader`: cortina se strânge în antetul curbat al ecranului de login.
 * - `covering`: după login, cortina coboară din antet până acoperă tot ecranul.
 * - `covered`: ecranul e acoperit; se așteaptă dashboardul.
 * - `exit`: cortina urcă de pe ecran și lasă dashboardul la vedere.
 * - `hidden`: nu există.
 *
 * Stă în afara React-ului: login-ul o pornește, iar cortina, montată o singură dată în
 * `NativeApp`, o desenează.
 */
export type CurtainPhase = 'boot' | 'toHeader' | 'covering' | 'covered' | 'exit' | 'hidden'

let phase: CurtainPhase = 'boot'
const listeners = new Set<() => void>()
let coverResolve: (() => void) | null = null

function set(next: CurtainPhase) {
  if (phase === next) return
  phase = next
  listeners.forEach((listener) => listener())
}

export const curtain = {
  get phase() {
    return phase
  },
  set,
  /** Acoperă ecranul pornind din antetul de login. Se rezolvă când ecranul e acoperit. */
  cover(): Promise<void> {
    return new Promise((resolve) => {
      coverResolve = resolve
      set('covering')
    })
  },
  /** Cheamă cortina când a terminat de acoperit. */
  covered() {
    set('covered')
    coverResolve?.()
    coverResolve = null
  },
}

export function useCurtainPhase(): CurtainPhase {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => phase,
  )
}
