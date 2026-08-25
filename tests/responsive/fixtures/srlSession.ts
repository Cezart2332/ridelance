import type { Page, Route } from '@playwright/test'

const API = 'http://localhost:5000'

/**
 * Sesiunea unui cont de flotă, pentru orice test care are nevoie de dashboard-ul SRL randat.
 *
 * Contul de flotă nu trece prin poarta PFA (aprobare + onboarding + abonament), deci mock-ul e
 * mult mai mic decât la PFA: doar sesiunea și profilul. Rutele înregistrate după acest apel au
 * prioritate — Playwright verifică în ordine inversă — deci un test poate suprascrie oricare
 * dintre ele.
 */
export async function mockSession(page: Page) {
  // Prinsa generală se înregistrează prima — Playwright verifică rutele în ordine inversă.
  await page.route(`${API}/**`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  await page.route(`${API}/users/refresh-token`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'test-token', role: 'CarPoster', userId: 'poster-1' }),
    }),
  )

  // Suportul citește `history.messages`; prinsa generală întoarce un array, deci `undefined`.
  await page.route(`${API}/chat/**`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ roomId: null, messages: [], page: 1, pageSize: 50, total: 0 }),
    }),
  )

  // Acasă: sumarul flotei, gol pentru un cont nou.
  await page.route(`${API}/srl/home`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        fleetSize: 0,
        publishedCount: 0,
        rentedCount: 0,
        availableCount: 0,
        activeRentals: 0,
        monthlyContractValueBani: 0,
        documentsExpiringSoon: 0,
        scheduledMaintenance: 0,
        attention: [],
        activeRentalRows: [],
      }),
    }),
  )

  // Închirierile și mentenanța: cont nou, fără nimic înregistrat.
  await page.route(`${API}/rentals`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: { activeCount: 0, monthlyContractValueBani: 0, upcomingHandoverCount: 0, availableCars: 0 },
        rentals: [],
      }),
    }),
  )

  await page.route(`${API}/maintenance*`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: { costLast30DaysBani: 0, scheduledCount: 0, activeReminders: 0, monitoredCars: 0 },
        entries: [],
      }),
    }),
  )

  // Integrările: proiecție peste conexiunile existente, deci un cont fără bancă le are pe toate
  // neconectate.
  await page.route(`${API}/connections`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { provider: 'Oblio', status: 'disconnected', connectedAtUtc: null, expiresAtUtc: null, lastSyncAtUtc: null, errorMessage: null, available: false, details: [] },
        { provider: 'Bank', status: 'disconnected', connectedAtUtc: null, expiresAtUtc: null, lastSyncAtUtc: null, errorMessage: null, available: true, details: [] },
        { provider: 'Eldrive', status: 'disconnected', connectedAtUtc: null, expiresAtUtc: null, lastSyncAtUtc: null, errorMessage: null, available: false, details: [] },
      ]),
    }),
  )

  // Profilul firmei: un cont nou nu are unul, iar serverul răspunde 204.
  await page.route(`${API}/companies/profile`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'company-1',
        ownerType: 'Srl',
        legalName: 'TUKI GO SRL',
        cui: 'RO12345678',
        regCom: 'J40/1234/2021',
        legalRepresentative: 'Ionescu Victor',
        registeredOffice: 'București',
        phone: '0736186400',
        email: 'contact@tukigo.ro',
        website: 'https://tukigo.ro',
        publicDescription: 'Flotă de ridesharing.',
        logoUrl: null,
        slug: 'tuki-go',
        isVerified: true,
        visibility: { phone: true, email: true, whatsapp: true, location: true },
      }),
    }),
  )

  await page.route(`${API}/users/profile`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'poster-1',
        email: 'flota@example.ro',
        role: 'CarPoster',
        firstName: 'TUKI',
        lastName: 'GO',
      }),
    }),
  )
}
