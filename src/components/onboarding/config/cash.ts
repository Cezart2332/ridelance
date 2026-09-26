import type { CashPreference } from '../../../shared/accounting/api/types'
import type { MicroStepContext, MicroStepDef } from '../microStepTypes'

/**
 * Pasul 3 — întrebarea despre plățile în numerar (spec contabilitate F7).
 *
 * Răspunsul se salvează prin `accountingApi`. Cât timp implementarea e mock-ul din memorie
 * (Partea A), întrebarea apare doar în dev: în producție un răspuns salvat în mock s-ar pierde la
 * reîncărcare. Cu `VITE_ACCOUNTING_API=http` (B9) apare peste tot.
 */
export const CASH_QUESTION_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ACCOUNTING_API === 'http'

/** Import la cerere: modulul de contabilitate (cu mock-ul lui) nu intră în bundle-ul onboardingului. */
const loadAccountingApi = () => import('../../../shared/accounting/api/accountingApi').then((module) => module.accountingApi)

/**
 * TEXT PROVIZORIU pentru pop-up-uri. Spec-ul cere „textul exact din documentul clientului”, care
 * nu e încă în repo; se înlocuiește aici, fără alte modificări.
 */
export const CASH_POPUPS = {
  yes: {
    title: 'Plăți în numerar',
    message:
      'Pentru cursele plătite în numerar ai nevoie de casă de marcat fiscalizată. Contabilul RIDElance verifică dovada de fiscalizare și abia după verificare activăm plățile în numerar. Până atunci, nu accepta curse cu plata în numerar.',
  },
  no: {
    title: 'Doar plăți online',
    message:
      'Vei lucra doar cu plăți online prin platformă. Dacă vrei mai târziu să accepți și numerar, spune-ne: activarea cere casă de marcat fiscalizată și verificarea contabilului.',
  },
}

const cashPreferenceOf = (c: MicroStepContext) => (c.resources.cashPreference as CashPreference | null | undefined) ?? null

export const cashMicroStep: MicroStepDef = {
  id: 'plati_numerar',
  macroStep: 'fiscal',
  kind: 'question',
  eyebrow: 'FISCAL',
  icon: 'folder',
  railLabel: 'Plăți în numerar',
  title: 'Vrei să accepți și curse pentru care pasagerul plătește direct în numerar?',
  subtitle: 'Nu ne referim la cursele achitate cu cardul direct în aplicația Uber/Bolt.',
  choices: [
    { value: 'yes', title: 'DA, vreau să accept și numerar', acknowledge: CASH_POPUPS.yes },
    { value: 'no', title: 'NU, voi lucra doar cu plăți online prin platformă', acknowledge: CASH_POPUPS.no },
  ],
  visibleWhen: () => CASH_QUESTION_ENABLED,
  submit: async (value) => {
    await (await loadAccountingApi()).onboarding.setCashPreference({ cashRequested: value === 'yes' })
  },
  isDone: (c) => c.answers.plati_numerar !== undefined || cashPreferenceOf(c) !== null,
}

/** Resursa din care `isDone` află răspunsul salvat anterior. */
export const cashPreferenceResource = {
  key: 'cashPreference',
  fetch: async () => (CASH_QUESTION_ENABLED ? (await loadAccountingApi()).onboarding.getCashPreference() : null),
}
