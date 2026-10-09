import { getPartnerBenefit } from './benefits'

/**
 * Planurile RIDElance, ca date.
 *
 * Noua ofertă publică este descrisă o singură dată pentru pagina de Abonamente și landing.
 *
 * Planurile PFA de aici sunt și cele încasate: backendul (`Pricing.Plans`, `StripeCatalog`) are
 * aceleași chei („pfalone”, „pfa-full”) și aceleași sume.
 */

/** Cine cumpără. Slider-ul de pe pagină comută între cele două. */
export type Audience = 'pfa' | 'srl'

/** Cum se plătește abonamentul. */
export type BillingCycle = 'monthly' | 'annual'

/**
 * O linie din lista unui plan.
 *
 * `partner` înlocuiește numele scris cu logoul: „BCR: 50 lei/lună reducere" devine logoul BCR urmat de
 * restul frazei. Numele partenerului scris lângă logoul lui e aceeași informație de două ori.
 */
export interface PlanFeature {
  /** Slug-ul partenerului, dacă linia e despre unul. Trebuie să existe în `benefits.ts`. */
  partner?: string
  /** Ce se scrie înaintea părții îngroșate: „Până la **10 anunțuri**". */
  prefix?: string
  /** Partea îngroșată. */
  strong?: string
  /** Restul frazei. Poate lipsi când `strong` spune tot. */
  text?: string
}

export interface PlanPricing {
  /** Prețul lunar, în lei, la plata lunară. */
  monthlyLei: number
  /** Prețul pe lună la plata anuală. Lipsește pentru planurile fără variantă anuală. */
  annualMonthlyLei?: number
  /** Totalul facturat o dată pe an. */
  annualTotalLei?: number
}

export interface Plan {
  key: string
  audience: Audience
  title: string
  tagline?: string
  comingSoon?: boolean
  addons?: PlanAddon[]
  pricing: PlanPricing
  /** Nota de sub preț, pe fiecare ciclu de facturare. */
  noteMonthly: string
  noteAnnual?: string
  summary: string
  /** Rândul de deasupra listei: „Include tot ce ai în Start, plus:". */
  intro?: string
  features: PlanFeature[]
  /** Precizări sub listă. Aici stau condiționările, nu în lista de beneficii. */
  footnote?: string
  cta: string
  recommended?: boolean
  /** Costuri opționale, peste abonament. Doar flota are așa ceva. */
  extras?: { amount: string; text: string }[]
}

export interface PlanAddon {
  key: string
  title: string
  monthlyLei: number
  text: string
  alternative?: string
  included?: boolean
}

export const FLEET_EXTRA_AD_LEI = 39.9
export const FLEET_ANONYMIZATION_LEI = 14.9

/** Reducerea la plata anuală, ca fracție. Folosită și pentru eticheta de pe comutator. */
export const ANNUAL_DISCOUNT = 0.1

const monthlyPricing = (monthlyLei: number): PlanPricing => ({
  monthlyLei,
  annualMonthlyLei: Math.round(monthlyLei * (1 - ANNUAL_DISCOUNT) * 100) / 100,
  annualTotalLei: Math.round(monthlyLei * (1 - ANNUAL_DISCOUNT) * 12 * 100) / 100,
})

const formatLei = (value: number) =>
  value.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Prețul afișat pentru un plan, pe ciclul ales. */
export function priceFor(plan: Plan, cycle: BillingCycle): { amount: string; unit: string; note: string } {
  const annual = cycle === 'annual' && plan.pricing.annualMonthlyLei != null

  return {
    amount: annual
      ? formatLei(plan.pricing.annualMonthlyLei!)
      : plan.pricing.monthlyLei.toLocaleString('ro-RO'),
    unit: '/ lună',
    note: annual ? (plan.noteAnnual ?? plan.noteMonthly) : plan.noteMonthly,
  }
}

/** Rândul cu totalul anual și economia, arătat doar pe ciclul anual. */
export function annualSummary(plan: Plan): string | null {
  const { annualTotalLei, annualMonthlyLei, monthlyLei } = plan.pricing
  if (annualTotalLei == null || annualMonthlyLei == null) return null

  const saving = (monthlyLei - annualMonthlyLei) * 12
  return `${formatLei(annualTotalLei)} lei facturați anual · economisești ${formatLei(saving)} lei/an`
}

/** Logoul partenerului dintr-o linie, luat din catalogul de beneficii. */
export function partnerLogoFor(slug: string): string | null {
  return getPartnerBenefit(slug)?.image ?? null
}

/**
 * Numele partenerului, scris. Ține locul logoului acolo unde acesta nu se afișează — fără el,
 * „50 lei/lună reducere la abonament" n-ar mai spune de la cine vine.
 */
export function partnerNameFor(slug: string): string | null {
  return getPartnerBenefit(slug)?.name ?? null
}

/** Planurile PFA: oferta publică și catalogul de plată, aceleași. */
export const PFA_PLANS: Plan[] = [
  {
    key: 'pfalone', audience: 'pfa', title: 'PFAlone',
    tagline: 'Tu conduci. RIDElance îți dă instrumentele.',
    pricing: monthlyPricing(139),
    noteMonthly: 'Abonament lunar, cu reînnoire automată.',
    summary: 'Pentru șoferii care vor să își gestioneze singuri obligațiile fiscale, dar vor toată infrastructura RIDElance.',
    intro: 'Inclus în PFAlone',
    features: [
      { strong: 'Deschidere PFA GRATUITĂ', text: '— dosarul și procesul de înființare sunt gestionate prin RIDElance.' },
      { strong: 'Soft contabil automatizat', text: '— evidență financiară și fiscală pentru transport alternativ.' },
      { strong: 'Calcul taxe, evidențe și dashboard RIDElance', text: '— încasări, cheltuieli, profit, taxe estimate și situația PFA-ului într-un singur loc.' },
      { strong: 'Cheltuieli introduse direct din poză', text: '— fotografiezi bonul sau factura, iar RIDElance extrage și organizează informațiile relevante.' },
      { strong: 'Aplicație mobilă RIDElance', text: '— acces complet pentru iPhone și Android.' },
      { strong: 'Toate documentele într-un singur loc', text: '— documente PFA, personale, auto și contabile centralizate în platformă.' },
      { strong: 'Alerte și notificări în timp real', text: '— pentru expirări, obligații fiscale și acțiuni importante.' },
    ],
    addons: [
      { key: 'open-banking', title: 'Open Banking', monthlyLei: 49, text: 'Conectezi contul bancar PFA, iar tranzacțiile sunt sincronizate automat în RIDElance.', alternative: 'Alternativă gratuită: încarci extrasul bancar lunar.' },
      { key: 'cash-register', title: 'Automatizare casă de marcat', monthlyLei: 49, text: 'Datele fiscale necesare sunt preluate și procesate automat în fluxul RIDElance.', alternative: 'Alternativă gratuită: încarci rapoartele Z zilnice și raportul lunar.' },
    ],
    footnote: 'PFAlone nu include gestionarea și depunerea automată a declarațiilor fiscale. Opțiunile suplimentare pot fi activate sau dezactivate separat.',
    cta: 'Alege PFAlone',
  },
  {
    key: 'pfa-full', audience: 'pfa', title: 'PFA Full', recommended: true,
    tagline: 'Tu conduci. RIDElance se ocupă de restul.',
    pricing: monthlyPricing(299),
    noteMonthly: 'Abonament lunar, cu reînnoire automată.',
    summary: 'Pentru șoferii care vor ca RIDElance să automatizeze și să gestioneze întreaga parte fiscală și administrativă a PFA-ului.',
    intro: 'Tot ce include PFAlone, plus:',
    features: [
      { strong: 'Declarații fiscale gestionate complet', text: '— generarea și depunerea declarațiilor lunare și anuale necesare PFA-ului.' },
      { strong: 'Conectare completă cu ANAF și SPV', text: '— e-Facturi, declarații, recipise, obligații, vector fiscal și comunicările relevante din SPV, centralizate automat.' },
      { strong: 'Obligații fiscale urmărite automat', text: '— termenele, statusul declarațiilor și acțiunile necesare.' },
      { strong: 'Registre și evidențe contabile generate automat', text: '— RJIP, evidențe fiscale și documentele relevante, actualizate pe baza datelor din platformă.' },
      { strong: 'Asistență și consultanță pentru transport alternativ', text: '— suport constant pentru situații fiscale, administrative și operaționale specifice ridesharing-ului.' },
    ],
    addons: [
      { key: 'open-banking', title: 'Open Banking', monthlyLei: 49, included: true, text: 'Contul bancar este conectat direct la RIDElance, iar tranzacțiile sunt sincronizate automat.' },
      { key: 'cash-register', title: 'Automatizare casă de marcat', monthlyLei: 49, included: true, text: 'Datele casei de marcat sunt integrate automat în fluxul contabil RIDElance.' },
    ],
    footnote: 'Fără opțiuni suplimentare necesare pentru automatizările prezentate. Reducerea BCR se aplică în condițiile campaniei și eligibilității contului.',
    cta: 'Alege PFA Full',
  },
]

export const SRL_PLANS: Plan[] = [
  {
    key: 'fleet', audience: 'srl', title: 'SRL Fleet',
    tagline: 'Flota, mașinile și închirierile într-un singur loc.',
    pricing: monthlyPricing(299),
    noteMonthly: 'Abonament lunar, cu reînnoire automată.',
    summary: 'Pentru societățile care administrează mașini pentru ridesharing și vor să gestioneze anunțurile, documentele, șoferii și închirierile direct din RIDElance.',
    intro: 'Inclus în SRL Fleet',
    features: [
      { strong: '10 anunțuri active incluse', text: '— publici și gestionezi mașinile disponibile direct din dashboard.' },
      { strong: 'Marketplace RIDElance', text: '— mașinile tale pot fi descoperite de șoferii din ecosistem.' },
      { strong: 'Pagină publică pentru flotă', text: '— mini-site cu mașini, informații, rating și detalii relevante.' },
      { strong: 'Documente centralizate', text: '— documente societate și vehicule, cu expirări și notificări.' },
      { strong: 'Contracte și procese-verbale', text: '— generare și administrare nelimitată pentru închirieri.' },
      { strong: 'Check-in / check-out cu poze', text: '— starea mașinii documentată la predare și returnare.' },
      { strong: 'Istoric complet al închirierilor', text: '— timeline pentru fiecare mașină și fiecare șofer.' },
      { strong: 'Administrarea plăților', text: '— chirii, scadențe și istoricul plăților.' },
      { strong: 'Mentenanță și remindere', text: '— revizii, intervenții și termene importante pentru flotă.' },
      { strong: 'Valori contractuale configurabile', text: '— chirie, garanție și alte condiții setate per relație.' },
      { strong: 'Utilizatori nelimitați', text: '— acces pentru echipa companiei fără tarif per utilizator.' },
      { strong: '0% comision din chirii', text: '— RIDElance nu reține procent din chiria dintre SRL și PFA.' },
    ],
    addons: [
      { key: 'open-banking', title: 'Open Banking', monthlyLei: 49, text: 'Conectezi contul bancar al societății și sincronizezi automat tranzacțiile relevante în RIDElance.', alternative: 'Opțional — abonamentul Fleet funcționează și fără conectarea contului bancar.' },
    ],
    footnote: '10 anunțuri active sunt deja incluse. Taxa de 39,90 lei/lună se aplică fiecărui anunț activ suplimentar. Anonimizarea numărului de înmatriculare este o plată unică, separată de totalul lunar.',
    cta: 'Alege SRL Fleet',
  },
  {
    key: 'fleet-pro', audience: 'srl', title: 'SRL Fleet Pro', comingSoon: true,
    tagline: 'Închirierea devine un flux complet digital.',
    pricing: { monthlyLei: 0 },
    noteMonthly: 'Disponibil în curând.',
    summary: 'Pentru flotele care vor să găsească PFA-uri, să încaseze chiria online, să automatizeze plățile și să administreze întreaga relație direct din RIDElance.',
    intro: 'Tot ce include SRL Fleet, plus:',
    features: [
      { strong: 'Încasarea chiriei online direct în contul firmei', text: '— PFA-ul plătește din RIDElance, NETOPIA procesează plata direct pentru SRL, iar RIDElance nu încasează și nu redistribuie banii.' },
      { strong: 'Plăți recurente și scadențe automatizate', text: '— perioade de chirie, statusul plății, următoarea scadență și eventualele plăți eșuate.' },
      { strong: 'Rental Management complet, cap-coadă', text: '— contract → check-in → plată inițială → plăți recurente → încetare → check-out → regularizare finală.' },
      { strong: 'RIDElance Verified Network — PFA-uri disponibile', text: '— găsești PFA-uri care caută mașini și vezi date reale despre închirieri, plăți la timp, restanțe și rating.' },
      { strong: 'Chat direct PFA ↔ SRL', text: '— discuția păstrează contextul mașinii și poate deveni ofertă, apoi închiriere.' },
      { strong: 'Disponibilitatea mașinilor sincronizată automat', text: '— la închiriere și returnare, cu republicare decisă de SRL.' },
      { strong: 'Istoric și reputație din colaborări reale', text: '— plăți confirmate, închirieri finalizate, incidente și recenzii verificate.' },
      { strong: 'Profil de flotă cu reputație verificată', text: '— mașini disponibile, rating, recenzii din închirieri confirmate și activitate reală.' },
      { strong: 'Roluri și permisiuni pentru echipă', text: '— administrator, manager flotă, operator, contabil sau service.' },
    ],
    footnote: 'Prețul și condițiile comerciale SRL Fleet Pro vor fi afișate la lansarea modulului.',
    cta: 'În curând',
  },
]
export const plansFor = (audience: Audience): Plan[] => (audience === 'pfa' ? PFA_PLANS : SRL_PLANS)

/**
 * Ce primește oricine, indiferent de plan.
 *
 * Stă jos, sub carduri, tocmai ca să nu fie repetat în fiecare: aceleași opt rânduri scrise de
 * trei ori ar fi făcut cardurile de două ori mai lungi fără să spună nimic în plus.
 */
export interface IncludedBenefit {
  partner?: string
  title: string
  text: string
}

export const INCLUDED_IN_ALL: IncludedBenefit[] = [
  { title: 'Deschidere PFA gratuită', text: 'Pentru utilizatorii eligibili RIDElance.' },
  { partner: 'bcr', title: 'Beneficii BCR', text: '50 lei/lună reducere la abonament timp de 6 luni, pentru conturi eligibile deschise prin RIDElance.' },
  { partner: 'mol', title: 'Reduceri MOL', text: 'Combustibil și spălătorii la tarife dedicate.' },
  { partner: 'asigurari-ro', title: 'Asigurări online', text: 'Acces prin asigurari.ro și suport RIDElance la nevoie.' },
  { partner: 'eldrive', title: 'Reduceri Eldrive', text: 'Reducere de 0,80 lei/kWh la stațiile incluse în promoție.' },
  { partner: 'consulto', title: 'Beneficii Consulto', text: 'Sediu profesional PFA la 349 lei/an și reduceri pentru operațiuni SRL eligibile.' },
  { title: 'Dashboard RIDElance', text: 'Activitate, profit, taxe, documente și conexiuni într-un singur loc.' },
  { title: 'Beneficii parteneri', text: 'Acces la ofertele și avantajele din ecosistemul RIDElance.' },
]

export const INCLUDED_FOOTNOTE =
  'Condițiile comerciale ale beneficiilor oferite de parteneri pot depinde de eligibilitatea și termenii fiecărui partener.'
