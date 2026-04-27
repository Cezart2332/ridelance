import { Box, Container, Paper, Stack, Typography } from '@mui/material'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { partnerLogos } from '../data/constants'
import { pageFrameSx } from '../constants/layout'

export function PartnersPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={5}>
          <SectionHeader title="Parteneri" />

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {partnerLogos.map((partner) => (
              <Paper
                key={partner.name}
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: TOKENS.radius.lg,
                  border: `1px solid ${TOKENS.border}`,
                  boxShadow: TOKENS.shadow.md,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 3,
                  transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                  '&:hover': {
                    boxShadow: TOKENS.shadow.lg,
                    borderColor: TOKENS.borderHover,
                    transform: 'translateY(-3px)',
                  },
                }}
              >
                <Box
                  component="a"
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={partner.name}
                  sx={{
                    lineHeight: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 140,
                  }}
                >
                  <Box
                    component="img"
                    src={partner.image}
                    alt={partner.name}
                    sx={{ width: 140, height: 'auto', display: 'block' }}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ color: TOKENS.ink, fontWeight: 750, mb: 0.8 }}
                  >
                    {partner.name}
                  </Typography>
                  <Typography
                    sx={{
                      color: TOKENS.textMuted,
                      lineHeight: 1.7,
                      fontSize: '0.95rem',
                    }}
                  >
                    {partner.desc}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
