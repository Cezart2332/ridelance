/**
 * Pre-randarea paginilor publice statice, după `vite build`.
 *
 * Site-ul e o aplicație randată în browser: fără acest pas, serverul răspunde pe orice adresă cu
 * același HTML gol, iar un crawler care nu rulează JavaScript (și previzualizarea unui link
 * distribuit) nu vede nici titlul paginii, nici textul ei.
 *
 * Ce face: pornește un server local peste `dist`, deschide fiecare pagină într-un Chromium fără
 * interfață și salvează ce a randat aplicația — `<head>`-ul (titlu, descriere, adresă canonică,
 * date structurate), stilurile și HTML-ul paginii — în `dist/<cale>.html`. La rulare, aplicația
 * pornește lângă această copie și o înlocuiește când e gata (`src/seo/PrerenderHandoff.tsx`).
 *
 * `dist/index.html` devine pagina principală pre-randată; pagina goală de pornire, pentru toate
 * celelalte adrese, se păstrează ca `dist/shell.html` (vezi `nginx/default.conf`).
 *
 * Tot de aici iese `dist/sitemap-static.xml`: lista de mai jos e singurul loc unde se spune care
 * sunt paginile site-ului.
 *
 * Cererile în afara serverului local sunt oprite: pagina salvată nu depinde de API, iar un build
 * nu trebuie să lovească producția. Paginile al căror conținut vine din API primesc altceva:
 *
 * - lista de mașini (`/masini`) are titlul și descrierea fixe, deci i se salvează doar `<head>`-ul;
 * - o mașină sau pagina unei firme își află titlul abia din date. Pentru ele se scrie
 *   `dist/dynamic-page.html`, pagina de pornire în care nginx pune, la fiecare cerere, etichetele
 *   primite de la API (un `include` SSI, vezi `nginx/default.conf`).
 */
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const SITE_ORIGIN = 'https://ridelance.ro'

/** Paginile publice cu conținut fix. */
const STATIC_ROUTES = [
  '/',
  '/servicii',
  '/abonamente-preturi',
  '/fiscal',
  '/orase-ridesharing',
  '/parteneri',
  '/despre-ridelance',
  '/contact',
  '/termeni-si-conditii',
  '/privacy-policy',
  '/politica-cookies',
  '/politica-plati-abonamente',
]

/** Conținutul vine din API, deci se salvează doar `<head>`-ul: titlul și descrierea sunt fixe. */
const HEAD_ONLY_ROUTES = ['/masini']

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}

/** Fiecare partener are pagina lui (`/parteneri/{slug}`); slogurile stau în datele aplicației. */
async function partnerRoutes() {
  const source = await readFile(path.join(ROOT, 'src/data/partners.ts'), 'utf8')
  const slugs = [...source.matchAll(/^\s+slug: '([a-z0-9-]+)',$/gm)].map((match) => match[1])
  if (slugs.length === 0) throw new Error('Nu am găsit niciun partener în src/data/partners.ts.')
  return slugs.map((slug) => `/parteneri/${slug}`)
}

/** Serverul local: fișierul cerut, altfel pagina de pornire — ca nginx în producție. */
function serve(shell) {
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const file = path.join(DIST, pathname)
    if (file.startsWith(DIST) && path.extname(file)) {
      try {
        const body = await readFile(file)
        response.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' })
        response.end(body)
        return
      } catch {
        response.writeHead(404).end()
        return
      }
    }
    response.writeHead(200, { 'Content-Type': MIME['.html'] }).end(shell)
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escapeAttribute = (text) => escapeHtml(text).replace(/"/g, '&quot;')

/** Înlocuiește o singură apariție și se oprește dacă pagina de pornire nu mai arată cum ne așteptăm. */
function replaceOnce(html, pattern, replacement, what) {
  let found = false
  const result = html.replace(pattern, () => {
    found = true
    return replacement
  })
  if (!found) throw new Error(`Pagina de pornire nu mai are ${what}; actualizează scripts/prerender.mjs.`)
  return result
}

/** Ce a randat aplicația pe pagina deschisă. Rulează în browser. */
function snapshot() {
  const emotion = [...document.styleSheets]
    .filter((sheet) => sheet.ownerNode instanceof HTMLStyleElement && sheet.ownerNode.hasAttribute('data-emotion'))
    .flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText))
    .join('')
  return {
    pathname: window.location.pathname,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
    managedHead: [...document.head.querySelectorAll('[data-seo]')].map((node) => node.outerHTML),
    // Foile de stil ale bucăților încărcate la cerere: aplicația le adaugă singură în `<head>`.
    stylesheets: [...document.head.querySelectorAll('link[rel="stylesheet"]')].map((node) => node.getAttribute('href')),
    css: emotion,
    html: document.getElementById('root').innerHTML,
    hasHeading: document.querySelector('#root h1') !== null,
  }
}

/** Valorile implicite ajung pe `<html>`: aplicația le citește de acolo când `<head>`-ul e deja al paginii. */
function withDefaults(html, defaults) {
  return replaceOnce(
    html,
    /<html /,
    `<html data-default-title="${escapeAttribute(defaults.title)}" data-default-description="${escapeAttribute(defaults.description)}" `,
    '<html>',
  )
}

/**
 * Pagina de pornire pentru adresele al căror `<head>` vine din date. Titlul și descrierea implicite
 * devin un bloc de rezervă: nginx pune în locul lor ce răspunde API-ul și revine la ele dacă API-ul
 * nu răspunde.
 */
function buildDynamicPage(shell, defaults) {
  let html = withDefaults(shell, defaults)
  html = replaceOnce(html, /\s*<meta\s+name="description"[\s\S]*?\/>/, '', 'descrierea')
  html = replaceOnce(
    html,
    /<title>[\s\S]*?<\/title>/,
    [
      '<!--# block name="default_head" -->',
      `<title>${escapeHtml(defaults.title)}</title>`,
      `<meta name="description" content="${escapeAttribute(defaults.description)}" />`,
      '<!--# endblock -->',
      '<!--# include virtual="/_seo/head" stub="default_head" -->',
    ].join(''),
    '<title>',
  )
  return html
}

function buildPage(shell, defaults, page, { withBody }) {
  const missingStylesheets = page.stylesheets
    .filter((href) => href && !shell.includes(`href="${href}"`))
    .map((href) => `<link rel="stylesheet" crossorigin href="${escapeAttribute(href)}">`)
  const head = [
    ...page.managedHead,
    // Clasele din HTML-ul salvat sunt generate la rulare; fără regulile lor pagina ar apărea
    // nestilizată până pornește aplicația. Se scot odată cu copia.
    ...(withBody ? [...missingStylesheets, `<style data-prerender>${page.css}</style>`] : []),
  ].join('\n    ')

  let html = shell
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`, '<title>')
  html = replaceOnce(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeAttribute(page.description)}" />`,
    'descrierea',
  )
  html = withDefaults(html, defaults)
  html = replaceOnce(html, /<\/head>/, `  ${head}\n  </head>`, '</head>')
  if (withBody) {
    html = replaceOnce(
      html,
      /<div id="root"><\/div>/,
      `<div id="prerender">${page.html}</div>\n    <div id="root"></div>`,
      '#root',
    )
  }
  return html
}

async function render(browser, origin, route, { withBody }) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
  try {
    await page.route('**/*', (request) =>
      new URL(request.request().url()).origin === origin ? request.continue() : request.abort(),
    )
    await page.goto(origin + route, { waitUntil: 'load' })
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-route-ready'), null, { timeout: 30_000 })
    await page.waitForLoadState('networkidle')
    const result = await page.evaluate(snapshot)

    if (result.pathname !== route) throw new Error(`a redirecționat spre ${result.pathname}`)
    if (result.robots?.includes('noindex')) throw new Error('pagina se declară „noindex”')
    if (withBody && !result.hasHeading) throw new Error('pagina nu are <h1>')
    if (!result.canonical) throw new Error('pagina nu are adresă canonică')
    return result
  } finally {
    await page.close()
  }
}

function sitemap(urls) {
  const entries = urls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`
}

const shell = await readFile(path.join(DIST, 'index.html'), 'utf8')
if (shell.includes('id="prerender"')) {
  throw new Error('dist/index.html e deja pre-randat; rulează întâi `npm run build`.')
}
const defaults = {
  title: shell.match(/<title>([\s\S]*?)<\/title>/)?.[1].trim() ?? '',
  description: shell.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] ?? '',
}

const routes = [...STATIC_ROUTES, ...(await partnerRoutes()), ...HEAD_ONLY_ROUTES]
const server = await serve(shell)
const origin = `http://127.0.0.1:${server.address().port}`
// În imaginea de build, Chromium vine din pachetele sistemului; local, din Playwright.
const browser = await chromium.launch({
  executablePath: process.env.PRERENDER_CHROMIUM || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const pages = new Map()
try {
  for (const route of routes) {
    try {
      pages.set(route, await render(browser, origin, route, { withBody: !HEAD_ONLY_ROUTES.includes(route) }))
    } catch (error) {
      throw new Error(`Pre-randarea a eșuat pentru ${route}: ${error.message}`, { cause: error })
    }
  }
} finally {
  await browser.close()
  server.close()
}

await writeFile(path.join(DIST, 'shell.html'), shell)
await writeFile(path.join(DIST, 'dynamic-page.html'), buildDynamicPage(shell, defaults))
const listed = []
for (const [route, page] of pages) {
  const file = route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, `${route}.html`)
  const withBody = !HEAD_ONLY_ROUTES.includes(route)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, buildPage(shell, defaults, page, { withBody }))
  // O pagină care își declară altă adresă canonică (primul partener e chiar „/parteneri”) nu intră
  // în sitemap: acolo stau doar adresele canonice.
  if (page.canonical === SITE_ORIGIN + route) listed.push(page.canonical)
  console.log(`  ${route}  →  ${path.relative(DIST, file)}  (${page.title})${withBody ? '' : '  [doar <head>]'}`)
}

await writeFile(path.join(DIST, 'sitemap-static.xml'), sitemap(listed))
console.log(`Pre-randate: ${pages.size} pagini. Sitemap: ${listed.length} adrese.`)
