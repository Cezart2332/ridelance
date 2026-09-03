/**
 * Cum se întoarce avansul plătit în onboarding, ca reducere la primul abonament.
 *
 * Oglinda lui `Pricing.OnboardingAdvanceCredit` din backend. Backendul e cel care încasează —
 * aici doar se ANUNȚĂ ce urmează să se întâmple, deci formele trebuie ținute identice: dacă una
 * se schimbă fără cealaltă, pagina promite o reducere pe care casa n-o dă.
 *
 * De ce nu un singur cupon de 399 lei: Stripe nu reportează restul unei reduceri pe factura
 * următoare. Pe Solo (199/lună) un cupon „once" de 399 ar fi acoperit o singură factură, iar a
 * doua lună s-ar fi facturat întreagă. De aceea fiecare plan are forma lui.
 */

/** Avansul, în lei. Aceeași valoare ca `Pricing.RidelanceStart.OnboardingAdvanceBani`. */
export const ONBOARDING_ADVANCE_LEI = 399

/** Forma reducerii pe un plan: cât se scade și de pe câte facturi. */
interface CreditShape {
  amountOffLei: number
  months: number
}

const SHAPES: Record<string, CreditShape> = {
  // Două luni întregi. 2 × 199 = 398, cu un leu sub avans — 399 nu se împarte la 199.
  solo: { amountOffLei: 199, months: 2 },
  // Avansul E prețul planului: exact o lună.
  start: { amountOffLei: 399, months: 1 },
  // 599 − 399 = 200 în prima lună.
  pro: { amountOffLei: 399, months: 1 },
}

export interface AdvanceCredit {
  /** Câte facturi ies pe zero. 0 înseamnă doar o reducere parțială în prima lună. */
  freeMonths: number
  /** Cât se plătește pe prima factură, în lei. */
  firstMonthLei: number
  /** Rândul de sub preț, gata scris. */
  note: string
}

/**
 * Ce se întâmplă cu primul abonament pentru un plan, sau `null` dacă planul n-are reducere
 * (flota nu trece prin onboardingul PFA, deci n-a plătit avansul).
 */
export function advanceCreditFor(planKey: string, monthlyLei: number): AdvanceCredit | null {
  const shape = SHAPES[planKey.toLowerCase()]
  if (!shape) return null

  const firstMonthLei = Math.max(0, monthlyLei - shape.amountOffLei)
  // O lună e „gratuită" doar dacă reducerea o acoperă integral; altfel se plătește diferența.
  const freeMonths = firstMonthLei === 0 ? shape.months : 0

  const note =
    freeMonths >= 2
      ? `Primele ${freeMonths} luni sunt gratuite — ai plătit avansul.`
      : freeMonths === 1
        ? 'Prima lună e gratuită — ai plătit avansul.'
        : `Prima lună: ${firstMonthLei.toLocaleString('ro-RO')} lei — avansul se scade din ea.`

  return { freeMonths, firstMonthLei, note }
}
