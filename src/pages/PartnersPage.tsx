import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { partners } from '../data/partners'
import { pageFrameSx } from '../constants/layout'

export function PartnersPage() {
  const navigate = useNavigate()

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={5}>
          <SectionHeader
            title="Parteneri"
            subtitle="Colaborăm cu parteneri care aduc beneficii concrete șoferilor RIDElance. Intră pe pagina fiecărui partener pentru detalii și oferte."
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: { xs: 2.5, md: 3 },
            }}
          >
            {partners.map((partner) => (
              <Paper
                key={partner.slug}
                elevation={0}
                onClick={() => navigate(`/parteneri/${partner.slug}`)}
                sx={{
                  p: { xs: 3, md: 3.5 },
                  borderRadius: TOKENS.radius.xl,
                  border: `1px solid ${TOKENS.border}`,
                  boxShadow: TOKENS.shadow.sm,
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                  '&:hover': {
                    boxShadow: TOKENS.shadow.lg,
                    borderColor: TOKENS.primary,
                    transform: 'translateY(-3px)',
                  },
                }}
              >
                <Box
                  sx={{
                    height: 84,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5,
                    borderRadius: TOKENS.radius.lg,
                    backgroundColor: alpha(TOKENS.surfaceAlt, 0.6),
                    p: 1.5,
                  }}
                >
                  <Box
                    component="img"
                    src={partner.image}
                    alt={partner.name}
                    sx={{
                      maxHeight: 56,
                      maxWidth: 170,
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ color: TOKENS.ink, fontWeight: 800, mb: 0.8, textAlign: 'center' }}
                >
                  {partner.name}
                </Typography>
                <Typography
                  sx={{
                    color: TOKENS.textMuted,
                    lineHeight: 1.65,
                    fontSize: '0.92rem',
                    textAlign: 'center',
                    mb: 2.5,
                  }}
                >
                  {partner.tagline}
                </Typography>
                <Button
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    mt: 'auto',
                    alignSelf: 'center',
                    fontWeight: 750,
                    textTransform: 'none',
                    color: TOKENS.primaryStrong,
                    '&:hover': { backgroundColor: alpha(TOKENS.primary, 0.08) },
                  }}
                >
                  Pagina partenerului
                </Button>
              </Paper>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
