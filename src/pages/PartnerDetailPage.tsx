import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded'
import { TOKENS } from '../constants/tokens'
import { pageFrameSx } from '../constants/layout'
import { InsuranceLinksGrid } from '../components/insurance/InsuranceLinksGrid'
import {
  BCR_GEORGE_MESSAGE,
  BCR_ONBOARDING_URL,
  BCR_QR_CODES,
  getPartnerBySlug,
} from '../data/partners'

function BcrContent() {
  const navigate = useNavigate()

  return (
    <Stack spacing={4}>
      {/* Mesajul partenerului */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: TOKENS.radius.xl,
          border: `1px solid ${alpha(TOKENS.primary, 0.3)}`,
          backgroundColor: alpha(TOKENS.primary, 0.04),
        }}
      >
        <Typography
          sx={{
            color: TOKENS.ink,
            fontSize: { xs: '1rem', md: '1.08rem' },
            lineHeight: 1.8,
            fontWeight: 550,
          }}
        >
          „{BCR_GEORGE_MESSAGE}”
        </Typography>
      </Paper>

      {/* CTA + coduri QR */}
      <Stack spacing={3} sx={{ alignItems: 'center' }}>
        <Button
          variant="contained"
          size="large"
          component="a"
          href={BCR_ONBOARDING_URL}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<OpenInNewRoundedIcon />}
          sx={{
            px: 5,
            py: 1.5,
            fontSize: '1.05rem',
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
          }}
        >
          Deschide contul George pentru afacerea ta
        </Button>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          {BCR_QR_CODES.map((qr) => (
            <Paper
              key={qr.image}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: TOKENS.radius.xl,
                border: `1px solid ${TOKENS.border}`,
                boxShadow: TOKENS.shadow.md,
                textAlign: 'center',
                width: { xs: '100%', sm: 320 },
              }}
            >
              <Box
                component="img"
                src={qr.image}
                alt={qr.label}
                sx={{
                  width: '100%',
                  maxWidth: 240,
                  height: 'auto',
                  borderRadius: TOKENS.radius.lg,
                  display: 'block',
                  mx: 'auto',
                }}
              />
              <Stack
                direction="row"
                spacing={0.8}
                sx={{ alignItems: 'center', justifyContent: 'center', mt: 2 }}
              >
                <QrCode2RoundedIcon sx={{ fontSize: 18, color: TOKENS.textMuted }} />
                <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem', fontWeight: 650 }}>
                  {qr.label}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Box>
      </Stack>

      {/* Link către pagina de oferte */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: TOKENS.radius.xl,
          border: `1px solid ${TOKENS.border}`,
          boxShadow: TOKENS.shadow.sm,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: TOKENS.ink }}>
            Oferta BCR pentru PFA Ridesharing
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5 }}>
            Condiții dedicate, în funcție de vechimea PFA-ului tău: Start-Up (sub 12 luni) sau cu
            vechime de peste 1 an.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={() => navigate('/parteneri/bcr/oferte')}
          sx={{
            fontWeight: 750,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            borderColor: TOKENS.primary,
            color: TOKENS.primaryStrong,
            borderRadius: TOKENS.radius.full,
            px: 3,
            '&:hover': {
              borderColor: TOKENS.primaryStrong,
              backgroundColor: alpha(TOKENS.primary, 0.06),
            },
          }}
        >
          Vezi ofertele
        </Button>
      </Paper>
    </Stack>
  )
}

export function PartnerDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const partner = slug ? getPartnerBySlug(slug) : undefined

  if (!partner) {
    return <Navigate to="/parteneri" replace />
  }

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="md">
        <Stack spacing={4}>
          <Box>
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate('/parteneri')}
              sx={{
                mb: 3,
                fontWeight: 700,
                textTransform: 'none',
                color: TOKENS.textMuted,
                '&:hover': { color: TOKENS.ink, backgroundColor: 'transparent' },
              }}
            >
              Toți partenerii
            </Button>

            {/* Antet partener */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: TOKENS.radius.xl,
                border: `1px solid ${TOKENS.border}`,
                boxShadow: TOKENS.shadow.md,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                gap: { xs: 2.5, sm: 4 },
              }}
            >
              <Box
                sx={{
                  width: { xs: '100%', sm: 200 },
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: TOKENS.radius.lg,
                  backgroundColor: alpha(TOKENS.surfaceAlt, 0.6),
                  p: 2.5,
                }}
              >
                <Box
                  component="img"
                  src={partner.image}
                  alt={partner.name}
                  sx={{ maxHeight: 72, maxWidth: 160, width: 'auto', height: 'auto', objectFit: 'contain' }}
                />
              </Box>
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography
                  variant="h4"
                  sx={{ color: TOKENS.ink, fontWeight: 850, fontSize: { xs: '1.5rem', md: '1.9rem' } }}
                >
                  {partner.name}
                </Typography>
                {partner.slug !== 'bcr' && (
                  <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.75, mt: 1.2 }}>
                    {partner.description}
                  </Typography>
                )}
                {partner.website && (
                  <Button
                    component="a"
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNewRoundedIcon />}
                    sx={{
                      mt: 1.5,
                      p: 0,
                      fontWeight: 750,
                      textTransform: 'none',
                      color: TOKENS.primaryStrong,
                      '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                    }}
                  >
                    {partner.website.replace('https://', '')}
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>

          {partner.slug === 'bcr' && <BcrContent />}

          {partner.slug === 'asigurari-ro' && (
            <Box>
              <Typography
                sx={{ fontWeight: 800, fontSize: '1.2rem', color: TOKENS.ink, mb: 2.5, textAlign: 'center' }}
              >
                Obține o ofertă direct online
              </Typography>
              <InsuranceLinksGrid compact />
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  )
}
