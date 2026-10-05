import { test, expect, type Page } from '@playwright/test'
import { mockAccountingClient, clientProfileUrl } from './fixtures/accountingClient'

const PFA = '11111111-1111-1111-1111-111111111111'
const endpoint = `**/pfa-registrations/${PFA}/deductible-expenses`

async function setup(page: Page, delayed = false) {
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00+03:00'))
  await page.route('http://localhost:5000/**', route => route.fulfill({ json: [] }))
  await page.route('**/users/refresh-token', route => route.fulfill({ json: { accessToken: 'test', userId: 'staff', role: 'Contabil' } }))
  await page.route('**/users/profile', route => route.fulfill({ json: { firstName: 'Ana', lastName: 'Contabil', role: 'Contabil' } }))
  await mockAccountingClient(page, { pfaId: PFA, userId: 'client', name: 'Ion Popescu PFA', email: 'ion@example.test', period: '2026-09' })
  await page.route('**/accounting/fiscal-overview?*', route => route.fulfill({ json: { year: 2026, thresholds: null, rows: [] } }))
  let expenses: Record<string, unknown>[] = []
  let saved: Record<string, unknown> | null = null
  const expense = { id: 'expense', documentId: 'document', pfaRegistrationId: PFA, userId: 'client', catalogCategory: 'Nedefinit',
    itemName: 'bon.pdf', deductibleLabel: 'De clasificat', amountRon: null, year: 2026, month: 10, documentStatus: 'Pending',
    originalFileName: 'bon.pdf', expenseDate: null, supplierName: null, vatAmount: null, documentTypeLabel: null, status: 'Draft' }
  await page.route(`${endpoint}*`, route => {
    if (route.request().method() === 'POST') { expenses = [expense]; return route.fulfill({ json: expense }) }
    return route.fulfill({ json: expenses })
  })
  let readings = 0
  await page.route(`${endpoint}/expense/suggestion*`, route => {
    const ready = !delayed || readings++ > 0
    return route.fulfill({ json: {
    supplierName: 'OMV PETROM', date: '2026-10-03', total: 320, vat: 55.54, documentType: 'Bon fiscal', category: 'FUEL',
    number: 'BF100', personalAmount: 20, currency: 'RON', ready,
    categories: [{ category: 'FUEL', label: 'Combustibil', percent: 50 }],
    payments: [{ id: 'bank-payment', date: '2026-10-03', amount: 320, description: 'OMV PETROM card' }],
    ledgerEntryId: null, paymentMethod: null, paymentDate: null,
    ...(!ready ? { supplierName: null, date: null, total: null, vat: null, documentType: null, category: null, number: null, personalAmount: 0 } : {}),
  } }) })
  await page.route(`${endpoint}/expense`, route => {
    expect(route.request().method()).toBe('PUT')
    saved = route.request().postDataJSON()
    expenses = [{ ...expense, ...saved, status: 'Confirmed', documentStatus: 'Verified', ledgerEntryId: 'ledger',
      paymentMethod: saved!.paymentMethod, paymentDate: saved!.paymentDate, deductibleAmount: 150, deductibleLabel: '50%' }]
    return route.fulfill({ json: expenses[0] })
  })
  await page.route(`${endpoint}/sync-sources`, route => route.fulfill({ json: ['Plățile și facturile au fost actualizate.'] }))
  return () => saved
}

test('current-month expenses: auto category, cash review and approval, immediate register amounts', async ({ page }) => {
  const saved = await setup(page)
  await page.goto(`${clientProfileUrl(PFA, 'cheltuieli')}&luna=2026-10`)
  await page.getByRole('button', { name: 'Adaugă cheltuială', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type=file]').setInputFiles({ name: 'bon.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 fixture') })
  await expect(dialog.getByRole('combobox', { name: 'Categorie contabilă' })).toHaveText('Combustibil')
  await expect(dialog.getByLabel('Total plătit / de plată (lei)', { exact: true })).toHaveValue('320')
  await expect(dialog.getByText(/50% din partea pentru activitate/)).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Aprobă cheltuiala și plata' })).toBeDisabled()
  await dialog.getByRole('combobox', { name: 'Cum a fost plătită?' }).click()
  await page.getByRole('option', { name: 'Numerar', exact: true }).click()
  await dialog.getByRole('button', { name: 'Aprobă cheltuiala și plata' }).click()
  await expect(dialog).not.toBeVisible()
  expect(saved()).toMatchObject({ accountingCategory: 'FUEL', personalAmount: 20, amountRon: 320,
    paymentMethod: 'Cash', paymentDate: '2026-10-03', approveDocument: true })
  await expect(page.getByText(/Deductibil în REF: 150 lei/)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  await page.getByRole('tab', { name: 'Luna', exact: true }).click()
  await expect(page.getByText(/Procesarea declarațiilor și închiderea lunii devin disponibile/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generează', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Procesează', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Închide luna/ })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})

test('background extraction preserves manual edits while proposing the category automatically', async ({ page }) => {
  await setup(page, true)
  await page.goto(`${clientProfileUrl(PFA, 'cheltuieli')}&luna=2026-10`)
  await page.getByRole('button', { name: 'Adaugă cheltuială', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type=file]').setInputFiles({ name: 'bon.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 fixture') })
  await expect(dialog.getByText(/Documentul se citește în fundal/)).toBeVisible()
  await dialog.getByLabel('Furnizor', { exact: true }).fill('Furnizor corectat manual')
  await dialog.getByLabel('Total plătit / de plată (lei)', { exact: true }).fill('345')
  await expect(dialog.getByRole('combobox', { name: 'Categorie contabilă' })).toHaveText('Combustibil')
  await expect(dialog.getByLabel('Furnizor', { exact: true })).toHaveValue('Furnizor corectat manual')
  await expect(dialog.getByLabel('Total plătit / de plată (lei)', { exact: true })).toHaveValue('345')
})

test('bank receipt: requires an existing payment and keeps the bank date and amount', async ({ page }) => {
  const saved = await setup(page)
  await page.goto(`${clientProfileUrl(PFA, 'cheltuieli')}&luna=2026-10`)
  await page.getByRole('button', { name: 'Adaugă cheltuială', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type=file]').setInputFiles({ name: 'bon.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 fixture') })
  await dialog.getByRole('combobox', { name: 'Cum a fost plătită?' }).click()
  await page.getByRole('option', { name: 'Card / transfer bancar din OpenBanking' }).click()
  await expect(dialog.getByRole('button', { name: 'Aprobă cheltuiala și plata' })).toBeDisabled()
  await dialog.getByRole('combobox', { name: 'Plata din bancă', exact: true }).click()
  await page.getByRole('option', { name: /OMV PETROM card/ }).click()
  await expect(dialog.getByLabel('Data plății', { exact: true })).toBeDisabled()
  await dialog.getByRole('button', { name: 'Aprobă cheltuiala și plata' }).click()
  await expect(dialog).not.toBeVisible()
  expect(saved()).toMatchObject({ ledgerEntryId: 'bank-payment', paymentMethod: 'Bank', paymentDate: '2026-10-03', amountRon: 320 })
})
