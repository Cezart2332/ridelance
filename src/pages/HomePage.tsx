import { Box, Button, Card, CardContent, Container, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import {
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
import dashboard from '../assets/dashboard.png'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { ProcessVisual } from '../components/home/ProcessVisual'
import { CarCarousel } from '../components/home/CarCarousel'

export function HomePage() {
  const navigate = useNavigate()
  const { accessToken, isInitialized } = useAppSelector((s) => s.auth)

  const handleStart = () => {
    if (!isInitialized) return
    navigate(accessToken ? '/app' : '/auth')
  }

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
            background: `linear-gradient(135deg, #ffffff 0%, #f7f9fc 100%)`,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.03)',
            border: `1px solid ${alpha(TOKENS.ink, 0.05)}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -120,
              right: -120,
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(TOKENS.primary, 0.18)} 0%, transparent 70%)`,
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -150,
              left: -100,
              width: 350,
              height: 350,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(TOKENS.primaryStrong, 0.08)} 0%, transparent 70%)`,
              filter: 'blur(40px)',
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
                fontSize: { xs: '2.2rem', sm: '3rem', md: '3.6rem' },
                fontWeight: 900,
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
                color: TOKENS.ink,
                maxWidth: 1000,
                mx: { xs: 'auto', md: 0 },
                textWrap: 'balance',
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
                  px: 4.5,
                  py: 1.6,
                  fontSize: '1.02rem',
                  fontWeight: 800,
                  borderRadius: TOKENS.radius.lg,
                  boxShadow: 'none',
                  backgroundColor: TOKENS.primary,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    backgroundColor: TOKENS.primaryStrong,
                    boxShadow: 'none',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Vezi abonamentele
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleStart}
                sx={{
                  px: 4.5,
                  py: 1.6,
                  fontSize: '1.02rem',
                  fontWeight: 800,
                  borderRadius: TOKENS.radius.lg,
                  color: TOKENS.ink,
                  borderColor: alpha(TOKENS.ink, 0.12),
                  backgroundColor: 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    borderColor: alpha(TOKENS.ink, 0.4),
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
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
      <ProcessVisual />

      {/* ═══════ 2.5 CAROUSEL MASINI ═══════ */}
      <CarCarousel />

      {/* ═══════ 3. CUM FUNCTIONEAZA ═══════ */}
      <Box
        sx={{
          width: '100%',
          mt: { xs: 8, md: 12 },
          py: { xs: 8, md: 14 },
          backgroundColor: TOKENS.surfaceAlt,
          borderTop: `1px solid ${alpha(TOKENS.ink, 0.04)}`,
          borderBottom: `1px solid ${alpha(TOKENS.ink, 0.04)}`,
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
              gap: 3.5,
              pt: { xs: 0, md: 4 },
            }}
          >
            {homeSec3.map((card, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: TOKENS.radius.xl,
                  border: `1px solid ${alpha(TOKENS.ink, 0.05)}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
                  backgroundColor: TOKENS.paper,
                  position: 'relative',
                  overflow: 'hidden',
                  transform: { md: index % 2 === 0 ? 'translateY(0)' : 'translateY(16px)' },
                  transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1)`,
                  '&:hover': {
                    transform: {
                      xs: 'translateY(-4px)',
                      md: index % 2 === 0 ? 'translateY(-6px)' : 'translateY(10px)',
                    },
                    boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
                    borderColor: TOKENS.primaryStrong,
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: { xs: 4, md: 4.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 2.5,
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 16,
                      fontSize: '3.5rem',
                      fontWeight: 900,
                      color: alpha(TOKENS.primary, 0.12),
                      userSelect: 'none',
                      fontFamily: 'monospace',
                    }}
                  >
                    {`0${index + 1}`}
                  </Box>

                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                      zIndex: 1,
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
                    sx={{ fontWeight: 800, color: TOKENS.ink, lineHeight: 1.3, zIndex: 1 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: TOKENS.textMuted,
                      fontSize: '0.92rem',
                      lineHeight: 1.65,
                      zIndex: 1,
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
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 4,
            maxWidth: 1200,
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
                borderRadius: TOKENS.radius.xl,
                backgroundColor: TOKENS.paper,
                position: 'relative',
                border:
                  index === 2
                    ? `1.5px solid ${TOKENS.primaryStrong}`
                    : `1px solid ${alpha(TOKENS.ink, 0.06)}`,
                boxShadow:
                  index === 2
                    ? '0 16px 40px rgba(92,203,245,0.14)'
                    : '0 4px 20px rgba(0,0,0,0.01)',
                transition: `all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`,
                '&:hover': {
                  boxShadow:
                    index === 2
                      ? '0 24px 50px rgba(92,203,245,0.22)'
                      : '0 16px 36px rgba(0,0,0,0.04)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              {index === 2 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: TOKENS.primaryStrong,
                    color: '#fff',
                    px: 1.8,
                    py: 0.5,
                    borderRadius: TOKENS.radius.sm,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(92,203,245,0.2)',
                  }}
                >
                  Recomandat
                </Box>
              )}

              <CardContent
                sx={{
                  p: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  gap: 2.5,
                }}
              >
                <Box sx={{ minHeight: { xs: 'auto', md: 105 } }}>
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
                      fontSize: '1.25rem',
                      mt: 0.5,
                    }}
                  >
                    {item.price}
                  </Typography>
                  {item.priceNote && (
                    <Typography
                      sx={{
                        color: TOKENS.textMuted,
                        fontSize: '0.78rem',
                        mt: 0.5,
                        fontStyle: 'italic',
                      }}
                    >
                      {item.priceNote}
                    </Typography>
                  )}
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

                {item.footnote && (
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      color: TOKENS.textMuted,
                      fontStyle: 'italic',
                    }}
                  >
                    {item.footnote}
                  </Typography>
                )}

                <Button
                  onClick={handleStart}
                  variant={index === 2 ? 'contained' : 'outlined'}
                  fullWidth
                  size="large"
                  sx={{
                    mt: 2,
                    py: 1.4,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    borderRadius: TOKENS.radius.lg,
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    color: index === 2 ? '#fff' : TOKENS.ink,
                    borderColor: index === 2 ? 'transparent' : alpha(TOKENS.ink, 0.12),
                    '&:hover':
                      index === 2
                        ? {
                          backgroundColor: TOKENS.primaryStrong,
                          boxShadow: 'none',
                        }
                        : {
                          borderColor: alpha(TOKENS.ink, 0.3),
                          backgroundColor: alpha(TOKENS.ink, 0.01),
                        },
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
          py: { xs: 8, md: 12 },
          backgroundColor: TOKENS.surfaceAlt,
          borderTop: `1px solid ${alpha(TOKENS.ink, 0.04)}`,
          borderBottom: `1px solid ${alpha(TOKENS.ink, 0.04)}`,
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
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3.5,
              maxWidth: 1200,
              mx: 'auto',
            }}
          >
            {homeSec6.map((svc, i) => (
              <Paper
                key={i}
                elevation={0}
                sx={{
                  p: 4.5,
                  borderRadius: TOKENS.radius.xl,
                  border: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
                  backgroundColor: TOKENS.paper,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5,
                  justifyContent: 'space-between',
                  minHeight: 280,
                  transition: `all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.04)',
                    borderColor: TOKENS.primaryStrong,
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
                  onClick={handleStart}
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
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                color: TOKENS.primaryStrong,
                fontWeight: 700,
                mb: 4,
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
                boxShadow: 'none',
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
              border: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
              boxShadow: '0 10px 40px rgba(0,0,0,0.02)',
              overflow: 'hidden',
              backgroundColor: TOKENS.paper,
            }}
          >
            <Box
              sx={{
                display: { xs: 'none', md: 'grid' },
                gridTemplateColumns: '1.5fr 1fr 1fr',
                backgroundColor: alpha(TOKENS.surfaceAlt, 0.6),
                borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
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
                  display: { xs: 'flex', md: 'grid' },
                  flexDirection: { xs: 'column', md: 'unset' },
                  gridTemplateColumns: { md: '1.5fr 1fr 1fr' },
                  gap: { xs: 1.5, md: 0 },
                  p: 2.5,
                  borderBottom: i === economyComparison.length - 1 ? 'none' : `1px solid ${alpha(TOKENS.ink, 0.05)}`,
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(TOKENS.surfaceAlt, 0.3),
                  },
                }}
              >
                <Typography sx={{ fontWeight: 700, color: TOKENS.ink, fontSize: '0.95rem' }}>
                  {row.service}
                </Typography>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ display: { xs: 'flex', md: 'contents' }, width: '100%' }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: { md: 'none' },
                        fontWeight: 800,
                        color: TOKENS.primaryStrong,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        mb: 0.5,
                      }}
                    >
                      Cu RIDElance
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: TOKENS.primaryStrong,
                        fontSize: '0.95rem',
                        textAlign: { xs: 'left', md: 'center' },
                        px: { xs: 0, md: 2 },
                        py: 0.5,
                        borderRadius: TOKENS.radius.md,
                        backgroundColor: alpha(TOKENS.primary, 0.08),
                        display: 'inline-block',
                      }}
                    >
                      {row.withRidelance}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: { xs: 'right', md: 'center' } }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: { md: 'none' },
                        fontWeight: 800,
                        color: TOKENS.textSubtle,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        mb: 0.5,
                      }}
                    >
                      Fără RIDElance
                    </Typography>
                    <Typography sx={{ fontWeight: 500, color: TOKENS.textMuted, fontSize: '0.95rem' }}>
                      {row.withoutRidelance}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Paper>
        </Box>
      </Container>

      {/* ═══════ 7. DASHBOARD ═══════ */}
      <Box
        sx={{
          width: '100%',
          background: 'radial-gradient(circle at 10% 20%, #1b223c 0%, #0d0e15 100%)',
          color: '#FFFFFF',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          borderTop: `1px solid rgba(255, 255, 255, 0.08)`,
          borderBottom: `1px solid rgba(255, 255, 255, 0.08)`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -150,
            right: -150,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(92,203,245,0.12) 0%, transparent 75%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(92,203,245,0.06) 0%, transparent 75%)',
            filter: 'blur(45px)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '0.8fr 1.2fr' },
              gap: { xs: 5, md: 6 },
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  mb: 2.5,
                  fontSize: { xs: '1.8rem', md: '2.8rem' },
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
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
                  lineHeight: 1.75,
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
                        fontWeight: 500,
                        color: alpha('#fff', 0.9),
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
                  color: TOKENS.ink,
                  borderRadius: TOKENS.radius.lg,
                  px: 4.5,
                  py: 1.6,
                  fontWeight: 800,
                  fontSize: '1.02rem',
                  boxShadow: 'none',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    backgroundColor: TOKENS.primaryStrong,
                    boxShadow: 'none',
                    transform: 'translateY(-2px)',
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
                width: '100%',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  borderRadius: TOKENS.radius.xl,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 24px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(92,203,245,0.06)',
                  overflow: 'hidden',
                  backgroundColor: '#1b223c',
                }}
              >
                {/* Browser bar header mockup */}
                <Box
                  sx={{
                    height: 36,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    gap: 1,
                  }}
                >
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27c93f' }} />
                  <Box
                    sx={{
                      mx: 'auto',
                      height: 18,
                      width: '45%',
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.15)', mr: 0.8 }} />
                    <Box sx={{ height: 4, width: 80, borderRadius: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
                  </Box>
                </Box>
                <Box
                  component="img"
                  src={dashboard}
                  sx={{
                    width: '100%',
                    display: 'block',
                  }}
                />
              </Box>
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
                mb: 2.2,
                border: `1px solid ${alpha(TOKENS.border, 0.8)}`,
                borderRadius: `${TOKENS.radius.lg}px !important`,
                overflow: 'hidden',
                backgroundColor: TOKENS.paper,
                boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
                transition: `all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`,
                '&:hover': {
                  borderColor: TOKENS.primaryStrong,
                  boxShadow: '0 10px 28px rgba(0,0,0,0.03)',
                },
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
          py: { xs: 8, md: 12 },
          textAlign: 'center',
          background: `linear-gradient(135deg, ${TOKENS.surfaceAlt} 0%, #edf1f7 100%)`,
          borderTop: `1px solid ${alpha(TOKENS.ink, 0.04)}`,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '1.7rem', md: '2.4rem' },
              mb: 3,
              letterSpacing: '-0.02em',
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
                py: 1.5,
                borderRadius: TOKENS.radius.lg,
                fontWeight: 800,
                fontSize: '1.02rem',
                boxShadow: 'none',
                backgroundColor: TOKENS.primary,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  backgroundColor: TOKENS.primaryStrong,
                  transform: 'translateY(-2px)',
                  boxShadow: 'none',
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
                py: 1.5,
                borderRadius: TOKENS.radius.lg,
                fontWeight: 800,
                fontSize: '1.02rem',
                borderColor: alpha(TOKENS.ink, 0.12),
                color: TOKENS.ink,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  borderColor: alpha(TOKENS.ink, 0.35),
                  backgroundColor: alpha(TOKENS.ink, 0.015),
                  transform: 'translateY(-2px)',
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
