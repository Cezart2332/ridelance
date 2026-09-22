import type {
  FiscalProfileAnswers,
  FiscalProfileConditions,
  FiscalProfileKey,
} from '../../services/fiscalProfile.service'

/**
 * Schema formularului de profil fiscal — oglinda lui `FiscalProfileSchema.cs`. Backendul e sursa
 * de adevăr și validează la fel; aici schema dă doar ordinea, textele și validarea inline.
 *
 * Nicio întrebare nu are varianta „Nu știu”, iar regimul (sistem real) nu se întreabă.
 */

export type QuestionKind = 'single' | 'date' | 'text' | 'textarea'

export interface QuestionOption {
  value: string
  label: string
}

/** Ce poate apărea într-un titlu: intervalul neacoperit și anul fiscal. */
export interface TitleContext {
  conditions: FiscalProfileConditions
  taxYear: number
}

export interface Question {
  key: FiscalProfileKey
  step: 1 | 2 | 3
  kind: QuestionKind
  title: string | ((context: TitleContext) => string)
  help?: string
  placeholder?: string
  options?: QuestionOption[]
  required: boolean
  visible?: (answers: FiscalProfileAnswers, conditions: FiscalProfileConditions) => boolean
}

const YES_NO: QuestionOption[] = [
  { value: 'yes', label: 'Da' },
  { value: 'no', label: 'Nu' },
]

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-')
  return day && month && year ? `${day}.${month}.${year}` : value
}

const employed = (a: FiscalProfileAnswers) => a.employment === 'full' || a.employment === 'part'

export const QUESTIONS: Question[] = [
  {
    key: 'dataCorrect',
    step: 1,
    kind: 'single',
    title: 'Datele de mai sus sunt corecte?',
    options: [
      { value: 'yes', label: 'Da' },
      { value: 'no', label: 'Nu, trebuie corectate' },
    ],
    required: true,
  },
  {
    key: 'correctionDetails',
    step: 1,
    kind: 'text',
    title: 'Ce trebuie corectat?',
    placeholder: 'Ex.: activitatea a început în iunie.',
    required: true,
    visible: (a) => a.dataCorrect === 'no',
  },
  {
    key: 'priorDocs',
    step: 1,
    kind: 'single',
    title: ({ conditions: c }) =>
      c.priorFrom ? `Ai documentele contabile pentru perioada ${formatDate(c.priorFrom)} – ${formatDate(c.priorTo)}?` : 'Ai documentele contabile pentru perioada lipsă?',
    options: [
      { value: 'have', label: 'Da, le am' },
      { value: 'will_get', label: 'Le voi obține' },
      { value: 'none', label: 'Nu le am' },
    ],
    required: true,
    visible: (_, c) => c.askPriorDocs,
  },
  {
    key: 'priorDocsLocation',
    step: 1,
    kind: 'single',
    title: 'Unde se află documentele?',
    options: [
      { value: 'me', label: 'La mine' },
      { value: 'prev_accountant', label: 'La contabilul anterior' },
    ],
    required: true,
    visible: (a, c) => c.askPriorDocs && (a.priorDocs === 'have' || a.priorDocs === 'will_get'),
  },

  {
    key: 'employment',
    step: 2,
    kind: 'single',
    title: 'Ai și un contract de muncă?',
    options: [
      { value: 'none', label: 'Nu' },
      { value: 'full', label: 'Da, normă întreagă' },
      { value: 'part', label: 'Da, part-time' },
    ],
    required: true,
  },
  { key: 'employmentStart', step: 2, kind: 'date', title: 'De când ești angajat?', required: true, visible: employed },
  {
    key: 'employmentEnd',
    step: 2,
    kind: 'date',
    title: 'Data încetării contractului',
    help: 'Lasă gol dacă ești încă angajat.',
    required: false,
    visible: employed,
  },
  { key: 'pensioner', step: 2, kind: 'single', title: 'Ești pensionar?', options: YES_NO, required: true },
  {
    key: 'pensionerSince',
    step: 2,
    kind: 'date',
    title: 'De când ești pensionar?',
    required: true,
    visible: (a) => a.pensioner === 'yes',
  },
  { key: 'student', step: 2, kind: 'single', title: 'Ești elev sau student?', options: YES_NO, required: true },
  {
    key: 'ownPensionSystem',
    step: 2,
    kind: 'single',
    title: 'Ești asigurat într-un sistem propriu de pensii?',
    help: 'Ex.: avocați, notari, cadre militare.',
    options: YES_NO,
    required: true,
  },
  {
    key: 'privateContact',
    step: 2,
    kind: 'single',
    title: 'Ai o situație specială pe care vrei s-o discuți cu contabilul?',
    help: 'Nu scrie aici date medicale.',
    options: [
      { value: 'yes', label: 'Da, vreau să fiu contactat' },
      { value: 'no', label: 'Nu' },
    ],
    required: true,
  },

  {
    key: 'otherIndependent',
    step: 3,
    kind: 'single',
    title: 'Mai ai și alte activități independente, în afara celor din RIDElance?',
    options: YES_NO,
    required: true,
  },
  {
    key: 'otherIndependentRecords',
    step: 3,
    kind: 'single',
    title: 'Ai evidența acestor activități?',
    options: YES_NO,
    required: true,
    visible: (a) => a.otherIndependent === 'yes',
  },
  {
    key: 'otherIncome',
    step: 3,
    kind: 'single',
    title: 'Ai venituri din chirii, dividende, investiții sau alte surse?',
    options: YES_NO,
    required: true,
  },
  {
    key: 'taxPaymentsMade',
    step: 3,
    kind: 'single',
    title: ({ taxYear }) => `Ai făcut deja plăți de taxe pentru ${taxYear}?`,
    options: YES_NO,
    required: true,
  },
  {
    key: 'carriedLosses',
    step: 3,
    kind: 'single',
    title: 'Ai pierderi fiscale reportate din anii anteriori?',
    options: YES_NO,
    required: true,
    visible: (_, c) => c.askCarriedLosses,
  },
  {
    key: 'cassOptIn',
    step: 3,
    kind: 'single',
    title: ({ taxYear }) => `Ai optat pentru plata CASS în ${taxYear}?`,
    options: YES_NO,
    required: true,
  },
  {
    key: 'crossBorder',
    step: 3,
    kind: 'single',
    title: ({ taxYear }) => `În ${taxYear} ai avut rezidență fiscală sau asigurare socială în alt stat?`,
    options: YES_NO,
    required: true,
  },
  { key: 'notes', step: 3, kind: 'textarea', title: 'Observații (opțional)', required: false },
]

export function questionTitle(question: Question, context: TitleContext): string {
  return typeof question.title === 'function' ? question.title(context) : question.title
}

export function isVisible(question: Question, answers: FiscalProfileAnswers, conditions: FiscalProfileConditions) {
  return question.visible ? question.visible(answers, conditions) : true
}

export function questionsForStep(step: number, answers: FiscalProfileAnswers, conditions: FiscalProfileConditions) {
  return QUESTIONS.filter((q) => q.step === step && isVisible(q, answers, conditions))
}

/**
 * Răspunsurile fără câmpurile ascunse. Se aplică la fiecare schimbare, ca o variantă abandonată
 * să nu rămână în `answers` (spec §4.6).
 */
export function normalizeAnswers(answers: FiscalProfileAnswers, conditions: FiscalProfileConditions): FiscalProfileAnswers {
  let result: FiscalProfileAnswers = { ...answers }
  // Două treceri: `priorDocsLocation` depinde de `priorDocs`, care poate dispărea în prima.
  for (let pass = 0; pass < 2; pass++) {
    for (const question of QUESTIONS) {
      if (!isVisible(question, result, conditions) && result[question.key] != null) {
        result = { ...result, [question.key]: null }
      }
    }
  }
  return result
}

export const ERROR_CHOOSE = 'Alege un răspuns.'
export const ERROR_DATE = 'Completează data.'
export const ERROR_TEXT = 'Completează câmpul.'

export function validateStep(
  step: number,
  answers: FiscalProfileAnswers,
  conditions: FiscalProfileConditions,
  requireAll = true,
): Partial<Record<FiscalProfileKey, string>> {
  const errors: Partial<Record<FiscalProfileKey, string>> = {}
  for (const question of questionsForStep(step, answers, conditions)) {
    const value = answers[question.key]
    const empty = value == null || String(value).trim() === ''
    if (empty && question.required && requireAll) {
      errors[question.key] = question.kind === 'single' ? ERROR_CHOOSE : question.kind === 'date' ? ERROR_DATE : ERROR_TEXT
    }
  }
  if (
    step === 2 &&
    answers.employmentStart &&
    answers.employmentEnd &&
    answers.employmentEnd < answers.employmentStart
  ) {
    errors.employmentEnd = 'Data încetării nu poate fi înainte de data angajării.'
  }
  return errors
}

export function validateAll(answers: FiscalProfileAnswers, conditions: FiscalProfileConditions, requireAll = true) {
  return { ...validateStep(1, answers, conditions, requireAll), ...validateStep(2, answers, conditions, requireAll), ...validateStep(3, answers, conditions, requireAll) }
}

/** Textul unui răspuns, pentru rezumat și istoric. */
export function answerLabel(key: string, value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  const question = QUESTIONS.find((q) => q.key === key)
  if (!question) return value
  if (question.kind === 'date') return formatDate(value)
  return question.options?.find((o) => o.value === value)?.label ?? value
}

/** Eticheta unui câmp, pentru istoricul reviziilor. */
export function fieldLabel(key: string, taxYear: number): string {
  const question = QUESTIONS.find((q) => q.key === key)
  if (!question) return key
  return questionTitle(question, {
    conditions: { askPriorDocs: true, priorFrom: null, priorTo: null, askCarriedLosses: true },
    taxYear,
  })
}

export const STEPS = ['Datele PFA', 'Situația ta', 'Alte venituri', 'Confirmare'] as const

export const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'Necompletat',
  DRAFT: 'Ciornă',
  COMPLETED: 'Completat',
}

export const ROLE_LABEL: Record<string, string> = {
  pfa: 'PFA',
  admin: 'Admin',
  accounting: 'Contabilitate',
  unknown: '—',
}
