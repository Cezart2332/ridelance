import { useEffect } from 'react'

import { MICRO_RESOURCES } from './config/resources'
import { useOnboarding } from './useOnboarding'

/**
 * Înregistrează sub-stările pasului mare curent (`step2`, `arr`, `platforms`, `vehicle`).
 *
 * Panourile vechi le încărcau singure, prin `useOnboardingResource`. Acum ecranele sunt config, iar
 * un fișier de date nu poate chema hook-uri — deci încărcarea se declară o dată, pe pas, aici.
 * Fără asta, un predicat ca „dosarul e deja generat?" n-ar avea de unde ști.
 */
export function useMicroResources(macroKey: string | null) {
  const { registerResource } = useOnboarding()

  useEffect(() => {
    if (!macroKey) return

    const entries = MICRO_RESOURCES[macroKey] ?? []
    const unregister = entries.map((entry) => registerResource(entry.key, entry.fetch))

    return () => unregister.forEach((off) => off())
  }, [macroKey, registerResource])
}
