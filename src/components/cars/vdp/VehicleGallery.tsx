import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded'
import { Box, Button, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'

import { TOKENS } from '../../../constants/tokens'
import { getCarImageUrl, type CarImage } from '../../../services/cars.service'
import { altFor } from './galleryAlt'

/**
 * Galeria din capul paginii (spec §3).
 *
 * Pe desktop, un grid de 4×2 în care prima poză ocupă un sfert de ecran; pe mobil, un carusel cu
 * `scroll-snap`, fiindcă săgețile peste o imagine de 390px sunt mai mult în drum decât de ajutor.
 *
 * Containerul are raport fix: pozele se încarcă la lățimi diferite, iar fără raport pagina ar sări
 * în momentul în care sosesc. Degradarea sub cinci poze e explicită — un grid cu celule goale
 * arată ca un bug, nu ca un anunț cu puține fotografii.
 */

interface VehicleGalleryProps {
  images: CarImage[]
  /** „Dacia Logan 2022” — intră în `alt`-ul fiecărei imagini. */
  title: string
  onOpen: (index: number) => void
}

export function VehicleGallery({ images, title, onOpen }: VehicleGalleryProps) {
  if (images.length === 0) {
    return <EmptyGallery />
  }

  return (
    <>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DesktopGallery images={images} title={title} onOpen={onOpen} />
      </Box>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <MobileGallery images={images} title={title} onOpen={onOpen} />
      </Box>
    </>
  )
}

function GalleryImage({
  image,
  alt,
  priority,
  onClick,
}: {
  image: CarImage
  alt: string
  priority: boolean
  onClick: () => void
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={`Deschide ${alt}`}
      sx={{
        display: 'block',
        p: 0,
        border: 'none',
        width: '100%',
        height: '100%',
        cursor: 'zoom-in',
        overflow: 'hidden',
        backgroundColor: TOKENS.surfaceAlt,
      }}
    >
      <Box
        component="img"
        src={getCarImageUrl(image.imageUrl)}
        alt={alt}
        // Prima imagine e LCP-ul paginii; restul pot aștepta scroll-ul.
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: `transform ${TOKENS.duration} ${TOKENS.easing}`,
          '&:hover': { transform: 'scale(1.03)' },
        }}
      />
    </Box>
  )
}

function DesktopGallery({ images, title, onOpen }: VehicleGalleryProps) {
  const total = images.length
  const hasHero = total >= 5
  const shown = hasHero ? images.slice(0, 5) : images.slice(0, 4)

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          display: 'grid',
          gap: '6px',
          aspectRatio: total === 1 ? '16 / 9' : '2 / 1',
          borderRadius: `${TOKENS.radius.xl}px`,
          overflow: 'hidden',
          gridTemplateColumns: total === 1 ? '1fr' : hasHero ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
          gridTemplateRows: total <= 2 ? '1fr' : 'repeat(2, 1fr)',
        }}
      >
        {shown.map((image, index) => (
          <Box
            key={image.id}
            sx={
              hasHero && index === 0
                ? { gridColumn: 'span 2', gridRow: 'span 2', minHeight: 0 }
                : { minHeight: 0 }
            }
          >
            <GalleryImage
              image={image}
              alt={altFor(title, index, total)}
              priority={index === 0}
              onClick={() => onOpen(index)}
            />
          </Box>
        ))}
      </Box>

      {total > shown.length && (
        <Button
          onClick={() => onOpen(0)}
          startIcon={<PhotoLibraryRoundedIcon />}
          sx={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            px: 2,
            py: 1,
            fontWeight: 700,
            textTransform: 'none',
            color: TOKENS.ink,
            borderRadius: `${TOKENS.radius.md}px`,
            backgroundColor: alpha('#FFFFFF', 0.92),
            boxShadow: TOKENS.shadow.md,
            '&:hover': { backgroundColor: '#FFFFFF' },
          }}
        >
          Vezi toate pozele ({total})
        </Button>
      )}
    </Box>
  )
}

function MobileGallery({ images, title, onOpen }: VehicleGalleryProps) {
  const total = images.length
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement | null>(null)

  // Contorul urmărește scroll-ul real, nu invers: swipe-ul e al browserului, noi doar îl citim.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onScroll = () => {
      const index = Math.round(track.scrollLeft / track.clientWidth)
      setActive(Math.min(Math.max(index, 0), total - 1))
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [total])

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        ref={trackRef}
        sx={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          aspectRatio: '4 / 3',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {images.map((image, index) => (
          <Box key={image.id} sx={{ flex: '0 0 100%', scrollSnapAlign: 'center' }}>
            <GalleryImage
              image={image}
              alt={altFor(title, index, total)}
              priority={index === 0}
              onClick={() => onOpen(index)}
            />
          </Box>
        ))}
      </Box>

      {total > 1 && (
        <Typography
          sx={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            px: 1.25,
            py: 0.4,
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#FFFFFF',
            borderRadius: `${TOKENS.radius.full}px`,
            backgroundColor: alpha(TOKENS.ink, 0.6),
          }}
        >
          {active + 1} / {total}
        </Typography>
      )}
    </Box>
  )
}

function EmptyGallery() {
  return (
    <Box
      sx={{
        aspectRatio: '16 / 9',
        display: 'grid',
        placeItems: 'center',
        borderRadius: `${TOKENS.radius.xl}px`,
        border: `1px dashed ${TOKENS.borderHover}`,
        backgroundColor: TOKENS.surfaceAlt,
      }}
    >
      <Box sx={{ textAlign: 'center', color: TOKENS.textSubtle }}>
        <DirectionsCarFilledRoundedIcon sx={{ fontSize: 64 }} />
        <Typography sx={{ fontWeight: 600 }}>Fotografii în curs de adăugare</Typography>
      </Box>
    </Box>
  )
}
