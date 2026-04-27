import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { homeSec9 } from '../data/constants'
import { pageFrameSx } from '../constants/layout'
import logo from '../assets/logo.svg'
import motto from '../assets/motto.svg'

export function AboutPage() {
  const aboutSections = [
    {
      title: 'Ce este Ridelance',
      text: 'Ridelance este o platformă dedicată șoferilor de ridesharing care aleg să lucreze independent. Scopul ei este să simplifice partea administrativă, fiscală și operațională, astfel încât activitatea de zi cu zi să fie mai ușor de gestionat.',
    },
    {
      title: 'De ce am creat platforma',
      text: 'Am construit Ridelance pornind de la o nevoie reală din piață. Mulți șoferi își doresc mai multă independență, dar se lovesc de proceduri neclare, documente, obligații fiscale și lipsa unui sistem simplu care să le organizeze activitatea.',
    },
    {
      title: 'Ce oferim concret',
      text: 'Ridelance aduce într-un singur loc lucrurile care contează pentru un șofer independent: mai multă organizare, acces la informații utile, gestionarea documentelor importante, contabilitate, notificări relevante și suport pentru pașii administrativi esențiali.',
    },
    {
      title: 'Cum lucrăm',
      text: 'Construim Ridelance în jurul unor principii simple: claritate, eficiență, transparență și utilitate reală. Nu vrem să complicăm lucrurile, ci să le facem mai ușor de înțeles și de gestionat pentru fiecare utilizator.',
    }
  ]

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={6} sx={{ alignItems: "center" }}>
          <Box sx={{ textAlign: 'center', maxWidth: 700, mx: 'auto' }}>
            <Box
              component="img"
              src={logo}
              alt="Ridelance Logo"
              sx={{ height: 60, width: 'auto', mb: 4 }}
            />
            <SectionHeader
              title="Despre Ridelance"
              subtitle="Ridelance este platforma creată pentru șoferii de ridesharing care vor să lucreze pe cont propriu, dar într-un mod mai organizat, mai clar și mai profesionist."
            />
          </Box>

          <Box sx={{ position: 'relative', width: '100%', maxWidth: 1000, mx: 'auto', py: 2 }}>
            {/* The central vertical line */}
            <Box sx={{ position: 'absolute', left: { xs: 24, md: '50%' }, top: 0, bottom: 0, width: 2, bgcolor: alpha(TOKENS.primary, 0.2), transform: { md: 'translateX(-50%)' } }} />

            {aboutSections.map((sec, i) => {
              const isEven = i % 2 === 0;
              return (
                <Box key={i} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', mb: { xs: 6, md: 8 }, position: 'relative' }}>
                  {/* Timeline Dot */}
                  <Box sx={{ position: 'absolute', left: { xs: 24, md: '50%' }, top: { xs: 2, md: 24 }, width: 16, height: 16, borderRadius: '50%', bgcolor: TOKENS.primary, transform: { xs: 'translateX(-7px)', md: 'translateX(-50%)' }, border: `3px solid ${TOKENS.surface}`, zIndex: 1 }} />

                  {/* MOBILE LAYOUT */}
                  <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', width: '100%', pl: '60px' }}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'inline-block', px: 3, py: 1, borderRadius: TOKENS.radius.full, bgcolor: TOKENS.primary, color: '#fff', fontWeight: 650, fontSize: '0.9rem' }}>
                        {sec.title}
                      </Box>
                    </Box>
                    <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, width: '100%', borderRadius: TOKENS.radius.lg, border: `1px solid ${TOKENS.border}`, bgcolor: TOKENS.paper, boxShadow: TOKENS.shadow.sm }}>
                      <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.7, fontSize: '0.98rem' }}>{sec.text}</Typography>
                    </Paper>
                  </Box>

                  {/* DESKTOP LAYOUT */}
                  <Box sx={{ display: { xs: 'none', md: 'flex' }, width: '100%' }}>
                    {/* Left Side */}
                    <Box sx={{ width: '50%', pr: 6, display: 'flex', justifyContent: 'flex-end', pt: 2, position: 'relative' }}>
                      {isEven ? (
                        <Paper elevation={0} sx={{ p: 4, width: '100%', borderRadius: TOKENS.radius.lg, border: `1px solid ${TOKENS.border}`, bgcolor: TOKENS.paper, boxShadow: TOKENS.shadow.sm, transition: `all ${TOKENS.duration} ${TOKENS.easing}`, '&:hover': { borderColor: TOKENS.borderHover, boxShadow: TOKENS.shadow.md } }}>
                          <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.7, fontSize: '0.98rem' }}>{sec.text}</Typography>
                        </Paper>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', height: 'fit-content' }}>
                          <Box sx={{ px: 3, py: 1.2, borderRadius: TOKENS.radius.full, bgcolor: TOKENS.primary, color: '#fff', fontWeight: 650, fontSize: '0.95rem', boxShadow: TOKENS.shadow.sm }}>
                            {sec.title}
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {/* Right Side */}
                    <Box sx={{ width: '50%', pl: 6, display: 'flex', flexDirection: 'column', pt: 2 }}>
                      {!isEven ? (
                        <Paper elevation={0} sx={{ p: 4, width: '100%', borderRadius: TOKENS.radius.lg, border: `1px solid ${TOKENS.border}`, bgcolor: TOKENS.paper, boxShadow: TOKENS.shadow.sm, transition: `all ${TOKENS.duration} ${TOKENS.easing}`, '&:hover': { borderColor: TOKENS.borderHover, boxShadow: TOKENS.shadow.md } }}>
                          <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.7, fontSize: '0.98rem' }}>{sec.text}</Typography>
                        </Paper>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', height: 'fit-content' }}>
                          <Box sx={{ px: 3, py: 1.2, borderRadius: TOKENS.radius.full, bgcolor: TOKENS.primary, color: '#fff', fontWeight: 650, fontSize: '0.95rem', boxShadow: TOKENS.shadow.sm }}>
                            {sec.title}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>

                </Box>
              )
            })}
          </Box>

          <Paper elevation={0} sx={{ mt: 2, p: { xs: 4, md: 5 }, borderRadius: TOKENS.radius.xl, border: `1px solid ${TOKENS.border}`, bgcolor: alpha(TOKENS.primary, 0.03), textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
            <Box component="img" src={motto} alt="Independent. Dar nu singur." sx={{ height: 28, width: 'auto', display: 'block', mx: 'auto', mb: 3 }} />
            <Typography sx={{ color: TOKENS.ink, lineHeight: 1.8, fontSize: '1.05rem', fontWeight: 500 }}>
              Acesta este principiul din spatele Ridelance: să oferi șoferului mai mult control și mai multă libertate, fără haosul administrativ care apare de obicei atunci când lucrează pe cont propriu.
            </Typography>
          </Paper>

          {/* FAQ Section */}
          <Box sx={{ width: '100%', mt: 4 }}>
            <SectionHeader title="Întrebări frecvente" />
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              {homeSec9.map((item, index) => (
                <Accordion
                  key={index}
                  elevation={0}
                  sx={{
                    mb: 2,
                    border: `1px solid ${TOKENS.border}`,
                    borderRadius: `${TOKENS.radius.md}px !important`,
                    overflow: 'hidden',
                    backgroundColor: TOKENS.paper,
                    transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                    '&:hover': { borderColor: TOKENS.borderHover },
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon sx={{ color: TOKENS.primary }} />}
                    sx={{
                      px: 3,
                      py: 0.8,
                      '&.Mui-expanded': {
                        backgroundColor: alpha(TOKENS.primary, 0.04),
                      },
                    }}
                  >
                    <Typography
                      sx={{ fontWeight: 700, fontSize: '1rem', color: TOKENS.ink }}
                    >
                      {item.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pb: 3 }}>
                    <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.7 }}>
                      {item.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>

        </Stack>
      </Container>
    </Box>
  )
}
