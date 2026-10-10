import { useEffect } from 'react'

/**
 * Ce pune o pagină în `<head>` pentru motoarele de căutare și pentru previzualizarea linkului
 * distribuit: titlu, descriere, adresă canonică, etichete Open Graph și date structurate.
 *
 * Se scrie direct în `<head>`, pe etichetele care există deja acolo, nu prin etichete randate din
 * componente. Altfel pagina ajunge cu două `<title>` — cel static din `index.html` și cel al
 * componentei — iar un crawler îl ia pe primul, adică pe cel generic.
 *
 * Pre-randarea de la build (`scripts/prerender.mjs`) salvează `<head>`-ul rezultat, deci aceleași
 * valori ajung și la crawlerele care nu rulează JavaScript.
 */

/** Adresa canonică e mereu cea de producție, oriunde ar rula build-ul. */
export const SITE_ORIGIN = 'https://ridelance.ro'

export const SITE_NAME = 'RIDElance'

/** Imaginea de previzualizare când pagina n-are una a ei. */
const DEFAULT_IMAGE = `${SITE_ORIGIN}/icon-192.png`

export interface PageSeo {
  /** Titlul paginii, fără numele site-ului. Lipsă = titlul implicit din `index.html`. */
  title?: string
  /** Lipsă = descrierea implicită din `index.html`. */
  description?: string
  /** Calea canonică („/servicii”). Lipsă = adresa curentă, fără interogare și fără slash final. */
  path?: string
  /** Adresă absolută. */
  image?: string
  type?: 'website' | 'product'
  /** Pagini care nu au ce căuta în rezultate: erori, zone private. */
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

const MANAGED = 'data-seo'

// Valorile din `index.html`, citite o dată: la ele se întoarce pagina care nu declară nimic.
// Într-o pagină pre-randată, `<title>` e deja al paginii; valorile implicite vin atunci din
// atributele puse pe `<html>` de `scripts/prerender.mjs`.
const DEFAULT_TITLE =
  typeof document === 'undefined' ? '' : (document.documentElement.getAttribute('data-default-title') ?? document.title)
const DEFAULT_DESCRIPTION =
  typeof document === 'undefined'
    ? ''
    : (document.documentElement.getAttribute('data-default-description') ??
      document.querySelector('meta[name="description"]')?.getAttribute('content') ??
      '')

/** „/servicii/” și „/servicii” sunt aceeași pagină; canonica e fără slash final. */
export function canonicalPath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string | null) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (content === null) {
    // Doar ce am pus noi se șterge; descrierea din `index.html` rămâne.
    if (element?.hasAttribute(MANAGED)) element.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    element.setAttribute(MANAGED, '')
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertCanonical(href: string | null) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (href === null) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    element.setAttribute(MANAGED, '')
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function upsertJsonLd(data: PageSeo['jsonLd']) {
  document.head.querySelectorAll(`script[type="application/ld+json"][${MANAGED}]`).forEach((node) => node.remove())
  if (!data) return
  for (const block of Array.isArray(data) ? data : [data]) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute(MANAGED, '')
    script.textContent = JSON.stringify(block)
    document.head.appendChild(script)
  }
}

export function applySeo(seo: PageSeo): void {
  const title = seo.title ? `${seo.title} • ${SITE_NAME}` : DEFAULT_TITLE
  const description = seo.description ?? DEFAULT_DESCRIPTION
  const url = `${SITE_ORIGIN}${canonicalPath(seo.path ?? window.location.pathname)}`
  const image = seo.image ?? DEFAULT_IMAGE

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : null)
  // O pagină scoasă din index nu-și declară o adresă canonică: cele două semnale s-ar contrazice.
  upsertCanonical(seo.noindex ? null : url)

  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:locale', 'ro_RO')
  upsertMeta('property', 'og:type', seo.type ?? 'website')
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:image', image)
  upsertMeta('name', 'twitter:card', seo.image ? 'summary_large_image' : 'summary')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)

  upsertJsonLd(seo.jsonLd)
}

/** Înapoi la ce era în `index.html`: pagina următoare pornește curat. */
export function resetSeo(): void {
  document.title = DEFAULT_TITLE
  upsertMeta('name', 'description', DEFAULT_DESCRIPTION)
  upsertMeta('name', 'robots', null)
  upsertCanonical(null)
  document.head.querySelectorAll(`[${MANAGED}]`).forEach((node) => node.remove())
}

/**
 * Declară ce are pagina în `<head>` cât e montată. `null` = pagina încă nu știe (se încarcă datele).
 *
 * Valorile se compară după conținut, nu după identitate: paginile dau un obiect nou la fiecare
 * randare.
 */
export function usePageSeo(seo: PageSeo | null): void {
  const key = seo ? JSON.stringify(seo) : null

  useEffect(() => {
    if (key === null) return undefined
    applySeo(JSON.parse(key) as PageSeo)
    activePages += 1
    return () => {
      activePages -= 1
      resetSeo()
    }
  }, [key])
}

let activePages = 0

/** Există acum o pagină montată care și-a declarat `<head>`-ul? Vezi `StaleHeadReset`. */
export function hasActivePageSeo(): boolean {
  return activePages > 0
}

/** Firul de navigare al unei pagini, ca date structurate: „Acasă > Abonamente”. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_ORIGIN}${canonicalPath(item.path)}`,
    })),
  }
}

/** Datele unei pagini statice cu un singur nivel sub Acasă. */
export function staticPageSeo(name: string, path: string, description?: string): PageSeo {
  return {
    title: name,
    description,
    path,
    jsonLd: breadcrumbJsonLd([
      { name: 'Acasă', path: '/' },
      { name, path },
    ]),
  }
}
