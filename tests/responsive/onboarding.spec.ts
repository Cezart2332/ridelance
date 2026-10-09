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
    key: 'arr_fleet',
    label: 'ARR & Cont Flotă',
    status: 'Locked',
    state: 'locked',
    ownedBy: 'admin',
    userPartDone: false,
    blockReason: 'Finalizează întâi pasul „Fiscal, bancă & semnături”.',
    path: '/onboarding/arr-fleet',
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
    await page.goto('/onboarding/step2', { waitUntil: 'networkidle' })

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
    await page.goto('/onboarding/step2', { waitUntil: 'networkidle' })

    // Pe telefon lista de pași stă în sheet-ul de jos, nu în rail.
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Vezi toți pașii înrolării' }).click()
    }

    // pfa e AwaitingValidation, dar fiscal rămâne accesibil; ARR & Cont Flotă e blocat.
    await expect(page.getByRole('button', { name: /Fiscal, bancă & semnături/ }).first()).toBeEnabled()
    await expect(page.getByRole('button', { name: /ARR & Cont Flotă/ }).first()).toBeDisabled()
  })

  test('documentul deja încărcat apare pe ecranul care îl cere', async ({ page }) => {
    // Documentul se vede pe ecranul care îl cere, deschis direct prin `?pas`.
    await stubBackend(page, [uploadedDoc('CazierJudiciar', 'cazier.pdf')], {
      state: {
        ...onboardingState,
        steps: steps.map((step) =>
          step.key === 'arr_fleet' ? { ...step, status: 'InProgress', state: 'available', blockReason: null } : step,
        ),
      },
    })

    await page.goto('/onboarding/arr-fleet?pas=arr_fleet_cazier', { waitUntil: 'networkidle' })
    await expect(page.getByText('cazier.pdf')).toBeVisible()
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

    // Apoi tipul cărții de identitate; „Nu" păstrează uploadul clasic, cu fotografie.
    await expect(page.getByRole('heading', { name: 'Ai carte de identitate electronică?' })).toBeVisible()
    await page.getByRole('radio', { name: 'Nu' }).click()

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

  /**
   * Un document trecut, dar suspect (aici: permisul altcuiva), nu primește bifă: „?” și motivul,
   * direct în listă și în rezumat — nu abia când deschizi ecranul documentului.
   */
  test('documentul suspect are „?” și motivul, nu bifă', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'Lista pașilor stă în rail-ul de desktop.')
    const reason = 'CNP-ul de pe „Permis de conducere” nu e cel din buletin.'
    await stubEligibility(
      page,
      [
        uploadedDoc('CarteIdentitate', 'ci.pdf'),
        { ...uploadedDoc('PermisConducere', 'permis.pdf'), aiRequiresManualReview: true, aiSuspicionReasons: [reason] },
        uploadedDoc('AtestatSofer', 'atestat.pdf'),
      ],
      eligibilityProfile(),
    )
    await page.goto('/onboarding/eligibility?pas=eligibility_summary', { waitUntil: 'networkidle' })

    await expect(page.getByText('De verificat').first()).toBeVisible()
    await expect(page.getByText(reason).first()).toBeVisible()
    await expect(page.getByText('? De verificat')).toBeVisible()
    await page.screenshot({ path: `test-results/onboarding-suspect-${info.project.name}.png` })
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

  /**
   * Cartea electronică: poza față-verso și PDF-ul din RO CEI Reader, ca serverul să le compare —
   * un PDF singur putea fi al oricui.
   */
  test('cu carte de identitate electronică se cer poza față-verso și PDF-ul din RO CEI Reader', async ({ page }, info) => {
    await stubEligibility(page)
    await page.goto('/onboarding/eligibility?pas=ci_electronic', { waitUntil: 'networkidle' })

    await page.getByRole('radio', { name: 'Da' }).click()

    await expect(page.getByRole('heading', { name: 'Fotografiază cartea de identitate' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Încarcă cartea de identitate' })).toHaveCount(0)

    // La revenire, răspunsul vine de pe server, iar ecranul PDF-ului rămâne pe traseu.
    const saved = [
      { stepKey: 'eligibility', questionId: 'ci_electronic', question: 'Ai carte de identitate electronică?', value: 'yes', valueLabel: 'Da', answeredAtUtc: '2026-10-07T10:00:00Z', previousLabels: [] },
    ]
    await page.route(`${API}/onboarding/answers`, async (route: Route) => {
      const headers = {
        'Access-Control-Allow-Origin': (await route.request().headerValue('origin')) ?? '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'authorization,content-type',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      }
      return route.request().method() === 'OPTIONS'
        ? route.fulfill({ status: 204, headers })
        : route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(saved) })
    })
    await page.goto('/onboarding/eligibility?pas=ci_electronic_pdf_upload', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Încarcă PDF-ul din aplicația RO CEI Reader' })).toBeVisible()
    await page.screenshot({ path: `test-results/onboarding-cei-${info.project.name}.png` })
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
        : step.key === 'arr_fleet'
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
    await stubBackend(page, [], { state: { ...doneState, steps: doneState.steps.map((s) => s.key === 'arr_fleet' ? { ...s, status: 'AwaitingValidation', state: 'pending_admin', userPartDone: true } : s) } })
    await page.goto('/onboarding', { waitUntil: 'networkidle' })

    await expect(page).toHaveURL(/\/onboarding\/finalizat/)
    await expect(page.getByRole('heading', { name: 'Ai terminat onboardingul' })).toBeVisible()
    await expect(page.getByText('Un om din echipa RIDElance se uită acum')).toBeVisible()
    await expect(page.getByText('1 din 4 pași validați')).toBeVisible()
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
    await expect(page).toHaveURL(/\/onboarding\/arr-fleet/)
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
      currentStep: 'arr_fleet',
      steps: steps.map((step) =>
        step.key === 'arr_fleet' ? { ...step, status: 'InProgress', state: 'rejected', userPartDone: false } : step,
      ),
    }

    await page.setViewportSize(mobile ? { width: 375, height: 812 } : { width: 1440, height: 1000 })
    await stubBackend(page, [rejectedCazier], { state: arrRejected })
    await page.goto('/onboarding/arr-fleet', { waitUntil: 'networkidle' })

    // Banner deasupra pasului, pe orice dispozitiv.
    await expect(page.getByRole('alert').filter({ hasText: 'Cazierul e mai vechi de 6 luni.' })).toBeVisible()

    if (!mobile) {
      // Și pe rândul din rail, fără hover.
      await expect(
        page.getByRole('listitem').filter({ hasText: 'ARR & Cont Flotă' }).getByText(/Cazierul e mai vechi/),
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
        accounts: [{ iban: 'RO49AAAA1B31007593841234', currency: 'RON', ownerName: 'POPESCU ION PFA' }],
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

test.describe('pasul 2 — dosarul PFA', () => {
  /**
   * Telefonul îl știm de la crearea contului, deci nu mai există ecranul „Date de contact”. Dosarul
   * se deschide singur când omul ajunge la certificat, fără telefon — serverul îl ia din cont.
   */
  test('„Da, am PFA” duce direct la certificat și deschide dosarul singur', async ({ page }) => {
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
    // Alegerea avansează singură, după o scurtă pauză.
    await expect(page.getByRole('heading', { name: 'Încarcă certificatul de înregistrare' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'La ce număr te putem suna?' })).toHaveCount(0)

    await expect.poll(() => created.length, { timeout: 15_000 }).toBe(1)
    expect(created[0]).toMatchObject({ registrationType: 'AmPfa' })
    expect(created[0]).not.toHaveProperty('phone')
  })
})

test.describe('suport în onboarding', () => {
  test('„Contactează suportul” are și chat, cu conversația din cont', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Blocul de suport stă în rail-ul de desktop.')
    await stubBackend(page)
    const cors = async (route: Route) => ({
      'Access-Control-Allow-Origin': (await route.request().headerValue('origin')) ?? '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'authorization,content-type',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    })
    const json = (body: unknown) => async (route: Route) =>
      route.request().method() === 'OPTIONS'
        ? route.fulfill({ status: 204, headers: await cors(route) })
        : route.fulfill({ status: 200, contentType: 'application/json', headers: await cors(route), body: JSON.stringify(body) })
    await page.route(`${API}/chat/support-room`, json({ roomId: 'room-1' }))
    await page.route(`${API}/chat/rooms/room-1/messages**`, json({
      messages: [{ id: 'm1', senderId: 'agent', senderName: 'Echipa RIDElance', content: 'Salut! Cu ce te ajutăm?', sentAtUtc: '2026-09-24T09:00:00Z', isRead: true }],
      totalCount: 1,
    }))

    await page.goto('/onboarding/arr', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Contactează suportul' }).click()
    await expect(page.getByRole('menuitem', { name: /Trimite un email/ })).toBeVisible()
    await page.getByRole('menuitem', { name: /Scrie-ne pe chat/ }).click()

    const dialog = page.getByRole('dialog', { name: 'Scrie-ne pe chat' })
    await expect(dialog.getByTestId('onboarding-support-chat')).toBeVisible()
    await expect(dialog.getByText('Salut! Cu ce te ajutăm?')).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: 'Mesaj pentru suport' })).toBeVisible()
  })
})

test.describe('pasul 2 — nu am PFA', () => {
  test('avansul e deja plătit: ecranul de înființare nu mai cere plata și deschide dosarul singur', async ({ page }) => {
    const noRegistration = {
      ...onboardingState,
      pfaRegistrationId: null,
      pfaStatus: null,
      registrationType: null,
      hasPaidInfiintare: true,
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
    await page.getByRole('radio').filter({ hasText: 'Nu, vreau să înființez unul' }).click()
    await page.getByText('Am citit și accept Politica de Plăți și Abonamente').click()

    await expect(page.getByRole('heading', { name: 'Îți înființăm PFA-ul' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/plata în avans/i)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Mergi la plată/ })).toHaveCount(0)
    await expect.poll(() => created.length, { timeout: 15_000 }).toBe(1)
    expect(created[0]).toMatchObject({ registrationType: 'NuAmPfa' })
  })
})

test.describe('pasul fiscal: acordul pentru împuterniciri', () => {
  /**
   * Ultimul ecran al pasului fiscal: omul e de acord cu împuternicirea ANAF și află că pachetul de
   * semnături vine pe email. Acordul trimite pasul la noi; nu mai pleacă singur la sosire.
   */
  test('„Sunt de acord” trimite pasul, apoi ecranul spune ce urmează pe email', async ({ page }, info) => {
    let submitted = false
    const step2 = () => ({
      pfaRegistrationId: onboardingState.pfaRegistrationId,
      fiscal: { vatAnswer: 'No', vatRegistrationKind: null },
      bank: null,
      oblio: { allConsentsAccepted: true },
      signature: submitted
        ? { provider: 'EasyStreamTransSped', status: 'Draft', documents: [], submittedForReviewAtUtc: '2026-10-08T10:00:00Z', rejectionReason: null }
        : null,
    })

    await stubBackend(page)
    await page.route(`${API}/onboarding/step2`, async (route) => {
      const headers = {
        'Access-Control-Allow-Origin': (await route.request().headerValue('origin')) ?? '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'authorization,content-type',
      }
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(step2()) })
    })
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/onboarding/step2/submit-for-review')) submitted = true
    })

    await page.goto('/onboarding/step2?pas=pachet_semnaturi', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: 'Acordul pentru împuterniciri' })).toBeVisible()
    await expect(page.getByText(/Ești de acord să te reprezentăm la ANAF/)).toBeVisible()
    await expect(page.getByText(/E valabilă 10 ani și o poți revoca oricând/)).toBeVisible()
    await expect(page.getByText(/Pe email primești pachetul de semnături/)).toBeVisible()
    // Nimic nu pleacă înainte de acord.
    expect(submitted).toBe(false)
    await page.screenshot({ path: `test-results/onboarding-acord-anaf-${info.project.name}.png` })

    await page.getByRole('button', { name: 'Sunt de acord' }).click()

    await expect.poll(() => submitted).toBe(true)
    await expect(page.getByText(/Îți trimitem pe email pachetul de semnături/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sunt de acord' })).toHaveCount(0)
  })
})

test.describe('pasul 4 — ARR & Cont Flotă', () => {
  const arrFleetSteps = steps.map((step) =>
    step.key === 'arr_fleet'
      ? { ...step, status: 'InProgress', state: 'in_progress', blockReason: null }
      : { ...step, status: 'Completed', state: 'completed' },
  )

  const arrFleet = (overrides: Record<string, unknown> = {}) => ({
    pfaRegistrationId: onboardingState.pfaRegistrationId,
    status: 'Draft',
    statusLabel: 'În completare',
    platforms: ['Uber'],
    driverAccounts: [{ platform: 'Uber', hasAccount: null, email: null, phone: null, fullName: null, requiresPhoneCall: false }],
    vehicleOwnership: 'Ownership',
    paymentAmountBani: 40800,
    paymentExplanation:
      'Plata este o sumă întreagă formată din: 300 lei autorizația de transport (valabilă 3 ani), 100 lei copia conformă (valabilă 1 an), 8 lei ecusoane Uber.',
    paymentDetails: { beneficiary: 'RIDElance SRL', iban: 'RO49AAAA1B31007593840000', bank: 'Banca Test' },
    paymentProofOutdated: false,
    submittedAtUtc: null,
    reopenedReason: null,
    missing: [],
    statusLog: [],
    ...overrides,
  })

  const personalDocuments = [
    uploadedDoc('AdeverintaMedicala', 'aviz-medical.pdf'),
    uploadedDoc('AvizPsihologic', 'aviz-psihologic.pdf'),
    uploadedDoc('CazierJudiciar', 'cazier.pdf'),
  ]

  /** Răspunsul serverului pentru `/onboarding/arr-fleet*`, cu cererile reținute pentru verificare. */
  async function stubArrFleet(page: Page, initial: Record<string, unknown>, documents: unknown[] = []) {
    let current = initial
    const requests: { method: string; url: string; body: unknown }[] = []
    await stubBackend(page, documents, { state: { ...onboardingState, steps: arrFleetSteps } })
    await page.route(`${API}/onboarding/arr-fleet**`, async (route) => {
      const request = route.request()
      const headers = {
        'Access-Control-Allow-Origin': (await request.headerValue('origin')) ?? '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'authorization,content-type',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      }
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
      if (request.method() !== 'GET') {
        requests.push({ method: request.method(), url: request.url(), body: request.postDataJSON() })
        if (request.url().endsWith('/submit')) {
          current = { ...current, submittedAtUtc: '2026-10-09T10:00:00Z', status: 'DocumentsSubmitted', statusLabel: 'Documente primite' }
        }
      }
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(current) })
    })
    return requests
  }

  test('plata arată suma pentru platformele alese și doar ecusoanele lor', async ({ page }, info) => {
    await stubArrFleet(page, arrFleet())
    await page.goto('/onboarding/arr-fleet?pas=arr_fleet_plata', { waitUntil: 'networkidle' })

    await expect(page.getByText('408 lei', { exact: true })).toBeVisible()
    await expect(page.getByText(/8 lei ecusoane Uber\./)).toBeVisible()
    await expect(page.getByText(/ecusoane Bolt/)).toHaveCount(0)
    await expect(page.getByText('RO49AAAA1B31007593840000')).toBeVisible()
    await page.screenshot({ path: `test-results/onboarding-arr-fleet-plata-${info.project.name}.png` })
  })

  test('cu ambele platforme suma e 416 lei, iar o dovadă pentru suma veche e semnalată', async ({ page }) => {
    await stubArrFleet(
      page,
      arrFleet({
        platforms: ['Uber', 'Bolt'],
        paymentAmountBani: 41600,
        paymentProofOutdated: true,
        paymentExplanation:
          'Plata este o sumă întreagă formată din: 300 lei autorizația de transport (valabilă 3 ani), 100 lei copia conformă (valabilă 1 an), 8 lei ecusoane Bolt, 8 lei ecusoane Uber.',
      }),
      [uploadedDoc('DovadaPlataArr', 'plata.pdf')],
    )
    await page.goto('/onboarding/arr-fleet?pas=arr_fleet_plata', { waitUntil: 'networkidle' })

    await expect(page.getByText('416 lei', { exact: true })).toBeVisible()
    await expect(page.getByText(/încarcă dovada pentru suma nouă/)).toBeVisible()
  })

  test('„Nu am cont” nu mai cere datele contului', async ({ page }) => {
    // Actele de dinainte sunt încărcate, deci primul ecran nerezolvat e contul Uber.
    const requests = await stubArrFleet(page, arrFleet(), personalDocuments)
    await page.goto('/onboarding/arr-fleet', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Ai cont de șofer pe Uber?' })).toBeVisible()

    await page.getByRole('radio', { name: 'Nu am cont pe această platformă' }).click()

    await expect.poll(() => requests.length).toBe(1)
    expect(requests[0].body).toMatchObject({ driverAccounts: [{ platform: 'Uber', hasAccount: false }] })
    await expect(page.getByRole('heading', { name: 'Datele contului de șofer Uber' })).toHaveCount(0)
  })

  test('contractul se cere doar pentru modul de deținere ales', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'Lista pasului stă în coloana din dreapta, pe desktop.')
    await stubArrFleet(
      page,
      arrFleet({
        vehicleOwnership: 'Leasing',
        driverAccounts: [{ platform: 'Uber', hasAccount: false, email: null, phone: null, fullName: null, requiresPhoneCall: true }],
      }),
      [...personalDocuments, uploadedDoc('DovadaPlataArr', 'plata.pdf')],
    )
    await page.goto('/onboarding/arr-fleet', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: 'Încarcă: Contract de leasing' })).toBeVisible()
    await expect(page.getByText('Contract de închiriere')).toHaveCount(0)
    await expect(page.getByText('Comodat autentificat la notariat')).toHaveCount(0)
  })

  test('„Trimite” e activ doar cu tot completat, apoi apare pop-up-ul final', async ({ page }, info) => {
    const incomplete = await stubArrFleet(page, arrFleet({ missing: ['Cazier judiciar'] }))
    await page.goto('/onboarding/arr-fleet?pas=arr_fleet_trimite', { waitUntil: 'networkidle' })
    await expect(page.getByText('Mai lipsește: Cazier judiciar.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Trimite', exact: true })).toBeDisabled()
    expect(incomplete).toHaveLength(0)

    await page.unrouteAll({ behavior: 'ignoreErrors' })
    const requests = await stubArrFleet(page, arrFleet())
    await page.goto('/onboarding/arr-fleet?pas=arr_fleet_trimite', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Trimite', exact: true }).click()

    await expect.poll(() => requests.some((r) => r.url.endsWith('/onboarding/arr-fleet/submit'))).toBe(true)
    const dialog = page.getByRole('dialog', { name: 'Am primit documentele' })
    await expect(dialog).toContainText('se ocupă de deschiderea contului ARR')
    await page.screenshot({ path: `test-results/onboarding-arr-fleet-trimis-${info.project.name}.png` })
    await dialog.getByRole('button', { name: 'Am înțeles' }).click()
    await expect(page.getByText('Documente primite')).toBeVisible()
  })
})
