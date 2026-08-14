import { Alert, Snackbar, Stack } from '@mui/material'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'

import { getErrorMessage } from '../../../utils/errorHandler'
import type { MicroStepContext } from '../microStepTypes'
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
import { OnboardingCard } from './OnboardingCard'
import { multiStepComplete, textStepComplete } from './stepCompletion'
import { StepSummary } from './StepSummary'

/**
 * Runnerul: primește micro-pașii pasului curent și randează ecranul potrivit. Un singur `switch`,
 * într-un singur fișier — de aici încolo, un pas nou înseamnă un fișier de config, nu componente.
 */
export function OnboardingRunner() {
  const { steps, current, answers, answer, goTo, next } = useMicroSteps()
  const { state, documents, eligibility, resources, refresh } = useOnboarding()
  const support = useOnboardingSupport()
  const { step: stepMotion } = useMotionTokens()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!current) return null
  const { def } = current
  const value = answers[def.id]

  /** Ce poate citi un predicat sau o acțiune din config. Aceeași formă ca la filtrarea pașilor. */
  const context: MicroStepContext = { answers, documents, eligibility, state, resources }

  /** „Continuă": trimite răspunsul dacă micro-pasul are ce trimite, apoi avansează. */
  const advance = async () => {
    // Ecranele `text` nu au nevoie de flush explicit aici: `useAutosave` salvează la ieșirea din
    // câmp (clickul pe „Continuă" scoate focusul) și încă o dată la demontare, când `next()`
    // schimbă ecranul. Un flush în plus ar dubla cererea.
    if (def.submit && typeof value === 'string') {
      setSubmitting(true)
      try {
        await def.submit(value)
        await refresh()
      } catch (err) {
        setError(getErrorMessage(err, 'Nu am putut salva răspunsul.'))
        setSubmitting(false)
        return
      }
      setSubmitting(false)
    }
    next()
  }

  const body = (): ReactNode => {
    switch (def.kind) {
      case 'question':
        return (
          <ChoiceGroup
            label={def.title}
            choices={def.choices ?? []}
            value={typeof value === 'string' ? value : null}
            onChange={(picked) => answer(def.id, picked)}
          />
        )
      case 'text':
        return <MicroTextStep def={def} context={context} />
      case 'multi':
        return <MicroMultiStep def={def} />
      case 'upload':
        return <MicroUploadStep def={def} />
      case 'action':
        return (
          <MicroActionStep def={def} context={context} done={current.done} onDone={refresh} />
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

  const footer = (): ReactNode => {
    switch (def.kind) {
      case 'question':
        return <CardFooter disabled={submitting || value === undefined} onContinue={() => void advance()} />
      case 'text':
        return (
          <CardFooter
            disabled={submitting || !textStepComplete(def, answers)}
            onContinue={() => void advance()}
          />
        )
      case 'multi':
        return (
          <CardFooter
            disabled={submitting || !multiStepComplete(def, value)}
            onContinue={() => void advance()}
          />
        )
      case 'upload':
        return <CardFooter disabled={submitting || !current.done} onContinue={() => void advance()} />
      // Acțiunea și-a arătat butonul în corpul cardului; footerul doar duce mai departe, după ce
      // serverul confirmă că s-a întâmplat.
      case 'action':
        return <CardFooter disabled={submitting || !current.done} onContinue={() => void advance()} />
      case 'info':
        return <CardFooter disabled={submitting} onContinue={() => void advance()} />
      case 'summary':
        return (
          <CardFooter
            disabled={submitting}
            label="Continuă către pasul următor"
            onContinue={() => void advance()}
          />
        )
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
                {body()}
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
