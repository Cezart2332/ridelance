import type { DocumentSummary } from '../../services/document.service'
import { isAiPending } from '../../services/document.service'
import type {
  EligibilityProfile,
  OnboardingSectionState,
  OnboardingState,
  OnboardingStep,
} from '../../services/onboarding.service'
import { categoriesOfStep } from './documentRequirements'

/**
 * Starea de pas pe care o afișează rail-ul. Serverul emite doar patru valori
 * (Locked / InProgress / AwaitingValidation / Completed) — restul se derivă aici, din date
 * care există deja în payload: secțiunile de documente, documentele userului și profilul de
 * eligibilitate. Nicio cerere nouă, niciun câmp nou pe backend.
 */
export type StepViewState = 'locked' | 'todo' | 'in_progress' | 'pending_review' | 'approved' | 'rejected'

export interface StepView {
  order: number
  key: string
  label: string
  path: string
  state: StepViewState
  /** Motivul afișat sub pas: de ce e blocat sau de ce a fost respins. Singurul text explicativ. */
  reason: string | null
}

/** Secțiunile de aprobare (OnboardingSectionApproval) care aparțin fiecărui pas. */
const STEP_SECTION_KEYS: Record<string, string[]> = {
  eligibility: [],
  pfa: ['Pfa'],
  fiscal: [],
  arr: ['AutorizatieTransport'],
  platforms: [],
  vehicle: ['CopieConforma', 'Vehicul'],
}

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

/** Cel mai recent document dintr-o categorie — doar el contează, restul sunt versiuni vechi. */
function newestPerCategory(documents: DocumentSummary[], categories: string[]): DocumentSummary[] {
  return categories.flatMap((category) => {
    const newest = documents.filter((d) => d.category === category).sort(byNewest)[0]
    return newest ? [newest] : []
  })
}

const isRejectedDoc = (doc: DocumentSummary) =>
  doc.status.toLowerCase() === 'rejected' || doc.aiStatus === 'Failed'

function sectionsOf(state: OnboardingState | null, stepKey: string): OnboardingSectionState[] {
  const keys = STEP_SECTION_KEYS[stepKey] ?? []
  return (state?.sections ?? []).filter((s) => keys.includes(s.key))
}

/**
 * Motivul respingerii pasului, sau `null` dacă nu e respins. Ordinea contează: motivul dat de om
 * (admin) e mai util decât cel generat automat, așa că secțiunile bat documentele.
 */
function rejectionOf(
  step: OnboardingStep,
  state: OnboardingState | null,
  documents: DocumentSummary[],
  eligibility: EligibilityProfile | null,
): string | null {
  if (step.key === 'eligibility' && eligibility) {
    if (eligibility.status === 'Ineligible' || eligibility.status === 'NeedsReview') {
      return eligibility.reasons.join(' ') || 'Datele de eligibilitate necesită o verificare.'
    }
  }

  const rejectedSection = sectionsOf(state, step.key).find((s) => s.status === 'Rejected')
  if (rejectedSection) {
    return (
      rejectedSection.note ??
      (step.key === 'pfa' ? state?.pfaReviewNote : null) ??
      'Documentele au fost respinse. Reîncarcă-le mai jos.'
    )
  }

  const rejectedDoc = newestPerCategory(documents, categoriesOfStep(step.key)).find(isRejectedDoc)
  if (rejectedDoc) {
    return rejectedDoc.aiSummary ?? 'Un document a fost respins. Reîncarcă-l mai jos.'
  }

  return null
}

/** Pasul a fost atins de user — face diferența între „neînceput” și „în lucru”. */
function hasStarted(
  step: OnboardingStep,
  state: OnboardingState | null,
  documents: DocumentSummary[],
  eligibility: EligibilityProfile | null,
): boolean {
  if (step.key === 'eligibility') {
    return eligibility !== null
  }
  if (sectionsOf(state, step.key).some((s) => s.submittedAtUtc !== null)) {
    return true
  }
  return newestPerCategory(documents, categoriesOfStep(step.key)).length > 0
}

/** Documentele pasului au ajuns și sunt în prevalidarea automată (Gemini). */
function isAwaitingAi(step: OnboardingStep, documents: DocumentSummary[]): boolean {
  return newestPerCategory(documents, categoriesOfStep(step.key)).some(isAiPending)
}

export function toStepView(
  step: OnboardingStep,
  state: OnboardingState | null,
  documents: DocumentSummary[],
  eligibility: EligibilityProfile | null,
): StepView {
  const base = {
    order: step.order,
    key: step.key,
    label: step.label,
    path: step.path,
  }

  // Respingerea bate orice altceva, inclusiv blocarea: dacă adminul a întors o decizie,
  // pasul trebuie să se redeschidă și să spună de ce.
  const rejection = rejectionOf(step, state, documents, eligibility)
  if (rejection) {
    return { ...base, state: 'rejected', reason: rejection }
  }

  if (step.status === 'Completed') {
    return { ...base, state: 'approved', reason: null }
  }

  if (step.status === 'Locked') {
    return { ...base, state: 'locked', reason: step.blockReason }
  }

  if (step.status === 'AwaitingValidation' || isAwaitingAi(step, documents)) {
    return { ...base, state: 'pending_review', reason: null }
  }

  return {
    ...base,
    state: hasStarted(step, state, documents, eligibility) ? 'in_progress' : 'todo',
    reason: null,
  }
}

export function buildStepViews(
  state: OnboardingState | null,
  documents: DocumentSummary[],
  eligibility: EligibilityProfile | null,
): StepView[] {
  return (state?.steps ?? []).map((step) => toStepView(step, state, documents, eligibility))
}

/**
 * Pasul pe care îl deschidem la revenire: întâi orice pas respins (spec — „dacă a fost respins
 * ceva cât a lipsit, deschide direct pasul respins”), altfel primul pas la care se poate lucra.
 */
export function firstActionableStep(steps: StepView[]): StepView | null {
  return (
    steps.find((s) => s.state === 'rejected') ??
    steps.find((s) => s.state !== 'approved' && s.state !== 'locked') ??
    steps[steps.length - 1] ??
    null
  )
}

export const isStepReachable = (step: StepView) => step.state !== 'locked'

export const completedCount = (steps: StepView[]) => steps.filter((s) => s.state === 'approved').length

/** Eticheta de status — stările nu se comunică doar prin culoare (spec §10). */
export function stepStateLabel(state: StepViewState): string {
  switch (state) {
    case 'locked':
      return 'Blocat'
    case 'todo':
      return 'De început'
    case 'in_progress':
      return 'În lucru'
    case 'pending_review':
      return 'În verificare'
    case 'approved':
      return 'Validat'
    case 'rejected':
      return 'Respins'
  }
}
