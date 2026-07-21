import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import type { ReactNode } from 'react'

/**
 * Configurația partajată a documentelor pe secțiuni — folosită de tabul Documente
 * din dashboard și de fluxul de onboarding. Oglindită server-side în
 * backend/src/Application/PfaRegistrations/Onboarding/OnboardingSectionCatalog.cs.
 */

export interface MainDocConfig {
  id: string;
  title: string;
  categories: string[];
  primaryCategory: string;
  tooltip?: string;
  complianceNote?: string;
  purchaseLink?: string;
}

export const PERSONAL_PFA_DOCS: MainDocConfig[] = [
  {
    id: 'registration_certificate',
    title: 'Certificat de înregistrare (CAEN 4939)',
    categories: ['CertificatInregistrare'],
    primaryCategory: 'CertificatInregistrare',
    tooltip: 'Certificat de înregistrare din care să reiasă domeniul de activitate, cod CAEN 4939.',
  },
  {
    id: 'constatator',
    title: 'Certificat constatator (CAEN 4939)',
    categories: ['CertificatConstatator'],
    primaryCategory: 'CertificatConstatator',
    tooltip: 'Certificat constatator din care să reiasă domeniul de activitate, cod CAEN 4939.',
  },
  {
    id: 'alt_transport',
    title: 'Certificat de atestare profesională (Atestat)',
    categories: ['AtestatTransport', 'AtestatSofer'],
    primaryCategory: 'AtestatTransport',
    tooltip: 'Certificatul de atestare profesională al conducătorilor auto pentru transport de persoane în regim de închiriere.',
  },
  {
    id: 'criminal_record',
    title: 'Cazier judiciar al conducătorilor auto',
    categories: ['CazierJudiciar'],
    primaryCategory: 'CazierJudiciar',
    tooltip: 'Original, valabilitate 6 luni.',
  },
  {
    id: 'medical_cert',
    title: 'Aviz medical și psihologic al titularului',
    categories: ['AdeverintaMedicala'],
    primaryCategory: 'AdeverintaMedicala',
    tooltip: 'Aviz medical și psihologic al persoanei fizice titulare.',
  },
  {
    id: 'arr_payment',
    title: 'Dovada plății tarifului de eliberare ARR',
    categories: ['DovadaPlataArr'],
    primaryCategory: 'DovadaPlataArr',
    tooltip: 'Dovada plății tarifului de eliberare — 300 lei, achitat în contul Agenției teritoriale ARR.',
  },
]

export const CONFORMITY_DOCS: MainDocConfig[] = [
  {
    id: 'transport_authorization',
    title: 'Autorizația pentru transport alternativ',
    categories: ['AutorizatieTransportAlternativ'],
    primaryCategory: 'AutorizatieTransportAlternativ',
  },
  {
    id: 'registration_document',
    title: 'Certificatul de înmatriculare (Talon)',
    categories: ['Talon', 'ITP'],
    primaryCategory: 'Talon',
  },
  {
    id: 'car_identity_book',
    title: 'Cartea de identitate a autoturismului (toate paginile)',
    categories: ['CarteIdentitateAuto'],
    primaryCategory: 'CarteIdentitateAuto',
  },
  {
    id: 'vehicle_contract_conformity',
    title: 'Contract de închiriere / comodat autentificat / leasing',
    categories: ['ContractVehicul'],
    primaryCategory: 'ContractVehicul',
  },
  {
    id: 'leasing_agreement',
    title: 'Acord de leasing',
    categories: ['AcordLeasing'],
    primaryCategory: 'AcordLeasing',
    complianceNote: 'După caz.',
  },
  {
    id: 'conformity_payment',
    title: 'Dovada plății tarif copie conformă și ecusoane',
    categories: ['DovadaPlataCopieConformaEcusoane'],
    primaryCategory: 'DovadaPlataCopieConformaEcusoane',
    complianceNote: '1 an: 116 lei; 2 ani: 216 lei; 3 ani: 316 lei.',
  },
]

export const VEHICLE_DOCS: MainDocConfig[] = [
  {
    id: 'talon',
    title: 'Talon (ITP 6 luni)',
    categories: ['Talon', 'ITP'],
    primaryCategory: 'Talon',
    tooltip: 'Certificat de înmatriculare / Talon cu ITP valabil 6 luni.',
  },
  {
    id: 'rca',
    title: 'RCA',
    categories: ['RCA'],
    primaryCategory: 'RCA',
    tooltip: 'Poliță de asigurare de răspundere civilă auto.',
  },
  {
    id: 'copie_conforma',
    title: 'Copie conformă',
    categories: ['CopieConforma'],
    primaryCategory: 'CopieConforma',
    tooltip: 'Copie conformă valabilă pentru vehicul.',
  },
  {
    id: 'ecuson_uber',
    title: 'Ecuson Uber',
    categories: ['EcusonUber'],
    primaryCategory: 'EcusonUber',
    tooltip: 'Ecuson eliberat de operatorul Uber.',
  },
  {
    id: 'ecuson_bolt',
    title: 'Ecuson Bolt',
    categories: ['EcusonBolt'],
    primaryCategory: 'EcusonBolt',
    tooltip: 'Ecuson eliberat de operatorul Bolt.',
  },
  {
    id: 'passenger_insurance',
    title: 'Asigurare calatori si bagaje',
    categories: ['AsigurareCalatori'],
    primaryCategory: 'AsigurareCalatori',
    tooltip: 'Asigurare de persoane și bagaje.',
    complianceNote: 'Optional pentru Uber, obligatoriu pentru Bolt.',
    purchaseLink: '#',
  },
  {
    id: 'vehicle_contract',
    title: 'Contract de comodat / de închiriere vehicul',
    categories: ['ContractVehicul'],
    primaryCategory: 'ContractVehicul',
    tooltip: 'Contract justificativ pentru utilizarea vehiculului.',
  },
]

export interface DocGroup {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  docs: MainDocConfig[];
  /** 'pfa' | 'vehicle' — grupurile care acceptă și documente libere */
  otherKind?: 'pfa' | 'vehicle';
}

export const DOC_GROUPS: DocGroup[] = [
  {
    id: 'autorizatie',
    label: 'Autorizație transport',
    description: 'Documentele necesare pentru Autorizația de Transport Alternativ.',
    icon: <BadgeRoundedIcon sx={{ fontSize: 18 }} />,
    docs: PERSONAL_PFA_DOCS,
    otherKind: 'pfa',
  },
  {
    id: 'conformitate',
    label: 'Copie conformă & ecusoane',
    description: 'Documentele necesare pentru copia conformă și ecusoanele vehiculului.',
    icon: <VerifiedRoundedIcon sx={{ fontSize: 18 }} />,
    docs: CONFORMITY_DOCS,
  },
  {
    id: 'vehicul',
    label: 'Vehicul',
    description: 'Documentele vehiculului cu care lucrezi pe platforme.',
    icon: <DirectionsCarRoundedIcon sx={{ fontSize: 18 }} />,
    docs: VEHICLE_DOCS,
    otherKind: 'vehicle',
  },
]

// Categories that require an expiry date when uploading
export const EXPIRABLE_CATEGORIES = new Set([
  'Buletin',
  'CarteIdentitate',
  'AsigurareCalatori',
  'ITP',
  'Talon',
  'RCA',
  'PermisConducere',
  'CopieConforma',
  'EcusonUber',
  'EcusonBolt',
  'ContractVehicul',
])

export type OnboardingSectionKey = 'Pfa' | 'AutorizatieTransport' | 'CopieConforma' | 'Vehicul'

export interface OnboardingSectionConfig {
  key: OnboardingSectionKey;
  order: number;
  label: string;
  description: string;
  /** Grupul corespondent din DOC_GROUPS (doar secțiunile de documente) */
  groupId?: 'autorizatie' | 'conformitate' | 'vehicul';
  docs?: MainDocConfig[];
  /** Documente „după caz” — nu blochează trimiterea la validare */
  optionalDocIds?: string[];
}

export const ONBOARDING_SECTIONS: OnboardingSectionConfig[] = [
  {
    key: 'Pfa',
    order: 1,
    label: 'PFA',
    description: 'Datele PFA-ului tău — sau înființăm unul pentru tine.',
  },
  {
    key: 'AutorizatieTransport',
    order: 2,
    label: 'Autorizație transport',
    description: 'Documentele necesare pentru Autorizația de Transport Alternativ.',
    groupId: 'autorizatie',
    docs: PERSONAL_PFA_DOCS,
    optionalDocIds: [],
  },
  {
    key: 'CopieConforma',
    order: 3,
    label: 'Copie conformă & ecusoane',
    description: 'Documentele necesare pentru copia conformă și ecusoanele vehiculului.',
    groupId: 'conformitate',
    docs: CONFORMITY_DOCS,
    optionalDocIds: ['leasing_agreement'],
  },
  {
    key: 'Vehicul',
    order: 4,
    label: 'Vehicul',
    description: 'Documentele vehiculului cu care lucrezi pe platforme.',
    groupId: 'vehicul',
    docs: VEHICLE_DOCS,
    optionalDocIds: ['passenger_insurance'],
  },
]

export function getOnboardingSection(key: string | undefined): OnboardingSectionConfig | undefined {
  return ONBOARDING_SECTIONS.find((s) => s.key.toLowerCase() === (key ?? '').toLowerCase())
}
