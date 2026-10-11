import { expect, test, type Page } from '@playwright/test'

/**
 * Adminul intră în contul unui client și rămâne acolo.
 *
 * Tokenul primit e scurt, iar cel de reîmprospătare e al adminului. Prima reîmprospătare — tokenul
 * expirat, pagina reîncărcată — aducea înapoi sesiunea de admin în zona clientului, iar adminul
 * vedea „Nu ai acces aici”.
 */

const client = {
  id: 'pfa-activ',
  userId: 'user-activ',
  userName: 'Client activ',
  userEmail: 'activ@example.test',
  fullName: 'Client activ',
  phone: '0722123456',
  registrationType: 'ExistingPfa',
  status: 'Approved',
  accountStatus: 'Activ',
  documentCount: 4,
  awaitingAdminAction: false,
  onboardingCompletedAtUtc: '2026-09-01T10:00:00Z',
  createdAtUtc: '2026-08-01T10:00:00Z',
  lastActivityAtUtc: '2026-09-20T08:00:00Z',
  subscriptionStatus: 'Active',
  subscriptionPlan: 'Start',
  deletedAtUtc: null,
}

/** API fals: sesiunea de reîmprospătare e mereu a adminului, ca în realitate. */
async function mockApi(page: Page) {
  const state = { expireNextClientCall: false, impersonations: 0 }

  await page.route('http://localhost:5000/**', (route) => {
    const { pathname } = new URL(route.request().url())
    const asClient = (route.request().headers()['authorization'] ?? '').includes('client-token')

    if (pathname === '/users/refresh-token') {
      return route.fulfill({ json: { accessToken: 'admin-token', userId: 'admin', role: 'Admin' } })
    }
    if (pathname.startsWith('/users/impersonate/')) {
      state.impersonations += 1
      return route.fulfill({ json: { accessToken: 'client-token', userId: client.userId, role: 'Client' } })
    }
    if (asClient && state.expireNextClientCall) {
      state.expireNextClientCall = false
      return route.fulfill({ status: 401, json: {} })
    }
    if (pathname === '/users/profile') {
      return route.fulfill({ json: { firstName: 'Ana', lastName: 'Pop', role: asClient ? 'Client' : 'Admin' } })
    }
    if (pathname === '/pfa-registrations' && !asClient) return route.fulfill({ json: { items: [client] } })
    if (pathname === '/payments/subscription') return route.fulfill({ json: { status: 'Active', plan: 'Start', isActive: true } })
    return route.fulfill({ json: [] })
  })

  return state
}

async function enterClientAccount(page: Page) {
  await page.getByRole('button', { name: 'Acțiuni pentru Client activ' }).click()
  await page.getByRole('menuitem', { name: 'Intră în contul clientului' }).click()
}

const banner = (page: Page) => page.getByText('vizualizezi contul „Client activ”')
const forbidden = (page: Page) => page.getByText('Nu ai acces aici')

test('intrarea în contul clientului rezistă la expirarea tokenului și la reîncărcare', async ({ page }) => {
  const api = await mockApi(page)

  await page.goto('/admin?tab=pfa_inrolate')
  await enterClientAccount(page)

  await expect(banner(page)).toBeVisible()
  await expect(page).not.toHaveURL(/\/admin/)
  // Ieșirea din panoul de admin schimbă pielea paginii, care se reîncarcă o dată (`SkinBoundary`),
  // iar reîncărcarea cere din nou intrarea în cont: o cerere, sau două dacă pielea s-a schimbat.
  await page.waitForLoadState('networkidle')
  await expect(banner(page)).toBeVisible()
  const entered = api.impersonations
  expect(entered).toBeGreaterThanOrEqual(1)
  expect(entered).toBeLessThanOrEqual(2)

  // Tokenul clientului expiră: următoarea cerere primește 401 și pornește reîmprospătarea.
  api.expireNextClientCall = true
  await page.reload()
  await expect(banner(page)).toBeVisible()
  await expect(forbidden(page)).toHaveCount(0)
  await expect(page).not.toHaveURL(/\/admin/)
  // O dată la reîncărcare, o dată după 401.
  await expect.poll(() => api.impersonations).toBeGreaterThanOrEqual(entered + 2)
  await expect(banner(page)).toBeVisible()
  await expect(forbidden(page)).toHaveCount(0)
})

test('întoarcerea la admin încheie vizualizarea și nu mai revine în contul clientului', async ({ page }) => {
  const api = await mockApi(page)

  await page.goto('/admin?tab=pfa_inrolate')
  await enterClientAccount(page)
  await expect(banner(page)).toBeVisible()

  await page.getByRole('button', { name: /napoi|Revino|admin/i }).first().click()
  await expect(page).toHaveURL(/\/admin/)
  await expect(banner(page)).toHaveCount(0)

  const before = api.impersonations
  await page.reload()
  await expect(page).toHaveURL(/\/admin/)
  await expect(forbidden(page)).toHaveCount(0)
  expect(api.impersonations).toBe(before)
})
