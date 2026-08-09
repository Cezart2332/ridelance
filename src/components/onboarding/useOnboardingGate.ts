import { useOnboarding } from './useOnboarding'

/**
 * Ce se deblochează după înrolare. Un singur loc care răspunde la întrebarea asta — abonamentele
 * și asigurările din rail o pun amândouă, iar dacă fiecare ar citi altceva din state ar apărea
 * exact bug-ul pe care lacătul trebuie să-l prevină.
 *
 * `allSectionsValidated` e semnalul serverului că toți cei 6 pași sunt `Completed`
 * (`OnboardingStepCatalog.AllCompleted`).
 */
export function useOnboardingGate(): { unlocked: boolean } {
  const { state } = useOnboarding()
  return { unlocked: state?.allSectionsValidated === true }
}
