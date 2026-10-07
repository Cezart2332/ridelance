import type { FiscalProfileAnswers, FiscalProfileKey } from '../../services/fiscalProfile.service'

/**
 * Profilul fiscal: trei situații, oglinda lui `FiscalProfileSchema.cs`. Doar ele schimbă CAS și
 * CASS pentru un șofer ridesharing (Codul fiscal art. 150, 154, 174).
 */

export interface Situation {
  key: FiscalProfileKey
  label: string
}

export const SITUATIONS: Situation[] = [
  { key: 'pensioner', label: 'Pensionar' },
  { key: 'student', label: 'Student (sub 26 de ani)' },
  { key: 'employedFullTime', label: 'Angajat cu normă întreagă' },
]

/** Situațiile bifate. Gol = „Niciuna” sau încă nealeasă — vezi `isAnswered`. */
export function selectedSituations(answers: FiscalProfileAnswers): FiscalProfileKey[] {
  return SITUATIONS.filter((s) => answers[s.key] === 'yes').map((s) => s.key)
}

/** Toate trei au răspuns: profilul se poate confirma. */
export function isAnswered(answers: FiscalProfileAnswers): boolean {
  return SITUATIONS.every((s) => answers[s.key] === 'yes' || answers[s.key] === 'no')
}

/** Răspunsurile din situațiile bifate; restul devin `no`. Lista goală înseamnă „Niciuna”. */
export function answersFrom(selected: FiscalProfileKey[]): FiscalProfileAnswers {
  return Object.fromEntries(SITUATIONS.map((s) => [s.key, selected.includes(s.key) ? 'yes' : 'no'])) as FiscalProfileAnswers
}

/** Eticheta scurtă, ca pe server: „Pensionar · Angajat” sau „Standard”. */
export function situationLabel(answers: FiscalProfileAnswers | null | undefined): string {
  if (!answers || !isAnswered(answers)) return '—'
  const parts = [
    answers.pensioner === 'yes' ? 'Pensionar' : null,
    answers.student === 'yes' ? 'Student' : null,
    answers.employedFullTime === 'yes' ? 'Angajat' : null,
  ].filter(Boolean)
  return parts.length === 0 ? 'Standard' : parts.join(' · ')
}

/** Textul unui răspuns, pentru istoric. */
export function answerLabel(_key: string, raw: string | number | null | undefined): string {
  if (raw == null || raw === '') return '—'
  return raw === 'yes' ? 'Da' : raw === 'no' ? 'Nu' : String(raw)
}

/** Eticheta unui câmp, pentru istoricul reviziilor; cheile vechiului formular rămân ca atare. */
export function fieldLabel(key: string): string {
  return SITUATIONS.find((s) => s.key === key)?.label ?? key
}

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
