/**
 * Reducerea pentru clienții care își deschid cont BCR prin RIDElance.
 *
 * Sumele sunt aceleași cu `Pricing.BcrDiscount` din backend. Nu se calculează nimic din ele în
 * interfață: bifa nu schimbă prețul afișat, pentru că nu schimbă nici suma încasată. Reducerea
 * pornește abia după ce BCR confirmă contul, iar până atunci clientul plătește întreg.
 */

export const BCR_DISCOUNT = {
  monthlyLei: 50,
  months: 6,
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
