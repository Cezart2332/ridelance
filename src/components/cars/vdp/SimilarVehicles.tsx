import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { TOKENS } from '../../../constants/tokens'
import { carsService, getCarImageUrl, type Car } from '../../../services/cars.service'
import { isCarRentDisabled } from '../../../utils/carLabels'
import { formatLei } from '../../../utils/vehiclePricing'

/**
 * Mașini similare (spec §16): aceeași categorie de platformă, preț săptămânal în ±20%, doar cele
 * încă disponibile.
 *
 * Se încarcă după ce secțiunea intră în viewport — e conținut de subsol, n-are ce căuta în timpul
 * de încărcare al paginii. Fiecare card e un link real: click-ul duce pe alt VDP, care își
 * numără singur vizualizarea.
 */

const PRICE_TOLERANCE = 0.2
const MAX_ITEMS = 8

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

  return (
    <Box ref={setRef}>
      {items.length > 0 && (
        <Stack spacing={2}>
          <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 800, color: TOKENS.ink }}>
            Mașini similare
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            sx={{
              overflowX: 'auto',
              pb: 1,
              scrollSnapType: 'x proximity',
              scrollbarWidth: 'thin',
            }}
          >
            {items.map((item) => (
              <SimilarCard key={item.id} car={item} />
            ))}
          </Stack>
        </Stack>
      )}
    </Box>
  )
}

function SimilarCard({ car }: { car: Car }) {
  const cover = car.images[0]

  return (
    <Box
      component={Link}
      to={`/masini/${car.slug}`}
      sx={{
        flex: '0 0 220px',
        scrollSnapAlign: 'start',
        textDecoration: 'none',
        borderRadius: `${TOKENS.radius.lg}px`,
        border: `1px solid ${TOKENS.border}`,
        backgroundColor: TOKENS.paper,
        overflow: 'hidden',
        transition: `box-shadow ${TOKENS.duration} ${TOKENS.easing}`,
        '&:hover': { boxShadow: TOKENS.shadow.lg },
      }}
    >
      <Box sx={{ aspectRatio: '4 / 3', backgroundColor: TOKENS.surfaceAlt, display: 'grid', placeItems: 'center' }}>
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

      <Box sx={{ p: 1.5 }}>
        <Typography noWrap sx={{ fontWeight: 700, color: TOKENS.ink }}>
          {car.brand} {car.model}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textSubtle }}>
          {car.year} · {car.location}
        </Typography>
        <Typography sx={{ mt: 0.75, fontWeight: 800, color: TOKENS.ink }}>
          {formatLei(car.pricePerWeek)} lei{' '}
          <Box component="span" sx={{ fontWeight: 500, color: TOKENS.textMuted, fontSize: '0.8rem' }}>
            / săptămână
          </Box>
        </Typography>
      </Box>
    </Box>
  )
}
