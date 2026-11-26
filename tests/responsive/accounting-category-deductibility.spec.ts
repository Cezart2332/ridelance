import { test, expect } from '@playwright/test'
import { mockAccountingClient, clientProfileUrl } from './fixtures/accountingClient'

const PFA = '11111111-1111-1111-1111-111111111111'

/**
 * Procentul deductibil pe categorii, per client: implicit regula globală; un procent propriu se
 * adaugă în istoric de la o dată, cu justificare, ca orice setare.
 */
test('per-client deductible percent: global by default, a client override goes through the settings history', async ({ page }) => {
  await page.route('http://localhost:5000/**', route => route.fulfill({ json: [] }))
  await page.route('**/users/refresh-token', route => route.fulfill({ json: { accessToken: 'test', userId: 'staff', role: 'Contabil' } }))
  await page.route('**/users/profile', route => route.fulfill({ json: { firstName: 'Ana', lastName: 'Contabil', role: 'Contabil' } }))
  await mockAccountingClient(page, { pfaId: PFA, userId: 'client', name: 'Ion Popescu PFA', email: 'ion@example.test', period: '2026-10' })

  const settings = {
    pfaId: PFA, realSystem: true, vatPayer: false,
    art317: { enabled: false, activationDate: null, vatCode: null }, platforms: ['UBER'], vehicleDeductibility: '50_PERCENT',
    cash: { status: 'NOT_REQUIRED_CURRENT_CONFIGURATION', cashRequested: false, cashEnabled: false, activationDate: null, verifiedBy: null, evidenceFile: null },
    history: [],
    categoryDeductibility: [
      { category: 'FUEL', label: 'Combustibil', global: '100_PERCENT', own: null, ownFrom: null, effective: '50_PERCENT', source: 'Vehicle' },
      { category: 'PHONE', label: 'Telefon', global: '100_PERCENT', own: null, ownFrom: null, effective: '100_PERCENT', source: 'Global' },
      { category: 'DEPRECIATION', label: 'Amortizare', global: 'SPECIAL_RULE', own: null, ownFrom: null, effective: 'SPECIAL_RULE', source: 'Special' },
    ],
  }
  const writes: Record<string, unknown>[] = []
  await page.route(`**/accounting/pfas/${PFA}/settings`, route => {
    if (route.request().method() === 'PUT') writes.push(route.request().postDataJSON())
    return route.fulfill({ json: settings })
  })

  await page.goto(clientProfileUrl(PFA, 'setari'))
  const section = page.getByRole('heading', { name: 'Cheltuieli deductibile' }).locator('..')
  await expect(section.getByRole('row', { name: /Telefon/ })).toContainText('Ca global')
  await expect(section.getByRole('row', { name: /Combustibil/ })).toContainText('setarea auto')
  // Auto și amortizare nu se schimbă de aici.
  await expect(section.getByRole('row', { name: /Combustibil/ }).getByRole('button')).toHaveCount(0)
  await expect(section.getByRole('row', { name: /Amortizare/ }).getByRole('button')).toHaveCount(0)

  await section.getByRole('row', { name: /Telefon/ }).getByRole('button', { name: 'Modifică' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('combobox', { name: 'Deductibil' }).click()
  await page.getByRole('option', { name: '50%', exact: true }).click()
  await dialog.getByRole('textbox', { name: /Observație/ }).fill('Telefon folosit și personal.')
  await dialog.getByRole('button', { name: /Salvează|Confirmă|Adaugă/ }).click()

  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0]).toMatchObject({ field: 'deductibility:PHONE', value: '50_PERCENT', validFrom: '2026-10-01', note: 'Telefon folosit și personal.' })
})
