import { expect, test, type Page } from '@playwright/test'

const client = { id: 'pfa-review', userId: 'client-review', userName: 'Andrei Ionescu', userEmail: 'andrei@example.test', fullName: 'Andrei Ionescu', phone: '0722123456', registrationType: 'ExistingPfa', status: 'Pending', accountStatus: 'În onboarding', documentCount: 2, awaitingAdminAction: true, onboardingCompletedAtUtc: null, createdAtUtc: '2026-09-01T10:00:00Z', lastActivityAtUtc: '2026-09-14T08:00:00Z' }
const documents = [
  { id: 'identity', originalFileName: 'Carte de identitate.pdf', category: 'CarteIdentitate', status: 'Pending', fileSize: 120400, uploadedAtUtc: '2026-09-14T08:00:00Z', aiStatus: 'Passed', aiRequiresManualReview: false, origin: 'UserUpload', isUserFacing: true, contentType: 'application/pdf' },
  { id: 'license', originalFileName: 'Permis de conducere.pdf', category: 'PermisConducere', status: 'Verified', fileSize: 84200, uploadedAtUtc: '2026-09-14T08:00:00Z', aiStatus: 'Passed', aiRequiresManualReview: false, origin: 'UserUpload', isUserFacing: true, contentType: 'application/pdf' },
]

async function mockAdmin(page: Page, failFirst = false) {
  let docs = documents.map((doc) => ({ ...doc, reviewNote: null as string | null }))
  let eligibilityValidated = false
  const writes: { path: string; body: { status: string; note: string } }[] = []
  await page.route('**/users/refresh-token', (route) => route.fulfill({ json: { accessToken: 'test', userId: 'admin', role: 'Admin' } }))
  await page.route('**/users/profile', (route) => route.fulfill({ json: { firstName: 'Cezar', lastName: 'Popescu', role: 'Admin' } }))
  await page.route('**/notifications', (route) => route.fulfill({ json: [] }))
  await page.route(/\/pfa-registrations(\?.*)?$/, (route) => route.fulfill({ json: { items: [client] } }))
  await page.route('**/pfa-registrations/*/onboarding', (route) => route.fulfill({ json: { pfaRegistrationId: client.id, pfaStatus: 'Pending', sections: [], steps: [{ key: 'eligibility', status: eligibilityValidated ? 'Completed' : 'AwaitingValidation', state: eligibilityValidated ? 'completed' : 'pending_admin' }, { key: 'pfa', status: 'Locked', state: 'locked' }] } }))
  await page.route('**/pfa-registrations/*/eligibility/validate', (route) => { eligibilityValidated = true; return route.fulfill({ status: 204 }) })
  await page.route('**/admin/pfas/*/details', (route) => route.fulfill({ json: { ...client, companyName: 'Andrei Ionescu PFA', email: client.userEmail, plan: 'Start', subscriptionStatus: 'Trial', activityLog: [{ id: 'event1', description: 'Clientul a încărcat documentele de eligibilitate.', performedBy: 'Andrei Ionescu', createdAtUtc: '2026-09-14T08:00:00Z' }] } }))
  await page.route('**/admin/documents/*/extracted-fields', (route) => route.fulfill({ json: { fields: [] } }))
  await page.route(/\/documents(?:\?.*)?$/, (route) => route.fulfill({ json: docs }))
  await page.route('**/documents/*/status', async (route) => {
    const path = new URL(route.request().url()).pathname
    const body = route.request().postDataJSON()
    writes.push({ path, body })
    if (failFirst && writes.length === 1) return route.fulfill({ status: 500, json: { detail: 'Test failure' } })
    const id = path.split('/').at(-2)
    docs = docs.map((doc) => doc.id === id ? { ...doc, status: body.status, reviewNote: body.note } : doc)
    await route.fulfill({ status: 204 })
  })
  await page.route('**/admin/overview?*', (route) => route.fulfill({ json: {
    generatedAtUtc: '2026-09-14T10:00:00Z', financialKpis: { totalCurrentMonthRevenueBani: 1845200, estimatedMonthlyRecurringRevenueBani: 1345000, oneTimeCurrentMonthRevenueBani: 500200, partnerCommissionsBani: 0, successfulPayments: 32, failedPayments: 2 },
    revenueCategories: [{ label: 'Abonamente PFA', amountBani: 1345000, count: 32 }], pfaSubscriptions: [{ label: 'Start', value: 32 }], carSubscriptions: [], recentPayments: [], failedPayments: [], serviceSales: [], enrolledPfas: [],
    carStats: { totalListed: 42, paidActive: 28, pendingReview: 3, failedPayment: 1, leadsGenerated: 86, monthlyRevenueBani: 134500 },
    pfaStats: { totalEnrolled: 38, active: 32, newRequests: 4, clientBlocked: 2, inactive: 1, failedPayment: 2, inOnboarding: 6 },
  } }))
  return writes
}

test('admin: respinge un document verificat, păstrează motivul la eroare și nu respinge pasul', async ({ page }, info) => {
  const writes = await mockAdmin(page, true)
  await page.goto('/admin?tab=pfa&user=client-review&section=documente')
  const license = page.getByRole('article', { name: 'Permis de conducere.pdf' })
  await expect(license).toBeVisible()
  await license.getByRole('button', { name: 'Respinge document', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Respinge documentul', exact: true })).toBeDisabled()
  await dialog.getByLabel('Motivul respingerii').fill('Documentul este expirat. Încarcă permisul reînnoit.')
  await dialog.getByRole('button', { name: 'Respinge documentul', exact: true }).click()
  await expect(dialog.getByText(/Motivul a fost păstrat/)).toBeVisible()
  await expect(dialog.getByLabel('Motivul respingerii')).toHaveValue('Documentul este expirat. Încarcă permisul reînnoit.')
  await dialog.getByRole('button', { name: 'Respinge documentul', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(license.getByText('Respins', { exact: true })).toBeVisible()
  await expect(license.getByText(/Documentul este expirat/)).toBeVisible()
  await expect(page.getByRole('article', { name: 'Carte de identitate.pdf' }).getByText('De verificat', { exact: true })).toBeVisible()
  expect(writes).toHaveLength(2)
  expect(writes.every((write) => write.path.endsWith('/documents/license/status') && write.body.status === 'Rejected')).toBe(true)
  await page.reload()
  await expect(license.getByText('Respins', { exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Documente', exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.screenshot({ path: `test-results/admin-documents-${info.project.name}.png`, fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('admin: verificare pe pas, filtrare documente și revenire la lista de clienți', async ({ page }, info) => {
  await mockAdmin(page)
  await page.goto('/admin?tab=pfa&user=client-review')
  await expect(page.getByRole('heading', { name: 'Verificarea dosarului' })).toBeVisible()
  await expect(page.getByRole('article', { name: 'Permis de conducere.pdf' }).getByRole('button', { name: 'Respinge document' })).toBeVisible()
  await page.screenshot({ path: `test-results/admin-review-${info.project.name}.png`, fullPage: true })
  await page.getByRole('button', { name: 'Validează pasul', exact: true }).click()
  await expect(page.getByText('1 din 2 pași validați', { exact: true }).first()).toBeVisible()
  await page.getByRole('tab', { name: 'Documente', exact: true }).click()
  await page.getByLabel('Caută un document').fill('permis')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByLabel('Caută un document').fill('inexistent')
  await expect(page.getByText('Niciun document nu corespunde filtrelor.')).toBeVisible()
  await page.getByRole('button', { name: 'Resetează filtrele' }).click()
  await expect(page.getByRole('article')).toHaveCount(2)
  await page.getByRole('button', { name: /Înapoi la clienți/ }).click()
  await expect(page).toHaveURL(/\/admin\?tab=pfa$/)
  await expect(page.getByRole('heading', { name: 'Onboarding' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Onboarding' })).toBeVisible()
})

test('admin: rezumat organizat în subsecțiuni și meniu accesibil pe mobil', async ({ page }, info) => {
  await mockAdmin(page)
  await page.goto('/admin?tab=overview')
  await expect(page.getByText('Mașini și lead-uri', { exact: true })).toBeVisible()
  await expect(page.getByText('Plăți recente', { exact: true })).toHaveCount(0)
  await page.screenshot({ path: `test-results/admin-overview-${info.project.name}.png`, fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('tab', { name: 'Tranzacții și servicii' }).click()
  await expect(page.getByText('Plăți recente', { exact: true })).toBeVisible()
  await expect(page.getByText('Mașini și lead-uri', { exact: true })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Tranzacții și servicii' })).toHaveAttribute('aria-selected', 'true')
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Deschide meniul' }).click()
  await page.getByRole('navigation', { name: 'Navigare admin' }).filter({ visible: true }).getByRole('button', { name: 'Onboarding' }).click()
  await expect(page.getByRole('heading', { name: 'Onboarding' })).toBeVisible()
})
