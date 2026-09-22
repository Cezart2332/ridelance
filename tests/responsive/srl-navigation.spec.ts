import { test, expect, type Page, type Route } from '@playwright/test'

import { mockSession } from './fixtures/srlSession'

const API = 'http://localhost:5000'
const ROOT = '/app/dashboard-srl'

/**
 * Dashboard-ul SRL a trecut de la layout propriu + `useState` la layout-ul comun + rute reale
 * (spec §0.3.2, DoD 2). Testul verifică exact ce s-a schimbat: că fiecare secțiune are adresă,
 * că meniul marchează secțiunea curentă și că ruta veche `/poster` aterizează unde trebuie.
 */

const SECTIONS = [
  { path: ROOT, label: 'Acasă' },
  { path: `${ROOT}/masini`, label: 'Mașinile mele' },
  { path: `${ROOT}/inchirieri`, label: 'Închirieri' },
  { path: `${ROOT}/mentenanta`, label: 'Mentenanță' },
  { path: `${ROOT}/pagina-firmei`, label: 'Pagina firmei' },
  { path: `${ROOT}/documente-societate`, label: 'Documente societate' },
  { path: `${ROOT}/profil`, label: 'Profil' },
  { path: `${ROOT}/servicii`, label: 'Servicii' },
  { path: `${ROOT}/contabilitate/cont-bancar`, label: 'Cont bancar' },
  { path: `${ROOT}/contabilitate/fiscal`, label: 'Fiscal' },
  { path: `${ROOT}/conexiuni`, label: 'Conexiuni' },
  { path: `${ROOT}/suport`, label: 'Suport' },
  { path: `${ROOT}/setari`, label: 'Setări' },
]

/** Butonul „+”: „Adaugă” pe desktop, doar iconița pe telefon. */
async function openQuickActions(page: Page, projectName: string) {
  const trigger =
    projectName === 'mobile'
      ? page.getByRole('button', { name: 'Acțiuni rapide' })
      : page.getByRole('button', { name: 'Adaugă', exact: true })
  await trigger.click()
}

test.describe('navigație SRL', () => {
  test.describe.configure({ timeout: 90_000 })

  test.beforeEach(async ({ page }) => {
    await mockSession(page)
  })

  test('fiecare secțiune are adresă proprie și e marcată în meniu', async ({ page }, testInfo) => {
    // Pe mobil sidebar-ul e sertar închis, deci n-are ce marca fără să-l deschizi mai întâi;
    // acoperirea de acolo e testul separat de mai jos.
    test.skip(testInfo.project.name !== 'desktop', 'sidebar vizibil doar pe desktop')

    for (const section of SECTIONS) {
      // Fără `networkidle`: chatul din Suport ține o conexiune deschisă, iar așteptarea ei
      // făcea testul să depindă de cât de încărcat e serverul de dezvoltare.
      await page.goto(section.path)
      await expect(page, `${section.path} rămâne pe adresa cerută`).toHaveURL(new RegExp(`${section.path}$`))

      const current = page.locator('nav [aria-current="page"]')
      await expect(current, `${section.path} → un singur item activ`).toHaveCount(1)
      await expect(current, `${section.path} → ${section.label}`).toHaveText(new RegExp(section.label))
    }
  })

  test('sidebar-ul e cel comun, cu eticheta și identitatea contului SRL', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'sidebar vizibil doar pe desktop')

    await page.goto(ROOT)

    const nav = page.locator('nav[aria-label="Meniu principal"]')
    await expect(nav).toBeVisible()
    // Aceeași componentă ca la PFA, alt config: eticheta de deasupra listei vine din config.
    await expect(nav.getByText('SRL', { exact: true })).toBeVisible()
    // Blocul de identitate din subsol — slotul pe care §2.1 îl va umple cu logo și badge.
    await expect(page.getByText('TUKI GO')).toBeVisible()
  })

  test('pe mobil meniul e o pagină deschisă din bara de jos', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'bara de jos există doar pe mobil')

    await page.goto(ROOT)
    await page.locator('.MuiBottomNavigation-root').getByRole('button', { name: 'Meniu' }).click()

    // Nu mai e sertarul cu lista din sidebar: categoriile apar în pagină, cu paginile ca iconițe.
    await expect(page).toHaveURL(new RegExp(`${ROOT}/meniu$`))
    await expect(page.getByRole('region', { name: 'Firmă' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pagina firmei' })).toBeVisible()
  })

  test('antetul arată categoria și pagina', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'pe telefon antetul are doar titlul')

    await page.goto(`${ROOT}/masini`)
    const crumbs = page.getByRole('navigation', { name: 'Unde ești' })
    await expect(crumbs).toContainText('Mașini')
    await expect(crumbs).toContainText('Mașinile mele')
  })

  test('acțiunile rapide SRL: „Publică anunț” arată mașinile nepublicate și cota', async ({ page }, testInfo) => {
    await page.goto(ROOT)
    await openQuickActions(page, testInfo.project.name)

    await expect(page.getByText('Dashboard SRL')).toBeVisible()
    await expect(page.getByText('5 acțiuni')).toBeVisible()
    // Fără „flotă” în meniu, cum s-a cerut.
    await expect(page.getByRole('presentation').getByText(/flot/i)).toHaveCount(0)
    await page.screenshot({ path: `test-results/quick-actions-srl-${testInfo.project.name}.png` })

    await page.getByRole('button', { name: /Publică anunț/ }).click()
    await expect(page).toHaveURL(/masini\?actiune=anunt/)
    await expect(page.getByText(/Alege mașina și apasă „Publică”/)).toBeVisible()
  })

  test('acțiunile rapide SRL: „Adaugă mașină” deschide formularul', async ({ page }, testInfo) => {
    await page.goto(ROOT)
    await openQuickActions(page, testInfo.project.name)
    await page.getByRole('button', { name: /Adaugă mașină/ }).click()
    await expect(page).toHaveURL(new RegExp(`${ROOT}/masini/adauga$`))
  })

  test('FiscalLink și eldrive sunt „În curând” pentru SRL', async ({ page }, testInfo) => {
    await page.goto(`${ROOT}/beneficii`, { waitUntil: 'networkidle' })
    const main = page.getByRole('main')
    for (const name of ['FiscalLink', 'eldrive']) {
      await main.getByRole('tab', { name }).click()
      await expect(main.getByText('În curând', { exact: true })).toBeVisible()
      await expect(main.getByRole('link', { name: /Scrie pe WhatsApp/ })).toHaveCount(0)
    }
    await page.screenshot({ path: `test-results/srl-beneficii-eldrive-${testInfo.project.name}.png`, fullPage: true })

    // Serverul încă trimite Eldrive; pagina nu-l mai arată.
    const integration = { status: 'disconnected', connectedAtUtc: null, expiresAtUtc: null, lastSyncAtUtc: null, errorMessage: null, available: true, details: [] }
    await page.route(`${API}/connections`, (route: Route) =>
      route.fulfill({ json: [{ ...integration, provider: 'Bank' }, { ...integration, provider: 'Eldrive', available: false }] }))
    await page.goto(`${ROOT}/conexiuni`, { waitUntil: 'networkidle' })
    await expect(main.getByText('FiscalLink', { exact: true })).toBeVisible()
    await expect(main.getByText(/eldrive/i)).toHaveCount(0)
    await expect(main.getByRole('img', { name: /eldrive/i })).toHaveCount(0)
    await page.screenshot({ path: `test-results/srl-conexiuni-${testInfo.project.name}.png`, fullPage: true })
  })

  test('ruta veche /poster redirecționează, păstrând query string-ul', async ({ page }) => {
    await page.goto('/poster')
    await expect(page).toHaveURL(new RegExp(`${ROOT}$`))

    // Sesiunile Stripe create înainte de mutare se întorc cu parametri care trebuie să supraviețuiască.
    await page.goto('/poster?car_paid=1&car_id=abc')
    await expect(page).toHaveURL(/car_paid=1&car_id=abc/)
  })
})
