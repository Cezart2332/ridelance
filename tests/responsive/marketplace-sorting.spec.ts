import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'

/**
 * Sortarea din marketplace (spec §5) și blocul de proprietar de pe card (§4.1).
 *
 * Fixture-ul e construit ca ordinea corectă să fie diferită de toate celelalte: dacă „Recomandate"
 * ar cădea din greșeală pe preț sau pe ordinea din răspuns, testul ar prinde-o.
 */

function car(overrides: Partial<Record<string, unknown>> & { id: string; model: string }) {
  return {
    brand: 'Dacia',
    year: 2023,
    slug: `slug-${overrides.id}`,
    engine: 'Electric',
    transmission: 'Automată',
    location: 'București',
    pricePerWeek: 1000,
    discountActive: false,
    offerType: 'Weekly',
    status: 'Available',
    uberCategories: [],
    boltCategories: [],
    badges: [],
    description: '',
    active: true,
    listingSource: 'Ridelance',
    approvalStatus: 'Approved',
    paymentStatus: 'NotRequired',
    postedByAdmin: true,
    images: [],
    createdAtUtc: '2026-01-01T00:00:00Z',
    stats: { views: 0, clicks: 0, forms: 0 },
    ...overrides,
  }
}

const CARS = [
  // Cel mai ieftin, dar cu scorul cel mai mic — nu are voie să iasă primul la „Recomandate".
  car({ id: 'c1', model: 'Ieftina', pricePerWeek: 500, recommendationScore: 10 }),
  car({
    id: 'c2',
    model: 'Recomandata',
    pricePerWeek: 1500,
    recommendationScore: 90,
    owner: {
      ownerId: 'o1',
      ownerType: 'Srl',
      displayName: 'TUKI GO SRL',
      logoUrl: null,
      slug: 'tuki-go',
      verified: true,
    },
  }),
  // Scor mare, dar indisponibilă: §5.2 o trimite după cele disponibile, indiferent de scor.
  car({ id: 'c3', model: 'Indisponibila', pricePerWeek: 900, recommendationScore: 99, status: 'Rented' }),
]

async function mockCars(page: Page) {
  await page.route(`${API}/**`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.route(`${API}/cars`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CARS) }),
  )
}

test.describe('marketplace', () => {
  test.describe.configure({ timeout: 90_000 })

  test.beforeEach(async ({ page }) => {
    await mockCars(page)
  })

  test('se deschide pe „Recomandate", cu indisponibilele la final', async ({ page }) => {
    await page.goto('/masini', { waitUntil: 'networkidle' })

    await expect(page.getByRole('combobox')).toHaveText(/Recomandate/)

    const titles = page.locator('.car-card-title')
    await expect(titles).toHaveCount(3)
    await expect(titles.nth(0)).toContainText('Recomandata')
    await expect(titles.nth(1)).toContainText('Ieftina')
    await expect(titles.nth(2)).toContainText('Indisponibila')
  })

  test('proprietarul apare pe card și duce către mini-site, nu către mașină', async ({ page }) => {
    await page.goto('/masini', { waitUntil: 'networkidle' })

    const owner = page.getByRole('link', { name: /pagina publică a proprietarului TUKI GO SRL/i })
    await expect(owner).toBeVisible()
    await expect(owner).toHaveAttribute('href', '/f/tuki-go')
    // Cardul întreg e clicabil; blocul de proprietar trebuie să scape de sub el.
    await expect(owner).toHaveAttribute('target', '_blank')
  })

  test('anunțurile fără proprietar nu inventează unul', async ({ page }) => {
    await page.goto('/masini', { waitUntil: 'networkidle' })

    // Două din trei mașini vin fără `owner`; niciuna nu are voie să afișeze un bloc de proprietar.
    await expect(page.getByRole('link', { name: /pagina publică a proprietarului/i })).toHaveCount(1)
  })
})
