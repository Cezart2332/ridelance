import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'
const ROOT = '/app/dashboard-srl'

/**
 * Dashboard-ul SRL a trecut de la layout propriu + `useState` la layout-ul comun + rute reale
 * (spec §0.3.2, DoD 2). Testul verifică exact ce s-a schimbat: că fiecare secțiune are adresă,
 * că meniul marchează secțiunea curentă și că ruta veche `/poster` aterizează unde trebuie.
 *
 * Contul de flotă nu trece prin poarta PFA (aprobare + onboarding + abonament), deci mock-ul e
 * mult mai mic decât la PFA: doar sesiunea și profilul.
 */
async function mockSession(page: Page) {
  // Prinsa generală se înregistrează prima — Playwright verifică rutele în ordine inversă.
  await page.route(`${API}/**`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  await page.route(`${API}/users/refresh-token`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'test-token', role: 'CarPoster', userId: 'poster-1' }),
    }),
  )

  // Suportul citește `history.messages`; prinsa generală întoarce un array, deci `undefined`.
  await page.route(`${API}/chat/**`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ roomId: null, messages: [], page: 1, pageSize: 50, total: 0 }),
    }),
  )

  await page.route(`${API}/users/profile`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'poster-1',
        email: 'flota@example.ro',
        role: 'CarPoster',
        firstName: 'TUKI',
        lastName: 'GO',
      }),
    }),
  )
}

const SECTIONS = [
  { path: ROOT, label: 'Acasă' },
  { path: `${ROOT}/masini`, label: 'Mașinile mele' },
  { path: `${ROOT}/profil`, label: 'Profil' },
  { path: `${ROOT}/servicii`, label: 'Servicii' },
  { path: `${ROOT}/contabilitate/cont-bancar`, label: 'Cont bancar' },
  { path: `${ROOT}/contabilitate/fiscal`, label: 'Fiscal' },
  { path: `${ROOT}/conexiuni`, label: 'Conexiuni' },
  { path: `${ROOT}/suport`, label: 'Suport' },
  { path: `${ROOT}/setari`, label: 'Setări' },
]

test.describe('navigație SRL', () => {
  test.describe.configure({ timeout: 90_000 })

  test.beforeEach(async ({ page }) => {
    await mockSession(page)
  })

  test('fiecare secțiune are adresă proprie și e marcată în meniu', async ({ page }) => {
    for (const section of SECTIONS) {
      await page.goto(section.path, { waitUntil: 'networkidle' })
      await expect(page, `${section.path} rămâne pe adresa cerută`).toHaveURL(new RegExp(`${section.path}$`))

      const current = page.locator('nav [aria-current="page"]')
      await expect(current, `${section.path} → un singur item activ`).toHaveCount(1)
      await expect(current, `${section.path} → ${section.label}`).toHaveText(new RegExp(section.label))
    }
  })

  test('sidebar-ul e cel comun, cu eticheta și identitatea contului SRL', async ({ page }) => {
    await page.goto(ROOT, { waitUntil: 'networkidle' })

    const nav = page.locator('nav[aria-label="Meniu principal"]')
    await expect(nav).toBeVisible()
    // Aceeași componentă ca la PFA, alt config: eticheta de deasupra listei vine din config.
    await expect(nav.getByText('SRL', { exact: true })).toBeVisible()
    // Blocul de identitate din subsol — slotul pe care §2.1 îl va umple cu logo și badge.
    await expect(page.getByText('TUKI GO')).toBeVisible()
  })

  test('ruta veche /poster redirecționează, păstrând query string-ul', async ({ page }) => {
    await page.goto('/poster')
    await expect(page).toHaveURL(new RegExp(`${ROOT}$`))

    // Sesiunile Stripe create înainte de mutare se întorc cu parametri care trebuie să supraviețuiască.
    await page.goto('/poster?car_paid=1&car_id=abc')
    await expect(page).toHaveURL(/car_paid=1&car_id=abc/)
  })
})
