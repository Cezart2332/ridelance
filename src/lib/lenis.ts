import Lenis from '@studio-freight/lenis'

let lenis: Lenis | null = null
let rafId = 0

function onAnimationFrame(time: number) {
  lenis?.raf(time)
  rafId = window.requestAnimationFrame(onAnimationFrame)
}

export function initLenis() {
  if (typeof window === 'undefined' || lenis) {
    return lenis
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    return null
  }

  lenis = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.4,
  })

  rafId = window.requestAnimationFrame(onAnimationFrame)
  return lenis
}

export function scrollToTarget(target: string | number | HTMLElement, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.1 })
    return
  }

  if (typeof window === 'undefined') {
    return
  }

  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' })
    return
  }

  const element =
    typeof target === 'string' ? document.querySelector(target) : target

  if (!(element instanceof HTMLElement)) {
    return
  }

  const top = element.getBoundingClientRect().top + window.scrollY + offset
  window.scrollTo({ top, behavior: 'smooth' })
}

export function destroyLenis() {
  if (rafId) {
    window.cancelAnimationFrame(rafId)
    rafId = 0
  }

  lenis?.destroy()
  lenis = null
}