/**
 * Reducerea pentru clienții care își deschid cont BCR prin RIDElance.
 *
 * Sumele sunt aceleași cu `Pricing.BcrDiscount` din backend.
 *
 * Bifa **scade** prețul afișat, dar numai pe cel din primele șase luni — atât ține reducerea.
 * Prețul întreg rămâne pe ecran, tăiat, iar sub el scrie de când se revine la el. Varianta veche
 * lăsa cifra neatinsă, ca să nu promită ceva ce plata de a doua zi n-ar fi respectat; problema era
 * că nimeni nu vedea reducerea pentru care bifase. Aici se văd amândouă: cât plătești la început
 * și cât plătești după.
 */

export const BCR_DISCOUNT = {
  monthlyLei: 50,
  months: 6,
}

/**
 * Cât rămâne dintr-un preț lunar după reducere.
 *
 * Nu coboară sub zero: un plan mai ieftin decât reducerea n-ar avea preț negativ, ar fi gratuit.
 * Azi nu există unul, dar cifra vine din date, iar datele se schimbă fără să treacă pe aici.
 */
export function bcrDiscountedLei(monthlyLei: number): number {
  return Math.max(0, monthlyLei - BCR_DISCOUNT.monthlyLei)
}

/** Textul de lângă bifă. Într-un singur loc: apare pe pagina publică și în aplicație. */
export const BCR_DISCOUNT_LABEL =
  `Îmi deschid cont BCR — ${BCR_DISCOUNT.monthlyLei} lei/lună reducere, ${BCR_DISCOUNT.months} luni`

export const BCR_DISCOUNT_INFO =
  'Reducerea se aplică după confirmarea BCR. Până atunci plătești prețul întreg, iar cele ' +
  `${BCR_DISCOUNT.months} luni încep din momentul confirmării.`

/**
 * Puntea dintre pagina publică și aplicație.
 *
 * Pe `/abonamente-preturi` nu există sesiune, deci bifa n-are unde pleca. Se ține în
 * `sessionStorage` și devine valoarea inițială la alegerea abonamentului, ca omul să n-o bifeze
 * de două ori pentru aceeași decizie.
 *
 * `sessionStorage`, nu `localStorage`: e o intenție de moment, nu o preferință. Un tab nou, peste
 * o lună, n-are de ce să pornească cu ea bifată.
 */
const STORAGE_KEY = 'ridelance_bcr_discount_intent'

export function readBcrDiscountIntent(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // Sesiune privată sau storage blocat. Lipsa punții nu e o eroare: bifa se pune din nou.
    return false
  }
}

export function writeBcrDiscountIntent(value: boolean): void {
  try {
    if (value) {
      window.sessionStorage.setItem(STORAGE_KEY, '1')
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Vezi mai sus. Bifa rămâne validă în pagina curentă, doar că nu supraviețuiește navigării.
  }
}
