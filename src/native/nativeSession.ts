import { Preferences } from '@capacitor/preferences'

import { IS_NATIVE_APP } from './platform'

/**
 * Sesiunea aplicației mobile.
 *
 * Pe site, refresh token-ul stă într-un cookie `HttpOnly`. În aplicație pagina rulează din
 * `https://localhost` / `capacitor://localhost`, deci cookie-ul `SameSite=Lax` al API-ului nu pleacă
 * și omul ar fi delogat la fiecare deschidere. Aplicația păstrează tokenul în stocarea ei și îl
 * trimite prin antet; serverul îl acceptă doar împreună cu antetul de client nativ.
 */

const REFRESH_TOKEN_KEY = 'ridelance.refreshToken'

/** Antetul care îi spune serverului că cererea vine din aplicație. */
export const NATIVE_CLIENT_HEADERS: Record<string, string> = IS_NATIVE_APP ? { 'X-Ridelance-Client': 'native' } : {}

export async function readRefreshToken(): Promise<string | null> {
  if (!IS_NATIVE_APP) return null
  const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY })
  return value
}

export async function storeRefreshToken(token: string | null | undefined): Promise<void> {
  if (!IS_NATIVE_APP || !token) return
  await Preferences.set({ key: REFRESH_TOKEN_KEY, value: token })
}

export async function clearRefreshToken(): Promise<void> {
  if (!IS_NATIVE_APP) return
  await Preferences.remove({ key: REFRESH_TOKEN_KEY })
}
