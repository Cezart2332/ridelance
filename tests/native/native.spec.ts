import { expect, test, type Page } from '@playwright/test'

const API = 'http://localhost:5000'

async function mockApi(page: Page, opts: { active: boolean }) {
  const seen = { loginNativeHeader: false, refreshHeaderToken: null as string | null }
  await page.route(`${API}/**`, (route) => route.fulfill({ json: [] }))
  await page.route(`${API}/users/login`, (route) => {
    seen.loginNativeHeader = route.request().headers()['x-ridelance-client'] === 'native'
    return route.fulfill({ json: { accessToken: 'a1', role: 'Client', userId: 'u1', refreshToken: 'r1' } })
  })
  await page.route(`${API}/users/refresh-token`, (route) => {
    const token = route.request().headers()['x-refresh-token'] ?? null
    seen.refreshHeaderToken = token
    if (!token) return route.fulfill({ status: 401, json: {} })
    return route.fulfill({ json: { accessToken: 'a2', role: 'Client', userId: 'u1', refreshToken: 'r2' } })
  })
  await page.route(`${API}/payments/subscription`, (route) =>
    route.fulfill({
      json: {
        id: 's', plan: 'pro', status: opts.active ? 'Active' : null, stripeSubscriptionId: null, firstBillingDateUtc: null,
        nextBillingDateUtc: null, createdAtUtc: null, dashboardAccessGranted: opts.active, billingCycle: null,
        pfaStatus: opts.active ? 'Approved' : 'Pending', pfaRegistrationType: 'AmPfa', pendingPlan: null,
        hasPaidInfiintare: false, onboardingSectionsValidated: opts.active,
      },
    }),
  )
  await page.route(`${API}/users/dashboard-summary`, (route) =>
    route.fulfill({ json: { pfaStatus: opts.active ? 'Approved' : 'Pending', pfaRegistrationId: 'p1' } }),
  )
  return seen
}

async function login(page: Page) {
  await page.goto('/app')
  await expect(page.getByRole('button', { name: /Intră/ })).toBeVisible()
  await page.getByPlaceholder(/email/i).first().fill('sofer@example.test')
  await page.locator('input[type="password"]').first().fill('parola123')
  await page.getByRole('button', { name: /Intră/ }).click()
}

test('fără sesiune: doar autentificare, fără cont nou', async ({ page }) => {
  await mockApi(page, { active: true })
  await page.goto('/app')
  await expect(page.getByText('Intră în contul tău RIDElance.')).toBeVisible()
  await expect(page.getByText('Creează cont')).toHaveCount(0)
  await expect(page.getByText('Înapoi la site')).toHaveCount(0)
  await page.goto('/onboarding')
  await expect(page).toHaveURL(/\/autentificare|\/login|\/app/)
  await page.screenshot({ path: 'test-results/native-login.png' })
})

test('cont în înrolare: ecranul explicativ, fără onboarding', async ({ page }) => {
  const seen = await mockApi(page, { active: false })
  await login(page)
  await expect(page.getByText('Contul tău e încă în înrolare')).toBeVisible()
  expect(seen.loginNativeHeader).toBe(true)
  await page.screenshot({ path: 'test-results/native-unavailable.png' })
})

test('PFA activ: dashboard fără plăți, sesiunea rămâne după redeschidere', async ({ page }) => {
  const seen = await mockApi(page, { active: true })
  await login(page)
  await expect(page).toHaveURL(/\/app\/dashboard/)

  await page.goto('/app/dashboard/servicii/abonamente')
  await expect(page).toHaveURL(/\/app\/dashboard$/)

  // Meniul complet, deschis din antet pe Profil (Acasă are nevoie de date reale de venituri).
  await page.goto('/app/dashboard/profil')
  await expect(page.getByText('Istoric plăți', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Meniu', exact: true }).click()
  const drawer = page.locator('body')
  await expect(page.getByText('Servicii', { exact: true }).last()).toBeVisible()
  // Grupurile se deschid ca să se vadă toate paginile, inclusiv cele din Servicii.
  for (const group of ['Servicii', 'Contabilitate']) {
    const button = drawer.getByRole('button', { name: group }).first()
    if (await button.count()) await button.click()
  }
  await expect(drawer.getByText('Asigurări', { exact: true })).toBeVisible()
  await expect(drawer.getByText('Abonamente', { exact: true })).toHaveCount(0)
  await expect(drawer.getByText('Servicii individuale', { exact: true })).toHaveCount(0)
  await page.screenshot({ path: 'test-results/native-menu.png' })

  // „Redeschiderea” aplicației: sesiunea revine din tokenul păstrat, trimis prin antet.
  await page.reload()
  await expect(page).toHaveURL(/\/app\/dashboard/)
  // Fiecare deschidere trimite tokenul rotit la cea de dinainte (r1 → r2).
  expect(seen.refreshHeaderToken).toBe('r2')
})
