import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { documentService, isAiPending, type DocumentSummary } from '../../services/document.service'
import {
  onboardingService,
  type EligibilityProfile,
  type OnboardingState,
} from '../../services/onboarding.service'
import {
  OnboardingContext,
  type OnboardingContextValue,
  type RejectionAlert,
} from './onboardingContext'
import { buildStepViews, type StepView } from './stepModel'

/**
 * Sursa unică de date a onboardingului. Trăiește în shell, deci supraviețuiește schimbării de pas:
 * un singur fetch, un singur poll, indiferent câte panouri se montează și se demontează.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState | null>(null)
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [eligibility, setEligibility] = useState<EligibilityProfile | null>(null)
  const [resources, setResources] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectionAlert, setRejectionAlert] = useState<RejectionAlert | null>(null)

  /** Fetcherele declarate de panouri (starea ARR, vehicul, platforme, pasul 2). */
  const fetchers = useRef(new Map<string, () => Promise<unknown>>())
  /** Statusurile de la ciclul precedent, ca să prindem tranziția validat → respins. */
  const previousStates = useRef<Map<string, StepView['state']> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const runResource = useCallback(async (key: string, fetcher: () => Promise<unknown>) => {
    try {
      const data = await fetcher()
      setResources((current) => ({ ...current, [key]: data }))
    } catch {
      // Sub-stările sunt opționale pentru rail — un panou care nu poate încărca își arată
      // singur eroarea, nu blocăm tot onboardingul pentru ea.
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [nextState, nextDocuments, nextEligibility] = await Promise.all([
        onboardingService.getState(),
        documentService.getByUser(),
        onboardingService.getEligibility().catch(() => null),
      ])
      setState(nextState)
      setDocuments(nextDocuments)
      setEligibility(nextEligibility)
      setError(null)

      const nextSteps = buildStepViews(nextState, nextDocuments, nextEligibility)
      const previous = previousStates.current
      if (previous) {
        const turned = nextSteps.filter(
          (step) => step.state === 'rejected' && previous.get(step.key) === 'approved',
        )
        if (turned.length > 0) {
          setRejectionAlert({
            keys: turned.map((s) => s.key),
            labels: turned.map((s) => s.label),
            nonce: Date.now(),
          })
        }
      }
      previousStates.current = new Map(nextSteps.map((step) => [step.key, step.state]))
    } catch {
      setError('Nu am putut încărca starea contului. Reîncearcă.')
    } finally {
      setLoading(false)
    }

    await Promise.all([...fetchers.current].map(([key, fetcher]) => runResource(key, fetcher)))
  }, [runResource])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const registerResource = useCallback(
    (key: string, fetcher: () => Promise<unknown>) => {
      fetchers.current.set(key, fetcher)
      void runResource(key, fetcher)
      return () => {
        fetchers.current.delete(key)
      }
    },
    [runResource],
  )

  const steps = useMemo(() => buildStepViews(state, documents, eligibility), [state, documents, eligibility])

  // Poll cât timp ceva e la validare (admin) sau în prevalidarea automată (AI), ca rezultatul
  // să apară fără refresh manual.
  const awaiting = steps.some((s) => s.state === 'pending_review') || documents.some(isAiPending)

  useEffect(() => {
    if (!awaiting) return
    pollRef.current = setInterval(() => void refresh(), 10_000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [awaiting, refresh])

  const dismissRejectionAlert = useCallback(() => setRejectionAlert(null), [])

  const value = useMemo<OnboardingContextValue>(
    () => ({
      state,
      documents,
      eligibility,
      steps,
      loading,
      error,
      refresh,
      rejectionAlert,
      dismissRejectionAlert,
      registerResource,
      resources,
    }),
    [
      state,
      documents,
      eligibility,
      steps,
      loading,
      error,
      refresh,
      rejectionAlert,
      dismissRejectionAlert,
      registerResource,
      resources,
    ],
  )

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}
