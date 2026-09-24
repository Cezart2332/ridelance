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

  test('„Nu" la atestat deschide un pop-up cu motivul și rămâne pe întrebare', async ({ page }, info) => {
    await stubEligibility(
      page,
      [uploadedDoc('CarteIdentitate', 'ci.pdf'), uploadedDoc('PermisConducere', 'permis.pdf')],
      eligibilityProfile({ status: 'Pending' }),
    )
    const saved: unknown[] = []
    page.on('request', (request) => {
      if (request.method() === 'PUT' && request.url().includes('/onboarding/answers/')) {
        saved.push({ url: request.url(), body: request.postDataJSON() })
      }
    })
    await page.goto('/onboarding/eligibility?pas=attestation', { waitUntil: 'networkidle' })

    await page.getByRole('radio', { name: 'Nu' }).click()

    const dialog = page.getByRole('dialog', { name: 'Ai nevoie de atestat de transport alternativ' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Fără atestat nu poți lucra legal pe Bolt sau Uber.')
    await page.screenshot({ path: `test-results/onboarding-blocking-no-${info.project.name}.png` })
    await dialog.getByRole('button', { name: 'Am înțeles' }).click()

    // Nu merge mai departe: întrebarea rămâne, cu motivul, iar „Da" îl lasă să continue.
    await expect(page.getByRole('heading', { name: 'Ai atestat de transport alternativ?' })).toBeVisible()
    await expect(page.getByText('Cu răspunsul „Nu” nu putem merge mai departe.')).toBeVisible()
    await page.getByRole('radio', { name: 'Da' }).click()
    await expect(page.getByRole('heading', { name: 'Încarcă atestatul' })).toBeVisible()

    // Ambele răspunsuri ajung la server, cu textul de pe ecran, ca adminul să vadă tot parcursul.
    await expect.poll(() => saved.length).toBe(2)
    expect(saved[0]).toMatchObject({
      url: expect.stringContaining('/onboarding/answers/attestation'),
      body: { stepKey: 'eligibility', question: 'Ai atestat de transport alternativ?', value: 'no', valueLabel: 'Nu' },
    })
    expect(saved[1]).toMatchObject({ body: { value: 'yes', valueLabel: 'Da' } })
  })

  test('„Nu" la vârstă și la permis are și el pop-up', async ({ page }) => {
    await stubEligibility(page, [], null)
    await page.goto('/onboarding/eligibility?pas=age', { waitUntil: 'networkidle' })
    await page.getByRole('radio', { name: 'Nu' }).click()
    await expect(page.getByRole('dialog', { name: 'Trebuie să ai cel puțin 21 de ani' })).toBeVisible()
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

    // Fără „Continuă”: rezumatul complet trece singur, iar după el vine ecranul de așteptare, nu pasul fiscal.
    await expect(page.getByTestId('auto-advance')).toBeVisible()
    await expect(page.getByRole('button', { name: /Continuă/ })).toHaveCount(0)

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

  /** Înainte, butonul era activ imediat după upload — pasul „se termina" pe acte necitite de AI. */
  test('rezumatul nu lasă mai departe cât timp AI-ul verifică actele', async ({ page }) => {
    await stubBackend(
      page,
      [
        uploadedDoc('CertificatInregistrare', 'certificat.pdf'),
        { ...uploadedDoc('CertificatConstatator', 'constatator.pdf'), aiStatus: 'Processing' },
      ],
      { state: amPfaState() },
    )
    await page.goto('/onboarding/pfa?pas=pfa_summary', { waitUntil: 'networkidle' })

    // Nu numără spre pasul următor cât timp actele sunt în verificare; spune de ce așteaptă.
    await expect(page.getByText('Verificăm automat documentele încărcate', { exact: false })).toBeVisible()
    await expect(page.getByTestId('auto-advance')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Continuă/ })).toHaveCount(0)
  })

  /** Validarea adminului mută singură clientul în pasul următor — fără încă un „Continuă". */
  test('după validarea adminului, clientul ajunge singur în pasul fiscal', async ({ page }) => {
    const docs = [
      uploadedDoc('CertificatInregistrare', 'certificat.pdf'),
      uploadedDoc('CertificatConstatator', 'constatator.pdf'),
    ]
    await stubBackend(page, docs, {
      state: amPfaState({
        pfaStatus: 'Pending',
        steps: steps.map((step) =>
          step.key === 'pfa' ? { ...step, status: 'AwaitingValidation', state: 'pending_admin', userPartDone: true } : step,
        ),
      }),
    })
    await page.goto('/onboarding/pfa', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Verifică datele înainte să trimitem dosarul' })).toBeVisible()

    // Adminul validează: la următorul poll, pasul PFA e închis, iar cel fiscal e deschis.
    await page.route(`${API}/onboarding/state`, async (route) => {
      const headers = {
        'Access-Control-Allow-Origin': (await route.request().headerValue('origin')) ?? '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'authorization,content-type',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
      }
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
      return route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(
          amPfaState({
            pfaStatus: 'Approved',
            currentStep: 'fiscal',
            steps: steps.map((step) =>
              step.key === 'pfa' ? { ...step, status: 'Completed', state: 'completed', userPartDone: true } : step,
            ),
          }),
        ),
      })
    })
    // Pollul rulează la 10 secunde cât timp un pas e în verificare.
    await expect(page).toHaveURL(/\/onboarding\/step2/, { timeout: 20_000 })
  })
})

test.describe('finalul onboardingului', () => {
  /**
   * Partea șoferului e gata peste tot, iar validarea e la noi. Înainte nu exista un ecran pentru
   * asta: revenirea îl trimitea în primul pas nevalidat, deci onboardingul părea că nu se termină.
   */
  const doneState = {
    ...onboardingState,
    currentStep: null,
    allSectionsValidated: false,
    steps: steps.map((step) =>
      step.key === 'eligibility'
        ? step
        : step.key === 'arr'
          ? {
              ...step,
              status: 'InProgress',
              state: 'rejected',
              userPartDone: false,
              blockReason: null,
            }
          : { ...step, status: 'AwaitingValidation', state: 'pending_admin', userPartDone: true, blockReason: null },
    ),
  }

  test('fără nimic de completat, rădăcina duce la ecranul de final', async ({ page }, testInfo) => {
    await stubBackend(page, [], { state: { ...doneState, steps: doneState.steps.map((s) => s.key === 'arr' ? { ...s, status: 'AwaitingValidation', state: 'pending_admin', userPartDone: true } : s) } })
    await page.goto('/onboarding', { waitUntil: 'networkidle' })

    await expect(page).toHaveURL(/\/onboarding\/finalizat/)
    await expect(page.getByRole('heading', { name: 'Ai terminat onboardingul' })).toBeVisible()
    await expect(page.getByText('Un om din echipa RIDElance se uită acum')).toBeVisible()
    await expect(page.getByText('1 din 6 pași validați')).toBeVisible()
    // Captura după tranziția de intrare a pasului, nu în mijlocul ei.
    await page.waitForTimeout(800)

    const dir = `test-results/responsive/screenshots/${testInfo.project.name}`
    mkdirSync(dir, { recursive: true })
    await page.screenshot({ path: `${dir}/onboarding-finalizat.png`, fullPage: true })
  })

  test('un pas respins are drum direct înapoi în el', async ({ page }) => {
    await stubBackend(page, [], { state: doneState })
    await page.goto('/onboarding/finalizat', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: 'Corectează' }).click()
    await expect(page).toHaveURL(/\/onboarding\/arr/)
  })
})

test.describe('pas respins', () => {
  /**
   * Bugul raportat: cercul roșu cu semnul exclamării apărea fără nicio explicație. Motivul era
   * doar într-un tooltip, iar documentele respinse din admin nici nu aveau unul.
   */
  test('motivul se vede pe rândul pasului și deasupra lui', async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile'
    const rejectedCazier = {
      ...uploadedDoc('CazierJudiciar', 'cazier.pdf'),
      status: 'Rejected',
      aiSummary: null,
      reviewNote: 'Cazierul e mai vechi de 6 luni.',
    }
    const arrRejected = {
      ...onboardingState,
      currentStep: 'arr',
      steps: steps.map((step) =>
        step.key === 'arr' ? { ...step, status: 'InProgress', state: 'rejected', userPartDone: false } : step,
      ),
    }

    await page.setViewportSize(mobile ? { width: 375, height: 812 } : { width: 1440, height: 1000 })
    await stubBackend(page, [rejectedCazier], { state: arrRejected })
    await page.goto('/onboarding/arr', { waitUntil: 'networkidle' })

    // Banner deasupra pasului, pe orice dispozitiv.
    await expect(page.getByRole('alert').filter({ hasText: 'Cazierul e mai vechi de 6 luni.' })).toBeVisible()

    if (!mobile) {
      // Și pe rândul din rail, fără hover.
      await expect(
        page.getByRole('listitem').filter({ hasText: 'Autorizație transport' }).getByText(/Cazierul e mai vechi/),
      ).toBeVisible()
    }

    await page.waitForTimeout(800)
    const dir = `test-results/responsive/screenshots/${testInfo.project.name}`
    mkdirSync(dir, { recursive: true })
    await page.screenshot({ path: `${dir}/onboarding-pas-respins.png` })
  })
})

test.describe('pasul fiscal — banca conectată', () => {
  /**
   * După autorizarea la bancă, ecranul arăta din nou lista de bănci. Acum arată banca, contul
   * citit de la ea și ultimele mișcări.
   */
  test('arată banca, contul și ultimele tranzacții', async ({ page }, testInfo) => {
    const fiscalActive = {
      ...onboardingState,
      currentStep: 'fiscal',
      steps: steps.map((step) =>
        step.key === 'fiscal' ? { ...step, status: 'InProgress', state: 'in_progress' } : step,
      ),
    }
    await stubBackend(page, [], { state: fiscalActive })

    const origin = async (route: Route) => (await route.request().headerValue('origin')) ?? '*'
    const json = (body: unknown) => async (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': await origin(route), 'Access-Control-Allow-Credentials': 'true' },
        body: JSON.stringify(body),
      })

    await page.route(
      `${API}/bank/connection`,
      json({
        status: 'Linked',
        institutionId: 'BT',
        institutionName: 'Banca Transilvania',
        institutionLogo: null,
        consentExpiresAtUtc: '2026-12-10T00:00:00Z',
        linkedAtUtc: '2026-09-12T10:00:00Z',
        lastSyncedAtUtc: '2026-09-13T08:00:00Z',
        errorMessage: null,
        accounts: [{ ibanMasked: 'RO49 **** **** 1234', currency: 'RON', ownerName: 'POPESCU ION PFA' }],
        linkExpiresAtUtc: null,
      }),
    )
    await page.route(
      `${API}/bank/transactions**`,
      json({
        items: [
          { id: 't1', bookingDate: '2026-09-12', amount: 1250.5, currency: 'RON', counterpartyName: 'Bolt Operations', remittanceInfo: null, isPending: false },
          { id: 't2', bookingDate: '2026-09-11', amount: -320, currency: 'RON', counterpartyName: 'OMV Petrom', remittanceInfo: null, isPending: false },
        ],
        totalCount: 2,
        page: 1,
        pageSize: 5,
        totalIn: 1250.5,
        totalOut: -320,
      }),
    )

    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/onboarding/step2?pas=conectare_banca', { waitUntil: 'networkidle' })

    await expect(page.getByText('Banca Transilvania')).toBeVisible()
    await expect(page.getByText('RO49 **** **** 1234')).toBeVisible()
    await expect(page.getByText('Bolt Operations')).toBeVisible()
    await expect(page.getByPlaceholder(/caută/i)).toHaveCount(0)

    const dir = `test-results/responsive/screenshots/${testInfo.project.name}`
    mkdirSync(dir, { recursive: true })
    await page.screenshot({ path: `${dir}/onboarding-banca-conectata.png`, fullPage: true })
  })
})

test.describe('pasul 2 — datele de contact', () => {
  /**
   * Telefonul e cerut la crearea contului, deci ecranul „La ce număr te putem suna?” îl propune
   * deja. Dosarul PFA se creează abia la salvarea lui, așa că un „Continuă” direct, fără nicio
   * modificare, trebuie să-l trimită la server — altfel dosarul nu s-ar mai crea deloc.
   */
  test('telefonul contului e precompletat și, fără nicio modificare, ecranul creează dosarul singur', async ({ page }) => {
    const noRegistration = {
      ...onboardingState,
      pfaRegistrationId: null,
      pfaStatus: null,
      registrationType: null,
      contactPhone: '0722123456',
      steps: steps.map((step) =>
        step.key === 'pfa' ? { ...step, status: 'InProgress', state: 'in_progress', userPartDone: false } : step,
      ),
    }
    await stubBackend(page, [], { state: noRegistration })

    const created: unknown[] = []
    await page.route(`${API}/pfa-registrations`, async (route) => {
      const origin = (await route.request().headerValue('origin')) ?? '*'
      const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'authorization,content-type',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      }
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
      created.push(route.request().postDataJSON())
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: '"reg-1"' })
    })

    await page.goto('/onboarding/pfa', { waitUntil: 'networkidle' })
    await page.getByRole('radio').filter({ hasText: 'Da, am PFA' }).click()
    const contactTitle = page.getByRole('heading', { name: 'La ce număr te putem suna?' })
    // Alegerea avansează singură, după o scurtă pauză.
    await expect(contactTitle).toBeVisible()

    const phone = page.getByLabel('Telefon')
    await expect(phone).toHaveValue('0722123456')

    // Fără „Continuă”: numărul propus e valid, deci ecranul trece singur și trimite precompletarea.
    await expect(page.getByRole('button', { name: /Continuă/ })).toHaveCount(0)
    await expect.poll(() => created.length, { timeout: 15_000 }).toBe(1)
    expect(created[0]).toMatchObject({ registrationType: 'AmPfa', phone: '0722123456' })
  })
})
