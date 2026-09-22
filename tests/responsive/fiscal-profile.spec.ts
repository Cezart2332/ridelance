import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'
const ROOT = '/app/dashboard'
const YEAR = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Europe/Bucharest' }).format(new Date()))

/**
 * Profilul fiscal PFA (SPEC_PROFIL_FISCAL_PFA): fără profil completat nu apare nicio estimare de
 * taxe, modalul se deschide automat o singură dată, iar confirmarea deblochează estimările.
 * Backendul e simulat cu stare, ca fluxul să treacă prin aceleași apeluri ca în realitate.
 */

type Profile = Record<string, unknown> & { status: string; revision: number; answers: Record<string, unknown> }

function newProfile(): Profile {
  return {
    id: 'profile-1',
    pfaRegistrationId: 'pfa-1',
    taxYear: YEAR,
    regime: 'REAL',
    status: 'NOT_STARTED',
    answers: {},
    revision: 0,
    firstPromptShownAtUtc: null,
    completedAtUtc: null,
    estimatedTaxesUnlockedAtUtc: null,
    updatedAtUtc: `${YEAR}-03-01T10:00:00Z`,
    lastChangedBy: null,
    facts: {
      pfaName: 'POPESCU ION PFA',
      cui: '12345678',
      pfaRegisteredOn: { value: '2019-05-02', source: 'ANAF', observedAtUtc: null },
      activityStartedOn: { value: null, source: 'onboarding', observedAtUtc: null },
      accessGrantedAt: { value: `${YEAR}-03-15T08:00:00Z`, source: 'RIDElance', observedAtUtc: null },
      regime: 'REAL',
    },
    conditions: { askPriorDocs: true, priorFrom: `${YEAR}-01-01`, priorTo: `${YEAR}-03-14`, askCarriedLosses: true },
    corrections: [],
  }
}

function summary(locked: boolean) {
  const metric = (value: number) => ({ value, previous: null })
  return {
    period: { from: `${YEAR}-03-01`, to: `${YEAR}-03-31`, granularity: 'day' },
    kpis: {
      netEarnings: metric(10_000),
      platformFees: { value: 1_200, previous: null, byPlatform: { bolt: 700, uber: 500 } },
      onlineHours: metric(120),
      rideKm: metric(1_400),
      netPerHour: metric(83.33),
      netPerKm: metric(7.14),
    },
    taxReserve: locked
      ? null
      : {
          scope: 'period',
          total: 2_000,
          components: [{ key: 'incomeTax', label: 'Impozit pe venit estimat', amount: 2_000, rate: null, basis: 0, note: null }],
          fiscalMonth: { month: `${YEAR}-03`, total: 2_000 },
        },
    realProfit: locked
      ? null
      : { netEarnings: 10_000, deductibleExpenses: 0, estimatedTaxes: 2_000, value: 8_000, retentionRatio: 0.8, expensesAwaitingReview: 0 },
    platformSplit: [{ platform: 'bolt', net: 10_000, fees: 1_200, cash: 2_000, card: 8_000, rides: 300 }],
    series: {
      netEarnings: [{ bucket: `${YEAR}-03-01`, label: '1', bolt: 10_000, uber: 0, total: 10_000, rides: 300 }],
      feesAndTaxes: [
        { bucket: `${YEAR}-03-01`, label: '1', boltFee: 1_200, uberFee: 0, vatIntracom: locked ? null : 252, boltNonResident: locked ? null : 14 },
      ],
      realProfit: locked ? [] : [{ bucket: `${YEAR}-03-01`, label: '1', netEarnings: 10_000, deductibleExpenses: 0, estimatedTaxes: 2_000, value: 8_000 }],
    },
    sources: {
      bolt: { configured: true, connected: true, lastSyncAt: null, errorMessage: null, onboardingPending: false },
      uber: { connected: true, lastReportAt: null, detectedRange: null, onboardingPending: false },
    },
    uberIsMonthlyAggregate: false,
    taxProfile: { taxYear: YEAR, status: locked ? 'NOT_STARTED' : 'COMPLETED', estimatesLocked: locked },
  }
}

async function mockApi(page: Page, initial: Partial<Profile> = {}) {
  const state = { profile: { ...newProfile(), ...initial } as Profile, calls: [] as string[] }
  const json = (route: Route, body: unknown) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

  await page.route(`${API}/**`, (route) => json(route, []))
  await page.route(`${API}/users/refresh-token`, (route) => json(route, { accessToken: 't', role: 'Client', userId: 'user-1' }))
  await page.route(`${API}/users/dashboard-summary`, (route) => json(route, { pfaStatus: 'Approved', pfaRegistrationId: 'pfa-1' }))
  await page.route(`${API}/payments/subscription`, (route) =>
    json(route, { pfaStatus: 'Approved', onboardingSectionsValidated: true, status: 'Active', dashboardAccessGranted: true, plan: 'pro' }),
  )
  await page.route(`${API}/pfa/dashboard/summary*`, (route) => json(route, summary(state.profile.status !== 'COMPLETED')))
  await page.route(`${API}/pfa/dashboard/rides*`, (route) =>
    json(route, { items: [], page: 1, pageSize: 20, total: 0, uberRidesAvailable: false }),
  )

  await page.route(`${API}/pfa/me/fiscal-profiles/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const p = state.profile
    if (request.method() === 'GET' && url.pathname.endsWith('/revisions')) return json(route, [])
    if (request.method() === 'GET') return json(route, p)

    state.calls.push(`${request.method()} ${url.pathname.split(`/${YEAR}`)[1] || '/'} if-match=${request.headers()['if-match'] ?? ''}`)
    if (url.pathname.endsWith('/prompt-shown')) {
      p.firstPromptShownAtUtc = new Date().toISOString()
      return json(route, p)
    }
    const body = request.postDataJSON() as { answers: Record<string, unknown> }
    p.answers = body.answers
    p.revision += 1
    if (url.pathname.endsWith('/complete')) {
      p.status = 'COMPLETED'
      p.completedAtUtc = new Date().toISOString()
    } else if (url.pathname.endsWith('/draft')) {
      p.status = 'DRAFT'
    }
    return json(route, p)
  })

  return state
}

async function choose(page: Page, question: string, option: string) {
  const card = page.locator('section', { has: page.getByRole('heading', { name: question }) })
  await card.getByRole('radio', { name: option, exact: true }).check()
}

test('fără profil: modal automat o singură dată, invitație în loc de estimări', async ({ page }) => {
  const state = await mockApi(page)
  await page.goto(ROOT)

  const dialog = page.getByRole('dialog', { name: `Profil fiscal ${YEAR}` })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Am preluat aceste date din contul tău.')).toBeVisible()
  await expect(dialog.getByText('POPESCU ION PFA')).toBeVisible()
  // Intervalul neacoperit apare în titlul întrebării.
  await expect(dialog.getByRole('heading', { name: `Ai documentele contabile pentru perioada 01.01.${YEAR} – 14.03.${YEAR}?` })).toBeVisible()
  await expect(dialog.getByText(/nu știu/i)).toHaveCount(0)
  await expect(dialog.getByText(/normă de venit/i)).toHaveCount(0)

  // „Continuă” fără răspuns: eroare inline, nu trece mai departe.
  await dialog.getByRole('button', { name: 'Continuă' }).click()
  await expect(dialog.getByText('Alege un răspuns.').first()).toBeVisible()

  // Esc închide; dashboardul merge normal, fără nicio sumă de taxe.
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  expect(state.calls.some((c) => c.startsWith('POST /prompt-shown'))).toBe(true)

  await expect(page.getByTestId('fiscal-profile-invite')).toBeVisible()
  await expect(page.getByText('Activează estimările de taxe')).toBeVisible()
  await expect(page.getByText('Cât trebuie să pui deoparte')).toHaveCount(0)
  await expect(page.getByText('Profilul tău fiscal nu este completat.')).toBeVisible()

  // Refresh: modalul nu se mai deschide.
  await page.reload()
  await expect(page.getByTestId('fiscal-profile-invite')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('completarea: condiționale, ciornă pe fiecare pas, confirmare care deblochează estimările', async ({ page }, info) => {
  const state = await mockApi(page, { firstPromptShownAtUtc: `${YEAR}-03-16T08:00:00Z` })
  await page.goto(ROOT)

  await page.getByTestId('fiscal-profile-invite').getByRole('button', { name: 'Completează profilul' }).click()
  const dialog = page.getByRole('dialog', { name: `Profil fiscal ${YEAR}` })

  // Pasul 1
  await choose(page, 'Datele de mai sus sunt corecte?', 'Da')
  await choose(page, `Ai documentele contabile pentru perioada 01.01.${YEAR} – 14.03.${YEAR}?`, 'Nu le am')
  await expect(dialog.getByRole('heading', { name: 'Unde se află documentele?' })).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Continuă' }).click()

  // Pasul 2: data angajării apare doar cu contract, și dispare la loc.
  await choose(page, 'Ai și un contract de muncă?', 'Da, normă întreagă')
  await expect(dialog.getByRole('heading', { name: 'De când ești angajat?' })).toBeVisible()
  await choose(page, 'Ai și un contract de muncă?', 'Nu')
  await expect(dialog.getByRole('heading', { name: 'De când ești angajat?' })).toHaveCount(0)
  for (const q of ['Ești pensionar?', 'Ești elev sau student?', 'Ești asigurat într-un sistem propriu de pensii?']) {
    await choose(page, q, 'Nu')
  }
  await choose(page, 'Ai o situație specială pe care vrei s-o discuți cu contabilul?', 'Nu')
  await dialog.getByRole('button', { name: 'Continuă' }).click()

  // Pasul 3
  for (const q of [
    'Mai ai și alte activități independente, în afara celor din RIDElance?',
    'Ai venituri din chirii, dividende, investiții sau alte surse?',
    `Ai făcut deja plăți de taxe pentru ${YEAR}?`,
    'Ai pierderi fiscale reportate din anii anteriori?',
    `Ai optat pentru plata CASS în ${YEAR}?`,
    `În ${YEAR} ai avut rezidență fiscală sau asigurare socială în alt stat?`,
  ]) {
    await choose(page, q, 'Nu')
  }
  await dialog.getByRole('button', { name: 'Continuă' }).click()

  // Pasul 4: rezumat, confirmare obligatorie.
  await expect(dialog.getByRole('heading', { name: 'Situația ta' })).toBeVisible()
  const submit = dialog.getByRole('button', { name: 'Confirmă și activează' })
  await expect(submit).toBeDisabled()
  await page.screenshot({ path: `test-results/fiscal-profile-confirm-${info.project.name}.png` })
  await dialog.getByRole('checkbox').check()
  await submit.click()

  await expect(page.getByText('Profil fiscal completat. Estimările de taxe sunt acum disponibile.')).toBeVisible()
  await expect(page.getByText('Cât trebuie să pui deoparte')).toBeVisible()
  await expect(page.getByTestId('fiscal-profile-invite')).toHaveCount(0)

  // Ciorna s-a salvat la fiecare „Continuă”, cu revizia în If-Match; ascunsele nu au plecat.
  expect(state.calls.filter((c) => c.startsWith('PATCH /draft'))).toHaveLength(3)
  expect(state.calls.at(-1)).toBe('POST /complete if-match="3"')
  expect(state.profile.answers.employmentStart ?? null).toBeNull()
  expect(state.profile.answers.priorDocsLocation ?? null).toBeNull()
})

test('formularul nu are scroll orizontal la 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await mockApi(page)
  await page.goto(ROOT)
  const dialog = page.getByRole('dialog', { name: `Profil fiscal ${YEAR}` })
  await expect(dialog).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  const inner = await dialog.locator('.MuiDialogContent-root').evaluate((el) => el.scrollWidth - el.clientWidth)
  expect(inner).toBeLessThanOrEqual(0)
})
