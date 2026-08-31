import { test, expect, type Page, type Route } from '@playwright/test'

import { mockSession } from './fixtures/srlSession'

const API = 'http://localhost:5000'
const INVOICES = '/app/dashboard-srl/financiar/facturi'

/**
 * Emiterea unei facturi din RIDElance, fără a intra în Oblio.
 *
 * Testul verifică ce trece efectiv pe fir, nu ce se vede pe ecran: sumele pleacă în bani, cotele
 * de TVA ca procent, iar scadența ca număr de zile, nu ca dată. O factură emisă cu prețul în lei
 * în loc de bani ar fi de o sută de ori mai mică și n-ar mai putea fi corectată decât prin storno.
 */

const CONNECTED = {
  connected: true,
  companyName: 'TUKI GO SRL',
  cif: 'RO123456',
  seriesName: 'RMS',
  availableSeries: ['RMS', 'FCT'],
  errorMessage: null,
  lastSyncAtUtc: '2026-08-20T10:00:00Z',
}

const EMPTY_SUMMARY = {
  issuedBani: 0,
  issuedCount: 0,
  collectedBani: 0,
  collectedCount: 0,
  outstandingBani: 0,
  overdueCount: 0,
}

async function mockInvoices(page: Page) {
  await mockSession(page)

  await page.route(`${API}/invoices*`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ connection: CONNECTED, summary: EMPTY_SUMMARY, invoices: [] }),
    }),
  )
}

test.describe('emitere factură', () => {
  test.describe.configure({ timeout: 90_000 })

  test('CUI-ul precompletează clientul din registru', async ({ page }) => {
    await mockInvoices(page)
    await page.route(`${API}/invoices/company/*`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cui: '123456',
          name: 'CLIENT TEST SRL',
          address: 'Str. Lalelelor 4',
          city: 'Cluj-Napoca',
          county: 'Cluj',
          registrationNumber: 'J12/1/2020',
          vatPayer: true,
        }),
      }),
    )

    await page.goto(INVOICES)
    await page.getByRole('button', { name: 'Factură nouă' }).click()

    await page.getByLabel('CUI').fill('RO123456')
    await page.getByRole('button', { name: 'Caută' }).click()

    // Denumirea și adresa vin din registru; nimeni nu le transcrie de mână.
    await expect(page.getByLabel('Denumire client')).toHaveValue('CLIENT TEST SRL')
    await expect(page.getByLabel('Localitate')).toHaveValue('Cluj-Napoca')
    await expect(page.getByLabel('Județ')).toHaveValue('Cluj')
  })

  test('trimite sumele în bani și scadența în zile', async ({ page }) => {
    await mockInvoices(page)

    let posted: Record<string, unknown> | null = null
    await page.route(`${API}/invoices/issue`, (route: Route) => {
      posted = route.request().postDataJSON() as Record<string, unknown>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ seriesName: 'RMS', number: '1042', link: null }),
      })
    })

    await page.goto(INVOICES)
    await page.getByRole('button', { name: 'Factură nouă' }).click()

    await page.getByLabel('Denumire client').fill('CLIENT TEST SRL')
    await page.getByLabel(/^Denumire\s*\*$/).fill('Transport marfă')
    await page.getByLabel('Preț unitar').fill('250.50')
    await page.getByLabel('Cant.').fill('2')

    await page.getByRole('button', { name: 'Emite factura' }).click()
    await expect.poll(() => posted).not.toBeNull()

    const body = posted as unknown as {
      seriesName: string
      dueDateDays: number
      lines: { name: string; quantity: number; priceBani: number; vatPercent: number }[]
    }
    expect(body.seriesName).toBe('RMS')
    // 250,50 lei = 25050 bani. Trimis în lei, documentul ar fi ieșit de o sută de ori mai mic.
    expect(body.lines[0].priceBani).toBe(25050)
    expect(body.lines[0].quantity).toBe(2)
    expect(body.lines[0].vatPercent).toBe(21)
    expect(body.dueDateDays).toBe(30)
  })

  test('nu emite fără client sau fără linie completă', async ({ page }) => {
    await mockInvoices(page)
    await page.goto(INVOICES)
    await page.getByRole('button', { name: 'Factură nouă' }).click()

    const issue = page.getByRole('button', { name: 'Emite factura' })
    await expect(issue).toBeDisabled()

    // Doar clientul nu e de ajuns: o factură fără linii n-are ce total să poarte.
    await page.getByLabel('Denumire client').fill('CLIENT TEST SRL')
    await expect(issue).toBeDisabled()

    await page.getByLabel(/^Denumire\s*\*$/).fill('Transport marfă')
    await page.getByLabel('Preț unitar').fill('100')
    await expect(issue).toBeEnabled()
  })
})
