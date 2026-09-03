/**
 * Ce document se cere la ce pas — sursa unică pe frontend, oglindind
 * `OnboardingSectionCatalog.cs` de pe backend.
 *
 * Două lucruri pe care catalogul le rezolvă și pe care lista simplă de categorii nu le putea:
 *
 * 1. **Categorii echivalente.** Backendul acceptă un set de categorii per cerință
 *    (`AtestatTransport` sau `AtestatSofer`, `Talon` sau `ITP`). Fără `alsoAccepts`, frontendul
 *    cerea din nou un document pe care serverul îl considera deja încărcat.
 * 2. **Proveniența.** Același document apare la mai mulți pași (certificatul de înregistrare se
 *    încarcă la PFA și se cere din nou la ARR). `originStep` ne lasă să spunem „preluat de la
 *    pasul X" în loc să lăsăm userul să creadă că e o eroare.
 */

/**
 * Clasificarea cerută de spec (§6): fiecare pas de upload e ori „un singur document", ori „mai
 * multe".
 *
 * În fluxul de micro-pași răspunsul e structural, nu per-pas: un ecran = un document. Nu există
 * ecran de upload cu două documente, pentru că `MicroStepDef.document` e o singură categorie.
 * De aici decurge regula, aplicată o singură dată în `OnboardingRunner`:
 *
 * - upload reușit → se arată starea de succes (~550 ms) și se avansează automat;
 * - butonul „Continuă" NU se randează pe ecranele de upload;
 * - „Înlocuiește fișierul" în intervalul de tranziție anulează avansarea.
 *
 * Ecranele care chiar cer mai multe documente sunt paginile de secțiune din dashboard, nu
 * onboardingul — acolo butonul rămâne, cu contorul lui.
 */
export type DocumentStepKind = 'single'

export interface DocumentRequirement {
  /** Categoria în care se încarcă un document nou pentru această cerință. */
  category: string
  /** Categorii echivalente — un document din oricare dintre ele satisface cerința. */
  alsoAccepts?: string[]
  label: string
  /** Pasul la care documentul se cere prima dată. */
  originStep: string
}

export const DOCUMENT_REQUIREMENTS: Record<string, DocumentRequirement[]> = {
  eligibility: [
    {
      category: 'CarteIdentitate',
      label: 'Carte de identitate',
      originStep: 'eligibility',
    },
    {
      category: 'PermisConducere',
      label: 'Permis de conducere',
      originStep: 'eligibility',
    },
    {
      category: 'AtestatSofer',
      label: 'Atestat de transport alternativ',
      alsoAccepts: ['AtestatTransport'],
      originStep: 'eligibility',
    },
  ],
  pfa: [
    {
      category: 'CertificatInregistrare',
      label: 'Certificat de înregistrare (CAEN 4939)',
      originStep: 'pfa',
    },
    {
      category: 'CertificatConstatator',
      label: 'Certificat constatator ONRC',
      originStep: 'pfa',
    },
  ],
  fiscal: [
    {
      category: 'ExtrasBancar',
      label: 'Extras de cont',
      originStep: 'fiscal',
    },
    {
      category: 'CertificatTvaIntracomunitar',
      label: 'Certificat de TVA intracomunitar sau decizia ANAF',
      originStep: 'fiscal',
    },
    {
      category: 'DocumenteSemnate',
      label: 'Pachetul de semnături, semnat',
      originStep: 'fiscal',
    },
  ],
  arr: [
    {
      category: 'CertificatInregistrare',
      label: 'Certificat de înregistrare (CAEN 4939)',
      originStep: 'pfa',
    },
    {
      category: 'CertificatConstatator',
      label: 'Certificat constatator (CAEN 4939)',
      originStep: 'arr',
    },
    {
      category: 'AtestatTransport',
      label: 'Certificat de atestare profesională (atestat)',
      alsoAccepts: ['AtestatSofer'],
      originStep: 'eligibility',
    },
    {
      category: 'CazierJudiciar',
      label: 'Cazier judiciar',
      originStep: 'arr',
    },
    // Două avize distincte: emise de instituții diferite, cu valabilități proprii. Erau tratate
    // ca unul singur, deci un aviz expirat nu se putea distinge de celălalt (spec fix-uri §7).
    {
      category: 'AdeverintaMedicala',
      label: 'Aviz medical',
      originStep: 'arr',
    },
    {
      category: 'AvizPsihologic',
      label: 'Aviz psihologic',
      originStep: 'arr',
    },
    {
      category: 'DovadaPlataArr',
      label: 'Dovada plății tarifului ARR',
      originStep: 'arr',
    },
    {
      category: 'AutorizatieTransportAlternativ',
      label: 'Autorizația de transport alternativ',
      originStep: 'arr',
    },
  ],
  platforms: [],
  vehicle: [
    {
      category: 'Talon',
      label: 'Talon / ITP',
      alsoAccepts: ['ITP'],
      originStep: 'vehicle',
    },
    { category: 'CarteIdentitateAuto', label: 'Carte de identitate auto', originStep: 'vehicle' },
    { category: 'ContractVehicul', label: 'Contract vehicul', originStep: 'vehicle' },
    { category: 'RCA', label: 'RCA', originStep: 'vehicle' },
    { category: 'AsigurareCalatori', label: 'Asigurare călători', originStep: 'vehicle' },
    {
      category: 'DovadaPlataCopieConformaEcusoane',
      label: 'Dovada plății copiei conforme și a ecusoanelor',
      originStep: 'vehicle',
    },
    { category: 'CopieConforma', label: 'Copie conformă', originStep: 'vehicle' },
    { category: 'EcusonUber', label: 'Ecuson Uber', originStep: 'vehicle' },
    { category: 'EcusonBolt', label: 'Ecuson Bolt', originStep: 'vehicle' },
  ],
}

/** Toate categoriile care contează pentru un pas, inclusiv echivalențele. */
export function categoriesOfStep(stepKey: string): string[] {
  const seen = new Set<string>()
  for (const req of DOCUMENT_REQUIREMENTS[stepKey] ?? []) {
    seen.add(req.category)
    for (const alt of req.alsoAccepts ?? []) seen.add(alt)
  }
  return [...seen]
}

/** Cerințele de documente ale unui pas, în ordinea în care se afișează. */
export const requirementsOf = (stepKey: string): DocumentRequirement[] => DOCUMENT_REQUIREMENTS[stepKey] ?? []

export function requirementOf(stepKey: string, category: string): DocumentRequirement | null {
  return (DOCUMENT_REQUIREMENTS[stepKey] ?? []).find((req) => req.category === category) ?? null
}
