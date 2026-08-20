import type { Car } from '../services/cars.service'

/**
 * Ordonarea anunțurilor din marketplace (spec §5).
 *
 * „Recomandate" e sortarea implicită și singura care nu se poate calcula în frontend: scorul e
 * stocat pe anunț și recalculat pe server (§5.2). Aici doar se aplică, împreună cu criteriile de
 * departajare — care sunt partea importantă. Fără ele, două anunțuri cu același scor pot ieși în
 * ordine diferită la două cereri, iar la paginare asta înseamnă rânduri care sar sau dispar.
 */

export const SORT_OPTIONS = [
  'Recomandate',
  'Cele mai noi',
  'Preț: Mic la Mare',
  'Preț: Mare la Mic',
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]

export const DEFAULT_SORT: SortOption = 'Recomandate'

/**
 * Anunțurile indisponibile stau după cele disponibile, indiferent de scor (§5.2).
 * Se compară ca numere, ca ordonarea să rămână o singură expresie.
 */
const availabilityRank = (car: Car): number => (car.status === 'Available' ? 0 : 1)

/**
 * `score DESC, createdAt DESC, id ASC`.
 *
 * Spec-ul cere `updated_at` ca al doilea criteriu, dar DTO-ul public nu îl expune încă; până
 * atunci `createdAtUtc` joacă același rol de departajare stabilă. Scorul lipsă se citește ca 0,
 * nu ca „exclude": cât timp API-ul nu îl trimite, toate anunțurile sunt la egalitate și ordinea
 * cade pe vechime — un rezultat corect, nu unul gol.
 */
function compareRecommended(a: Car, b: Car): number {
  const byAvailability = availabilityRank(a) - availabilityRank(b)
  if (byAvailability !== 0) return byAvailability

  const byScore = (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0)
  if (byScore !== 0) return byScore

  const byDate = b.createdAtUtc.localeCompare(a.createdAtUtc)
  if (byDate !== 0) return byDate

  return a.id.localeCompare(b.id)
}

/** Nu mută lista primită — apelantul o folosește și pentru alte lucruri. */
export function sortCars(cars: Car[], sort: SortOption): Car[] {
  const result = [...cars]

  switch (sort) {
    case 'Recomandate':
      return result.sort(compareRecommended)
    case 'Cele mai noi':
      return result.sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc) || a.id.localeCompare(b.id))
    case 'Preț: Mic la Mare':
      return result.sort((a, b) => a.pricePerWeek - b.pricePerWeek || a.id.localeCompare(b.id))
    case 'Preț: Mare la Mic':
      return result.sort((a, b) => b.pricePerWeek - a.pricePerWeek || a.id.localeCompare(b.id))
  }
}
