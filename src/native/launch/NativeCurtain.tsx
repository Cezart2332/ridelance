import { Box } from '@mui/material'
import { motion, useReducedMotion, type Transition } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import logoDark from '../../assets/logowithmotto-dark.svg'
import { useAppSelector } from '../../store/hooks'
import { BOOT_LOGO_WIDTH, CURTAIN_COLOR, CURVE_HEIGHT, CURVE_PATH, authHeaderHeight } from './curtainGeometry'
import { curtain, useCurtainPhase, type CurtainPhase } from './curtainStore'
import { isAppDestination, isAuthPath } from './launchRoutes'
import { useSafeAreaTop } from './useSafeAreaTop'

/** Cât stă logoul pe ecran la pornire, chiar dacă aplicația e gata mai devreme. */
const MIN_BOOT_MS = 1100
/** Dacă ceva se blochează (rețea, o rută neprevăzută), cortina nu ține aplicația ascunsă mai mult. */
const MAX_WAIT_MS = 8000
/** Pagina de sub cortină apucă să se deseneze înainte să fie dezvăluită. */
const SETTLE_MS = 220

const EASE_CURTAIN: [number, number, number, number] = [0.76, 0, 0.24, 1]
const EASE_COVER: [number, number, number, number] = [0.65, 0, 0.35, 1]

function useViewportHeight() {
  const [height, setHeight] = useState(() => window.innerHeight)
  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return height
}

/**
 * Cortina aplicației mobile: pornirea și trecerea de la login la dashboard.
 *
 * La pornire, ecranul rămâne închis la culoare, cu logoul — continuarea ecranului de start nativ.
 * Apoi, după unde ajunge omul:
 * - nelogat: cortina se strânge în antetul curbat al login-ului (`NativeAuthLayout`);
 * - logat: cortina urcă de pe ecran și lasă dashboardul la vedere.
 *
 * După login, cortina coboară din antet până acoperă tot ecranul, iar după ce se încarcă dashboardul
 * urcă de pe el. Doar în aplicația mobilă — site-ul nu o montează.
 */
export function NativeCurtain() {
  const phase = useCurtainPhase()
  const { pathname } = useLocation()
  const isInitialized = useAppSelector((s) => s.auth.isInitialized)
  const reduceMotion = useReducedMotion() === true
  const viewport = useViewportHeight()
  // La fel ca antetul de login (`NativeAuthLayout`): plus bara de stare, sub care urcă.
  const headerHeight = authHeaderHeight(viewport) + useSafeAreaTop()

  const onAuth = isAuthPath(pathname)
  const [bootElapsed, setBootElapsed] = useState(false)

  // Ecranul static din `index.html` ține locul până se montează React. Cortina arată la fel, deci
  // îl scoatem abia acum, fără ca imaginea să se schimbe.
  useEffect(() => {
    document.getElementById('boot-splash')?.remove()
    const timer = window.setTimeout(() => setBootElapsed(true), reduceMotion ? 0 : MIN_BOOT_MS)
    return () => window.clearTimeout(timer)
  }, [reduceMotion])

  const waiting = phase === 'boot' || phase === 'covered'
  const settled =
    isInitialized && (phase === 'boot' ? onAuth || isAppDestination(pathname) : !onAuth && isAppDestination(pathname))

  useEffect(() => {
    if (!waiting || (phase === 'boot' && !bootElapsed) || !settled) return
    const next: CurtainPhase = phase === 'boot' && onAuth ? 'toHeader' : 'exit'
    const timer = window.setTimeout(() => curtain.set(next), SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [waiting, phase, bootElapsed, settled, onAuth])

  useEffect(() => {
    if (!waiting) return
    const timer = window.setTimeout(() => curtain.set('exit'), MAX_WAIT_MS)
    return () => window.clearTimeout(timer)
  }, [waiting])

  if (phase === 'hidden') return null

  const full = viewport + 2
  const target = {
    boot: { height: full, y: 0 },
    toHeader: { height: headerHeight, y: 0 },
    covering: { height: full, y: 0 },
    covered: { height: full, y: 0 },
    exit: { height: full, y: -(full + CURVE_HEIGHT) },
  }[phase]

  const duration = (seconds: number) => (reduceMotion ? 0.01 : seconds)
  const transition: Transition = {
    boot: { duration: 0 },
    toHeader: { duration: duration(0.8), ease: EASE_CURTAIN, delay: reduceMotion ? 0 : 0.18 },
    covering: { duration: duration(0.55), ease: EASE_COVER },
    covered: { duration: 0 },
    exit: { duration: duration(0.75), ease: EASE_CURTAIN },
  }[phase]

  const onDone = () => {
    if (curtain.phase === 'toHeader' || curtain.phase === 'exit') curtain.set('hidden')
    else if (curtain.phase === 'covering') curtain.covered()
  }

  return (
    <Box
      component={motion.div}
      aria-hidden
      data-testid="native-curtain"
      data-phase={phase}
      // Pornește din antet când acoperă ecranul după login; altfel, de pe tot ecranul.
      initial={phase === 'covering' ? { height: headerHeight, y: 0 } : { height: full, y: 0 }}
      animate={target}
      transition={transition}
      onAnimationComplete={onDone}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1600,
        backgroundColor: CURTAIN_COLOR,
        // Cât e pe ecran, nimic de dedesubt nu se apasă.
        pointerEvents: 'auto',
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        sx={{ position: 'absolute', top: '100%', left: 0, width: '100%', height: CURVE_HEIGHT, display: 'block', mt: '-1px' }}
      >
        <path d={CURVE_PATH} fill={CURTAIN_COLOR} />
      </Box>

      <Box
        component={motion.img}
        src={logoDark}
        alt=""
        initial={false}
        animate={phase === 'boot' ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
        transition={{ duration: duration(0.28), ease: 'easeOut' }}
        sx={{
          position: 'absolute',
          left: '50%',
          top: viewport / 2,
          width: BOOT_LOGO_WIDTH,
          height: 'auto',
          translate: '-50% -50%',
          pointerEvents: 'none',
        }}
      />
    </Box>
  )
}
