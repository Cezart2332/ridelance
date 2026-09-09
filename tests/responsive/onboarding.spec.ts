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
    state: 'completed',
    ownedBy: 'user',
    userPartDone: true,
    blockReason: null,
    path: '/onboarding/eligibility',
  },
  {
    order: 1,
    key: 'pfa',
    label: 'PFA',
    status: 'AwaitingValidation',
    state: 'pending_admin',
    ownedBy: 'admin',
    userPartDone: true,
    blockReason: null,
    path: '/onboarding/pfa',
  },
  {
    order: 2,
    key: 'fiscal',
    label: 'Fiscal, bancă & semnături',
    status: 'InProgress',
    state: 'in_progress',
    ownedBy: 'admin',
    userPartDone: false,
    blockReason: null,
    path: '/onboarding/step2',
  },
  {
    order: 3,
    key: 'arr',
    label: 'Autorizație transport',
    status: 'InProgress',
    state: 'available',
    ownedBy: 'admin',
    userPartDone: false,
    blockReason: null,
    path: '/onboarding/arr',
  },
  {
    order: 4,
    key: 'platforms',
    label: 'Uber & Bolt',
    status: 'InProgress',
    state: 'available',
    ownedBy: 'admin',
    userPartDone: false,
    blockReason: null,
    path: '/onboarding/platforms',
  },
  {
    order: 5,
    key: 'vehicle',
    label: 'Vehicul, copie conformă & ecusoane',
    status: 'Locked',
    state: 'locked',
    ownedBy: 'user',
    userPartDone: false,
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
  // RL-07: provider-ul filtrează pe câmpul ăsta, deci fără el niciun document nu ajunge în ecrane.
  isUserFacing: true,
})

/** Aceeași listă, dar cu pasul 1 încă în lucru — punctul de plecare al micro-pașilor. */
const eligibilityInProgress = steps.map((step) =>
  step.key === 'eligibility'
    ? { ...step, status: 'InProgress', state: 'in_progress', userPartDone: false }
    : step,
)

/** Profilul de eligibilitate, exact cum îl întoarce `GET /onboarding/eligibility`. */
const eligibilityProfile = (overrides: Record<string, unknown> = {}) => ({
  id: 'e1',
  dateOfBirth: '1990-01-01',
  idSeriesMask: null,
  categoryBObtainedOn: '2015-01-01',
  drivingCategories: 'B',
  drivingLicenceExpiresOn: '2030-01-01',
  hasDriverCertificate: false,
  driverCertificateExpiresOn: null,
  status: 'NeedsReview',
  reasons: [],
  ...overrides,
})

async function stubBackend(
  page: Page,
  documents: unknown[] = [],
  overrides: { state?: unknown; eligibility?: unknown } = {},
) {
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
  await page.route(`${API}/onboarding/state`, reply(overrides.state ?? onboardingState))
  await page.route(`${API}/documents**`, reply(documents))
  await page.route(`${API}/onboarding/eligibility`, reply(overrides.eligibility ?? null))
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

    // Pasul curent e marcat pentru cititoarele de ecran — o dată în lista de pași. Marcajul apare
    // și în panoul de progres din dreapta, deci se caută în listă, nu în toată pagina. Pe telefon
    // lista stă în sheet, sub alt landmark decât rail-ul de desktop, deci se caută pe `ol`.
    await expect(page.locator('ol [aria-current="step"]')).toHaveCount(1)

    // Stările nu se citesc doar din culoare: fiecare pas le poartă în numele lui accesibil.
    for (const label of ['În verificare', 'Blocat', 'Validat']) {
      await expect(railSteps.getByRole('button', { name: new RegExp(label) }).first()).toBeAttached()
    }

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
    // De când pasul e spart în micro-pași, documentul se vede pe ecranul care îl cere, nu într-o
    // listă a întregului pas — deci ecranul se deschide direct, prin `?pas`.
    await stubBackend(page, [
      // Încărcat la pasul PFA, cerut din nou la ARR.
      uploadedDoc('CertificatInregistrare', 'certificat.pdf'),
      // Încărcat la eligibilitate; la ARR cerința se numește „AtestatTransport", categorie echivalentă.
      uploadedDoc('AtestatSofer', 'atestat.pdf'),
    ])

    await page.goto('/onboarding/arr?pas=arr_CertificatInregistrare', { waitUntil: 'networkidle' })
    await expect(page.getByText('certificat.pdf')).toBeVisible()
    await expect(page.getByText(/de la .PFA./)).toBeVisible()

    // Categoria echivalentă contează: atestatul urcat la eligibilitate satisface cerința de la ARR.
    await page.goto('/onboarding/arr?pas=arr_AtestatTransport', { waitUntil: 'networkidle' })
    await expect(page.getByText('atestat.pdf')).toBeVisible()
    await expect(page.getByText(/de la .Eligibilitate./)).toBeVisible()
  })
})

test.describe('pasul 1 pe micro-pași', () => {
  const stubEligibility = (page: Page, documents: unknown[] = [], eligibility: unknown = null) =>
    stubBackend(page, documents, {
      state: { ...onboardingState, steps: eligibilityInProgress },
      eligibility,
    })

  test('un singur ecran pe rând, iar contorul avansează', async ({ page }) => {
    await stubEligibility(page)
    await page.goto('/onboarding/eligibility', { waitUntil: 'networkidle' })

    // Primul ecran e o întrebare — și doar întrebarea. Nicio zonă de upload alături.
    await expect(page.getByRole('heading', { name: 'Ai împlinit 21 de ani?' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Alege fișier' })).toHaveCount(0)
    await expect(page.getByText(/Pasul 1 din \d+/).first()).toBeVisible()

    // Un singur card pe ecran: un singur titlu de nivel 1.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

    await page.getByRole('radio', { name: 'Da' }).click()

    // Ecranul următor e uploadul aferent — și doar el. Fără „Continuă": alegerea avansează singură.
    await expect(page.getByRole('heading', { name: 'Încarcă cartea de identitate' })).toBeVisible()
    await expect(page.getByRole('radio')).toHaveCount(0)
    // Contorul din topbar numără pașii mari, nu ecranele: rămâne pe „Pasul 1 din 6" tot pasul 1.
    await expect(page.getByText(/Pasul 1 din \d+/).first()).toBeVisible()
  })

  test('micro-pasul curent trăiește în URL, deci refresh-ul revine pe același ecran', async ({ page }) => {
    await stubEligibility(page)
    await page.goto('/onboarding/eligibility?pas=license', { waitUntil: 'networkidle' })

    await expect(
      page.getByRole('heading', { name: 'Ai permis categoria B de minimum 2 ani?' }),
    ).toBeVisible()

    await page.reload({ waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: 'Ai permis categoria B de minimum 2 ani?' }),
    ).toBeVisible()
  })

  test('documentele deja încărcate sar peste ecranele lor', async ({ page }) => {
    // CI și permisul există deja: fluxul trebuie să aterizeze direct pe întrebarea de atestat.
    await stubEligibility(
      page,
      [uploadedDoc('CarteIdentitate', 'ci.pdf'), uploadedDoc('PermisConducere', 'permis.pdf')],
      eligibilityProfile(),
    )
    await page.goto('/onboarding/eligibility', { waitUntil: 'networkidle' })

    await expect(
      page.getByRole('heading', { name: 'Ai atestat de transport alternativ?' }),
    ).toBeVisible()
  })

  test('„Nu" la atestat duce la ecranul de blocaj, cu motivul de la server', async ({ page }) => {
    const reason = 'Atestatul de transport alternativ este obligatoriu.'
    await stubEligibility(
      page,
      [uploadedDoc('CarteIdentitate', 'ci.pdf'), uploadedDoc('PermisConducere', 'permis.pdf')],
      eligibilityProfile({ status: 'Ineligible', reasons: [reason] }),
    )
    await page.goto('/onboarding/eligibility?pas=attestation', { waitUntil: 'networkidle' })

    await page.getByRole('radio', { name: 'Nu' }).click()

    await expect(
      page.getByRole('heading', { name: /nu îndeplinești condițiile de eligibilitate/i }),
    ).toBeVisible()
    // Motivul apare și în rail (pasul e „Respins"), deci îl căutăm în lista cardului.
    await expect(page.getByRole('list', { name: 'Condiții neîndeplinite' })).toContainText(reason)

    // Nu e o fundătură: rail-ul rămâne întreg și se poate reveni.
    await expect(page.getByRole('button', { name: 'Înapoi la pasul anterior' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Suport' }).first()).toBeVisible()
  })
})

test.describe('pasul 2 — am deja PFA', () => {
  /**
   * Regresia raportată: după certificatul de înregistrare, fluxul sărea direct la pasul 3, deși
   * certificatul constatator și rezumatul erau acolo, în listă.
   *
   * Cauza era pe server — pasul trecea în „așteaptă validarea" de îndată ce dosarul se deschidea,
   * iar de acolo pagina punea cardul de așteptare în locul runnerului. Testul păzește partea de
   * frontend a contractului: cu pasul încă al șoferului, ecranele lui rămân parcurgibile.
   */
  const amPfaState = (overrides: Record<string, unknown> = {}) => ({
    ...onboardingState,
    pfaStatus: 'InProgress',
    steps: steps.map((step) =>
      step.key === 'pfa'
        ? { ...step, status: 'InProgress', state: 'in_progress', userPartDone: false }
        : step,
    ),
    ...overrides,
  })

  test('certificatul de înregistrare nu închide pasul: urmează constatatorul', async ({ page }) => {
    await stubBackend(page, [uploadedDoc('CertificatInregistrare', 'certificat.pdf')], {
      state: amPfaState(),
    })
    await page.goto('/onboarding/pfa', { waitUntil: 'networkidle' })

    // Primul ecran nerezolvat e chiar constatatorul — nu pasul următor.
    await expect(
      page.getByRole('heading', { name: 'Încarcă certificatul constatator' }),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/onboarding\/pfa/)
  })

  /**
   * A doua jumătate a aceleiași regresii: `pfaStatus` e statusul DOSARULUI, iar el e `Pending`
   * din secunda în care dosarul se deschide — adică imediat după numărul de telefon. Cât timp
   * pagina punea cardul „în validare" pe semnalul ăsta, certificatele și rezumatul rămâneau în
   * rail fără să se mai poată ajunge la ele.
   */
  test('dosarul deschis nu aduce ecranul de așteptare peste certificate', async ({ page }) => {
    await stubBackend(page, [uploadedDoc('CertificatInregistrare', 'certificat.pdf')], {
      state: amPfaState({ pfaStatus: 'Pending' }),
    })
    await page.goto('/onboarding/pfa', { waitUntil: 'networkidle' })

    await expect(
      page.getByRole('heading', { name: 'Încarcă certificatul constatator' }),
    ).toBeVisible()
    await expect(page.getByText('Dosarul tău PFA este în validare')).toBeHidden()
  })

  /** Iar când chiar e predat, ecranul de așteptare vine după rezumat — nu în locul lui. */
  test('predat spre validare: rezumatul întâi, apoi ecranul de așteptare', async ({ page }) => {
    await stubBackend(
      page,
      [
        uploadedDoc('CertificatInregistrare', 'certificat.pdf'),
        uploadedDoc('CertificatConstatator', 'constatator.pdf'),
      ],
      {
        state: amPfaState({
          pfaStatus: 'Pending',
          steps: steps.map((step) =>
            step.key === 'pfa'
              ? { ...step, status: 'AwaitingValidation', state: 'pending_admin', userPartDone: true }
              : step,
          ),
        }),
      },
    )
    await page.goto('/onboarding/pfa', { waitUntil: 'networkidle' })

    await expect(
      page.getByRole('heading', { name: 'Verifică datele înainte să trimitem dosarul' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Continuă către pasul următor' }).click()

    await expect(page.getByText('Dosarul tău PFA este în validare')).toBeVisible()
  })

  test('cu ambele certificate, rezumatul rămâne accesibil', async ({ page }) => {
    await stubBackend(
      page,
      [
        uploadedDoc('CertificatInregistrare', 'certificat.pdf'),
        uploadedDoc('CertificatConstatator', 'constatator.pdf'),
      ],
      { state: amPfaState() },
    )
    await page.goto('/onboarding/pfa', { waitUntil: 'networkidle' })

    await expect(
      page.getByRole('heading', { name: 'Verifică datele înainte să trimitem dosarul' }),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/onboarding\/pfa/)
  })
})
