import { mkdirSync } from 'node:fs'
import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'

/**
 * Favoritele: fără cont stau în browser, cu cont pe server, iar la începutul sesiunii cele din
 * browser se mută în cont.
 */

const car = (id: string, brand: string, model: string) => ({
  id,
  slug: `${brand}-${model}-${id}`.toLowerCase(),
  brand,
  model,
  year: 2022,
  engine: 'Hybrid',
  transmission: 'Automată',
  location: 'București',
  pricePerWeek: 900,
  discountActive: false,
  offerType: 'Weekly',
  status: 'Available',
  uberCategories: ['UberX'],
  boltCategories: [],
  badges: [],
  description: '',
  active: true,
  listingStatus: 'Published',
  listingSource: 'External',
  approvalStatus: 'Approved',
  paymentStatus: 'NotRequired',
  postedByAdmin: false,
  images: [],
  createdAtUtc: '2026-09-01T00:00:00Z',
  stats: { views: 0, clicks: 0, forms: 0 },
})

const CARS = [
  car('11111111-1111-1111-1111-111111111111', 'Toyota', 'Corolla'),
  car('22222222-2222-2222-2222-222222222222', 'Dacia', 'Logan'),
]

async function stub(page: Page, { loggedIn, onMerge }: { loggedIn: boolean; onMerge?: (ids: string[]) => void }) {
  const reply = (status: number, body: unknown) => async (route: Route) => {
    const origin = (await route.request().headerValue('origin')) ?? '*'
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'authorization,content-type',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    return route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) })
  }

  await page.route(`${API}/**`, reply(200, []))
  await page.route(
    `${API}/users/refresh-token`,
    loggedIn ? reply(200, { accessToken: 't', role: 'Client', userId: 'u1' }) : reply(401, {}),
  )
  await page.route(`${API}/cars?**`, reply(200, CARS))
  await page.route(`${API}/cars`, reply(200, CARS))
  await page.route(`${API}/cars/favorites`, reply(200, []))
  await page.route(`${API}/cars/favorites/merge`, async (route) => {
    if (route.request().method() === 'POST') {
      const ids = (route.request().postDataJSON() as { carIds: string[] }).carIds
      onMerge?.(ids)
      return reply(200, ids)(route)
    }
    return reply(204, {})(route)
  })
}

test.describe('favorite', () => {
  test('fără cont, inima salvează în browser și filtrul le arată', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'fluxul e același pe mobil')
    await stub(page, { loggedIn: false })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/masini', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /Salvează Dacia Logan, 2022 la favorite/ }).click()

    await expect(page.getByText('Am salvat mașina pe acest dispozitiv')).toBeVisible()
    const stored = await page.evaluate(() => window.localStorage.getItem('rl_favorite_cars'))
    expect(JSON.parse(stored ?? '[]')).toEqual([CARS[1].id])

    await page.getByRole('button', { name: /^Favorite/ }).click()
    await expect(page.getByRole('heading', { name: 'Mașinile tale favorite' })).toBeVisible()
    await expect(page.getByText('Dacia Logan, 2022')).toBeVisible()
    await expect(page.getByText('Toyota Corolla, 2022')).toHaveCount(0)

    const dir = `test-results/responsive/screenshots/${testInfo.project.name}`
    mkdirSync(dir, { recursive: true })
    await page.getByRole('heading', { name: 'Mașinile tale favorite' }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${dir}/favorite-lista.png` })
  })

  test('la începutul sesiunii, favoritele din browser se mută în cont', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'fluxul e același pe mobil')
    let merged: string[] | null = null
    await stub(page, { loggedIn: true, onMerge: (ids) => (merged = ids) })

    await page.addInitScript((id) => {
      window.localStorage.setItem('rl_favorite_cars', JSON.stringify([id]))
    }, CARS[0].id)

    await page.goto('/masini', { waitUntil: 'networkidle' })

    await expect.poll(() => merged).toEqual([CARS[0].id])
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('rl_favorite_cars')))
      .toBeNull()
    await expect(page.getByRole('button', { name: /Scoate Toyota Corolla, 2022 de la favorite/ })).toBeVisible()
  })
})
