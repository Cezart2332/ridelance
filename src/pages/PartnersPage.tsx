import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded'
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { pageFrameSx } from '../constants/layout'
import { InsuranceLinksGrid } from '../components/insurance/InsuranceLinksGrid'
import {
  BCR_GEORGE_MESSAGE,
  BCR_OFFERS,
  BCR_ONBOARDING_URL,
  BCR_QR_CODES,
  getOfferTabBySlug,
  getPartnerBySlug,
  offerTabs,
  partners,
  type OfferTab,
  type Partner,
} from '../data/partners'
import { homeSec6 } from '../data/constants'
import {
  ServicePurchaseModal,
  type ServicePurchaseTarget,
} from '../components/services/ServicePurchaseModal'
import type { ServiceKey } from '../services/stripe.service'
import { carsService, type Car } from '../services/cars.service'
import CarCard from '../components/dashboard/sections/cars/CarCard'
import RentFormModal from '../components/dashboard/sections/cars/RentFormModal'

const offerTabIcons: Record<string, typeof AssignmentIndRoundedIcon> = {
  pfa: AssignmentIndRoundedIcon,
  'inchiriere-masini': DirectionsCarFilledRoundedIcon,
}

const ctaButtonSx = {
  px: 4,
  py: 1.3,
  fontSize: '1rem',
  fontWeight: 750,
  color: '#fff',
  backgroundColor: TOKENS.primary,
  borderRadius: TOKENS.radius.full,
  boxShadow: 'none',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: TOKENS.primaryStrong,
    boxShadow: 'none',
    transform: 'translateY(-2px)',
  },
} as const

interface PartnerTabItem {
  slug: string
  name: string
  image?: string
}

const tabItems: PartnerTabItem[] = [
  ...partners.map(({ slug, name, image }) => ({ slug, name, image })),
  ...offerTabs.map(({ slug, name }) => ({ slug, name })),
]

function PartnerTabs({ activeSlug }: { activeSlug: string }) {
  const navigate = useNavigate()
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const rail = railRef.current
    const el = rail?.querySelector<HTMLElement>('[data-active="true"]')
    if (rail && el) {
      rail.scrollLeft = el.offsetLeft - (rail.clientWidth - el.clientWidth) / 2
    }
  }, [activeSlug])

  return (
    <Box sx={{ borderBottom: `1px solid ${TOKENS.border}` }}>
      <Box
        ref={railRef}
        sx={{
          display: 'flex',
          justifyContent: { xs: 'flex-start', md: 'center' },
          gap: { xs: 0.5, md: 1 },
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {tabItems.map((tab) => {
          const isActive = tab.slug === activeSlug
          const TabIcon = tab.image ? undefined : offerTabIcons[tab.slug]
          return (
            <ButtonBase
              key={tab.slug}
              data-active={isActive ? 'true' : undefined}
              onClick={() => navigate(`/parteneri/${tab.slug}`)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: { xs: 1.5, md: 2.2 },
                py: 1.6,
                flexShrink: 0,
                borderBottom: `2px solid ${isActive ? TOKENS.primary : 'transparent'}`,
                mb: '-1px',
                transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': {
                  '& .partner-tab-label': { color: TOKENS.ink },
                  '& .partner-tab-logo': { opacity: 1, filter: 'grayscale(0)' },
                },
              }}
            >
              {tab.image ? (
                <Box
                  component="img"
                  src={tab.image}
                  alt=""
                  className="partner-tab-logo"
                  sx={{
                    height: 22,
                    width: 'auto',
                    maxWidth: 44,
                    objectFit: 'contain',
                    opacity: isActive ? 1 : 0.55,
                    filter: isActive ? 'grayscale(0)' : 'grayscale(1)',
                    transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                  }}
                />
              ) : (
                TabIcon && (
                  <TabIcon
                    className="partner-tab-logo"
                    sx={{
                      fontSize: 22,
                      color: isActive ? TOKENS.primaryStrong : TOKENS.textMuted,
                      opacity: isActive ? 1 : 0.7,
                      transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                    }}
                  />
                )
              )}
              <Typography
                noWrap
                className="partner-tab-label"
                sx={{
                  fontWeight: isActive ? 800 : 650,
                  fontSize: '0.92rem',
                  color: isActive ? TOKENS.ink : TOKENS.textMuted,
                  transition: `color ${TOKENS.duration} ${TOKENS.easing}`,
                }}
              >
                {tab.name}
              </Typography>
            </ButtonBase>
          )
        })}
      </Box>
    </Box>
  )
}

function BcrPanelContent() {
  return (
    <Stack spacing={4}>
      {/* Panou unificat: mesaj + CTA în stânga, QR în dreapta */}
      <Box
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: TOKENS.radius.lg,
          border: `1px solid ${alpha(TOKENS.primary, 0.3)}`,
          backgroundColor: alpha(TOKENS.primary, 0.04),
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 230px' },
          gap: { xs: 3, lg: 4 },
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography sx={{ color: TOKENS.ink, fontSize: '1rem', lineHeight: 1.8, fontWeight: 550 }}>
            {BCR_GEORGE_MESSAGE}
          </Typography>
          <Button
            variant="contained"
            component="a"
            href={BCR_ONBOARDING_URL}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenInNewRoundedIcon />}
            sx={{ ...ctaButtonSx, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
          >
            Deschide contul George
          </Button>
        </Box>

        {BCR_QR_CODES.map((qr) => (
          <Box
            key={qr.image}
            sx={{
              p: 2,
              borderRadius: TOKENS.radius.lg,
              border: `1px solid ${TOKENS.border}`,
              backgroundColor: TOKENS.paper,
              boxShadow: TOKENS.shadow.sm,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.2,
              justifySelf: { xs: 'center', lg: 'stretch' },
              width: { xs: 230, lg: 'auto' },
            }}
          >
            <Box
              component="img"
              src={qr.image}
              alt={qr.label}
              sx={{ width: '100%', maxWidth: 180, height: 'auto', borderRadius: TOKENS.radius.md }}
            />
            <Stack direction="row" spacing={0.7} sx={{ alignItems: 'flex-start' }}>
              <QrCode2RoundedIcon sx={{ fontSize: 16, color: TOKENS.textMuted, mt: 0.2 }} />
              <Typography
                sx={{ color: TOKENS.textMuted, fontSize: '0.78rem', fontWeight: 650, textAlign: 'center' }}
              >
                {qr.label}
              </Typography>
            </Stack>
          </Box>
        ))}
      </Box>

      {/* Ofertele, direct în pagina partenerului */}
      <Box>
        <Typography sx={{ fontWeight: 850, fontSize: '1.25rem', color: TOKENS.ink }}>
          Oferta BCR pentru PFA Ridesharing
        </Typography>
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5, mb: 3 }}>
          Două variante, în funcție de vechimea PFA-ului tău.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
            alignItems: 'stretch',
          }}
        >
          {BCR_OFFERS.map((offer) => (
            <Box
              key={offer.title}
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: TOKENS.radius.lg,
                border: `1px solid ${TOKENS.border}`,
                backgroundColor: TOKENS.paper,
                boxShadow: TOKENS.shadow.sm,
                display: 'flex',
                flexDirection: 'column',
                transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': {
                  boxShadow: TOKENS.shadow.md,
                  borderColor: alpha(TOKENS.primary, 0.4),
                },
              }}
            >
              <Chip
                label={offer.chip}
                size="small"
                sx={{
                  alignSelf: 'flex-start',
                  fontWeight: 800,
                  backgroundColor: alpha(TOKENS.primary, 0.12),
                  color: TOKENS.primaryStrong,
                  borderRadius: TOKENS.radius.full,
                  mb: 1.5,
                }}
              />
              <Typography sx={{ fontWeight: 850, fontSize: '1.12rem', color: TOKENS.ink }}>
                {offer.title}
              </Typography>
              <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem', mt: 0.4, mb: 2.5 }}>
                {offer.note}
              </Typography>

              <Stack spacing={2}>
                {offer.benefits.map((benefit) => (
                  <Stack key={benefit.title} direction="row" spacing={1.3}>
                    <CheckCircleRoundedIcon
                      sx={{ fontSize: 20, color: TOKENS.primaryStrong, mt: 0.2, flexShrink: 0 }}
                    />
                    <Box>
                      <Typography
                        sx={{ fontWeight: 750, fontSize: '0.94rem', color: TOKENS.ink, lineHeight: 1.45 }}
                      >
                        {benefit.title}
                      </Typography>
                      {benefit.text && (
                        <Typography
                          sx={{ color: TOKENS.textMuted, fontSize: '0.86rem', lineHeight: 1.6, mt: 0.4 }}
                        >
                          {benefit.text}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  )
}

function PfaPanelContent() {
  const [purchaseTarget, setPurchaseTarget] = useState<ServicePurchaseTarget | null>(null)

  const openPurchase = (serviceKey: ServiceKey, title: string, price: string) => {
    setPurchaseTarget({ key: serviceKey, title, price })
  }

  return (
    <Stack spacing={4}>
      <Typography sx={{ color: TOKENS.ink, fontSize: '1rem', lineHeight: 1.85 }}>
        Prin RIDElance îți deschizi PFA-ul și îl pregătești pentru ridesharing fără drumuri și fără
        birocrație: alegi serviciul de care ai nevoie, completezi datele în platformă, iar echipa
        noastră se ocupă de restul.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        {homeSec6.map((svc) => (
          <Box
            key={svc.serviceKey}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: TOKENS.radius.lg,
              border: `1px solid ${TOKENS.border}`,
              backgroundColor: TOKENS.paper,
              boxShadow: TOKENS.shadow.sm,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
              '&:hover': {
                boxShadow: TOKENS.shadow.md,
                borderColor: alpha(TOKENS.primary, 0.4),
              },
            }}
          >
            <Stack
              direction="row"
              sx={{ alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}
            >
              <Typography sx={{ fontWeight: 850, fontSize: '1.12rem', color: TOKENS.ink }}>
                {svc.title}
              </Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  sx={{ color: TOKENS.primaryStrong, fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}
                >
                  {svc.price}
                </Typography>
                {'priceNote' in svc && svc.priceNote && (
                  <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.7rem', mt: 0.3, lineHeight: 1.3 }}>
                    {svc.priceNote}
                  </Typography>
                )}
              </Box>
            </Stack>
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', lineHeight: 1.65, flexGrow: 1 }}>
              {svc.desc}
            </Typography>
            <Button
              variant="contained"
              onClick={() => openPurchase(svc.serviceKey, svc.title, svc.price)}
              sx={{ ...ctaButtonSx, alignSelf: 'flex-start', px: 3, py: 0.9, fontSize: '0.92rem' }}
            >
              {svc.cta}
            </Button>
          </Box>
        ))}
      </Box>

      <ServicePurchaseModal
        open={purchaseTarget !== null}
        service={purchaseTarget}
        onClose={() => setPurchaseTarget(null)}
      />
    </Stack>
  )
}

function CarsRentalPanelContent() {
  const navigate = useNavigate()
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchCars = useCallback(async () => {
    setLoading(true)
    try {
      const data = await carsService.getAll()
      setCars(data)
    } catch (error) {
      console.error('Error fetching cars:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCars()
  }, [fetchCars])

  const handleRentClick = (car: Car) => {
    setSelectedCar(car)
    setModalOpen(true)
  }

  const visibleCars = cars.slice(0, 6)

  return (
    <Stack spacing={4}>
      <Typography sx={{ color: TOKENS.ink, fontSize: '1rem', lineHeight: 1.85 }}>
        Flota RIDElance îți pune la dispoziție mașini pregătite pentru Uber și Bolt, cu închiriere
        săptămânală sau opțiuni de tip „la rămânere”. Alegi mașina, trimiți cererea online și ești
        gata de curse.
      </Typography>

      {loading && (
        <LinearProgress
          sx={{ borderRadius: 2, height: 6, bgcolor: alpha(TOKENS.primary, 0.1) }}
        />
      )}

      {visibleCars.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {visibleCars.map((car) => (
            <CarCard key={car.id} car={car} onRentClick={handleRentClick} />
          ))}
        </Box>
      ) : (
        !loading && (
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.95rem' }}>
            Momentan nu sunt mașini disponibile. Revino în curând sau contactează-ne pentru detalii.
          </Typography>
        )
      )}

      <Button
        variant="contained"
        onClick={() => navigate('/masini')}
        sx={{ ...ctaButtonSx, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
      >
        Vezi toate mașinile
      </Button>

      <RentFormModal open={modalOpen} onClose={() => setModalOpen(false)} car={selectedCar} />
    </Stack>
  )
}

function OfferPanel({ tab }: { tab: OfferTab }) {
  const TabIcon = offerTabIcons[tab.slug]

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: TOKENS.radius.xl,
        border: `1px solid ${TOKENS.border}`,
        boxShadow: TOKENS.shadow.md,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: { xs: 2.5, md: 3.5 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2.5,
          background: `linear-gradient(135deg, ${alpha(TOKENS.primary, 0.08)} 0%, ${alpha(TOKENS.primary, 0.02)} 60%)`,
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 72,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: TOKENS.radius.lg,
            backgroundColor: TOKENS.paper,
            border: `1px solid ${TOKENS.border}`,
          }}
        >
          {TabIcon && <TabIcon sx={{ fontSize: 36, color: TOKENS.primaryStrong }} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 850, fontSize: { xs: '1.35rem', md: '1.6rem' }, color: TOKENS.ink }}>
            {tab.name}
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.4 }}>
            {tab.tagline}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: TOKENS.border }} />

      <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
        {tab.slug === 'pfa' ? <PfaPanelContent /> : <CarsRentalPanelContent />}
      </Box>
    </Paper>
  )
}

function PartnerPanel({ partner }: { partner: Partner }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: TOKENS.radius.xl,
        border: `1px solid ${TOKENS.border}`,
        boxShadow: TOKENS.shadow.md,
        overflow: 'hidden',
      }}
    >
      {/* Antet panel */}
      <Box
        sx={{
          p: { xs: 2.5, md: 3.5 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2.5,
          background: `linear-gradient(135deg, ${alpha(TOKENS.primary, 0.08)} 0%, ${alpha(TOKENS.primary, 0.02)} 60%)`,
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 72,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: TOKENS.radius.lg,
            backgroundColor: TOKENS.paper,
            border: `1px solid ${TOKENS.border}`,
            overflow: 'hidden',
            p: 1.2,
          }}
        >
          <Box
            component="img"
            src={partner.image}
            alt={partner.name}
            sx={{ maxWidth: 96, maxHeight: 48, width: 'auto', height: 'auto', objectFit: 'contain' }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 850, fontSize: { xs: '1.35rem', md: '1.6rem' }, color: TOKENS.ink }}>
            {partner.name}
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.4 }}>
            {partner.tagline}
          </Typography>
        </Box>
        {partner.website && (
          <Button
            component="a"
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenInNewRoundedIcon />}
            sx={{
              flexShrink: 0,
              fontWeight: 750,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              color: TOKENS.primaryStrong,
              border: `1px solid ${alpha(TOKENS.primary, 0.4)}`,
              borderRadius: TOKENS.radius.full,
              px: 2.5,
              '&:hover': { backgroundColor: alpha(TOKENS.primary, 0.06) },
            }}
          >
            {partner.website.replace('https://', '').replace('www.', '')}
          </Button>
        )}
      </Box>

      <Divider sx={{ borderColor: TOKENS.border }} />

      <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
        {partner.slug === 'bcr' ? (
          <BcrPanelContent />
        ) : (
          <Stack spacing={4}>
            <Typography sx={{ color: TOKENS.ink, fontSize: '1rem', lineHeight: 1.85 }}>
              {partner.description}
            </Typography>
            {partner.slug === 'asigurari-ro' && (
              <Box>
                <Typography sx={{ fontWeight: 850, fontSize: '1.25rem', color: TOKENS.ink, mb: 2.5 }}>
                  Obține o ofertă direct online
                </Typography>
                <InsuranceLinksGrid compact />
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  )
}

export function PartnersPage() {
  const { slug } = useParams()
  const partner = slug ? getPartnerBySlug(slug) : partners[0]
  const offerTab = slug && !partner ? getOfferTabBySlug(slug) : undefined

  if (!partner && !offerTab) {
    return <Navigate to="/parteneri" replace />
  }

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 3, md: 4 }}>
          <SectionHeader
            title="Parteneri"
            subtitle="Colaborăm cu parteneri care aduc beneficii concrete șoferilor RIDElance. Alege un partener pentru detalii și oferte."
          />

          <PartnerTabs activeSlug={partner?.slug ?? offerTab!.slug} />
          {partner ? <PartnerPanel partner={partner} /> : <OfferPanel tab={offerTab!} />}
        </Stack>
      </Container>
    </Box>
  )
}
