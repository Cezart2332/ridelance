import { Alert, Snackbar, Stack } from '@mui/material'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'

import { getErrorMessage } from '../../../utils/errorHandler'
import { useMotionTokens } from '../motion'
import { useMicroSteps } from '../useMicroSteps'
import { useOnboarding } from '../useOnboarding'
import { useOnboardingSupport } from '../supportContext'
import { BlockedStateCard } from './BlockedStateCard'
import { CardFooter } from './CardFooter'
import { ChoiceGroup } from './ChoiceGroup'
import { MicroUploadStep } from './MicroUploadStep'
import { OnboardingCard } from './OnboardingCard'
import { StepSummary } from './StepSummary'

/**
 * Runnerul: primește micro-pașii pasului curent și randează ecranul potrivit. Un singur `switch`,
 * într-un singur fișier — de aici încolo, un pas nou înseamnă un fișier de config, nu componente.
 */
export function OnboardingRunner() {
  const { steps, current, answers, answer, goTo, next } = useMicroSteps()
  const { documents, eligibility, refresh } = useOnboarding()
  const support = useOnboardingSupport()
  const { step: stepMotion } = useMotionTokens()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!current) return null
  const { def } = current
  const value = answers[def.id]

  /** „Continuă": trimite răspunsul dacă micro-pasul are ce trimite, apoi avansează. */
  const advance = async () => {
    if (def.submit && value !== undefined) {
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
            value={value ?? null}
            onChange={(picked) => answer(def.id, picked)}
          />
        )
      case 'upload':
        return <MicroUploadStep def={def} />
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
      case 'upload':
        return <CardFooter disabled={submitting || !current.done} onContinue={() => void advance()} />
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
