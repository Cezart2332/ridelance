import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { homeSec6 } from '../data/constants'
import { pageFrameSx } from '../constants/layout'

export function ServicesPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={6} sx={{ alignItems: "center", justifyContent: "center" }}>
          <SectionHeader
            title="Serviciile noastre"
            subtitle="Tot ce ai nevoie pentru activitatea ta, într-un singur loc."
          />

          {/* Servicii individuale (din homeSec6) */}
          <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: TOKENS.ink }}>
              Servicii individuale
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 4,
                justifyContent: 'center',
              }}
            >
              {homeSec6.map((svc, i) => (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: TOKENS.radius.lg,
                    border: `1px solid ${TOKENS.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    flex: '1 1 280px',
                    maxWidth: 420,
                    boxShadow: TOKENS.shadow.sm,
                    transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                    '&:hover': {
                      boxShadow: TOKENS.shadow.md,
                      borderColor: TOKENS.borderHover,
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 800, color: TOKENS.ink }}>
                      {svc.title}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        sx={{
                          color: TOKENS.primaryStrong,
                          fontWeight: 800,
                          fontSize: '1.15rem',
                          lineHeight: 1.2,
                        }}
                      >
                        {svc.price}
                      </Typography>
                      {svc.priceNote && (
                        <Typography
                          sx={{
                            color: TOKENS.textMuted,
                            fontSize: '0.7rem',
                            mt: 0.3,
                            lineHeight: 1.3,
                          }}
                        >
                          {svc.priceNote}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                  <Typography
                    sx={{
                      color: TOKENS.textMuted,
                      lineHeight: 1.65,
                      flexGrow: 1,
                      fontSize: '0.95rem',
                    }}
                  >
                    {svc.desc}
                  </Typography>
                  {svc.tagline && (
                    <Typography
                      sx={{
                        color: TOKENS.ink,
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        fontStyle: 'italic',
                      }}
                    >
                      {svc.tagline}
                    </Typography>
                  )}
                  <Button
                    variant="outlined"
                    sx={{
                      alignSelf: 'flex-start',
                      borderRadius: TOKENS.radius.full,
                      px: 3.5,
                      py: 1,
                      fontWeight: 700,
                      borderColor: TOKENS.borderHover,
                      color: TOKENS.ink,
                      '&:hover': {
                        borderColor: alpha(TOKENS.ink, 0.3),
                        backgroundColor: alpha(TOKENS.ink, 0.02),
                      },
                    }}
                  >
                    {svc.cta}
                  </Button>
                </Paper>
              ))}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
