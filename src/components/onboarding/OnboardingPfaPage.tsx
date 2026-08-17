import { Alert, Stack } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { stripeService } from '../../services/stripe.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { CompanyFormationSummary } from './companyFormation/CompanyFormationSummary'
import { OnboardingRunner } from './micro/OnboardingRunner'
import { TOKENS } from './onboardingTheme'
import { PfaPendingCard } from './pfa/PfaPendingCard'
import { PfaRejectedCard } from './pfa/PfaRejectedCard'
import { useOnboarding } from './useOnboarding'

/**
 * Pasul PFA — dispecer.
 *
 * Partea de completare e acum un flux de întrebări (`config/pfa.ts`), rulat de `OnboardingRunner`
 * ca la eligibilitate. Aici rămân doar cele trei ecrane care NU sunt întrebări: plata, așteptarea
 * validării și respingerea. Nu se parcurg — apar în funcție de starea dosarului, deci n-au ce
 * căuta într-o listă de micro-pași.
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

function redirectToInfiintarePayment(priceLabel: string): Promise<void> {
  const origin = window.location.origin
  return stripeService.redirectToInfiintarePfa(
    `${origin}/onboarding?pfa_setup_paid=1&session_id={{CHECKOUT_SESSION_ID}}`,
    `${origin}/onboarding/pfa`,
    priceLabel,
  )
}

export default function OnboardingPfaPage() {
  const navigate = useNavigate()
  const { state, documents, refresh } = useOnboarding()

  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
  // continuă acolo de îndată ce dosarul e deschis. RL-03: completarea vine ÎNAINTEA plății.
  useEffect(() => {
    if (state?.registrationType !== 'NuAmPfa' || state.pfaRegistrationId == null) return
    if (formationStatus !== null && formationStatus !== 'Draft' && formationStatus !== 'InfoRequested') return

    navigate(companyFormationPath(formationStage), { replace: true })
  }, [state?.registrationType, state?.pfaRegistrationId, formationStatus, formationStage, navigate])

  // ── Dosarul e completat și semnat, urmează plata (RL-03) ──
  if (state?.canPay) {
    const startPayment = async () => {
      setError(null)
      setPaying(true)
      try {
        // Eticheta de preț se formatează din starea serverului, nu se scrie în cod.
        await redirectToInfiintarePayment(
          `${(state.onboardingAdvanceBani / 100).toLocaleString('ro-RO')} lei`,
        )
      } catch (err) {
        // 422 = dosarul nu poate fi depus încă. Mesajul serverului spune exact ce lipsește.
        setError(getErrorMessage(err, 'Nu am putut deschide plata. Încearcă din nou.'))
        setPaying(false)
      }
    }

    return (
      <Stack spacing={2}>
        {error && (
          <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            {error}
          </Alert>
        )}
        <CompanyFormationSummary state={state} onPay={startPayment} paying={paying} />
      </Stack>
    )
  }

  if (state?.pfaStatus === 'Pending') {
    return (
      <PfaPendingCard
        documents={documents}
        pfaRegistrationId={state.pfaRegistrationId}
        onRefresh={refresh}
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
