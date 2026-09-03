import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { OnboardingRunner } from './micro/OnboardingRunner'
import { PfaPendingCard } from './pfa/PfaPendingCard'
import { PfaRejectedCard } from './pfa/PfaRejectedCard'
import { useOnboarding } from './useOnboarding'

/**
 * Pasul PFA — dispecer.
 *
 * Partea de completare e un flux de întrebări (`config/pfa.ts`), rulat de `OnboardingRunner` ca
 * la eligibilitate. Aici rămân doar cele două ecrane care NU sunt întrebări: așteptarea validării
 * și respingerea. Nu se parcurg — apar în funcție de starea dosarului, deci n-au ce căuta
 * într-o listă de micro-pași.
 *
 * RL-03: avansul vine tot ÎNAINTEA dosarului, dar nu mai stă aici — e primul micro-pas al
 * pasului, ca să poată fi cerut înaintea întrebării „ai deja PFA?".
 */

/** Etapa la care a rămas dosarul de înființare, ca ramura „Nu am PFA" să continue de acolo. */
function companyFormationPath(stage: string | null): string {
  switch (stage) {
    case 'RegisteredOffice':
      return '/onboarding/pfa/sediu'
    case 'Consent':
      return '/onboarding/pfa/consimtamant'
    default:
      return '/onboarding/pfa/date-personale'
  }
}

export default function OnboardingPfaPage() {
  const navigate = useNavigate()
  const { state, steps, documents, refresh } = useOnboarding()

  const [retryAfterReject, setRetryAfterReject] = useState(false)

  const formationStatus = state?.companyFormationStatus ?? null
  const formationStage = state?.companyFormationStage ?? null

  // Secțiunea PFA e deja validată → shell-ul decide pasul următor.
  useEffect(() => {
    if (state?.pfaStatus === 'Approved') {
      navigate('/onboarding', { replace: true })
    }
  }, [state?.pfaStatus, navigate])

  // Ramura „Nu am PFA": dosarul de înființare e un flux propriu (semnătură, blocare), deci pasul
  // continuă acolo — dar abia după ce avansul e plătit. Cât timp nu e, `canPay` ține ecranul de
  // plată în față și redirectul de aici nu se face.
  useEffect(() => {
    if (state?.registrationType !== 'NuAmPfa' || state.pfaRegistrationId == null) return
    if (state.paymentStatus !== 'PAID') return
    if (formationStatus !== null && formationStatus !== 'Draft' && formationStatus !== 'InfoRequested') return

    navigate(companyFormationPath(formationStage), { replace: true })
  }, [
    state?.registrationType,
    state?.pfaRegistrationId,
    state?.paymentStatus,
    formationStatus,
    formationStage,
    navigate,
  ])

  // Avansul NU mai e aici: e primul micro-pas al pasului PFA (`config/pfa.ts`, slotul
  // `onboardingAdvance`). Cât timp înlocuia pagina, putea sta doar după întrebarea „ai deja
  // PFA?", deci plata venea după alegere — exact invers față de cum se cere.

  if (state?.pfaStatus === 'Pending') {
    // Validarea e a noastră și durează zile; șoferul nu mai stă după ea. Butonul apare doar dacă
    // pasul următor chiar e deschis — serverul deblochează pe dosarul depus, nu pe verdict.
    const pfaOrder = steps.findIndex((s) => s.key === 'pfa')
    const nextStep = steps.slice(pfaOrder + 1).find((s) => s.state !== 'locked')

    return (
      <PfaPendingCard
        documents={documents}
        pfaRegistrationId={state.pfaRegistrationId}
        onRefresh={refresh}
        onContinue={nextStep ? () => navigate(nextStep.path) : undefined}
      />
    )
  }

  if (state?.pfaStatus === 'Rejected' && !retryAfterReject) {
    return (
      <PfaRejectedCard
        reviewNote={state.pfaReviewNote}
        onRetry={() => setRetryAfterReject(true)}
      />
    )
  }

  return <OnboardingRunner />
}
