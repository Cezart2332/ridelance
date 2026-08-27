import carListJson from './car-list.json'

/**
 * Catalogul de mărci, modele și categorii de platformă.
 *
 * Într-un singur loc pentru că se completează în două: formularul de admin și wizardul cu care
 * o flotă își adaugă mașina. Wizardul avea câmpuri libere — se scria marca de mână, iar
 * categoriile Uber și Bolt se tastau despărțite prin virgulă. Rezultatul erau aceleași mașini
 * scrise în cinci feluri („VW", „Volkswagen", „volkswagen") și categorii care nu se potriveau cu
 * niciun filtru, pentru că filtrele caută șiruri exacte.
 */

export interface CarBrandData {
  brand: string
  models: string[]
}

/**
 * Mărci și modele care lipsesc din listă sau au nevoie de completări.
 *
 * Modelele electrice și hibride mai noi contează aici mai mult decât în alt catalog: sunt exact
 * cele cu care se lucrează pe Uber Green și Bolt Green.
 */
const CURATED: CarBrandData[] = [
  { brand: 'Tesla', models: ['Model 3', 'Model Y', 'Model S', 'Model X'] },
  { brand: 'Dacia', models: ['Logan', 'Sandero', 'Jogger', 'Spring', 'Duster', 'Lodgy', 'Dokker', 'Solenza'] },
  { brand: 'Toyota', models: ['Prius', 'Corolla', 'Camry', 'Auris', 'Yaris', 'RAV4', 'C-HR', 'Avensis'] },
  { brand: 'Hyundai', models: ['Ioniq', 'Ioniq 5', 'Ioniq 6', 'Elantra', 'Accent', 'Tucson', 'Kona', 'i30', 'i20'] },
  { brand: 'Kia', models: ['Ceed', 'Niro', 'Stonic', 'Sportage', 'Rio', 'Optima', 'XCeed'] },
]

/** Lista completă: ce e în JSON, plus completările, fără duplicate, ordonat alfabetic. */
export const CAR_BRANDS_DATA: CarBrandData[] = (() => {
  // Copie a fiecărei intrări: `carListJson` e modulul importat, iar completarea listelor de modele
  // direct în el ar fi modificat datele pentru orice altcineva îl importă.
  const list: CarBrandData[] = (carListJson as CarBrandData[]).map((item) => ({
    brand: item.brand,
    models: [...item.models],
  }))

  for (const curated of CURATED) {
    const existing = list.find((item) => item.brand.toLowerCase() === curated.brand.toLowerCase())
    if (existing) {
      existing.models = Array.from(new Set([...existing.models, ...curated.models])).sort()
    } else {
      list.push({ brand: curated.brand, models: [...curated.models] })
    }
  }

  return list.sort((a, b) => a.brand.localeCompare(b.brand))
})()

export const CAR_BRANDS: string[] = CAR_BRANDS_DATA.map((item) => item.brand)

/**
 * Modelele unei mărci. Listă goală pentru o marcă necunoscută — cine a scris o marcă din afara
 * catalogului trebuie să poată scrie și modelul.
 */
export function modelsForBrand(brand: string): string[] {
  if (!brand) return []
  const match = CAR_BRANDS_DATA.find((item) => item.brand.toLowerCase() === brand.trim().toLowerCase())
  return match ? match.models : []
}

/** Categoriile în care poate fi înscrisă o mașină pe fiecare platformă. */
export const UBER_CATEGORIES = ['UberX', 'Uber Comfort', 'Uber Green', 'Uber Black', 'Uber Kids']
export const BOLT_CATEGORIES = ['Bolt', 'Bolt Comfort', 'Bolt Green', 'Bolt Premium', 'Bolt Economy']
