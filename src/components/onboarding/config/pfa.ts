import type { DocumentSummary } from '../../../services/document.service'
import { pfaService } from '../../../services/pfa.service'
import type { MicroStepContext, MicroStepDef } from '../microStepTypes'

/**
 * Pasul 2 — PFA, ca întrebări.
 *
 * Înainte, pasul era două tab-uri („Am PFA" / „Nu am PFA") cu formulare diferite dedesubt. Un tab
 * e o alegere pe care userul trebuie s-o observe; o întrebare e o alegere pe care nu are cum s-o
 * rateze. Restul ecranelor se filtrează din răspuns prin `visibleWhen` — asta e rutarea.
 *
 * Ramura „Nu am PFA" se oprește aici intenționat: dosarul de înființare are semnătură, blocare și
 * pași proprii (`/onboarding/pfa/date-personale`), deci rămâne un flux separat. Ecranele de aici
 * duc doar până la plata avansului — dosarul se deschide după ea, nu înaintea ei.
 */

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

function hasDocument(c: MicroStepContext, categories: string[]): boolean {
  const newest = c.documents.filter((d) => categories.includes(d.category)).sort(byNewest)[0]
  if (!newest) return false
  return newest.status.toLowerCase() !== 'rejected' && newest.aiStatus !== 'Failed'
}

const CERTIFICAT = ['CertificatInregistrare']
const CONSTATATOR = ['CertificatConstatator']

const EYEBROW = 'PFA'

/** Dosarul e deschis pe ramura respectivă — răspunsul e deja dat, la server. */
const registeredAs = (c: MicroStepContext, type: 'AmPfa' | 'NuAmPfa') =>
  c.state?.registrationType === type

const answeredYes = (c: MicroStepContext) =>
  c.answers.has_pfa === 'yes' || registeredAs(c, 'AmPfa')

const answeredNo = (c: MicroStepContext) =>
  c.answers.has_pfa === 'no' || registeredAs(c, 'NuAmPfa')

/** Textul din `answers` pentru un câmp al unui ecran `text`. */
const field = (c: MicroStepContext, stepId: string, key: string): string => {
  const value = c.answers[`${stepId}.${key}`]
  return typeof value === 'string' ? value.trim() : ''
}

export const pfaMicroSteps: MicroStepDef[] = [
  {
    id: 'has_pfa',
    macroStep: 'pfa',
    kind: 'question',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Ai PFA?',
    title: 'Ai deja un PFA înființat?',
    choices: [
      { value: 'yes', title: 'Da, am PFA' },
      { value: 'no', title: 'Nu, vreau să înființez unul' },
    ],
    // La revenire, dosarul deschis răspunde deja: nu punem întrebarea a doua oară.
    isDone: (c) => c.answers.has_pfa !== undefined || c.state?.registrationType != null,
  },

  // ── Ramura „Am PFA" ──
  {
    id: 'pfa_contact',
    macroStep: 'pfa',
    kind: 'text',
    eyebrow: EYEBROW,
    icon: 'user',
    railLabel: 'Date de contact',
    title: 'La ce număr te putem suna?',
    // Doar telefonul. Numele îl citim din buletinul încărcat la pasul de eligibilitate, deci
    // cerut și aici ar fi a doua sursă pentru aceeași informație — exact ce desființează fluxul
    // document-first. Vezi `ExtractedFieldApplier.ApplyToUserAsync`.
    fields: [{ key: 'telefon', label: 'Telefon', type: 'tel', placeholder: '07XX XXX XXX' }],
    // Dosarul se creează cu datele de contact; documentele se încarcă pe el, la ecranele următoare.
    persist: async (values) => {
      if (!values.telefon?.trim()) return
      await pfaService.create({
        registrationType: 'AmPfa',
        phone: values.telefon.trim(),
        isOwner: false,
      })
    },
    visibleWhen: answeredYes,
    isDone: (c) =>
      c.state?.pfaRegistrationId != null || field(c, 'pfa_contact', 'telefon') !== '',
  },
  {
    id: 'certificat_inregistrare',
    macroStep: 'pfa',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Certificat de înregistrare',
    title: 'Încarcă certificatul de înregistrare',
    document: {
      category: 'CertificatInregistrare',
      label: 'Certificat de înregistrare',
      hint: 'Documentul de la ONRC. CUI-ul și denumirea trebuie să fie lizibile — le citim de acolo.',
    },
    visibleWhen: answeredYes,
    isDone: (c) => hasDocument(c, CERTIFICAT),
  },
  {
    id: 'certificat_constatator',
    macroStep: 'pfa',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Certificat constatator',
    title: 'Încarcă certificatul constatator',
    document: {
      category: 'CertificatConstatator',
      label: 'Certificat constatator ONRC',
      hint: 'Îl cere ARR odată cu certificatul de înregistrare. Trebuie să conțină codul CAEN 4939.',
    },
    visibleWhen: answeredYes,
    isDone: (c) => hasDocument(c, CONSTATATOR),
  },
  {
    id: 'pfa_summary',
    macroStep: 'pfa',
    kind: 'summary',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'Rezumat',
    title: 'Verifică datele înainte să trimitem dosarul',
    visibleWhen: answeredYes,
    // Se închide când adminul validează dosarul — până atunci pasul rămâne al userului.
    isDone: (c) => c.state?.pfaStatus === 'Approved',
  },

  // ── Ramura „Nu am PFA" ──
  {
    id: 'politica_plati',
    macroStep: 'pfa',
    kind: 'multi',
    eyebrow: EYEBROW,
    icon: 'shield',
    railLabel: 'Politica de plăți',
    title: 'Confirmă înainte să mergem mai departe',
    choices: [
      { value: 'accept', title: 'Am citit și accept Politica de Plăți și Abonamente' },
    ],
    visibleWhen: (c) => answeredNo(c) && c.state?.pfaRegistrationId == null,
    isDone: (c) => c.state?.pfaRegistrationId != null,
  },
  {
    // Ecranul ăsta NU deschide dosarul — doar înregistrează ramura aleasă, ca să existe pe ce
    // atârna plata. Dosarul se deschide după ce avansul e încasat: nu completezi un dosar
    // pentru un serviciu pe care încă nu l-ai cumpărat (RL-03).
    id: 'incepe_infiintare',
    macroStep: 'pfa',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Înființare PFA',
    title: 'Îți înființăm PFA-ul',
    lines: () => [
      'Următorul pas e plata în avans a abonamentului RIDElance Start.',
      'După confirmarea plății îți deschidem dosarul de înființare și completezi datele.',
    ],
    action: {
      label: 'Continuă spre plată',
      busyLabel: 'Se pregătește...',
      run: async () => {
        await pfaService.create({ registrationType: 'NuAmPfa', isOwner: false })
      },
    },
    visibleWhen: answeredNo,
    isDone: (c) => c.state?.pfaRegistrationId != null,
  },
]
