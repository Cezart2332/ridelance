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
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toLowerCase()

/** Indicativul auto al fiecărui județ — așa apare județul pe buletin („Jud.CJ"). */
const COUNTY_CODES: Record<string, County> = {
  AB: 'Alba', AR: 'Arad', AG: 'Argeș', BC: 'Bacău', BH: 'Bihor', BN: 'Bistrița-Năsăud',
  BT: 'Botoșani', BV: 'Brașov', BR: 'Brăila', B: 'București', BZ: 'Buzău', CS: 'Caraș-Severin',
  CL: 'Călărași', CJ: 'Cluj', CT: 'Constanța', CV: 'Covasna', DB: 'Dâmbovița', DJ: 'Dolj',
  GL: 'Galați', GR: 'Giurgiu', GJ: 'Gorj', HR: 'Harghita', HD: 'Hunedoara', IL: 'Ialomița',
  IS: 'Iași', IF: 'Ilfov', MM: 'Maramureș', MH: 'Mehedinți', MS: 'Mureș', NT: 'Neamț', OT: 'Olt',
  PH: 'Prahova', SM: 'Satu Mare', SJ: 'Sălaj', SB: 'Sibiu', SV: 'Suceava', TR: 'Teleorman',
  TM: 'Timiș', TL: 'Tulcea', VS: 'Vaslui', VL: 'Vâlcea', VN: 'Vrancea',
}

/**
 * Forma canonică a unui județ, sau `null` dacă nu se recunoaște.
 *
 * OCR-ul citește ce scrie pe buletin: „CJ", „Jud.BV", „CLUJ", „Bistrita-Nasaud", „Mun. București",
 * „Sector 3". Un `<Select>` cere exact una dintre valorile din listă, altfel afișează gol — adică
 * precompletarea ar părea că nu s-a întâmplat, deși valoarea era acolo. Aceeași regulă ca
 * `Judete.Canonical` din backend.
 */
export function canonicalCounty(raw: string | null | undefined): County | null {
  if (!raw) return null

  let wanted = fold(raw)
  for (const prefix of ['judetul', 'jud', 'municipiul', 'mun']) {
    if (wanted.startsWith(prefix) && wanted.length > prefix.length) {
      wanted = wanted.slice(prefix.length)
      break
    }
  }

  // Buletinele din București scriu sectorul în loc de județ.
  if (wanted.startsWith('sector') || (wanted.startsWith('sec') && wanted.length <= 4)) return 'București'

  return (
    COUNTIES.find((county) => fold(county) === wanted) ??
    COUNTY_CODES[wanted.toUpperCase()] ??
    null
  )
}
