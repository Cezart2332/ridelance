import { test, expect, type Page, type Route } from '@playwright/test'

/**
 * Ce pune fiecare pagină publică în `<head>` și ce găsește un crawler în pagină: un titlu al ei,
 * o adresă canonică pe domeniul de producție, un singur `<h1>` și linkuri adevărate în meniu.
 *
 * Fără acestea toate paginile arată la fel pentru un motor de căutare: același titlu, aceeași
 * descriere, niciun link de urmat.
 */

async function stub(page: Page) {
  await page.route('http://localhost:5000/**', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
}

const PAGES = [
  { path: '/', title: 'Ridelance • Platforma PFA pentru ridesharing', canonical: 'https://ridelance.ro/' },
  { path: '/servicii', title: 'Serviciile noastre • RIDElance', canonical: 'https://ridelance.ro/servicii' },
  { path: '/abonamente-preturi', title: 'Abonamente • RIDElance', canonical: 'https://ridelance.ro/abonamente-preturi' },
  { path: '/fiscal', title: 'Calculator Fiscal • RIDElance', canonical: 'https://ridelance.ro/fiscal' },
  { path: '/contact', title: 'Contact • RIDElance', canonical: 'https://ridelance.ro/contact' },
  { path: '/parteneri', title: 'Parteneri • RIDElance', canonical: 'https://ridelance.ro/parteneri' },
  { path: '/parteneri/mol', title: 'MOL — Parteneri • RIDElance', canonical: 'https://ridelance.ro/parteneri/mol' },
  { path: '/despre-ridelance', title: 'Despre Ridelance • RIDElance', canonical: 'https://ridelance.ro/despre-ridelance' },
  {
    path: '/termeni-si-conditii',
    title: 'Termeni si Conditii Generale • RIDElance',
    canonical: 'https://ridelance.ro/termeni-si-conditii',
  },
]

test.describe('seo', () => {
  test.beforeEach(async ({ page }) => {
    await stub(page)
  })

  for (const expected of PAGES) {
    test(`${expected.path} are titlul, adresa canonică și un singur h1`, async ({ page }) => {
      await page.goto(expected.path)

      await expect(page).toHaveTitle(expected.title)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', expected.canonical)
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', expected.canonical)
      await expect(page.locator('h1')).toHaveCount(1)
      // Un singur titlu și o singură descriere: cele din `index.html`, rescrise, nu dublate.
      await expect(page.locator('title')).toHaveCount(1)
      await expect(page.locator('meta[name="description"]')).toHaveCount(1)
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    })
  }

  test('adresa cu slash final are aceeași canonică', async ({ page }) => {
    await page.goto('/servicii/')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ridelance.ro/servicii')
  })

  test('primul partener e chiar pagina „Parteneri”', async ({ page }) => {
    await page.goto('/parteneri')
    const first = await page.locator('h1').innerText()
    await page.goto('/parteneri/bcr')
    await expect(page.locator('h1')).toHaveText(first)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ridelance.ro/parteneri')
  })

  test('meniul și subsolul au linkuri adevărate', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const menu = page.getByRole('navigation', { name: 'Meniul principal' })
    for (const href of ['/servicii', '/masini', '/abonamente-preturi', '/parteneri', '/contact']) {
      await expect(menu.locator(`a[href="${href}"]`)).toHaveCount(1)
    }
    await expect(page.locator('footer a[href="/termeni-si-conditii"]').first()).toBeVisible()

    await menu.locator('a[href="/servicii"]').click()
    await expect(page).toHaveURL(/\/servicii$/)
    await expect(page).toHaveTitle('Serviciile noastre • RIDElance')
  })

  test('zonele de cont cer să nu fie indexate, iar la ieșire eticheta dispare', async ({ page }) => {
    await page.goto('/autentificare')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)

    await page.goto('/servicii')
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
  })

  test('o adresă care nu există nu se indexează', async ({ page }) => {
    await page.goto('/o-firma-care-nu-exista/o-masina-care-nu-exista')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  })

  test('pagina de întrebări frecvente duce acasă', async ({ page }) => {
    await page.goto('/intrebari-frecvente')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('datele despre organizație sunt în pagină din primul răspuns', async ({ request }) => {
    const html = await (await request.get('/')).text()
    const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]
    expect(block).toBeTruthy()

    const graph = (JSON.parse(block!) as { '@graph': { '@type': string; url: string }[] })['@graph']
    expect(graph.map((node) => node['@type'])).toEqual(['Organization', 'WebSite'])
    expect(graph.every((node) => node.url === 'https://ridelance.ro/')).toBe(true)
  })
})
