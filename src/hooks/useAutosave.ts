import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Salvare automată pentru formularele de onboarding (RL-06).
 *
 * Butonul „Salvează" a dispărut, deci singura garanție că datele ajung pe server e hook-ul ăsta.
 * De asta face mai mult decât un debounce:
 *
 * - debounce la tastare + salvare imediată la `blur`, ca ieșirea din câmp să nu mai aștepte;
 * - flush forțat când tabul se ascunde sau componenta se demontează (schimbare de pas) — momentele
 *   în care userul crede că a terminat;
 * - retry cu backoff, fiindcă o pierdere de rețea nu trebuie să însemne pierdere de date;
 * - draft în `localStorage` până la confirmarea serverului, ca un refresh în mijlocul unei erori
 *   să nu șteargă ce a tastat;
 * - avertisment la închiderea tabului cât timp ceva e nesalvat.
 *
 * Nu trimite obiectul întreg al pasului: primește exact payload-ul pe care apelantul vrea să-l
 * salveze, iar endpointurile de pas sunt deja scrise să nu atingă câmpurile pe care nu le primesc.
 */
export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/** Backoff-ul din spec: prima reîncercare la 1s, apoi 3s, apoi 9s. După, așteaptă acțiunea userului. */
const RETRY_DELAYS_MS = [1_000, 3_000, 9_000]

interface UseAutosaveOptions<T> {
  /** Trimite payload-ul la server. Aruncă la eșec — hook-ul se ocupă de retry. */
  save: (payload: T) => Promise<unknown>
  /** Cheia sub care se ține draftul local până la confirmare. Omite-o ca să nu persiste nimic. */
  storageKey?: string
  debounceMs?: number
}

export interface Autosave<T> {
  status: AutosaveStatus
  /** Ora ultimei salvări confirmate, pentru „Salvat · 14:32". */
  savedAt: Date | null
  /** Există modificări netrimise sau neconfirmate. */
  dirty: boolean
  /** Programează o salvare (debounced). De apelat la fiecare modificare. */
  schedule: (payload: T) => void
  /**
   * Salvează imediat ce e în așteptare — la `blur` sau înainte de a părăsi pasul.
   *
   * Întoarce `true` când nu mai e nimic nesalvat: fie n-a fost, fie serverul a confirmat. `false`
   * înseamnă că salvarea a eșuat și retry-ul e programat — apelantul care voia să plece de pe pas
   * trebuie să se oprească, altfel ar duce userul mai departe peste date pierdute.
   */
  flush: () => Promise<boolean>
  /** Reîncearcă după ce backoff-ul s-a epuizat. Legat de „Nesalvat · Reîncearcă". */
  retry: () => Promise<void>
  /** Draftul rămas nesalvat din sesiunea anterioară, dacă `storageKey` e setat. */
  restoredDraft: T | null
}

export function useAutosave<T>({
  save,
  storageKey,
  debounceMs = 800,
}: UseAutosaveOptions<T>): Autosave<T> {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [dirty, setDirty] = useState(false)

  const pending = useRef<{ payload: T } | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attempt = useRef(0)
  const inFlight = useRef(false)

  // `save` se re-creează la fiecare render în majoritatea apelanților; ținem ultima versiune
  // într-un ref ca listenerii înregistrați o dată să nu apeleze o closure învechită.
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  }, [save])

  const [restoredDraft] = useState<T | null>(() => {
    if (!storageKey) return null
    try {
      const raw = window.localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  })

  const clearDraft = useCallback(() => {
    if (!storageKey) return
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Modul privat poate refuza scrierea — draftul e un plus, nu o dependență.
    }
  }, [storageKey])

  const writeDraft = useCallback(
    (payload: T) => {
      if (!storageKey) return
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload))
      } catch {
        // vezi clearDraft
      }
    },
    [storageKey],
  )

  // Reîncercarea programată are nevoie de `run`, care se definește mai jos. Un ref rupe ciclul.
  const runRef = useRef<() => Promise<void>>(() => Promise.resolve())

  /**
   * Trimite ce e în așteptare. O singură cerere în zbor; dacă s-a mai tastat între timp, bucla
   * mai face un tur cu valoarea nouă în loc să lase modificarea netrimisă.
   */
  const run = useCallback(async (): Promise<void> => {
    if (inFlight.current || pending.current === null) return
    inFlight.current = true

    try {
      while (pending.current !== null) {
        // Anotat explicit: comparația de mai jos cu `pending.current` ar face inferența circulară.
        const payload: T = pending.current.payload
        setStatus('saving')

        try {
          await saveRef.current(payload)
        } catch {
          setStatus('error')

          const delay = RETRY_DELAYS_MS[attempt.current]
          if (delay === undefined) {
            // Backoff epuizat: rămâne pe „Nesalvat", cu draftul păstrat și butonul de reîncercare.
            return
          }

          attempt.current += 1
          retryTimer.current = setTimeout(() => {
            retryTimer.current = null
            inFlight.current = false
            void runRef.current()
          }, delay)
          return
        }

        // Doar dacă nimeni n-a suprascris între timp — altfel mai facem un tur.
        if (pending.current?.payload === payload) {
          pending.current = null
          clearDraft()
          setDirty(false)
        }

        attempt.current = 0
        setSavedAt(new Date())
        setStatus('saved')
      }
    } finally {
      if (retryTimer.current === null) inFlight.current = false
    }
  }, [clearDraft])

  useEffect(() => {
    runRef.current = run
  }, [run])

  const schedule = useCallback(
    (payload: T) => {
      pending.current = { payload }
      writeDraft(payload)
      setDirty(true)

      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null
        void run()
      }, debounceMs)
    },
    [debounceMs, run, writeDraft],
  )

  const flush = useCallback(async (): Promise<boolean> => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
    await run()
    // `run` nu aruncă: la eșec trece pe „error" și programează retry. Coada rămasă e singurul
    // semnal sincer că ceva n-a ajuns pe server, iar el e disponibil imediat, fără re-randare.
    return pending.current === null
  }, [run])

  const retry = useCallback(async () => {
    attempt.current = 0
    if (retryTimer.current) {
      clearTimeout(retryTimer.current)
      retryTimer.current = null
    }
    inFlight.current = false
    await run()
  }, [run])

  // Tabul trece în fundal (sau se închide pe mobil, unde `beforeunload` nu se declanșează):
  // ultimul moment sigur în care mai putem salva.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [flush])

  // Închiderea tabului cu ceva nesalvat merită o confirmare — altfel datele dispar tăcut.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  // Schimbarea pasului demontează panoul: salvăm înainte să dispară.
  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      if (retryTimer.current) clearTimeout(retryTimer.current)
      if (pending.current !== null && !inFlight.current) {
        void saveRef.current(pending.current.payload)
      }
    },
    [],
  )

  return { status, savedAt, dirty, schedule, flush, retry, restoredDraft }
}

/** Textul din indicator — o singură linie, trei stări (spec §RL-06). */
export function autosaveLabel(status: AutosaveStatus, savedAt: Date | null): string | null {
  switch (status) {
    case 'saving':
      return 'Se salvează…'
    case 'saved':
      return savedAt
        ? `Salvat · ${savedAt.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`
        : 'Salvat'
    case 'error':
      return 'Nesalvat'
    default:
      return null
  }
}
