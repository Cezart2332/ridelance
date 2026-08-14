import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, Dialog, IconButton, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useState } from 'react'

import { TOKENS } from '../../../constants/tokens'
import { getCarImageUrl, type CarImage } from '../../../services/cars.service'
import { useSwipeGallery } from '../useSwipeGallery'
import { altFor } from './galleryAlt'

/**
 * Galeria pe tot ecranul (spec §3).
 *
 * `Dialog` face singur partea grea de accesibilitate: capcana de focus, `ESC` și întoarcerea
 * focusului pe imaginea din care s-a deschis. Aici rămân doar săgețile — și cele de pe tastatură,
 * pe care nimeni nu le are din oficiu.
 */

interface VehicleLightboxProps {
  images: CarImage[]
  title: string
  /**
   * De la ce fotografie pornește. Se citește o singură dată: părintele montează componenta abia la
   * deschidere, deci nu are ce sincroniza mai târziu.
   */
  startIndex: number
  open: boolean
  onClose: () => void
}

export default function VehicleLightbox({
  images,
  title,
  startIndex,
  open,
  onClose,
}: VehicleLightboxProps) {
  const [index, setIndex] = useState(startIndex)
  const { swipeHandlers, goNext, goPrev } = useSwipeGallery(images.length, setIndex)

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowRight') goNext()
      if (event.key === 'ArrowLeft') goPrev()
    },
    [goNext, goPrev],
  )

  const image = images[index]
  if (!image) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      onKeyDown={onKeyDown}
      aria-label={`Galerie foto — ${title}`}
      slotProps={{ paper: { sx: { backgroundColor: alpha(TOKENS.ink, 0.97) } } }}
    >
      <Box sx={{ position: 'relative', height: '100%', display: 'grid', placeItems: 'center' }} {...swipeHandlers}>
        <Box
          component="img"
          src={getCarImageUrl(image.imageUrl)}
          alt={altFor(title, index, images.length)}
          sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />

        <IconButton
          onClick={onClose}
          aria-label="Închide galeria"
          sx={{ position: 'absolute', top: 12, right: 12, color: '#FFFFFF' }}
        >
          <CloseRoundedIcon />
        </IconButton>

        {images.length > 1 && (
          <>
            <IconButton
              onClick={goPrev}
              aria-label="Fotografia anterioară"
              sx={{ position: 'absolute', left: 12, color: '#FFFFFF', backgroundColor: alpha('#000000', 0.3) }}
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <IconButton
              onClick={goNext}
              aria-label="Fotografia următoare"
              sx={{ position: 'absolute', right: 12, color: '#FFFFFF', backgroundColor: alpha('#000000', 0.3) }}
            >
              <ChevronRightRoundedIcon />
            </IconButton>

            <Typography
              sx={{
                position: 'absolute',
                bottom: 20,
                color: alpha('#FFFFFF', 0.85),
                fontWeight: 600,
              }}
            >
              {index + 1} / {images.length}
            </Typography>
          </>
        )}
      </Box>
    </Dialog>
  )
}
