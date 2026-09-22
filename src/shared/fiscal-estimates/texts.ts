/** Textele motorului de taxe estimate. Sumele vin din backend; aici e doar formularea. */

export const COMPONENT_LABEL: Record<string, string> = {
  CAS: 'CAS (pensie)',
  CASS: 'CASS (sănătate)',
  INCOME_TAX: 'Impozit pe venit',
  PLATFORM_TAXES: 'TVA / taxe platforme',
}

export const HOW_WE_CALCULATE =
  'Estimăm automat CAS, CASS și impozitul pe venit din profilul tău fiscal și din veniturile și cheltuielile înregistrate. ' +
  'Sumele se actualizează pe măsură ce lucrezi și pot diferi de obligațiile finale. ' +
  'Dacă ți se schimbă situația, actualizează profilul fiscal.'

export function formatLei(value: number): string {
  return `${Math.round(value).toLocaleString('ro-RO')} lei`
}

/** Ce lipsește, pe înțelesul PFA-ului. */
export function reasonText(reasonCode: string | null, missing: string[], taxYear: number): string {
  switch (reasonCode) {
    case 'COVERAGE_GAP':
      return missing.length
        ? `Nu avem veniturile pentru perioada ${missing.join(', ')}. Fără ele nu putem estima anul.`
        : 'Nu avem încă venituri înregistrate pentru acest an.'
    case 'SHORT_HISTORY':
      return 'Avem nevoie de cel puțin 4 săptămâni de activitate.'
    case 'DATA_CORRECTION_PENDING':
      return 'Așteptăm corectarea datelor PFA pe care le-ai semnalat.'
    case 'PENSIONER_MID_YEAR':
      return `Avem nevoie de detalii despre pensionarea din ${taxYear}.`
    case 'OTHER_INDEPENDENT_TOTAL':
      return 'Avem nevoie de venitul net anual din celelalte activități independente.'
    case 'CASS_EXCEPTION_UNKNOWN':
      return missing.includes('salaryAboveCassMin')
        ? 'Spune-ne dacă salariul tău din acest an trece de pragul minim CASS.'
        : 'Avem nevoie să știm dacă ești deja asigurat CASS din celelalte venituri.'
    case 'CASS_OPT_IN':
      return 'Avem nevoie de baza aleasă pentru CASS.'
    case 'CARRIED_LOSSES':
      return 'Avem nevoie de anul și suma pierderii fiscale reportate.'
    case 'CROSS_BORDER':
      return 'Situația din alt stat trebuie discutată cu contabilul.'
    case 'TAX_PAYMENTS_MISSING':
      return `Ai spus că ai plătit deja taxe pentru ${taxYear}, dar plățile nu apar încă la noi. Contabilul le va înregistra.`
    default:
      return 'Nu avem încă toate datele pentru estimare.'
  }
}
