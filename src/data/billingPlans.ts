import type { Plan } from './plans'

// Catalogul folosit de fluxurile existente de plată. Noua ofertă publică este deocamdată
// doar în frontend; prețurile facturate și identificatorii API rămân cei existenți.
export const BILLING_PFA_PLANS: Plan[] = [
  {
    key: 'solo',
    audience: 'pfa',
    title: 'Solo',
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
        text: '50 lei/lună reducere la abonament, 6 luni, pentru contul deschis prin RIDElance + 12 luni fără comisioane bancare',
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
    title: 'Start',
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
      'Deschiderea PFA este GRATUITĂ. Beneficiul BCR este de 50 lei/lună reducere la abonament timp de 6 luni, plus 12 luni fără comisioane bancare, pentru conturile eligibile deschise prin RIDElance.',
    cta: 'Începe cu Start',
  },
  {
    key: 'pro',
    audience: 'pfa',
    title: 'Pro',
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
export const BILLING_SRL_PLANS: Plan[] = [
  {
    key: 'fleet',
    audience: 'srl',
    title: 'Fleet',
      pricing: { monthlyLei: 299, annualMonthlyLei: 269.1, annualTotalLei: 3229.2 },
      noteAnnual: '3.229,20 lei facturați anual, cu reînnoire automată și 10% reducere.',
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
