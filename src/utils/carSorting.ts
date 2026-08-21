import type { Car } from '../services/cars.service'

/**
 * Ordonarea anunțurilor din marketplace (spec §5).
 *
 * Sortarea se face **pe server**, nu aici. Nu e o preferință de arhitectură: scorul „Recomandate"
 * e stocat pe anunț și expus doar proprietarului (§5.2), deci frontendul public nu îl are și nu
 * ar putea sorta după el. Fișierul ăsta traduce doar eticheta din selector în cheia de query.
 */

export const SORT_OPTIONS = [
  'Recomandate',
  'Cele mai noi',
  'Preț: Mic la Mare',
  'Preț: Mare la Mic',
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]

export const DEFAULT_SORT: SortOption = 'Recomandate'

const SERVER_KEYS: Record<SortOption, string> = {
  Recomandate: 'recommended',
  'Cele mai noi': 'newest',
  'Preț: Mic la Mare': 'price_asc',
  'Preț: Mare la Mic': 'price_desc',
}

export function sortKeyFor(sort: SortOption): string {
  return SERVER_KEYS[sort]
}

/**
 * Filtrele se aplică în browser și **păstrează ordinea** primită de la server. Helperul există ca
 * să facă regula explicită: un `filter` care s-ar transforma vreodată într-un `sort` local ar
 * rupe tăcut ordonarea după scor.
 */
export function preserveServerOrder(cars: Car[]): Car[] {
  return cars
}
