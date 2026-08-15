import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'
const ROOT = '/app/dashboard'
const FINANCIAL = `${ROOT}/contabilitate/situatie-financiara`

/**
 * Criteriul de acceptanță din spec §7.1: pentru același interval, fiecare valoare comună e
 * identică pe Acasă și în Situație financiară.
 *
 * Cifrele din fixture sunt alese ca să se vadă imediat dacă cineva reintroduce o formulă în
 * frontend: sunt rotunde și distincte între ele, iar „bani disponibili după taxe" (8.000) nu
 * coincide cu nicio altă valoare din DTO, deci nu poate fi nimerit din greșeală.
 */
const NET_EARNINGS = 10_000
const DEDUCTIBLE_EXPENSES = 1_500
const ESTIMATED_TAXES = 2_000
const REAL_PROFIT = 6_500
/** Nu vine din DTO: `încasări nete − taxe estimate`, singura derivare a paginii. */
const AVAILABLE_AFTER_TAXES = 8_000

const lei = (value: number) => `${value.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`

function summaryFixture() {
  const metric = (value: number) => ({ value, previous: null })
  const bucket = (label: string, net: number) => ({
    bucket: `2026-08-${label.padStart(2, '0')}`,
    label,
    netEarnings: net,
    deductibleExpenses: DEDUCTIBLE_EXPENSES / 2,
    estimatedTaxes: ESTIMATED_TAXES / 2,
    value: REAL_PROFIT / 2,
  })

  return {
    period: { from: '2026-08-01', to: '2026-08-31', granularity: 'day' },
    kpis: {
      netEarnings: metric(NET_EARNINGS),
      platformFees: { value: 1_200, previous: null, byPlatform: { bolt: 700, uber: 500 } },
      onlineHours: metric(120),
      rideKm: metric(1_400),
      netPerHour: metric(83.33),
      netPerKm: metric(7.14),
    },
    taxReserve: {
      scope: 'period',
      total: ESTIMATED_TAXES,
      components: [
        { key: 'vatIntracom', label: 'TVA intracomunitar estimat', amount: 252, rate: 0.21, basis: 1_200, note: null },
        { key: 'boltNonResident', label: 'Taxă nerezident Bolt', amount: 14, rate: 0.02, basis: 700, note: null },
        { key: 'incomeTax', label: 'Impozit pe venit estimat', amount: 1_000, rate: null, basis: 0, note: null },
        { key: 'casCass', label: 'CAS/CASS estimat', amount: 734, rate: null, basis: 0, note: null },
      ],
      fiscalMonth: { month: '2026-08', total: ESTIMATED_TAXES },
    },
    realProfit: {
      netEarnings: NET_EARNINGS,
      deductibleExpenses: DEDUCTIBLE_EXPENSES,
      estimatedTaxes: ESTIMATED_TAXES,
      value: REAL_PROFIT,
      retentionRatio: 0.65,
    },
    platformSplit: [
      { platform: 'bolt', net: 6_000, fees: 700, cash: 2_000, card: 4_000, rides: 180 },
      { platform: 'uber', net: 4_000, fees: 500, cash: 1_000, card: 3_000, rides: 120 },
    ],
    series: {
      netEarnings: [
        { bucket: '2026-08-01', label: '1', bolt: 3_000, uber: 2_000, total: 5_000, rides: 150 },
        { bucket: '2026-08-02', label: '2', bolt: 3_000, uber: 2_000, total: 5_000, rides: 150 },
      ],
      feesAndTaxes: [
        { bucket: '2026-08-01', label: '1', boltFee: 350, uberFee: 250, vatIntracom: 126, boltNonResident: 7 },
        { bucket: '2026-08-02', label: '2', boltFee: 350, uberFee: 250, vatIntracom: 126, boltNonResident: 7 },
      ],
      realProfit: [bucket('1', 5_000), bucket('2', 5_000)],
    },
    sources: {
      bolt: { configured: true, connected: true, lastSyncAt: '2026-08-15T06:00:00Z', errorMessage: null },
      uber: { connected: true, lastReportAt: '2026-08-01', detectedRange: 'august 2026' },
    },
    uberIsMonthlyAggregate: true,
  }
}

/** Reține fiecare interogare de sumar, ca să putem compara ce cer cele două pagini. */
async function mockApi(page: Page, summaryQueries: string[]) {
  await page.route(`${API}/**`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  await page.route(`${API}/users/refresh-token`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'test-token', role: 'Client', userId: 'user-1' }),
    }),
  )

  await page.route(`${API}/users/dashboard-summary`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ pfaStatus: 'Approved', pfaRegistrationId: 'pfa-1' }),
    }),
  )

  await page.route(`${API}/payments/subscription`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        pfaStatus: 'Approved',
        onboardingSectionsValidated: true,
        status: 'Active',
        dashboardAccessGranted: true,
        plan: 'pro',
      }),
    }),
  )

  await page.route(`${API}/pfa/dashboard/summary*`, (route: Route) => {
    summaryQueries.push(new URL(route.request().url()).search)
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summaryFixture()),
    })
  })

  await page.route(`${API}/pfa/dashboard/rides*`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], page: 1, pageSize: 20, total: 0, uberRidesAvailable: false }),
    }),
  )
}

test.describe('situație financiară', () => {
  // Suita pornește un server de dezvoltare partajat între patru browsere; sub încărcare,
  // 30s implicit nu ajung pentru montarea unei pagini. Eșecurile de acolo nu spun nimic
  // despre cod, doar despre mașina pe care rulează.
  test.describe.configure({ timeout: 90_000 })

  test('afișează exact cifrele din DTO, fără să recalculeze', async ({ page }) => {
    const queries: string[] = []
    await mockApi(page, queries)

    await page.goto(FINANCIAL, { waitUntil: 'networkidle' })
    const main = page.getByRole('main')

    // Cele patru valori citite direct din DTO.
    for (const value of [NET_EARNINGS, REAL_PROFIT, DEDUCTIBLE_EXPENSES, ESTIMATED_TAXES]) {
      await expect(main.getByText(lei(value), { exact: true }).first()).toBeVisible()
    }

    // Singura valoare derivată de pagină: încasări nete − taxe estimate.
    await expect(main.getByText(lei(AVAILABLE_AFTER_TAXES), { exact: true }).first()).toBeVisible()
  })

  test('Acasă își păstrează toate cifrele de activitate', async ({ page }) => {
    // Definition of Done: pagina Acasă rămâne neschimbată funcțional. Orele, kilometrii,
    // net/oră, net/km și istoricul curselor sunt despre activitate — ele trăiesc aici, iar
    // pagina financiară nu le preia. Testul apără ambele jumătăți ale afirmației.
    const queries: string[] = []
    await mockApi(page, queries)

    await page.goto(ROOT, { waitUntil: 'networkidle' })
    const main = page.getByRole('main')

    for (const label of [
      'Încasări nete',
      'Comision platforme',
      'Ore online',
      'Km în cursă',
      'Net / oră',
      'Net / km',
    ]) {
      await expect(main.getByText(label, { exact: true }).first()).toBeVisible()
    }
    await expect(main.getByText('Istoric curse', { exact: false }).first()).toBeVisible()

    // Pe pagina financiară, aceleași măsuri de activitate lipsesc — intenționat.
    await page.goto(FINANCIAL, { waitUntil: 'networkidle' })
    for (const label of ['Ore online', 'Km în cursă', 'Net / oră', 'Net / km']) {
      await expect(main.getByText(label, { exact: true })).toHaveCount(0)
    }
  })

  test('cere aceleași date ca Acasă pentru același interval', async ({ page }) => {
    const queries: string[] = []
    await mockApi(page, queries)

    // `networkidle` se poate declanșa înainte ca React să apuce să ceară sumarul, așa că
    // așteptăm explicit cererea, nu liniștea rețelei.
    await page.goto(`${ROOT}?period=prevMonth&platform=bolt`)
    await expect.poll(() => queries.length).toBeGreaterThan(0)
    const homeQueries = [...queries]

    queries.length = 0
    await page.goto(`${FINANCIAL}?period=prevMonth&platform=bolt`)
    await expect.poll(() => queries.length).toBeGreaterThan(0)
    const financialQueries = [...queries]

    // Ambele pagini trebuie să întrebe serverul, cu exact aceiași parametri. Dacă una începe
    // să ceară altceva — alt interval, alt endpoint — cifrele nu mai pot fi identice.
    expect(homeQueries.length).toBeGreaterThan(0)
    expect(financialQueries.length).toBeGreaterThan(0)
    expect(new Set(financialQueries)).toEqual(new Set(homeQueries))
    // Și intervalul cerut e chiar cel din URL, nu un default strecurat de una dintre pagini.
    expect(financialQueries[0]).toContain('platform=bolt')
  })

  test('valorile comune sunt identice cu cele de pe Acasă', async ({ page }) => {
    const queries: string[] = []
    await mockApi(page, queries)

    /**
     * Cardul „Profit real estimat" apare pe ambele pagini și conține toate cele patru cifre.
     * Îl găsim după titlu și urcăm la cardul care îl conține — cardurile nu au rol semantic.
     * Cifrele urcă animat la montare, deci citirea se repetă până se așază pe valoarea finală.
     */
    const readProfitCard = async () => {
      // „Profit real estimat" e și titlul cardului, și eticheta unui KPI tile pe pagina nouă.
      // Ancora fără echivoc e subtitlul cascadei, care apare o singură dată pe fiecare pagină.
      const anchor = page
        .getByRole('main')
        .getByText('încasări nete − cheltuieli deductibile − taxe estimate', { exact: true })
      const card = anchor.locator('xpath=ancestor::div[contains(@class,"MuiPaper-root")][1]')
      await expect(card).toBeVisible()
      await expect(card).toContainText(lei(REAL_PROFIT))
      return (await card.innerText()).replace(/\s+/g, ' ').trim()
    }

    await page.goto(`${ROOT}?period=month`, { waitUntil: 'networkidle' })
    const onHome = await readProfitCard()

    await page.goto(`${FINANCIAL}?period=month`, { waitUntil: 'networkidle' })
    const onFinancial = await readProfitCard()

    expect(onFinancial).toEqual(onHome)
  })
})
