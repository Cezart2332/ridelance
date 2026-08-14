import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { TOKENS } from '../../../constants/tokens'
import { carsService, getCarImageUrl, type Car } from '../../../services/cars.service'
import { isCarRentDisabled } from '../../../utils/carLabels'
import { formatLei } from '../../../utils/vehiclePricing'
import { VDP } from './vdpLayout'

/**
 * Mașini similare (spec §8 și §16 din specul funcțional): aceeași categorie de platformă, preț
 * săptămânal în ±20%, doar cele încă disponibile.
 *
 * Se încarcă după ce secțiunea intră în viewport — e conținut de subsol, n-are ce căuta în timpul
 * de încărcare al paginii. Fiecare card e un link real: click-ul duce pe alt VDP, care își
 * numără singur vizualizarea.
 */

const PRICE_TOLERANCE = 0.2
const MAX_ITEMS = 8
const CARD_WIDTH = 240

function isSimilar(candidate: Car, current: Car): boolean {
  if (candidate.id === current.id) return false
  if (!candidate.active || isCarRentDisabled(candidate.status)) return false

  const low = current.pricePerWeek * (1 - PRICE_TOLERANCE)
  const high = current.pricePerWeek * (1 + PRICE_TOLERANCE)
  if (candidate.pricePerWeek < low || candidate.pricePerWeek > high) return false

  const currentCategories = [...current.uberCategories, ...current.boltCategories]
  if (currentCategories.length === 0) return true

  return [...candidate.uberCategories, ...candidate.boltCategories].some((category) =>
    currentCategories.includes(category),
  )
}

export function SimilarVehicles({ car }: { car: Car }) {
  const [items, setItems] = useState<Car[]>([])
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [edge, setEdge] = useState<{ start: boolean; end: boolean }>({ start: true, end: false })

  useEffect(() => {
    if (!ref || visible) return

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true)
        observer.disconnect()
      }
    })

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, visible])

  useEffect(() => {
    if (!visible) return

    let cancelled = false
    carsService
      .getAll()
      .then((cars) => {
        if (cancelled) return
        setItems(cars.filter((candidate) => isSimilar(candidate, car)).slice(0, MAX_ITEMS))
      })
      .catch(() => {
        // Secțiune secundară: dacă nu se încarcă, pagina rămâne întreagă fără ea.
      })

    return () => {
      cancelled = true
    }
  }, [visible, car])

  // Săgețile se dezactivează la capete; poziția se citește din scroll, nu dintr-un index propriu.
  useEffect(() => {
    const track = trackRef.current
    if (!track || items.length === 0) return

    const update = () => {
      const maxScroll = track.scrollWidth - track.clientWidth
      setEdge({ start: track.scrollLeft <= 4, end: track.scrollLeft >= maxScroll - 4 })
    }

    update()
    track.addEventListener('scroll', update, { passive: true })
    return () => track.removeEventListener('scroll', update)
  }, [items])

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' })
  }

  return (
    <Box
      ref={setRef}
      id="similare"
      sx={{ scrollMarginTop: { xs: VDP.headerOffset.xs + 16, md: VDP.headerOffset.md + 16 } }}
    >
      {items.length > 0 && (
        <>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}
          >
            <Typography
              variant="h2"
              sx={{ fontSize: 21, lineHeight: 1.25, color: TOKENS.ink, ...VDP.display }}
            >
              Mașini similare
            </Typography>

            <Stack direction="row" spacing={1}>
              <Arrow
                label="Înapoi"
                disabled={edge.start}
                onClick={() => scrollByPage(-1)}
                icon={<ChevronLeftRoundedIcon fontSize="small" />}
              />
              <Arrow
                label="Înainte"
                disabled={edge.end}
                onClick={() => scrollByPage(1)}
                icon={<ChevronRightRoundedIcon fontSize="small" />}
              />
            </Stack>
          </Stack>

          <Stack
            ref={trackRef}
            direction="row"
            spacing={2}
            sx={{
              overflowX: 'auto',
              pb: 1,
              scrollSnapType: 'x proximity',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {items.map((item) => (
              <SimilarCard key={item.id} car={item} />
            ))}
          </Stack>
        </>
      )}
    </Box>
  )
}

function Arrow({
  label,
  disabled,
  onClick,
  icon,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      sx={{
        border: `1px solid ${TOKENS.border}`,
        color: TOKENS.ink,
        '&.Mui-disabled': { color: TOKENS.textSubtle, borderColor: TOKENS.border },
        '&:hover': { backgroundColor: alpha(TOKENS.ink, 0.03) },
      }}
    >
      {icon}
    </IconButton>
  )
}

function SimilarCard({ car }: { car: Car }) {
  const cover = car.images[0]

  return (
    <Box
      component={Link}
      to={`/masini/${car.slug}`}
      sx={{
        flex: `0 0 ${CARD_WIDTH}px`,
        scrollSnapAlign: 'start',
        textDecoration: 'none',
      }}
    >
      <Box
        sx={{
          aspectRatio: '16 / 10',
          borderRadius: `${VDP.radius.image}px`,
          overflow: 'hidden',
          backgroundColor: TOKENS.surfaceAlt,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {cover ? (
          <Box
            component="img"
            src={getCarImageUrl(cover.imageUrl)}
            alt={`${car.brand} ${car.model} ${car.year}`}
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <DirectionsCarFilledRoundedIcon sx={{ fontSize: 40, color: TOKENS.textSubtle }} />
        )}
      </Box>

      <Typography noWrap sx={{ mt: 1.25, fontWeight: 800, color: TOKENS.ink }}>
        {car.brand} {car.model}
      </Typography>
      <Typography noWrap sx={{ fontSize: '0.82rem', color: TOKENS.textMuted }}>
        {car.year} · {car.engine} · {formatLei(car.pricePerWeek)} lei/săpt.
      </Typography>
    </Box>
  )
}
