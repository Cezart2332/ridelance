/**
 * Cele 41 de județe plus municipiul București. Lista e fixă și scurtă, deci trăiește în cod:
 * formularele de adresă din onboarding sunt pe calea critică a înrolării și nu au ce căuta
 * în spatele unei cereri de rețea către un repo terț.
 */
export const COUNTIES = [
  'Alba',
  'Arad',
  'Argeș',
  'Bacău',
  'Bihor',
  'Bistrița-Năsăud',
  'Botoșani',
  'Brașov',
  'Brăila',
  'București',
  'Buzău',
  'Caraș-Severin',
  'Călărași',
  'Cluj',
  'Constanța',
  'Covasna',
  'Dâmbovița',
  'Dolj',
  'Galați',
  'Giurgiu',
  'Gorj',
  'Harghita',
  'Hunedoara',
  'Ialomița',
  'Iași',
  'Ilfov',
  'Maramureș',
  'Mehedinți',
  'Mureș',
  'Neamț',
  'Olt',
  'Prahova',
  'Satu Mare',
  'Sălaj',
  'Sibiu',
  'Suceava',
  'Teleorman',
  'Timiș',
  'Tulcea',
  'Vaslui',
  'Vâlcea',
  'Vrancea',
] as const

export type County = (typeof COUNTIES)[number]

/** Compară județe fără să depindă de diacritice sau de majuscule. */
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\s.-]+/g, '')
    .toLowerCase()

/**
 * Forma canonică a unui județ, sau `null` dacă nu se recunoaște.
 *
 * OCR-ul citește ce scrie pe buletin: „CLUJ", „Bistrita-Nasaud", „jud. Timis". Un `<Select>` cere
 * exact una dintre valorile din listă, altfel afișează gol — adică precompletarea ar părea că nu
 * s-a întâmplat, deși valoarea era acolo.
 */
export function canonicalCounty(raw: string | null | undefined): County | null {
  if (!raw) return null

  const wanted = fold(raw.replace(/^jud\.?\s*/i, ''))
  return COUNTIES.find((county) => fold(county) === wanted) ?? null
}
