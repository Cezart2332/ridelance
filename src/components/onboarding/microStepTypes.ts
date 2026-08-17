import type { DocumentSummary } from '../../services/document.service'
import type { EligibilityProfile, OnboardingState } from '../../services/onboarding.service'

/**
 * Micro-pașii: un ecran are UN singur lucru de făcut. O întrebare, un document, un set mic de
 * câmpuri înrudite, o acțiune. Niciodată două documente, niciodată un formular întreg.
 *
 * Structura e declarativă intenționat: un pas nou înseamnă un fișier de config, nu componente noi.
 * Altfel ajungem înapoi la peretele de câmpuri pe care îl desființăm.
 *
 * Ce NU ține de config: verdictele. Eligibilitatea se decide pe backend, din documente
 * (`EligibilityRules.cs`), nu din răspunsurile de aici. Întrebările dau ritm și context; adevărul
 * vine din OCR.
 */

export type MicroStepKind =
  /** O alegere din 2–5 variante, ca grilă de carduri. */
  | 'question'
  /** 1–4 câmpuri înrudite pe același card (nume+telefon, email+parolă). */
  | 'text'
  /** Bifuri multiple: platformele alese, consimțămintele. */
  | 'multi'
  /** Un document. */
  | 'upload'
  /** Un buton care cheamă un serviciu; „gata" se citește din starea serverului. */
  | 'action'
  /** Ecran read-only: ce urmează, cât costă, ce așteptăm de la admin. */
  | 'info'
  /** Recapitularea pasului. */
  | 'summary'

/**
 * O opțiune de răspuns. Doar textul răspunsului — o întrebare de Da/Nu nu are nevoie de o
 * propoziție care să explice ce înseamnă „Da".
 */
export interface ChoiceDef {
  value: string
  title: string
  /**
   * Varianta există, dar nu se poate alege încă. Rămâne pe ecran, gri, cu explicație — ascunsă
   * ar face utilizatorul să caute o opțiune despre care i s-a spus că vine.
   */
  disabled?: boolean
  /** Eticheta de lângă o variantă dezactivată: „În curând". */
  badge?: string
  /** Ce se explică la hover pe o variantă dezactivată. Obligatoriu împreună cu `disabled`. */
  disabledReason?: string
}

/**
 * Tot ce poate citi un predicat de micro-pas. `answers` sunt răspunsurile din sesiunea curentă;
 * restul vine de la server, prin `useOnboarding()`. Un micro-pas nu are voie să depindă de altceva
 * — de asta se poate relua fluxul după refresh fără să stocăm poziția nicăieri.
 */
export interface MicroStepContext {
  answers: MicroStepAnswers
  documents: DocumentSummary[]
  eligibility: EligibilityProfile | null
  state: OnboardingState | null
  /**
   * Sub-stările pașilor (`step2`, `arr`, `platforms`, `vehicle`), încărcate prin
   * `MICRO_RESOURCES`. Un predicat le citește ca să știe ce a confirmat serverul — altfel
   * „dosarul e generat?" ar trebui ghicit din răspunsurile din sesiune.
   */
  resources: Record<string, unknown>
}

/**
 * Un răspuns e fie o valoare (alegere, câmp de text), fie o listă (bifuri multiple).
 * Câmpurile unui ecran `text` se cheie `${def.id}.${field.key}`.
 */
export type MicroStepAnswer = string | string[]

export type MicroStepAnswers = Record<string, MicroStepAnswer | undefined>

/** Un câmp dintr-un ecran `text`. Cu `options` devine select — listele lungi nu sunt carduri. */
export interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'password' | 'number'
  /** Text sau funcție de context — pe ramura „am deja cont" indiciul e altul decât pe cealaltă. */
  placeholder?: string | ((c: MicroStepContext) => string | undefined)
  /** O linie sub câmp, doar când chiar lămurește ceva. */
  helper?: string | ((c: MicroStepContext) => string | undefined)
  optional?: boolean
  options?: ChoiceDef[]

  /**
   * Valoarea cu care pornește câmpul, când sesiunea încă n-are un răspuns pentru el.
   *
   * Precompletările citesc TOATE de aici, din starea serverului — de asta emailul de la Oblio și
   * cel de la Uber Fleet nu mai pot ajunge să vină din surse diferite (spec fix-uri §5).
   */
  initialValue?: (c: MicroStepContext) => string

  /**
   * Ce e greșit în valoarea curentă, sau `null` dacă e bună. Rulează și pe `Continuă`: un câmp
   * invalid ține butonul dezactivat, iar motivul se afișează sub el.
   */
  validate?: (value: string) => string | null

  /** Parolele primesc buton de afișare și indicator de putere. */
  strengthMeter?: boolean
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

  /** `kind === 'question' | 'multi'` */
  choices?: ChoiceDef[]

  /** `kind === 'multi'` — câte bifuri sunt necesare ca să poți continua. Implicit 1. */
  minSelected?: number

  /** `kind === 'text'` — 1–4 câmpuri. Mai multe înseamnă că ecranul face două lucruri. */
  fields?: FieldDef[]

  /**
   * `kind === 'text'` — salvarea câmpurilor. Rulează prin `useAutosave`: la tastare (debounce) și
   * la ieșirea din câmp, iar „Continuă" doar forțează flush-ul. Cardurile cu mai multe câmpuri nu
   * au voie să piardă ce s-a tastat dacă userul închide tabul.
   */
  persist?: (values: Record<string, string>, c: MicroStepContext) => Promise<unknown>

  /** `kind === 'action'` — butonul ESTE ecranul. */
  action?: {
    label: string
    busyLabel: string
    run: (c: MicroStepContext) => Promise<unknown>
  }

  /**
   * `kind === 'info'` — conținutul, ca linii de text. Deliberat fără JSX: configurile rămân
   * fișiere de date, iar un ecran care ar avea nevoie de markup bogat e semn că nu e un ecran
   * de onboarding.
   */
  lines?: (c: MicroStepContext) => string[]

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

  /**
   * Un bloc bogat, randat sub textul ecranului. Config-ul rămâne date: numește componenta, nu o
   * construiește. Registrul e în `micro/microStepSlots.tsx`.
   *
   * Există pentru cazurile în care ecranul chiar are nevoie de mai mult decât text și un buton —
   * codul QR al băncii, cardul cu contul ARR. Alternativa (o pagină proprie pentru fiecare) e
   * exact ce a produs ramurile divergente pe care le reparăm.
   */
  slot?: MicroStepSlot

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

/**
 * Blocurile bogate pe care le poate cere un micro-pas. Închise ca uniune, nu string liber:
 * fiecare apare pe mai multe ramuri, iar un typo ar face-o să dispară tăcut de pe una.
 */
export type MicroStepSlot =
  /** Butonul de deschidere cont la bancă + codul QR cu același link. */
  | 'bankAccountCta'
  /** Contul de trezorerie ARR pentru județul ales, cu butoane de copiere. */
  | 'arrPaymentDetails'
  /** Dosarul generat: previzualizare, descărcare și starea „descărcat cel puțin o dată". */
  | 'arrDossier'
  | 'vehicleDossier'

/**
 * Sloturile care ȚIN pasul pe loc: ecranul nu se poate părăsi până când serverul nu confirmă că
 * lucrul din slot s-a făcut.
 *
 * Restul nu blochează, și e important că nu blochează: deschiderea contului la bancă se întâmplă
 * la bancă, iar cardul cu contul ARR e informativ. Un ecran care așteaptă la infinit o confirmare
 * pe care n-o poate primi e o fundătură.
 */
export const BLOCKING_SLOTS = new Set<MicroStepSlot>(['arrDossier', 'vehicleDossier'])

/** Un micro-pas filtrat, cu poziția lui în parcursul real al utilizatorului. */
export interface MicroStepView {
  def: MicroStepDef
  index: number
  done: boolean
  current: boolean
}
