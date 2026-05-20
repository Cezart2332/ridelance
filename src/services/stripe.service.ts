import { api } from '../lib/axios'

/**
 * Stripe integration service using Payment Links.
 * Redirects users to pre-built Stripe-hosted checkout pages.
 */

export type PlanKey = 'solo' | 'start' | 'pro'
export type ServiceKey = 'infiintare_pfa' | 'sediu_social' | 'start_ride'

export interface SubscriptionResponse {
  id: string
  plan: PlanKey
  status: string
  stripeSubscriptionId: string | null
  firstBillingDateUtc: string
  nextBillingDateUtc: string | null
  createdAtUtc: string
  dashboardAccessGranted: boolean
  pfaStatus: string | null
  pfaRegistrationType: string | null
}

export interface PlanInfo {
  key: PlanKey
  title: string
  price: string
  priceNote: string
  summary: string
  intro?: string
  list: string[]
  footnote?: string
  cta: string
  priceId: string
  highlighted: boolean
}

export interface ServiceInfo {
  key: ServiceKey
  title: string
  price: string
  priceNote?: string
  desc: string
  tagline?: string
  priceId: string
  cta: string
}

export const SUBSCRIPTION_PLANS: PlanInfo[] = [
  {
    key: 'solo',
    title: 'RIDElance Solo',
    price: '49 lei / săptămână',
    priceNote: 'Reînnoire automată în fiecare luni la 15:00.',
    summary: 'Pentru șoferii care au deja contabil sau vor să își gestioneze singuri partea contabilă, dar vor infrastructura RIDElance.',
    cta: 'Alege Solo',
    footnote: 'Fără contabilitate lunară inclusă.',
    list: [
      'Deschidere PFA la tarif preferențial — 300 lei',
      'Export lunar pentru contabilul propriu',
      'Asistență și consultanță constantă',
      'Acces complet în dashboardul RIDElance',
      'Organizare completă pentru activitatea de șofer PFA',
      'Reduceri și beneficii prin partenerii RIDElance',
    ],
    priceId: import.meta.env.VITE_PRICE_SOLO || '',
    highlighted: false,
  },
  {
    key: 'start',
    title: 'RIDElance Start',
    price: '99 lei / săptămână',
    priceNote: 'Reînnoire automată în fiecare luni la 15:00.',
    summary: 'Pentru șoferii care vor să înceapă rapid și să aibă totul pus la punct.',
    cta: 'Începe cu Start',
    list: [
      'Deschidere PFA cu cost rambursabil + bonus 100 lei',
      'Asistență și consultanță constantă',
      'Acces complet în dashboardul RIDElance',
      'Contabilitate completă pentru PFA',
      'Reduceri și beneficii prin partenerii RIDElance',
    ],
    priceId: import.meta.env.VITE_PRICE_START || '',
    highlighted: false,
  },
  {
    key: 'pro',
    title: 'RIDElance Pro',
    price: '149 lei / săptămână',
    priceNote: 'Reînnoire automată în fiecare luni la 15:00.',
    summary: 'Pentru cei care vor mai mult confort, suport prioritar și avantaje suplimentare.',
    intro: 'Include tot ce ai în Start, plus:',
    cta: 'Alege Pro',
    list: [
      'Găzduire sediu social gratuit în București / Ilfov',
      'Suport prioritar',
      'Oferte, campanii și promoții exclusive PRO',
      'Reducere la chiria mașinilor RIDElance',
    ],
    priceId: import.meta.env.VITE_PRICE_PRO || '',
    highlighted: true,
  },
]

export const ONE_TIME_SERVICES: ServiceInfo[] = [
  {
    key: 'infiintare_pfa',
    title: 'Înființare PFA',
    price: '450 lei',
    desc: 'Deschizi rapid un PFA printr-un proces simplu și organizat, fără abonament lunar.',
    cta: 'Cumpără serviciul',
    priceId: import.meta.env.VITE_PRICE_INFIINTARE_PFA || '',
  },
  {
    key: 'sediu_social',
    title: 'Găzduire Sediu Social',
    price: '449 lei / an',
    desc: 'O soluție practică pentru cei care au nevoie de sediu social pentru PFA în București / Ilfov.',
    cta: 'Cumpără serviciul',
    priceId: import.meta.env.VITE_PRICE_SEDIU_SOCIAL || '',
  },
  {
    key: 'start_ride',
    title: 'Start Ride',
    price: '799 lei',
    priceNote: '* nu include taxe ARR',
    desc: 'Începi pe PFA, fără să pierzi timp cu pași neclari. RIDElance te ghidează prin deschiderea PFA-ului și activarea pentru ridesharing, până ești pregătit să lucrezi independent.',
    tagline: 'Proces clar. Pornire corectă. Suport până la activare.',
    cta: 'Alege serviciul',
    priceId: import.meta.env.VITE_PRICE_START_RIDE || '',
  },
]

export const stripeService = {
  /**
   * Generates a checkout session and redirects the user to Stripe.
   */
  async redirectToInfiintarePfa(successUrl?: string, cancelUrl?: string): Promise<void> {
    const origin = window.location.origin
    const effectiveSuccessUrl = successUrl || `${origin}/inregistrare/succes?session_id={{CHECKOUT_SESSION_ID}}`
    const effectiveCancelUrl = cancelUrl || `${origin}/inregistrare/pfa`

    try {
      const response = await api.post<{url: string}>('/payments/checkout-session', {
        priceId: import.meta.env.VITE_PRICE_INFIINTARE_PFA,
        mode: 'payment',
        plan: 'infiintare_pfa',
        successUrl: effectiveSuccessUrl,
        cancelUrl: effectiveCancelUrl
      })
      window.location.href = response.data.url
    } catch (error) {
      console.error('Failed to create checkout session', error)
    }
  },

  async redirectToPlan(key: PlanKey, successUrl?: string, cancelUrl?: string): Promise<void> {
    const plan = SUBSCRIPTION_PLANS.find(p => p.key === key)
    if (!plan?.priceId) return
    
    const origin = window.location.origin
    const effectiveSuccessUrl = successUrl || `${origin}/inregistrare/pfa?subscribed=1&session_id={{CHECKOUT_SESSION_ID}}&plan=${key}`
    const effectiveCancelUrl = cancelUrl || `${origin}/inregistrare/abonament`

    try {
      const response = await api.post<{url: string}>('/payments/checkout-session', {
        priceId: plan.priceId,
        mode: 'subscription',
        plan: key,
        billingAnchorUnix: null,
        successUrl: effectiveSuccessUrl,
        cancelUrl: effectiveCancelUrl
      })
      window.location.href = response.data.url
    } catch (error) {
      console.error('Failed to create checkout session', error)
    }
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

    const response = await api.post<{ url: string }>('/payments/public/service-checkout', {
      serviceKey: key,
      customerName: customer.customerName,
      customerEmail: customer.customerEmail,
      customerPhone: customer.customerPhone,
      successUrl: effectiveSuccessUrl,
      cancelUrl: effectiveCancelUrl,
    })
    window.location.href = response.data.url
  },

  async redirectToService(key: ServiceKey): Promise<void> {
    const service = ONE_TIME_SERVICES.find(s => s.key === key)
    if (!service?.priceId) return
    
    try {
      const response = await api.post<{url: string}>('/payments/checkout-session', {
        priceId: service.priceId,
        mode: 'payment',
        plan: key
      })
      window.location.href = response.data.url
    } catch (error) {
      console.error('Failed to create checkout session', error)
    }
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
      return response.data
    } catch (error) {
      console.error('Failed to get subscription status', error)
      return null
    }
  },

  /** Only for initial registration UI flow (deprecated) */
  activateSubscription(key: PlanKey, nextBilling: Date): void {
    sessionStorage.setItem('active_plan', key)
    sessionStorage.setItem('next_billing_date', nextBilling.toISOString())
  },
}
