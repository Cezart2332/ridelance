import blueLogo from '../assets/blue_logo.svg'
import boltLogo from '../assets/bolt_logo.svg'
import uberLogo from '../assets/uber_logo.svg'

/**
 * Unde operează Uber, Bolt și Blue în România.
 *
 * Lista e cea consolidată din sursele oficiale ale platformelor. Coordonatele sunt adăugate de
 * noi, ca harta să pună fiecare punct exact unde e orașul.
 *
 * Numărul de orașe **nu** se scrie de mână nicăieri. Cifrele de pe pagină se numără din listă
 * (`countFor`), fiindcă un total scris separat rămâne în urmă la primul oraș adăugat — și e exact
 * genul de cifră pe care o citește cineva care decide dacă își deschide PFA.
 */

export type PlatformId = 'uber' | 'bolt' | 'blue'

export interface Platform {
  id: PlatformId
  name: string
  logo: string
  /** Culoarea mărcii, folosită doar pentru accente discrete — nu pentru fundaluri de card. */
  color: string
  /** Raportul lățime/înălțime al logoului, ca să nu se deformeze la scalare. */
  aspect: number
  sourceUrl: string
  sourceLabel: string
}

export const PLATFORMS: Platform[] = [
  {
    id: 'uber',
    name: 'Uber',
    logo: uberLogo,
    color: '#010202',
    aspect: 926.906 / 321.777,
    sourceUrl: 'https://www.uber.com/global/ro/r/romania/cities/',
    sourceLabel: 'Uber — pagina oficială România',
  },
  {
    id: 'bolt',
    name: 'Bolt',
    logo: boltLogo,
    color: '#2a9c64',
    aspect: 54 / 32,
    sourceUrl: 'https://bolt.eu/ro-ro/cities/',
    sourceLabel: 'Bolt — locații oficiale',
  },
  {
    id: 'blue',
    name: 'Blue',
    logo: blueLogo,
    color: '#213be7',
    aspect: 165 / 66,
    sourceUrl: 'https://blue.ro/',
    sourceLabel: 'Blue — acoperire oficială',
  },
]

export interface RidesharingLocation {
  name: string
  lat: number
  lon: number
  platforms: PlatformId[]
}

export const RIDESHARING_LOCATIONS: RidesharingLocation[] = [
  { name: 'Alba Iulia', lat: 46.07, lon: 23.57, platforms: ['uber', 'bolt'] },
  { name: 'Alexandria', lat: 43.98, lon: 25.33, platforms: ['uber'] },
  { name: 'Arad', lat: 46.18, lon: 21.31, platforms: ['uber', 'bolt'] },
  { name: 'Bacău', lat: 46.57, lon: 26.91, platforms: ['uber', 'bolt'] },
  { name: 'Baia Mare', lat: 47.66, lon: 23.58, platforms: ['uber', 'bolt'] },
  { name: 'Bistrița', lat: 47.13, lon: 24.49, platforms: ['uber', 'bolt'] },
  { name: 'Botoșani', lat: 47.75, lon: 26.66, platforms: ['uber', 'bolt'] },
  { name: 'Brașov', lat: 45.65, lon: 25.61, platforms: ['uber', 'bolt'] },
  { name: 'Brăila', lat: 45.27, lon: 27.96, platforms: ['uber', 'bolt'] },
  {
    name: 'București',
    lat: 44.43,
    lon: 26.1,
    platforms: ['uber', 'bolt', 'blue'],
  },
  { name: 'Buzău', lat: 45.15, lon: 26.82, platforms: ['uber', 'bolt'] },
  { name: 'Bârlad', lat: 46.23, lon: 27.67, platforms: ['bolt'] },
  { name: 'Cluj-Napoca', lat: 46.77, lon: 23.6, platforms: ['uber', 'bolt'] },
  { name: 'Constanța', lat: 44.17, lon: 28.64, platforms: ['uber', 'bolt'] },
  { name: 'Craiova', lat: 44.32, lon: 23.8, platforms: ['uber', 'bolt'] },
  { name: 'Călărași', lat: 44.2, lon: 27.33, platforms: ['uber', 'bolt'] },
  { name: 'Deva', lat: 45.88, lon: 22.9, platforms: ['uber', 'bolt'] },
  {
    name: 'Drobeta-Turnu Severin',
    lat: 44.63,
    lon: 22.66,
    platforms: ['uber', 'bolt'],
  },
  { name: 'Focșani', lat: 45.7, lon: 27.18, platforms: ['uber', 'bolt'] },
  { name: 'Galați', lat: 45.44, lon: 28.05, platforms: ['uber', 'bolt'] },
  { name: 'Giurgiu', lat: 43.9, lon: 25.97, platforms: ['bolt'] },
  { name: 'Hunedoara', lat: 45.75, lon: 22.9, platforms: ['uber', 'bolt'] },
  { name: 'Iași', lat: 47.16, lon: 27.59, platforms: ['uber', 'bolt'] },
  { name: 'Lugoj', lat: 45.69, lon: 21.9, platforms: ['bolt'] },
  { name: 'Mediaș', lat: 46.16, lon: 24.35, platforms: ['bolt'] },
  { name: 'Oradea', lat: 47.06, lon: 21.93, platforms: ['uber', 'bolt'] },
  { name: 'Piatra Neamț', lat: 46.93, lon: 26.37, platforms: ['uber', 'bolt'] },
  { name: 'Pitești', lat: 44.86, lon: 24.87, platforms: ['uber', 'bolt'] },
  { name: 'Ploiești', lat: 44.94, lon: 26.03, platforms: ['uber', 'bolt'] },
  { name: 'Reșița', lat: 45.3, lon: 21.89, platforms: ['uber', 'bolt'] },
  { name: 'Roman', lat: 46.93, lon: 26.93, platforms: ['bolt'] },
  { name: 'Râmnicu Vâlcea', lat: 45.1, lon: 24.37, platforms: ['uber', 'bolt'] },
  { name: 'Satu Mare', lat: 47.79, lon: 22.89, platforms: ['uber', 'bolt'] },
  { name: 'Sfântu Gheorghe', lat: 45.86, lon: 25.79, platforms: ['bolt'] },
  { name: 'Sibiu', lat: 45.79, lon: 24.15, platforms: ['uber', 'bolt'] },
  { name: 'Slatina', lat: 44.43, lon: 24.37, platforms: ['uber', 'bolt'] },
  { name: 'Slobozia', lat: 44.56, lon: 27.37, platforms: ['uber', 'bolt'] },
  { name: 'Suceava', lat: 47.65, lon: 26.26, platforms: ['uber', 'bolt'] },
  { name: 'Timișoara', lat: 45.76, lon: 21.23, platforms: ['uber', 'bolt'] },
  { name: 'Tulcea', lat: 45.18, lon: 28.8, platforms: ['uber', 'bolt'] },
  { name: 'Turda', lat: 46.57, lon: 23.79, platforms: ['bolt'] },
  { name: 'Târgoviște', lat: 44.93, lon: 25.46, platforms: ['uber', 'bolt'] },
  { name: 'Târgu Jiu', lat: 45.04, lon: 23.27, platforms: ['uber', 'bolt'] },
  { name: 'Târgu Mureș', lat: 46.54, lon: 24.56, platforms: ['uber', 'bolt'] },
  { name: 'Vaslui', lat: 46.64, lon: 27.73, platforms: ['uber', 'bolt'] },
  { name: 'Zalău', lat: 47.19, lon: 23.06, platforms: ['uber', 'bolt'] },
  {
    name: 'Valea Prahovei',
    lat: 45.35,
    lon: 25.65,
    platforms: ['bolt'],
  },
]

/** Câte locații are o platformă. Se numără, nu se scrie — vezi nota din capul fișierului. */
export const countFor = (platform: PlatformId): number =>
  RIDESHARING_LOCATIONS.filter((location) => location.platforms.includes(platform)).length

/** Câte locații are lista, cu totul. Se numără, ca și cifrele pe platformă. */
export const LOCATION_COUNT = RIDESHARING_LOCATIONS.length

/** Data la care lista a fost verificată ultima dată în sursele platformelor. */
export const COVERAGE_CHECKED_AT = '30 august 2026'

/**
 * Avertismentul de care depinde cât de mult se poate baza cineva pe lista asta.
 *
 * Un singur rând, lângă surse. Restul precizărilor — de ce Deva și Hunedoara apar separat, ce e
 * de fapt „Valea Prahovei" — au fost scoase: erau note de subsol despre felul în care numără
 * platformele, nu răspunsuri la întrebarea pentru care intră cineva pe pagină.
 */
export const COVERAGE_DISCLAIMER =
  'Disponibilitatea exactă în interiorul unei arii poate varia. Înainte să te bazezi pe ea, verific-o în aplicația platformei.'

export const EXTRA_SOURCE = {
  url: 'https://www.economica.net/uber-se-extinde-intr-un-nou-oras-din-romania_951697.html',
  label: 'Uber — confirmarea listei de orașe',
}
