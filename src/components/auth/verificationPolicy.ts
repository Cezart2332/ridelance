import { API_BASE_URL } from '../../lib/runtimeConfig'
import { useEffect, useState } from 'react'
import axios from 'axios'

const BASE_URL = API_BASE_URL

/** Ce coduri sunt obligatorii la înregistrare pe mediul acesta. */
export interface VerificationPolicy {
  emailRequired: boolean
  phoneRequired: boolean
}

const NOT_REQUIRED: VerificationPolicy = { emailRequired: false, phoneRequired: false }

let cached: Promise<VerificationPolicy> | null = null

/**
 * Regula vine de la server (`GET /users/verification-policy`), nu din build: aceeași interfață
 * rulează pe producție, unde codurile sunt obligatorii, și pe site-ul de test, unde nu sunt.
 *
 * Dacă serverul nu răspunde, codurile rămân opționale: o regulă care nu se poate citi nu trebuie
 * să oprească înregistrarea.
 */
function loadPolicy(): Promise<VerificationPolicy> {
  cached ??= axios
    .get<VerificationPolicy>(`${BASE_URL}/users/verification-policy`)
    .then((response) => ({
      emailRequired: response.data.emailRequired === true,
      phoneRequired: response.data.phoneRequired === true,
    }))
    .catch(() => {
      cached = null
      return NOT_REQUIRED
    })
  return cached
}

/** `null` cât se încarcă: până atunci pagina nu arată linkul de sărit peste pas. */
export function useVerificationPolicy(): VerificationPolicy | null {
  const [policy, setPolicy] = useState<VerificationPolicy | null>(null)

  useEffect(() => {
    let active = true
    void loadPolicy().then((loaded) => {
      if (active) setPolicy(loaded)
    })
    return () => {
      active = false
    }
  }, [])

  return policy
}
