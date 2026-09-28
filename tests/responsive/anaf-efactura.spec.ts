import { expect, test, type Page } from '@playwright/test'
import { mockAccountingClient } from './fixtures/accountingClient'

const PFA_ID = '11111111-1111-1111-1111-111111111111'
const CLIENT_USER_ID = '22222222-2222-2222-2222-222222222222'

const connected = {
  configured: true,
  status: 'ACTIVE',
  connectedBy: 'Admin RIDElance',
  connectedAtUtc: '2026-09-28T09:00:00Z',
  accessExpiresAtUtc: '2026-12-27T09:00:00Z',
  refreshExpiresAtUtc: '2027-09-28T09:00:00Z',
  lastError: null,
}
const notConnected = { ...connected, status: null, connectedBy: null, connectedAtUtc: null, accessExpiresAtUtc: null, refreshExpiresAtUtc: null }
const messages = [
  {
    id: 'm1', kind: 'RECEIVED', anafType: 'FACTURA PRIMITA', createdAtUtc: '2026-09-15T11:30:00Z', invoiceNumber: 'OMV-2026-0915', issueDate: '2026-09-15',
    supplierName: 'OMV PETROM MARKETING SRL', supplierCif: 'RO11201891', customerName: 'POPESCU ION PFA', customerCif: '12345674', currency: 'RON',
    totalAmount: 363, vatAmount: 63, downloaded: true, downloadError: null, details: null,
  },
  {
    id: 'm2', kind: 'SENT', anafType: 'FACTURA TRIMISA', createdAtUtc: '2026-09-16T08:00:00Z', invoiceNumber: 'RDL-0042', issueDate: '2026-09-16',
    supplierName: 'POPESCU ION PFA', supplierCif: '12345674', customerName: 'CLIENT CURSA SRL', customerCif: 'RO45000000', currency: 'RON',
    totalAmount: 120, vatAmount: 0, downloaded: true, downloadError: null, details: null,
  },
]

async function mock(page: Page, role: 'Admin' | 'Contabil', state: object) {
  await page.route('**/users/refresh-token', (route) => route.fulfill({ json: { accessToken: 'test', userId: 'staff', role } }))
  await page.route('**/users/profile', (route) => route.fulfill({ json: { firstName: 'Ana', lastName: role, email: 'staff@example.test', role } }))
  await mockAccountingClient(page, { pfaId: PFA_ID, userId: CLIENT_USER_ID, name: 'POPESCU ION PFA', email: 'ion@example.test' })
  await page.route(`**/accounting/pfas/${PFA_ID}/efactura`, (route) => route.fulfill({ json: state }))
  await page.route(`**/accounting/pfas/${PFA_ID}/spv`, (route) => route.fulfill({ json: spv }))
  await page.route('**/anaf/spv', (route) => route.fulfill({ json: { keys: [], lastSuccessAtUtc: null, lastError: null, needsAttention: 0, queuedRequests: 0 } }))
}

const spv = {
  lastSyncAtUtc: '2026-09-28T09:00:00Z',
  messages: [
    {
      id: 's1', type: 'RECIPISA', createdAtUtc: '2026-09-25T08:00:00Z', details: 'recipisa pentru CIF 12345674, tip D100, perioada raportare 8.2026',
      status: 'PROCESSED', note: 'Recipisă D100 2026-08 atașată declarației.', hasDocument: true, read: false, requestType: null,
    },
  ],
  requests: [],
}

const url = (root: string) => `${root}?tab=${root === '/admin' ? 'contab_pfa' : 'clienti'}&pfa=${PFA_ID}&sectiune=anaf`

test('admin: conectează contul ANAF cu certificatul, revenind în fișa clientului', async ({ page }) => {
  await mock(page, 'Admin', { connection: notConnected, link: null, messages: [] })
  let returnPath = ''
  await page.route('**/anaf/oauth/start', async (route) => {
    returnPath = route.request().postDataJSON().returnPath
    await route.fulfill({ json: { url: 'https://logincert.anaf.ro/anaf-oauth2/v1/authorize?response_type=code' } })
  })
  await page.route('https://logincert.anaf.ro/**', (route) => route.fulfill({ contentType: 'text/html', body: '<p>Certificat</p>' }))
  await page.goto(url('/admin'))

  // Primul test din fișier prinde serverul Vite rece: fișa clientului se compilează acum.
  await expect(page.getByText('Neconectat').first()).toBeVisible({ timeout: 45_000 })
  await page.getByRole('button', { name: 'Conectează contul ANAF' }).click()
  await page.waitForURL(/logincert\.anaf\.ro/)
  expect(returnPath).toContain(`pfa=${PFA_ID}`)
  expect(returnPath).toContain('sectiune=anaf')
})

test('admin: facturile e-Factura ale clientului, filtre și sincronizare', async ({ page }, info) => {
  await mock(page, 'Admin', {
    connection: connected,
    link: { status: 'ACTIVE', enabledAtUtc: '2026-09-28T09:05:00Z', lastSyncAtUtc: '2026-09-28T09:05:00Z', lastError: null },
    messages,
  })
  let synced = 0
  await page.route(`**/accounting/pfas/${PFA_ID}/efactura/sync`, (route) => {
    synced++
    return route.fulfill({ json: { newMessages: 0, downloaded: 0 } })
  })
  // Întoarcerea de la ANAF: mesajul apare o dată, iar parametrul dispare din URL.
  await page.goto(`${url('/admin')}&anaf=conectat`)

  await expect(page.getByText('Contul ANAF e conectat.')).toBeVisible()
  await expect(page).not.toHaveURL(/anaf=conectat/)
  await expect(page.getByText('OMV PETROM MARKETING SRL')).toBeVisible()
  await expect(page.getByText('CLIENT CURSA SRL')).toBeVisible()
  await page.screenshot({ path: `test-results/anaf-efactura-${info.project.name}.png`, fullPage: true })

  await page.getByRole('button', { name: 'Primite 1' }).click()
  await expect(page.getByText('CLIENT CURSA SRL')).toHaveCount(0)

  await page.getByRole('button', { name: 'Sincronizează' }).click()
  await expect(page.getByText('Sincronizat.')).toBeVisible()
  expect(synced).toBe(1)
})

test('SPV: recipisa adusă de aplicația desktop și o cerere nouă în coadă', async ({ page }) => {
  await mock(page, 'Contabil', { connection: connected, link: null, messages: [] })
  const queued: unknown[] = []
  await page.route(`**/accounting/pfas/${PFA_ID}/spv/requests`, (route) => {
    queued.push(route.request().postDataJSON())
    return route.fulfill({ status: 204 })
  })
  await page.goto(url('/contabil'))

  await expect(page.getByText('Recipisă D100 2026-08 atașată declarației.')).toBeVisible()
  await expect(page.getByText('Procesat', { exact: true })).toBeVisible()
  // Cheile aplicației sunt doar la admin.
  await expect(page.getByText('Aplicația SPV')).toHaveCount(0)

  await page.getByRole('button', { name: 'Cere document' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cere', exact: true }).click()
  await expect(page.getByText('Cererea pleacă la următoarea trimitere a aplicației SPV.')).toBeVisible()
  expect(queued).toEqual([{ type: 'VECTOR FISCAL', parameters: {} }])
})

test('contabil: vede facturile, dar nu conectează și nu sincronizează', async ({ page }) => {
  await mock(page, 'Contabil', {
    connection: connected,
    link: { status: 'ACTIVE', enabledAtUtc: '2026-09-28T09:05:00Z', lastSyncAtUtc: '2026-09-28T09:05:00Z', lastError: null },
    messages,
  })
  await page.goto(url('/contabil'))

  await expect(page.getByText('OMV PETROM MARKETING SRL')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sincronizează' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Conectează/ })).toHaveCount(0)
})
