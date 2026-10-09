import { test, expect, type Page } from '@playwright/test'

const API = 'http://localhost:5000'
const PATH = '/app/dashboard/conexiuni/fiscallink'

async function mockFiscalLink(page: Page, configured = true) {
  await page.route(`${API}/**`, route => route.fulfill({ json: [] }))
  await page.route(`${API}/users/refresh-token`, route => route.fulfill({
    json: { accessToken: 'test-token', role: 'Client', userId: 'user-1' },
  }))
  await page.route(`${API}/users/dashboard-summary`, route => route.fulfill({
    json: { pfaStatus: 'Approved', pfaRegistrationId: 'pfa-1' },
  }))
  await page.route(`${API}/payments/subscription`, route => route.fulfill({
    json: { pfaStatus: 'Approved', onboardingSectionsValidated: true, status: 'Active', dashboardAccessGranted: true, plan: 'PfaFull' },
  }))
  await page.route(`${API}/connections/fiscallink`, route => route.fulfill({
    json: { connected: true, activationCode: 'TEST-1234', activationLink: null, error: null,
      registers: [{ id: 'register-1', serialNumber: 'DT123456', status: 'Active', isOnline: true, awaitingClientConsent: false, activatedAtUtc: '2026-09-01T10:00:00Z' }] },
  }))
  const status = { configured, lastAttemptAtUtc: null, lastSyncAtUtc: null, error: null, receipts: 0, zReports: 0 }
  await page.route(`${API}/connections/fiscallink/accounting`, route => route.fulfill({ json: status }))
  return status
}

test.describe('FiscalLink accounting', () => {
  test.setTimeout(90_000)

  test('syncs cloud documents and shows the result on desktop and mobile', async ({ page }) => {
    const status = await mockFiscalLink(page)
    let calls = 0
    await page.route(`${API}/connections/fiscallink/accounting/sync`, route => {
      expect(route.request().method()).toBe('POST')
      expect(route.request().postData()).toBeNull()
      calls++
      return route.fulfill({ json: { ...status, receipts: 28, zReports: 3, lastSyncAtUtc: '2026-10-04T13:00:00Z' } })
    })
    await page.goto(PATH)
    await expect(page.getByText('Bonuri și rapoarte Z', { exact: true })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('Așteaptă prima sincronizare.')).toBeVisible()
    await page.getByRole('button', { name: 'Sincronizează acum' }).click()
    await expect(page.getByText('28 bonuri importate')).toBeVisible()
    await expect(page.getByText('3 rapoarte Z', { exact: true })).toBeVisible()
    await expect(page.getByText(/Ultima sincronizare:/)).toBeVisible()
    expect(calls).toBe(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })

  test('explains missing server configuration and disables sync', async ({ page }) => {
    await mockFiscalLink(page, false)
    await page.goto(PATH)
    await expect(page.getByText(/Importul automat nu este activat încă/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sincronizează acum' })).toBeDisabled()
  })

  test('shows synchronization errors without losing the imported totals', async ({ page }) => {
    const status = await mockFiscalLink(page)
    await page.route(`${API}/connections/fiscallink/accounting/sync`, route => route.fulfill({
      json: { ...status, receipts: 28, zReports: 3, error: 'Z 125: totalul diferă de cel înregistrat; verifică documentul.' },
    }))
    await page.goto(PATH)
    await page.getByRole('button', { name: 'Sincronizează acum' }).click()
    await expect(page.getByText(/totalul diferă de cel înregistrat/)).toBeVisible()
    await expect(page.getByText('28 bonuri importate')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sincronizează acum' })).toBeEnabled()
  })
})
