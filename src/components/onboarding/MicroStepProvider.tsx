import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { microStepsOf, screenCountOf } from './config'
import type { MicroStepContext, MicroStepView } from './microStepTypes'
import { MicroStepsContext, type MicroStepsValue } from './microStepsContext'
import type { StepView } from './stepModel'
import { useOnboarding } from './useOnboarding'

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
  const { state, documents, eligibility, steps } = useOnboarding()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [answers, setAnswers] = useState<Record<string, string>>({})

  const context: MicroStepContext = useMemo(
    () => ({ answers, documents, eligibility, state }),
    [answers, documents, eligibility, state],
  )

  // Doar ramura pe care o parcurge chiar acest utilizator: `visibleWhen` taie restul, iar totalul
  // se recalculează după fiecare răspuns (spec §7.4 — contorul reflectă parcursul real).
  const visible = useMemo(
    () => microStepsOf(activeKey).filter((def) => def.visibleWhen?.(context) ?? true),
    [activeKey, context],
  )

  const requested = searchParams.get(PARAM)

  const { views, current } = useMemo(() => {
    const done = visible.map((def) => def.isDone(context))
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

  /** Ieșirea din pasul mare: primul pas următor la care se poate lucra. */
  const leave = useCallback(
    (direction: 1 | -1) => {
      const order = steps.findIndex((s) => s.key === activeKey)
      if (order < 0) return
      const candidates: StepView[] =
        direction === 1 ? steps.slice(order + 1) : steps.slice(0, order).reverse()
      const target = candidates.find((s) => s.state !== 'locked')
      if (target) navigate(target.path)
    },
    [steps, activeKey, navigate],
  )

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

  const answer = useCallback((id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
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
      position,
      total,
      percent: Math.round((position / total) * 100),
    }),
    [views, current, answers, answer, goTo, next, back, canGoBack, position, total],
  )

  return <MicroStepsContext.Provider value={value}>{children}</MicroStepsContext.Provider>
}
