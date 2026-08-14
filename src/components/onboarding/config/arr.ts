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
 * Autorizația o emite ARR, nu noi: ultimele ecrane sunt o acțiune (am depus) și un upload al
 * documentului primit.
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
  AdeverintaMedicala: 'Avizul medical și cel psihologic, în aceeași încărcare.',
  DovadaPlataArr: 'Chitanța sau ordinul de plată al tarifului ARR.',
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
      { key: 'agencyName', label: 'Agenție ARR (județ)', placeholder: 'ARR Cluj' },
      {
        key: 'method',
        label: 'Metodă de depunere',
        options: [
          { value: 'InPersonByClient', title: 'Depun personal la ARR' },
          { value: 'OnlineByRidelance', title: 'Depunere online prin RIDElance' },
        ],
      },
    ],
    persist: async (values) => {
      await onboardingService.submitArrRequest(
        values.agencyName || null,
        (values.method as 'InPersonByClient' | 'OnlineByRidelance') || 'InPersonByClient',
      )
    },
    isDone: (c) => Boolean(arrOf(c)?.agencyName) || field(c, 'arr_agentie', 'agencyName') !== '',
  },
  {
    id: 'arr_genereaza',
    macroStep: 'arr',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Dosarul ARR',
    title: 'Generăm dosarul de depus',
    lines: (c) => {
      const fee = ((arrOf(c)?.feeSnapshotBani ?? 30000) / 100).toLocaleString('ro-RO', {
        minimumFractionDigits: 2,
      })
      return [
        'Punem cap la cap documentele de mai sus într-un singur PDF, în ordinea cerută de ARR.',
        `Taxa ARR pentru dosar: ${fee} lei.`,
      ]
    },
    action: {
      label: 'Generează dosarul',
      busyLabel: 'Se generează...',
      run: () => onboardingService.generateArrDossier(),
    },
    isDone: (c) => arrOf(c)?.hasDossier === true,
  },
  {
    id: 'arr_depus',
    macroStep: 'arr',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'Am depus dosarul',
    title: 'Ai depus dosarul la ARR?',
    lines: () => [
      'Marchează asta după ce dosarul a ajuns la agenție. Din acel moment așteptăm autorizația.',
    ],
    action: {
      label: 'Am depus dosarul la ARR',
      busyLabel: 'Se salvează...',
      run: () => onboardingService.markArrSubmitted(),
    },
    visibleWhen: (c) => arrOf(c)?.hasDossier === true,
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
