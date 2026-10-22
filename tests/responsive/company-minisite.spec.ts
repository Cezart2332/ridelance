import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'

/**
 * Mini-site-ul unei firme are bara lui, în locul barei RIDElance: logo-ul și numele firmei,
 * secțiunile și un buton mic înapoi spre RIDElance. Un slug greșit (404) își păstrează bara
 * noastră, ca omul să aibă pe unde ieși.
 */

const car = (id: string, model: string) => ({
  id,
  brand: 'Dacia',
  model,
  year: 2023,
  slug: `dacia-${id}`,
  engine: 'Electric',
  transmission: 'Automată',
  location: 'București',
  pricePerWeek: 1100,
  discountActive: false,
  offerType: 'Weekly',
  status: 'Available',
  uberCategories: [],
  boltCategories: [],
  badges: [],
  description: '',
  active: true,
  listingSource: 'Srl',
  approvalStatus: 'Approved',
  paymentStatus: 'NotRequired',
  postedByAdmin: false,
  images: [],
  createdAtUtc: '2026-01-01T00:00:00Z',
  stats: { views: 0, clicks: 0, forms: 0 },
})

const COMPANY = {
  legalName: 'TUKI GO SRL',
  slug: 'tuki-go',
  logoUrl: null,
  coverImageUrl: null,
  tagline: 'Mașini pentru ridesharing, predate în aceeași zi.',
  publicDescription: 'Flotă de mașini electrice și hibride pentru șoferii de Uber și Bolt din București.',
  isVerified: true,
  phone: '0722000000',
  email: 'contact@tukigo.test',
  website: null,
  whatsAppEnabled: true,
  location: 'București',
  theme: { accent: '#E11D48', background: '#0B0B0F', surface: '#16161D', text: '#F4F4F5', buttonText: '#FFFFFF' },
  content: { highlights: [], schedule: [], coverageAreas: [], coverageNote: null, faq: [] },
  pickup: { address: null, latitude: null, longitude: null, note: null },
  cars: [car('c1', 'Spring'), car('c2', 'Jogger')],
}

async function mockApi(page: Page) {
  const json = (route: Route, data: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
  await page.route(`${API}/**`, (route) => json(route, []))
  await page.route(`${API}/companies/tuki-go/public`, (route) => json(route, COMPANY))
  await page.route(`${API}/companies/nu-exista/public`, (route) => json(route, { title: 'Not found' }, 404))
}

const siteMenu = (page: Page) => page.getByRole('navigation', { name: 'Meniul principal' })

test('mini-site-ul are bara firmei, fără bara RIDElance, cu un buton înapoi', async ({ page }, info) => {
  await mockApi(page)
  await page.goto('/tuki-go')

  const header = page.locator('header').filter({ hasText: 'TUKI GO SRL' })
  await expect(header).toBeVisible()
  await expect(siteMenu(page)).toHaveCount(0)
  await expect(header.getByRole('navigation', { name: 'Secțiunile paginii' }).filter({ visible: true })).toHaveCount(1)
  await expect(header.getByRole('link', { name: 'Flota', exact: true }).filter({ visible: true })).toBeVisible()

  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
  await page.screenshot({ path: `test-results/company-minisite-${info.project.name}.png` })

  // Bara rămâne sus la derulare.
  await page.mouse.wheel(0, 1600)
  await expect(header).toBeInViewport()

  await header.getByRole('link', { name: 'Înapoi la RIDElance' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(siteMenu(page).or(page.getByRole('button', { name: 'Deschide meniul' }))).toBeVisible()
})

test('un slug de firmă greșit își păstrează bara RIDElance', async ({ page }) => {
  await mockApi(page)
  await page.goto('/nu-exista')

  await expect(page.getByText('404').first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'RIDElance — pagina principală' })).toBeVisible()
})
