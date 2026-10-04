import { test, expect, type Page } from '@playwright/test'
import { mockAccountingClient, clientProfileUrl } from './fixtures/accountingClient'

const PFA = '11111111-1111-1111-1111-111111111111'
async function setup(page: Page) {
  await page.route('http://localhost:5000/**', route => route.fulfill({ json: [] }))
  await page.route('**/users/refresh-token', route => route.fulfill({ json: { accessToken: 'test', userId: 'staff', role: 'Contabil' } }))
  await page.route('**/users/profile', route => route.fulfill({ json: { firstName: 'Ana', lastName: 'Contabil', role: 'Contabil' } }))
  await mockAccountingClient(page, { pfaId: PFA, userId: 'client', name: 'Ion Popescu PFA', email: 'ion@example.test', period: '2026-09' })
  await page.route('**/accounting/fiscal-overview?*', route => route.fulfill({ json: { year: 2026, thresholds: null, rows: [] } }))
  let entry = { id: 'payment', pfaId: PFA, date: '2026-09-25', documentLabel: 'Extras 25.09.2026', source: 'BANK',
    amount: -3304, currency: 'RON', description: 'Plata ANAF D301', counterparty: 'ANAF', paymentMethod: 'BANK', transactionType: 'TAX',
    category: null as string | null, deductibleAmount: null as number | null, refDeductibleAmount: null as number | null,
    deductiblePercent: null as number | null, deductibleRule: null, status: 'AUTO_IMPORTED', reconciliationStatus: 'MATCHED',
    accountingPeriod: '2026-09', closedPeriodFlag: false, rowVersion: '1' }
  await page.route(`**/accounting/pfas/${PFA}/ledger?*`, route => route.fulfill({ json: { items: [entry], page: 1, pageSize: 25, total: 1 } }))
  await page.route(`**/accounting/pfas/${PFA}/declarations?*`, route => route.fulfill({ json: new URL(route.request().url()).searchParams.get('period') === '2026-08' ?
    [{ pfaId: PFA, period: '2026-08', type: 'D301', currentVersionId: 'd301-version', currentVersionNo: 1, status: 'ACCEPTED', amount: 3303.75 }] : [] }))
  let calls = 0
  await page.route(`**/accounting/pfas/${PFA}/ledger/payment/d301-payment`, route => {
    expect(route.request().method()).toBe('POST')
    expect(route.request().postDataJSON()).toMatchObject({ versionId: 'd301-version', confirmNonRecoverable: true })
    calls++
    entry = { ...entry, transactionType: 'EXPENSE', category: 'NON_RECOVERABLE_VAT', status: 'VERIFIED', deductibleAmount: 3304,
      refDeductibleAmount: 3304, deductiblePercent: 100, rowVersion: '2' }
    return route.fulfill({ json: entry })
  })
  await page.route(`**/accounting/pfas/${PFA}/ledger/import`, route => route.fulfill({ json: [{ source: 'BOLT', created: 0, updated: 0,
    notes: ['Bolt 08.2026: diferență la reconciliere; verifică rambursările și perioadele săptămânale.'] }] }))
  return () => calls
}

test('D301: associates an actual September payment with the August declaration, after explicit tax confirmation', async ({ page }) => {
  const calls = await setup(page)
  await page.goto(clientProfileUrl(PFA, 'banca'))
  await page.getByRole('button', { name: 'Asociază D301', exact: true }).click({ timeout: 60_000 })
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Asociază plata', exact: true })).toBeDisabled()
  await dialog.getByLabel('Luna declarației D301').fill('2026-08')
  await expect(dialog.getByText(/D301 v1:/)).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Asociază plata', exact: true })).toBeDisabled()
  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'Asociază plata', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  expect(calls()).toBe(1)
  await expect(page.getByText('Cheltuială', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Sincronizează și reconciliază', exact: true }).click()
  await expect(page.getByText(/Bolt 08.2026: diferență la reconciliere/)).toBeVisible()
})
