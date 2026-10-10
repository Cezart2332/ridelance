import { useEffect } from 'react'

/**
 * Predarea de la pagina pre-randată la cea vie.
 *
 * La build, `scripts/prerender.mjs` salvează HTML-ul fiecărei pagini publice statice în
 * `<div id="prerender">`, lângă un `#root` gol. Cititorul (și crawlerul care nu rulează JavaScript)
 * vede pagina din primul răspuns al serverului. Aplicația pornește în `#root`, ascuns cât timp
 * există `#prerender` (regula e în `index.html`), iar când pagina vie e gata copia se scoate.
 *
 * Nu e hidratare: pagina vie se randează de la zero. Hidratarea ar cere ca serverul și clientul să
 * producă același arbore, iar aici antetul depinde de sesiune și rutele sunt încărcate la cerere.
 *
 * Stă în `Suspense`-ul rutelor, deci se montează abia când pagina cerută a sosit.
 */

/** Tot ce are `#root` de încărcat înainte să poată înlocui copia: indicatoare și schelete. */
const LOADING = '#root main [role="progressbar"], #root main .MuiSkeleton-root'

/** Dacă pagina vie nu se liniștește (o cerere agățată), copia nu rămâne pe ecran la nesfârșit. */
const MAX_WAIT_MS = 6000

/** Scriptul de pre-randare așteaptă acest atribut înainte să salveze pagina. */
const READY = 'data-route-ready'

function dropPrerender() {
  document.getElementById('prerender')?.remove()
  document.querySelectorAll('style[data-prerender]').forEach((node) => node.remove())
}

// Pagina cerută poate să nu ajungă niciodată la `PrerenderHandoff` (o eroare la încărcare, o
// redirecționare în afara site-ului public). Copia tot trebuie să plece.
if (typeof document !== 'undefined' && document.getElementById('prerender')) {
  window.setTimeout(dropPrerender, MAX_WAIT_MS * 2)
}

export function PrerenderHandoff() {
  useEffect(() => {
    let frame = 0
    const deadline = performance.now() + MAX_WAIT_MS

    const check = () => {
      if (document.querySelector(LOADING) === null || performance.now() > deadline) {
        dropPrerender()
        document.documentElement.setAttribute(READY, '')
        return
      }
      frame = requestAnimationFrame(check)
    }
    frame = requestAnimationFrame(check)

    return () => cancelAnimationFrame(frame)
  }, [])

  return null
}
