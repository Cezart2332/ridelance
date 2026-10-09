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
  await page.route('**/admin/pfas/*/details', (route) => route.fulfill({ json: { ...client, companyName: 'Andrei Ionescu PFA', email: client.userEmail, plan: 'PFA Full', subscriptionStatus: 'Trial', activityLog: [{ id: 'event1', description: 'Clientul a încărcat documentele de eligibilitate.', performedBy: 'Andrei Ionescu', createdAtUtc: '2026-09-14T08:00:00Z' }] } }))
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

test('admin: răspunsurile din onboarding apar la fiecare pas, cu Da/Nu și schimbările', async ({ page }, info) => {
  await mockAdmin(page)
  await page.route('**/pfa-registrations/*/onboarding/answers', (route) => route.fulfill({ json: [
    { stepKey: 'eligibility', questionId: 'age', question: 'Ai împlinit 21 de ani?', value: 'yes', valueLabel: 'Da', answeredAtUtc: '2026-09-14T08:00:00Z', previousLabels: ['Nu'] },
    { stepKey: 'eligibility', questionId: 'attestation', question: 'Ai atestat de transport alternativ?', value: 'yes', valueLabel: 'Da', answeredAtUtc: '2026-09-14T08:02:00Z', previousLabels: [] },
    { stepKey: 'fiscal', questionId: 'tva', question: 'Deții certificat de TVA intracomunitar?', value: 'no', valueLabel: 'Nu', answeredAtUtc: '2026-09-15T09:00:00Z', previousLabels: [] },
    { stepKey: 'pfa', questionId: 'pfa_contact.phone', question: 'La ce număr te putem suna? · Telefon', value: '0722123456', valueLabel: '0722123456', answeredAtUtc: '2026-09-14T09:00:00Z', previousLabels: [] },
  ] }))
  await page.goto('/admin?tab=pfa&user=client-review')

  // Fără panou separat: răspunsurile stau în cardul pasului lor.
  await expect(page.getByRole('heading', { name: 'Răspunsuri din onboarding' })).toHaveCount(0)
  // Pasul de eligibilitate e deschis (e la admin): răspunsurile lui, cu schimbarea.
  const eligibility = page.locator('#step-eligibility')
  await expect(eligibility.getByText('Răspunsurile clientului')).toBeVisible()
  await expect(eligibility.getByText('Ai împlinit 21 de ani?')).toBeVisible()
  await expect(eligibility.getByText('înainte: Nu', { exact: false })).toBeVisible()
  // Răspunsul de la fiscal nu apare la eligibilitate: fiecare pas le are pe ale lui.
  await expect(eligibility.getByText('Deții certificat de TVA intracomunitar?')).toHaveCount(0)
  await expect(page.locator('#step-pfa').getByText('0722123456')).toBeAttached()
  await eligibility.scrollIntoViewIfNeeded()
  await eligibility.screenshot({ path: `test-results/admin-onboarding-answers-${info.project.name}.png` })
})

test('admin: ARR & Cont Flotă — apel telefonic, status cu document oficial și upload tipizat', async ({ page }, info) => {
  await mockAdmin(page)
  await page.route('**/pfa-registrations/*/onboarding', (route) => route.fulfill({ json: { pfaRegistrationId: client.id, pfaStatus: 'Validated', sections: [], steps: [
    { key: 'eligibility', status: 'Completed', state: 'completed' },
    { key: 'pfa', status: 'Completed', state: 'completed' },
    { key: 'fiscal', status: 'Completed', state: 'completed' },
    { key: 'arr_fleet', status: 'AwaitingValidation', state: 'pending_admin' },
  ] } }))
  let arrFleet = {
    pfaRegistrationId: client.id, status: 'DocumentsSubmitted', statusLabel: 'Documente primite',
    platforms: ['Uber', 'Bolt'],
    driverAccounts: [
      { platform: 'Uber', hasAccount: true, email: 'sofer@example.test', phone: '+40712345678', fullName: 'Andrei Ionescu', requiresPhoneCall: false },
      { platform: 'Bolt', hasAccount: false, email: null, phone: null, fullName: null, requiresPhoneCall: true },
    ],
    vehicleOwnership: 'Rental', paymentAmountBani: 41600,
    payments: [
      { kind: 'Authorization', label: 'Autorizația de transport', explanation: '', amountBani: 30000, proofCategory: 'ArrAuthorizationPaymentProof', proofUploaded: true },
      { kind: 'CertifiedCopy', label: 'Copia conformă', explanation: '', amountBani: 10000, proofCategory: 'ArrCertifiedCopyPaymentProof', proofUploaded: true },
      { kind: 'Badges', label: 'Ecusoanele', explanation: '', amountBani: 1600, proofCategory: 'ArrBadgesPaymentProof', proofUploaded: false },
    ],
    agency: { countyCode: 'CJ', countyName: 'Cluj', beneficiaryName: 'A.R.R. — Agenția Teritorială Cluj', treasury: 'Trezoreria Cluj-Napoca', fiscalCode: '23826223', iban: 'RO93TREZ216501701X030552' },
    agencyError: null,
    paymentProofOutdated: false, submittedAtUtc: '2026-10-09T08:00:00Z', reopenedReason: null, missing: [], statusLog: [] as unknown[],
  }
  const uploads: string[] = []
  await page.route('**/admin/onboarding/*/arr-fleet', (route) => route.fulfill({ json: arrFleet }))
  await page.route('**/admin/onboarding/*/arr-fleet/status', (route) => {
    const status = route.request().postDataJSON().status
    if (status === 'AuthorizationIssued') {
      return route.fulfill({ status: 400, json: { title: 'ArrFleet.OfficialDocumentMissing', detail: 'Încarcă întâi documentul oficial: Autorizație de transport.' } })
    }
    arrFleet = { ...arrFleet, status, statusLog: [{ fromStatus: 'DocumentsSubmitted', toStatus: status, changedBy: 'Cezar Popescu', changedAtUtc: '2026-10-09T09:00:00Z' }] }
    return route.fulfill({ json: arrFleet })
  })
  await page.route('**/admin/onboarding/*/arr-fleet/official-documents', (route) => {
    uploads.push(route.request().postData() ?? '')
    return route.fulfill({ json: arrFleet })
  })
  await page.goto('/admin?tab=pfa&user=client-review')

  const step = page.locator('#step-arr_fleet')
  await expect(step.getByText('Necesită apel telefonic — nu are cont')).toBeVisible()
  await expect(step.getByText('sofer@example.test · +40712345678 · Andrei Ionescu')).toBeVisible()
  await expect(step.getByText('Contract de închiriere', { exact: true })).toBeVisible()
  await expect(step.getByText('416 lei')).toBeVisible()
  await expect(step.getByText(/A\.R\.R\. — Agenția Teritorială Cluj · CIF 23826223/)).toBeVisible()
  await expect(step.getByText('16 lei · fără dovadă')).toBeVisible()

  // Autorizația cere documentul oficial: serverul refuză, iar mesajul ajunge la admin.
  await step.getByLabel('Status').click()
  await page.getByRole('option', { name: 'Autorizație obținută' }).click()
  await step.getByRole('button', { name: 'Salvează statusul' }).click()
  await expect(page.getByText('Încarcă întâi documentul oficial: Autorizație de transport.')).toBeVisible()

  await step.getByLabel('Status').click()
  await page.getByRole('option', { name: 'În lucru (ARR / conturi flotă)' }).click()
  await step.getByRole('button', { name: 'Salvează statusul' }).click()
  await expect(step.getByText(/Documente primite → În lucru \(ARR \/ conturi flotă\) · Cezar Popescu/)).toBeVisible()

  // Ecusoanele se oferă doar pentru platformele alese; aici ambele.
  await step.getByLabel('Document').click()
  await expect(page.getByRole('option', { name: 'Ecuson Bolt' })).toBeVisible()
  await page.getByRole('option', { name: 'Ecuson Uber' }).click()
  await step.locator('input[type=file]').setInputFiles({ name: 'ecuson.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') })
  await expect.poll(() => uploads.length).toBe(1)
  expect(uploads[0]).toContain('UberBadge')
  await step.screenshot({ path: `test-results/admin-arr-fleet-${info.project.name}.png` })
})

test('admin: lista și dosarul PFA se reîmprospătează singure la 10 secunde și din buton', async ({ page }) => {
  await page.clock.install()
  await mockAdmin(page)
  let clients = [client]
  await page.route(/\/pfa-registrations(\?.*)?$/, (route) => route.fulfill({ json: { items: clients } }))
  let docs = [...documents]
  await page.route(/\/documents(?:\?.*)?$/, (route) => route.fulfill({ json: docs }))

  await page.goto('/admin?tab=pfa')
  await expect(page.getByText('Andrei Ionescu', { exact: true })).toBeVisible()

  // Un client nou apare fără reîncărcarea paginii, după intervalul de 10 secunde.
  clients = [client, { ...client, id: 'pfa-new', userId: 'client-new', userName: 'Maria Pop', userEmail: 'maria@example.test', fullName: 'Maria Pop' }]
  await page.clock.fastForward(10_000)
  await expect(page.getByText('Maria Pop', { exact: true })).toBeVisible()

  // Butonul face același lucru imediat.
  clients = [...clients, { ...client, id: 'pfa-third', userId: 'client-third', userName: 'Ion Radu', userEmail: 'ion@example.test', fullName: 'Ion Radu' }]
  await page.getByRole('button', { name: 'Reîmprospătează' }).click()
  await expect(page.getByText('Ion Radu', { exact: true })).toBeVisible()

  // În dosarul deschis: un act încărcat de client apare singur în lista de documente.
  await page.goto('/admin?tab=pfa&user=client-review&section=documente')
  await expect(page.getByRole('article', { name: 'Permis de conducere.pdf' })).toBeVisible()
  docs = [...docs, { ...documents[0], id: 'arr', originalFileName: 'Atestat ARR.pdf', category: 'AtestatArr' }]
  await page.clock.fastForward(10_000)
  await expect(page.getByRole('article', { name: 'Atestat ARR.pdf' })).toBeVisible()

  docs = [...docs, { ...documents[0], id: 'cazier', originalFileName: 'Cazier.pdf', category: 'Cazier' }]
  await page.getByRole('button', { name: 'Reîmprospătează' }).click()
  await expect(page.getByRole('article', { name: 'Cazier.pdf' })).toBeVisible()
})

test('admin: la „Nu” pe TVA intracomunitar, D700 generat apare la pasul fiscal', async ({ page }, info) => {
  await mockAdmin(page)
  const approvals: unknown[] = []
  const d700 = {
    id: 'd700-1', pfaId: client.id, userId: client.userId, clientName: 'IONESCU ANDREI PFA', cui: '41000105', status: 'READY_FOR_REVIEW', period: '2026-09',
    missingData: null, rejectionReason: null, vatCode: null, vatCodeValidFrom: null, hasXml: true, hasPdf: true, hasCertificate: false,
    errors: [], warnings: [], createdAtUtc: '2026-09-15T09:00:00Z', updatedAtUtc: '2026-09-15T09:01:00Z',
  }
  await page.route('**/pfa-registrations/*/onboarding', (route) => route.fulfill({ json: { pfaRegistrationId: client.id, pfaStatus: 'Pending', sections: [], steps: [
    { key: 'eligibility', status: 'Completed', state: 'completed' },
    { key: 'pfa', status: 'Completed', state: 'completed' },
    { key: 'fiscal', status: 'AwaitingValidation', state: 'pending_admin' },
  ] } }))
  await page.route('**/admin/onboarding/*/steps/fiscal', (route) => route.fulfill({ json: {
    step2: { pfaRegistrationId: client.id, fiscal: { vatAnswer: 'No', vatRegistrationKind: 'None' }, bank: null, oblio: null, signature: null },
    bank: null,
    declaredIban: null,
  } }))
  await page.route(`**/accounting/pfas/${client.id}/vat-registration`, (route) => route.fulfill({ json: d700 }))
  await page.route('**/accounting/vat-registrations/d700-1/transitions', (route) => {
    approvals.push(route.request().postDataJSON())
    return route.fulfill({ json: { ...d700, status: 'APPROVED' } })
  })
  await page.goto('/admin?tab=pfa&user=client-review')

  const fiscal = page.locator('#step-fiscal')
  await expect(fiscal.getByText('D700 · cod TVA art. 317')).toBeVisible()
  await expect(fiscal.getByText('De verificat', { exact: true })).toBeVisible()
  await expect(fiscal.getByRole('button', { name: 'PDF' })).toBeVisible()
  await fiscal.getByText('D700 · cod TVA art. 317').scrollIntoViewIfNeeded()
  await fiscal.screenshot({ path: `test-results/admin-d700-${info.project.name}.png` })

  await fiscal.getByRole('button', { name: 'Aprobă' }).click()
  await expect(fiscal.getByText('De depus', { exact: true })).toBeVisible()
  expect(approvals).toEqual([{ to: 'APPROVED' }])
})
