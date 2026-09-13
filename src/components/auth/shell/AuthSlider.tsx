import { useEffect, useState } from 'react'
import { Box, ButtonBase, Link, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { TOKENS } from '../../../constants/tokens'

interface AuthSlide {
  /** Imaginea de fundal. Cât lipsește, slide-ul are un gradient din culorile platformei. */
  image: string | null
  caption: [string, string]
}

/**
 * Cele trei slide-uri din stânga cardului.
 *
 * Imaginile vin separat, în formatul panoului (portret, cam 4:5). Până atunci `image` e `null`,
 * iar fiecare slide are un gradient propriu, ca trecerea de la unul la altul să se vadă.
 */
const SLIDES: AuthSlide[] = [
  { image: null, caption: ['Tot businessul tău de ridesharing.', 'Într-un singur loc.'] },
  { image: null, caption: ['Pentru șoferi PFA și flote.', 'Simplu, dintr-un singur dashboard.'] },
  { image: null, caption: ['Independent.', 'Dar nu singur.'] },
]

const PLACEHOLDER_GRADIENTS = [
  `linear-gradient(165deg, #C9EEFC 0%, ${TOKENS.primary} 55%, ${TOKENS.primaryStrong} 100%)`,
  `linear-gradient(200deg, #DDF4FD 0%, #8BDCF8 45%, ${TOKENS.primaryStrong} 100%)`,
  `linear-gradient(145deg, #B5E7FA 0%, ${TOKENS.primary} 50%, #2E9FCB 100%)`,
]

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
        backgroundColor: TOKENS.primary,
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
            background: slide.image
              ? `center / cover no-repeat url(${slide.image})`
              : PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length],
          }}
        />
      ))}

      {/* Văl jos, sub text: pe o fotografie deschisă, albul n-ar mai avea contrast. */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, transparent 50%, ${alpha('#0E5A7A', 0.55)} 100%)`,
        }}
      />

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

      <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 36, px: 4, textAlign: 'center' }}>
        <Box sx={{ position: 'relative', minHeight: 64 }}>
          {SLIDES.map((slide, index) => (
            <Typography
              key={index}
              aria-hidden={index !== active}
              sx={{
                position: index === 0 ? 'relative' : 'absolute',
                inset: 0,
                color: '#fff',
                fontSize: { md: '1.45rem', lg: '1.6rem' },
                fontWeight: 500,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
                opacity: index === active ? 1 : 0,
                transform: index === active ? 'translateY(0)' : 'translateY(8px)',
                transition: `opacity 500ms ${TOKENS.easing}, transform 500ms ${TOKENS.easing}`,
              }}
            >
              {slide.caption[0]}
              <br />
              {slide.caption[1]}
            </Typography>
          ))}
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
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
                  backgroundColor: index === active ? '#fff' : alpha('#fff', 0.35),
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
