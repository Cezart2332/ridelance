import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { Box, Button, IconButton, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'

import { TOKENS } from '../../../constants/tokens'
import { getCarImageUrl, type CarImage } from '../../../services/cars.service'
import { altFor } from './galleryAlt'
import { VDP } from './vdpLayout'

/**
 * Galeria din capul paginii (spec §3).
 *
 * Pe desktop, o grilă asimetrică: fotografia principală ocupă două treimi, iar celelalte două stau
 * stivuite în dreapta. Pe mobil devine carusel `scroll-snap` cu puncte — săgețile peste o imagine
 * de 390px sunt mai mult în drum decât de ajutor.
 *
 * Containerul are raport fix pentru că pozele sosesc la lățimi diferite: fără el, tot ce e sub
 * galerie sare în momentul încărcării.
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
        borderRadius: `${VDP.radius.image}px`,
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
          transition: `transform 400ms ${TOKENS.easing}`,
          '&:hover': { transform: 'scale(1.02)' },
        }}
      />
    </Box>
  )
}

function DesktopGallery({ images, title, onOpen }: VehicleGalleryProps) {
  const total = images.length
  // Grila asimetrică are sens de la trei poze în sus; sub asta, celulele goale ar arăta a bug.
  const asymmetric = total >= 3
  const shown = asymmetric ? images.slice(0, 3) : images.slice(0, 2)

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          display: 'grid',
          gap: '8px',
          aspectRatio: '16 / 10',
          gridTemplateColumns: total === 1 ? '1fr' : '2fr 1fr',
          gridTemplateRows: asymmetric ? 'repeat(2, 1fr)' : '1fr',
        }}
      >
        {shown.map((image, index) => (
          <Box
            key={image.id}
            sx={asymmetric && index === 0 ? { gridRow: 'span 2', minHeight: 0 } : { minHeight: 0 }}
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

      <ShareButton title={title} />

      {total > 1 && (
        <Button
          onClick={() => onOpen(0)}
          startIcon={<PhotoCameraOutlinedIcon />}
          sx={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            px: 2,
            py: 1,
            fontWeight: 700,
            textTransform: 'none',
            color: TOKENS.ink,
            borderRadius: `${TOKENS.radius.full}px`,
            backgroundColor: '#FFFFFF',
            boxShadow: TOKENS.shadow.md,
            '&:hover': { backgroundColor: '#FFFFFF', boxShadow: TOKENS.shadow.lg },
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

  // Punctele urmăresc scroll-ul real, nu invers: swipe-ul e al browserului, noi doar îl citim.
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
          gap: '4px',
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

      <ShareButton title={title} />

      {total > 1 && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 12,
            display: 'flex',
            justifyContent: 'center',
            gap: 0.75,
          }}
        >
          {images.map((image, index) => (
            <Box
              key={image.id}
              sx={{
                width: index === active ? 18 : 6,
                height: 6,
                borderRadius: `${TOKENS.radius.full}px`,
                backgroundColor: index === active ? '#FFFFFF' : alpha('#FFFFFF', 0.55),
                boxShadow: `0 1px 2px ${alpha(TOKENS.ink, 0.25)}`,
                transition: `width 200ms ${TOKENS.easing}`,
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

/**
 * Butonul rotund din colțul galeriei. În locul inimii din spec: nu avem favorite, dar o pagină de
 * anunț chiar se trimite mai departe.
 */
function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <IconButton
      onClick={share}
      aria-label={copied ? 'Link copiat' : 'Trimite anunțul'}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        color: TOKENS.ink,
        boxShadow: TOKENS.shadow.md,
        '&:hover': { backgroundColor: '#FFFFFF', boxShadow: TOKENS.shadow.lg },
      }}
    >
      {copied ? <CheckRoundedIcon fontSize="small" /> : <IosShareRoundedIcon fontSize="small" />}
    </IconButton>
  )
}

function EmptyGallery() {
  return (
    <Box
      sx={{
        aspectRatio: '16 / 10',
        display: 'grid',
        placeItems: 'center',
        borderRadius: `${VDP.radius.image}px`,
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
