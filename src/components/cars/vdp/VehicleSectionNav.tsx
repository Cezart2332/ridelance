import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useState } from 'react'

import { TOKENS } from '../../../constants/tokens'
import { formatLei } from '../../../utils/vehiclePricing'
import { VDP } from './vdpLayout'

/**
 * Bara de secțiuni, lipită sub headerul site-ului (spec §2, stările 2 și 3).
 *
 * Face două lucruri: spune unde ești în pagină și, după ce galeria a ieșit din ecran, ține prețul
 * și acțiunea la îndemână — momentul în care cardul din dreapta poate fi deja departe.
 *
 * Secțiunea activă se citește cu `IntersectionObserver`, nu cu un ascultător de `scroll`: la fel de
 * precis, dar fără să rulăm cod la fiecare pixel derulat.
 */

export interface NavSection {
  id: string
  label: string
}

interface VehicleSectionNavProps {
  sections: NavSection[]
  /** Elementul care, odată ieșit din ecran, aduce prețul în bară (galeria). */
  priceAnchor: HTMLElement | null
  pricePerWeek: number
  oldPrice?: number | null
  discounted: boolean
  ctaLabel: string
  onCta: () => void
}

export function VehicleSectionNav({
  sections,
  priceAnchor,
  pricePerWeek,
  oldPrice,
  discounted,
  ctaLabel,
  onCta,
}: VehicleSectionNavProps) {
  const [active, setActive] = useState(sections[0]?.id ?? '')
  const [showPrice, setShowPrice] = useState(false)

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Secțiunea activă e cea mai de sus dintre cele vizibile: la scroll în jos, titlul care
        // tocmai a trecut de bară trebuie să preia underline-ul.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: `-${VDP.headerOffset.md + 8}px 0px -55% 0px`, threshold: 0 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [sections])

  useEffect(() => {
    if (!priceAnchor) return

    const observer = new IntersectionObserver(
      ([entry]) => setShowPrice(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    )

    observer.observe(priceAnchor)
    return () => observer.disconnect()
  }, [priceAnchor])

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (sections.length === 0) return null

  return (
    <Box
      sx={{
        position: 'sticky',
        top: { xs: VDP.siteHeader.xs, md: VDP.siteHeader.md },
        zIndex: 10,
        height: VDP.subnavHeight,
        backgroundColor: TOKENS.paper,
        borderBottom: `1px solid ${TOKENS.border}`,
        boxShadow: showPrice ? TOKENS.shadow.sm : 'none',
        transition: `box-shadow ${TOKENS.duration} ${TOKENS.easing}`,
      }}
    >
      <Box
        sx={{
          maxWidth: VDP.maxWidth,
          height: '100%',
          mx: 'auto',
          px: `${VDP.gutter}px`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={3}
          sx={{
            height: '100%',
            alignItems: 'stretch',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {sections.map((section) => {
            const isActive = section.id === active
            return (
              <Box
                key={section.id}
                component="button"
                type="button"
                onClick={() => goTo(section.id)}
                aria-current={isActive ? 'true' : undefined}
                sx={{
                  border: 'none',
                  background: 'none',
                  p: 0,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isActive ? TOKENS.ink : TOKENS.textMuted,
                  transition: `color ${TOKENS.duration} ${TOKENS.easing}`,
                  '&:hover': { color: TOKENS.ink },
                  // Underline-ul de 2px care se mută pe măsură ce derulezi.
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 2,
                    backgroundColor: isActive ? TOKENS.ink : 'transparent',
                  },
                }}
              >
                {section.label}
              </Box>
            )
          })}
        </Stack>

        {/* Rezumatul de preț apare abia când prețul real a ieșit din ecran. */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            ml: 'auto',
            alignItems: 'center',
            display: { xs: 'none', md: 'flex' },
            opacity: showPrice ? 1 : 0,
            pointerEvents: showPrice ? 'auto' : 'none',
            transition: `opacity 200ms ${TOKENS.easing}`,
          }}
        >
          <Box sx={{ textAlign: 'right' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
              {discounted && oldPrice != null && (
                <Typography
                  sx={{ fontSize: '0.85rem', color: TOKENS.textSubtle, textDecoration: 'line-through' }}
                >
                  {formatLei(oldPrice)}
                </Typography>
              )}
              <Typography
                sx={{
                  fontWeight: 800,
                  color: TOKENS.ink,
                  textDecoration: 'underline',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              >
                {formatLei(pricePerWeek)} lei
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: '0.72rem', color: TOKENS.textSubtle, lineHeight: 1.2 }}>
              pe săptămână, fără plată online
            </Typography>
          </Box>

          <Button
            onClick={onCta}
            variant="contained"
            sx={{
              px: 2.5,
              py: 1,
              flexShrink: 0,
              borderRadius: `${TOKENS.radius.full}px`,
              fontWeight: 800,
              textTransform: 'none',
              boxShadow: 'none',
              backgroundColor: TOKENS.primaryStrong,
              '&:hover': { backgroundColor: TOKENS.primaryStrong, boxShadow: TOKENS.shadow.glow },
            }}
          >
            {ctaLabel}
          </Button>
        </Stack>
      </Box>

      {/* Umbra de sub bară, ca separarea să se vadă peste conținut deschis la culoare. */}
      <Box
        sx={{
          height: 1,
          backgroundColor: alpha(TOKENS.ink, 0.02),
        }}
      />
    </Box>
  )
}
