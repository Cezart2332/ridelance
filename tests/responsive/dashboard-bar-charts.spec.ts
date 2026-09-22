import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'
const ROOT = '/app/dashboard'

/**
 * Graficele de pe Acasă sunt bare, iar axa urmează filtrul: săptămâna pe zile (Lun–Dum), luna pe
 * săptămâni, anul pe luni (Ian–Dec). Etichetele vin gata făcute din backend.
 */

type Bucket = { bucket: string; label: string; net: number }

const DAYS: Bucket[] = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map((label, i) => ({
  bucket: `2026-09-${String(21 + i).padStart(2, '0')}`,
  label,
  net: [620, 840, 510, 930, 1_120, 1_340, 480][i],
}))

const WEEKS: Bucket[] = ['1–6 sep', '7–13 sep', '14–20 sep', '21–27 sep', '28–30 sep'].map((label, i) => ({
  bucket: `2026-09-${String([1, 7, 14, 21, 28][i]).padStart(2, '0')}`,
  label,
  net: [3_100, 4_250, 3_800, 4_900, 1_900][i],
}))

const MONTHS: Bucket[] = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep'].map((label, i) => ({
  bucket: `2026-${String(i + 1).padStart(2, '0')}-01`,
  label,
  net: [9_800, 12_400, 10_100, 14_900, 13_200, 11_700, 12_900, 10_400, 13_600][i],
}))

function summary(buckets: Bucket[], granularity: 'day' | 'week' | 'month') {
  const total = buckets.reduce((sum, b) => sum + b.net, 0)
  const metric = (value: number) => ({ value, previous: null })
  return {
    period: { from: buckets[0].bucket, to: buckets.at(-1)!.bucket, granularity },
    kpis: {
      netEarnings: metric(total),
      platformFees: { value: total * 0.2, previous: null, byPlatform: { bolt: total * 0.12, uber: total * 0.08 } },
      onlineHours: metric(120),
      rideKm: metric(1_400),
      netPerHour: metric(83.33),
      netPerKm: metric(7.14),
    },
    taxReserve: null,
    realProfit: { netEarnings: total, deductibleExpenses: 500, estimatedTaxes: total * 0.2, value: total * 0.75, retentionRatio: 0.75, expensesAwaitingReview: 0 },
    platformSplit: [{ platform: 'bolt', net: total * 0.6, fees: total * 0.12, cash: 0, card: total * 0.6, rides: 300 }],
    series: {
      netEarnings: buckets.map((b) => ({ bucket: b.bucket, label: b.label, bolt: b.net * 0.6, uber: b.net * 0.4, total: b.net, rides: 20 })),
      feesAndTaxes: buckets.map((b) => ({ bucket: b.bucket, label: b.label, boltFee: b.net * 0.12, uberFee: b.net * 0.08, vatIntracom: null, boltNonResident: null })),
      realProfit: buckets.map((b) => ({ bucket: b.bucket, label: b.label, netEarnings: b.net, deductibleExpenses: 40, estimatedTaxes: b.net * 0.2, value: b.net * 0.75 })),
    },
    sources: {
      bolt: { configured: true, connected: true, lastSyncAt: null, errorMessage: null, onboardingPending: false },
      uber: { connected: true, lastReportAt: null, detectedRange: null, onboardingPending: false },
    },
    uberIsMonthlyAggregate: false,
    taxProfile: { taxYear: 2026, status: 'COMPLETED', estimatesLocked: false },
  }
}

async function mockApi(page: Page, body: unknown) {
  const json = (route: Route, data: unknown) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
  await page.route(`${API}/**`, (route) => json(route, []))
  await page.route(`${API}/users/refresh-token`, (route) => json(route, { accessToken: 't', role: 'Client', userId: 'user-1' }))
  await page.route(`${API}/users/dashboard-summary`, (route) => json(route, { pfaStatus: 'Approved', pfaRegistrationId: 'pfa-1' }))
  await page.route(`${API}/payments/subscription`, (route) =>
    json(route, { pfaStatus: 'Approved', onboardingSectionsValidated: true, status: 'Active', dashboardAccessGranted: true, plan: 'pro' }),
  )
  await page.route(`${API}/pfa/dashboard/summary*`, (route) => json(route, body))
  await page.route(`${API}/pfa/dashboard/rides*`, (route) => json(route, { items: [], page: 1, pageSize: 20, total: 0, uberRidesAvailable: false }))
  await page.route(`${API}/pfa/me/fiscal-profiles/**`, (route) =>
    json(route, { status: 'COMPLETED', firstPromptShownAtUtc: '2026-03-01T00:00:00Z', answers: {}, conditions: {}, corrections: [], facts: {} }),
  )
  await page.route(`${API}/pfa/me/estimated-taxes/**`, (route) =>
    json(route, { taxYear: 2026, locked: false, profileStatus: 'COMPLETED', status: 'CALCULATING', stale: true, components: [], reserve: null }),
  )
}

const CASES = [
  { name: 'saptamana', buckets: DAYS, granularity: 'day' as const, ticks: ['Lun', 'Mie', 'Dum'] },
  { name: 'luna', buckets: WEEKS, granularity: 'week' as const, ticks: ['1–6', '21–27', '28–30'] },
  { name: 'anul', buckets: MONTHS, granularity: 'month' as const, ticks: ['Ian', 'Mai', 'Sep'] },
]

for (const c of CASES) {
  test(`graficele sunt bare, axa pe ${c.name}`, async ({ page }, info) => {
    await mockApi(page, summary(c.buckets, c.granularity))
    await page.goto(ROOT)

    const card = page.locator('section, div', { has: page.getByText('Încasări nete', { exact: true }) }).filter({ has: page.locator('.recharts-bar-rectangle') }).last()
    await expect(page.locator('.recharts-bar-rectangle').first()).toBeVisible({ timeout: 45_000 })
    for (const tick of c.ticks) {
      await expect(card.locator('.recharts-cartesian-axis-tick-value').getByText(tick, { exact: true }).first()).toBeVisible()
    }

    // Nicio arie sau linie rămasă în graficele de pe Acasă.
    await expect(page.locator('.recharts-area')).toHaveCount(0)

    // Bara de sub cursor e plină, iar tooltipul spune perioada.
    const bars = card.locator('.recharts-bar-rectangle path')
    await bars.nth(1).hover()
    await expect(page.getByText(c.granularity === 'month' ? 'Feb 2026' : c.buckets[1].label, { exact: false }).first()).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)

    await card.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `test-results/bar-charts-${c.name}-${info.project.name}.png` })
  })
}
