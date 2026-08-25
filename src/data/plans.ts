import { getPartnerBenefit } from './benefits'

/**
 * Planurile RIDElance, ca date.
 *
 * Un plan e descris o singură dată și randat în trei locuri — pagina de Abonamente, secțiunea de
 * pe landing și, mai târziu, alegerea din aplicație. Scris separat în fiecare, ajunsese deja să
 * difere: pagina publică anunța altceva decât dashboardul.
 *
 * Prețurile de aici sunt **de afișare**. Ce se încasează efectiv vine din catalogul Stripe, în
 * backend, iar cele două nu sunt încă aliniate: vezi nota de la `PFA_PLANS`.
 */

/** Cine cumpără. Slider-ul de pe pagină comută între cele două. */
export type Audience = 'pfa' | 'srl'

/** Cum se plătește. Doar planurile PFA au și variantă anuală. */
export type BillingCycle = 'monthly' | 'annual'

/**
 * O linie din lista unui plan.
 *
 * `partner` înlocuiește numele scris cu logoul: „BCR: 100 lei bonus" devine logoul BCR urmat de
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

/** Reducerea la plata anuală, ca fracție. Folosită și pentru eticheta de pe comutator. */
export const ANNUAL_DISCOUNT = 0.1

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
 * Planurile pentru PFA.
 *
 * Sumele sunt cele din materialul comercial: lunar, cu 10% reducere la plata anuală. Catalogul
 * Stripe încă are prețuri **săptămânale** (49 / 99 / 149 lei) și niciun preț anual, deci pagina
 * anunță un model pe care plata nu-l face încă. E deliberat, pentru moment: plățile se aliniază
 * separat, iar butoanele de aici duc la autentificare, nu la casă.
 */
export const PFA_PLANS: Plan[] = [
  {
    key: 'solo',
    audience: 'pfa',
    title: 'RIDElance Solo',
    pricing: { monthlyLei: 199, annualMonthlyLei: 179.1, annualTotalLei: 2149.2 },
    noteMonthly: 'Abonament lunar, cu reînnoire automată.',
    noteAnnual: 'Abonament anual, cu reînnoire automată și 10% reducere.',
    summary:
      'Pentru șoferii care își gestionează singuri contabilitatea, dar vor toată infrastructura RIDElance.',
    features: [
      { strong: 'Deschidere PFA GRATUITĂ' },
      {
        strong: 'Dashboard RIDElance complet',
        text: '— încasări, profit real, taxe estimate, ore și performanță',
      },
      {
        strong: 'Documente centralizate',
        text: '— PFA, personale și auto, cu alerte de expirare',
      },
      {
        partner: 'bcr',
        text: '100 lei bonus la deschiderea contului prin RIDElance + 12 luni fără comisioane',
      },
      { partner: 'mol', text: 'reduceri la combustibil și spălătorii' },
      {
        partner: 'asigurari-ro',
        strong: 'Asigurări 100% online',
        text: 'direct din ecosistemul RIDElance',
      },
      {
        partner: 'oblio',
        strong: '1 an gratuit',
        text: '— cont și acces la programul de facturare online',
      },
      {
        partner: 'simplifi',
        strong: 'Semnătură electronică cloud',
        text: 'la tarif preferențial, cu suport RIDElance pentru configurare',
      },
      { strong: 'Suport direct în platformă' },
    ],
    footnote:
      'Contabilitatea lunară nu este inclusă. Poți folosi propriul contabil și documentele/exporturile disponibile în RIDElance.',
    cta: 'Alege Solo',
  },
  {
    key: 'start',
    audience: 'pfa',
    title: 'RIDElance Start',
    pricing: { monthlyLei: 399, annualMonthlyLei: 359.1, annualTotalLei: 4309.2 },
    noteMonthly: 'Abonament lunar, cu reînnoire automată.',
    noteAnnual: 'Abonament anual, cu reînnoire automată și 10% reducere.',
    summary: 'Pentru șoferii care vor ca RIDElance să se ocupe și de partea contabilă a PFA-ului.',
    intro: 'Include toate beneficiile Solo, plus:',
    features: [
      {
        strong: 'Contabilitate completă pentru PFA inclusă',
        text: ', prin partener CECCAR specializat în transport alternativ',
      },
      { strong: 'Contabil dedicat', text: ', disponibil direct prin chat în Dashboard RIDElance' },
      {
        strong: 'Declarații și obligații fiscale lunare gestionate',
        text: 'împreună cu contabilul',
      },
      { strong: 'Cheltuieli și documente contabile centralizate', text: 'direct în platformă' },
      {
        strong: 'Estimări automate pentru taxe și profit',
        text: ', pe baza activității disponibile în RIDElance',
      },
      {
        strong: 'Asistență și consultanță directă',
        text: '— suport RIDElance + contabil în aceeași platformă',
      },
    ],
    footnote:
      'Deschiderea PFA este GRATUITĂ. Bonusul BCR este de 100 lei + 12 luni fără comisioane, pentru conturile eligibile deschise prin RIDElance.',
    cta: 'Începe cu Start',
  },
  {
    key: 'pro',
    audience: 'pfa',
    title: 'RIDElance Pro',
    pricing: { monthlyLei: 599, annualMonthlyLei: 539.1, annualTotalLei: 6469.2 },
    noteMonthly: 'Abonament lunar, cu reînnoire automată.',
    noteAnnual: 'Abonament anual, cu reînnoire automată și 10% reducere.',
    summary:
      'Pentru cei care vor pachetul complet RIDElance, cu beneficii premium și costuri suplimentare eliminate.',
    intro: 'Include tot ce ai în Start, plus:',
    features: [
      {
        strong: 'Găzduire sediu social GRATUITĂ',
        text: ', în oricare dintre locațiile RIDElance disponibile, pe toată durata colaborării',
      },
      {
        partner: 'bcr',
        strong: '150 lei bonus',
        text: 'la deschiderea contului prin RIDElance + 12 luni fără comisioane',
      },
      { strong: 'Reduceri la chiria mașinilor deținute de RIDElance' },
      { strong: 'Oferte, campanii și promoții exclusive', text: 'pentru membrii PRO' },
      { strong: 'Early Access', text: 'la integrări, funcționalități și parteneriate noi RIDElance' },
      { strong: 'Suport prioritar RIDElance' },
    ],
    footnote:
      'Reducerea pentru chirie se aplică exclusiv mașinilor deținute de RIDElance, nu mașinilor publicate de firme partenere.',
    cta: 'Alege Pro',
    recommended: true,
  },
]

/**
 * Planul pentru flote.
 *
 * Unul singur, deci fără comparație între variante — cardul stă centrat, nu într-o grilă de trei
 * cu două goluri. Nu are variantă anuală, așa că pe SRL comutatorul lunar/anual nici nu apare.
 */
export const SRL_PLANS: Plan[] = [
  {
    key: 'fleet',
    audience: 'srl',
    title: 'RIDElance Fleet',
    pricing: { monthlyLei: 299 },
    noteMonthly:
      'Abonament lunar, cu 10 anunțuri active incluse și administrare completă pentru flota ta.',
    summary:
      'Pentru flotele care vor administrare digitală completă, organizare mai bună și un mod simplu de a gestiona mașinile și închirierile.',
    intro: 'Include:',
    features: [
      { prefix: 'Până la', strong: '10 anunțuri active simultan' },
      { strong: 'Marketplace RIDElance + mini-site pentru flotă' },
      { strong: 'Hartă interactivă și locații de preluare' },
      { strong: 'Dosar digital pentru fiecare vehicul' },
      { strong: 'Documente vehicul și documente societate' },
      { strong: 'Alerte pentru RCA, ITP, CASCO și expirări' },
      { strong: 'Generare contracte și procese-verbale' },
      { strong: 'Preview și descărcare PDF' },
      { strong: 'Check-in / Check-out cu poze și istoric complet' },
      { strong: 'Mentenanță, remindere și timeline per mașină' },
      { strong: 'Beneficii RIDElance și badge „Flotă verificată”' },
      { strong: '0% comision', text: 'din valoarea chiriilor' },
    ],
    cta: 'Începe acum',
    recommended: true,
    extras: [
      { amount: '39,90 lei / lună', text: 'pentru fiecare anunț activ suplimentar peste cele 10 incluse' },
      { amount: '14,90 lei / anunț', text: 'pentru anonimizarea numărului de înmatriculare' },
    ],
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
  { partner: 'bcr', title: 'Beneficii BCR', text: 'Bonus la deschiderea contului și 12 luni fără comisioane.' },
  { partner: 'mol', title: 'Reduceri MOL', text: 'Combustibil și spălătorii la tarife dedicate.' },
  { partner: 'asigurari-ro', title: 'Asigurări online', text: 'Acces prin asigurari.ro și suport RIDElance la nevoie.' },
  { partner: 'oblio', title: '1 an OBLIO gratuit', text: 'Cont și acces la programul de facturare online.' },
  { partner: 'simplifi', title: 'Simplifi', text: 'Semnătură electronică cloud la tarif preferențial.' },
  { title: 'Dashboard RIDElance', text: 'Activitate, profit, taxe, documente și conexiuni într-un singur loc.' },
  { title: 'Beneficii parteneri', text: 'Acces la ofertele și avantajele din ecosistemul RIDElance.' },
]

export const INCLUDED_FOOTNOTE =
  'Condițiile comerciale ale beneficiilor oferite de parteneri pot depinde de eligibilitatea și termenii fiecărui partener.'
