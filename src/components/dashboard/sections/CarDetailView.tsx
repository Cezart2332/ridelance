import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { Suspense, lazy, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import RentFormModal from '../../cars/RentFormModal'
import { SimilarVehicles } from '../../cars/vdp/SimilarVehicles'
import { VehicleDescription } from '../../cars/vdp/VehicleDescription'
import { VehicleDetailSkeleton } from '../../cars/vdp/VehicleDetailSkeleton'
import { VehicleFeatureList } from '../../cars/vdp/VehicleFeatureList'
import { VehicleGallery } from '../../cars/vdp/VehicleGallery'
import { VehicleHeader } from '../../cars/vdp/VehicleHeader'
import { VehiclePlatformBadges } from '../../cars/vdp/VehiclePlatformBadges'
import { VehiclePriceCard } from '../../cars/vdp/VehiclePriceCard'
import { VehicleSection } from '../../cars/vdp/VehicleSection'
import { VDP } from '../../cars/vdp/vdpLayout'
import { PFA_PATHS, pfaCarPath } from '../../../config/pfaNavigation'
import { useVehicle } from '../../../hooks/useVehicle'
import { useVehicleViewTracking } from '../../../hooks/useVehicleViewTracking'
import { carsService } from '../../../services/cars.service'
import { isCarRentDisabled } from '../../../utils/carLabels'
import { IS_NATIVE_APP } from '../../../native/platform'
import { DASHBOARD_TOKENS } from '../dashboardTheme'

const VehicleLightbox = lazy(() => import('../../cars/vdp/VehicleLightbox'))

/** Site-ul public. În aplicație `window.location.origin` e `capacitor://localhost`. */
const PUBLIC_SITE = IS_NATIVE_APP ? 'https://ridelance.ro' : window.location.origin

/**
 * Pagina unei mașini, în dashboard. Pe telefon „Vezi detalii” deschidea pagina publică într-un tab
 * nou — în aplicație pagina publică nici nu există, deci se întorcea la început.
 *
 * Aceleași piese ca pagina publică (galerie, preț, dotări), fără ce ține de site: bara de
 * secțiuni lipită sus, SEO, firimiturile. Distribuirea trimite linkul public al anunțului, iar
 * săgeata „Înapoi” e în antet. Prețul cu „Solicită mașina” stă imediat sub titlu, ca pe telefon să se vadă fără derulare lungă.
 */
export function CarDetailView() {
  const { slug } = useParams<{ slug: string }>()
  const { car, state, retry } = useVehicle(slug)
  const [modalOpen, setModalOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)

  useVehicleViewTracking(car?.id, state === 'ready')

  if (state === 'loading') return <VehicleDetailSkeleton />

  if (state === 'not-found' || (state === 'ready' && !car)) {
    return <Message title="Mașina nu mai există" body="Anunțul a fost șters sau nu mai este publicat." />
  }

  if (state === 'error' || !car) {
    return <Message title="Nu am putut încărca mașina" body="Conexiunea a căzut pe drum. Încearcă din nou." onRetry={retry} />
  }

  const waitlist = isCarRentDisabled(car.status)
  const title = `${car.brand} ${car.model} ${car.year}`
  const hasDescription = car.description.trim().length > 0
  const hasPlatforms = car.uberCategories.length + car.boltCategories.length > 0

  const openRequest = () => {
    carsService.trackClick(car.id).catch(() => {})
    setModalOpen(true)
  }

  const priceCard = (elevated: boolean) => (
    <VehiclePriceCard car={car} waitlist={waitlist} onRequest={openRequest} elevated={elevated} inDashboard />
  )

  return (
    <Box sx={{ minWidth: 0 }}>
      <VehicleGallery images={car.images} title={title} onOpen={setLightbox} shareUrl={`${PUBLIC_SITE}/masini/${car.slug}`} />

      {waitlist && (
        <Alert icon={<InfoOutlinedIcon />} severity="warning" sx={{ mt: 2, borderRadius: `${VDP.radius.card}px`, fontWeight: 500 }}>
          Mașina nu e disponibilă acum. Lasă-ne datele și te anunțăm în clipa în care se eliberează.
        </Alert>
      )}

      <Box
        sx={{
          mt: { xs: 2, md: 3 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: `minmax(0, 1fr) ${VDP.rightColumn}px` },
          columnGap: `${VDP.columnGap}px`,
          rowGap: 3,
          alignItems: 'start',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <VehicleHeader car={car} />

          <Box sx={{ display: { xs: 'block', lg: 'none' }, mt: 2.5, mb: 1 }}>{priceCard(false)}</Box>

          <Box sx={{ mt: 3 }}>
            {hasDescription && (
              <VehicleSection id="descriere" title="Despre mașină">
                <VehicleDescription text={car.description} />
              </VehicleSection>
            )}

            <VehicleSection id="dotari" title="Dotări și detalii">
              <VehicleFeatureList car={car} />
            </VehicleSection>

            {hasPlatforms && (
              <VehicleSection id="platforme" title="Platforme acceptate">
                <VehiclePlatformBadges car={car} />
              </VehicleSection>
            )}

            <SimilarVehicles car={car} hrefFor={pfaCarPath} />
          </Box>
        </Box>

        <Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'sticky', top: 96 }}>{priceCard(true)}</Box>
      </Box>

      <RentFormModal open={modalOpen} onClose={() => setModalOpen(false)} car={car} intent={waitlist ? 'Waitlist' : 'Request'} />

      {lightbox !== null && (
        <Suspense fallback={null}>
          <VehicleLightbox images={car.images} title={title} startIndex={lightbox} open onClose={() => setLightbox(null)} />
        </Suspense>
      )}
    </Box>
  )
}

function Message({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', py: { xs: 6, md: 10 }, textAlign: 'center' }}>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: DASHBOARD_TOKENS.ink, mb: 1 }}>{title}</Typography>
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mb: 3 }}>{body}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center' }}>
        {onRetry && (
          <Button variant="contained" onClick={onRetry} sx={{ fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}>
            Reîncearcă
          </Button>
        )}
        <Button component={Link} to={PFA_PATHS.svcCars} variant="outlined" sx={{ fontWeight: 700, textTransform: 'none' }}>
          Vezi toate mașinile
        </Button>
      </Stack>
    </Box>
  )
}
