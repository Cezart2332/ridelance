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
  label: string
  /** Cele două rânduri ale titlului. */
  title: [string, string]
  text: string
}

/**
 * Cele trei slide-uri din stânga cardului: platforma, PFA, SRL.
 *
 * Imaginile sunt doar ilustrația, fără text: umplu tot chenarul (`cover`), prinse de marginea de
 * sus, unde stă ilustrația. Textul e scris peste ele, jos, pe un văl deschis care topește podiumul
 * în fundal și îi dă contrast.
 */
const SLIDES: AuthSlide[] = [
  {
    image: login1,
    label: 'Platforma ta',
    title: ['Tot businessul tău.', 'Într-un singur loc.'],
    text: 'Mașini, administrare și beneficii pentru PFA-uri și flote.',
  },
  {
    image: login2,
    label: 'Pentru PFA',
    title: ['PFA-ul tău.', 'Mai simplu, zi de zi.'],
    text: 'Gestionează veniturile, cheltuielile și documentele dintr-un singur loc.',
  },
  {
    image: login3,
    label: 'Pentru SRL și flote',
    title: ['Flota ta.', 'Totul sub control.'],
    text: 'Gestionează mașinile, închirierile și documentele într-un singur loc.',
  },
]

/** Nuanța de jos a imaginilor: se vede doar până se încarcă poza. */
const SLIDE_BACKGROUND = '#EEF7FE'

/** Vălul de sub text: transparent peste ilustrație, plin în dreptul titlului. */
const TEXT_VEIL = `linear-gradient(180deg, ${alpha(SLIDE_BACKGROUND, 0)} 0%, ${alpha(SLIDE_BACKGROUND, 0.94)} 30%, ${SLIDE_BACKGROUND} 100%)`

const TITLE_COLOR = '#0B1B4D'

/** Albastrul platformei, închis cât să se citească pe fundalul deschis. */
const LABEL_COLOR = '#1A8FE3'

const INTERVAL_MS = 6000

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
        minHeight: 'var(--auth-slider-min-height, 560px)',
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
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `center top / cover no-repeat url(${slide.image})`,
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              px: { md: 3.5, lg: 4.5 },
              pt: 7,
              pb: 5.5,
              background: TEXT_VEIL,
            }}
          >
            <Box
              sx={{
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: LABEL_COLOR,
              }}
            >
              {slide.label}
            </Box>
            <Box
              component="p"
              sx={{
                m: 0,
                mt: 1,
                fontSize: { md: '1.6rem', lg: '1.9rem' },
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                color: TITLE_COLOR,
              }}
            >
              {slide.title[0]}
              <br />
              {slide.title[1]}
            </Box>
            <Box
              component="p"
              sx={{
                m: 0,
                mt: 1,
                fontSize: '0.9rem',
                lineHeight: 1.4,
                color: alpha(TITLE_COLOR, 0.72),
              }}
            >
              {slide.text}
            </Box>
          </Box>
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
