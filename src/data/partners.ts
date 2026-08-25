// Logourile de partener trăiesc în `src/assets`, nu în `public`: așa trec prin build, primesc hash
// și nu pot rămâne în cache-ul browserului cu o versiune veche după o înlocuire.
import ace from '../assets/partners/ace.png'
import asigurari from '../assets/partners/asigurari.png'
import consulto from '../assets/partners/consulto.png'
import eldrive from '../assets/partners/eldrive.png'
import mol from '../assets/partners/mol.png'
import oblio from '../assets/partners/oblio.png'
import simplifi from '../assets/partners/simplifi.png'
import { sortByPartnerOrder } from './benefits'

export interface Partner {
  slug: string
  name: string
  image: string
  /** Short text shown on the partners list card. Omitted for partners with no copy yet. */
  tagline?: string
  /** Full description shown on the partner's own page. Omitted for partners with no copy yet. */
  description?: string
  website?: string
}

export const BCR_GEORGE_MESSAGE =
  'Dacă ești șofer Uber sau Bolt, contul George pentru afacerea ta îți oferă administrarea afacerii direct din telefon, încasări și plăți electronice fără comisioane, card Business inclus și, dacă ești la început de drum, 12 luni fără comision de administrare. Practic, mai puține costuri și mai mult control asupra veniturilor tale.'

/**
 * Deschiderea contului George — o singură definiție pentru toate locurile în care apare
 * (onboarding, dashboard, pagina de parteneri).
 *
 * Linkul și QR-ul stau împreună intenționat: erau în două locuri, iar ecranul de onboarding
 * ajunsese să arate doar butonul. Codul QR e imaginea furnizată de BCR pentru **acest** link —
 * dacă `url` se schimbă, `qrImage` trebuie înlocuit în aceeași modificare.
 */
export const BCR_ACCOUNT = {
  url: 'https://george.bcr.ro/business-onboarding-start/?entity=0785&productId=GeorgeBusinessAccount&productId=GeorgeBusiness&channelType=gboPartner',
  qrImage: '/codqrbcr.jpeg',
  qrLabel: 'Scanează pentru a deschide contul de pe telefon',
  ctaLabel: 'Deschide cont la BCR',
} as const

export const BCR_ONBOARDING_URL = BCR_ACCOUNT.url

export const BCR_QR_CODES = [{ label: BCR_ACCOUNT.qrLabel, image: BCR_ACCOUNT.qrImage }]

export const BCR_OFFERS = [
  {
    chip: 'Varianta A',
    title: 'PFA Ridesharing Start-Up',
    note: 'Pentru PFA-uri cu vechime de înființare sub 12 luni',
    benefits: [
      {
        title: '12 luni fără comision de administrare',
        text: '',
      },
      {
        title: 'Deschidere cont 100% online în maxim 30 minute',
        text: 'Poți deschide contul fără deplasări la bancă, direct de pe telefon sau laptop.',
      },
      {
        title: 'Încasări și plăți electronice fără comisioane',
        text: 'Toate încasările și plățile electronice efectuate prin George sunt fără comisioane.',
      },
      {
        title: 'Control complet din telefon',
        text: 'Acces instant la George Internet și Mobile Banking, cu posibilitatea de a urmări încasările din platformele de ridesharing și cheltuielile zilnice (combustibil, service, taxe).',
      },
      {
        title: 'Card Business inclus',
        text: 'Primești card de debit Business fără costuri de emitere, reînnoire și administrare anuală.',
      },
    ],
  },
  {
    chip: 'Varianta B',
    title: 'PFA Ridesharing cu vechime',
    note: 'Pentru PFA-uri cu vechime de înființare de peste 1 an',
    benefits: [
      {
        title: 'Reducere de până la 50% la comisionul de administrare',
        text: 'Șoferii care încasează constant prin cont și au și cont de persoană fizică la BCR pot beneficia de o reducere totală de până la 50% din comisionul standard.',
      },
      {
        title: 'Toate încasările din activitate fără comisioane',
        text: 'Încasările în conturile BCR și plățile efectuate prin George sunt fără comisioane, inclusiv plățile în euro prin SEPA.',
      },
      {
        title: 'Costuri predictibile',
        text: 'Există un singur comision pentru pachet și acesta poate fi redus în funcție de utilizarea digitală a contului.',
      },
      {
        title: 'Administrarea simplă a fluxului de numerar',
        text: 'Ideal pentru șoferii care au încasări zilnice și multiple tranzacții, deoarece toate operațiunile sunt centralizate în George.',
      },
    ],
  },
]

const partnersUnordered: Partner[] = [
  {
    slug: 'bcr',
    name: 'BCR',
    image: '/logobcr.jpeg',
    tagline: 'Contul George pentru afacerea ta: banking 100% online, fără comisioane la încasări și plăți electronice.',
    description: BCR_GEORGE_MESSAGE,
    website: 'https://www.bcr.ro',
  },
  {
    slug: 'asigurari-ro',
    name: 'asigurari.ro',
    image: asigurari,
    tagline: 'Oferte online rapide pentru RCA, CASCO și orice alt tip de asigurare.',
    description:
      'asigurari.ro este platforma online prin care poți compara și obține rapid oferte pentru toate tipurile de asigurări: RCA, CASCO, locuință, sănătate, călătorie și multe altele. Prin parteneriatul cu RIDElance, șoferii primesc ofertele direct online, fără drumuri și fără birocrație.',
    website: 'https://www.asigurari.ro',
  },
  {
    slug: 'ace',
    name: 'ACE',
    image: ace,
    tagline: 'Partener RIDElance.',
    description:
      'ACE este unul dintre partenerii RIDElance. Detaliile complete despre beneficiile colaborării vor fi publicate în curând.',
  },
  {
    slug: 'mol',
    name: 'MOL',
    image: mol,
    tagline: 'Condiții avantajoase pentru carburanți și spălătorie auto, în rețeaua MOL la nivel național.',
    description:
      'MOL România este partener RIDElance și oferă beneficii dedicate comunității noastre. Prin acest parteneriat, șoferii și antreprenorii care fac parte din ecosistemul RIDElance pot beneficia de condiții avantajoase pentru alimentarea cu carburanți (benzină, motorină și GPL), precum și pentru utilizarea serviciilor de spălătorie auto din rețeaua MOL, la nivel național. Scopul acestui parteneriat este de a contribui la reducerea costurilor de operare și de a oferi avantaje reale celor care își desfășoară activitatea în domeniul transportului alternativ.',
    website: 'https://mol.ro',
  },
  {
    slug: 'oblio',
    name: 'Oblio',
    image: oblio,
  },
  {
    slug: 'consulto',
    name: 'Consulto',
    image: consulto,
  },
  {
    slug: 'simplifi',
    name: 'Simplifi',
    image: simplifi,
  },
  {
    slug: 'eldrive',
    name: 'eldrive',
    image: eldrive,
    tagline: 'Rețea de încărcare pentru flotele electrice.',
    description:
      'eldrive operează una dintre cele mai extinse rețele de stații de încărcare din România. Prin parteneriatul cu RIDElance, șoferii și flotele electrice vor putea vedea stațiile direct pe hartă în dashboard, iar sesiunile de încărcare vor intra automat în costurile mașinii. Integrarea e în lucru.',
    website: 'https://eldrive.ro',
  },
]

/** Ordinea e cea din Beneficii; ACE, care n-are pagină de beneficii, rămâne la coadă. */
export const partners: Partner[] = sortByPartnerOrder(partnersUnordered)

export const getPartnerBySlug = (slug: string) =>
  partners.find((partner) => partner.slug === slug)
