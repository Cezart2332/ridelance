import { COUNTIES, canonicalCounty } from '../../../data/counties'
import type { DocumentSummary } from '../../../services/document.service'
import { onboardingService, type ArrState } from '../../../services/onboarding.service'
import { requirementsOf } from '../documentRequirements'
import type { MicroStepContext, MicroStepDef } from '../microStepTypes'

/**
 * Pasul 4 — Autorizația de transport alternativ, ca ecrane.
 *
 * Documentele se cer unul câte unul, în ordinea în care le cere ARR. Cele preluate din pașii
 * anteriori (certificat, atestat) apar tot ca ecran, dar deja bifate — userul vede că sunt
 * acoperite, în loc să se întrebe de ce lipsesc dintr-o listă pe care o știa mai lungă.
 *
 * Autorizația o emite ARR, nu noi: ultimele ecrane sunt dosarul (generat, descărcat și marcat
 * ca depus, toate în aceeași componentă) și uploadul documentului primit.
 */

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

function hasDocument(c: MicroStepContext, categories: string[]): boolean {
  const newest = c.documents.filter((d) => categories.includes(d.category)).sort(byNewest)[0]
  if (!newest) return false
  return newest.status.toLowerCase() !== 'rejected' && newest.aiStatus !== 'Failed'
}

const arrOf = (c: MicroStepContext) => (c.resources.arr as ArrState | undefined) ?? null

const field = (c: MicroStepContext, stepId: string, key: string): string => {
  const value = c.answers[`${stepId}.${key}`]
  return typeof value === 'string' ? value.trim() : ''
}

const EYEBROW = 'AUTORIZAȚIE TRANSPORT'

const HINTS: Record<string, string> = {
  CertificatInregistrare: 'Preluat de la pasul PFA. Verifică doar că e cel corect.',
  CertificatConstatator: 'Trebuie să conțină codul CAEN 4939.',
  AtestatTransport: 'Preluat de la pasul de eligibilitate.',
  CazierJudiciar: 'Eliberat de poliție, valabil 6 luni de la emitere.',
  // Două documente, două ecrane: emise de instituții diferite, cu valabilități diferite.
  AdeverintaMedicala: 'Eliberat de cabinetul de medicina muncii. Data expirării trebuie să fie lizibilă.',
  AvizPsihologic: 'Eliberat de cabinetul de psihologie autorizat. Are altă valabilitate decât cel medical.',
  DovadaPlataArr: 'Chitanța sau ordinul de plată al tarifului ARR, în contul de trezorerie de mai sus.',
}

/** Documentele cerute de ARR, minus autorizația însăși — aia vine la final, de la ei. */
const ARR_DOCUMENTS = requirementsOf('arr').filter(
  (req) => req.category !== 'AutorizatieTransportAlternativ',
)

const documentSteps: MicroStepDef[] = ARR_DOCUMENTS.map((req) => ({
  id: `arr_${req.category}`,
  macroStep: 'arr',
  kind: 'upload' as const,
  eyebrow: EYEBROW,
  icon: 'folder' as const,
  railLabel: req.label,
  title: `Încarcă: ${req.label}`,
  document: {
    category: req.category,
    label: req.label,
    hint: HINTS[req.category] ?? 'Fotografie sau PDF, cu textul lizibil.',
  },
  isDone: (c: MicroStepContext) => hasDocument(c, [req.category, ...(req.alsoAccepts ?? [])]),
}))

/** Județul agenției: alegerea din sesiune, apoi ce s-a salvat, apoi sediul social. */
const agencyCounty = (c: MicroStepContext): string =>
  field(c, 'arr_agentie', 'county') ||
  arrOf(c)?.agencyName ||
  canonicalCounty(c.state?.primaryCounty) ||
  ''

export const arrMicroSteps: MicroStepDef[] = [
  ...documentSteps,
  {
    id: 'arr_agentie',
    macroStep: 'arr',
    kind: 'text',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Unde depui',
    title: 'Unde depui dosarul?',
    fields: [
      {
        key: 'county',
        label: 'Agenție ARR (județ)',
        options: COUNTIES.map((county) => ({ value: county, title: county })),
        helper: 'Precompletat din adresa ta. Poți alege alt județ.',
        // Sursa precompletării e starea serverului: sediul social, altfel domiciliul citit din
        // buletin. Se trece prin forma canonică fiindcă OCR-ul întoarce „CLUJ" sau
        // „Bistrita-Nasaud", iar selectul cere exact valoarea din listă.
        initialValue: (c) => canonicalCounty(c.state?.primaryCounty) ?? '',
      },
      {
        key: 'method',
        label: 'Metodă de depunere',
        // Depunerea fizică e implicită: e singura care chiar funcționează azi.
        initialValue: () => 'InPersonByClient',
        options: [
          { value: 'InPersonByClient', title: 'Depun personal la agenția ARR' },
          {
            value: 'OnlineByRidelance',
            title: 'Depunere online prin RIDElance',
            disabled: true,
            badge: 'În curând',
            disabledReason:
              'Această opțiune va fi disponibilă în curând. Momentan dosarul se depune personal la agenția ARR.',
          },
        ],
      },
    ],
    // Contul în care se plătește tariful — aceeași componentă pe toate ramurile.
    slot: 'arrPaymentDetails',
    persist: async (values) => {
      if (!values.county) return
      await onboardingService.submitArrRequest(
        values.county,
        // Online e dezactivat; orice altceva decât depunerea fizică ar fi o promisiune falsă.
        'InPersonByClient',
      )
    },
    isDone: (c) => agencyCounty(c) !== '',
  },
  {
    id: 'arr_dosar',
    macroStep: 'arr',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Dosarul ARR',
    title: 'Generează și depune dosarul',
    lines: () => [
      'Punem cap la cap documentele de mai sus într-un singur PDF, în ordinea cerută de ARR.',
      'Verifică-l, descarcă-l și abia apoi marchează depunerea.',
    ],
    // Generarea, descărcarea și marcarea depunerii — o singură componentă, folosită identic
    // pe toate ramurile (spec fix-uri §9 și §11.3).
    slot: 'arrDossier',
    isDone: (c) => arrOf(c)?.submittedAtUtc != null,
  },
  {
    id: 'arr_autorizatie',
    macroStep: 'arr',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'shield',
    railLabel: 'Autorizația',
    title: 'Încarcă autorizația primită de la ARR',
    document: {
      category: 'AutorizatieTransportAlternativ',
      label: 'Autorizația de transport alternativ',
      hint: 'Numărul și data expirării trebuie să fie lizibile — le citim de acolo.',
    },
    visibleWhen: (c) => arrOf(c)?.submittedAtUtc != null,
    isDone: (c) => hasDocument(c, ['AutorizatieTransportAlternativ']),
  },
  {
    id: 'arr_emisa',
    macroStep: 'arr',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'Autorizație emisă',
    title: 'Autorizația e înregistrată',
    lines: (c) => {
      const arr = arrOf(c)
      const number = arr?.authorizationNumber ? `Numărul ${arr.authorizationNumber}.` : null
      const expires = arr?.authorizationExpiresOn
        ? `Valabilă până la ${new Date(arr.authorizationExpiresOn).toLocaleDateString('ro-RO')}.`
        : null
      return [number, expires, 'Poți trece la pasul următor.'].filter(
        (line): line is string => line !== null,
      )
    },
    visibleWhen: (c) => arrOf(c)?.status === 'Issued',
    isDone: (c) => arrOf(c)?.status === 'Issued',
  },
]
