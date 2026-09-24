import { createContext, useContext } from 'react'

/**
 * Căile de ajutor din onboarding: chat, email, vizită la birou. Dialogurile trăiesc în shell (ca să nu se remonteze la
 * schimbarea pasului), iar de aici le pot deschide și rail-ul, și ecranul de blocaj — altfel
 * fiecare și-ar monta propria copie.
 */
export interface OnboardingSupportValue {
  openChat: () => void
  openEmail: () => void
  openBooking: () => void
}

export const OnboardingSupportContext = createContext<OnboardingSupportValue | null>(null)

export function useOnboardingSupport(): OnboardingSupportValue {
  const context = useContext(OnboardingSupportContext)
  if (!context) {
    throw new Error('useOnboardingSupport trebuie folosit în interiorul shell-ului de onboarding.')
  }
  return context
}
