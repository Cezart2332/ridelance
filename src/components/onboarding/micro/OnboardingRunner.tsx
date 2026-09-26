import { Alert, Snackbar, Stack } from '@mui/material'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import { getErrorMessage } from '../../../utils/errorHandler'
import { isAiPending } from '../../../services/document.service'
import { currentAutosave } from '../autosaveStore'
import { categoriesOfStep } from '../documentRequirements'
import { newestPerCategory } from '../stepModel'
import { BLOCKING_SLOTS, BLOCKING_SLOT_REASONS, isBlockingAnswer, type MicroStepContext } from '../microStepTypes'
import { useMotionTokens } from '../motion'
import { useMicroSteps } from '../useMicroSteps'
import { useOnboarding } from '../useOnboarding'
import { useOnboardingSupport } from '../supportContext'
import { BlockedStateCard } from './BlockedStateCard'
import { AutoAdvanceFooter } from './AutoAdvanceFooter'
import { AcknowledgeAnswerDialog } from './AcknowledgeAnswerDialog'
import { BlockingAnswerDialog } from './BlockingAnswerDialog'
import { ChoiceGroup } from './ChoiceGroup'
import { MicroActionStep } from './MicroActionStep'
import { MicroInfoStep } from './MicroInfoStep'
import { MicroMultiStep } from './MicroMultiStep'
import { MicroTextStep } from './MicroTextStep'
import { MicroUploadStep } from './MicroUploadStep'
import { MicroStepSlotContent } from './microStepSlots'
import { OnboardingCard } from './OnboardingCard'
import { multiStepIssues, textStepIssues } from './stepCompletion'
import { StepSummary } from './StepSummary'

/**
 * Cât ține ecranul rezolvat pe loc înainte să se schimbe singur. Destul cât alegerea sau bifa
 * verde să se vadă, prea puțin cât să pară că s-a blocat.
 */
const AUTO_ADVANCE_MS = 550

/**
 * Ecranele pe care le închide serverul, nu userul: un document acceptat, o acțiune executată.
 * Întrebările avansează tot singure, dar pe drumul lor (`pick`), ca să apuce să trimită răspunsul.
 */
const AUTO_KINDS = new Set(['upload', 'action'])

/**
 * Runnerul: primește micro-pașii pasului curent și randează ecranul potrivit. Un singur `switch`,
 * într-un singur fișier — de aici încolo, un pas nou înseamnă un fișier de config, nu componente.
 *
 * Nu există „Continuă”: un ecran gata trece singur mai departe. O alegere, un document acceptat
 * sau o acțiune executată trec imediat; un formular completat, bifele, un ecran de citit sau
 * rezumatul trec după o scurtă numărătoare, pe care omul o poate opri („Rămân aici”). Un „Nu” care
 * oprește parcursul deschide un pop-up cu motivul.
 */
export function OnboardingRunner() {
  const { steps, current, answers, answer, goTo, next, canGoForward } = useMicroSteps()
  const { state, documents, eligibility, resources, refresh } = useOnboarding()
  const support = useOnboardingSupport()
  const { step: stepMotion } = useMotionTokens()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Acțiunea de pe ecranul curent a rulat cu succes — pentru cazurile în care serverul n-o vede. */
  const [ranId, setRanId] = useState<string | null>(null)

  const currentId = current?.def.id ?? null
  const currentKind = current?.def.kind ?? null
  const resolved = current !== null && (current.done || ranId === currentId)

  /**
   * Ecranul pe care userul tocmai a făcut ceva — încărcare terminată sau acțiune executată.
   * Se setează DOAR din handlere, niciodată din randare: avansul automat se declanșează pe fapta
   * lui, nu pe simpla constatare că ecranul e rezolvat. Altfel, întoarcerea pe un pas deja
   * terminat l-ar arunca înainte fără să fi atins nimic.
   */
  const [armedId, setArmedId] = useState<string | null>(null)
  const armed = armedId !== null && armedId === currentId

  /** Avansul programat de o alegere. Se atinge doar din handlere. */
  const pickTimer = useRef<number | undefined>(undefined)

  /** Pop-up-ul pentru un „Nu” care oprește parcursul. */
  const [blockingChoice, setBlockingChoice] = useState<{ title: string; message: string } | null>(null)

  /** Pop-up-ul „Am înțeles” al unei variante cu `acknowledge`; răspunsul pleacă la închidere. */
  const [acknowledgeChoice, setAcknowledgeChoice] = useState<{ value: string; title: string; message: string } | null>(null)

  /**
   * „Rămân aici”: ecranul nu mai trece singur mai departe până nu se schimbă un răspuns. Ținem
   * obiectul `answers` de atunci — orice răspuns nou îl înlocuiește, deci oprirea expiră singură.
   */
  const [stay, setStay] = useState<{ id: string; answers: unknown } | null>(null)

  /**
   * Fiecare tastă repornește numărătoarea: un formular completat trece mai departe abia după ce
   * omul se oprește din scris, nu la prima valoare care se întâmplă să fie validă.
   */
  const [keystrokes, setKeystrokes] = useState(0)

  /**
   * `next` proaspăt pentru avansul întârziat. Un răspuns poate face vizibil un ecran nou
   * („Da" la TVA deschide încărcarea certificatului), iar un `next` capturat înainte de răspuns
   * ar sări peste el.
   */
  const nextRef = useRef(next)
  useEffect(() => {
    nextRef.current = next
  }, [next])

  /**
   * `onArrive`: ecranele care fac ceva singure la sosire (trimiterea pasului fiscal la verificare).
   * O singură dată pe ecran și sesiune: un refresh al stării nu trebuie să retrimită nimic.
   */
  const arrivedIds = useRef(new Set<string>())
  const arriveDef = current?.def.onArrive ? current.def : null
  const shouldArrive =
    arriveDef?.onArrive?.when({ answers, documents, eligibility, state, resources }) === true
  useEffect(() => {
    const arrive = arriveDef?.onArrive
    if (!arriveDef || !arrive || !shouldArrive || arrivedIds.current.has(arriveDef.id)) return
    arrivedIds.current.add(arriveDef.id)
    void arrive
      .run({ answers, documents, eligibility, state, resources })
      .then(() => refresh())
      .catch((err: unknown) => {
        // Nereușit: la următoarea sosire pe ecran se încearcă din nou, nu rămâne blocat pe eroare.
        arrivedIds.current.delete(arriveDef.id)
        setError(getErrorMessage(err, arrive.errorMessage))
      })
    // Contextul de la sosire e cel care contează; schimbările lui ulterioare nu mai retrimit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arriveDef, shouldArrive, refresh])

  useEffect(() => {
    // Întrebările nu trec pe aici: ele își programează avansul în `pick`, ca să apuce să trimită
    // răspunsul înainte de schimbarea ecranului.
    if (!armed || !resolved || !currentKind || !AUTO_KINDS.has(currentKind)) return

    const timer = window.setTimeout(next, AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [armed, resolved, currentKind, next])

  if (!current) return null
  const { def } = current
  const value = answers[def.id]

  /** Ce poate citi un predicat sau o acțiune din config. Aceeași formă ca la filtrarea pașilor. */
  const context: MicroStepContext = { answers, documents, eligibility, state, resources }

  /** Trimite răspunsul dacă micro-pasul are ce trimite, apoi avansează. */
  const advanceNow = async (picked?: string) => {
    const payload = picked ?? (typeof value === 'string' ? value : undefined)

    if (def.submit && typeof payload === 'string') {
      setSubmitting(true)
      try {
        await def.submit(payload)
        await refresh()
      } catch (err) {
        setError(getErrorMessage(err, 'Nu am putut salva răspunsul.'))
        setSubmitting(false)
        return
      }
      setSubmitting(false)
    }

    // Ecranele `text` salvează la blur, dar clickul pe „Continuă" poate rula înainte ca autosave-ul
    // să termine — mai ales parola contului Bolt/Uber. Golim ce e în așteptare înainte de avans.
    //
    // Prin autosave, nu printr-un `persist` refăcut de mână: retrimiterea oarbă a datelor deja
    // salvate bloca pasul Uber/Bolt. Autosave-ul închidea pasul pe server, iar a doua scriere
    // pica pe poarta RL-01 („se scrie doar pe pasul activ"), deci „Continuă" arăta o eroare și
    // nu avansa niciodată. `flush` nu trimite nimic când nu e nimic în așteptare.
    const autosave = currentAutosave()

    // O precompletare neatinsă nu e „dirty”, dar pe ecranele cu `persistPrefilledOnContinue` tot
    // trebuie trimisă: acolo salvarea creează ceva (dosarul PFA). `flush`-ul ecranului știe dacă mai
    // are ce trimite.
    const mustSave = autosave?.dirty === true || def.persistPrefilledOnContinue === true
    if (def.kind === 'text' && autosave && mustSave && textStepIssues(def, answers, context).length === 0) {
      setSubmitting(true)
      try {
        if (!(await autosave.flush())) {
          // Autosave-ul nu aruncă — reîncearcă în fundal. Dar plecarea de pe ecran se oprește
          // aici: mai departe peste date nesalvate ar fi mai rău decât un buton care refuză.
          setError('Nu am putut salva datele. Reîncearcă în câteva momente.')
          setSubmitting(false)
          return
        }
        await refresh()
      } catch (err) {
        setError(getErrorMessage(err, 'Nu am putut salva datele.'))
        setSubmitting(false)
        return
      }
      setSubmitting(false)
    }

    // Alegerile care nu încap într-un `string` — bifele de platforme, de pildă. Aceeași regulă ca
    // la `submit`: dacă salvarea eșuează, rămânem pe ecran cu eroarea, nu plecăm peste ea.
    if (def.commit) {
      setSubmitting(true)
      try {
        await def.commit(context)
        await refresh()
      } catch (err) {
        setError(getErrorMessage(err, 'Nu am putut salva alegerea.'))
        setSubmitting(false)
        return
      }
      setSubmitting(false)
    }

    nextRef.current()
  }

  /** Numărătoarea pornește o singură dată pe ecran; Enter nu mai pornește nimic cât se salvează. */
  const advance = (picked?: string) => advanceNow(picked)

  /**
   * O întrebare cu un singur răspuns nu mai are ce confirma: alegerea E răspunsul. Lăsăm o pauză
   * cât să se vadă bifa, apoi trimitem și trecem mai departe.
   *
   * Pauza se reia la fiecare alegere: cu săgețile, selecția se plimbă prin opțiuni, iar fără
   * anularea celei anterioare fiecare pas prin listă ar programa încă un avans.
   */
  const pick = (choice: string) => {
    answer(def.id, choice)
    // Marcăm ecranul ca „atins de user" ca să nu pornească numărătoarea cât ține pauza.
    setArmedId(def.id)
    window.clearTimeout(pickTimer.current)
    const picked = def.choices?.find((c) => c.value === choice)
    pickTimer.current = window.setTimeout(() => {
      // Un „Nu” care oprește parcursul: explicăm de ce și rămânem pe întrebare. Tot după pauză,
      // ca navigarea cu săgețile prin variante să nu deschidă pop-up-ul la fiecare trecere.
      if (picked?.blocking) {
        setBlockingChoice(picked.blocking)
        return
      }
      if (picked?.acknowledge) {
        setAcknowledgeChoice({ value: choice, ...picked.acknowledge })
        return
      }
      void advance(choice)
    }, AUTO_ADVANCE_MS)
  }

  /**
   * Documentul a intrat. Dacă ecranul mai are ceva de spus serverului pe lângă fișier, se spune
   * acum.
   *
   * Avansul automat al uploadurilor pleacă direct la `next`, nu prin `advance`, deci un
   * `commit` pe un ecran de încărcare n-ar rula niciodată pe drumul obișnuit — doar dacă
   * utilizatorul s-ar întoarce pe ecran din rail și ar apăsa „Continuă". Așa a rămas nespus
   * răspunsul „Da" la TVA, pe care serverul îl acceptă abia după ce vede certificatul.
   */
  const commitThenArm = async () => {
    if (def.commit) {
      setSubmitting(true)
      try {
        await def.commit(context)
        await refresh()
      } catch (err) {
        setError(getErrorMessage(err, 'Nu am putut salva răspunsul.'))
        setSubmitting(false)
        return
      }
      setSubmitting(false)
    }
    setArmedId(def.id)
  }

  const body = (): ReactNode => {
    switch (def.kind) {
      case 'question':
        return (
          <ChoiceGroup
            label={def.title}
            choices={def.choices ?? []}
            value={typeof value === 'string' ? value : null}
            onChange={pick}
          />
        )
      case 'text':
        return <MicroTextStep def={def} context={context} />
      case 'multi':
        return <MicroMultiStep def={def} />
      case 'upload':
        return (
          <MicroUploadStep
            def={def}
            onUploaded={() => void commitThenArm()}
            // §6 — dacă utilizatorul înlocuiește fișierul cât ține tranziția, avansarea se
            // oprește: altfel ecranul ar pleca de sub el în mijlocul unei corecturi.
            onReplaceStarted={() => setArmedId(null)}
          />
        )
      case 'action':
        return (
          <MicroActionStep
            def={def}
            context={context}
            done={resolved}
            onDone={async () => {
              // Unele acțiuni se petrec în altă parte (contul la bancă): serverul n-are de unde
              // ști că s-au întâmplat, deci reținem noi execuția, altfel ecranul rămâne o fundătură.
              setRanId(def.id)
              setArmedId(def.id)
              await refresh()
            }}
          />
        )
      case 'info':
        return <MicroInfoStep def={def} context={context} />
      case 'summary':
        return (
          <StepSummary
            steps={steps.filter((view) => view.def.kind !== 'summary')}
            answers={answers}
            documents={documents}
            onEdit={goTo}
          />
        )
    }
  }

  // Ultimul ecran al unui pas care nu are ieșire înainte (e la admin) nu trece nicăieri: n-ar
  // duce nicăieri. Ecranul spune deja ce se întâmplă și cât durează.
  const isLast = current.index === steps.length - 1
  const deadEnd = isLast && !canGoForward

  /**
   * Rezumatul nu lasă omul mai departe cât timp actele pasului n-au trecut de verificarea automată
   * — altfel pasul „s-ar termina" pe acte necitite.
   *
   * Validarea echipei nu se așteaptă aici: după rezumat vine ecranul „e la noi", iar când adminul
   * validează, `MicroStepProvider` mută singur omul la pasul următor.
   */
  const summaryBlockers = (): string[] => {
    const stepDocs = newestPerCategory(documents, categoriesOfStep(def.macroStep))
    if (stepDocs.some(isAiPending)) return ['Verificăm automat documentele încărcate. Durează de obicei sub un minut.']
    if (stepDocs.some((d) => d.aiStatus === 'Failed' || d.aiStatus === 'Error')) {
      return ['Unele documente n-au trecut verificarea automată. Reîncarcă-le din lista de mai sus.']
    }
    return []
  }

  /**
   * Ce mai lipsește ca ecranul să fie gata. Gol = gata: ecranul trece singur mai departe. Nu mai
   * există „Continuă” nicăieri în onboarding — un pas terminat nu mai cere încă un clic.
   */
  const pending = (): string[] => {
    switch (def.kind) {
      case 'question':
        if (typeof value !== 'string') return resolved ? [] : ['Alege un răspuns.']
        return isBlockingAnswer(def, value) ? ['Cu răspunsul „Nu” nu putem merge mai departe.'] : []
      case 'upload':
      case 'action':
        return resolved ? [] : ['']
      case 'text':
        return textStepIssues(def, answers, context)
      case 'multi':
        return multiStepIssues(def, value)
      case 'info': {
        // Un ecran cu slot blocant are ceva de dus la capăt în el (dosarul generat, avansul plătit,
        // banca conectată): trece mai departe când serverul confirmă. Restul se citesc și trec.
        const blocked = def.slot !== undefined && BLOCKING_SLOTS.has(def.slot) && !resolved
        return blocked ? [BLOCKING_SLOT_REASONS[def.slot!] ?? ''] : []
      }
      case 'summary':
        return summaryBlockers()
    }
  }

  /**
   * Cât stă un ecran gata înainte să treacă mai departe. Un ecran de citit primește timp de citit
   * (după numărul de cuvinte); un formular completat, doar cât să se vadă că a fost primit.
   */
  const countdownMs = (): number => {
    if (def.kind === 'info' && !(def.slot && BLOCKING_SLOTS.has(def.slot))) {
      const words = (def.lines?.(context) ?? []).join(' ').split(/\s+/).filter(Boolean).length
      return Math.min(12_000, Math.max(4_000, words * 250))
    }
    if (def.kind === 'summary') return 3_000
    if (def.kind === 'text') return 2_000
    if (def.kind === 'multi') return 1_500
    return 2_000
  }

  const missing = pending()
  const ready = missing.length === 0

  // Alegerile, uploadurile și acțiunile făcute acum își au deja trecerea programată (550 ms).
  const fastPending = armed && (def.kind === 'question' || AUTO_KINDS.has(def.kind))
  const stayed = stay !== null && stay.id === def.id && stay.answers === answers

  const footer = (): ReactNode => {
    if (deadEnd) return null

    const countdown =
      ready && !fastPending && !blockingChoice && !acknowledgeChoice
        ? {
            delayMs: countdownMs(),
            restartKey: `${def.id}:${keystrokes}:${Object.keys(answers).length}:${JSON.stringify(value ?? null)}`,
            // Cât e o eroare pe ecran, nu plecăm de sub ea.
            paused: error !== null,
          }
        : null

    // Upload și acțiune: ecranul însuși spune ce e de făcut; nu mai repetăm dedesubt.
    const reasons = def.kind === 'upload' || def.kind === 'action' ? [] : missing.filter(Boolean)

    return (
      <AutoAdvanceFooter
        reasons={reasons}
        countdown={countdown}
        stayed={stayed}
        busy={submitting}
        onDone={() => void advance()}
        onStay={() => setStay({ id: def.id, answers })}
        manual={def.manualContinue === true}
      />
    )
  }

  /**
   * Enter într-un câmp completat trece imediat mai departe, fără să mai aștepte numărătoarea —
   * cine a terminat de scris nu trebuie să aștepte.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || def.kind !== 'text' || !ready || submitting) return
    if (!(event.target instanceof HTMLInputElement)) return
    event.preventDefault()
    void advance()
  }

  const isField = (target: EventTarget) =>
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement

  /**
   * Verdictul serverului contează abia la capătul pasului: profilul de eligibilitate se creează de
   * OCR la prima încărcare și rămâne `Ineligible` până apare atestatul, deci arătat mai devreme ar
   * anunța un blocaj pe care userul nici n-a apucat să-l provoace.
   */
  const blocked = def.kind === 'summary' && eligibility?.status === 'Ineligible'

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={blocked ? `${def.id}-blocked` : def.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={stepMotion}
        >
          <Stack
            onKeyDown={handleKeyDown}
            // Faza de bubble, nu capture: în capture, React re-randa câmpul cu valoarea veche înainte ca
            // `onChange`-ul lui să apuce să citească tasta — și litera dispărea. Aici update-ul e în
            // același lot cu `onChange`.
            onInput={(event) => isField(event.target) && setKeystrokes((k) => k + 1)}
          >
            {blocked && eligibility ? (
              <BlockedStateCard
                eyebrow={def.eyebrow}
                eligibility={eligibility}
                onContactSupport={support.openChat}
                onBack={() => goTo(steps[Math.max(current.index - 1, 0)].def.id)}
              />
            ) : (
              <OnboardingCard
                eyebrow={def.eyebrow}
                icon={def.icon}
                tone={def.kind === 'summary' ? 'success' : 'accent'}
                title={def.title}
                subtitle={def.subtitle}
                footer={footer()}
              >
                <Stack spacing={2.5}>
                  {def.slotBeforeBody && def.slot && (
                    <MicroStepSlotContent slot={def.slot} context={context} />
                  )}
                  {body()}
                  {def.slot && !def.slotBeforeBody && (
                    <MicroStepSlotContent slot={def.slot} context={context} />
                  )}
                </Stack>
              </OnboardingCard>
            )}
          </Stack>
        </motion.div>
      </AnimatePresence>

      <AcknowledgeAnswerDialog
        open={acknowledgeChoice !== null}
        title={acknowledgeChoice?.title ?? ''}
        message={acknowledgeChoice?.message ?? ''}
        onAcknowledge={() => {
          const value = acknowledgeChoice?.value
          setAcknowledgeChoice(null)
          if (value) void advance(value)
        }}
      />

      <BlockingAnswerDialog
        open={blockingChoice !== null}
        title={blockingChoice?.title ?? ''}
        message={blockingChoice?.message ?? ''}
        onClose={() => setBlockingChoice(null)}
        onContactSupport={support.openChat}
      />

      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error ?? ''}
        </Alert>
      </Snackbar>
    </>
  )
}
