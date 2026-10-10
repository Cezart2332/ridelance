import { test, expect, type Page, type Route } from '@playwright/test'

import { mockSession as mockFleetSession } from './fixtures/srlSession'

const API = 'http://localhost:5000'
const WIZARD = '/app/dashboard-srl/masini/adauga'

/**
 * Fluxul de adăugare a unei mașini, pe șase pași.
 *
 * Testul urmărește regula fluxului, nu aspectul: dosarul administrativ **nu** blochează
 * publicarea, dar datele principale, prețul, descrierea și orașul o blochează. Și verifică ce
 * ajunge efectiv pe server — un formular care arată bine și trimite altceva e mai rău decât unul
 * care arată prost.
 */
/** Sesiunea comună a contului de flotă (trece și de poarta de acces), fără profil de firmă salvat. */
async function mockSession(page: Page) {
  await mockFleetSession(page)
  await page.route(`${API}/companies/profile`, (route: Route) =>
    route.fulfill({ status: 204, body: '' }),
  )
}

/** Completează minimul publicabil, fără nimic din dosar. Pornește de la primul pas, oriunde ai fi. */
async function fillMinimum(page: Page) {
  await page.getByRole('button', { name: 'Vehicul' }).click()
  await page.getByLabel('Marcă').fill('Tesla')
  await page.getByLabel('Model').fill('Model 3')
  await page.getByLabel('An fabricație').fill('2021')

  await page.getByRole('button', { name: 'Ofertă' }).click()
  await page.getByLabel('Preț / săptămână (lei)').fill('1800')
  await page.getByLabel('Descriere publică').fill('Mașină electrică pentru ridesharing în București.')

  await page.getByRole('button', { name: 'Locație' }).click()
  await page.getByLabel('Oraș').fill('București')
}

test.describe('adăugare mașină', () => {
  test.describe.configure({ timeout: 90_000 })

  test.beforeEach(async ({ page }) => {
    await mockSession(page)
  })

  test('publicarea e blocată până se completează datele obligatorii', async ({ page }) => {
    await page.goto(WIZARD)
    await page.getByRole('button', { name: 'Preview' }).click()

    const save = page.getByRole('button', { name: 'Salvează anunțul' })
    await expect(save).toBeDisabled()

    await fillMinimum(page)
    await page.getByRole('button', { name: 'Preview' }).click()

    // Dosarul e la 0% și nu e nicio fotografie — niciuna nu blochează publicarea.
    await expect(page.getByText('Dosar vehicul 0%')).toBeVisible()
    await expect(save).toBeEnabled()
  })

  test('trimite pe server exact ce s-a completat', async ({ page }) => {
    let payload: Record<string, unknown> | null = null

    await page.route(`${API}/cars`, async (route: Route) => {
      if (route.request().method() !== 'POST') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      }
      payload = route.request().postDataJSON() as Record<string, unknown>
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'car-nou' }),
      })
    })

    await page.goto(WIZARD)
    await fillMinimum(page)

    // Un câmp din fiecare grup opțional, ca să prindem maparea, nu doar cazul minim.
    await page.getByRole('button', { name: 'Dosar' }).click()
    await page.getByLabel('Număr înmatriculare').fill('b 123 rid')
    await page.getByLabel('Kilometraj curent').fill('71200')

    await page.getByRole('button', { name: 'Preview' }).click()
    await page.getByRole('button', { name: 'Salvează anunțul' }).click()

    await expect(page).toHaveURL(/\/masini$/)

    expect(payload).not.toBeNull()
    const body = payload as unknown as Record<string, unknown>
    expect(body.brand).toBe('Tesla')
    expect(body.year).toBe(2021)
    expect(body.pricePerWeek).toBe(1800)
    // Anunțul nu devine vizibil direct din formular: trece prin validare și plată.
    expect(body.active).toBe(false)

    const details = body.details as Record<string, unknown>
    expect(details.mileage).toBe(71200)
    // Numărul se normalizează pe server, dar frontendul trimite ce s-a scris.
    expect(String(details.plateNumber).toLowerCase()).toBe('b 123 rid')
    // Fără pin ales, coordonatele rămân goale — nu 0, care ar fi o locație reală în ocean.
    expect(details.latitude).toBeNull()
    expect(details.longitude).toBeNull()
  })

  test('numărul ascuns se bifează la poze și se plătește după salvare', async ({ page }) => {
    const checkouts: string[] = []
    await page.route(`${API}/cars`, (route: Route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'car-nou' }) })
        : route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.route(`${API}/cars/*/hidden-plate/checkout`, (route: Route) => {
      checkouts.push(new URL(route.request().url()).pathname)
      return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Stripe indisponibil în test' }) })
    })

    await page.goto(WIZARD)
    await fillMinimum(page)
    await page.getByRole('button', { name: 'Poze' }).click()
    await page.getByRole('checkbox', { name: /Ascunde numărul de înmatriculare în poze — 14,90 lei/ }).check()

    await page.getByRole('button', { name: 'Preview' }).click()
    await page.getByRole('button', { name: 'Salvează anunțul' }).click()

    // Plata se cere pentru mașina abia salvată; formularul se închide abia după dialog.
    await expect.poll(() => checkouts).toEqual(['/cars/car-nou/hidden-plate/checkout'])
    await expect(page.getByText('Stripe indisponibil în test')).toBeVisible()
    await page.getByRole('button', { name: 'Renunță' }).last().click()
    await expect(page).toHaveURL(/\/masini$/)
  })
})
