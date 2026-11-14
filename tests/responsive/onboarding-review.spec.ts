import { mkdirSync } from 'node:fs'
import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'

/**
 * Ecranul de stare al unui pas predat: în verificare, aprobat, cu corecturi. Backendul e stubuit,
 * ca în `onboarding.spec.ts` — se testează ce arată ecranul pe fiecare stare, nu serverul.
 */
type StepState = 'pending_admin' | 'completed' | 'rejected'

const stepsFor = (eligibility: StepState) => [
  {
    order: 0,
    key: 'eligibility',
    label: 'Eligibilitate',
    status: eligibility === 'completed' ? 'Completed' : eligibility === 'rejected' ? 'InProgress' : 'AwaitingValidation',
    state: eligibility,
    ownedBy: 'admin',
    userPartDone: eligibility !== 'rejected',
    blockReason: null,
    path: '/onboarding/eligibility',
    checklist: null,
  },
  {
    order: 1,
    key: 'pfa',
    label: 'PFA',
    status: eligibility === 'completed' ? 'InProgress' : 'Locked',
    state: eligibility === 'completed' ? 'available' : 'locked',
    ownedBy: 'admin',
    userPartDone: false,
    blockReason: eligibility === 'completed' ? null : 'Așteaptă validarea pasului „Eligibilitate”.',
    path: '/onboarding/pfa',
    checklist: null,
  },
  {
    order: 2,
    key: 'fiscal',
    label: 'Fiscal, bancă & semnături',
    status: 'Locked',
    state: 'locked',
    ownedBy: 'admin',
    userPartDone: false,
    blockReason: 'Finalizează întâi pasul „PFA”.',
    path: '/onboarding/step2',
    checklist: null,
  },
  {
    order: 3,
    key: 'arr_fleet',
    label: 'ARR & Cont Flotă',
    status: 'Locked',
    state: 'locked',
    ownedBy: 'admin',
    userPartDone: false,
    blockReason: 'Finalizează întâi pasul „Fiscal, bancă & semnături”.',
    path: '/onboarding/arr-fleet',
    checklist: null,
  },
]

const stateFor = (eligibility: StepState) => ({
  pfaRegistrationId: null,
  pfaStatus: null,
  registrationType: null,
  pfaReviewNote: null,
  hasPaidInfiintare: false,
  sections: [],
  allSectionsValidated: false,
  steps: stepsFor(eligibility),
  currentStep: eligibility === 'completed' ? 'pfa' : 'eligibility',
  canPay: false,
  paymentStatus: 'NOT_REQUIRED',
  companyFormationStatus: null,
  companyFormationStage: null,
  testSkipEnabled: false,
})

const doc = (category: string, overrides: Record<string, unknown> = {}) => ({
  id: `doc-${category}`,
  originalFileName: `${category}.pdf`,
  contentType: 'application/pdf',
  category,
  status: 'Pending',
  fileSize: 1024,
  uploadedAtUtc: '2026-08-01T09:00:00Z',
  expiresAtUtc: null,
  aiStatus: 'Read',
  aiSummary: null,
  reviewNote: null,
  aiDetectedType: null,
  aiExtractedExpiresAtUtc: null,
  aiRequiresManualReview: false,
  origin: 'UserUpload',
  isUserFacing: true,
  ...overrides,
})

const eligibilityProfile = {
  id: 'e1',
  dateOfBirth: '1990-01-01',
  idSeriesMask: null,
  categoryBObtainedOn: '2015-01-01',
  drivingCategories: 'B',
  drivingLicenceExpiresOn: '2030-01-01',
  hasDriverCertificate: true,
  driverCertificateExpiresOn: '2030-01-01',
  status: 'Eligible',
  reasons: [],
}

async function stubBackend(page: Page, eligibility: StepState, documents: unknown[]) {
  const reply = (body: unknown) => async (route: Route) => {
    const headers = {
      'Access-Control-Allow-Origin': (await route.request().headerValue('origin')) ?? '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'authorization,content-type',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) })
  }

  await page.route(`${API}/**`, reply(null))
  await page.route(`${API}/users/refresh-token`, reply({ accessToken: 'test-token', role: 'Client', userId: 'u1' }))
  await page.route(`${API}/onboarding/state`, reply(stateFor(eligibility)))
  await page.route(`${API}/documents**`, reply(documents))
  await page.route(`${API}/onboarding/eligibility`, reply(eligibilityProfile))
}

async function shoot(page: Page, project: string, name: string) {
  const dir = `test-results/responsive/screenshots/${project}`
  mkdirSync(dir, { recursive: true })
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(2)
}

const allDocs = [doc('CarteIdentitate'), doc('PermisConducere'), doc('AtestatSofer')]

test.describe('starea unui pas predat', () => {
  test('în verificare: actele primite, fără pas următor de deschis', async ({ page }, testInfo) => {
    await stubBackend(page, 'pending_admin', allDocs)
    await page.goto('/onboarding/eligibility', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: 'Am primit documentele tale' })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'În verificare' })).toBeVisible()
    await expect(page.getByText('Primit', { exact: true })).toHaveCount(3)
    await expect(page.getByText('~30 minute')).toBeVisible()
    // Pasul 2 e încă închis: nu există buton care să ducă într-un pas blocat.
    await expect(page.getByRole('button', { name: /Continuă la pasul/ })).toHaveCount(0)

    await shoot(page, testInfo.project.name, 'onboarding-review-pending')
  })

  test('corecturi: actul respins își arată motivul și duce la reîncărcare', async ({ page }, testInfo) => {
    await stubBackend(page, 'rejected', [
      doc('CarteIdentitate', { status: 'Rejected', reviewNote: 'Fotografia e neclară. Datele trebuie să fie lizibile.' }),
      doc('PermisConducere', { status: 'Verified' }),
      doc('AtestatSofer', { status: 'Verified' }),
    ])
    await page.goto('/onboarding/eligibility', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: 'Un document trebuie reîncărcat' })).toBeVisible()
    await expect(page.getByText('Fotografia e neclară. Datele trebuie să fie lizibile.', { exact: true })).toBeVisible()
    await expect(page.getByText('Verificat', { exact: true })).toHaveCount(2)
    await shoot(page, testInfo.project.name, 'onboarding-review-correction')

    await page.getByRole('button', { name: 'Reîncarcă' }).click()
    await expect(page).toHaveURL(/pas=ci_upload/)
    await expect(page.getByRole('heading', { name: 'Încarcă cartea de identitate' })).toBeVisible()
  })

  test('aprobat: actele verificate și drumul spre pasul următor', async ({ page }, testInfo) => {
    await stubBackend(
      page,
      'completed',
      allDocs.map((d) => ({ ...d, status: 'Verified' })),
    )
    await page.goto('/onboarding/eligibility', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: 'Pasul 1 a fost aprobat' })).toBeVisible()
    await expect(page.getByText('Verificat', { exact: true })).toHaveCount(3)
    await shoot(page, testInfo.project.name, 'onboarding-review-approved')

    await page.getByRole('button', { name: 'Continuă la pasul 2' }).click()
    await expect(page).toHaveURL(/\/onboarding\/pfa/)
  })
})
