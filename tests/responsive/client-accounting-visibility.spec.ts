import { expect, test, type Page } from '@playwright/test'

const API = 'http://localhost:5000'
const ROOT = '/app/dashboard/contabilitate'
const year = new Date().getFullYear()
test.setTimeout(60_000)

async function owner(page: Page, plan: 'PfaAlone' | 'PfaFull' = 'PfaAlone') {
  await page.route(`${API}/**`, route => route.fulfill({ json: [] }))
  await page.route(`${API}/users/refresh-token`, route => route.fulfill({ json: { accessToken: 'test', role: 'Client', userId: 'owner' } }))
  await page.route(`${API}/users/dashboard-summary`, route => route.fulfill({ json: { pfaStatus: 'Approved', pfaRegistrationId: 'own-pfa' } }))
  await page.route(`${API}/users/profile`, route => route.fulfill({ json: { firstName: 'Ana', lastName: 'Ionescu', role: 'Client' } }))
  await page.route(`${API}/payments/subscription`, route => route.fulfill({ json: { pfaStatus: 'Approved', onboardingSectionsValidated: true, status: 'Active', dashboardAccessGranted: true, plan, canManageRegisters: plan === 'PfaAlone', canGenerateDeclarations: plan === 'PfaAlone' } }))
  await page.route(`${API}/pfa/inventory`, route => route.fulfill({ status: 204 }))
  await page.route(`${API}/pfa/accounting/registers/rjip?*`, route => route.fulfill({ json: { pfaId: 'own-pfa', from: `${year}-01-01`, to: `${year}-12-31`, rows: [{ ledgerEntryId: 'payment', no: 1, date: `${year}-03-10`, document: 'Raport Z 17', operation: 'Încasări cash din curse', cashIn: 125, bankIn: 0, cashOut: 0, bankOut: 0, exception: null }], monthTotals: [{ period: `${year}-03`, cashIn: 125, bankIn: 0, cashOut: 0, bankOut: 0 }] } }))
  await page.route(`${API}/pfa/accounting/registers/ref?*`, route => route.fulfill({ json: { pfaId: 'own-pfa', year, status: 'CURRENT', asOf: null, rows: [{ calculationElement: 'Venit brut', value: 125, contributions: [{ ledgerEntryId: 'payment', date: `${year}-03-10`, label: 'Raport Z 17', value: 125 }] }] } }))
  await page.route(`${API}/pfa/accounting/spv`, route => route.fulfill({ json: { lastSyncAtUtc: null, messages: [{ id: 'own-message', type: 'NOTIFICARE', createdAtUtc: `${year}-03-11T10:00:00Z`, details: 'Mesaj ANAF pentru Ana', note: 'Verificat de contabil', status: 'PROCESSED', hasDocument: true }], requests: [] } }))
  await page.route(`${API}/pfa/accounting/efactura`, route => route.fulfill({ json: { link: { status: 'ACTIVE', lastSyncAtUtc: `${year}-03-11T10:00:00Z` }, messages: [{ id: 'own-invoice', kind: 'RECEIVED', invoiceNumber: 'UB-123', supplierName: 'Uber', customerName: 'ANA PFA', createdAtUtc: `${year}-03-11T10:00:00Z`, totalAmount: 100, currency: 'RON', paymentStatus: 'UNPAID', downloaded: true }] } }))
}

test('PFAlone își vede registrele și sursa rândurilor fiscale', async ({ page }, info) => {
  await owner(page)
  await page.goto(`${ROOT}/registre`)
  await expect(page.getByRole('heading', { name: 'Registrul-jurnal de încasări și plăți (RJIP)', exact: true })).toBeVisible({ timeout: 45_000 })
  await expect(page.getByRole('cell', { name: 'Raport Z 17', exact: false })).toBeVisible()
  await expect(page.getByText('Încasări cash', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Evidență fiscală', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Venit brut', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Arată operațiunile' }).click()
  await expect(page.getByRole('cell', { name: 'Raport Z 17', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `test-results/client-registers-${info.project.name}.png`, fullPage: true })
})

test('PFAlone își trece singur încasările și le poate șterge', async ({ page }) => {
  await owner(page)
  const added: unknown[] = []
  await page.route(`${API}/pfa/accounting/registers/entries`, route => { added.push(route.request().postDataJSON()); return route.fulfill({ json: {} }) })
  const deleted = page.waitForRequest(request => request.method() === 'DELETE' && request.url().endsWith('/pfa/accounting/registers/entries/payment'))
  await page.route(`${API}/pfa/accounting/registers/entries/payment`, route => route.fulfill({ status: 204 }))
  await page.goto(`${ROOT}/registre`)
  await expect(page.getByRole('cell', { name: 'Raport Z 17', exact: false })).toBeVisible({ timeout: 45_000 })
  await page.getByLabel('Document').fill('Chitanța 12')
  await page.getByLabel('Explicație').fill('Cursă în numerar')
  await page.getByLabel('Sumă (lei)').fill('80,50')
  await page.getByRole('main').getByRole('button', { name: 'Adaugă', exact: true }).click()
  await expect.poll(() => added.length).toBe(1)
  expect(added[0]).toMatchObject({ documentLabel: 'Chitanța 12', description: 'Cursă în numerar', transactionType: 'INCOME', paymentMethod: 'BANK', amount: 80.5 })
  await page.getByRole('button', { name: 'Șterge' }).first().click()
  await deleted
})

test('PFA Full nu vede registrele și nici generatorul de declarații', async ({ page }) => {
  await owner(page, 'PfaFull')
  await page.goto(`${ROOT}/registre`)
  await expect(page).toHaveURL(/\/app\/dashboard$/, { timeout: 45_000 })
  await expect(page.getByRole('link', { name: 'Registrele mele' })).toHaveCount(0)
  await page.goto(`${ROOT}/declaratii`)
  await expect(page).toHaveURL(/taxe-declaratii$/)
})

test('PFAlone generează declarațiile și descarcă XML-ul', async ({ page }) => {
  await owner(page)
  let generated = false
  await page.route(`${API}/pfa/accounting/own-declarations?*`, route => route.fulfill({ json: generated
    ? [{ declarationId: 'd100', type: 'D100', period: `${year - 1}-12`, amount: 12, dueDate: `${year}-01-25`, status: 'GENERATED', xmlDocumentId: 'xml-1' }]
    : [] }))
  await page.route(`${API}/pfa/accounting/own-declarations/monthly`, route => { generated = true; return route.fulfill({ json: { generated: true, message: 'Generate: D100 12,00 lei.' } }) })
  await page.route(`${API}/documents/xml-1/download`, route => route.fulfill({ contentType: 'application/xml', body: '<declaratie100 />' }))
  await page.goto(`${ROOT}/declaratii`)
  await expect(page.getByRole('button', { name: 'Generează lunare' })).toBeVisible({ timeout: 45_000 })
  await page.getByRole('button', { name: 'Generează lunare' }).click()
  await expect(page.getByText('Generate: D100 12,00 lei.')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descarcă' }).click()
  expect((await download).suggestedFilename()).toBe(`D100_${year - 1}-12.xml`)
})

test('PFA vede mesajele SPV, facturile și poate descărca XML-ul propriu', async ({ page }, info) => {
  await owner(page)
  await page.route(`${API}/pfa/accounting/efactura/own-invoice/xml`, route => route.fulfill({ contentType: 'application/xml', body: '<Invoice />' }))
  await page.goto(`${ROOT}/spv-efactura`)
  await expect(page.getByText('Mesaj ANAF pentru Ana')).toBeVisible()
  await expect(page.getByText('Verificat de contabil', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'e-Factura', exact: true }).click()
  await expect(page.getByText('UB-123', { exact: true })).toBeVisible()
  await expect(page.getByText(/Neplătită/)).toBeVisible()
  const request = page.waitForRequest(`${API}/pfa/accounting/efactura/own-invoice/xml`)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descarcă XML' }).click()
  await request
  expect((await download).suggestedFilename()).toBe('eFactura_own-invoice.xml')
  await page.getByRole('textbox', { name: 'Caută mesaj sau factură' }).fill('lipsă')
  await expect(page.getByText('Niciun rezultat pentru căutarea aleasă.')).toBeVisible()
  await page.getByRole('textbox', { name: 'Caută mesaj sau factură' }).clear()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `test-results/client-anaf-${info.project.name}.png`, fullPage: true })
})

test('PFA poate reîncerca atunci când SPV nu răspunde', async ({ page }) => {
  await owner(page)
  let unavailable = true
  await page.route(`${API}/pfa/accounting/spv`, route => unavailable ? route.fulfill({ status: 503, json: { detail: 'SPV este indisponibil temporar.' } }) : route.fulfill({ json: { messages: [], requests: [], lastSyncAtUtc: null } }))
  await page.goto(`${ROOT}/spv-efactura`)
  await expect(page.getByRole('alert')).toBeVisible()
  unavailable = false
  await page.getByRole('button', { name: 'Reîncearcă' }).click()
  await expect(page.getByText('Nu există mesaje SPV sincronizate pentru PFA-ul tău.')).toBeVisible()
})
