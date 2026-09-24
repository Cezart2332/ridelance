import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { microStepsOf, screenCountOf } from './config'
import { useMicroResources } from './useMicroResources'
import type { MicroStepAnswer, MicroStepAnswers, MicroStepContext, MicroStepView } from './microStepTypes'
import { MicroStepsContext, type MicroStepsValue } from './microStepsContext'
import type { StepView } from './stepModel'
import { useOnboarding } from './useOnboarding'
import { onboardingService } from '../../services/onboarding.service'
import { describeAnswer, restoreAnswer } from './answerRecords'
import { isBlockingAnswer } from './microStepTypes'

/** Micro-pasul curent trăiește în URL, nu în state: Back-ul browserului trebuie să funcționeze. */
const PARAM = 'pas'

interface MicroStepProviderProps {
  /** Pasul mare al rutei curente. `null` cât timp starea încă se încarcă. */
  activeKey: string | null
  children: ReactNode
}

/**
 * Poziția în fluxul de micro-pași.
 *
 * Trăiește în shell, nu în pagină, din două motive: topbarul și rail-ul din dreapta au nevoie de
 * ea la fel de mult ca runnerul, iar shell-ul nu se remontează la schimbarea pasului — deci
 * răspunsurile din sesiune supraviețuiesc navigării între pași.
 *
 * Poziția nu se stochează nicăieri: se derivă din datele serverului prin `isDone`. De asta un
 * refresh aterizează pe ecranul corect fără câmp nou pe backend.
 */
export function MicroStepProvider({ activeKey, children }: MicroStepProviderProps) {
  const { state, documents, eligibility, steps, resources } = useOnboarding()

  // Sub-stările pasului curent, ca predicatele din config să poată citi ce zice serverul.
  useMicroResources(activeKey)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [answers, setAnswers] = useState<MicroStepAnswers>({})

  /**
   * Răspunsurile date înainte (alt tab, alt dispozitiv, un refresh) vin de pe server. Ce s-a
   * răspuns deja în sesiunea asta câștigă: cererea poate ajunge după un clic.
   */
  useEffect(() => {
    let cancelled = false
    onboardingService
      .getMyAnswers()
      .then((saved) => {
        if (cancelled || saved.length === 0) return
        setAnswers((prev) => {
          const restored: MicroStepAnswers = {}
          for (const a of saved) restored[a.questionId] = restoreAnswer(a.questionId, a.value)
          return { ...restored, ...prev }
        })
      })
      .catch(() => {
        // Fără răspunsurile vechi, fluxul merge tot din datele serverului, ca înainte.
      })
    return () => {
      cancelled = true
    }
  }, [])

  /** Câmpurile de text se trimit după o pauză de tastare, nu la fiecare literă. */
  const saveTimers = useRef<Record<string, number>>({})

  const context: MicroStepContext = useMemo(
    () => ({ answers, documents, eligibility, state, resources }),
    [answers, documents, eligibility, state, resources],
  )

  // Doar ramura pe care o parcurge chiar acest utilizator: `visibleWhen` taie restul, iar totalul
  // se recalculează după fiecare răspuns (spec §7.4 — contorul reflectă parcursul real).
  const visible = useMemo(
    () => microStepsOf(activeKey).filter((def) => def.visibleWhen?.(context) ?? true),
    [activeKey, context],
  )

  const requested = searchParams.get(PARAM)

  const { views, current } = useMemo(() => {
    // Un „Nu” care oprește parcursul (vârstă, permis, atestat) nu închide ecranul, oricât ar zice `isDone`.
    const done = visible.map((def) => def.isDone(context) && !isBlockingAnswer(def, context.answers[def.id]))
    // Fără `?pas` în URL: primul ecran nerezolvat. Ăsta e tot mecanismul de resume.
    const fallback = done.findIndex((d) => !d)
    const requestedIndex = visible.findIndex((def) => def.id === requested)
    const currentIndex =
      requestedIndex >= 0 ? requestedIndex : fallback >= 0 ? fallback : visible.length - 1

    const list: MicroStepView[] = visible.map((def, index) => ({
      def,
      index,
      done: done[index],
      current: index === currentIndex,
    }))

    return { views: list, current: list[currentIndex] ?? null }
  }, [visible, context, requested])

  const goTo = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams)
      next.set(PARAM, id)
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  /**
   * Ancorăm ecranul rezolvat în URL. Fără asta, `isDone` ar muta userul singur: în clipa în care
   * răspunde la o întrebare, micro-pasul devine rezolvat, iar „primul nerezolvat" ar sări la
   * următorul ecran înainte ca el să apuce să apese „Continuă".
   *
   * `replace`, ca normalizarea să nu se adauge în istoric — Back-ul trebuie să ducă la ecranul
   * anterior, nu la aceeași pagină fără parametru.
   */
  useEffect(() => {
    if (!current || current.def.id === requested) return
    const next = new URLSearchParams(searchParams)
    next.set(PARAM, current.def.id)
    setSearchParams(next, { replace: true })
  }, [current, requested, searchParams, setSearchParams])

  /**
   * Ieșirea din pasul mare. Înainte, mersul înainte căuta primul pas nelocked — o a doua părere
   * despre deblocare, care putea să nu coincidă cu a serverului. Acum sursa e `currentStep`:
   * exact pasul pe care backendul acceptă scrieri.
   */
  const currentStep = state?.currentStep ?? null

  const forwardTarget = useMemo(() => {
    const order = steps.findIndex((s) => s.key === activeKey)
    if (order < 0) return null

    // Ținta serverului contează doar dacă e ÎNAINTE. De când pașii se deblochează pe partea
    // userului, nu pe validarea adminului, `currentStep` poate rămâne în urmă (un pas predat spre
    // validare, dar nefinalizat) — iar „Continuă" l-ar fi trimis înapoi exact în pasul din care
    // tocmai ieșise.
    if (currentStep && currentStep !== activeKey) {
      const serverIndex = steps.findIndex((s) => s.key === currentStep)
      const serverTarget = steps[serverIndex]
      if (serverIndex > order && serverTarget.state !== 'locked') return serverTarget
    }

    // Următorul pas mare deblocat — inclusiv când serverul încă marchează pasul curent ca activ
    // (ex. conturile fleet sunt completate, dar adminul nu le-a activat încă).
    return steps.slice(order + 1).find((s) => s.state !== 'locked') ?? null
  }, [steps, activeKey, currentStep])

  /**
   * Șoferul și-a făcut partea peste tot: de pe ultimul pas se merge la ecranul de final. Fără asta,
   * ultimul ecran al vehiculului n-avea ieșire înainte și rămânea fără buton.
   */
  const canFinish = state != null && currentStep === null && steps.length > 0 && !state.allSectionsValidated

  const leave = useCallback(
    (direction: 1 | -1) => {
      const order = steps.findIndex((s) => s.key === activeKey)
      if (order < 0) return

      if (direction === 1) {
        // Fără țintă calculată, mergem la rădăcina onboardingului: `OnboardingRedirect` alege
        // pasul din starea proaspătă a serverului.
        //
        // Contează pe ultimul ecran al unui pas, cel care tocmai l-a și închis: ținta de aici e
        // memoizată pe starea de dinaintea salvării, în care pasul următor era încă blocat. Ieșea
        // `null`, iar „Continuă" nu făcea absolut nimic — exact fundătura de la Uber/Bolt Fleet.
        navigate(forwardTarget?.path ?? '/onboarding')
        return
      }

      const previous: StepView | undefined = steps
        .slice(0, order)
        .reverse()
        .find((s) => s.state !== 'locked')
      if (previous) navigate(previous.path)
    },
    [steps, activeKey, forwardTarget, navigate],
  )

  /**
   * Adminul a validat pasul pe care omul îl are deschis: îl mutăm singur la pasul următor. Înainte
   * rămânea pe rezumat și trebuia să apese încă o dată „Continuă către pasul următor" — iar la PFA,
   * pasul 03 se deschidea tot pe un ecran care cerea încă un click.
   *
   * Doar pe tranziția văzută aici (în verificare → validat), nu pe orice pas validat: cine revine
   * pe un pas terminat, ca să-l recitească, nu trebuie aruncat înainte.
   */
  const activeState = steps.find((s) => s.key === activeKey)?.state ?? null
  const previousState = useRef<{ key: string | null; state: string | null }>({ key: activeKey, state: activeState })

  useEffect(() => {
    const before = previousState.current
    previousState.current = { key: activeKey, state: activeState }
    if (before.key !== activeKey) return
    if (before.state === 'pending_review' && activeState === 'approved') {
      navigate(forwardTarget?.path ?? '/onboarding')
    }
  }, [activeKey, activeState, forwardTarget, navigate])

  const next = useCallback(() => {
    if (!current) return leave(1)
    const following = views[current.index + 1]
    if (following) goTo(following.def.id)
    else leave(1)
  }, [current, views, goTo, leave])

  const back = useCallback(() => {
    if (current && current.index > 0) {
      goTo(views[current.index - 1].def.id)
      return
    }
    leave(-1)
  }, [current, views, goTo, leave])

  // Contorul e global peste tot onboardingul, nu doar peste pasul curent: altfel bara ar reporni
  // de la zero la fiecare pas mare și n-ar mai însemna „cât mai am".
  const { position, total, canGoBack } = useMemo(() => {
    const activeOrder = steps.findIndex((s) => s.key === activeKey)
    const countOf = (step: StepView) =>
      step.key === activeKey && views.length > 0 ? views.length : screenCountOf(step.key)

    const totalScreens = steps.reduce((acc, step) => acc + countOf(step), 0)
    const before = steps.slice(0, Math.max(activeOrder, 0)).reduce((acc, step) => acc + countOf(step), 0)
    const within = current ? current.index + 1 : 1

    return {
      position: before + within,
      total: Math.max(totalScreens, 1),
      canGoBack: activeOrder > 0 || (current?.index ?? 0) > 0,
    }
  }, [steps, activeKey, views, current])

  const answer = useCallback((id: string, value: MicroStepAnswer) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))

    // Tot ce răspunde omul ajunge la admin, în afară de parole (`describeAnswer` le lasă pe dinafară).
    const record = describeAnswer(id, value)
    if (!record) return
    window.clearTimeout(saveTimers.current[id])
    saveTimers.current[id] = window.setTimeout(
      () => void onboardingService.saveAnswer(record).catch(() => undefined),
      id.includes('.') ? 1000 : 0,
    )
  }, [])

  const value: MicroStepsValue = useMemo(
    () => ({
      steps: views,
      current,
      answers,
      answer,
      goTo,
      next,
      back,
      canGoBack,
      canGoForward: forwardTarget !== null || canFinish,
      position,
      total,
      percent: Math.round((position / total) * 100),
    }),
    [views, current, answers, answer, goTo, next, back, canGoBack, forwardTarget, canFinish, position, total],
  )

  return <MicroStepsContext.Provider value={value}>{children}</MicroStepsContext.Provider>
}
