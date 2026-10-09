import type { Plan } from './plans'

// Planurile PFA se încasează exact cum sunt anunțate: `PFA_PLANS` din `plans.ts`.

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
