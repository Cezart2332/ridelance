import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'
const ROOT = '/app/dashboard'

/**
 * Navigația PFA e în spatele autentificării și al porții de acces (PFA aprobat + onboarding
 * validat + abonament activ). Ca testul să verifice rutarea, nu backendul, răspundem cu
 * fixtures la cele trei cereri din care se compune poarta și lăsăm restul API-ului să întoarcă
 * gol. Ce se afirmă mai jos ține strict de rutare: unde ajungi și ce e marcat în meniu.
 */
async function mockGate(page: Page) {
  // Playwright verifică rutele în ordinea inversă înregistrării, deci prinsa generală se
  // înregistrează prima — altfel ar înghiți și cererile pentru care avem fixtures.
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

  // Acasă randează direct din acest DTO, fără verificări defensive: un răspuns de formă
  // greșită prăbușește arborele, deci și sidebar-ul pe care îl verificăm. Zerouri, dar
  // structura completă.
  const metric = { value: 0, previous: null }
  await page.route(`${API}/pfa/dashboard/summary*`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        period: { from: '2026-08-01', to: '2026-08-31', granularity: 'day' },
        kpis: {
          netEarnings: metric,
          platformFees: { ...metric, byPlatform: { bolt: 0, uber: 0 } },
          onlineHours: metric,
          rideKm: metric,
          netPerHour: metric,
          netPerKm: metric,
        },
        taxReserve: { scope: 'period', total: 0, components: [], fiscalMonth: { month: '2026-08', total: 0 } },
        realProfit: { netEarnings: 0, deductibleExpenses: 0, estimatedTaxes: 0, value: 0, retentionRatio: null },
        platformSplit: [],
        series: { netEarnings: [], feesAndTaxes: [], realProfit: [] },
        sources: {
          bolt: { configured: false, connected: false, lastSyncAt: null, errorMessage: null },
          uber: { connected: false, lastReportAt: null, detectedRange: null },
        },
        uberIsMonthlyAggregate: false,
      }),
    }),
  )

  await page.route(`${API}/notifications/preferences`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { category: 'DocumentExpiry', label: 'Documente care expiră', group: 'operational', enabled: true },
          { category: 'OffersAndBenefits', label: 'Oferte și beneficii', group: 'commercial', enabled: false },
        ],
      }),
    }),
  )

  // Fără bancă conectată, endpointul întoarce null — nu un array, cum ar face prinsa generală.
  await page.route(`${API}/bank/connection`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }),
  )

  // Paginile de documente citesc `items`; prinsa generală ar întoarce un array, nu un obiect.
  await page.route(`${API}/documents/overview*`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ group: 'Personal', items: [] }),
    }),
  )

  // Chatul cu contabilul citește `history.messages`; un array gol l-ar lăsa cu `undefined`.
  await page.route(`${API}/chat/**`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ roomId: null, messages: [], page: 1, pageSize: 50, total: 0 }),
    }),
  )

  await page.route(`${API}/pfa/dashboard/rides*`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], page: 1, pageSize: 20, total: 0, uberRidesAvailable: false }),
    }),
  )
}

/** Fiecare frunză de meniu: calea și eticheta cu care apare în sidebar. */
const leaves = [
  { path: ROOT, label: 'Acasă', group: undefined },
  { path: `${ROOT}/contabilitate/situatie-financiara`, label: 'Situație financiară', group: 'Contabilitate' },
  { path: `${ROOT}/contabilitate/cheltuieli`, label: 'Cheltuieli', group: 'Contabilitate' },
  { path: `${ROOT}/contabilitate/taxe-declaratii`, label: 'Taxe & declarații', group: 'Contabilitate' },
  { path: `${ROOT}/contabilitate/cont-bancar`, label: 'Cont bancar', group: 'Contabilitate' },
  { path: `${ROOT}/contabilitate/facturi`, label: 'Facturi', group: 'Contabilitate' },
  { path: `${ROOT}/contabilitate/chat-contabil`, label: 'Chat contabil', group: 'Contabilitate' },
  { path: `${ROOT}/documente/personale`, label: 'Documente personale', group: 'Documente' },
  { path: `${ROOT}/documente/pfa`, label: 'Documente PFA', group: 'Documente' },
  { path: `${ROOT}/documente/masina`, label: 'Documente mașină', group: 'Documente' },
  { path: `${ROOT}/documente/recurente`, label: 'Documentație recurentă', group: 'Documente' },
  { path: `${ROOT}/conexiuni/bolt`, label: 'Bolt', group: 'Conexiuni' },
  { path: `${ROOT}/conexiuni/uber`, label: 'Uber', group: 'Conexiuni' },
  { path: `${ROOT}/conexiuni/oblio`, label: 'OBLIO', group: 'Conexiuni' },
  { path: `${ROOT}/beneficii`, label: 'Beneficii', group: undefined },
  { path: `${ROOT}/servicii/masini`, label: 'Mașini', group: 'Servicii' },
  { path: `${ROOT}/servicii/abonamente`, label: 'Abonamente', group: 'Servicii' },
  { path: `${ROOT}/servicii/servicii-individuale`, label: 'Servicii individuale', group: 'Servicii' },
  { path: `${ROOT}/servicii/asigurari`, label: 'Asigurări', group: 'Servicii' },
  { path: `${ROOT}/suport`, label: 'Suport', group: undefined },
  { path: `${ROOT}/profil`, label: 'Profil', group: undefined },
]

/** Adrese care trebuie să aterizeze altundeva. Nimic nu rămâne 404. */
const redirects = [
  // Rutele de categorie merg la primul copil.
  { from: `${ROOT}/contabilitate`, to: `${ROOT}/contabilitate/situatie-financiara` },
  { from: `${ROOT}/documente`, to: `${ROOT}/documente/personale` },
  { from: `${ROOT}/conexiuni`, to: `${ROOT}/conexiuni/bolt` },
  { from: `${ROOT}/servicii`, to: `${ROOT}/servicii/masini` },
  // Banca e o singură pagină, sub Contabilitate.
  { from: `${ROOT}/conexiuni/banca`, to: `${ROOT}/contabilitate/cont-bancar` },
  // Linkurile vechi, plecate deja în notificări push și e-mailuri.
  { from: `${ROOT}?section=doc_recurring`, to: `${ROOT}/documente/recurente` },
  // Istoricul plăților a devenit secțiune în Profil; ambele adrese vechi aterizează pe ancoră.
  { from: `${ROOT}?section=istoric_plati`, to: `${ROOT}/profil#plati` },
  { from: `${ROOT}/profil/istoric-plati`, to: `${ROOT}/profil#plati` },
  { from: `${ROOT}?section=abonamente`, to: `${ROOT}/servicii/abonamente` },
  { from: `${ROOT}?section=servicii`, to: `${ROOT}/servicii/servicii-individuale` },
  { from: `${ROOT}?section=bolt_integration`, to: `${ROOT}/conexiuni/bolt` },
  { from: `${ROOT}?section=documents`, to: `${ROOT}/documente/personale` },
  { from: `${ROOT}?section=banca`, to: `${ROOT}/contabilitate/cont-bancar` },
  // O rută inventată nu dă 404, se întoarce acasă.
  { from: `${ROOT}/ceva-ce-nu-exista`, to: ROOT },
]

test.describe('navigație PFA', () => {
  // Suita pornește un server de dezvoltare partajat între patru browsere; sub încărcare,
  // 30s implicit nu ajung pentru montarea unei pagini. Eșecurile de acolo nu spun nimic
  // despre cod, doar despre mașina pe care rulează.
  test.describe.configure({ timeout: 90_000 })

  test.beforeEach(async ({ page }) => {
    await mockGate(page)
  })

  test('fiecare subpagină marchează item-ul și deschide categoria părinte', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'sidebar-ul fix există doar pe desktop')
    // Un tur complet prin toate frunzele de meniu, cu montare de pagină la fiecare pas.
    test.setTimeout(180_000)

    for (const leaf of leaves) {
      await page.goto(leaf.path)

      const nav = page.getByRole('navigation', { name: 'Meniu principal' })
      const current = nav.locator('[aria-current="page"]')

      // Exact un item marcat, și acela e cel corect.
      await expect(current, `${leaf.path} → un singur item activ`).toHaveCount(1)
      await expect(current, `${leaf.path} → ${leaf.label}`).toHaveText(new RegExp(leaf.label))

      if (leaf.group) {
        // Refresh direct pe subpagină: categoria părinte trebuie să fie deschisă.
        const groupButton = nav.getByRole('button', { name: leaf.group, exact: false })
        await expect(groupButton, `${leaf.path} → ${leaf.group} deschis`).toHaveAttribute(
          'aria-expanded',
          'true',
        )
      }
    }
  })

  test('rutele vechi și cele de categorie redirecționează', async ({ page }) => {
    test.setTimeout(180_000)

    for (const { from, to } of redirects) {
      await page.goto(from)
      await expect(page, `${from} → ${to}`).toHaveURL(new RegExp(`${to.replace(/\?/g, '\\?')}$`))
    }
  })

  test('conectarea bancară deschide link și așteaptă confirmarea', async ({ page }) => {
    // Providerul nu redirecționează înapoi: pagina rămâne deschisă și întreabă până apare
    // conexiunea. Testul verifică exact asta — link cerut, apoi starea de așteptare.
    let linkRequested = false
    await page.route(`${API}/bank/connection`, (route: Route) => {
      if (route.request().method() === 'POST') {
        linkRequested = true
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ link: 'https://fintable.io/api-link/test', expiresAtUtc: null }),
        })
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          linkRequested
            ? {
                status: 'Created',
                institutionId: 'bcr',
                institutionName: '',
                institutionLogo: null,
                consentExpiresAtUtc: null,
                linkedAtUtc: null,
                lastSyncedAtUtc: null,
                errorMessage: null,
                accounts: [],
                linkExpiresAtUtc: new Date(Date.now() + 600_000).toISOString(),
                candidates: [],
              }
            : null,
        ),
      })
    })

    await page.route(`${API}/bank/institutions`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'bcr', name: 'BCR', logo: null }]),
      }),
    )

    // Linkul se deschide în tab nou; îl interceptăm ca să nu plece testul la Fintable.
    await page.context().route('https://fintable.io/**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html></html>' }),
    )

    await page.goto(`${ROOT}/contabilitate/cont-bancar`, { waitUntil: 'networkidle' })
    const main = page.getByRole('main')

    await main.getByText('BCR', { exact: true }).click()

    await expect(main.getByText('Se așteaptă confirmarea de la bancă')).toBeVisible()
    expect(linkRequested).toBe(true)
  })

  test('popup blocat: nu pretindem că s-a deschis o filă, ci oferim linkul', async ({ page }) => {
    // Cazul raportat: browserul blochează fila, dar conexiunea e deja creată pe server. Textul
    // „termină conectarea în fila care s-a deschis" ar fi atunci pur și simplu fals.
    await page.addInitScript(() => {
      window.open = () => null
    })

    let linkRequested = false
    await page.route(`${API}/bank/connection`, (route: Route) => {
      if (route.request().method() === 'POST') {
        linkRequested = true
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ link: 'https://fintable.io/api-link/test', expiresAtUtc: null }),
        })
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          linkRequested
            ? {
                status: 'Created',
                institutionId: 'bcr',
                institutionName: '',
                institutionLogo: null,
                consentExpiresAtUtc: null,
                linkedAtUtc: null,
                lastSyncedAtUtc: null,
                errorMessage: null,
                accounts: [],
                linkExpiresAtUtc: new Date(Date.now() + 600_000).toISOString(),
                candidates: [],
              }
            : null,
        ),
      })
    })

    await page.route(`${API}/bank/institutions`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'bcr', name: 'BCR', logo: null }]),
      }),
    )

    await page.goto(`${ROOT}/contabilitate/cont-bancar`, { waitUntil: 'networkidle' })
    const main = page.getByRole('main')

    await main.getByText('BCR', { exact: true }).click()

    await expect(main.getByText('Deschide pagina băncii')).toBeVisible()
    await expect(main.getByRole('link', { name: 'Continuă la bancă' })).toHaveAttribute(
      'href',
      'https://fintable.io/api-link/test',
    )
    await expect(main.getByText('Termină conectarea în fila care s-a deschis')).toHaveCount(0)
  })

  test('alegerea manuală apare când revendicarea e ambiguă', async ({ page }) => {
    // Cu un singur cont de provider pentru toți clienții, două conectări simultane fac
    // atribuirea ambiguă. Regula e să nu ghicim, ci să întrebăm.
    await page.route(`${API}/bank/connection`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'Pending',
          institutionId: '',
          institutionName: '',
          institutionLogo: null,
          consentExpiresAtUtc: null,
          linkedAtUtc: null,
          lastSyncedAtUtc: null,
          errorMessage: null,
          accounts: [],
          linkExpiresAtUtc: new Date(Date.now() + 600_000).toISOString(),
          candidates: [
            { providerConnectionId: 'conn_1', institutionName: 'BCR', institutionLogo: null, createdAtUtc: '2026-08-15T10:00:00Z' },
            { providerConnectionId: 'conn_2', institutionName: 'ING', institutionLogo: null, createdAtUtc: '2026-08-15T10:01:00Z' },
          ],
        }),
      }),
    )

    await page.goto(`${ROOT}/contabilitate/cont-bancar`, { waitUntil: 'networkidle' })
    const main = page.getByRole('main')

    await expect(main.getByText('Care dintre conexiuni este a ta?')).toBeVisible()
    await expect(main.getByText('BCR', { exact: true })).toBeVisible()
    await expect(main.getByText('ING', { exact: true })).toBeVisible()
  })

  test('chatul contabil a plecat din Suport și trimite către Contabilitate', async ({ page }) => {
    await page.goto(`${ROOT}/suport`, { waitUntil: 'networkidle' })

    const main = page.getByRole('main')
    // Nu mai există comutatorul intern support/contabil.
    await expect(main.getByRole('button', { name: 'Chat contabil' })).toHaveCount(0)
    // Dar există trimiterea explicită către noul loc.
    await expect(main.getByRole('link', { name: 'Deschide chat contabil' })).toHaveAttribute(
      'href',
      `${ROOT}/contabilitate/chat-contabil`,
    )
  })

  test('conturile de platformă au ajuns pe paginile de conexiune', async ({ page }) => {
    await page.goto(`${ROOT}/conexiuni/bolt`, { waitUntil: 'networkidle' })
    const main = page.getByRole('main')
    await expect(main.getByText('Cont șofer Bolt')).toBeVisible()
    await expect(main.getByText('Cont Bolt Fleet')).toBeVisible()
    // Consimțământul pentru API e specific Bolt.
    await expect(main.getByRole('button', { name: /Bolt Fleet API/ })).toHaveCount(1)

    await page.goto(`${ROOT}/conexiuni/uber`, { waitUntil: 'networkidle' })
    await expect(main.getByText('Cont șofer Uber')).toBeVisible()
    await expect(main.getByText('Import date Uber')).toBeVisible()
    await expect(main.getByRole('button', { name: /Bolt Fleet API/ })).toHaveCount(0)

    // Profilul nu le mai găzduiește.
    await page.goto(`${ROOT}/profil`, { waitUntil: 'networkidle' })
    await expect(main.getByText('Conturi de șofer')).toHaveCount(0)
    await expect(main.getByText('Istoric plăți')).toBeVisible()
  })

  test('documentele arată statusul primit de la server, nu unul dedus', async ({ page }) => {
    // Serverul decide starea; pagina doar o scrie. Dacă cineva reintroduce calculul în client,
    // eticheta nu va mai corespunde cu ce a trimis serverul.
    await page.route(`${API}/documents/overview*`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          group: 'Vehicle',
          items: [
            {
              key: 'rca',
              label: 'RCA',
              hasIssueDate: true,
              hasExpiryDate: true,
              isOptional: false,
              status: 'ExpiraCurand',
              documentId: 'doc-1',
              originalFileName: 'rca.pdf',
              contentType: 'application/pdf',
              uploadedAtUtc: '2026-07-01T10:00:00Z',
              issuedOn: '2025-09-14',
              expiresOn: '2026-09-14',
              daysUntilExpiry: 30,
            },
            {
              key: 'casco',
              label: 'CASCO',
              hasIssueDate: true,
              hasExpiryDate: true,
              isOptional: true,
              status: 'Lipsa',
              documentId: null,
              originalFileName: null,
              contentType: null,
              uploadedAtUtc: null,
              issuedOn: null,
              expiresOn: null,
              daysUntilExpiry: null,
            },
          ],
        }),
      }),
    )

    await page.goto(`${ROOT}/documente/masina`, { waitUntil: 'networkidle' })
    const main = page.getByRole('main')

    await expect(main.getByText('Expiră în 30 zile')).toBeVisible()
    await expect(main.getByText('Valabil până la 14.09.2026')).toBeVisible()
    // Un document lipsă e neutru și oferă încărcare, nu înlocuire.
    await expect(main.getByText('Lipsește')).toBeVisible()
    await expect(main.getByRole('button', { name: 'Încarcă' })).toBeVisible()
    await expect(main.getByRole('button', { name: 'Înlocuiește' })).toBeVisible()
  })

  test('taxele separă estimările de obligațiile contabilei', async ({ page }) => {
    await page.route(`${API}/tax-obligations*`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'ob-1',
            type: 'TvaIntracomunitar',
            typeLabel: 'TVA intracomunitar',
            periodYear: 2026,
            periodMonth: 7,
            periodLabel: 'Iulie 2026',
            amountDue: 514.21,
            dueDate: '2026-08-25',
            status: 'DePlata',
            statusLabel: 'De plată',
            isOverdue: false,
            daysUntilDue: 10,
            documentId: null,
            note: null,
            updatedAtUtc: '2026-08-01T10:00:00Z',
          },
        ]),
      }),
    )

    await page.goto(`${ROOT}/contabilitate/taxe-declaratii`, { waitUntil: 'networkidle' })
    const main = page.getByRole('main')

    // Cele două zone au titluri proprii și etichete care spun ce fel de cifră e fiecare.
    await expect(main.getByText('Estimări RIDElance')).toBeVisible()
    await expect(main.getByText('Estimare', { exact: true })).toBeVisible()
    await expect(main.getByText('Declarații depuse de contabilă')).toBeVisible()
    await expect(main.getByText('Obligație reală', { exact: true })).toBeVisible()

    // Obligația reală arată exemplul din spec: sumă, perioadă și termen.
    await expect(main.getByText('TVA intracomunitar')).toBeVisible()
    await expect(main.getByText('Iulie 2026')).toBeVisible()
    await expect(main.getByText('25.08.2026')).toBeVisible()
  })

  test('profilul are securitate, notificări și confidențialitate', async ({ page }) => {
    await page.goto(`${ROOT}/profil`, { waitUntil: 'networkidle' })
    const main = page.getByRole('main')

    await expect(main.getByText('Securitate', { exact: true })).toBeVisible()
    await expect(main.getByText('Notificări', { exact: true })).toBeVisible()
    await expect(main.getByText('Confidențialitate și cont')).toBeVisible()

    // Preferințele vin grupate: operaționalul nu se amestecă cu comercialul.
    await expect(main.getByText('Operațional', { exact: true })).toBeVisible()
    await expect(main.getByText('Comercial', { exact: true })).toBeVisible()
    await expect(main.getByRole('checkbox', { name: 'Documente care expiră' })).toBeChecked()
    await expect(main.getByRole('checkbox', { name: 'Oferte și beneficii' })).not.toBeChecked()
  })

  test('paginile „În curând" nu aruncă erori', async ({ page }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    for (const path of [`${ROOT}/contabilitate/facturi`, `${ROOT}/conexiuni/uber`, `${ROOT}/conexiuni/oblio`]) {
      await page.goto(path, { waitUntil: 'networkidle' })
    }

    expect(crashes).toEqual([])
  })
})
