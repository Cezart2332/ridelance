/**
 * Oferta Eldrive pentru clienții RIDElance.
 *
 * Într-un singur fișier pentru că apare în două locuri — pagina publică de Parteneri și Beneficii
 * din dashboard — iar un tarif scris de două ori e un tarif care va ajunge diferit.
 *
 * Textele sunt cele din materialul primit de la partener, cu o singură abatere: sumele se scriu cu
 * virgulă, ca peste tot în interfața românească. Cifrele nu se rotunjesc și nu se recalculează
 * nicăieri — se afișează exact așa cum sunt negociate.
 */

export interface EldriveTariff {
  key: string
  title: string
  /** Rândul mic de sub titlu: la ce stații și în ce interval se aplică. */
  scope: string
  price: string
  /** Unitatea, cu precizarea care ține de tariful ăsta. */
  unit: string
  /** Tariful mic poartă accentul mărcii: culoarea spune când merită încărcat. */
  highlighted: boolean
}

export const ELDRIVE_TARIFFS: EldriveTariff[] = [
  {
    key: 'night',
    title: 'Tarif noapte',
    scope: 'Stațiile eligibile 22:00–06:00',
    price: '1,50',
    unit: 'lei / kWh · TVA inclus',
    highlighted: true,
  },
  {
    key: 'day',
    title: 'Tarif zi',
    scope: 'Stațiile eligibile 06:00–22:00',
    price: '2,30',
    unit: 'lei / kWh · TVA inclus',
    highlighted: false,
  },
  {
    key: 'nonstop',
    title: 'Non-stop',
    scope: 'Mega Mall & Unirea',
    price: '1,50',
    unit: 'lei / kWh · 24/7',
    highlighted: true,
  },
]

/** Blocul „ce e integrat la noi": numărul de stații și ce se vede despre ele. */
export const ELDRIVE_INTEGRATION = {
  badge: 'Integrat în RIDElance',
  title: 'Harta interactivă',
  stationCount: 17,
  text: 'stații afișate cu listă, pin-uri, porturi și navigare',
}

export const ELDRIVE_NETWORK = {
  stationCount: 17,
  area: 'București + Ilfov',
}

/** Textele secțiunii de hartă, sub oferta Eldrive. */
export const ELDRIVE_MAP_SECTION = {
  kicker: 'Stații incluse',
  title: 'Unde încarci la tarif RIDElance',
  text: 'Alege stația din listă sau de pe hartă, verifică tariful și pornește navigarea direct din telefon.',
}

/** Ce vezi în platformă pentru fiecare stație. */
export const ELDRIVE_CAPABILITIES = [
  {
    title: 'Listă completă de stații',
    text: 'Vezi într-un singur loc toate stațiile incluse în beneficiu, cu adresă exactă și date utile.',
  },
  {
    title: 'Detalii tehnice',
    text: 'Fiecare stație poate afișa număr de porturi, putere, tipuri de conectori și alte informații relevante.',
  },
  {
    title: 'Navigare rapidă',
    text: 'Butoane directe către Google Maps sau Waze, utile mai ales în utilizarea de pe telefon.',
  },
]

/** Cum se taxează o stație: zi și noapte diferit, sau același tarif la orice oră. */
export type EldriveStationTariff = 'daynight' | 'nonstop'

export interface EldriveStation {
  id: string
  name: string
  address: string
  tariff: EldriveStationTariff
  latitude: number
  longitude: number
  /**
   * Punctul e la nivel de stradă, nu la numărul exact: geocodarea n-a găsit adresa întreagă.
   * Navigarea merge oricum pe adresa scrisă, nu pe coordonate, deci șoferul ajunge unde trebuie.
   */
  approximate?: boolean
}

/**
 * Stațiile eligibile, din harta primită de la partener.
 *
 * Coordonatele sunt calculate o singură dată, din adrese, cu geocodarea Mapbox — nu la fiecare
 * deschidere a paginii, cum făcea materialul partenerului (17 cereri înainte să apară un pin).
 * Snagov Plaza e căutată după nume: adresa ei („Intersecția Snagov, DN1”) cădea pe același punct
 * ca Cosmoville. Bragadiru 1 și 2 sunt vecine pe aceeași stradă și au același punct; harta le
 * desface vizual.
 */
export const ELDRIVE_STATIONS: EldriveStation[] = [
  { id: 'pipera-plaza', name: 'Pipera Plaza', address: 'Șoseaua București Nord nr. 14, Voluntari, Ilfov', tariff: 'daynight', latitude: 44.490276, longitude: 26.126937 },
  { id: 'afi-palace-cotroceni', name: 'AFI Palace Cotroceni', address: 'Bulevardul General Paul Teodorescu nr. 4, București', tariff: 'daynight', latitude: 44.429233, longitude: 26.053527 },
  { id: 'cosmoville-balotesti', name: 'Cosmoville Balotești', address: 'Calea București nr. 1M, Balotești, Ilfov', tariff: 'daynight', latitude: 44.623312, longitude: 26.069422, approximate: true },
  { id: 'lemon-retail-park', name: 'Lemon Retail Park', address: 'Strada Popasului nr. 110, Voluntari, Ilfov', tariff: 'daynight', latitude: 44.490696, longitude: 26.153835 },
  { id: 'la-strada-popesti-leordeni', name: 'La Strada Popești-Leordeni', address: 'Strada Amurgului nr. 34, Popești-Leordeni, Ilfov', tariff: 'daynight', latitude: 44.370639, longitude: 26.150814 },
  { id: 'la-strada-bragadiru-1', name: 'La Strada Bragadiru 1', address: 'Strada Cristalului nr. 3, Bragadiru, Ilfov', tariff: 'daynight', latitude: 44.388265, longitude: 26.010378 },
  { id: 'la-strada-bragadiru-2', name: 'La Strada Bragadiru 2', address: 'Strada Cristalului nr. 1, Bragadiru, Ilfov', tariff: 'daynight', latitude: 44.388265, longitude: 26.010378 },
  { id: 'la-strada-militari-est', name: 'La Strada Militari Est', address: 'Strada Rezervelor nr. 59, Roșu, Chiajna, Ilfov', tariff: 'daynight', latitude: 44.447273, longitude: 25.987112 },
  { id: 'la-strada-militari-vest', name: 'La Strada Militari Vest', address: 'Strada Sergent Ilie Petre nr. 57, Chiajna, Ilfov', tariff: 'daynight', latitude: 44.450848, longitude: 25.975295, approximate: true },
  { id: 'la-strada-otopeni', name: 'La Strada Otopeni', address: 'Strada 23 August nr. 204, Otopeni, Ilfov', tariff: 'daynight', latitude: 44.554653, longitude: 26.093587 },
  { id: 'vitantis-shopping-center', name: 'Vitantis Shopping Center', address: 'Șoseaua Vitan-Bârzești nr. 7A, București', tariff: 'daynight', latitude: 44.39862, longitude: 26.143321 },
  { id: 'oto-street-mall', name: 'OTO Street Mall', address: 'Strada Drumul Odăii nr. 42, Otopeni, Ilfov', tariff: 'daynight', latitude: 44.536209, longitude: 26.061332 },
  { id: 'snagov-plaza', name: 'Snagov Plaza', address: 'Intersecția Snagov, Șoseaua București–Ploiești DN1, Vlădiceasca, Ilfov', tariff: 'daynight', latitude: 44.668255, longitude: 26.075225 },
  { id: 'centrul-comercial-esplanada', name: 'Centrul Comercial Esplanada', address: 'Șoseaua Vergului nr. 20, București', tariff: 'daynight', latitude: 44.439651, longitude: 26.183422 },
  { id: 'm-park-titan', name: 'M Park Titan', address: 'Strada Ilioara nr. 54C, Sector 3, București', tariff: 'daynight', latitude: 44.406871, longitude: 26.162588 },
  { id: 'mega-mall', name: 'Mega Mall', address: 'Bulevardul Pierre de Coubertin nr. 3–5, București', tariff: 'nonstop', latitude: 44.441169, longitude: 26.150352 },
  { id: 'unirea-shopping-center', name: 'Unirea Shopping Center', address: 'Piața Unirii nr. 1, București', tariff: 'nonstop', latitude: 44.428016, longitude: 26.104234 },
]
