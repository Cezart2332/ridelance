import { expect, test, type Page } from '@playwright/test'

const API = 'http://localhost:5000'
test.setTimeout(60_000)

async function client(page: Page, subscription: Record<string, unknown>) {
  await page.route(`${API}/**`, route => route.fulfill({ json: [] }))
  await page.route(`${API}/users/refresh-token`, route => route.fulfill({ json: { accessToken: 'test', role: 'Client', userId: 'owner' } }))
  await page.route(`${API}/users/dashboard-summary`, route => route.fulfill({ json: { pfaStatus: 'Approved', pfaRegistrationId: 'own-pfa' } }))
  await page.route(`${API}/users/profile`, route => route.fulfill({ json: { firstName: 'Ana', lastName: 'Ionescu', role: 'Client' } }))
  await page.route(`${API}/payments/subscription`, route => route.fulfill({ json: { pfaStatus: 'Approved', onboardingSectionsValidated: true, ...subscription } }))
}

test('PFAlone bifează opțiunile la plată și ele ajung în checkout', async ({ page }, info) => {
  await client(page, { status: null, dashboardAccessGranted: false, hasPaidInfiintare: true })
  const bodies: Record<string, unknown>[] = []
  await page.route(`${API}/payments/checkout-session`, route => { bodies.push(route.request().postDataJSON()); return route.fulfill({ status: 500, json: {} }) })
  await page.goto('/inregistrare/abonament')
  await expect(page.getByText('PFAlone', { exact: true }).first()).toBeVisible({ timeout: 45_000 })

  await page.getByRole('checkbox', { name: /Open Banking/ }).check()
  await page.getByRole('checkbox', { name: /accept/i }).first().check()
  await page.getByRole('checkbox', { name: /accept/i }).nth(1).check().catch(() => undefined)
  await page.screenshot({ path: `test-results/subscription-select-${info.project.name}.png`, fullPage: true })
  await page.getByRole('button', { name: /Continuă cu/ }).click()
  await expect.poll(() => bodies.length).toBe(1)
  expect(bodies[0]).toMatchObject({ plan: 'pfalone', addons: ['open-banking'] })
})

test('PFAlone fără Open Banking vede opțiunea de cumpărat pe pagina băncii', async ({ page }) => {
  await client(page, { status: 'Active', dashboardAccessGranted: true, plan: 'PfaAlone', canManageRegisters: true, includesOpenBanking: false, includesCashRegister: false })
  await page.goto('/app/dashboard/contabilitate/cont-bancar')
  await expect(page.getByText(/Opțiune PFAlone · \+49 lei/)).toBeVisible({ timeout: 45_000 })
  await expect(page.getByRole('button', { name: 'Adaugă opțiunea' })).toBeVisible()
})
