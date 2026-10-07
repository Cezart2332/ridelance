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

/** Răspunsul motorului: CASS de clarificat, deci rezervă parțială. */
function estimates() {
  return {
    taxYear: YEAR,
    locked: false,
    profileStatus: 'COMPLETED',
    asOf: `${YEAR}-09-22`,
    status: 'PARTIAL',
    stale: false,
    reserve: {
      status: 'PARTIAL',
      total: 1_800,
      weekly: 120,
      annualEstimated: 1_800,
      missing: ['CASS'],
      reasonCode: null,
      existingReserve: null,
      existingReserveAssumedZero: true,
      recordedTaxPayments: 0,
    },
    components: [
      { component: 'CAS', status: 'ESTIMATED', amount: 0, reasonCode: null, missingInputs: [], breakdown: null },
      { component: 'CASS', status: 'REQUIRES_CLARIFICATION', amount: null, reasonCode: 'CASS_EXCEPTION_UNKNOWN', missingInputs: ['otherIncomeCassBase'], breakdown: null },
      { component: 'INCOME_TAX', status: 'ESTIMATED', amount: 1_800, reasonCode: null, missingInputs: [], breakdown: null },
      { component: 'PLATFORM_TAXES', status: 'NOT_CONFIGURED', amount: null, reasonCode: null, missingInputs: [], breakdown: null },
    ],
    warnings: ['CAS_THRESHOLD_NEAR'],
    projection: { netRealized: 14_200, netAnnualEstimated: 20_000, weeklyAverage: 500, weeksUsed: 8, weeksRemaining: 14 },
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

  await page.route(`${API}/pfa/me/estimated-taxes/**`, async (route) => {
    if (state.profile.status !== 'COMPLETED') return json(route, { taxYear: YEAR, locked: true, profileStatus: state.profile.status })
    return json(route, estimates())
  })

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

test('fără profil: modal automat o singură dată, invitație în loc de estimări', async ({ page }) => {
  const state = await mockApi(page)
  await page.goto(ROOT)

  const dialog = page.getByRole('dialog', { name: `Situația ta fiscală ${YEAR}` })
  // Prima vizită compilează dashboardul în Vite: la rece durează.
  await expect(dialog).toBeVisible({ timeout: 45_000 })
  for (const label of ['Pensionar', 'Student (sub 26 de ani)', 'Angajat cu normă întreagă', 'Niciuna']) {
    await expect(dialog.getByRole('checkbox', { name: label })).toBeVisible()
  }
  // Fără nicio bifă nu se poate confirma.
  await expect(dialog.getByRole('button', { name: 'Confirmă' })).toBeDisabled()

  // Esc închide; dashboardul merge normal, fără nicio sumă de taxe.
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  expect(state.calls.some((c) => c.startsWith('POST /prompt-shown'))).toBe(true)

  await expect(page.getByTestId('fiscal-profile-invite')).toBeVisible()
  await expect(page.getByText('Activează estimările de taxe')).toBeVisible()
  await expect(page.getByText('Cât trebuie să pui deoparte')).toHaveCount(0)

  // Refresh: modalul nu se mai deschide.
  await page.reload()
  await expect(page.getByTestId('fiscal-profile-invite')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('situația: bife combinabile, „Niciuna” le golește, confirmarea deblochează estimările', async ({ page }, info) => {
  const state = await mockApi(page, { firstPromptShownAtUtc: `${YEAR}-03-16T08:00:00Z` })
  await page.goto(ROOT)

  await page.getByTestId('fiscal-profile-invite').getByRole('button', { name: 'Alege situația' }).click()
  const dialog = page.getByRole('dialog', { name: `Situația ta fiscală ${YEAR}` })

  const pensioner = dialog.getByRole('checkbox', { name: 'Pensionar' })
  const employed = dialog.getByRole('checkbox', { name: 'Angajat cu normă întreagă' })
  const none = dialog.getByRole('checkbox', { name: 'Niciuna' })

  // Pensionar și angajat se pot bifa împreună.
  await pensioner.check()
  await employed.check()
  await expect(pensioner).toBeChecked()
  // „Niciuna” le scoate pe celelalte; o bifă nouă scoate „Niciuna”.
  await none.check()
  await expect(pensioner).not.toBeChecked()
  await expect(employed).not.toBeChecked()
  await pensioner.check()
  await expect(none).not.toBeChecked()

  await page.screenshot({ path: `test-results/fiscal-profile-situation-${info.project.name}.png` })
  await dialog.getByRole('button', { name: 'Confirmă' }).click()

  await expect(page.getByText('Profil fiscal completat. Estimările de taxe sunt acum disponibile.')).toBeVisible()
  const card = page.getByTestId('estimated-taxes-card')
  await expect(card.getByText('Cât să pui deoparte')).toBeVisible()
  await expect(page.getByTestId('fiscal-profile-invite')).toHaveCount(0)

  // O singură cerere, de confirmare, cu revizia în If-Match și toate trei răspunsurile.
  expect(state.calls).toContain('POST /complete if-match="0"')
  expect(state.profile.answers).toEqual({ pensioner: 'yes', student: 'no', employedFullTime: 'no' })
})

test('formularul nu are scroll orizontal la 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await mockApi(page)
  await page.goto(ROOT)
  const dialog = page.getByRole('dialog', { name: `Situația ta fiscală ${YEAR}` })
  await expect(dialog).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  const inner = await dialog.locator('.MuiDialogContent-root').evaluate((el) => el.scrollWidth - el.clientWidth)
  expect(inner).toBeLessThanOrEqual(0)
})

test('cardul „Cât să pui deoparte”: parțial, componente, fără TVA în total', async ({ page }, info) => {
  await mockApi(page, { status: 'COMPLETED', firstPromptShownAtUtc: `${YEAR}-03-16T08:00:00Z` })
  await page.goto(ROOT)

  const card = page.getByTestId('estimated-taxes-card')
  await expect(card.getByText('Pune deoparte săptămâna aceasta')).toBeVisible()
  await expect(card.getByTestId('weekly-amount')).toHaveText('120 lei')
  await expect(card.getByText('Total de pus deoparte:')).toContainText('1.800 lei')
  await expect(card.getByText('Parțial', { exact: true })).toBeVisible()
  await expect(card.getByText(/Lipsește: CASS/)).toBeVisible()

  // CASS fără sumă, niciodată 0; TVA doar „În curs de configurare”.
  // Ce completează contabilul nu trimite PFA-ul la profil: rândul spune doar „De clarificat”.
  await expect(card.locator('[data-component="CASS"]')).toContainText('De clarificat')
  await expect(card.locator('[data-component="CASS"]')).toContainText('Contabilul verifică dacă plătești deja CASS')
  await expect(card.locator('[data-component="CASS"]')).not.toContainText('0 lei')
  await expect(card.locator('[data-component="PLATFORM_TAXES"]')).toContainText('Separat, în declarațiile lunare')
  await expect(card.locator('[data-component="PLATFORM_TAXES"]')).toContainText('Nu există un comutator')
  await expect(card.getByText('Venitul tău se apropie de un plafon CAS. Suma de pus deoparte poate crește.')).toBeVisible()
  // Fără „Cum calculăm?” și fără „Am deja pus deoparte”: cardul arată doar sumele.
  await expect(card.getByRole('button', { name: 'Cum calculăm?' })).toHaveCount(0)
  await expect(card.getByText('Presupunem că nu ai pus încă bani deoparte.')).toHaveCount(0)
  await expect(card.getByRole('button', { name: 'Modifică' })).toHaveCount(0)
  await page.screenshot({ path: `test-results/estimated-taxes-card-${info.project.name}.png` })
})
