import { formatAmount, formatLei as formatLeiShared } from '../../../shared/money'

/** Sumele din dashboard se scriu la fel peste tot (QA 23): „12.150,00 lei”. */
export function formatLei(value: number | null | undefined): string {
  return formatLeiShared(value ?? 0)
}

/** Doar cifra, fără unitate — pentru tabele strâmte și tooltip-urile graficelor: „657,01”. */
export function formatNumber(value: number | null | undefined): string {
  return formatAmount(value ?? 0)
}
