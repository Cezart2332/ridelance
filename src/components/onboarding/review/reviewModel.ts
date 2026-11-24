import type { DocumentSummary } from '../../../services/document.service'
import type {
  ArrFleetState,
  ArrFleetStatus,
  OnboardingState,
  OnboardingStep,
  Step2State,
} from '../../../services/onboarding.service'
import { requirementsOf } from '../documentRequirements'
import { isApprovedByTeam, isDocumentRejected } from '../documentVerdict'

/**
 * Ecranul de după predarea unui pas: în verificare, aprobat sau întors cu corecturi.
 *
 * Starea vine de la server (`step.state`), nu din `StepView`: acolo „în verificare" înseamnă și
 * „actele încă se citesc automat", iar asta se întâmplă în mijlocul pasului, după fiecare
 * încărcare. Pe ea, ecranul ar fi apărut peste întrebările rămase.
 *
 * Fiecare pas își spune propriile etape. „Verificare RIDElance" e adevărat pentru acte, dar la
 * pasul fiscal așteptarea e pachetul de semnături, la înființare e ONRC-ul, iar la ARR sunt
 * autorizația, copia conformă și ecusoanele.
 */
export type ReviewMode = 'pending' | 'approved' | 'correction'

export type TrailState = 'done' | 'current' | 'failed' | 'todo' | 'next'

export interface TrailItem {
  label: string
  state: TrailState
  /** Numărul din cercul unei etape neîncepute: al pasului, când etapa e pasul următor. */
  number?: number
}

export interface ReviewPlan {
  mode: ReviewMode
  trail: TrailItem[]
  /** Titlul cardului, când cel generic („Am primit documentele tale") n-ar fi adevărat. */
  title: string | null
  /** Singurul rând de sub titlu, cât pasul e la noi. */
  note: string | null
  /** De ce a fost întors pasul, când nu e un act anume. */
  reason: string | null
  /** Cât durează partea noastră, dacă o știm. Fără cifră, rail-ul arată doar programul. */
  eta: string | null
}

export const REVIEW_HOURS = { days: 'Luni – Vineri', time: '10:00 – 16:00' } as const

interface PlanInput {
  step: OnboardingStep | null
  state: OnboardingState | null
  documents: DocumentSummary[]
  resources: Record<string, unknown>
  /** Eticheta pasului următor, sau „Abonament" după ultimul pas. */
  following: string
  /** Numărul pasului următor, ca în rail. Null după ultimul pas. */
  followingNumber: number | null
  /** Pasul următor e deja deschis. */
  nextOpen: boolean
}

export function reviewPlanOf({ step, state, documents, resources, following, followingNumber, nextOpen }: PlanInput): ReviewPlan | null {
  if (!step) return null

  const mode = modeOf(step, documents)
  if (!mode) return null

  const nextNote = nextOpen ? null : 'Pasul următor se deschide singur după aprobare.'

  switch (step.key) {
    case 'eligibility':
      return {
        mode,
        trail: verificationTrail(mode, 'Documente primite', 'Verificare RIDElance', following, followingNumber),
        title: null,
        note: mode === 'pending' ? nextNote : null,
        reason: null,
        eta: '~30 minute',
      }

    case 'pfa': {
      // Dosarul respins în întregime are ecranul lui, cu „Completează din nou".
      if (step.state === 'rejected' && state?.pfaStatus === 'Rejected') return null

      if (state?.registrationType === 'NuAmPfa') {
        return {
          mode,
          trail: verificationTrail(mode, 'Dosar semnat', 'Înregistrare la ONRC', following, followingNumber),
          title: mode === 'pending' ? 'Dosarul de înființare e la noi' : null,
          note: mode === 'pending' ? 'Te anunțăm când PFA-ul e înregistrat.' : null,
          reason: null,
          eta: null,
        }
      }

      return {
        mode,
        trail: verificationTrail(mode, 'Documente primite', 'Verificare RIDElance', following, followingNumber),
        title: null,
        note: mode === 'pending' ? nextNote : null,
        reason: null,
        eta: '~30 minute',
      }
    }

    case 'fiscal': {
      const signature = (resources.step2 as Step2State | undefined)?.signature
      return {
        mode,
        trail: verificationTrail(mode, 'Date trimise', 'Pachetul de semnături', following, followingNumber),
        title: mode === 'pending' ? 'Pregătim pachetul de semnături' : null,
        note: mode === 'pending' ? 'Îl primești pe email, îl semnezi și ni-l trimiți înapoi tot pe email.' : null,
        reason: signature?.rejectionReason ?? null,
        eta: '1–2 zile lucrătoare',
      }
    }

    case 'arr_fleet': {
      const arr = resources.arrFleet as ArrFleetState | undefined
      return {
        mode,
        trail: arrTrail(mode, arr?.status ?? null),
        title: null,
        note:
          mode === 'pending'
            ? 'Autorizația, copia conformă și ecusoanele le primești în dashboard, la Documente.'
            : null,
        reason: arr?.reopenedReason ?? null,
        eta: null,
      }
    }

    default:
      return null
  }
}

/**
 * Starea ecranului. Un act respins cât pasul e la noi îl trimite tot la corecturi: altfel omul ar
 * vedea „în verificare" peste un act pe care trebuie să-l refacă.
 */
function modeOf(step: OnboardingStep, documents: DocumentSummary[]): ReviewMode | null {
  switch (step.state) {
    case 'pending_admin':
      return stepDocuments(step.key, documents).some(isDocumentRejected) ? 'correction' : 'pending'
    case 'rejected':
      return 'correction'
    case 'completed':
      return 'approved'
    default:
      return null
  }
}

/** Trei etape: ce a trimis omul, ce facem noi, ce urmează. */
function verificationTrail(
  mode: ReviewMode,
  sent: string,
  review: string,
  following: string,
  followingNumber: number | null,
): TrailItem[] {
  return [
    { label: sent, state: 'done' },
    { label: review, state: mode === 'approved' ? 'done' : mode === 'correction' ? 'failed' : 'current' },
    { label: following, state: mode === 'approved' ? 'next' : 'todo', number: followingNumber ?? undefined },
  ]
}

/** Etapele procedurii ARR, în ordinea în care le obține agentul. */
const ARR_ORDER: ArrFleetStatus[] = [
  'Draft',
  'DocumentsSubmitted',
  'InReview',
  'InProgress',
  'AuthorizationIssued',
  'CertifiedCopyIssued',
  'BadgesIssued',
  'Completed',
]

function arrTrail(mode: ReviewMode, status: ArrFleetStatus | null): TrailItem[] {
  const reached = (target: ArrFleetStatus) =>
    mode === 'approved' || (status !== null && ARR_ORDER.indexOf(status) >= ARR_ORDER.indexOf(target))

  const milestones: TrailItem[] = [
    { label: 'Autorizație ARR', state: reached('AuthorizationIssued') ? 'done' : 'todo' },
    { label: 'Copie conformă', state: reached('CertifiedCopyIssued') ? 'done' : 'todo' },
    { label: 'Ecusoane', state: reached('BadgesIssued') ? 'done' : 'todo' },
  ]

  // Prima etapă neobținută e cea la care lucrăm; la corecturi, acolo s-a oprit.
  const current = milestones.find((item) => item.state === 'todo')
  if (current) current.state = mode === 'correction' ? 'failed' : 'current'

  return [{ label: 'Documente primite', state: 'done' }, ...milestones]
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

/** Actele pasului, câte unul pe cerință: cel mai nou, fără cele înlocuite. */
function stepDocuments(stepKey: string, documents: DocumentSummary[]): DocumentSummary[] {
  const current = documents.filter((d) => d.isUserFacing !== false && d.isSuperseded !== true)

  return requirementsOf(stepKey).flatMap((requirement) => {
    const categories = [requirement.category, ...(requirement.alsoAccepts ?? [])]
    const newest = current.filter((d) => categories.includes(d.category)).sort(byNewest)[0]
    return newest ? [newest] : []
  })
}

/** Documentele pasului cu verdictul lor. Cerințele fără document nu apar. */
export function reviewDocumentsOf(
  stepKey: string,
  documents: DocumentSummary[],
  mode: ReviewMode,
): ReviewDocument[] {
  const labels = new Map(
    requirementsOf(stepKey).flatMap((r) => [r.category, ...(r.alsoAccepts ?? [])].map((c) => [c, r.label] as const)),
  )

  return stepDocuments(stepKey, documents).map((doc) => {
    const rejected = isDocumentRejected(doc)
    return {
      category: doc.category,
      label: labels.get(doc.category) ?? doc.category,
      // Un pas aprobat își ia actele cu el, chiar dacă unul n-a fost bifat separat.
      status: rejected ? 'rejected' : isApprovedByTeam(doc) || mode === 'approved' ? 'verified' : 'received',
      note: rejected ? (doc.reviewNote ?? doc.aiSummary ?? null) : null,
    }
  })
}
