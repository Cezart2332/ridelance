import { mkdirSync } from 'node:fs'
import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'

/**
 * Onboardingul e în spatele autentificării și a unui backend .NET. Ca testul de layout să ruleze
 * fără nimic pornit în spate, interceptăm cele patru cereri de care are nevoie shell-ul și le
 * răspundem cu fixtures. Testăm layout-ul rail-ului, nu backendul.
 */
const steps = [
  {
    order: 0,
    key: 'eligibility',
    label: 'Eligibilitate',
    status: 'Completed',
    blockReason: null,
    path: '/onboarding/eligibility',
  },
  {
    order: 1,
    key: 'pfa',
    label: 'PFA',
    status: 'AwaitingValidation',
    blockReason: null,
    path: '/onboarding/pfa',
  },
  {
    order: 2,
    key: 'fiscal',
    label: 'Fiscal, bancă & semnături',
    status: 'InProgress',
    blockReason: null,
    path: '/onboarding/step2',
  },
  {
    order: 3,
    key: 'arr',
    label: 'Autorizație transport',
    status: 'InProgress',
    blockReason: null,
    path: '/onboarding/arr',
  },
  {
    order: 4,
    key: 'platforms',
    label: 'Uber & Bolt',
    status: 'InProgress',
    blockReason: null,
    path: '/onboarding/platforms',
  },
  {
    order: 5,
    key: 'vehicle',
    label: 'Vehicul, copie conformă & ecusoane',
    status: 'Locked',
    blockReason: 'Finalizează întâi pasul „Autorizație transport”.',
    path: '/onboarding/vehicle',
  },
]

const onboardingState = {
  pfaRegistrationId: '00000000-0000-0000-0000-000000000001',
  pfaStatus: 'Pending',
  registrationType: 'AmPfa',
  pfaReviewNote: null,
  hasPaidInfiintare: true,
  sections: [
    {
      key: 'Pfa',
      status: 'AwaitingValidation',
      note: null,
      submittedAtUtc: '2026-08-01T10:00:00Z',
      validatedAtUtc: null,
    },
    {
      key: 'AutorizatieTransport',
      status: 'InProgress',
      note: null,
      submittedAtUtc: null,
      validatedAtUtc: null,
    },
    { key: 'CopieConforma', status: 'Locked', note: null, submittedAtUtc: null, validatedAtUtc: null },
    { key: 'Vehicul', status: 'Locked', note: null, submittedAtUtc: null, validatedAtUtc: null },
  ],
  allSectionsValidated: false,
  steps,
  testSkipEnabled: false,
}

/** Un document încărcat la un pas anterior, exact cum îl întoarce `GET /documents`. */
const uploadedDoc = (category: string, fileName: string) => ({
  id: `doc-${category}`,
  originalFileName: fileName,
  contentType: 'application/pdf',
  category,
  status: 'Pending',
  fileSize: 1024,
  uploadedAtUtc: '2026-08-01T09:00:00Z',
  expiresAtUtc: null,
  aiStatus: 'Passed',
  aiSummary: null,
  aiDetectedType: null,
  aiExtractedExpiresAtUtc: null,
  aiRequiresManualReview: false,
})

async function stubBackend(page: Page, documents: unknown[] = []) {
  /**
   * Cererile pleacă de pe originea Vite către `localhost:5000`, deci sunt cross-origin și
   * credențializate (`withCredentials: true`). Browserul respinge un `Allow-Origin: *` combinat cu
   * `Allow-Credentials: true`, așa că răspunsul stubuit trebuie să reflecte originea cerută. La fel,
   * preflight-ul OPTIONS trebuie servit explicit, altfel cererea reală nici nu pleacă.
   */
  const cors = (origin: string) => ({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'authorization,content-type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  })

  const reply = (body: unknown) => async (route: Route) => {
    const headers = cors((await route.request().headerValue('origin')) ?? '*')
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers,
      body: JSON.stringify(body),
    })
  }

  // Playwright rulează ultima rută înregistrată prima, deci catch-all-ul se declară primul.
  await page.route(`${API}/**`, reply(null))
  await page.route(
    `${API}/users/refresh-token`,
    reply({ accessToken: 'test-token', role: 'Client', userId: 'u1' }),
  )
  await page.route(`${API}/onboarding/state`, reply(onboardingState))
  await page.route(`${API}/documents**`, reply(documents))
  await page.route(`${API}/onboarding/eligibility`, reply(null))
}

test.describe('onboarding rail', () => {
  test('nu are scroll orizontal și afișează toți pașii', async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile'
    await page.setViewportSize(mobile ? { width: 375, height: 812 } : { width: 1440, height: 1000 })

    await stubBackend(page)
    await page.goto('/onboarding/arr', { waitUntil: 'networkidle' })

    // Rail-ul (desktop) sau sheet-ul (mobil) conțin aceeași listă semantică de pași.
    if (mobile) {
      await page.getByRole('button', { name: 'Vezi toți pașii înrolării' }).click()
    }
    const railSteps = page.locator('ol > li')
    await expect(railSteps).toHaveCount(steps.length)

    // Pasul curent e marcat pentru cititoarele de ecran.
    await expect(page.locator('[aria-current="step"]')).toHaveCount(1)

    // Stările se citesc din text, nu doar din culoare.
    await expect(page.getByText('În verificare').first()).toBeVisible()
    await expect(page.getByText('Blocat').first()).toBeVisible()
    await expect(page.getByText('Validat').first()).toBeVisible()

    // Sheet-ul se închide complet înainte de captură, altfel screenshot-ul prinde animația.
    if (mobile) {
      await page.keyboard.press('Escape')
      await expect(page.locator('.MuiDrawer-root .MuiPaper-root')).toBeHidden()
    }

    const screenshotDir = `test-results/responsive/screenshots/${testInfo.project.name}`
    mkdirSync(screenshotDir, { recursive: true })
    await page.screenshot({ path: `${screenshotDir}/onboarding-arr.png`, fullPage: true })

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(2)
  })

  test('un pas în verificare nu blochează pașii independenți', async ({ page }, testInfo) => {
    await stubBackend(page)
    await page.goto('/onboarding/arr', { waitUntil: 'networkidle' })

    // Pe telefon lista de pași stă în sheet-ul de jos, nu în rail.
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Vezi toți pașii înrolării' }).click()
    }

    // pfa e AwaitingValidation, dar fiscal/arr/platforms rămân accesibile; doar vehicle e blocat.
    for (const label of ['Fiscal, bancă & semnături', 'Autorizație transport', 'Uber & Bolt']) {
      await expect(page.getByRole('button', { name: new RegExp(label) }).first()).toBeEnabled()
    }
    await expect(page.getByRole('button', { name: /Vehicul, copie conformă/ }).first()).toBeDisabled()
  })

  test('documentele din pașii anteriori apar deja încărcate', async ({ page }) => {
    await stubBackend(page, [
      // Încărcat la pasul PFA, cerut din nou la ARR.
      uploadedDoc('CertificatInregistrare', 'certificat.pdf'),
      // Încărcat la eligibilitate; la ARR cerința se numește „AtestatTransport", categorie echivalentă.
      uploadedDoc('AtestatSofer', 'atestat.pdf'),
    ])
    await page.goto('/onboarding/arr', { waitUntil: 'networkidle' })

    await expect(page.getByText('certificat.pdf')).toBeVisible()
    await expect(page.getByText(/Același document ca la pasul .PFA./)).toBeVisible()

    // Categoria echivalentă contează: atestatul urcat la eligibilitate satisface cerința de la ARR.
    await expect(page.getByText('atestat.pdf')).toBeVisible()
    await expect(page.getByText(/Același document ca la pasul .Eligibilitate./)).toBeVisible()

    // Cerințele acoperite nu mai cer upload; cele neacoperite, da.
    await expect(page.getByRole('button', { name: 'Alege fișier' })).toHaveCount(4)
  })
})
