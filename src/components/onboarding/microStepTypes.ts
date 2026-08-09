import type { DocumentSummary } from '../../services/document.service'
import type { EligibilityProfile, OnboardingState } from '../../services/onboarding.service'

/**
 * Micro-pașii: un ecran = o întrebare SAU un upload. Niciodată amândouă, niciodată două documente.
 *
 * Structura e declarativă intenționat. Pasul 1 e implementat integral aici, iar pașii 2–6 se vor
 * migra scriind fișiere de config, nu componente noi — altfel ajungem la același perete de câmpuri
 * pe care îl desființăm acum.
 *
 * Ce NU ține de config: verdictele. Eligibilitatea se decide pe backend, din documente
 * (`EligibilityRules.cs`), nu din răspunsurile de aici. Întrebările dau ritm și context; adevărul
 * vine din OCR.
 */

export type MicroStepKind = 'question' | 'upload' | 'summary'

/**
 * O opțiune de răspuns. Doar textul răspunsului — o întrebare de Da/Nu nu are nevoie de o
 * propoziție care să explice ce înseamnă „Da".
 */
export interface ChoiceDef {
  value: string
  title: string
}

/**
 * Tot ce poate citi un predicat de micro-pas. `answers` sunt răspunsurile din sesiunea curentă;
 * restul vine de la server, prin `useOnboarding()`. Un micro-pas nu are voie să depindă de altceva
 * — de asta se poate relua fluxul după refresh fără să stocăm poziția nicăieri.
 */
export interface MicroStepContext {
  answers: Record<string, string>
  documents: DocumentSummary[]
  eligibility: EligibilityProfile | null
  state: OnboardingState | null
}

export interface MicroStepDef {
  id: string
  /** Cheia pasului mare, exact ca în `OnboardingStepCatalog.cs`: `eligibility`, `pfa`, `fiscal`... */
  macroStep: string
  kind: MicroStepKind
  /** Supratitlul cardului, ex. `ELIGIBILITATE`. */
  eyebrow: string
  icon: MicroStepIcon
  /**
   * Singurul text al ecranului. Întrebarea sau instrucțiunea, atât — fără subtitlu explicativ:
   * o frază gri sub titlu nu adaugă nimic, doar face ecranul să pară aglomerat.
   */
  title: string
  /** Eticheta scurtă din checklist: `Vârstă`, `Permis`, `Atestat`. */
  railLabel: string

  /** `kind === 'question'` */
  choices?: ChoiceDef[]

  /**
   * Ce trimite răspunsul la server, dacă răspunsul chiar contează dincolo de parcurs. Rulează la
   * „Continuă". Majoritatea întrebărilor nu au așa ceva — răspunsul lor se poate citi din
   * documente, deci nu are rost stocat de două ori.
   */
  submit?: (value: string) => Promise<unknown>

  /** `kind === 'upload'` — categoria e una reală din `DocumentCategory.cs`. */
  document?: {
    category: string
    label: string
    hint: string
    /** Documentul are date pe ambele fețe: se cer două imagini, combinate într-un PDF. */
    requireBothSides?: boolean
  }

  /** Micro-pasul apare doar dacă predicatul e adevărat. Absent = mereu vizibil. */
  visibleWhen?: (c: MicroStepContext) => boolean

  /**
   * Micro-pasul e deja rezolvat. Se citește din datele serverului ori de câte ori se poate, ca
   * revenirea după refresh să aterizeze pe ecranul corect fără să fi stocat poziția nicăieri.
   */
  isDone: (c: MicroStepContext) => boolean
}

/** Cheile din `iconMap` (`micro/microStepIcons.tsx`) — nu string liber, ca să nu apară typo-uri. */
export type MicroStepIcon = 'user' | 'idCard' | 'car' | 'shield' | 'checkCircle' | 'folder'

/** Un micro-pas filtrat, cu poziția lui în parcursul real al utilizatorului. */
export interface MicroStepView {
  def: MicroStepDef
  index: number
  done: boolean
  current: boolean
}
