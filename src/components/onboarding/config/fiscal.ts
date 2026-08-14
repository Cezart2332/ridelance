import { BCR_ONBOARDING_URL } from '../../../data/partners'
import type { DocumentSummary } from '../../../services/document.service'
import { onboardingService, type Step2State } from '../../../services/onboarding.service'
import type { MicroStepContext, MicroStepDef } from '../microStepTypes'

/**
 * Pasul 3 — Fiscal, bancă și semnături, ca întrebări.
 *
 * Trei zone care înainte stăteau una sub alta pe același ecran: TVA, contul bancar și Oblio.
 * Pachetul de semnături nu e o întrebare — îl alocăm noi (RL-02), deci pasul se termină cu o
 * trimitere la verificare și un ecran de așteptare.
 */

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

function hasDocument(c: MicroStepContext, categories: string[]): boolean {
  const newest = c.documents.filter((d) => categories.includes(d.category)).sort(byNewest)[0]
  if (!newest) return false
  return newest.status.toLowerCase() !== 'rejected' && newest.aiStatus !== 'Failed'
}

const step2Of = (c: MicroStepContext) => (c.resources.step2 as Step2State | undefined) ?? null

const field = (c: MicroStepContext, stepId: string, key: string): string => {
  const value = c.answers[`${stepId}.${key}`]
  return typeof value === 'string' ? value.trim() : ''
}

const selected = (c: MicroStepContext, stepId: string): string[] => {
  const value = c.answers[stepId]
  return Array.isArray(value) ? value : []
}

const EYEBROW = 'FISCAL'

const BANKS = [
  'BCR',
  'Banca Transilvania',
  'BRD',
  'ING Bank',
  'Raiffeisen Bank',
  'UniCredit Bank',
  'CEC Bank',
  'Alpha Bank',
  'OTP Bank',
  'First Bank',
  'Libra Internet Bank',
  'Revolut',
]

/** Cele șase acorduri cerute de Oblio, exact ca înainte — doar ambalajul s-a schimbat. */
const OBLIO_CONSENTS = [
  { value: 'accountCreationConsent', title: 'Crearea unui cont Oblio pe numele meu' },
  { value: 'dataProcessingConsent', title: 'Prelucrarea datelor pentru facturare' },
  { value: 'eInvoiceConsent', title: 'Emiterea facturilor electronice (e-Factura)' },
  { value: 'autoInvoicingConsent', title: 'Facturarea automată a curselor' },
  { value: 'ridelanceManagementConsent', title: 'Administrarea contului Oblio de către RIDElance' },
  { value: 'termsAcceptedConsent', title: 'Termenii și condițiile Oblio' },
]

const TVA_PROOF = ['CertificatTvaIntracomunitar']
const EXTRAS = ['ExtrasBancar']

export const fiscalMicroSteps: MicroStepDef[] = [
  // ── TVA ──
  {
    id: 'tva',
    macroStep: 'fiscal',
    kind: 'question',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'TVA',
    title: 'Ai cod de TVA intracomunitar (art. 317)?',
    choices: [
      { value: 'no', title: 'Nu' },
      { value: 'yes', title: 'Da' },
    ],
    // „Da" fără dovadă e respins de server, deci se trimite doar când documentul există.
    submit: async (value) => {
      if (value === 'no') await onboardingService.submitVat('No')
    },
    isDone: (c) => {
      const answer = step2Of(c)?.fiscal?.vatAnswer
      return answer === 'Yes' || answer === 'No' || c.answers.tva !== undefined
    },
  },
  {
    id: 'tva_document',
    macroStep: 'fiscal',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Certificat TVA',
    title: 'Încarcă certificatul de TVA intracomunitar',
    document: {
      category: 'CertificatTvaIntracomunitar',
      label: 'Certificat sau decizie ANAF',
      hint: 'Certificatul emis de ANAF sau decizia de înregistrare. Codul trebuie să fie lizibil.',
    },
    visibleWhen: (c) => c.answers.tva === 'yes' || step2Of(c)?.fiscal?.vatAnswer === 'Yes',
    isDone: (c) => hasDocument(c, TVA_PROOF),
  },

  // ── Cont bancar ──
  {
    id: 'cont_bancar',
    macroStep: 'fiscal',
    kind: 'question',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Cont bancar',
    title: 'Ai cont bancar pe PFA?',
    choices: [
      { value: 'yes', title: 'Da' },
      { value: 'no', title: 'Nu, am nevoie de unul' },
    ],
    isDone: (c) => {
      const bank = step2Of(c)?.bank
      return c.answers.cont_bancar !== undefined || Boolean(bank?.ibanMasked ?? bank?.bankName)
    },
  },
  {
    id: 'deschide_cont',
    macroStep: 'fiscal',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Deschide cont',
    title: 'Îți deschidem contul la BCR',
    lines: () => [
      'Beneficiezi de oferta dedicată parteneriatului RIDElance–BCR: contul îl poți folosi pentru încasările de la platforme, plata taxelor și administrarea activității PFA.',
      'Poți alege și altă bancă. După ce contul e activ, revino aici și încarcă extrasul.',
    ],
    action: {
      label: 'Deschide cont la BCR',
      busyLabel: 'Se deschide...',
      run: async () => {
        window.open(BCR_ONBOARDING_URL, '_blank', 'noopener,noreferrer')
      },
    },
    visibleWhen: (c) => c.answers.cont_bancar === 'no',
    // Deschiderea contului se întâmplă la bancă, nu la noi: ecranul nu are cum să afle singur.
    // Trece mai departe de îndată ce apare extrasul.
    isDone: (c) => hasDocument(c, EXTRAS),
  },
  {
    id: 'extras_bancar',
    macroStep: 'fiscal',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Extras de cont',
    title: 'Încarcă extrasul de cont',
    document: {
      category: 'ExtrasBancar',
      label: 'Extras de cont',
      hint: 'IBAN-ul și titularul trebuie să fie lizibile — de acolo citim contul.',
    },
    isDone: (c) => hasDocument(c, EXTRAS),
  },
  {
    id: 'banca',
    macroStep: 'fiscal',
    kind: 'text',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Banca',
    title: 'La ce bancă e contul?',
    fields: [
      {
        key: 'bankName',
        label: 'Bancă',
        options: BANKS.map((bank) => ({ value: bank, title: bank })),
      },
    ],
    persist: async (values) => {
      if (!values.bankName) return
      await onboardingService.submitBankDeclaration({ bankName: values.bankName })
    },
    isDone: (c) => Boolean(step2Of(c)?.bank?.bankName) || field(c, 'banca', 'bankName') !== '',
  },

  // ── Oblio ──
  {
    id: 'oblio_email',
    macroStep: 'fiscal',
    kind: 'text',
    eyebrow: EYEBROW,
    icon: 'user',
    railLabel: 'Email Oblio',
    title: 'Pe ce email deschidem contul de facturare?',
    fields: [{ key: 'email', label: 'Email cont Oblio', type: 'email' }],
    isDone: (c) => Boolean(step2Of(c)?.oblio?.accountEmail) || field(c, 'oblio_email', 'email') !== '',
  },
  {
    id: 'oblio_consimtaminte',
    macroStep: 'fiscal',
    kind: 'multi',
    eyebrow: EYEBROW,
    icon: 'shield',
    railLabel: 'Acorduri Oblio',
    title: 'Confirmă acordurile pentru facturare',
    choices: OBLIO_CONSENTS,
    // Toate șase: contul nu se poate crea cu jumătate din acorduri.
    minSelected: OBLIO_CONSENTS.length,
    isDone: (c) =>
      step2Of(c)?.oblio?.allConsentsAccepted === true ||
      selected(c, 'oblio_consimtaminte').length === OBLIO_CONSENTS.length,
  },
  {
    id: 'oblio_conectare',
    macroStep: 'fiscal',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'Conectare Oblio',
    title: 'Conectează contul de facturare',
    lines: () => [
      'Oblio e programul prin care îți emitem automat facturile pentru curse și le trimitem în e-Factura.',
      'La apăsare îți creăm contul și îl administrăm noi. Primul an e inclus în abonament; după, costul e al Oblio, comunicat înainte de reînnoire.',
      'Trimitem doar datele PFA-ului tău: denumire, CUI, sediu și contul bancar declarat.',
    ],
    action: {
      label: 'Conectează Oblio',
      busyLabel: 'Se conectează...',
      run: async (c) => {
        const consents = selected(c, 'oblio_consimtaminte')
        await onboardingService.acceptOblioConsents({
          accountEmail: field(c, 'oblio_email', 'email') || step2Of(c)?.oblio?.accountEmail || null,
          accountCreationConsent: consents.includes('accountCreationConsent'),
          dataProcessingConsent: consents.includes('dataProcessingConsent'),
          eInvoiceConsent: consents.includes('eInvoiceConsent'),
          autoInvoicingConsent: consents.includes('autoInvoicingConsent'),
          ridelanceManagementConsent: consents.includes('ridelanceManagementConsent'),
          termsAcceptedConsent: consents.includes('termsAcceptedConsent'),
        })
      },
    },
    isDone: (c) => step2Of(c)?.oblio?.allConsentsAccepted === true,
  },

  // ── Semnături: ale noastre, nu ale userului (RL-02) ──
  {
    id: 'trimite_verificare',
    macroStep: 'fiscal',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'Trimite la verificare',
    title: 'Trimite dosarul ca să pregătim semnăturile',
    lines: () => [
      'Pregătim împuternicirile și contractele pe care le semnezi o singură dată, apoi deblocăm pasul următor.',
    ],
    action: {
      label: 'Trimite pentru verificare',
      busyLabel: 'Se trimite...',
      run: () => onboardingService.submitFiscalForReview(),
    },
    visibleWhen: (c) => step2Of(c)?.canSubmitForReview === true || isAtAdmin(c),
    isDone: (c) => isAtAdmin(c) || step2Of(c)?.signature?.status === 'Completed',
  },
  {
    id: 'asteptare_semnaturi',
    macroStep: 'fiscal',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'În verificare',
    title: 'Dosarul e la noi',
    lines: (c) => {
      const reason = step2Of(c)?.signature?.rejectionReason
      if (reason) {
        return [`Am întors dosarul: ${reason}`, 'Corectează și trimite-l din nou.']
      }
      return [
        'Durează de obicei 1–2 zile lucrătoare. Nu mai ai nimic de făcut aici — te anunțăm pe email și în aplicație când e gata.',
        'Ai o întrebare între timp? Scrie-ne din butonul „Suport".',
      ]
    },
    visibleWhen: (c) => isAtAdmin(c) || Boolean(step2Of(c)?.signature?.rejectionReason),
    isDone: (c) => step2Of(c)?.signature?.status === 'Completed',
  },
]

/** Pasul e la admin: trimis spre alocarea pachetului și încă nefinalizat. */
function isAtAdmin(c: MicroStepContext): boolean {
  const signature = step2Of(c)?.signature
  return signature?.submittedForReviewAtUtc != null && signature.status !== 'Completed'
}
