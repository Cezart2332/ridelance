/**
 * Datele de facturare ale abonamentelor RIDElance.
 *
 * Reguli:
 *  - Abonamentul se încasează la cumpărare, nu la o zi fixă a săptămânii.
 *  - Reînnoirea cade la aniversarea plății: o lună sau un an mai târziu, după ciclul ales.
 *
 * Până aici trăia calculul „lunea următoare la 15:00, ora României", cu tot cu propria regulă de
 * ora de vară. A dispărut odată cu ancora: nu mai există o zi în care se încasează de la toată
 * lumea, deci nici o dată de calculat în frontend. Data reală vine de la server
 * (`nextBillingDateUtc`); funcțiile de aici doar o formatează sau o proiectează local.
 */

import type { SubscriptionCycle } from '../services/stripe.service'

/**
 * Următoarea încasare, pornind de la o dată dată. Folosită doar ca estimare locală când serverul
 * n-a răspuns încă — sursa adevărată e `nextBillingDateUtc` de pe abonament.
 */
export function nextBillingDate(from: Date, cycle: SubscriptionCycle = 'Monthly'): Date {
  const next = new Date(from)
  if (cycle === 'Annual') next.setFullYear(next.getFullYear() + 1)
  else next.setMonth(next.getMonth() + 1)
  return next
}

/** Cum se numește ciclul în text: „lunar" / „anual". */
export function cycleLabel(cycle: SubscriptionCycle | null | undefined): string {
  return cycle === 'Annual' ? 'anual' : 'lunar'
}

/** Format a Date for display in Romanian locale. */
export function formatRomanianDate(date: Date): string {
  return date.toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Returns true if the billing date is in the future (account is "pending billing"). */
export function isPendingBilling(billingDate: Date): boolean {
  return billingDate > new Date()
}
