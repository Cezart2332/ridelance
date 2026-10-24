import { useEffect, useState } from 'react'

import { userService } from '../../services/user.service'

/** Ce confirmare mai lipsește contului autentificat. Regula e a serverului (`AccountVerificationGate`). */
export interface PendingVerification {
  email: boolean
  phone: boolean
}

const NONE: PendingVerification = { email: false, phone: false }

let cached: Promise<PendingVerification> | null = null
let known: PendingVerification | null = null
/** Contul pentru care e ținută starea: alt cont în același tab o recitește. */
let cachedFor: string | null = null

/**
 * Starea confirmării, cerută o dată pe sesiune. Profilul spune ce lipsește; dacă nu răspunde, nu
 * blocăm aici — serverul refuză oricum cererile unui cont neconfirmat.
 */
export function loadPendingVerification(userId: string | null = cachedFor): Promise<PendingVerification> {
  if (userId !== cachedFor) resetPendingVerification()
  cachedFor = userId
  cached ??= userService
    .getProfile()
    .then((profile) => {
      known = {
        email: profile.pendingEmailVerification === true,
        phone: profile.pendingPhoneVerification === true,
      }
      return known
    })
    .catch(() => {
      cached = null
      return NONE
    })
  return cached
}

/** După o confirmare (sau la schimbarea contului), starea se recitește de la server. */
export function resetPendingVerification() {
  cached = null
  known = null
}

/** `null` cât se încarcă prima dată; după aceea, valoarea știută, fără să mai clipească ecranul. */
export function usePendingVerification(userId: string | null): PendingVerification | null {
  const enabled = userId !== null
  const [state, setState] = useState<PendingVerification | null>(userId === cachedFor ? known : null)

  useEffect(() => {
    if (!userId) return
    let active = true
    void loadPendingVerification(userId).then((loaded) => {
      if (active) setState(loaded)
    })
    return () => {
      active = false
    }
  }, [userId])

  return enabled ? state : NONE
}
