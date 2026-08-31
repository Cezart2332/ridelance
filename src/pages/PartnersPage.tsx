import { useEffect, useRef } from 'react'
import {
  Box,
  Button,
  ButtonBase,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { pageFrameSx } from '../constants/layout'
import { InsuranceLinksGrid } from '../components/insurance/InsuranceLinksGrid'
import { BcrOffer } from '../components/partners/BcrOffer'
import { EldriveOffer } from '../components/partners/EldriveOffer'
import { PartnerBenefitBlocks } from '../components/partners/PartnerBenefitBlocks'
import { getPartnerBenefit } from '../data/benefits'
import { BCR_GEORGE_MESSAGE, getPartnerBySlug, partners, type Partner } from '../data/partners'
import { PARTNER_LOGO } from '../data/partnerLogo'

const tabItems = partners.map(({ slug, name, image }) => ({ slug, name, image }))

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
          return (
            <ButtonBase
              key={tab.slug}
              aria-label={tab.name}
              title={tab.name}
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
              {/* Doar logoul: numele scris alături era aceeași informație de două ori. Rămâne
                  în `alt` și în `aria-label`, pentru cititoarele de ecran. */}
              <Box
                component="img"
                src={tab.image}
                alt={tab.name}
                className="partner-tab-logo"
                sx={{
                  ...PARTNER_LOGO.tab,
                  width: 'auto',
                  objectFit: 'contain',
                  opacity: isActive ? 1 : 0.55,
                  filter: isActive ? 'grayscale(0)' : 'grayscale(1)',
                  transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                }}
              />
            </ButtonBase>
          )
        })}
      </Box>
    </Box>
  )
}

/**
 * Pagina BCR: prezentarea partenerului, apoi oferta de campanie.
 *
 * Oferta propriu-zisă e aceeași componentă ca în Beneficii (`BcrOffer`), cu tokenii publici.
 * Erau două randări diferite ale acelorași cifre — una aici, una în dashboard — și au apucat deja
 * să se contrazică o dată.
 *
 * Codul QR nu se mai desenează aici: îl aduce oferta, lângă butonul de deschidere a contului.
 * Două QR-uri pe același ecran, către același link, arată a greșeală.
 */
function BcrPanelContent() {
  return (
    <Stack spacing={4}>
      <Typography sx={{ color: TOKENS.ink, fontSize: '1rem', lineHeight: 1.85 }}>
        {BCR_GEORGE_MESSAGE}
      </Typography>

      <BcrOffer tokens={TOKENS} />
    </Stack>
  )
}

function PartnerPanel({ partner }: { partner: Partner }) {
  // Textul de la Beneficii ține loc de prezentare pentru partenerii care n-au încă una proprie.
  // Fără el, pagina lor publică arăta doar logoul și numele.
  const benefit = getPartnerBenefit(partner.slug)
  const tagline = partner.tagline ?? benefit?.tagline

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: TOKENS.radius.xl,
        border: `1px solid ${TOKENS.border}`,
        boxShadow: TOKENS.shadow.md,
        overflow: 'hidden',
        // Un prag de înălțime, ca schimbarea partenerului să nu scurteze pagina sub poziția
        // curentă de derulare: când se întâmplă, browserul trage scroll-ul înapoi și antetul
        // „Parteneri" pare că sare. Partenerii cu text puțin cresc peste el oricum.
        minHeight: { xs: 'auto', md: '60vh' },
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
            ...PARTNER_LOGO.panelBox,
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
            sx={{ ...PARTNER_LOGO.panel, width: 'auto', height: 'auto', objectFit: 'contain' }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 850, fontSize: { xs: '1.35rem', md: '1.6rem' }, color: TOKENS.ink }}>
            {partner.name}
          </Typography>
          {tagline && (
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.4 }}>
              {tagline}
            </Typography>
          )}
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
            {partner.description && (
              <Typography sx={{ color: TOKENS.ink, fontSize: '1rem', lineHeight: 1.85 }}>
                {partner.description}
              </Typography>
            )}
            {partner.slug === 'asigurari-ro' && (
              <Box>
                <Typography sx={{ fontWeight: 850, fontSize: '1.25rem', color: TOKENS.ink, mb: 2.5 }}>
                  Obține o ofertă direct online
                </Typography>
                <InsuranceLinksGrid compact />
              </Box>
            )}
            {partner.slug === 'eldrive' && (
              <EldriveOffer tokens={TOKENS} title="Tarife preferențiale RIDElance" />
            )}
            {!partner.description && benefit && <PartnerBenefitBlocks blocks={benefit.blocks} />}
          </Stack>
        )}
      </Box>
    </Paper>
  )
}

export function PartnersPage() {
  const { slug } = useParams()
  const partner = slug ? getPartnerBySlug(slug) : partners[0]

  if (!partner) {
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

          <PartnerTabs activeSlug={partner.slug} />
          <PartnerPanel partner={partner} />
        </Stack>
      </Container>
    </Box>
  )
}
