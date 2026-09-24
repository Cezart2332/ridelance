import { Box } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { useEffect, useState, type ReactNode } from 'react'

import logoDark from '../../assets/logowithmotto-dark.svg'
import { AUTH_COLORS, AUTH_FORM_CONTENT } from '../../components/auth/shell/authShellSx'
import { CURTAIN_COLOR, CURVE_HEIGHT, CURVE_PATH, authHeaderHeight } from './curtainGeometry'
import { useCurtainPhase } from './curtainStore'

const rise = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
`

const fade = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: none; }
`

/** Pasul dintre elementele formularului care intră pe rând. */
const STAGGER_S = 0.07

/**
 * Autentificarea în aplicația mobilă: antet închis la culoare, cu marginea de jos curbată, și
 * formularul dedesubt.
 *
 * Antetul are exact forma în care se strânge cortina de la pornire (`NativeCurtain`), deci trecerea
 * nu sare. Logoul din antet și formularul intră abia după ce cortina a terminat — până atunci ar fi
 * fost oricum sub ea.
 */
export function NativeAuthLayout({ children }: { children: ReactNode }) {
  const phase = useCurtainPhase()
  const [viewport, setViewport] = useState(() => window.innerHeight)
  useEffect(() => {
    const onResize = () => setViewport(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Cortina e încă peste ecran la pornire: conținutul așteaptă. După login, cortina acoperă ecranul
  // de pe loc, deci conținutul rămâne cum e.
  const ready = phase === 'hidden' || phase === 'covering' || phase === 'covered' || phase === 'exit'
  const headerHeight = authHeaderHeight(viewport)

  const enter = (animation: string, delay: number) =>
    ready
      ? { animation: `${animation} .55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both` }
      : { opacity: 0 }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: AUTH_COLORS.page, color: AUTH_COLORS.text }}>
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <Box
          sx={{
            height: headerHeight,
            backgroundColor: CURTAIN_COLOR,
            display: 'flex',
            alignItems: 'flex-end',
            px: 3,
            pb: 1,
          }}
        >
          <Box
            component="img"
            src={logoDark}
            alt="RIDElance — Independent. Dar nu singur."
            sx={{ width: 168, height: 'auto', display: 'block', ...enter(fade, 0) }}
          />
        </Box>
        <Box component="svg" viewBox="0 0 100 100" preserveAspectRatio="none" sx={{ display: 'block', width: '100%', height: CURVE_HEIGHT, mt: '-1px' }}>
          <path d={CURVE_PATH} fill={CURTAIN_COLOR} />
        </Box>
      </Box>

      <Box
        component="main"
        sx={{
          flex: 1,
          px: 3,
          pt: 1,
          pb: 4,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: AUTH_FORM_CONTENT,
            mx: 'auto',
            // Fiecare bloc al formularului (titlul, câmpurile, bifa, butonul) intră pe rând.
            '& > *:not(form), & form > *': ready ? undefined : { opacity: 0 },
            ...(ready && {
              '& > *:not(form)': { animation: `${rise} .55s cubic-bezier(0.22, 1, 0.36, 1) both` },
              '& > *:nth-of-type(1)': { animationDelay: `${STAGGER_S}s` },
              '& form > *': { animation: `${rise} .55s cubic-bezier(0.22, 1, 0.36, 1) both` },
              '& form > *:nth-of-type(1)': { animationDelay: `${STAGGER_S * 2}s` },
              '& form > *:nth-of-type(2)': { animationDelay: `${STAGGER_S * 3}s` },
              '& form > *:nth-of-type(3)': { animationDelay: `${STAGGER_S * 4}s` },
              '& > *:last-child:not(form)': { animationDelay: `${STAGGER_S * 5}s` },
            }),
            '@media (prefers-reduced-motion: reduce)': {
              '& > *:not(form), & form > *': { animation: 'none !important', opacity: '1 !important' },
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
