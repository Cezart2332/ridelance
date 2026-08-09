import type { DocumentSummary } from '../../../services/document.service'
import { onboardingService } from '../../../services/onboarding.service'
import type { MicroStepContext, MicroStepDef } from '../microStepTypes'

/**
 * Pasul 1 — Eligibilitate, spart în micro-pași.
 *
 * Ordinea urmează specul: întrebare → documentul aferent → următoarea întrebare. Diferența față de
 * spec e cine decide: întrebările de vârstă și de vechime a permisului sunt **informative**, dau
 * ritm și pregătesc userul pentru documentul următor. Verdictul îl dă backendul din documente
 * (`EligibilityRules.cs`, alimentat de OCR), nu răspunsul de aici — altfel am avea două surse de
 * adevăr care se pot contrazice.
 *
 * Singura întrebare care ajunge la server e cea de atestat: `hasDriverCertificate` nu se poate
 * citi din nimic dacă documentul lipsește.
 */

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

/** Documentul cel mai recent dintr-o categorie e încărcat și nu a fost respins. */
function hasDocument(c: MicroStepContext, categories: string[]): boolean {
  const newest = c.documents.filter((d) => categories.includes(d.category)).sort(byNewest)[0]
  if (!newest) return false
  return newest.status.toLowerCase() !== 'rejected' && newest.aiStatus !== 'Failed'
}

const CI = ['CarteIdentitate']
const PERMIS = ['PermisConducere']
// Backendul acceptă ambele categorii pentru atestat (`OnboardingSectionCatalog.cs`).
const ATESTAT = ['AtestatSofer', 'AtestatTransport']

const EYEBROW = 'ELIGIBILITATE'

export const eligibilityMicroSteps: MicroStepDef[] = [
  {
    id: 'age',
    macroStep: 'eligibility',
    kind: 'question',
    eyebrow: EYEBROW,
    icon: 'user',
    railLabel: 'Vârstă',
    title: 'Ai împlinit 21 de ani?',
    subtitle: 'Condiție preliminară pentru transportul alternativ de persoane.',
    helpText:
      'Legea impune vârsta minimă de 21 de ani. O confirmăm din data nașterii citită automat din cartea de identitate.',
    estimatedMinutes: 1,
    choices: [
      { value: 'yes', title: 'Da, am minimum 21 de ani', subtitle: 'Pot continua procesul' },
      { value: 'no', title: 'Nu încă', subtitle: 'Vreau să văd ce opțiuni am' },
    ],
    // Cartea de identitate răspunde deja la întrebare — nu o mai punem la revenire.
    isDone: (c) => c.answers.age !== undefined || hasDocument(c, CI),
  },
  {
    id: 'ci_upload',
    macroStep: 'eligibility',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Carte de identitate',
    title: 'Încarcă cartea de identitate',
    subtitle: 'Extragem automat datele. Nu trebuie să completezi nimic de mână.',
    helpText:
      'Din CI citim data nașterii și datele de identitate cu care se precompletează dosarul PFA.',
    estimatedMinutes: 2,
    document: {
      category: 'CarteIdentitate',
      label: 'Carte de identitate',
      hint: 'Fotografie clară, față. Toate cele 4 colțuri vizibile.',
    },
    isDone: (c) => hasDocument(c, CI),
  },
  {
    id: 'license',
    macroStep: 'eligibility',
    kind: 'question',
    eyebrow: EYEBROW,
    icon: 'car',
    railLabel: 'Permis',
    title: 'Ai permis categoria B de minimum 2 ani?',
    subtitle: 'Confirmăm vechimea din data emiterii, citită din permis.',
    helpText: 'Categoria B trebuie deținută de cel puțin 2 ani la data înscrierii.',
    estimatedMinutes: 1,
    choices: [
      { value: 'yes', title: 'Da', subtitle: 'Permisul are vechime de cel puțin 2 ani' },
      { value: 'no', title: 'Nu', subtitle: 'Permisul are mai puțin de 2 ani' },
    ],
    isDone: (c) => c.answers.license !== undefined || hasDocument(c, PERMIS),
  },
  {
    id: 'license_upload',
    macroStep: 'eligibility',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'car',
    railLabel: 'Permis (document)',
    title: 'Încarcă permisul de conducere',
    subtitle: 'Față și verso — alege două poze deodată sau un PDF cu ambele.',
    helpText: 'Din permis citim categoriile, data obținerii categoriei B și data expirării.',
    estimatedMinutes: 2,
    document: {
      category: 'PermisConducere',
      label: 'Permis de conducere',
      hint: 'Față și verso. Data emiterii trebuie să fie lizibilă.',
      requireBothSides: true,
    },
    isDone: (c) => hasDocument(c, PERMIS),
  },
  {
    id: 'attestation',
    macroStep: 'eligibility',
    kind: 'question',
    eyebrow: EYEBROW,
    icon: 'shield',
    railLabel: 'Atestat',
    title: 'Ai atestat de transport alternativ?',
    subtitle: 'Documentul eliberat de ARR pentru transportul de persoane în regim de închiriere.',
    helpText:
      'Atestatul este obligatoriu pentru înscriere. Dacă nu îl ai încă, îți arătăm de unde se obține.',
    estimatedMinutes: 1,
    choices: [
      { value: 'yes', title: 'Da, îl am', subtitle: 'Îl încarc la pasul următor' },
      { value: 'no', title: 'Nu încă', subtitle: 'Vreau să văd cum îl obțin' },
    ],
    // Singurul răspuns care nu se poate deduce din documente: dacă atestatul lipsește, nu există
    // nimic din care OCR-ul să citească asta. Restul câmpurilor rămân ale OCR-ului.
    submit: (value) => onboardingService.submitEligibility({ hasDriverCertificate: value === 'yes' }),
    // Un atestat încărcat setează `hasDriverCertificate` pe server (OCR) — deci răspunsul e dat.
    isDone: (c) => c.answers.attestation !== undefined || c.eligibility?.hasDriverCertificate === true,
  },
  {
    id: 'attestation_upload',
    macroStep: 'eligibility',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'shield',
    railLabel: 'Atestat (document)',
    title: 'Încarcă atestatul',
    subtitle: 'Fotografie sau PDF, lizibil integral.',
    helpText: 'Din atestat citim data expirării, ca să te anunțăm înainte să rămână fără valabilitate.',
    estimatedMinutes: 2,
    document: {
      category: 'AtestatSofer',
      label: 'Atestat de transport alternativ',
      hint: 'Documentul emis de ARR. Verifică să se vadă data expirării.',
    },
    visibleWhen: (c) => c.answers.attestation === 'yes' || hasDocument(c, ATESTAT),
    isDone: (c) => hasDocument(c, ATESTAT),
  },
  {
    id: 'eligibility_summary',
    macroStep: 'eligibility',
    kind: 'summary',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'Rezumat',
    title: 'Verifică datele înainte să mergi mai departe',
    subtitle: 'Documentele se verifică automat. Poți continua fără să aștepți rezultatul.',
    helpText: 'Dacă un document e respins după ce ai avansat, pasul se redeschide și îți spunem de ce.',
    estimatedMinutes: 1,
    // Ultimul ecran al pasului: se închide când serverul confirmă eligibilitatea.
    isDone: (c) => c.eligibility?.status === 'Eligible',
  },
]
