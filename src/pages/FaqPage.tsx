import { Box, Container, Stack, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { faqItems } from '../data/constants'

const pageFrameSx = {
  minHeight: { xs: 'calc(100vh - 84px)', md: 'calc(100vh - 100px)' },
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  py: { xs: 5, md: 8 },
}

export function FaqPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <SectionHeader title="Intrebari Frecvente" />
          <Box>
            {faqItems.map((item, index) => (
              <Accordion
                key={item.title}
                disableGutters
                elevation={0}
                sx={{
                  backgroundColor: TOKENS.paper,
                  border: `1px solid ${TOKENS.border}`,
                  boxShadow: TOKENS.shadow.sm,
                  borderRadius: `${TOKENS.radius.lg}px !important`,
                  overflow: 'hidden',
                  mb: index === faqItems.length - 1 ? 0 : 2.5,
                  transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                  '&:hover': {
                    borderColor: TOKENS.borderHover,
                    boxShadow: TOKENS.shadow.md,
                  },
                  '&.Mui-expanded': {
                    borderColor: alpha(TOKENS.primary, 0.25),
                  },
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreRoundedIcon sx={{ color: TOKENS.primary }} />}
                  sx={{
                    minHeight: 60,
                    px: { xs: 2.5, md: 3.5 },
                    transition: `background-color ${TOKENS.duration} ${TOKENS.easing}`,
                    '&:hover': { backgroundColor: alpha(TOKENS.primary, 0.04) },
                    '&.Mui-expanded': {
                      backgroundColor: alpha(TOKENS.primary, 0.06),
                    },
                  }}
                >
                  <Typography
                    sx={{ fontWeight: 700, fontSize: '1.02rem', color: TOKENS.ink }}
                  >
                    {item.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 2.5, md: 3.5 }, pb: 3 }}>
                  <Typography sx={{ lineHeight: 1.75, color: TOKENS.textMuted }}>
                    {item.text}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
