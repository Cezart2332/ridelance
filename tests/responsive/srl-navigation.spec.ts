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

  test('pe mobil meniul se deschide din bara de jos', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'bara de jos există doar pe mobil')

    await page.goto(ROOT)
    await page.getByRole('button', { name: 'Meniu' }).click()

    const nav = page.locator('nav[aria-label="Meniu principal"]')
    await expect(nav).toBeVisible()
    await expect(nav.getByText('SRL', { exact: true })).toBeVisible()
    await expect(nav.getByRole('button', { name: /Firmă/ })).toBeVisible()
  })

  test('ruta veche /poster redirecționează, păstrând query string-ul', async ({ page }) => {
    await page.goto('/poster')
    await expect(page).toHaveURL(new RegExp(`${ROOT}$`))

    // Sesiunile Stripe create înainte de mutare se întorc cu parametri care trebuie să supraviețuiască.
    await page.goto('/poster?car_paid=1&car_id=abc')
    await expect(page).toHaveURL(/car_paid=1&car_id=abc/)
  })
})
