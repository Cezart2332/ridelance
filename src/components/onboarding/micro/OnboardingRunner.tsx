import { Alert, Snackbar, Stack } from '@mui/material'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { getErrorMessage } from '../../../utils/errorHandler'
import { currentAutosave } from '../autosaveStore'
import { BLOCKING_SLOTS, BLOCKING_SLOT_REASONS, type MicroStepContext } from '../microStepTypes'
import { useMotionTokens } from '../motion'
import { useMicroSteps } from '../useMicroSteps'
import { useOnboarding } from '../useOnboarding'
import { useOnboardingSupport } from '../supportContext'
import { BlockedStateCard } from './BlockedStateCard'
import { CardFooter } from './CardFooter'
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
 * Ecranele avansează singure acolo unde există un semnal fără echivoc — o alegere apăsată, un
 * document acceptat de server, o acțiune executată. „Continuă" rămâne doar unde userul chiar are
 * de confirmat ceva: text scris, bife multiple, un ecran de citit.
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

  /**
   * `next` proaspăt pentru avansul întârziat. Un răspuns poate face vizibil un ecran nou
   * („Da" la TVA deschide încărcarea certificatului), iar un `next` capturat înainte de răspuns
   * ar sări peste el.
   */
  const nextRef = useRef(next)
  useEffect(() => {
    nextRef.current = next
  }, [next])

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
  const advance = async (picked?: string) => {
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

    if (def.kind === 'text' && autosave?.dirty === true && textStepIssues(def, answers, context).length === 0) {
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

  /**
   * O întrebare cu un singur răspuns nu mai are ce confirma: alegerea E răspunsul. Lăsăm o pauză
   * cât să se vadă bifa, apoi trimitem și trecem mai departe.
   *
   * Pauza se reia la fiecare alegere: cu săgețile, selecția se plimbă prin opțiuni, iar fără
   * anularea celei anterioare fiecare pas prin listă ar programa încă un avans.
   */
  const pick = (choice: string) => {
    answer(def.id, choice)
    // Marcăm ecranul ca „atins de user" ca să nu apară butonul de continuare cât ține pauza.
    setArmedId(def.id)
    window.clearTimeout(pickTimer.current)
    pickTimer.current = window.setTimeout(() => void advance(choice), AUTO_ADVANCE_MS)
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
            onUploaded={() => setArmedId(def.id)}
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

  // Ultimul ecran al unui pas care nu are ieșire înainte (e la admin) nu primește buton: n-ar
  // duce nicăieri. Ecranul spune deja ce se întâmplă și cât durează.
  const isLast = current.index === steps.length - 1
  const deadEnd = isLast && !canGoForward

  const footer = (): ReactNode => {
    // §6 — un pas cu UN singur document obligatoriu nu randează deloc „Continuă": uploadul
    // reușit e semnalul, iar ecranul avansează singur. Butonul apare doar când nu se mai
    // întâmplă nimic de la sine — un ecran deschis din rail, deja rezolvat la sosire.
    if (def.kind === 'question' || AUTO_KINDS.has(def.kind)) {
      return resolved && !armed && !deadEnd ? (
        <CardFooter disabled={submitting} onContinue={() => void advance()} />
      ) : null
    }

    // Aceeași regulă ca mai sus, pentru ecranele cu buton propriu: fără ieșire înainte, butonul
    // dispare. Cât timp `text` și `multi` nu se uitau la `deadEnd`, butonul lor arăta activ și
    // făcea turul `/onboarding` → înapoi pe același pas — fundătura tăcută de la Uber/Bolt.
    if (deadEnd) return null

    switch (def.kind) {
      case 'text': {
        const issues = textStepIssues(def, answers, context)
        return (
          <CardFooter
            disabled={submitting || issues.length > 0}
            reasons={issues}
            onContinue={() => void advance()}
          />
        )
      }
      case 'multi': {
        const issues = multiStepIssues(def, value)
        return (
          <CardFooter
            disabled={submitting || issues.length > 0}
            reasons={issues}
            onContinue={() => void advance()}
          />
        )
      }
      case 'info': {
        // Un ecran cu slot blocant are ceva de dus la capăt în el (dosarul generat, descărcat și
        // marcat ca depus): se continuă abia când serverul confirmă. Sloturile informative —
        // contul băncii, contul ARR — nu blochează pe nimeni.
        const blocked = def.slot !== undefined && BLOCKING_SLOTS.has(def.slot) && !resolved
        return (
          <CardFooter
            disabled={submitting || blocked}
            reasons={def.slot ? [BLOCKING_SLOT_REASONS[def.slot] ?? ''] : []}
            onContinue={() => void advance()}
          />
        )
      }
      case 'summary':
        return (
          <CardFooter
            disabled={submitting}
            label="Continuă către pasul următor"
            onContinue={() => void advance()}
          />
        )
      default:
        return null
    }
  }

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
          <Stack>
            {blocked && eligibility ? (
              <BlockedStateCard
                eyebrow={def.eyebrow}
                eligibility={eligibility}
                onContactSupport={support.openEmail}
                onBack={() => goTo(steps[Math.max(current.index - 1, 0)].def.id)}
              />
            ) : (
              <OnboardingCard
                eyebrow={def.eyebrow}
                icon={def.icon}
                tone={def.kind === 'summary' ? 'success' : 'accent'}
                title={def.title}
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
