/** Cheia pseudo-secțiunii de eligibilitate: n-are rând de secțiune pe server, are endpoint propriu. */
export const ELIGIBILITY_KEY = 'Eligibility'

/** Sub-secțiune de documente care se validează de admin (cheie de secțiune server). */
interface AdminStepSection {
  key: string
  label?: string
}

/** Cei 6 pași văzuți de admin — oglinda pașilor clientului. Documentele se grupează pe pas;
 *  validarea rămâne pe secțiunile server care declanșează înrolarea. */
export interface AdminStep {
  key: string
  order: number
  label: string
  categories: string[]
  pfa?: boolean
  sections?: AdminStepSection[]
  guidedNote?: string
}

/**
 * Actele PFA pe care echipa le poate pune din admin în dosarul clientului. Pe ramura „Nu am PFA"
 * le primim de la Consulto după înființare — clientul n-are de unde să le aibă, deci nu le poate
 * încărca el.
 */
export const PFA_UPLOAD_CATEGORIES = [
  'CertificatInregistrare',
  'CertificatConstatator',
  'RezolutieOnrc',
  'SpecimenSemnatura',
  'AlteDocumenteInfiintare',
] as const

export const ADMIN_STEPS: AdminStep[] = [
  {
    key: 'eligibility', order: 0, label: 'Eligibilitate',
    categories: ['Buletin', 'CarteIdentitate', 'PermisConducere', 'AtestatSofer', 'AtestatTransport'],
    guidedNote: 'Documentele de eligibilitate (CI, permis, atestat). Datele extrase sunt doar ajutor: pasul se bifează la client abia când îl validezi aici. Avizele medical și psihologic se cer la pasul ARR.',
    sections: [{ key: ELIGIBILITY_KEY }],
  },
  {
    key: 'pfa', order: 1, label: 'PFA',
    categories: ['CertificatInregistrare', 'CertificatConstatator', 'RezolutieOnrc', 'SpecimenSemnatura', 'AlteDocumenteInfiintare'],
    pfa: true,
  },
  {
    key: 'fiscal', order: 2, label: 'Fiscal, bancă & semnături',
    categories: ['ExtrasBancar', 'DecontTvaIntracomunitar', 'DecontTaxaNerezident', 'CertificatTvaIntracomunitar', 'DocumenteSemnate'],
    guidedNote: 'TVA, contul bancar conectat prin open banking și contul Oblio le face clientul. Pachetul de semnături îl trimiți și îl primești înapoi semnat pe email — clientul nu mai are ce încărca aici. Pasul se închide când validezi secțiunea, mai jos.',
  },
  {
    key: 'arr', order: 3, label: 'Autorizație transport (ARR)',
    categories: ['CazierJudiciar', 'AdeverintaMedicala', 'AvizPsihologic', 'DovadaPlataArr', 'AutorizatieTransportAlternativ', 'DosarAutorizatieArr'],
    sections: [{ key: 'AutorizatieTransport' }],
  },
  {
    key: 'platforms', order: 4, label: 'Uber & Bolt',
    categories: [],
    guidedNote: 'Pasul n-are documente: clientul completează conturile de flotă și de șofer, iar avansul până la „Activ" îl faci tu, mai jos.',
  },
  {
    key: 'vehicle', order: 5, label: 'Vehicul, copie conformă & ecusoane',
    categories: ['Talon', 'CarteIdentitateAuto', 'ContractVehicul', 'AcordLeasing', 'ITP', 'RCA', 'CopieConforma', 'EcusonUber', 'EcusonBolt', 'DovadaPlataCopieConformaEcusoane', 'AsigurareCalatori', 'DosarCopieConformaEcusoane'],
    sections: [{ key: 'CopieConforma', label: 'Copie conformă & ecusoane' }, { key: 'Vehicul', label: 'Documentele mașinii' }],
  },
]

