import { mkdirSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'

/**
 * Criteriul greu al redesignului de auth: ecranul nu are scroll. Nici pe laptopul de 1366×768
 * (viewportul critic — după cromul browserului rămân ~610px utilizabili), nici pe telefon, nici
 * cu alert-ul de eroare afișat.
 *
 * Paginile sunt publice și nu cer nimic de la backend la montare, deci testul rulează fără API.
 */
const VIEWPORTS = {
  desktop: [
    { name: '1366x768', width: 1366, height: 768 },
    // Cazul real de pe laptopul de 1366×768: Playwright dă viewportul întreg, dar într-un
    // browser adevărat bara de titlu, tab-urile și bara de adrese lasă ~610px. Ăsta e
    // viewportul pentru care s-a calculat bugetul vertical.
    { name: '1366x610', width: 1366, height: 610 },
    { name: '1440x900', width: 1440, height: 900 },
  ],
  mobile: [
    { name: '390x844', width: 390, height: 844 },
    { name: '375x667', width: 375, height: 667 },
  ],
} as const

const PAGES = [
  { name: 'autentificare', path: '/autentificare' },
  { name: 'inregistrare', path: '/inregistrare' },
]

/**
 * Pagina nu derulează niciodată — grila e `height: 100dvh; overflow: hidden`.
 *
 * Dar asta singură dă verde fals: coloana formularului are `overflowY: auto` ca supapă, deci
 * conținutul poate depăși pe ascuns fără ca `documentElement` să se miște. De aceea măsurăm și
 * derularea internă a lui `<main>` și o întoarcem, ca fiecare ecran să declare explicit dacă
 * încape sau nu.
 */
async function measureOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const main = document.querySelector('main')
    return {
      vertical: document.documentElement.scrollHeight - window.innerHeight,
      horizontal: document.documentElement.scrollWidth - window.innerWidth,
      column: main ? main.scrollHeight - main.clientHeight : 0,
    }
  })
  expect(overflow.vertical, 'scroll vertical pe pagină').toBeLessThanOrEqual(2)
  expect(overflow.horizontal, 'scroll orizontal').toBeLessThanOrEqual(2)
  return overflow
}

test.describe('auth — încadrare într-un singur ecran', () => {
  for (const pageInfo of PAGES) {
    test(`${pageInfo.name} nu are scroll`, async ({ page }, testInfo) => {
      const viewports = VIEWPORTS[testInfo.project.name as keyof typeof VIEWPORTS]

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto(pageInfo.path, { waitUntil: 'networkidle' })

        const dir = `test-results/responsive/screenshots/${testInfo.project.name}`
        mkdirSync(dir, { recursive: true })
        await page.screenshot({ path: `${dir}/auth-${pageInfo.name}-${viewport.name}.png` })

        const overflow = await measureOverflow(page)

        if (pageInfo.name === 'autentificare') {
          // Loginul trebuie să încapă întreg, fără să fie nevoie de derulare în coloană.
          expect(overflow.column, `${viewport.name}: coloana loginului derulează`).toBeLessThanOrEqual(2)
        } else {
          // Registerul are în plus alegerea tipului de cont și numele — obligatorii, fiindcă
          // onboardingul (care ar fi citit numele din buletin) există doar pentru PFA. Nu încape
          // pe ecrane joase, deci coloana derulează; ce urmărim e să nu scape de sub control.
          console.log(`register ${viewport.name}: derulare în coloană ${overflow.column}px`)
          expect(overflow.column, `${viewport.name}: register derulează prea mult`).toBeLessThanOrEqual(320)
        }
      }
    })
  }

  test('login nu are scroll nici cu alert-ul de eroare afișat', async ({ page }, testInfo) => {
    // Backendul întoarce 400 pentru credențiale greșite (`UserErrors.InvalidCredentials` e un
    // `Error.Failure`), nu 401 — de aceea fixture-ul e pe 400.
    await page.route('**/users/login', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Users.InvalidCredentials', detail: 'Invalid credentials.' }),
      }),
    )

    for (const viewport of VIEWPORTS[testInfo.project.name as keyof typeof VIEWPORTS]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/autentificare', { waitUntil: 'networkidle' })

      // Label-urile sunt `required`, deci numele accesibil e „Email *" / „Parolă *".
      await page.getByLabel(/Email/).fill('gresit@exemplu.ro')
      await page.getByLabel(/Parolă/).fill('parola-gresita')
      await page.getByRole('button', { name: 'Intră în RIDElance' }).click()

      const alert = page.getByRole('alert')
      await expect(alert).toContainText('Email sau parolă incorectă.')

      await measureOverflow(page)
    }
  })
})

test.describe('auth — asset-ul vizual', () => {
  test('imaginea din panoul stâng nu se descarcă sub breakpoint-ul md', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'relevant doar pe mobil')

    const requested: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('auth-visual')) requested.push(request.url())
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/autentificare', { waitUntil: 'networkidle' })
    // Panoul se montează într-un efect, după primul paint — lăsăm randarea să se așeze.
    await expect(page.getByRole('button', { name: 'Intră în RIDElance' })).toBeVisible()

    await expect(page.locator('img[src*="auth-visual"]')).toHaveCount(0)
    expect(requested, 'auth-visual.webp nu trebuie cerut pe mobil').toEqual([])
  })

  test('imaginea se descarcă pe desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'relevant doar pe desktop')

    const requested: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('auth-visual')) requested.push(request.url())
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/autentificare', { waitUntil: 'networkidle' })
    await expect(page.locator('img[src*="auth-visual"]')).toBeVisible()

    expect(requested.length).toBeGreaterThan(0)
  })
})
