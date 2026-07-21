import { useCallback, useEffect, useRef, useState } from 'react'
import { documentService, isAiPending, type DocumentSummary } from '../../services/document.service'
import { onboardingService, type OnboardingState } from '../../services/onboarding.service'

/**
 * Starea de onboarding a userului curent + documentele lui.
 * Face poll la 10s cât timp vreo secțiune este în validare la admin
 * sau vreun document este în prevalidarea automată (AI), ca rezultatul
 * să apară fără refresh manual.
 */
export function useOnboardingState() {
  const [state, setState] = useState<OnboardingState | null>(null)
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [nextState, docs] = await Promise.all([
        onboardingService.getState(),
        documentService.getByUser(),
      ])
      setState(nextState)
      setDocuments(docs)
      setError(null)
      return nextState
    } catch {
      setError('Nu am putut încărca starea contului. Reîncearcă.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const awaiting =
    (state?.sections.some((s) => s.status === 'AwaitingValidation') ?? false) ||
    documents.some(isAiPending)

  useEffect(() => {
    if (!awaiting) return
    pollRef.current = setInterval(() => void refresh(), 10_000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [awaiting, refresh])

  return { state, documents, loading, error, refresh }
}
