import { Box, Button, ButtonBase, Chip, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { pageFrameSx } from '../constants/layout'
import { InsuranceLinksGrid } from '../components/insurance/InsuranceLinksGrid'
import {
  BCR_GEORGE_MESSAGE,
  BCR_OFFERS,
  BCR_ONBOARDING_URL,
  BCR_QR_CODES,
  getPartnerBySlug,
  partners,
  type Partner,
} from '../data/partners'

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

function PartnerTabs({ active }: { active: Partner }) {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'row', md: 'column' },
        gap: 1,
        overflowX: { xs: 'auto', md: 'visible' },
        pb: { xs: 1, md: 0 },
      }}
    >
      {partners.map((partner) => {
        const isActive = partner.slug === active.slug
        return (
          <ButtonBase
            key={partner.slug}
            onClick={() => navigate(`/parteneri/${partner.slug}`)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 1.5,
              px: 2,
              py: 1.5,
              minWidth: { xs: 170, md: 'unset' },
              width: { md: '100%' },
              textAlign: 'left',
              borderRadius: TOKENS.radius.lg,
              border: `1px solid ${isActive ? alpha(TOKENS.primary, 0.45) : TOKENS.border}`,
              backgroundColor: isActive ? alpha(TOKENS.primary, 0.07) : TOKENS.paper,
              boxShadow: isActive ? TOKENS.shadow.glow : 'none',
              transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
              '&:hover': {
                borderColor: alpha(TOKENS.primary, 0.45),
                backgroundColor: alpha(TOKENS.primary, 0.05),
              },
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: TOKENS.radius.md,
                backgroundColor: alpha(TOKENS.surfaceAlt, 0.9),
                overflow: 'hidden',
                p: 0.6,
              }}
            >
              <Box
                component="img"
                src={partner.image}
                alt={partner.name}
                sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
            <Typography
              noWrap
              sx={{
                fontWeight: isActive ? 850 : 700,
                fontSize: '0.95rem',
                color: isActive ? TOKENS.ink : TOKENS.textMuted,
                flex: 1,
                minWidth: 0,
              }}
            >
              {partner.name}
            </Typography>
            <ChevronRightRoundedIcon
              sx={{
                fontSize: 20,
                color: isActive ? TOKENS.primaryStrong : TOKENS.textSubtle,
                display: { xs: 'none', md: 'block' },
              }}
            />
          </ButtonBase>
        )
      })}
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
            „{BCR_GEORGE_MESSAGE}”
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

  if (!partner) {
    return <Navigate to="/parteneri" replace />
  }

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="xl">
        <Stack spacing={{ xs: 3, md: 5 }}>
          <SectionHeader
            title="Parteneri"
            subtitle="Colaborăm cu parteneri care aduc beneficii concrete șoferilor RIDElance. Alege un partener din listă pentru detalii și oferte."
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '270px minmax(0, 1fr)' },
              gap: { xs: 2.5, md: 4 },
              alignItems: 'start',
            }}
          >
            <PartnerTabs active={partner} />
            <PartnerPanel partner={partner} />
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
