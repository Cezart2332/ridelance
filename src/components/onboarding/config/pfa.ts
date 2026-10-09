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
 * duc doar până la deschiderea dosarului de înființare; avansul e plătit deja, pe primul ecran.
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

/**
 * Dosarul e predat spre validare.
 *
 * Se citește din statusul pasului, nu din `pfaStatus`: acela e statusul dosarului
 * (`Pending` din secunda în care e creat), iar pe el ecranul de așteptare apărea imediat după
 * numărul de telefon. Statusul pasului îl derivă serverul și trece pe `pending_admin` abia când
 * șoferul și-a încărcat amândouă certificatele.
 */
const laValidare = (c: MicroStepContext) =>
  c.state?.steps.find((s) => s.key === 'pfa')?.state === 'pending_admin'

export const pfaMicroSteps: MicroStepDef[] = [
  {
    /*
     * Avansul, primul ecran — înaintea întrebării „ai deja PFA?".
     *
     * Nu depinde de ce urmează să aleagă omul: e o lună de PFA Full plătită mai devreme,
     * aceeași sumă pe ambele ramuri. Stătea pe ramura „Nu am PFA", ca ecran care înlocuia tot
     * runnerul, deci se cerea după alegere și doar de la jumătate din clienți.
     *
     * Dispare de îndată ce plata e confirmată; dosarul se deschide abia la ecranul următor.
     */
    id: 'avans',
    macroStep: 'pfa',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Avans',
    title: 'Începem înrolarea',
    lines: () => [],
    slot: 'onboardingAdvance',
    visibleWhen: (c) => c.state?.hasPaidInfiintare !== true,
    isDone: (c) => c.state?.hasPaidInfiintare === true,
  },
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
    // Dosarul se deschide singur aici. Ecranul de „Date de contact” care îl crea a dispărut:
    // telefonul îl știm din cont, iar serverul îl copiază pe dosar.
    onArrive: {
      when: (c) => c.state?.pfaRegistrationId == null,
      run: () => pfaService.create({ registrationType: 'AmPfa', isOwner: false }),
      errorMessage: 'Nu am putut deschide dosarul PFA. Încearcă din nou.',
    },
    visibleWhen: answeredYes,
    // Fără dosar, documentul n-ar avea de ce se lega; ecranul nu se închide până nu există.
    isDone: (c) => c.state?.pfaRegistrationId != null && hasDocument(c, CERTIFICAT),
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
      hint: 'Îl cere ARR odată cu certificatul de înregistrare. Trebuie să conțină codul CAEN 4933.',
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
    // Înregistrează ramura aleasă; după ea, pagina trimite omul în dosarul de înființare.
    //
    // Nu mai vorbește de plată: avansul se plătește pe primul ecran al pasului, de toată lumea,
    // înaintea întrebării „ai deja PFA?". Ecranul spunea încă „următorul pas e plata în avans" și
    // avea un buton „Mergi la plată" — pentru cineva care tocmai plătise.
    id: 'incepe_infiintare',
    macroStep: 'pfa',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Înființare PFA',
    title: 'Îți înființăm PFA-ul',
    lines: () => [
      'Îți deschidem acum dosarul de înființare. Completezi datele personale și sediul, iar de ONRC și ANAF ne ocupăm noi.',
    ],
    onArrive: {
      when: (c) => c.state?.pfaRegistrationId == null,
      run: () => pfaService.create({ registrationType: 'NuAmPfa', isOwner: false }),
      errorMessage: 'Nu am putut deschide dosarul de înființare. Încearcă din nou.',
    },
    visibleWhen: answeredNo,
    isDone: (c) => c.state?.pfaRegistrationId != null,
  },
  {
    /*
     * Ultimul ecran al pasului: dosarul e la noi.
     *
     * Stă DUPĂ rezumat, nu în locul lui. Înainte era o pagină care înlocuia tot runnerul de
     * îndată ce dosarul exista — deci imediat după numărul de telefon: certificatele și rezumatul
     * rămâneau în rail, dar nu se mai putea ajunge la ele.
     */
    id: 'dosar_la_validare',
    macroStep: 'pfa',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'În validare',
    title: 'Dosarul tău e la noi',
    lines: () => [],
    slot: 'pfaPending',
    // Pe ambele ramuri: „Nu am PFA" ajunge aici după ce semnează dosarul de înființare.
    visibleWhen: laValidare,
    isDone: (c) => c.state?.pfaStatus === 'Approved',
  },
]
