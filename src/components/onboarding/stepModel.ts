import type { DocumentSummary } from '../../services/document.service'
import { isAiPending } from '../../services/document.service'
import type {
  EligibilityProfile,
  OnboardingChecklistItem,
  OnboardingSectionState,
  OnboardingState,
  OnboardingStep,
} from '../../services/onboarding.service'
import { categoriesOfStep } from './documentRequirements'

/**
 * Starea de pas pe care o afișează rail-ul. Vine ACUM întreagă de la server (`step.state`):
 * deblocarea, „în lucru” vs „de început” și respingerea se decid în `OnboardingStepCatalog`,
 * nu aici. Înainte se derivau local, ceea ce însemna că frontendul putea arăta un pas deschis
 * pe care backendul îl refuza la scriere.
 *
 * Singurul lucru care rămâne derivat aici e prevalidarea AI a documentelor: statusul de pas
 * nu o cunoaște, fiindcă documentele nu fac parte din payload-ul de stare.
 */
export type StepViewState = 'locked' | 'todo' | 'in_progress' | 'pending_review' | 'approved' | 'rejected'

/** Vocabularul serverului (spec v3) → vocabularul rail-ului. */
const SERVER_STATE: Record<string, StepViewState> = {
  locked: 'locked',
  available: 'todo',
  in_progress: 'in_progress',
  pending_admin: 'pending_review',
  completed: 'approved',
  rejected: 'rejected',
}

export interface StepView {
  order: number
  key: string
  label: string
  path: string
  state: StepViewState
  /** Motivul afișat sub pas: de ce e blocat sau de ce a fost respins. Singurul text explicativ. */
  reason: string | null
  /** Ce mai lipsește din pas, compus pe server. Populat doar pe pasul curent. */
  checklist: OnboardingChecklistItem[] | null
  /**
   * Pasul a fost sărit sau completat cu date de test din uneltele de dezvoltare. Se marchează
   * distinct în stepper, ca să nu poată fi confundat cu unul parcurs corect (spec §13.6).
   */
  skippedInDev: boolean
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
    checklist: step.checklist,
    skippedInDev: state?.devSkippedSteps?.includes(step.key) ?? false,
  }

  const serverState = SERVER_STATE[step.state] ?? 'locked'

  if (serverState === 'rejected') {
    // Serverul spune CĂ e respins; textul motivului îl compunem tot aici, până când
    // checklistul din payload îl aduce cu el.
    return {
      ...base,
      state: 'rejected',
      reason: rejectionOf(step, state, documents, eligibility) ?? 'Documentele au fost respinse. Reîncarcă-le mai jos.',
    }
  }

  if (serverState === 'locked') {
    return { ...base, state: 'locked', reason: step.blockReason }
  }

  // Prevalidarea AI e singurul semnal pe care statusul de pas nu-l poate cunoaște:
  // documentele nu fac parte din payload-ul de stare.
  if (serverState !== 'approved' && isAwaitingAi(step, documents)) {
    return { ...base, state: 'pending_review', reason: null }
  }

  return { ...base, state: serverState, reason: null }
}

export function buildStepViews(
  state: OnboardingState | null,
  documents: DocumentSummary[],
  eligibility: EligibilityProfile | null,
): StepView[] {
  return (state?.steps ?? []).map((step) => toStepView(step, state, documents, eligibility))
}

/**
 * Pasul pe care îl deschidem la revenire. Serverul îl numește direct în `currentStep` — primul la
 * care șoferul mai are ceva de făcut, nu primul nefinalizat. Diferența contează de când pașii se
 * deblochează pe partea userului: un pas predat spre validare rămâne nefinalizat săptămâni, iar
 * revenirea în aplicație l-ar fi aruncat înapoi în el în loc să-l ducă unde a rămas.
 */
export function firstActionableStep(steps: StepView[], currentStepKey?: string | null): StepView | null {
  return (
    (currentStepKey ? steps.find((s) => s.key === currentStepKey) : undefined) ??
    steps.find((s) => s.state !== 'approved' && s.state !== 'locked') ??
    steps[steps.length - 1] ??
    null
  )
}

export const isStepReachable = (step: StepView) => step.state !== 'locked'

export const completedCount = (steps: StepView[]) => steps.filter((s) => s.state === 'approved').length

/**
 * Timp estimat pentru fiecare pas, afișat în cardul de progres din rail.
 *
 * Sunt estimări de completare, nu de procesare: cât îi ia șoferului să răspundă și să încarce,
 * nu cât așteaptă după noi sau după ARR. Altfel cifra ar fi o promisiune pe care n-o controlăm.
 */
const STEP_ESTIMATES: Record<string, string> = {
  eligibility: '~5 minute',
  pfa: '~10 minute',
  fiscal: '~5 minute',
  arr: '~10 minute',
  platforms: '~5 minute',
  vehicle: '~10 minute',
}

/** Estimarea pasului curent, sau `null` dacă nu mai e nimic de completat acolo. */
export function stepEstimate(step: StepView | null): string | null {
  if (step === null || step.state === 'approved' || step.state === 'pending_review') {
    return null
  }
  return STEP_ESTIMATES[step.key] ?? null
}

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
