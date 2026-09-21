import { expect, test, type Page } from '@playwright/test'

/**
 * Clienții în admin: „PFA înrolate” și „SRL înrolate”, cu active / inactive / șterse, plus firmele
 * în privirea de ansamblu. Închiderea unui cont nu șterge nimic — contul trece la „Șterse”.
 */

const pfa = (id: string, extra: Record<string, unknown>) => ({
  id: `pfa-${id}`,
  userId: `user-${id}`,
  userName: `Client ${id}`,
  userEmail: `${id}@example.test`,
  fullName: `Client ${id}`,
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
  ...extra,
})

const firm = (id: string, extra: Record<string, unknown>) => ({
  userId: `firm-${id}`,
  companyName: `Firma ${id} SRL`,
  cui: `RO1000${id.length}`,
  contactName: `Contact ${id}`,
  email: `${id}@firma.test`,
  phone: '0733000000',
  plan: 'Fleet',
  subscriptionStatus: 'Activ',
  billingCycle: 'Lunar',
  nextBillingDateUtc: '2026-10-01T00:00:00Z',
  subscriptionActive: true,
  enrolled: true,
  onboardingStep: 7,
  carsTotal: 6,
  carsPublished: 4,
  paidExtraListings: 0,
  includedListings: 10,
  companySlug: `firma-${id}`,
  createdAtUtc: '2026-07-01T00:00:00Z',
  lastActivityAtUtc: '2026-09-20T08:00:00Z',
  deletedAtUtc: null,
  deletionReason: null,
  ...extra,
})

async function mockAdmin(page: Page) {
  const firms = [
    firm('alfa', {}),
    firm('beta', { subscriptionActive: false, subscriptionStatus: 'Anulat', plan: 'Fleet' }),
    firm('gama', { enrolled: false, onboardingStep: 2, subscriptionActive: false, subscriptionStatus: 'Fără abonament' }),
    firm('delta', { deletedAtUtc: '2026-09-10T10:00:00Z', deletionReason: 'Cererea clientului', subscriptionActive: false }),
  ]
  const closed: { userId: string; reason: string | null }[] = []

  await page.route('**/users/refresh-token', (route) => route.fulfill({ json: { accessToken: 'test', userId: 'admin', role: 'Admin' } }))
  await page.route('**/users/profile', (route) => route.fulfill({ json: { firstName: 'Cezar', lastName: 'Popescu', role: 'Admin' } }))
  await page.route('**/notifications', (route) => route.fulfill({ json: [] }))
  await page.route(/\/pfa-registrations(\?.*)?$/, (route) =>
    route.fulfill({
      json: {
        items: [
          pfa('activ', {}),
          pfa('inactiv', { subscriptionStatus: 'Cancelled', accountStatus: 'Inactiv' }),
          pfa('inchis', { deletedAtUtc: '2026-09-15T10:00:00Z', accountStatus: 'Închis', subscriptionStatus: 'Cancelled' }),
          pfa('onboarding', { onboardingCompletedAtUtc: null, status: 'Pending', accountStatus: 'Nou', subscriptionStatus: null }),
        ],
      },
    }),
  )
  await page.route('**/admin/srl-accounts', (route) => route.fulfill({ json: firms }))
  await page.route('**/admin/accounts/*/close', async (route) => {
    const userId = new URL(route.request().url()).pathname.split('/').at(-2)!
    const body = route.request().postDataJSON() as { reason: string | null }
    closed.push({ userId, reason: body.reason })
    const index = firms.findIndex((f) => f.userId === userId)
    if (index >= 0) firms[index] = { ...firms[index], deletedAtUtc: '2026-09-21T10:00:00Z', deletionReason: body.reason }
    await route.fulfill({ json: { userId, deletedAtUtc: '2026-09-21T10:00:00Z', deletionReason: body.reason } })
  })
  await page.route('**/admin/overview?*', (route) =>
    route.fulfill({
      json: {
        generatedAtUtc: '2026-09-21T10:00:00Z',
        financialKpis: { totalCurrentMonthRevenueBani: 1845200, estimatedMonthlyRecurringRevenueBani: 1345000, oneTimeCurrentMonthRevenueBani: 500200, partnerCommissionsBani: 0, successfulPayments: 32, failedPayments: 2 },
        revenueCategories: [
          { label: 'Abonamente PFA', amountBani: 1345000, count: 32 },
          { label: 'Abonamente SRL', amountBani: 59800, count: 2 },
          { label: 'Anunțuri extra SRL', amountBani: 6000, count: 2 },
        ],
        pfaSubscriptions: [{ label: 'Start active', value: 32 }],
        carSubscriptions: [],
        srlSubscriptions: [{ label: 'Abonamente lunare active', value: 2 }],
        recentPayments: [],
        failedPayments: [],
        serviceSales: [],
        enrolledPfas: [],
        carStats: { totalListed: 42, paidActive: 28, pendingReview: 3, failedPayment: 1, leadsGenerated: 86, monthlyRevenueBani: 134500 },
        pfaStats: { totalEnrolled: 38, active: 32, newRequests: 4, clientBlocked: 2, inactive: 6, failedPayment: 2, inOnboarding: 6, deleted: 3 },
        srlStats: {
          totalEnrolled: 5, active: 2, inactive: 3, deleted: 1, inOnboarding: 1, failedPayment: 0,
          subscriptionMonthlyRevenueBani: 59800, carsTotal: 18, carsPublished: 12, paidExtraListings: 2,
          extraListingsRevenueBani: 6000, extraListingsPayments: 2,
        },
      },
    }),
  )
  return closed
}

test('PFA înrolate: active, inactive și șterse, fiecare cu numărul lui', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'lista e aceeași pe telefon; verificăm filtrarea o dată')
  await mockAdmin(page)
  await page.goto('/admin?tab=pfa_inrolate')

  await expect(page.getByRole('heading', { name: 'PFA înrolate' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'PFA înrolate' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Active (1)', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Inactive (1)', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Șterse (1)', exact: true })).toBeVisible()
  await expect(page.getByText('Client activ', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Șterse (1)', exact: true }).click()
  await expect(page.getByText('Client inchis', { exact: true })).toBeVisible()
  await expect(page.getByText('Cont închis')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Redeschide contul' })).toBeVisible()

  // Contul închis nu mai apare în onboarding.
  await page.goto('/admin?tab=pfa')
  await expect(page.getByText('Client onboarding', { exact: true })).toBeVisible()
  await expect(page.getByText('Client inchis', { exact: true })).toHaveCount(0)
})

test('SRL înrolate: filtrele, detaliile și închiderea unui cont', async ({ page }, info) => {
  const closed = await mockAdmin(page)
  await page.goto('/admin?tab=srl_inrolate')

  await expect(page.getByRole('heading', { name: 'SRL înrolate' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Active (1)', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Inactive (1)', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'În onboarding (1)', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Șterse (1)', exact: true })).toBeVisible()
  await expect(page.getByText('Firma alfa SRL')).toBeVisible()
  await expect(page.getByText('4 publicate din 6 mașini')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Intră în contul firmei' })).toBeVisible()

  await page.getByRole('button', { name: 'Arată detaliile' }).click()
  await expect(page.getByText('4 folosite din 10')).toBeVisible()
  await page.screenshot({ path: `test-results/admin-srl-${info.project.name}.png`, fullPage: true })

  // Închiderea: dialogul spune că nu se șterge nimic, iar firma trece la „Șterse”.
  await page.getByRole('button', { name: 'Mai multe acțiuni' }).click()
  await page.getByRole('menuitem', { name: 'Închide contul' }).click()
  await expect(page.getByText('Nimic nu se șterge', { exact: false })).toBeVisible()
  await page.getByLabel('Motiv (intern)').fill('Neplată repetată')
  await page.getByRole('dialog').getByRole('button', { name: 'Închide contul' }).click()

  await expect(page.getByText('a fost închis. Datele rămân păstrate.', { exact: false })).toBeVisible()
  expect(closed).toEqual([{ userId: 'firm-alfa', reason: 'Neplată repetată' }])
  await expect(page.getByRole('button', { name: 'Șterse (2)', exact: true })).toBeVisible()
})

test('privirea de ansamblu arată și firmele', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'aceleași date pe telefon')
  await mockAdmin(page)
  await page.goto('/admin?tab=overview')

  await expect(page.getByText('SRL-uri active')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'SRL-uri' })).toBeVisible()
  await expect(page.getByText('Anunțuri extra plătite (active)')).toBeVisible()
  await expect(page.getByText('Șterse (conturi închise)').first()).toBeVisible()
  await page.screenshot({ path: `test-results/admin-overview-srl-${info.project.name}.png`, fullPage: true })
})
