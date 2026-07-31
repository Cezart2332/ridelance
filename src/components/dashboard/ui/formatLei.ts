/** Sumele din dashboard se scriu la fel peste tot: întregi, cu separator românesc. */
export function formatLei(value: number | null | undefined): string {
  return `${Math.round(value ?? 0).toLocaleString('ro-RO')} lei`
}

/** Doar cifra, fără unitate — pentru axe de grafic și tabele strâmte. */
export function formatNumber(value: number | null | undefined): string {
  return Math.round(value ?? 0).toLocaleString('ro-RO')
}
