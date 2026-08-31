/**
 * Oferta BCR × RIDElance, exact textul din materialul de campanie.
 *
 * Fișierul e doar text. Nimic din el nu se calculează și nimic nu se reformulează la randare:
 * sunt cifre bancare și clauze de campanie, iar o parafrazare „ca să sune mai bine" ar fi o
 * afirmație comercială pe care n-o putem susține contractual.
 *
 * Se citește din două locuri — pagina publică `/parteneri/bcr` și tabul Beneficii din dashboard —
 * prin aceeași componentă (`components/partners/BcrOffer.tsx`). Două copii ale acestor texte ar fi
 * ajuns, la prima corectură primită de la bancă, două oferte diferite pe același site.
 *
 * Sumele campaniei RIDElance sunt aceleași cu `data/bcrDiscount.ts` și cu `Pricing.BcrDiscount`
 * din backend: 50 lei/lună × 6 luni. Dacă se schimbă acolo, se schimbă și aici.
 */

/** O bucată de frază care se îngroașă în mijlocul textului. */
export interface BcrTextSegment {
  text: string
  strong?: boolean
}

export interface BcrBenefit {
  title: string
  text: string
}

/** Un rând din grila de comisioane: câte plăți pe lună, cât costă, cât costă cu reducere. */
export interface BcrFeeRow {
  payments: string
  standard: string
  discounted: string
}

/** O perioadă fără comision de administrare, după vechimea firmei. */
export interface BcrFreePeriod {
  scope: string
  headline: string
  text: string
  /** Prima variantă e cea mai bună veste de pe card și se colorează ca atare. */
  featured?: boolean
}

/** O condiție care aduce procente din comisionul de administrare. */
export interface BcrDiscountCondition {
  value: string
  title: string
  text: string
}

export interface BcrVariant {
  id: 'pfa' | 'srl'
  tab: string
  title: string
  lead: string
  pills: string[]
  benefits: BcrBenefit[]
  fees: BcrFeeRow[]
  freePeriods: BcrFreePeriod[]
  discountsTitle: string
  discountsLead: string
  discounts: BcrDiscountCondition[]
}

export const BCR_OFFER_HERO = {
  eyebrow: 'OFERTĂ EXCLUSIVĂ RIDELANCE',
  /** Două rânduri, ca în material — al doilea e concluzia, nu continuarea primului. */
  titleLines: ['Deschizi cont BCR.', 'Plătești mai puțin la RIDElance.'],
  lead: [
    { text: 'Deschide un cont BCR pentru PFA sau SRL prin RIDElance și primești ' },
    { text: '50 lei reducere în fiecare lună, timp de 6 luni', strong: true },
    { text: ', la orice abonament RIDElance eligibil.' },
  ] as BcrTextSegment[],
  /** Coboară la comparația PFA / SRL. Al doilea buton duce direct la deschiderea contului. */
  seeOffer: 'Vezi oferta completă',
  openAccount: 'Deschide cont prin RIDElance',
  offer: {
    label: 'Beneficiu RIDElance',
    amount: '−50 lei',
    period: '/ lună × 6 luni',
    totalTitle: 'Până la 300 lei economie',
    totalNote: 'pentru abonamentul tău RIDElance.',
  },
} as const

export const BCR_OFFER_VALIDITY = {
  title: 'Campanie valabilă până la 31 decembrie 2026',
  text: 'Disponibilă atât pentru PFA, cât și pentru SRL, pentru conturile deschise prin fluxul RIDElance.',
  badge: 'PFA + SRL',
} as const

export const BCR_OFFER_SECTION = {
  title: 'Alege forma ta de activitate',
  text: 'Beneficiul RIDElance de 50 lei/lună timp de 6 luni se aplică în ambele variante. Condițiile bancare diferă între PFA și SRL.',
  feeTableHeaders: ['Plăți electronice / lună', 'Standard', 'Cu reducere max. 50%'],
} as const

export const BCR_OFFER_VARIANTS: BcrVariant[] = [
  {
    id: 'pfa',
    tab: 'PFA',
    title: 'BCR George pentru PFA',
    lead: 'Cont de business dedicat PFA-urilor și profesiilor liberale, cu deschidere 100% online și acces în George.',
    pills: ['100% online', 'Card Mastercard Business', 'George Micro'],
    benefits: [
      {
        title: 'Plăți electronice cu 0 comision',
        text: 'Prin George, în lei și euro pentru plăți SEPA.',
      },
      {
        title: 'Încasări cu 0 comision',
        text: 'Pentru încasările în conturile BCR.',
      },
      {
        title: 'Card de debit inclus',
        text: 'Emiterea, reînnoirea și mentenanța anuală fără comision.',
      },
      {
        title: 'Internet & Mobile Banking',
        text: 'Acces prin George, cu eToken integrat / George ID.',
      },
    ],
    fees: [
      { payments: '0–5', standard: '39 lei', discounted: '19,50 lei' },
      { payments: '6–9', standard: '69 lei', discounted: '34,50 lei' },
      { payments: '10–19', standard: '89 lei', discounted: '44,50 lei' },
      { payments: '19+', standard: '119 lei', discounted: '59,50 lei' },
    ],
    freePeriods: [
      {
        scope: 'PFA cu activitate sub 12 luni',
        headline: '12 luni fără comision de administrare',
        text: 'Oferta Start-Up se aplică indiferent în ce moment al primului an de activitate este deschis contul.',
        featured: true,
      },
      {
        scope: 'PFA cu activitate peste 12 luni',
        headline: 'Primele 3 luni fără comision de administrare',
        text: 'Pentru clienții noi eligibili, conform ofertei BCR.',
      },
    ],
    discountsTitle: 'Reducere BCR de până la 50%',
    discountsLead: 'După perioada gratuită, reducerea se poate obține cumulând cele două condiții:',
    discounts: [
      {
        value: '−25%',
        title: 'Rulaj de minimum 10.000 lei/lună',
        text: 'În conturile BCR, conform condițiilor din ofertă.',
      },
      {
        value: '−25%',
        title: 'Cont BCR activ de persoană fizică',
        text: 'Pentru clientul PFA care deține și cont de persoană fizică la BCR.',
      },
    ],
  },
  {
    id: 'srl',
    tab: 'SRL',
    title: 'BCR George pentru SRL',
    lead: 'Pachet pentru microîntreprinderi cu cifra de afaceri de până la 1 milion de euro, cu deschidere online și administrare prin George.',
    pills: ['100% online', 'Cont suplimentar lei / valută', 'Card Mastercard Business'],
    benefits: [
      {
        title: 'Plăți electronice cu 0 comision',
        text: 'Prin George, intrabancar și interbancar, în lei și euro pentru plăți SEPA.',
      },
      {
        title: 'Încasări cu 0 comision',
        text: 'Pentru încasările în conturile BCR.',
      },
      {
        title: 'Cont suplimentar',
        text: 'Poate fi deschis în lei sau valută, conform ofertei.',
      },
      {
        title: 'George pentru afacerea ta',
        text: 'Internet & Mobile Banking cu acces digital.',
      },
    ],
    fees: [
      { payments: '0–5', standard: '59 lei', discounted: '29,50 lei' },
      { payments: '6–9', standard: '99 lei', discounted: '49,50 lei' },
      { payments: '10–19', standard: '139 lei', discounted: '69,50 lei' },
      { payments: '19+', standard: '199 lei', discounted: '99,50 lei' },
    ],
    freePeriods: [
      {
        scope: 'SRL cu activitate sub 12 luni',
        headline: '12 luni fără comision de administrare',
        text: 'Oferta Start-Up este valabilă în primul an de activitate, conform condițiilor BCR.',
        featured: true,
      },
      {
        scope: 'SRL cu activitate peste 12 luni',
        headline: 'Primele 3 luni fără comision de administrare',
        text: 'În primele 3 luni, contul este gratuit indiferent de îndeplinirea condițiilor pentru reducerile ulterioare.',
      },
    ],
    discountsTitle: 'Reducere BCR de până la 50%',
    discountsLead: 'Reducerile se aplică independent și se pot cumula până la maximum 50%:',
    discounts: [
      {
        value: '−20%',
        title: 'Minimum 75% din cifra de afaceri rulată prin BCR',
        text: 'Conform metodei de calcul și condițiilor din oferta BCR.',
      },
      {
        value: '−20%',
        title: 'Plata salariilor în conturi BCR',
        text: 'Prin convenție de plăți salariale încheiată cu banca.',
      },
      {
        value: '−10%',
        title: 'Card de Credit BCR și/sau RoPay și/sau POS',
        text: 'Este suficientă îndeplinirea condiției aferente unuia dintre produsele eligibile.',
      },
    ],
  },
]

export const BCR_OFFER_CAMPAIGN = {
  title: 'Beneficiu suplimentar, oferit de RIDElance',
  text: [
    { text: 'Dacă deschizi contul BCR prin RIDElance în perioada campaniei, primești ' },
    { text: '50 lei reducere/lună timp de 6 luni', strong: true },
    {
      text: ' la abonamentul RIDElance. Beneficiul este disponibil atât pentru PFA, cât și pentru SRL.',
    },
  ] as BcrTextSegment[],
  statLabel: 'Economie totală',
  statValue: '300 lei',
  statNote: '50 lei × 6 luni',
} as const

export const BCR_OFFER_CTA = {
  title: 'Deschide cont BCR prin RIDElance',
  text: 'Beneficiezi de oferta bancară BCR aferentă tipului tău de activitate și, separat, de reducerea RIDElance de 50 lei/lună timp de 6 luni.',
  button: 'Începe deschiderea contului',
} as const

/**
 * Notele de subsol ale campaniei.
 *
 * Materialul primit mai avea un al treilea paragraf, „Notă pentru IT", cu instrucțiuni de legare a
 * butonului la URL-ul de tracking BCR. Acela e o sarcină de implementare, nu text pentru vizitator,
 * și nu apare pe pagină — instrucțiunea e dusă la capăt prin `BCR_ACCOUNT.url` din `data/partners.ts`.
 */
export const BCR_OFFER_LEGAL: { label: string; text: string }[] = [
  {
    label: 'Campanie RIDElance:',
    text: 'reducerea de 50 lei/lună timp de 6 luni este un beneficiu oferit de RIDElance pentru utilizatorii eligibili care deschid un cont BCR prin fluxul/linkul dedicat RIDElance până la 31.12.2026. Mecanismul exact de validare a deschiderii contului și momentul activării reducerii trebuie implementate conform acordului comercial RIDElance–BCR.',
  },
  {
    label: 'Oferta bancară BCR:',
    text: 'informațiile privind comisioanele, perioadele gratuite, condițiile de reducere și eligibilitatea PFA/SRL trebuie afișate în forma agreată contractual cu BCR. BCR stabilește eligibilitatea finală pentru produsele bancare.',
  },
]
