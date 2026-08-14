import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Alert, Box, Button, GlobalStyles, Stack, Typography } from '@mui/material'
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import RentFormModal from '../components/cars/RentFormModal'
import { SimilarVehicles } from '../components/cars/vdp/SimilarVehicles'
import { VehicleBreadcrumbs } from '../components/cars/vdp/VehicleBreadcrumbs'
import { VehicleDescription } from '../components/cars/vdp/VehicleDescription'
import { VehicleDetailSkeleton } from '../components/cars/vdp/VehicleDetailSkeleton'
import { VehicleFeatureList } from '../components/cars/vdp/VehicleFeatureList'
import { VehicleGallery } from '../components/cars/vdp/VehicleGallery'
import { VehicleHeader } from '../components/cars/vdp/VehicleHeader'
import { VehicleMobilePriceBar } from '../components/cars/vdp/VehicleMobilePriceBar'
import { VehiclePlatformBadges } from '../components/cars/vdp/VehiclePlatformBadges'
import { VehiclePriceCard } from '../components/cars/vdp/VehiclePriceCard'
import { VehiclePromoBanner } from '../components/cars/vdp/VehiclePromoBanner'
import { VehicleSection } from '../components/cars/vdp/VehicleSection'
import { VehicleSectionNav, type NavSection } from '../components/cars/vdp/VehicleSectionNav'
import { VehicleSeo } from '../components/cars/vdp/VehicleSeo'
import { VDP } from '../components/cars/vdp/vdpLayout'
import { TOKENS } from '../constants/tokens'
import { useVehicle } from '../hooks/useVehicle'
import { useVehicleViewTracking } from '../hooks/useVehicleViewTracking'
import { carsService } from '../services/cars.service'
import { isCarRentDisabled } from '../utils/carLabels'
import { hasActiveDiscount } from '../utils/carPricing'

// Lightbox-ul e cod pe care majoritatea vizitatorilor nu-l deschid niciodată.
const VehicleLightbox = lazy(() => import('../components/cars/vdp/VehicleLightbox'))

/**
 * Pagina de detaliu a unei mașini, după specul de design.
 *
 * Rol: generare de lead. Nu există checkout, nu există sumă totală, nu se cere niciun instrument de
 * plată. Tot ce face pagina e să arate mașina și să deschidă formularul de cerere.
 *
 * Secțiunile din spec pentru care nu avem date (ce include prețul, extras, recenzii, gazdă, reguli)
 * lipsesc cu totul, în loc să apară ca liste goale. Bara de secțiuni se construiește din ce chiar
 * s-a randat, deci nu poate trimite într-un gol.
 */
export default function VehicleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { car, state, retry } = useVehicle(slug)

  const [modalOpen, setModalOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [barVisible, setBarVisible] = useState(false)
  const [galleryEl, setGalleryEl] = useState<HTMLDivElement | null>(null)
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

  const hasDescription = (car?.description.trim().length ?? 0) > 0
  const hasPlatforms = (car?.uberCategories.length ?? 0) + (car?.boltCategories.length ?? 0) > 0

  const sections: NavSection[] = useMemo(() => {
    if (!car) return []
    return [
      { id: 'prezentare', label: 'Prezentare' },
      ...(hasDescription ? [{ id: 'descriere', label: 'Descriere' }] : []),
      { id: 'dotari', label: 'Dotări' },
      ...(hasPlatforms ? [{ id: 'platforme', label: 'Platforme' }] : []),
      { id: 'similare', label: 'Similare' },
    ]
  }, [car, hasDescription, hasPlatforms])

  const openRequest = () => {
    if (car) carsService.trackClick(car.id).catch(() => {})
    setModalOpen(true)
  }

  if (state === 'loading') {
    return (
      <PageShell>
        <VehicleDetailSkeleton />
      </PageShell>
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
  const ctaLabel = waitlist ? 'Anunță-mă' : 'Solicită mașina'

  return (
    <Box sx={{ backgroundColor: TOKENS.paper, pb: { xs: 14, md: 0 } }}>
      {/*
        `overflow-x: hidden` pe html/body/#root (src/main.tsx) transformă documentul în scroll
        container: anulează `position: sticky` și taie benzile full-bleed. `clip` taie la fel, dar
        fără scroll container — de asta bara de secțiuni și coloana dreaptă rămân lipite.
      */}
      <GlobalStyles styles={{ 'html, body, #root': { overflowX: 'clip' } }} />
      <VehicleSeo car={car} />

      <VehicleSectionNav
        sections={sections}
        priceAnchor={galleryEl}
        pricePerWeek={car.pricePerWeek}
        oldPrice={car.oldPrice}
        discounted={hasActiveDiscount(car)}
        ctaLabel={ctaLabel}
        onCta={openRequest}
      />

      <PageShell>
        <Box ref={setGalleryEl} sx={{ pt: 3 }}>
          <VehicleGallery images={car.images} title={title} onOpen={setLightbox} />
        </Box>

        {waitlist && (
          <Alert
            icon={<InfoOutlinedIcon />}
            severity="warning"
            sx={{ mt: 3, borderRadius: `${VDP.radius.card}px`, fontWeight: 500 }}
          >
            Mașina nu e disponibilă acum. Lasă-ne datele și te anunțăm în clipa în care se
            eliberează.
          </Alert>
        )}

        <Box
          sx={{
            mt: 4,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: `minmax(0, 1fr) ${VDP.rightColumn}px` },
            columnGap: `${VDP.columnGap}px`,
            rowGap: 4,
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {/* Blocul de titlu nu trece prin `VehicleSection`: titlul lui e chiar H1-ul paginii. */}
            <Box
              id="prezentare"
              sx={{
                scrollMarginTop: { xs: VDP.headerOffset.xs + 16, md: VDP.headerOffset.md + 16 },
              }}
            >
              <VehicleHeader car={car} />
              <Box
                sx={{
                  mt: `${VDP.sectionGap}px`,
                  mb: `${VDP.sectionGap}px`,
                  height: '1px',
                  backgroundColor: TOKENS.border,
                }}
              />
            </Box>

            {/* Pe mobil prețul stă aici, în fluxul paginii; pe desktop, în coloana din dreapta. */}
            <Box ref={inlineCardRef} sx={{ display: { xs: 'block', lg: 'none' }, mb: 4 }}>
              <VehiclePriceCard car={car} waitlist={waitlist} onRequest={openRequest} />
            </Box>

            {hasDescription && (
              <VehicleSection
                id="descriere"
                title="Despre mașină"
              >
                <VehicleDescription text={car.description} />
              </VehicleSection>
            )}

            <VehicleSection
              id="dotari"
              title="Dotări și detalii"
            >
              <VehicleFeatureList car={car} />
            </VehicleSection>

            {hasPlatforms && (
              <VehicleSection
                id="platforme"
                title="Platforme acceptate"
              >
                <VehiclePlatformBadges car={car} />
              </VehicleSection>
            )}

            {/* Caruselul își poartă singur antetul: titlul stă pe același rând cu săgețile (§8). */}
            <SimilarVehicles car={car} />

            <Box sx={{ mt: 4 }}>
              <VehiclePromoBanner />
            </Box>
          </Box>

          <Box
            sx={{
              display: { xs: 'none', lg: 'block' },
              position: 'sticky',
              top: VDP.headerOffset.md + 24,
            }}
          >
            <VehiclePriceCard car={car} waitlist={waitlist} onRequest={openRequest} />
          </Box>
        </Box>
      </PageShell>

      <VehicleBreadcrumbs current={title} />

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

/** Grila centrală din spec: 1184px cu 24px de gardă, aceeași pentru tot ce nu e bandă full-bleed. */
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ maxWidth: VDP.maxWidth, mx: 'auto', px: `${VDP.gutter}px`, pb: 6 }}>{children}</Box>
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
    <Box sx={{ maxWidth: 560, mx: 'auto', px: 3, py: { xs: 8, md: 14 }, textAlign: 'center' }}>
      <Typography
        variant="h1"
        sx={{ fontSize: '1.8rem', color: TOKENS.ink, mb: 1.5, ...VDP.display }}
      >
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
              height: 48,
              borderRadius: `${VDP.radius.image}px`,
              fontWeight: 800,
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
            height: 48,
            borderRadius: `${VDP.radius.image}px`,
            fontWeight: 700,
            textTransform: 'none',
            borderColor: TOKENS.borderHover,
            color: TOKENS.ink,
          }}
        >
          Vezi toate mașinile
        </Button>
      </Stack>
    </Box>
  )
}
