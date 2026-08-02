import { useContext, useEffect, useRef } from 'react'

import { OnboardingContext, type OnboardingContextValue } from './onboardingContext'

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding trebuie folosit în interiorul <OnboardingProvider>.')
  }
  return context
}

/**
 * Sub-starea unui pas (ARR, vehicul, platforme, pasul 2). Se încarcă la prima montare a panoului
 * și se reîmprospătează odată cu `refresh()`-ul global, deci panourile nu mai au poll propriu.
 */
export function useOnboardingResource<T>(key: string, fetcher: () => Promise<T>) {
  const { registerResource, resources, refresh } = useOnboarding()

  // Fetcher-ul e de obicei o funcție inline, recreată la fiecare render. Îl ținem într-un ref
  // ca înregistrarea să nu se refacă la fiecare render, dar apelul să folosească mereu ultima
  // versiune. Efectul de ref e declarat primul, deci rulează înaintea înregistrării.
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => registerResource(key, () => fetcherRef.current()), [key, registerResource])

  return {
    data: (resources[key] as T | undefined) ?? null,
    loaded: key in resources,
    reload: refresh,
  }
}
