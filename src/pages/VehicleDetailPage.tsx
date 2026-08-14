import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Alert, Box, Button, Container, Divider, GlobalStyles, Stack, Typography } from '@mui/material'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { SimilarVehicles } from '../components/cars/vdp/SimilarVehicles'
import { VehicleDescription } from '../components/cars/vdp/VehicleDescription'
import { VehicleDetailSkeleton } from '../components/cars/vdp/VehicleDetailSkeleton'
import { VehicleGallery } from '../components/cars/vdp/VehicleGallery'
import { VehicleHeader } from '../components/cars/vdp/VehicleHeader'
import { VehicleMobilePriceBar } from '../components/cars/vdp/VehicleMobilePriceBar'
import { VehiclePlatformBadges } from '../components/cars/vdp/VehiclePlatformBadges'
import { VehiclePriceCard } from '../components/cars/vdp/VehiclePriceCard'
import { VehicleQuickSpecs } from '../components/cars/vdp/VehicleQuickSpecs'
import { VehicleSeo } from '../components/cars/vdp/VehicleSeo'
import RentFormModal from '../components/dashboard/sections/cars/RentFormModal'
import { TOKENS } from '../constants/tokens'
import { useVehicle } from '../hooks/useVehicle'
import { useVehicleViewTracking } from '../hooks/useVehicleViewTracking'
import { carsService } from '../services/cars.service'
import { isCarRentDisabled } from '../utils/carLabels'

// Lightbox-ul e cod pe care majoritatea vizitatorilor nu-l deschid niciodată.
const VehicleLightbox = lazy(() => import('../components/cars/vdp/VehicleLightbox'))

/**
 * Pagina de detaliu a unei mașini (spec-pagina-vehicul.md).
 *
 * Rol: generare de lead. Nu există checkout, nu există sumă totală, nu se cere niciun instrument de
 * plată. Tot ce face pagina e să arate mașina și să deschidă formularul de cerere.
 *
 * Secțiunile pentru care nu avem date (dotări, ce include, condiții, hartă, partener, recenzii,
 * întrebări frecvente) lipsesc cu totul, în loc să apară ca liste goale.
 */
export default function VehicleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { car, state, retry } = useVehicle(slug)

  const [modalOpen, setModalOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [barVisible, setBarVisible] = useState(false)
  const inlineCardRef = useRef<HTMLDivElement | null>(null)

  useVehicleViewTracking(car?.id, state === 'ready')

  // Bara de jos apare abia după ce prețul inline a ieșit din ecran.
  useEffect(() => {
    const target = inlineCardRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [car])

  const openRequest = () => {
    if (car) carsService.trackClick(car.id).catch(() => {})
    setModalOpen(true)
  }

  if (state === 'loading') {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <VehicleDetailSkeleton />
      </Container>
    )
  }

  if (state === 'not-found' || (state === 'ready' && !car)) {
    return <PageMessage title="Mașina nu mai există" body="Anunțul a fost șters sau nu mai este publicat." />
  }

  if (state === 'error' || !car) {
    return (
      <PageMessage
        title="Nu am putut încărca mașina"
        body="Conexiunea a căzut pe drum. Încearcă din nou."
        onRetry={retry}
      />
    )
  }

  const waitlist = isCarRentDisabled(car.status)
  const title = `${car.brand} ${car.model} ${car.year}`

  return (
    <Box sx={{ backgroundColor: TOKENS.surface, pb: { xs: 14, md: 10 } }}>
      {/*
        `overflow-x: hidden` pe html/body/#root (src/main.tsx) transformă documentul în scroll
        container și anulează `position: sticky`. `clip` taie la fel, dar fără scroll container —
        de asta cardul de preț rămâne lipit doar cu regula asta activă.
      */}
      <GlobalStyles styles={{ 'html, body, #root': { overflowX: 'clip' } }} />
      <VehicleSeo car={car} />

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Button
          component={Link}
          to="/masini"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{
            mb: 2,
            px: 0,
            fontWeight: 700,
            textTransform: 'none',
            color: TOKENS.textMuted,
            '&:hover': { backgroundColor: 'transparent', color: TOKENS.ink },
          }}
        >
          Toate mașinile
        </Button>

        <VehicleGallery images={car.images} title={title} onOpen={setLightbox} />

        {waitlist && (
          <Alert
            icon={<InfoOutlinedIcon />}
            severity="warning"
            sx={{ mt: 3, borderRadius: `${TOKENS.radius.lg}px`, fontWeight: 500 }}
          >
            Mașina nu e disponibilă acum. Lasă-ne datele și te anunțăm în clipa în care se
            eliberează.
          </Alert>
        )}

        <Box
          sx={{
            mt: { xs: 3, md: 4 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.9fr) minmax(300px, 1fr)' },
            columnGap: 6,
            rowGap: 4,
            alignItems: 'start',
          }}
        >
          <Stack spacing={4} sx={{ minWidth: 0 }}>
            <VehicleHeader car={car} />

            {/* Pe mobil prețul stă aici, în fluxul paginii; pe desktop, în coloana din dreapta. */}
            <Box ref={inlineCardRef} sx={{ display: { xs: 'block', md: 'none' } }}>
              <VehiclePriceCard car={car} waitlist={waitlist} onRequest={openRequest} />
            </Box>

            <Divider />
            <VehicleQuickSpecs car={car} />

            {car.description.trim().length > 0 && (
              <>
                <Divider />
                <VehicleDescription text={car.description} />
              </>
            )}

            {(car.uberCategories.length > 0 || car.boltCategories.length > 0) && (
              <>
                <Divider />
                <VehiclePlatformBadges car={car} />
              </>
            )}

            <Divider />
            <SimilarVehicles car={car} />
          </Stack>

          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              position: 'sticky',
              top: 96,
            }}
          >
            <VehiclePriceCard car={car} waitlist={waitlist} onRequest={openRequest} />
          </Box>
        </Box>
      </Container>

      <VehicleMobilePriceBar
        pricePerWeek={car.pricePerWeek}
        waitlist={waitlist}
        visible={barVisible && !modalOpen}
        onRequest={openRequest}
      />

      <RentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        car={car}
        intent={waitlist ? 'Waitlist' : 'Request'}
      />

      {lightbox !== null && (
        <Suspense fallback={null}>
          <VehicleLightbox
            images={car.images}
            title={title}
            startIndex={lightbox}
            open
            onClose={() => setLightbox(null)}
          />
        </Suspense>
      )}
    </Box>
  )
}

function PageMessage({
  title,
  body,
  onRetry,
}: {
  title: string
  body: string
  onRetry?: () => void
}) {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 14 }, textAlign: 'center' }}>
      <Typography variant="h1" sx={{ fontSize: '1.8rem', fontWeight: 800, color: TOKENS.ink, mb: 1.5 }}>
        {title}
      </Typography>
      <Typography sx={{ color: TOKENS.textMuted, mb: 4 }}>{body}</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center' }}>
        {onRetry && (
          <Button
            variant="contained"
            onClick={onRetry}
            sx={{
              px: 4,
              py: 1.4,
              borderRadius: `${TOKENS.radius.md}px`,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: 'none',
            }}
          >
            Reîncearcă
          </Button>
        )}
        <Button
          component={Link}
          to="/masini"
          variant="outlined"
          sx={{
            px: 4,
            py: 1.4,
            borderRadius: `${TOKENS.radius.md}px`,
            fontWeight: 700,
            textTransform: 'none',
            borderColor: TOKENS.borderHover,
            color: TOKENS.ink,
          }}
        >
          Vezi toate mașinile
        </Button>
      </Stack>
    </Container>
  )
}
