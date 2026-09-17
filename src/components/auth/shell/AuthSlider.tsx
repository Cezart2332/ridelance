import { useEffect, useState } from 'react'
import { Box, ButtonBase, Link } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { TOKENS } from '../../../constants/tokens'
import login1 from '../../../assets/auth/login-1.webp'
import login2 from '../../../assets/auth/login-2.webp'
import login3 from '../../../assets/auth/login-3.webp'

interface AuthSlide {
  image: string
  /** Textul din imagine, pentru cititoarele de ecran — pe slide e desenat în poză. */
  caption: string
}

/**
 * Cele trei slide-uri din stânga cardului: platforma, PFA, SRL.
 *
 * Titlurile sunt desenate în imagini, deci peste ele nu se mai pune text și nici vălul întunecat
 * care îi dădea contrast. Imaginile sunt portret (2:3) și se așază întregi (`contain`) pe un fundal
 * cu nuanța marginilor lor: tăiate (`cover`) își pierdeau fie ilustrația, fie titlul, după cât de
 * înalt iese formularul din dreapta.
 */
const SLIDES: AuthSlide[] = [
  { image: login1, caption: 'Platforma ta. Tot businessul tău. Într-un singur loc.' },
  { image: login2, caption: 'Pentru PFA. PFA-ul tău. Mai simplu, zi de zi.' },
  { image: login3, caption: 'Pentru SRL și flote. Flota ta. Totul sub control.' },
]

/** Nuanțele marginilor imaginilor, de sus în jos. */
const SLIDE_BACKGROUND = 'linear-gradient(180deg, #DEF1FE 0%, #F6FBFE 50%, #F2F9FE 72%, #D8EFFE 100%)'

const INTERVAL_MS = 6000

/** Ascuns vizual, citit de cititoarele de ecran. */
const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const

export function AuthSlider() {
  const [active, setActive] = useState(0)

  // Pornește din nou numărătoarea la fiecare schimbare, inclusiv la click pe indicator: altfel
  // slide-ul ales de mână ar putea pleca după o secundă.
  useEffect(() => {
    const timer = setTimeout(() => setActive((current) => (current + 1) % SLIDES.length), INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [active])

  return (
    <Box
      component="aside"
      aria-roledescription="carusel"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: `${TOKENS.radius.xl}px`,
        background: SLIDE_BACKGROUND,
        minHeight: 560,
        height: '100%',
      }}
    >
      {SLIDES.map((slide, index) => (
        <Box
          key={index}
          aria-hidden={index !== active}
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: index === active ? 1 : 0,
            transform: index === active ? 'scale(1)' : 'scale(1.04)',
            transition: `opacity 700ms ${TOKENS.easing}, transform 1200ms ${TOKENS.easing}`,
          }}
        >
          {/* Marginile pozei se topesc în fundal: altfel laturile lăsate libere de `contain` se
              vedeau ca două benzi. */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `center / contain no-repeat url(${slide.image})`,
              maskImage: 'linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%)',
            }}
          />
        </Box>
      ))}

      <Link
        component={RouterLink}
        to="/"
        underline="none"
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.75,
          py: 0.75,
          borderRadius: `${TOKENS.radius.full}px`,
          fontSize: '0.82rem',
          fontWeight: 600,
          color: TOKENS.ink,
          backgroundColor: alpha('#fff', 0.85),
          backdropFilter: 'blur(8px)',
          boxShadow: TOKENS.shadow.sm,
          transition: `background-color ${TOKENS.duration} ${TOKENS.easing}`,
          '&:hover': { backgroundColor: '#fff' },
        }}
      >
        Înapoi la site
        <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
      </Link>

      <Box component="p" sx={visuallyHidden}>
        {SLIDES[active].caption}
      </Box>

      <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 16, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          {SLIDES.map((_, index) => (
            <ButtonBase
              key={index}
              aria-label={`Slide ${index + 1} din ${SLIDES.length}`}
              aria-current={index === active}
              onClick={() => setActive(index)}
              sx={{ py: 1 }}
            >
              <Box
                sx={{
                  width: index === active ? 36 : 22,
                  height: 4,
                  borderRadius: `${TOKENS.radius.full}px`,
                  backgroundColor: index === active ? TOKENS.primaryStrong : alpha(TOKENS.ink, 0.15),
                  transition: `all 300ms ${TOKENS.easing}`,
                }}
              />
            </ButtonBase>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
