import { Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { pageFrameSx } from '../constants/layout'
import { BCR_OFFERS, BCR_ONBOARDING_URL } from '../data/partners'

export function BcrOffersPage() {
  const navigate = useNavigate()

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box>
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate('/parteneri/bcr')}
              sx={{
                mb: 3,
                fontWeight: 700,
                textTransform: 'none',
                color: TOKENS.textMuted,
                '&:hover': { color: TOKENS.ink, backgroundColor: 'transparent' },
              }}
            >
              Înapoi la pagina BCR
            </Button>
            <SectionHeader
              title="Oferta BCR pentru PFA Ridesharing"
              subtitle="Două variante de ofertă prin contul George pentru afacerea ta, în funcție de vechimea PFA-ului: alege varianta care ți se potrivește."
            />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 3, md: 4 },
              alignItems: 'stretch',
            }}
          >
            {BCR_OFFERS.map((offer) => (
              <Paper
                key={offer.title}
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: TOKENS.radius.xl,
                  border: `1px solid ${TOKENS.border}`,
                  boxShadow: TOKENS.shadow.md,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                  '&:hover': {
                    boxShadow: TOKENS.shadow.lg,
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
                    mb: 2,
                  }}
                />
                <Typography sx={{ fontWeight: 850, fontSize: '1.3rem', color: TOKENS.ink }}>
                  {offer.title}
                </Typography>
                <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.6, mb: 3 }}>
                  {offer.note}
                </Typography>

                <Stack spacing={2.2}>
                  {offer.benefits.map((benefit) => (
                    <Stack key={benefit.title} direction="row" spacing={1.5}>
                      <CheckCircleRoundedIcon
                        sx={{ fontSize: 22, color: TOKENS.primaryStrong, mt: 0.2, flexShrink: 0 }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 750, color: TOKENS.ink, lineHeight: 1.45 }}>
                          {benefit.title}
                        </Typography>
                        {benefit.text && (
                          <Typography
                            sx={{ color: TOKENS.textMuted, fontSize: '0.9rem', lineHeight: 1.65, mt: 0.4 }}
                          >
                            {benefit.text}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Box>

          <Stack sx={{ alignItems: 'center' }}>
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
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
