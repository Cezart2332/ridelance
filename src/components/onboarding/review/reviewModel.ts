import type { DocumentSummary } from '../../../services/document.service'
import type { OnboardingState, OnboardingStep } from '../../../services/onboarding.service'
import { requirementsOf } from '../documentRequirements'
import { isApprovedByTeam, isDocumentRejected } from '../documentVerdict'
import type { MicroStepView } from '../microStepTypes'

/**
 * Ecranul de după predarea unui pas: în verificare, aprobat sau întors cu corecturi.
 *
 * Starea vine de la server (`step.state`), nu din `StepView`: acolo „în verificare" înseamnă și
 * „actele încă se citesc automat", iar asta se întâmplă în mijlocul pasului, după fiecare
 * încărcare. Pe ea, ecranul ar fi apărut peste întrebările rămase.
 */
export type ReviewMode = 'pending' | 'approved' | 'correction'

/** Cât durează verificarea și când lucrează echipa de onboarding. */
export const REVIEW_ETA = '~30 minute'
export const REVIEW_HOURS = { days: 'Luni – Vineri', time: '10:00 – 16:00' } as const

/**
 * Pașii care se verifică în zeci de minute, pe documente. „ARR & Cont Flotă" are ecranul lui de
 * stare (autorizația durează zile și trece prin mai multe etape), deci rămâne pe el.
 */
const REVIEW_STEPS = new Set(['eligibility', 'pfa', 'fiscal'])

/** Ecranele la care omul are ceva de dat; rezumatul și ecranele de citit nu țin pasul deschis. */
const INPUT_KINDS = new Set(['question', 'upload', 'text', 'multi', 'action'])

export function reviewModeOf(
  step: OnboardingStep | null,
  state: OnboardingState | null,
  microSteps: MicroStepView[],
): ReviewMode | null {
  if (!step || !REVIEW_STEPS.has(step.key)) return null

  if (step.key === 'pfa') {
    // Înființarea unui PFA nou durează zile și are etapele ei, pe ecranul dosarului.
    if (state?.registrationType !== 'AmPfa') return null
    // Dosarul respins în întregime are ecranul lui, cu „Completează din nou".
    if (step.state === 'rejected' && state.pfaStatus === 'Rejected') return null
  }

  switch (step.state) {
    case 'pending_admin':
      // Predat, dar cu un ecran încă necompletat: omul rămâne în parcurs, nu pe „așteaptă".
      return microSteps.filter((view) => INPUT_KINDS.has(view.def.kind)).every((view) => view.done)
        ? 'pending'
        : null
    case 'rejected':
      return 'correction'
    case 'completed':
      return 'approved'
    default:
      return null
  }
}

export interface ReviewDocument {
  /** Categoria în care s-a încărcat efectiv — pe ea se caută ecranul de reîncărcare. */
  category: string
  label: string
  status: 'received' | 'verified' | 'rejected'
  /** De ce a fost respins. Motivul scris de om bate rezumatul citirii automate. */
  note: string | null
}

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

/** Documentele pasului, câte unul pe cerință: cel mai nou. Cerințele fără document nu apar. */
export function reviewDocumentsOf(
  stepKey: string,
  documents: DocumentSummary[],
  mode: ReviewMode,
): ReviewDocument[] {
  const current = documents.filter((d) => d.isUserFacing !== false && d.isSuperseded !== true)

  return requirementsOf(stepKey).flatMap((requirement) => {
    const categories = [requirement.category, ...(requirement.alsoAccepts ?? [])]
    const newest = current.filter((d) => categories.includes(d.category)).sort(byNewest)[0]
    if (!newest) return []

    const rejected = isDocumentRejected(newest)
    return [
      {
        category: newest.category,
        label: requirement.label,
        // Un pas aprobat își ia actele cu el, chiar dacă unul n-a fost bifat separat.
        status: rejected ? 'rejected' : isApprovedByTeam(newest) || mode === 'approved' ? 'verified' : 'received',
        note: rejected ? (newest.reviewNote ?? newest.aiSummary ?? null) : null,
      },
    ]
  })
}
