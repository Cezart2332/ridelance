import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'
const YEAR = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Europe/Bucharest' }).format(new Date()))
const PFA_ID = '11111111-1111-1111-1111-111111111111'
const CLIENT_USER_ID = '22222222-2222-2222-2222-222222222222'
const ROOM_ID = '44444444-4444-4444-4444-444444444444'

// PNG 1×1, ca poza din chat să se poată afișa.
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')

const json = (route: Route, body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

function priorPeriod(saved: Record<number, { income: number; expenses: number }> = {}) {
  return {
    year: YEAR,
    requiredFrom: `${YEAR}-01-01`,
    joinedOn: `${YEAR}-05-12`,
    months: [1, 2, 3, 4, 5].map((month) => ({
      month,
      income: saved[month]?.income ?? null,
      expenses: saved[month]?.expenses ?? null,
      platformIncome: month === 5 ? 3_200 : 0,
      platformExpenses: 0,
      joinMonth: month === 5,
      updatedAtUtc: saved[month] ? `${YEAR}-09-23T10:00:00Z` : null,
    })),
  }
}

const estimates = {
  taxYear: YEAR,
  locked: false,
  profileStatus: 'COMPLETED',
  asOf: `${YEAR}-09-23`,
  status: 'ESTIMATED',
  stale: false,
  reserve: {
    status: 'ESTIMATED', total: 6_900, weekly: 493, annualEstimated: 6_900, missing: [], reasonCode: null,
    existingReserve: null, existingReserveAssumedZero: true, recordedTaxPayments: 0,
  },
  components: [
    { component: 'CAS', status: 'ESTIMATED', amount: 0, reasonCode: null, missingInputs: [], breakdown: {} },
    { component: 'CASS', status: 'ESTIMATED', amount: 3_600, reasonCode: null, missingInputs: [], breakdown: {} },
    { component: 'INCOME_TAX', status: 'ESTIMATED', amount: 3_240, reasonCode: null, missingInputs: [], breakdown: {} },
    { component: 'PLATFORM_TAXES', status: 'NOT_CONFIGURED', amount: null, reasonCode: null, missingInputs: [], breakdown: null },
  ],
  warnings: ['COVERAGE_GAP'],
  projection: {
    netRealized: 18_000, netAnnualEstimated: 36_000, weeklyAverage: 700, weeksUsed: 8, weeksRemaining: 14,
    uncoveredPeriod: `01.01.${YEAR} – 11.05.${YEAR}`, uncoveredWeeks: 18.9,
  },
  runs: [],
}

async function mockContabil(page: Page) {
  const state = { saves: [] as unknown[], uploads: [] as string[] }

  await page.route(`${API}/**`, (route) => json(route, []))
  await page.route(`${API}/hubs/**`, (route) => route.abort())
  await page.route(`${API}/users/refresh-token`, (route) => json(route, { accessToken: 't', userId: 'contabil-1', role: 'Contabil' }))
  await page.route(`${API}/users/profile`, (route) => json(route, { firstName: 'Ana', lastName: 'Contabil', email: 'ana@example.test', role: 'Contabil' }))
  await page.route(/\/pfa-registrations(\?.*)?$/, (route) =>
    json(route, { items: [{ id: PFA_ID, userId: CLIENT_USER_ID, userName: 'Ion Popescu', userEmail: 'ion@example.test', status: 'Approved' }] }),
  )
  await page.route(`${API}/pfa-registrations/${PFA_ID}/monthly-income**`, (route) =>
    json(route, {
      id: null, pfaRegistrationId: PFA_ID, year: YEAR, month: 8, venitCash: 0, venitCard: 0, venitBolt: 0, venitUber: 0,
      taxeEstimate: 0, venitTotal: 0, updatedAtUtc: null, isProcessed: false, processedAtUtc: null, processedByUserId: null, processedByUserName: null,
    }),
  )
  // Profilul fiscal nu contează aici; fără el panoul lui arată doar eroarea de încărcare.
  await page.route(`${API}/accounting/pfas/${PFA_ID}/fiscal-profiles/**`, (route) => route.fulfill({ status: 404, json: { detail: 'Nu am găsit PFA-ul.' } }))
  await page.route(`${API}/accounting/pfas/${PFA_ID}/estimated-taxes/**`, (route) => json(route, estimates))

  let saved: Record<number, { income: number; expenses: number }> = {}
  await page.route(`${API}/accounting/pfas/${PFA_ID}/prior-period/${YEAR}`, async (route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() as { months: { month: number; income: number | null; expenses: number | null }[] }
      state.saves.push(body)
      saved = { ...saved, ...Object.fromEntries(body.months.map((m) => [m.month, { income: m.income ?? 0, expenses: m.expenses ?? 0 }])) }
    }
    return json(route, priorPeriod(saved))
  })

  await page.route(`${API}/chat/rooms`, (route) => json(route, { roomId: ROOM_ID }))
  await page.route(`${API}/chat/rooms/${ROOM_ID}/messages**`, (route) =>
    json(route, {
      totalCount: 2,
      messages: [
        {
          id: 'm-1', senderId: CLIENT_USER_ID, senderName: 'Ion Popescu', senderRole: 'Client', content: 'Bonul de la service',
          sentAtUtc: `${YEAR}-09-23T09:00:00Z`, isRead: true, attachment: { fileName: 'bon.png', contentType: 'image/png', size: 68 },
        },
        {
          id: 'm-2', senderId: CLIENT_USER_ID, senderName: 'Ion Popescu', senderRole: 'Client', content: '',
          sentAtUtc: `${YEAR}-09-23T09:01:00Z`, isRead: true, attachment: { fileName: 'extras-aprilie.pdf', contentType: 'application/pdf', size: 245_000 },
        },
      ],
    }),
  )
  await page.route(`${API}/chat/messages/*/attachment`, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }))
  await page.route(`${API}/chat/rooms/${ROOM_ID}/attachments`, async (route) => {
    state.uploads.push(route.request().postData() ?? '')
    return json(route, {})
  })

  return state
}

test('contabilul completează perioada dinainte de RIDElance', async ({ page }, info) => {
  const state = await mockContabil(page)
  await page.goto(`/contabil?tab=clients&user=${CLIENT_USER_ID}`)

  const panel = page.getByTestId('prior-period-panel')
  await expect(panel.getByRole('heading', { name: `Perioada dinainte de RIDElance · ${YEAR}` })).toBeVisible()
  await expect(panel.getByText('0 din 5 luni completate')).toBeVisible()
  await expect(panel.getByText('Luna intrării în RIDElance')).toBeVisible()
  await expect(panel.getByText(/În RIDElance: 3\.200 lei venit/)).toBeVisible()

  const save = panel.getByRole('button', { name: 'Salvează și recalculează' })
  await expect(save).toBeDisabled()
  await panel.getByLabel('Venit brut Ianuarie').fill('4200')
  await panel.getByLabel('Cheltuieli deductibile Ianuarie').fill('350,5')
  await panel.getByLabel('Venit brut Februarie').fill('0')
  await panel.screenshot({ path: `test-results/prior-period-${info.project.name}.png` })
  // Panoul încape pe ecran, nu doar pagina: coloana fișei nu se lățește după taburi.
  const box = await panel.boundingBox()
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await save.click()

  await expect(panel.getByText('Salvat. Taxele estimate se recalculează.')).toBeVisible()
  await expect(panel.getByText('2 din 5 luni completate')).toBeVisible()
  expect(state.saves).toEqual([
    { months: [{ month: 1, income: 4200, expenses: 350.5 }, { month: 2, income: 0, expenses: null }] },
  ])
})

test('cardul de taxe estimează perioada lipsă și spune unde se completează', async ({ page }, info) => {
  await mockContabil(page)
  await page.goto(`/contabil?tab=clients&user=${CLIENT_USER_ID}`)
  await page.getByRole('tab', { name: 'Profil fiscal' }).click()

  const card = page.getByTestId('estimated-taxes-card')
  await expect(card.getByTestId('weekly-amount')).toHaveText('493 lei')
  await expect(card.getByText(`Nu avem veniturile pentru 01.01.${YEAR} – 11.05.${YEAR}; le-am estimat din media lunilor din RIDElance.`, { exact: false })).toBeVisible()
  await expect(card.getByText('în tab-ul Venituri', { exact: false })).toBeVisible()
  await expect(card.getByText('Date insuficiente')).toHaveCount(0)
  await card.scrollIntoViewIfNeeded()
  await card.screenshot({ path: `test-results/estimated-taxes-coverage-gap-${info.project.name}.png` })
})

test('chatul arată pozele și fișierele și trimite un fișier atașat', async ({ page }, info) => {
  const state = await mockContabil(page)
  await page.goto(`/contabil?tab=clients&user=${CLIENT_USER_ID}`)

  await expect(page.getByRole('img', { name: 'bon.png' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Descarcă extras-aprilie.pdf' })).toContainText('239 KB')
  await expect(page.getByText('Bonul de la service')).toBeVisible()

  await page.getByTestId('chat-attachment-input').setInputFiles({ name: 'factura.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') })
  await expect(page.getByText(/factura\.pdf · 13 B/)).toBeVisible()
  await page.getByPlaceholder('Adaugă o descriere (opțional)...').fill('Factura pe septembrie')
  await page.screenshot({ path: `test-results/chat-attachment-${info.project.name}.png` })
  await page.getByPlaceholder('Adaugă o descriere (opțional)...').press('Enter')

  await expect.poll(() => state.uploads.length).toBe(1)
  expect(state.uploads[0]).toContain('filename="factura.pdf"')
  expect(state.uploads[0]).toContain('Factura pe septembrie')
  await expect(page.getByText(/factura\.pdf · 13 B/)).toHaveCount(0)
})
