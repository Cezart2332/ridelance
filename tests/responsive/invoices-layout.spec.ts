import { test, expect, type Page, type Route } from '@playwright/test'

import { mockSession } from './fixtures/srlSession'

const API = 'http://localhost:5000'
const INVOICES = '/app/dashboard-srl/financiar/facturi'

/**
 * Pagina de facturi se strivea singură: `Panel` purta `height: 100%` ca să egaleze cardurile
 * alăturate dintr-o grilă, dar într-o coloană flex aceeași regulă lăsa flexbox să-i dea o
 * înălțime și apoi s-o taie sub conținut. Tabelul ieșea peste panoul de dedesubt.
 *
 * Bug-ul apărea doar cu destule facturi cât să depășească, și doar după conectarea la Oblio —
 * de aceea fixture-ul de aici are firma conectată și un tabel lung. Cu două facturi, pagina
 * arăta corect și cu regula stricată.
 */

function invoice(index: number) {
  return {
    seriesName: 'RMS',
    number: String(1000 + index),
    issueDate: '2026-08-01',
    dueDate: '2026-08-15',
    clientName: `Client ${index}`,
    clientCif: 'RO123456',
    totalBani: 11_900,
    collectedBani: index % 2 === 0 ? 11_900 : 0,
    link: null,
    status: index % 2 === 0 ? 'paid' : 'unpaid',
    overdue: index % 3 === 0,
  }
}

const COUNT = 12

async function mockConnectedOblio(page: Page) {
  await mockSession(page)

  await page.route(`${API}/invoices*`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        connection: {
          connected: true,
          companyName: 'TUKI GO SRL',
          cif: 'RO123456',
          seriesName: 'RMS',
          availableSeries: ['RMS'],
          errorMessage: null,
          lastSyncAtUtc: '2026-08-20T10:00:00Z',
        },
        summary: {
          issuedBani: COUNT * 11_900,
          issuedCount: COUNT,
          collectedBani: (COUNT / 2) * 11_900,
          collectedCount: COUNT / 2,
          outstandingBani: (COUNT / 2) * 11_900,
          overdueCount: 4,
        },
        invoices: Array.from({ length: COUNT }, (_, index) => invoice(index)),
      }),
    }),
  )
}

test.describe('facturi', () => {
  test.describe.configure({ timeout: 90_000 })

  test('tabelul lung rămâne în panoul lui, nu peste ce urmează', async ({ page }) => {
    await mockConnectedOblio(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(INVOICES)

    const rows = page.locator('main tbody tr')
    await expect(rows).toHaveCount(COUNT)

    // Ultimul rând trebuie să rămână deasupra marginii de jos a panoului care îl conține.
    const spill = await page.evaluate(() => {
      const row = [...document.querySelectorAll('main tbody tr')].at(-1)!
      const panel = row.closest('.MuiPaper-root')!
      return Math.round(row.getBoundingClientRect().bottom - panel.getBoundingClientRect().bottom)
    })
    expect(spill).toBeLessThanOrEqual(0)
  })
})
