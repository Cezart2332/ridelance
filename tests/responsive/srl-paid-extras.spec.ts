import { test, expect, type Page, type Route } from '@playwright/test'

import { mockSession } from './fixtures/srlSession'

const API = 'http://localhost:5000'
const ROOT = '/app/dashboard-srl'

/**
 * Opțiunile plătite ale anunțurilor de flotă: anunțul extra (40 lei/lună) când s-au folosit cele
 * incluse, și numărul de înmatriculare ascuns (15 lei, o dată per mașină). Nimic nu se publică
 * automat peste limită: firma alege să plătească.
 */

const car = (index: number, extra: Record<string, unknown> = {}) => ({
  id: `00000000-0000-0000-0000-${String(index).padStart(12, '0')}`,
  slug: `dacia-logan-${index}`,
  brand: 'Dacia',
  model: `Logan ${index}`,
  year: 2022,
  engine: 'GPL',
  transmission: 'Manuală',
  location: 'București',
  pricePerWeek: 700,
  discountActive: false,
  offerType: 'Weekly',
  status: 'Available',
  uberCategories: [],
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
  stats: { views: 0, uniqueViews: 0, viewsLast7Days: 0, clicks: 0, forms: 0 },
  details: { plateNumber: `B ${100 + index} RID`, mileage: 50000 },
  ...extra,
})

async function mockFleet(page: Page, publishedCount: number) {
  const calls: string[] = []
  await mockSession(page)
  const cars = [
    ...Array.from({ length: publishedCount }, (_, i) => car(i + 1)),
    car(99, { listingStatus: 'Draft', active: false, model: 'Nepublicat' }),
  ]
  await page.route(`${API}/cars/mine`, (route: Route) => route.fulfill({ json: cars }))
  await page.route(`${API}/cars/mine/listing-quota`, (route: Route) =>
    route.fulfill({ json: { included: 10, used: publishedCount, remaining: Math.max(0, 10 - publishedCount) } }),
  )
  await page.route(`${API}/cars/*/toggle-active`, (route: Route) => {
    calls.push('toggle')
    return route.fulfill({ json: { listingStatus: 'Published', active: true } })
  })
  await page.route(`${API}/cars/*/extra-listing/checkout`, (route: Route) => {
    calls.push('extra-checkout')
    return route.fulfill({ status: 500, json: { detail: 'Stripe indisponibil în test' } })
  })
  return calls
}

async function openPublish(page: Page) {
  await page.goto(`${ROOT}/masini`)
  const card = page.getByText('Dacia Nepublicat', { exact: false }).first()
  await expect(card).toBeVisible()
  // Meniul cardului mașinii nepublicate.
  const article = page.locator('div', { has: card }).filter({ has: page.getByRole('button', { name: /Mai multe/ }) }).last()
  await article.getByRole('button', { name: /Mai multe/ }).click()
  await page.getByRole('menuitem', { name: /Publică anunțul/ }).click()
}

test('cu anunțurile incluse folosite, publicarea cere un anunț extra plătit', async ({ page }, info) => {
  const calls = await mockFleet(page, 10)
  await openPublish(page)

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Ai folosit toate cele 10 anunțuri incluse în abonament.')).toBeVisible()
  await expect(dialog.getByText('Ascunde numărul de înmatriculare în anunț — 15 lei')).toBeVisible()
  await page.screenshot({ path: `test-results/srl-extra-listing-${info.project.name}.png` })

  await dialog.getByRole('button', { name: 'Plătește anunțul extra (40 lei / lună)' }).click()
  // Nu se publică nimic înainte de plată.
  expect(calls).toEqual(['extra-checkout'])
  await expect(dialog.getByText('Stripe indisponibil în test')).toBeVisible()
})

test('cu loc liber, se publică direct, fără plată', async ({ page }) => {
  const calls = await mockFleet(page, 3)
  await openPublish(page)

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('mai ai 7 din 10', { exact: false })).toBeVisible()
  await dialog.getByRole('button', { name: 'Publică anunțul' }).click()
  await expect(dialog.getByText('Anunțul e publicat.')).toBeVisible()
  expect(calls).toEqual(['toggle'])
})
