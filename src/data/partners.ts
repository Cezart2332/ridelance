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

/**
 * Ce se vede pe pagina de parteneri și în Beneficii nu mai stă aici.
 *
 * Grila de comisioane, perioadele fără comision, condițiile de reducere și campania de 50 lei/lună
 * sunt în `data/bcrOffer.ts`, randate de `components/partners/BcrOffer.tsx` pe ambele suprafețe.
 * Aici rămâne doar identitatea partenerului și linkul de deschidere a contului, de care are nevoie
 * și onboardingul.
 */

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
    tagline: 'Tarife preferențiale la încărcarea mașinilor electrice.',
    description:
      'Beneficiu dedicat șoferilor și flotelor RIDElance care folosesc mașini electrice. În platformă vezi direct stațiile incluse în ofertă, tariful de zi și de noapte, plus acces rapid către navigare.',
    website: 'https://eldrive.eu',
  },
]

/** Ordinea e cea din Beneficii; ACE, care n-are pagină de beneficii, rămâne la coadă. */
export const partners: Partner[] = sortByPartnerOrder(partnersUnordered)

export const getPartnerBySlug = (slug: string) =>
  partners.find((partner) => partner.slug === slug)
