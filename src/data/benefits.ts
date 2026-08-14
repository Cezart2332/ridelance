import ace from '../assets/partners/ace.png'
import asigurari from '../assets/partners/asigurari.png'
import consulto from '../assets/partners/consulto.png'
import mol from '../assets/partners/mol.png'
import oblio from '../assets/partners/oblio.png'
import simplifi from '../assets/partners/simplifi.png'

/**
 * Beneficiile de partener, așa cum le vede un client în dashboard.
 *
 * Sunt separate de `partners.ts` intenționat: acolo stă prezentarea publică a partenerului, aici
 * stă ce primește concret cineva care e deja client. Aceleași logouri, alt conținut.
 *
 * Modelul e mic pe scop: un partener are un text de intro, opțional o evidențiere (bonusul), și
 * blocuri. Un bloc e o listă de bife SAU un tabel de valori SAU un contact — niciunul nu are nevoie
 * de o componentă proprie, deci nu primește una.
 */

export interface BenefitRow {
  label: string
  value: string
}

export interface BenefitContact {
  name: string
  email: string
  phone: string
}

export interface BenefitLink {
  label: string
  /** Link extern (se deschide în tab nou) sau secțiune de dashboard (`section:asigurari`). */
  href: string
}

export interface BenefitBlock {
  badge?: string
  title: string
  text?: string
  checks?: string[]
  rows?: BenefitRow[]
  contact?: BenefitContact
  link?: BenefitLink
}

export interface PartnerBenefit {
  slug: string
  name: string
  image: string
  tagline: string
  website?: string
  intro?: string
  /** Cutia de bonus din capul panoului. Doar unde există chiar un bonus în bani. */
  highlight?: { amount: string; title: string; note?: string }
  /** Ofertele BCR, care au două variante și merită comparate — restul partenerilor n-au așa ceva. */
  showBcrOffers?: boolean
  blocks: BenefitBlock[]
}

export const partnerBenefits: PartnerBenefit[] = [
  {
    slug: 'bcr',
    name: 'BCR',
    image: '/logobcr.jpeg',
    tagline: 'Contul George pentru afacerea ta: banking 100% online, fără comisioane la încasări și plăți electronice.',
    website: 'https://www.bcr.ro',
    intro:
      'Dacă ești șofer Uber sau Bolt, contul George pentru afacerea ta îți oferă administrarea afacerii direct din telefon, încasări și plăți electronice fără comisioane, card Business inclus și, dacă ești la început de drum, 12 luni fără comision de administrare.',
    highlight: {
      amount: '+100 lei',
      title: 'Bonus RIDElance la cont deschis prin noi',
      note: 'beneficiu suplimentar față de oferta standard',
    },
    showBcrOffers: true,
    blocks: [],
  },
  {
    slug: 'mol',
    name: 'MOL',
    image: mol,
    tagline: 'Card de flotă pentru PFA, comandat online și gratuit, cu cashback și administrare digitală.',
    website: 'https://mol.ro',
    blocks: [
      {
        badge: 'Beneficiu RIDElance',
        title: 'Card de flotă gratuit pentru PFA',
        text: 'Comanzi cardul online și ai acces la platforma MOL pentru solduri, tranzacții și cashback, fără cost de emitere.',
        rows: [
          { label: 'Benzină', value: '11–20 bani/litru cashback' },
          { label: 'Diesel', value: '11–20 bani/litru cashback' },
          { label: 'GPL', value: '11–20 bani/litru cashback' },
          { label: 'Spălătorii MOL', value: '20% reducere prin cashback' },
        ],
      },
      {
        badge: 'Contact dedicat',
        title: 'Oferta de partener RIDElance',
        text: 'Discuți direct cu persoana din MOL care se ocupă de oferta pentru partenerii RIDElance.',
        contact: {
          name: 'Gabriel Prunaru',
          email: 'gprunaru@molromania.ro',
          phone: '+40 728 182 983',
        },
      },
    ],
  },
  {
    slug: 'asigurari-ro',
    name: 'asigurari.ro',
    image: asigurari,
    tagline: 'Asigurări 100% online, comparație rapidă și suport RIDElance.',
    website: 'https://www.asigurari.ro',
    blocks: [
      {
        badge: '100% online',
        title: 'Compari ofertele dintr-un singur loc',
        text: 'Vezi polițele disponibile și compari prețuri de la asigurători din România, cu plată online și emitere digitală.',
        checks: [
          'Compari singur ofertele online',
          'Plată online, totul digital',
          'Suport RIDElance pentru generarea polițelor',
        ],
        link: { label: 'Deschide secțiunea Asigurări', href: 'section:asigurari' },
      },
      {
        badge: 'Suport inclus',
        title: 'Ai nevoie de ajutor?',
        text: 'Dacă nu vrei să emiți singur polița, îți spunem noi ce ți se potrivește și te ajutăm cu documentele.',
        link: { label: 'Scrie-ne în Chat & Suport', href: 'section:support' },
      },
    ],
  },
  {
    slug: 'oblio',
    name: 'Oblio',
    image: oblio,
    tagline: 'Facturare online simplă pentru clienții RIDElance.',
    blocks: [
      {
        badge: 'Primul an gratuit · 29 € / an după',
        title: 'Facturare digitală, fără complicații',
        text: 'Pentru clienții RIDElance primul an e gratuit. După primul an, costul este de 29 euro pe an.',
        checks: [
          'Activare online',
          'Facturi și documente într-un singur loc',
          'Cost predictibil după primul an',
        ],
      },
    ],
  },
  {
    slug: 'consulto',
    name: 'Consulto',
    image: consulto,
    tagline: 'Reduceri speciale pentru înființarea și administrarea PFA-ului.',
    blocks: [
      {
        badge: 'Prețuri RIDElance',
        title: 'Economisești la deschiderea și găzduirea PFA-ului',
        rows: [
          { label: 'Deschidere PFA', value: '−100 lei' },
          { label: 'Găzduire sediu social', value: '−50 lei / an' },
          { label: 'Client RIDElance PRO', value: 'Găzduire gratuită' },
        ],
      },
    ],
  },
  {
    slug: 'simplifi',
    name: 'Simplifi',
    image: simplifi,
    tagline: 'Semnături calificate în cloud, direct prin ecosistemul RIDElance.',
    blocks: [
      {
        badge: 'Semnare în cloud',
        title: 'Cea mai accesibilă metodă de semnare',
        text: 'Primești acces în dashboardul Simplifi și gestionezi documentele care cer semnătură calificată, fără token fizic.',
        checks: [
          'Acces în dashboard Simplifi',
          'Primești sau soliciți semnături calificate',
          'Semnare documente 100% online',
          'Certificat prin cloud',
        ],
      },
      {
        badge: 'RIDElance + Simplifi',
        title: 'Tot fluxul într-un singur loc',
        text: 'Pentru procuri, documente fiscale, dosare și orice altceva trebuie semnat calificat.',
      },
    ],
  },
  {
    slug: 'ace',
    name: 'ACE',
    image: ace,
    tagline: 'Partener RIDElance.',
    blocks: [
      {
        title: 'Detaliile vin în curând',
        text: 'Colaborarea e activă, dar beneficiile concrete încă se așază. Le găsești aici imediat ce sunt confirmate.',
      },
    ],
  },
]

export const getPartnerBenefit = (slug: string) =>
  partnerBenefits.find((partner) => partner.slug === slug)
