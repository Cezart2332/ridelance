import { api } from '../lib/axios'
import { PFA_PATHS } from '../config/pfaNavigation'
import type { OwnerType } from '../config/ownerType'
import { PFA_PLANS, annualSummary, priceFor, type BillingCycle, type Plan, type PlanFeature } from '../data/plans'
import { getPartnerBenefit } from '../data/benefits'

/**
 * Stripe integration service using Payment Links.
 * Redirects users to pre-built Stripe-hosted checkout pages.
 */

export type PlanKey = 'solo' | 'start' | 'pro'
export type ServiceKey = 'infiintare_pfa' | 'sediu_social' | 'start_ride'

/** Cum se reînnoiește abonamentul, în vocabularul serverului. */
export type SubscriptionCycle = 'Monthly' | 'Annual'

/** `BillingCycle` din `data/plans.ts`, în forma pe care o așteaptă API-ul. */
const cycleParam = (cycle: BillingCycle): SubscriptionCycle =>
  cycle === 'annual' ? 'Annual' : 'Monthly'

/**
 * Ce cumpără utilizatorul. Ecranul de plată își alege promisiunile după asta: un abonament
 * poate promite reînnoire și anulare oricând, o taxă de înființare plătită o dată nu are ce
 * anula, iar avansul din onboarding e explicit nerambursabil.
 */
export type CheckoutKind = 'subscription' | 'service' | 'advance'

export interface SubscriptionResponse {
  id: string | null
  plan: PlanKey | null
  status: string | null
  stripeSubscriptionId: string | null
  firstBillingDateUtc: string | null
  nextBillingDateUtc: string | null
  createdAtUtc: string | null
  dashboardAccessGranted: boolean
  /** „Monthly" | „Annual" — cum se reînnoiește abonamentul. Null cât timp nu există unul. */
  billingCycle: SubscriptionCycle | null
  pfaStatus: string | null
  pfaRegistrationType: string | null
  pendingPlan: PlanKey | null
  hasPaidInfiintare: boolean
  onboardingSectionsValidated: boolean
}


export interface PaymentHistoryItem {
  id: string
  paymentType: string
  status: string
  amountBani: number
  description: string
  stripePaymentId: string | null
  createdAtUtc: string
}

export interface PlanInfo {
  key: PlanKey
  title: string
  price: string
  /**
   * Prețul lunar ca număr, pe lângă textul gata format.
   *
   * Ecranul de alegere a planului scade din el reducerea BCR când e bifată. Din șirul `price` n-ar
   * fi avut din ce: „199 lei / lună" e text, nu o sumă cu care se poate face aritmetică.
   */
  monthlyLei: number
  /** Ce urmează după sumă — „/ lună". Separat, ca reducerea să poată reface șirul. */
  priceUnit: string
  priceNote: string
  summary: string
  intro?: string
  list: string[]
  footnote?: string
  cta: string
  highlighted: boolean
}

export interface ServiceInfo {
  key: ServiceKey
  title: string
  price: string
  priceNote?: string
  desc: string
  tagline?: string
  cta: string
  /**
   * Cui i se oferă serviciul. Spec §3.2: ce e PFA-only se ascunde pe baza tipului de cont, nu
   * se șterge din catalog. Toate trei sunt azi despre înființarea și operarea unui PFA, deci
   * un SRL nu are ce cumpăra de aici — pagina lui arată starea goală, nu carduri irelevante.
   */
  ownerTypes: OwnerType[]
}

/**
 * Planurile de abonament, derivate din `data/plans.ts`.
 *
 * Erau scrise a doua oară aici, cu prețurile săptămânale (49/99/149 lei) și cu nota „reînnoire
 * automată în fiecare luni la 15:00" — adică pagina publică și checkoutul anunțau două modele
 * diferite ale aceluiași abonament. O singură sursă: `PFA_PLANS`.
 */
const featureLine = (feature: PlanFeature): string => {
  const partner = feature.partner ? getPartnerBenefit(feature.partner)?.name : null
  const parts = [partner ? `${partner}:` : null, feature.prefix, feature.strong, feature.text]
    .filter((part): part is string => Boolean(part))

  // Fragmentele sunt scrise ca să se lipească de partea îngroșată: `text` începe des cu „, prin
  // partener CECCAR". Un `join(' ')` naiv scotea „inclusă , prin partener".
  return parts.reduce((line, part) => {
    if (line === '') return part
    return /^[,.;:!?)]/.test(part) ? `${line}${part}` : `${line} ${part}`
  }, '')
}

const toPlanInfo = (plan: Plan, cycle: BillingCycle): PlanInfo => {
  const { amount, unit, note } = priceFor(plan, cycle)
  const annual = cycle === 'annual' ? annualSummary(plan) : null

  return {
    key: plan.key as PlanKey,
    title: plan.title,
    price: `${amount} lei ${unit}`,
    monthlyLei:
      cycle === 'annual' && plan.pricing.annualMonthlyLei != null
        ? plan.pricing.annualMonthlyLei
        : plan.pricing.monthlyLei,
    priceUnit: unit,
    // Pe ciclul anual, nota utilă e totalul facturat o dată pe an — nu textul generic.
    priceNote: annual ?? note,
    summary: plan.summary,
    intro: plan.intro,
    list: plan.features.map(featureLine),
    footnote: plan.footnote,
    cta: plan.cta,
    highlighted: plan.recommended === true,
  }
}

/** Planurile pe ciclul cerut. Lunar e implicit peste tot unde nu se alege altceva. */
export const subscriptionPlansFor = (cycle: BillingCycle): PlanInfo[] =>
  PFA_PLANS.map((plan) => toPlanInfo(plan, cycle))

/**
 * Suma care se încasează chiar acum, nu cea pe lună.
 *
 * Cardurile compară planuri, deci arată prețul pe lună pe ambele cicluri — corect acolo. Ecranul
 * de plată stă lângă formularul Stripe, care pe anual cere tot anul dintr-o dată: „179,10 lei /
 * lună" lângă un buton care ia 2.149,20 lei ar fi două sume diferite pe același ecran.
 */
function chargedPriceLabel(key: PlanKey, cycle: BillingCycle): string | undefined {
  const plan = PFA_PLANS.find((p) => p.key === key)
  if (!plan) return undefined

  if (cycle === 'annual' && plan.pricing.annualTotalLei != null) {
    return `${plan.pricing.annualTotalLei.toLocaleString('ro-RO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} lei / an`
  }

  return `${plan.pricing.monthlyLei.toLocaleString('ro-RO')} lei / lună`
}

export const SUBSCRIPTION_PLANS: PlanInfo[] = subscriptionPlansFor('monthly')

export const ONE_TIME_SERVICES: ServiceInfo[] = [
  {
    key: 'infiintare_pfa',
    title: 'Înființare PFA',
    price: '450 lei',
    desc: 'Deschizi rapid un PFA printr-un proces simplu și organizat, fără abonament lunar.',
    cta: 'Cumpără serviciul',
    ownerTypes: ['Pfa'],
  },
  {
    key: 'sediu_social',
    title: 'Găzduire Sediu Social',
    price: '449 lei / an',
    desc: 'O soluție practică pentru cei care au nevoie de sediu social pentru PFA în București / Ilfov.',
    cta: 'Cumpără serviciul',
    ownerTypes: ['Pfa'],
  },
  {
    key: 'start_ride',
    title: 'Start Ride',
    price: '799 lei',
    priceNote: '* nu include taxe ARR',
    desc: 'Începi pe PFA, fără să pierzi timp cu pași neclari. RIDElance te ghidează prin deschiderea PFA-ului și activarea pentru ridesharing, până ești pregătit să lucrezi independent.',
    tagline: 'Proces clar. Pornire corectă. Suport până la activare.',
    cta: 'Alege serviciul',
    ownerTypes: ['Pfa'],
  },
]

/**
 * Ce se transmite ecranului `/checkout`. `sessionStorage` fiindcă Stripe montează formularul cu un
 * client secret care nu are voie să treacă prin URL; restul câmpurilor merg pe același drum ca
 * să rămână o singură convenție.
 */
interface CheckoutHandoff {
  clientSecret: string
  cancelUrl: string
  kind: CheckoutKind
  title: string
  price?: string
  desc?: string
  /** Doar pe abonamente: ce scrie sub preț despre reînnoire. */
  renewal?: string
}

const CHECKOUT_KEYS = [
  'stripe_client_secret',
  'stripe_cancel_url',
  'stripe_checkout_kind',
  'stripe_checkout_title',
  'stripe_checkout_price',
  'stripe_checkout_desc',
  'stripe_checkout_renewal',
] as const

function goToCheckout(handoff: CheckoutHandoff): void {
  // Curățăm întâi: o cheie rămasă de la o plată anterioară (prețul, de exemplu) s-ar amesteca
  // în sumarul celei noi și ar arăta o sumă care nu se încasează.
  for (const key of CHECKOUT_KEYS) sessionStorage.removeItem(key)

  sessionStorage.setItem('stripe_client_secret', handoff.clientSecret)
  sessionStorage.setItem('stripe_cancel_url', handoff.cancelUrl)
  sessionStorage.setItem('stripe_checkout_kind', handoff.kind)
  sessionStorage.setItem('stripe_checkout_title', handoff.title)
  if (handoff.price) sessionStorage.setItem('stripe_checkout_price', handoff.price)
  if (handoff.desc) sessionStorage.setItem('stripe_checkout_desc', handoff.desc)
  if (handoff.renewal) sessionStorage.setItem('stripe_checkout_renewal', handoff.renewal)

  window.location.href = '/checkout'
}

export const stripeService = {
  /**
   * Generates a checkout session and redirects the user to Stripe.
   */
  /**
   * @param priceLabel Suma afișată pe ecranul de checkout, formatată de apelant din
   *   `onboardingState.onboardingAdvanceBani`. Nu are voie să fie scrisă aici: prețul e în
   *   `Pricing` pe backend, iar o copie hardcodată aici l-ar contrazice tăcut.
   */
  async redirectToInfiintarePfa(
    successUrl?: string,
    cancelUrl?: string,
    priceLabel?: string,
  ): Promise<void> {
    const origin = window.location.origin
    const effectiveSuccessUrl = successUrl || `${origin}/inregistrare/succes?session_id={{CHECKOUT_SESSION_ID}}`
    const effectiveCancelUrl = cancelUrl || `${origin}/inregistrare/pfa`

    try {
      const response = await api.post<{clientSecret: string}>('/payments/checkout-session', {
        mode: 'payment',
        plan: 'infiintare_pfa',
        successUrl: effectiveSuccessUrl,
        cancelUrl: effectiveCancelUrl
      })
      goToCheckout({
        clientSecret: response.data.clientSecret,
        cancelUrl: effectiveCancelUrl,
        kind: 'advance',
        title: 'Abonament RIDElance Start — avans',
        price: priceLabel,
        desc: 'Plata în avans a abonamentului RIDElance Start. Nerambursabilă.',
      })
    } catch (error) {
      // Refuzul se propagă: de la RL-03 încoace serverul răspunde 422 cu ce mai lipsește din
      // dosar, iar mesajul ăla trebuie să ajungă pe ecran, nu doar în consolă.
      console.error('Failed to create checkout session', error)
      throw error
    }
  },

  /**
   * @param options.cycle Lunar sau anual. Decide și prețul Stripe, și ce scrie pe ecranul de plată.
   */
  async redirectToPlan(
    key: PlanKey,
    successUrl?: string,
    cancelUrl?: string,
    options?: { isPlanChange?: boolean; cycle?: BillingCycle; bcrDiscountRequested?: boolean },
  ): Promise<void> {
    const cycle: BillingCycle = options?.cycle ?? 'monthly'
    const plan = subscriptionPlansFor(cycle).find(p => p.key === key)
    if (!plan) return

    const origin = window.location.origin
    const effectiveSuccessUrl = successUrl || `${origin}/app/dashboard?subscribed=1&session_id={{CHECKOUT_SESSION_ID}}&plan=${key}`
    const effectiveCancelUrl = cancelUrl || `${origin}/inregistrare/abonament`

    const response = await api.post<{clientSecret: string}>('/payments/checkout-session', {
      mode: 'subscription',
      plan: key,
      cycle: cycleParam(cycle),
      isPlanChange: options?.isPlanChange ?? false,
      // Nu schimbă suma încasată acum: serverul o reține pe abonament, iar reducerea pornește
      // după confirmarea BCR.
      bcrDiscountRequested: options?.bcrDiscountRequested ?? false,
      successUrl: effectiveSuccessUrl,
      cancelUrl: effectiveCancelUrl
    })
    goToCheckout({
      clientSecret: response.data.clientSecret,
      cancelUrl: effectiveCancelUrl,
      kind: 'subscription',
      title: plan.title,
      price: chargedPriceLabel(key, cycle),
      desc: plan.summary,
      renewal:
        cycle === 'annual'
          ? `Se reînnoiește automat în fiecare an. Revine la ${plan.price}.`
          : 'Se reînnoiește automat în fiecare lună. Anulezi oricând.',
    })
  },

  async redirectToPublicService(
    key: ServiceKey,
    customer: { customerName: string; customerEmail: string; customerPhone: string },
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<void> {
    const origin = window.location.origin
    const effectiveSuccessUrl = successUrl ?? `${origin}/?service_paid=1`
    const effectiveCancelUrl = cancelUrl ?? `${origin}/servicii`

    const response = await api.post<{ clientSecret: string }>('/payments/public/service-checkout', {
      serviceKey: key,
      customerName: customer.customerName,
      customerEmail: customer.customerEmail,
      customerPhone: customer.customerPhone,
      successUrl: effectiveSuccessUrl,
      cancelUrl: effectiveCancelUrl,
    })
    
    const service = ONE_TIME_SERVICES.find(s => s.key === key)
    goToCheckout({
      clientSecret: response.data.clientSecret,
      cancelUrl: effectiveCancelUrl,
      kind: 'service',
      title: service?.title || 'Serviciu RIDElance',
      price: service?.price,
      desc: service?.desc,
    })
  },

  async redirectToService(key: ServiceKey): Promise<void> {
    const service = ONE_TIME_SERVICES.find(s => s.key === key)
    if (!service) return

    const response = await api.post<{clientSecret: string}>('/payments/checkout-session', {
      mode: 'payment',
      plan: key
    })
    goToCheckout({
      clientSecret: response.data.clientSecret,
      cancelUrl: PFA_PATHS.svcIndividual,
      kind: 'service',
      title: service.title,
      price: service.price,
      desc: service.desc,
    })
  },

  /** Store selected plan in sessionStorage for the registration flow. */
  setSelectedPlan(key: PlanKey): void {
    sessionStorage.setItem('selected_plan', key)
  },

  getSelectedPlan(): PlanKey | null {
    return sessionStorage.getItem('selected_plan') as PlanKey | null
  },

  /** Get subscription status from the backend */
  async getSubscriptionStatus(): Promise<SubscriptionResponse | null> {
    try {
      const response = await api.get<SubscriptionResponse>('/payments/subscription')
      if (response.data) {
        if (response.data.plan) {
          response.data.plan = response.data.plan.toLowerCase() as PlanKey
        }
        if (response.data.pendingPlan) {
          response.data.pendingPlan = response.data.pendingPlan.toLowerCase() as PlanKey
        }
      }
      return response.data
    } catch (error) {
      console.error('Failed to get subscription status', error)
      return null
    }
  },

  /** Get real payment history from the database */
  async getPaymentHistory(page = 1, pageSize = 20): Promise<PaymentHistoryItem[]> {
    try {
      const response = await api.get<PaymentHistoryItem[]>('/payments/history', {
        params: { page, pageSize }
      })
      return response.data
    } catch (error) {
      console.error('Failed to get payment history', error)
      return []
    }
  },

  /** Only for initial registration UI flow (deprecated) */
  activateSubscription(key: PlanKey, nextBilling: Date): void {
    sessionStorage.setItem('active_plan', key)
    sessionStorage.setItem('next_billing_date', nextBilling.toISOString())
  },
}
