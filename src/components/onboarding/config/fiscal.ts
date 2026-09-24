import type { BankConnectionDto } from '../../../services/bank.service'
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

/**
 * Banca e conectată prin open banking?
 *
 * De asta atârnă tot ce urmează în zona bancară: cu conexiunea făcută, IBAN-ul, titularul și
 * numele băncii vin de la bancă, semnate de ea, iar extrasul de cont — o poză din care încercam
 * să citim aceleași lucruri — nu mai are ce adăuga.
 */
const bankLinked = (c: MicroStepContext): boolean =>
  (c.resources.bank as BankConnectionDto | null | undefined)?.status === 'Linked'

const EYEBROW = 'FISCAL'

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

export const fiscalMicroSteps: MicroStepDef[] = [
  // ── TVA ──
  {
    id: 'tva',
    macroStep: 'fiscal',
    kind: 'question',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'TVA',
    title: 'Deții certificat de TVA intracomunitar?',
    // Aceeași ordine ca la toate întrebările: Da, apoi Nu. „Nu” nu oprește nimic: codul de TVA
    // intracomunitar îl obține contabilul nostru.
    choices: [
      { value: 'yes', title: 'Da' },
      { value: 'no', title: 'Nu' },
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
    /*
     * Aici se trimite „Da" — nu la întrebare.
     *
     * Serverul refuză răspunsul afirmativ fără certificat (`VatProofMissing`), deci ecranul
     * întrebării nu are ce trimite. Cât timp nimeni nu-l trimitea nici după încărcare, profilul
     * fiscal rămânea fără răspuns, iar pentru `FiscalUserPartComplete` pasul nu era terminat:
     * butonul „Trimite pentru verificare" nu apărea niciodată și pasul 3 rămânea blocat cu toate
     * bifele puse. Ramura „Nu" nu trece pe aici — ea se trimite din întrebare.
     *
     * Fără verificare pe `c.documents`: `commit` rulează imediat după încărcare, cu lista de
     * documente de dinainte, în care certificatul abia urcat încă nu apare. Verificarea de acolo
     * oprea trimiterea de fiecare dată. Serverul o face oricum (`VatProofMissing`).
     */
    commit: async () => {
      await onboardingService.submitVat('Yes')
    },
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
    /*
     * Cine n-are cont alege întâi unde îl deschide. Înainte ecranul arăta doar BCR, cu un rând
     * „poți alege și altă bancă” fără nicio cale de a face asta. Oricare ar fi alegerea, pasul
     * următor e același: contul deschis se conectează prin open banking.
     */
    id: 'banca_noua',
    macroStep: 'fiscal',
    kind: 'question',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Alege banca',
    title: 'Unde vrei să îți deschizi contul?',
    choices: [
      { value: 'bcr', title: 'La BCR, cu oferta RIDElance' },
      { value: 'other', title: 'La altă bancă' },
    ],
    visibleWhen: (c) => c.answers.cont_bancar === 'no',
    isDone: (c) => c.answers.banca_noua !== undefined || bankLinked(c),
  },
  {
    id: 'deschide_cont',
    macroStep: 'fiscal',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Deschide cont',
    title: 'Îți deschidem contul la BCR',
    lines: () => [
      'Beneficiezi de oferta dedicată parteneriatului RIDElance–BCR: contul îl poți folosi pentru încasările de la platforme, plata taxelor și administrarea activității PFA.',
      'După ce contul e activ, revino aici și conectează-l la pasul următor.',
    ],
    // Butonul ȘI codul QR, din aceeași componentă: pe desktop QR-ul e singura cale rezonabilă
    // de a continua pe telefon, unde onboardingul BCR chiar se face (spec fix-uri §4).
    slot: 'bankAccountCta',
    visibleWhen: (c) => c.answers.cont_bancar === 'no' && c.answers.banca_noua === 'bcr',
    // Deschiderea contului se întâmplă la bancă, nu la noi: ecranul nu are cum să afle singur.
    // Trece mai departe de îndată ce contul dă semne de viață — conectat sau cu extrasul încărcat.
    isDone: (c) => bankLinked(c),
  },
  {
    id: 'deschide_cont_alta',
    macroStep: 'fiscal',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Deschide cont',
    title: 'Deschide contul la banca aleasă',
    lines: () => [
      'Deschide contul de PFA la banca pe care o preferi, direct la ei — online sau la ghișeu.',
      'Când contul e activ, revino aici: la pasul următor îl conectezi prin open banking, iar IBAN-ul și tranzacțiile ajung singure în RIDElance.',
    ],
    visibleWhen: (c) => c.answers.cont_bancar === 'no' && c.answers.banca_noua === 'other',
    // Ca la BCR: deschiderea se întâmplă la bancă, iar ecranul se închide când contul e conectat.
    isDone: (c) => bankLinked(c),
  },
  {
    id: 'conectare_banca',
    macroStep: 'fiscal',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Conectează banca',
    title: 'Conectează contul bancar',
    lines: (c) =>
      bankLinked(c)
        ? ['Contul e conectat. De acum citim tranzacțiile direct de la bancă.']
        : [
            'Te ducem pe pagina băncii tale, unde autorizezi accesul de citire. Nu vedem și nu păstrăm parola ta de bancă, iar accesul se poate retrage oricând.',
            'De acolo vin IBAN-ul, titularul și mișcările din cont — informațiile pe care contabilul le citea altfel din extrasul lunar.',
          ],
    slot: 'bankConnect',
    // Blocant, nu informativ: fără conexiune nu mai există nicio altă cale prin care contabilul să
    // vadă mișcările din cont, de când extrasul a ieșit din flux. Pasul se închide singur când
    // banca confirmă autorizarea — pagina întreabă din patru în patru secunde.
    isDone: bankLinked,
  },
  // ── Oblio ──
  {
    id: 'oblio_conectare',
    macroStep: 'fiscal',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'shield',
    railLabel: 'Conectare Oblio',
    title: 'Conectează contul de facturare',
    // Un text, un buton. Cele șase acorduri erau șase bife pe care nimeni nu le citea separat, iar
    // contul oricum nu se poate crea cu jumătate din ele — deci alegerea reală era una singură.
    lines: () => [
      'Oblio e programul prin care îți emitem automat facturile pentru curse și le trimitem în e-Factura.',
      `Apăsând „Accept tot" confirmi, în bloc: ${OBLIO_CONSENTS.map((c) => c.title.toLowerCase()).join('; ')}.`,
      'Contul îl creăm și îl administrăm noi. Primul an e inclus în abonament; după, costul e al Oblio, comunicat înainte de reînnoire.',
      'Trimitem doar datele PFA-ului tău: denumire, CUI, sediu și contul bancar declarat.',
    ],
    action: {
      label: 'Accept tot',
      busyLabel: 'Se conectează...',
      run: async (c) => {
        await onboardingService.acceptOblioConsents({
          // Emailul contului RIDElance: întrebarea separată a fost scoasă — era mereu același email,
          // blocat oricum la editare.
          accountEmail: step2Of(c)?.oblio?.accountEmail ?? c.state?.contactEmail ?? null,
          accountCreationConsent: true,
          dataProcessingConsent: true,
          eInvoiceConsent: true,
          autoInvoicingConsent: true,
          ridelanceManagementConsent: true,
          termsAcceptedConsent: true,
        })
      },
    },
    isDone: (c) => step2Of(c)?.oblio?.allConsentsAccepted === true,
  },

  // ── Semnături: ale noastre, nu ale userului (RL-02) ──
  {
    id: 'pachet_semnaturi',
    macroStep: 'fiscal',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'Pachetul de semnături',
    title: 'Pregătim pachetul de semnături',
    lines: (c) => {
      const reason = step2Of(c)?.signature?.rejectionReason
      if (reason) {
        return [
          `Am întors dosarul: ${reason}`,
          'Retrimite-l semnat corect, pe emailul de pe care l-ai primit. Nu ai ce încărca aici.',
        ]
      }

      // Fostul ecran „Trimite pentru verificare” și cel de așteptare, într-unul singur: trimiterea
      // pleacă singură la sosire (`onArrive`), deci nu mai e nimic de apăsat.
      return [
        'Îți trimitem pe email pachetul de semnături: împuternicirile pentru ARR și ANAF, contractul de servicii și acordul GDPR. Durează de obicei 1–2 zile lucrătoare.',
        'Îl semnezi o singură dată și ni-l trimiți înapoi tot pe email — nu ai nimic de încărcat aici. Între timp poți merge mai departe.',
      ]
    },
    // Mereu vizibil după Oblio: e ecranul care spune ce urmează. Dacă lipsește ceva, serverul
    // refuză trimiterea și eroarea apare pe ecran.
    onArrive: {
      when: (c) => !isAtAdmin(c) && step2Of(c)?.signature?.status !== 'Completed',
      run: async (c) => {
        // Un „Da” la TVA rămas nespus (dosarele de dinainte de corectura din `tva_document`): cu
        // certificatul încărcat, se trimite acum, altfel serverul refuză pasul pentru TVA lipsă.
        const vat = step2Of(c)?.fiscal?.vatAnswer
        if (vat !== 'Yes' && vat !== 'No' && (c.answers.tva === 'yes' || hasDocument(c, TVA_PROOF))) {
          await onboardingService.submitVat('Yes')
        }
        await onboardingService.submitFiscalForReview()
      },
      errorMessage: 'Nu am putut trimite pasul la verificare. Încearcă din nou.',
    },
    isDone: (c) => step2Of(c)?.signature?.status === 'Completed',
  },
]

/** Pasul e la admin: trimis spre alocarea pachetului și încă nefinalizat. */
function isAtAdmin(c: MicroStepContext): boolean {
  const signature = step2Of(c)?.signature
  return signature?.submittedForReviewAtUtc != null && signature.status !== 'Completed'
}
