import { test, expect, type Route } from '@playwright/test'

const API = 'http://localhost:5000'

/**
 * Caruselul de mașini de pe landing: se derulează din săgețile din margini, nu din bara de jos.
 * Săgeata spre capătul atins se ascunde.
 */

const car = (index: number) => ({
  id: `00000000-0000-0000-0000-${String(index).padStart(12, '0')}`,
  slug: `dacia-logan-${index}`,
  brand: 'Dacia',
  model: `Logan ${index}`,
  year: 2022,
  engine: 'GPL',
  transmission: 'Manuală',
  location: 'București',
  pricePerWeek: 700 + index,
  discountActive: false,
  offerType: 'Weekly',
  status: 'Available',
  uberCategories: ['UberX'],
  boltCategories: [],
  badges: [],
  description: '',
  active: true,
  listingStatus: 'Published',
  listingSource: 'Ridelance',
  approvalStatus: 'Approved',
  paymentStatus: 'NotRequired',
  postedByAdmin: true,
  images: [],
  createdAtUtc: '2026-09-01T00:00:00Z',
  stats: { views: 0, clicks: 0, forms: 0 },
})

test('caruselul se derulează din săgeți', async ({ page }, info) => {
  const json = (body: unknown) => (route: Route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  await page.route(`${API}/**`, json([]))
  await page.route(`${API}/users/refresh-token`, (route) => route.fulfill({ status: 401, body: '' }))
  await page.route(/localhost:5000\/cars(\?.*)?$/, json(Array.from({ length: 8 }, (_, i) => car(i + 1))))

  await page.goto('/')
  const section = page.locator('#masini')
  await section.scrollIntoViewIfNeeded()

  const next = section.getByRole('button', { name: 'Mașinile următoare' })
  const previous = section.getByRole('button', { name: 'Mașinile anterioare' })
  await expect(next).toBeEnabled()
  // La început nu ai unde să te întorci.
  await expect(previous).toBeDisabled()

  await next.click()
  await expect(previous).toBeEnabled()
  await page.screenshot({ path: `test-results/car-carousel-${info.project.name}.png` })

  // Până la capăt: săgeata „următoare” se stinge.
  for (let i = 0; i < 12 && (await next.isEnabled()); i++) {
    await next.click()
    await page.waitForTimeout(400)
  }
  await expect(next).toBeDisabled()
})
