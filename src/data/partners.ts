import renteaza from '../assets/renteaza.svg'
import silso from '../assets/silso.png'
import ace from '../assets/ace.svg'
import mol from '../assets/mol.png'
import asigurari from '../assets/asigurari.ro.png'

export interface Partner {
  slug: string
  name: string
  image: string
  /** Short text shown on the partners list card. */
  tagline: string
  /** Full description shown on the partner's own page. */
  description: string
  website?: string
}

export const BCR_GEORGE_MESSAGE =
  'Dacă ești șofer Uber sau Bolt, contul George pentru afacerea ta îți oferă administrarea afacerii direct din telefon, încasări și plăți electronice fără comisioane, card Business inclus și, dacă ești la început de drum, 12 luni fără comision de administrare. Practic, mai puține costuri și mai mult control asupra veniturilor tale.'

export const BCR_ONBOARDING_URL =
  'https://george.bcr.ro/business-onboarding-start/?entity=0785&productId=GeorgeBusinessAccount&productId=GeorgeBusiness&channelType=gboPartner'

export const BCR_QR_CODES = [
  { label: 'Scanează cu telefonul pentru a deschide contul George', image: '/codqrbcr.jpeg' },
]

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

export const partners: Partner[] = [
  {
    slug: 'bcr',
    name: 'BCR',
    image: '/logobcr.jpeg',
    tagline: 'Contul George pentru afacerea ta: banking 100% online, fără comisioane la încasări și plăți electronice.',
    description: BCR_GEORGE_MESSAGE,
    website: 'https://www.bcr.ro',
  },
  {
    slug: 'renteaza',
    name: 'RENTeaza',
    image: renteaza,
    tagline: 'Cea mai mare platformă digitală de mobilitate pentru listarea și rezervarea vehiculelor.',
    description:
      'RENTeaza este cea mai mare platformă digitală de mobilitate care modernizează listarea, administrarea și rezervarea vehiculelor, atât pentru persoane fizice, cât și pentru operatori.',
    website: 'https://renteaza.ro',
  },
  {
    slug: 'silso',
    name: 'Silso',
    image: silso,
    tagline: 'Servicii administrative și suport pentru antreprenori: înființări, contabilitate, sediu social.',
    description:
      'Silso este un partener specializat în servicii administrative și suport pentru antreprenori, de la înființări de firme și PFA până la contabilitate și găzduire sediu social.',
    website: 'https://silso.ro',
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
    tagline: 'Una dintre cele mai extinse rețele de stații de carburant din România.',
    description:
      'MOL este una dintre cele mai extinse rețele de stații de carburant din România și Europa Centrală — un partener relevant pentru șoferii care petrec întreaga zi pe drum.',
    website: 'https://mol.ro',
  },
]

export const getPartnerBySlug = (slug: string) =>
  partners.find((partner) => partner.slug === slug)
