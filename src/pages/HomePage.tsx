import { Box, Button, Card, CardContent, Container, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { GradientCheckIcon } from '../components/common/GradientCheckIcon'
import {
  homeSec2,
  homeSec3,
  homeSec6,
  homeSec9,
  pricingCards,
  economyComparison,
  partnerLogos,
} from '../data/constants'

import motto from '../assets/motto.svg'
import car from '../assets/car.svg'
import checkSvg from '../assets/SVG/2- Regular/check-circle.svg'
import dashboard from '../assets/dashboard.svg'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <Box sx={{ pb: 0, flexDirection: 'column', display: 'flex' }}>
      {/* ═══════ HERO ═══════ */}
      <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 5 }, pb: { xs: 2, md: 4 } }}>
        <Paper
          elevation={0}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
            alignItems: 'center',
            gap: { xs: 4, md: 6 },
            p: { xs: 3, sm: 4, md: 6 },
            borderRadius: TOKENS.radius.xl,
            background: `linear-gradient(135deg, ${TOKENS.paper} 0%, ${TOKENS.surfaceAlt} 100%)`,
            boxShadow: TOKENS.shadow.md,
            border: `1px solid ${TOKENS.border}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(TOKENS.primary, 0.06)} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          <Box
            sx={{
              textAlign: { xs: 'center', md: 'left' },
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                mb: 3,
                display: 'flex',
                justifyContent: { xs: 'center', md: 'flex-start' },
              }}
            >
              <Box
                component="img"
                src={motto}
                alt="Independent. Dar nu singur."
                sx={{ height: { xs: 24, md: 32 }, width: 'auto', display: 'block' }}
              />
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '1.9rem', sm: '2.4rem', md: '3rem' },
                maxWidth: 1000,
                mx: { xs: 'auto', md: 0 },
              }}
            >
              Totul într-un singur loc.
            </Typography>

            <Typography
              sx={{
                mt: 2.5,
                color: TOKENS.textMuted,
                fontSize: { xs: '1rem', md: '1.1rem' },
                maxWidth: 520,
                mx: { xs: 'auto', md: 0 },
                lineHeight: 1.75,
              }}
            >
              De la deschidere PFA și autorizații, până la contabilitate, Fleet, SPV și cheltuieli în dashboard
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                mt: 4,
                mb: 4,
                justifyContent: { xs: 'center', md: 'flex-start' },
              }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/abonamente-preturi')}
                sx={{
                  px: 4,
                  py: 1.4,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  boxShadow: TOKENS.shadow.glow,
                  backgroundColor: TOKENS.primary,
                  '&:hover': {
                    backgroundColor: TOKENS.primaryStrong,
                  },
                }}
              >
                Vezi abonamentele
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/auth')}
                sx={{
                  px: 4,
                  py: 1.4,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: TOKENS.ink,
                  borderColor: TOKENS.borderHover,
                  backgroundColor: TOKENS.paper,
                  '&:hover': {
                    borderColor: alpha(TOKENS.ink, 0.25),
                    backgroundColor: TOKENS.paper,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Incepe acum
              </Button>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.5,
                textAlign: 'left',
                maxWidth: 420,
                mx: { xs: 'auto', md: 0 },
              }}
            >
              {[
                'PFA & acte esentiale',
                'Fleet Uber & Bolt',
                'SPV & facturi',
                'Dashboard dedicat',
              ].map((hl) => (
                <Stack
                  direction="row"
                  spacing={1.2}
                  sx={{ alignItems: 'center' }}
                  key={hl}
                >
                  <CheckCircleOutlineRoundedIcon
                    sx={{ color: TOKENS.primary, fontSize: 18 }}
                  />
                  <Typography
                    sx={{
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: alpha(TOKENS.ink, 0.82),
                    }}
                  >
                    {hl}
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Box
              component="img"
              src={car}
              alt="Hero"
              sx={{
                width: { xs: '90%', md: '100%' },
                maxWidth: 420,
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.06))',
              }}
            />
          </Box>
        </Paper>
      </Container>

      {/* ═══════ 2. TOT PROCESUL ═══════ */}
      <Container maxWidth="lg" sx={{ mt: { xs: 7, md: 10 } }}>
        <SectionHeader
          title="Tot procesul, intr-un singur loc"
          subtitle="Acoperim pasii esentiali, de la inceput pana la activitate"
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: { xs: 2, md: 3 },
          }}
        >
          {homeSec2.map((item, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                px: { xs: 3, md: 4 },
                py: { xs: 2, md: 2.5 },
                borderRadius: '50px',
                border: `1px solid ${TOKENS.border}`,
                backgroundColor: TOKENS.paper,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                textAlign: 'left',
                gap: 2,
                transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': {
                  borderColor: TOKENS.borderHover,
                  boxShadow: TOKENS.shadow.md,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <GradientCheckIcon />
              <Typography
                sx={{
                  fontWeight: 650,
                  color: TOKENS.ink,
                  fontSize: '0.95rem',
                  lineHeight: 1.4,
                }}
              >
                {item}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* ═══════ 3. CUM FUNCTIONEAZA ═══════ */}
      <Box
        sx={{
          width: '100%',
          mt: { xs: 8, md: 12 },
          py: { xs: 7, md: 10 },
          backgroundColor: TOKENS.surfaceAlt,
          borderTop: `1px solid ${TOKENS.border}`,
          borderBottom: `1px solid ${TOKENS.border}`,
        }}
      >
        <Container maxWidth="xl">
          <SectionHeader
            title="Cum functioneaza"
            subtitle="Simplu, clar si organizat"
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
              gap: 3,
            }}
          >
            {homeSec3.map((card, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: TOKENS.radius.lg,
                  border: `1px solid ${TOKENS.border}`,
                  boxShadow: 'none',
                  transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                  '&:hover': {
                    boxShadow: TOKENS.shadow.sm,
                    borderColor: TOKENS.borderHover,
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: { xs: 3, md: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                    }}
                  >
                    <Box
                      component="img"
                      src={card.image}
                      sx={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 750, color: TOKENS.ink, lineHeight: 1.3 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: TOKENS.textMuted,
                      fontSize: '0.92rem',
                      lineHeight: 1.65,
                    }}
                  >
                    {card.text}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════ 5. ABONAMENTE ═══════ */}
      <Container maxWidth="xl" sx={{ mt: { xs: 8, md: 12 } }}>
        <SectionHeader
          title="Abonamente"
          subtitle="Alege planul potrivit pentru tine"
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            maxWidth: 1100,
            mx: 'auto',
          }}
        >
          {pricingCards.map((item, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                p: { xs: 3, md: 4.5 },
                borderRadius: TOKENS.radius.xs,
                backgroundColor: TOKENS.paper,
                border:
                  index === 1
                    ? `2px solid ${TOKENS.primary}`
                    : `1px solid ${TOKENS.border}`,
                boxShadow:
                  index === 1 ? TOKENS.shadow.glow : 'none',
                transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': {
                  boxShadow:
                    index === 1
                      ? '0 8px 32px rgba(26,100,237,0.18)'
                      : TOKENS.shadow.md,
                },
              }}
            >
              <CardContent
                sx={{
                  p: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  gap: 2.5,
                }}
              >
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.35rem',
                      color: TOKENS.ink,
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: TOKENS.primaryStrong,
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      mt: 0.5,
                    }}
                  >
                    {item.price}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color: TOKENS.textMuted,
                    lineHeight: 1.65,
                    fontSize: '0.95rem',
                  }}
                >
                  {item.summary}
                </Typography>

                {item.intro && (
                  <Typography
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: TOKENS.ink,
                    }}
                  >
                    {item.intro}
                  </Typography>
                )}

                <Stack spacing={1.8} sx={{ flexGrow: 1 }}>
                  {item.list.map((point) => (
                    <Stack
                      direction="row"
                      spacing={1.5}
                      key={point}
                      sx={{ alignItems: 'flex-start' }}
                    >
                      <CheckCircleOutlineRoundedIcon
                        sx={{
                          color: TOKENS.primary,
                          fontSize: 20,
                          flexShrink: 0,
                          mt: 0.1,
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: '0.92rem',
                          color: alpha(TOKENS.ink, 0.82),
                          lineHeight: 1.55,
                        }}
                      >
                        {point}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Button
                  onClick={() => navigate('/auth')}
                  variant={index === 1 ? 'contained' : 'outlined'}
                  fullWidth
                  size="large"
                  sx={{
                    mt: 2,
                    py: 1.3,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: TOKENS.radius.full,
                    boxShadow: index === 1 ? TOKENS.shadow.glow : 'none',
                    '&:hover':
                      index === 1
                        ? {
                          boxShadow: '0 12px 40px rgba(26,100,237,0.25)',
                          transform: 'translateY(-1px)',
                        }
                        : { backgroundColor: alpha(TOKENS.primary, 0.04) },
                  }}
                >
                  {item.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* ═══════ 6. SERVICII INDIVIDUALE ═══════ */}
      <Box
        sx={{
          width: '100%',
          mt: { xs: 8, md: 10 },
          py: { xs: 7, md: 10 },
          backgroundColor: TOKENS.surfaceAlt,
          borderTop: `1px solid ${TOKENS.border}`,
          borderBottom: `1px solid ${TOKENS.border}`,
        }}
      >
        <Container maxWidth="lg">
          <SectionHeader
            title="Servicii Individuale"
            subtitle="Ai nevoie doar de un serviciu punctual?"
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 4,
              maxWidth: 900,
              mx: 'auto',
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
                  transition: `border-color ${TOKENS.duration} ${TOKENS.easing}`,
                  '&:hover': {
                    borderColor: TOKENS.borderHover,
                  },
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, color: TOKENS.ink }}>
                    {svc.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: TOKENS.primaryStrong,
                      fontWeight: 800,
                      fontSize: '1.15rem',
                    }}
                  >
                    {svc.price}
                  </Typography>
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
                <Button
                  onClick={() => navigate('/auth')}
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
        </Container>
      </Box>

      {/* ═══════ 4. CAT ECONOMISESTI ═══════ */}
      <Container maxWidth="xl" sx={{ mt: { xs: 8, md: 15 }, mb: { xs: 8, md: 10 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1.3fr' },
            gap: { xs: 6, lg: 10 },
            alignItems: 'start',
          }}
        >
          {/* Left: Content */}
          <Box>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.8rem', md: '2.8rem' },
                fontWeight: 800,
                color: TOKENS.ink,
                lineHeight: 1.2,
                mb: 2,
              }}
            >
              Cât economisești cu RIDElance?
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                color: TOKENS.primaryStrong,
                fontWeight: 700,
                mb: 4,
              }}
            >
              Tot ce ai nevoie ca să lucrezi pe cont propriu, într-un singur ecosistem.
            </Typography>

            <Typography
              sx={{
                fontSize: '1.05rem',
                color: TOKENS.textMuted,
                lineHeight: 1.8,
                mb: 5,
                maxWidth: 500,
              }}
            >
              RIDElance nu este doar un abonament. Este infrastructura completă pentru șoferii
              de ridesharing care vor să lucreze legal, organizat și fără să piardă timp cu
              zeci de servicii separate.
            </Typography>

            <Paper
              elevation={0}
              sx={{
                borderRadius: TOKENS.radius.lg,
                backgroundColor: alpha(TOKENS.surfaceAlt, 0.6),
                border: `1px solid ${TOKENS.border}`,
                mb: 5,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: TOKENS.ink, mb: 1.5, fontSize: '1.1rem' }}
              >
                Valoare reală, nu doar cost lunar
              </Typography>
              <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.7, fontSize: '0.95rem' }}>
                Luate separat, aceste servicii pot deveni costisitoare, greu de urmărit și
                consumatoare de timp. Cu RIDElance, le ai într-un singur loc: deschidere PFA,
                contabilitate, sediu social, beneficii, reduceri, organizare și suport pentru
                activitatea ta.
              </Typography>
            </Paper>

            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/abonamente-preturi')}
              sx={{
                px: 5,
                py: 1.6,
                fontSize: '1.05rem',
                fontWeight: 700,
                borderRadius: TOKENS.radius.full,
                backgroundColor: TOKENS.primary,
                boxShadow: TOKENS.shadow.glow,
                '&:hover': {
                  backgroundColor: TOKENS.primaryStrong,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Vezi abonamentele
            </Button>
          </Box>

          {/* Right: Table */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: TOKENS.radius.xl,
              border: `2px solid ${TOKENS.primary}`, // PRO border style
              boxShadow: TOKENS.shadow.xl,
              overflow: 'hidden',
              backgroundColor: TOKENS.paper,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 1fr',
                backgroundColor: alpha(TOKENS.surfaceAlt, 0.8),
                borderBottom: `1px solid ${TOKENS.border}`,
                p: 2.5,
              }}
            >
              <Typography sx={{ fontWeight: 800, color: TOKENS.textSubtle, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Serviciu / Beneficiu
              </Typography>
              <Typography sx={{ fontWeight: 800, color: TOKENS.primaryStrong, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                Cu RIDElance
              </Typography>
              <Typography sx={{ fontWeight: 800, color: TOKENS.textSubtle, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                Fără RIDElance
              </Typography>
            </Box>

            {economyComparison.map((row, i) => (
              <Box
                key={i}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr',
                  p: 2.5,
                  borderBottom: i === economyComparison.length - 1 ? 'none' : `1px solid ${TOKENS.border}`,
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(TOKENS.surfaceAlt, 0.3),
                  },
                }}
              >
                <Typography sx={{ fontWeight: 700, color: TOKENS.ink, fontSize: '0.95rem' }}>
                  {row.service}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: TOKENS.primaryStrong,
                      fontSize: '0.95rem',
                      textAlign: 'center',
                      px: 2,
                      py: 0.5,
                      borderRadius: TOKENS.radius.md,
                      backgroundColor: alpha(TOKENS.primary, 0.08),
                    }}
                  >
                    {row.withRidelance}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 500, color: TOKENS.textMuted, fontSize: '0.95rem', textAlign: 'center' }}>
                  {row.withoutRidelance}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      </Container>

      {/* ═══════ 7. DASHBOARD ═══════ */}
      <Box
        sx={{
          width: '100%',
          background: `linear-gradient(145deg, #111827 0%, #1a1a2e 100%)`,
          color: '#FFFFFF',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(26,100,237,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(26,100,237,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
              gap: { xs: 5, md: 8 },
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 2.5,
                  fontSize: { xs: '1.8rem', md: '2.8rem' },
                  lineHeight: 1.12,
                  color: '#fff',
                }}
              >
                Mai mult control,
                <br />
                mai putin stres administrativ
              </Typography>
              <Typography
                sx={{
                  color: alpha('#fff', 0.72),
                  fontSize: '1.05rem',
                  mb: 4,
                  maxWidth: 480,
                  lineHeight: 1.7,
                }}
              >
                Dashboardul RIDElance este gândit pentru activitatea reală a unui șofer care lucrează pe cont propriu.
              </Typography>
              <Typography
                sx={{
                  color: alpha('#fff', 0.72),
                  fontSize: '1.05rem',
                  mb: 4,
                  maxWidth: 480,
                  lineHeight: 1.7,
                }}
              >Ai acces rapid la:</Typography>
              <Stack spacing={2.2} sx={{ mb: 5 }}>
                {[
                  'Incarcarea cheltuielilor si documentelor;',
                  'Chat direct cu contabilul;',
                  'Chat direct cu echipa de suport;',
                  'Statistici detaliate despre activitatea PFA-ului;',
                  'Remindere pentru expirarea documentelor;',
                  'Solicitarea unui vehicul gata de ridesharing, direct din dashboard.',
                ].map((pt, j) => (
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: 'center' }}
                    key={j}
                  >
                    <Box
                      component="img"
                      src={checkSvg}
                      sx={{
                        width: 20,
                        height: 20,
                        filter: 'invert(1)',
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{
                        fontWeight: 450,
                        color: alpha('#fff', 0.88),
                        fontSize: '0.95rem',
                      }}
                    >
                      {pt}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/demo')}
                sx={{
                  backgroundColor: TOKENS.primary,
                  color: '#fff',
                  borderRadius: TOKENS.radius.full,
                  px: 4,
                  py: 1.4,
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  boxShadow: TOKENS.shadow.glow,
                  '&:hover': {
                    backgroundColor: TOKENS.primaryStrong,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(26,100,237,0.3)',
                  },
                }}
              >
                Vezi cum functioneaza
              </Button>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src={dashboard}
                sx={{
                  width: '100%',
                  maxWidth: 400,
                  opacity: 0.7,
                  filter: 'brightness(0) invert(1)',
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ═══════ PARTNERS SECTION ═══════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, borderBottom: `1px solid ${TOKENS.border}`, backgroundColor: alpha(TOKENS.surfaceAlt, 0.4) }}>
        <Container maxWidth="lg">
          <Typography
            sx={{
              textAlign: 'center',
              color: TOKENS.textSubtle,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              fontSize: '0.85rem',
              fontWeight: 800,
              mb: 6,
            }}
          >
            Partenerii RIDElance
          </Typography>
          <Stack
            direction="row"
            spacing={{ xs: 6, md: 12 }}
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: { xs: 4, md: 0 }
            }}
          >
            {partnerLogos.map((partner) => (
              <Box
                key={partner.name}
                component="a"
                href={partner.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.7,
                  transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <Box
                  component="img"
                  src={partner.image}
                  alt={partner.name}
                  sx={{
                    height: { xs: 45, md: 70 },
                    maxWidth: 240,
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'grayscale(100%) brightness(0.5)',
                    transition: 'all 0.4s ease',
                    '&:hover': {
                      filter: 'none',
                    },
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ═══════ 9. FAQ ═══════ */}
      <Container maxWidth="md" sx={{ mt: { xs: 8, md: 12 } }}>
        <SectionHeader title="Intrebari frecvente" />
        <Box>
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
      </Container>

      {/* ═══════ 10. CTA FINAL ═══════ */}
      <Box
        sx={{
          width: '100%',
          mt: { xs: 8, md: 12 },
          py: { xs: 7, md: 10 },
          textAlign: 'center',
          backgroundColor: TOKENS.surfaceAlt,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.7rem', md: '2.4rem' },
              mb: 3,
              color: TOKENS.ink,
            }}
          >
            Alege varianta potrivită și începe simplu, clar și organizat.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mt: 5, justifyContent: 'center' }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/abonamente-preturi')}
              sx={{
                px: 5,
                py: 1.4,
                borderRadius: TOKENS.radius.full,
                fontWeight: 700,
                fontSize: '1.05rem',
                boxShadow: TOKENS.shadow.glow,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(26,100,237,0.25)',
                },
              }}
            >
              Vezi abonamentele
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                px: 5,
                py: 1.4,
                borderRadius: TOKENS.radius.full,
                fontWeight: 700,
                fontSize: '1.05rem',
                borderColor: TOKENS.borderHover,
                color: TOKENS.ink,
                '&:hover': {
                  borderColor: alpha(TOKENS.ink, 0.25),
                  backgroundColor: alpha(TOKENS.ink, 0.02),
                },
              }}
            >
              Vezi serviciile
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
