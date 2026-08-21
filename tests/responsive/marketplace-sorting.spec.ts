import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'

/**
 * Sortarea din marketplace (spec §5) și blocul de proprietar de pe card (§4.1).
 *
 * Sortarea e a serverului: scorul e expus doar proprietarului, deci lista publică nu îl are și
 * nu ar putea ordona după el. Testul verifică, prin urmare, două lucruri diferite de ce ar
 * verifica pentru o sortare locală — că se cere cheia corectă și că ordinea primită e respectată
 * întocmai, inclusiv după filtrare.
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

/**
 * În ordinea în care le-ar întoarce serverul pentru `sort=recommended`. Prețurile sunt
 * deliberat în altă ordine: dacă frontendul ar re-sorta local după preț, „Ieftina" ar urca prima
 * și testul ar prinde-o.
 */
const CARS = [
  car({
    id: 'c2',
    model: 'Recomandata',
    pricePerWeek: 1500,
    owner: {
      ownerId: 'o1',
      ownerType: 'Srl',
      displayName: 'TUKI GO SRL',
      logoUrl: null,
      slug: 'tuki-go',
      verified: true,
    },
  }),
  car({ id: 'c1', model: 'Ieftina', pricePerWeek: 500 }),
  // Indisponibilele vin după cele disponibile indiferent de scor (§5.2) — decizie a serverului.
  car({ id: 'c3', model: 'Indisponibila', pricePerWeek: 900, status: 'Rented' }),
]

/** Cheile de sortare cerute serverului, în ordinea cererilor. */
const requestedSorts: string[] = []

async function mockCars(page: Page) {
  requestedSorts.length = 0

  await page.route(`${API}/**`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.route(`${API}/cars*`, (route: Route) => {
    requestedSorts.push(new URL(route.request().url()).searchParams.get('sort') ?? '')
    // Serverul întoarce lista deja ordonată; frontendul nu are voie s-o reordoneze.
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CARS) })
  })
}

test.describe('marketplace', () => {
  test.describe.configure({ timeout: 90_000 })

  test.beforeEach(async ({ page }) => {
    await mockCars(page)
  })

  test('se deschide pe „Recomandate" și cere serverului aceeași sortare', async ({ page }) => {
    await page.goto('/masini', { waitUntil: 'networkidle' })

    await expect(page.getByRole('combobox')).toHaveText(/Recomandate/)
    expect(requestedSorts).toContain('recommended')
  })

  test('ordinea afișată e cea primită de la server, neatinsă', async ({ page }) => {
    await page.goto('/masini', { waitUntil: 'networkidle' })

    const titles = page.locator('.car-card-title')
    await expect(titles).toHaveCount(3)
    // Fixture-ul e deliberat în altă ordine decât cea de preț: dacă frontendul ar re-sorta
    // local, „Ieftina" ar urca prima.
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
