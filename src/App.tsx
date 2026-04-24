import { useEffect, useState, useCallback } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Drawer,
  IconButton,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import logo from './assets/logo.svg'
import motto from './assets/motto.svg'
import car from './assets/car.svg'
import docs from './assets/docs.svg'
import renteaza from './assets/renteaza.svg'
import silso from './assets/silso.png'
import lion from './assets/lion.png'

import character2 from './assets/Stickers/character 2.png'
import scene1 from './assets/Stickers/scene 1.png'
import scene4 from './assets/Stickers/scene 4.png'


import checkSvg from './assets/SVG/2- Regular/check-circle.svg'
import starSvg from './assets/SVG/2- Regular/star.svg'
import arrowRight from './assets/SVG/2- Regular/arrow-right.svg'
import desktop from './assets/SVG/2- Regular/desktop.svg'
import dashboard from './assets/dashboard.svg'
import DashboardDemoPage from './components/dashboard-demo/DashboardDemoPage'
import DashboardPage from './components/dashboard/DashboardPage'
import AuthPage from './components/auth/AuthPage'
import RegisterPfaPage from './components/auth/RegisterPfaPage'
import RegistrationSuccessPage from './components/auth/RegistrationSuccessPage'

/* ────────────────────────────────────────────────
   Design Tokens (consistent with main.tsx)
   ──────────────────────────────────────────────── */
const TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#FAFAFA',
  surfaceAlt: '#F5F5F7',
  border: 'rgba(0, 0, 0, 0.06)',
  borderHover: 'rgba(0, 0, 0, 0.12)',
  textMain: '#1a1a2e',
  textMuted: 'rgba(26, 26, 46, 0.6)',
  textSubtle: 'rgba(26, 26, 46, 0.4)',
  radius: {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 6,
    xl: 8,
    full: 4,
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    lg: '0 4px 16px rgba(0,0,0,0.08)',
    xl: '0 8px 30px rgba(0,0,0,0.10)',
    glow: '0 2px 8px rgba(92,203,245,0.12)',
  },
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  duration: '200ms',
}

/* ────────────────────────────────────────────────
   Shared Styled Components / Helpers
   ──────────────────────────────────────────────── */

const SectionHeader = ({
  title,
  subtitle,
  align = 'center',
  maxWidth = 640,
}: {
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  maxWidth?: number
}) => (
  <Box
    sx={{
      textAlign: align,
      mb: { xs: 4, md: 6 },
      maxWidth,
      mx: align === 'center' ? 'auto' : undefined,
    }}
  >
    <Typography
      variant="h2"
      sx={{
        fontSize: { xs: '1.7rem', md: '2.6rem' },
        color: TOKENS.ink,
      }}
    >
      {title}
    </Typography>
    {subtitle && (
      <Typography
        sx={{
          mt: 1.5,
          color: TOKENS.textMuted,
          fontSize: { xs: '1rem', md: '1.1rem' },
          maxWidth: 520,
          mx: align === 'center' ? 'auto' : undefined,
        }}
      >
        {subtitle}
      </Typography>
    )}
  </Box>
)

const GradientCheckIcon = ({ sx }: { sx?: object }) => (
  <Box
    component="img"
    src={checkSvg}
    sx={{
      width: 22,
      height: 22,
      flexShrink: 0,
      mt: 0.2,
      filter:
        'invert(28%) sepia(87%) saturate(2222%) hue-rotate(210deg) brightness(98%) contrast(92%)',
      ...sx,
    }}
  />
)

const pageFrameSx = {
  minHeight: { xs: 'calc(100vh - 84px)', md: 'calc(100vh - 100px)' },
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  py: { xs: 5, md: 8 },
}

const loremText =
  'Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio ipsa ducimus, ipsam pariatur hic possimus aliquam eaque similique nostrum.'
const loremLongText =
  'Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio ipsa ducimus, ipsam pariatur hic possimus aliquam eaque similique nostrum! Vero veniam earum sint sapiente ut. Quae aspernatur assumenda aliquam pariatur suscipit in porro ipsam.'

/* ────────────────────────────────────────────────
   Data
   ──────────────────────────────────────────────── */

const navItems = [
  { label: 'Servicii', path: '/servicii' },
  { label: 'Abonamente', path: '/abonamente-preturi' },
  { label: 'Fiscal', path: '/calculator-taxe' },
  { label: 'Parteneri', path: '/parteneri' },
  { label: 'Despre Ridelance', path: '/despre-ridelance' },
  { label: 'Contact', path: '/contact' },
]

const faqItems = [
  {
    title: 'De ce as avea nevoie de o platforma ca aceasta',
    text: loremLongText,
  },
  {
    title: 'Daca am deja PFA, pot sa folosesc platforma?',
    text: loremLongText,
  },
  { title: 'De ce documente am nevoie?', text: loremLongText },
]


const pricingCards = [
  {
    title: 'RIDElance Start',
    price: '399 lei / luna',
    summary: 'Pentru șoferii care vor să înceapă rapid și să aibă totul pus la punct.',
    cta: 'Incepe cu Start',
    list: [
      'Deschidere PFA cu cost rambursabil + bonus 100 lei',
      'Asistență și consultanță constantă ',
      'Acces complet în dashboardul RIDElance',
      'Contabilitate completă pentru PFA',
      'Reduceri și beneficii prin partenerii RIDElance',
    ],
  },
  {
    title: 'RIDElance Pro',
    price: '599 lei / luna',
    summary:
      'Pentru cei care vor mai mult confort, suport prioritar și avantaje suplimentare.',
    cta: 'Vezi Pro',
    intro: 'Include tot ce ai in Start, plus:',
    list: [
      'Găzduire sediu social gratuit în București / Ilfov ',
      'Suport prioritar',
      'Oferte, campanii și promoții exclusive PRO',
      'Reducere la chiria mașinilor RIDElance ',
    ],
  },
]

const partnerLogos = [
  {
    name: 'RENTeaza',
    image: renteaza,
    href: 'https://renteaza.ro',
    desc: 'RENTeaza este cea mai mare platformă digitală de mobilitate care modernizează listarea, administrarea și rezervarea vehiculelor, atât pentru persoane fizice, cât și pentru operatori.',
  },
  {
    name: 'Silso',
    image: silso,
    href: 'https://silso.ro',
    desc: 'Silso este un partener specializat în servicii administrative și suport pentru antreprenori, de la înființări de firme și PFA până la contabilitate și găzduire sediu social.',
  },
  {
    name: 'Lion Finance Consulting',
    image: lion,
    href: 'https://bonurifiscale.ro/',
    desc: 'Lion Finance Consulting este un partener specializat în case de marcat și echipamente fiscale, oferind soluții pentru fiscalizare, configurare și suport dedicat.',
  },
]

const homeSec2 = [
  'Deschidere PFA',
  'Autorizații ARR',
  'TVA intracomunitar',
  'Deschidere conturi Fleet Uber si Bolt',
  'Gestionare conturi Fleet',
  'Deschidere si management cont SPV',
  'Trimiterea facturilor asociate fiecarei curse, direct in SPV',
  'Contabilitate completă pentru PFA ',
  'Dashboard pentru încărcarea cheltuielilor și documentelor ',
  'Acces la mașini de închiriat',
]

const homeSec3 = [
  {
    title: '1. Alegi varianta potrivita',
    text: 'Abonament sau serviciu individual, în funcție de ce ai nevoie.',
    image: scene1,
  },
  {
    title: '2. Completezi datele necesare',
    text: 'Încarci informațiile și documentele direct în platformă.',
    image: docs,
  },
  {
    title: '3. Procesul este preluat mai departe',
    text: 'Noi și partenerii noștri gestionăm pașii necesari pentru continuarea procedurii.',
    image: scene4,
  },
  {
    title: '4. Tu te concentrezi pe activitate',
    text: 'Mai puțin stres administrativ, mai multă claritate și organizare.',
    image: character2,
  },
]

const homeSec4 = [
  {
    title: 'PFA & documente',
    text: 'Pornire simplificată, cu pași clari și flux organizat.',
    icon: checkSvg,
  },
  {
    title: 'Contabilitate completă',
    text: 'Suport pentru partea administrativă și contabilă a activității tale.',
    icon: checkSvg,
  },
  {
    title: 'Dashboard dedicat',
    text: 'Încarci cheltuieli, documente, urmărești activitatea PFA-ului și ai acces rapid la funcțiile importante într-un singur loc.',
    icon: desktop,
  },
  {
    title: 'Beneficii utile',
    text: 'Acces la parteneri, reduceri, suport direct și avantaje relevante pentru activitatea ta.',
    icon: starSvg,
  },
]

const homeSec6 = [
  {
    title: 'Înființare PFA',
    price: '450 lei',
    desc: 'Deschizi rapid un PFA printr-un proces simplu și organizat, fără abonament lunar.',
    cta: 'Vezi serviciul',
  },
  {
    title: 'Găzduire Sediu Social',
    price: '449 lei / an',
    desc: 'O soluție practică pentru cei care au nevoie de sediu social pentru PFA în București / Ilfov.',
    cta: 'Vezi serviciul',
  },
]

const homeSec8 = [
  'Totul într-un singur loc ',
  'Proces clar și ușor de urmat ',
  'Servicii gândite pentru ridesharing',
  'Chat direct cu contabilul și suportul ',
  'Statistici și organizare mai bună pentru activitatea PFA-ului ',
  'Remindere și funcții utile în dashboard',
  'Acces la vehicule gata de ridesharing',
  'Mai puțin stres administrativ ',
]

const homeSec9 = [
  {
    q: 'Trebuie să am deja PFA?',
    a: 'Nu. Poți alege un abonament sau serviciul individual de înființare PFA.',
  },
  {
    q: 'Mă ajutați doar cu contabilitatea?',
    a: 'Nu. RIDElance acoperă mai mult decât contabilitatea: PFA, ARR, TVA intracomunitar, conturi Fleet, SPV, facturi și alte etape importante.',
  },
  {
    q: 'Pot alege doar un serviciu, fără abonament?',
    a: 'Da. Poți solicita separat înființarea PFA sau găzduirea sediului social.',
  },
  {
    q: 'Cum funcționează înființarea PFA?',
    a: 'Completezi datele și documentele necesare în platformă, iar solicitarea este transmisă ulterior către partenerul RIDElance, SILSO.',
  },
  {
    q: 'Ce documente sunt necesare pentru găzduire sediu social?',
    a: 'Pentru solicitarea inițială, vor fi necesare buletinul și CUI-ul PFA.',
  },
]

/* ────────────────────────────────────────────────
   Scroll-to-top wrapper
   ──────────────────────────────────────────────── */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])
  return null
}

/* ────────────────────────────────────────────────
   Pages
   ──────────────────────────────────────────────── */

function HomePage() {
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

      {/* ═══════ 4. CE ESTE RIDELANCE ═══════ */}
      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 } }}>
        <SectionHeader
          title="Ce este RIDElance"
          subtitle="Tot ce ai nevoie ca sa lucrezi legal si organizat pe cont propriu"
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {homeSec4.map((block, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                p: 4,
                borderRadius: TOKENS.radius.lg,
                backgroundColor: TOKENS.paper,
                border: `1px solid ${TOKENS.border}`,
                display: 'flex',
                gap: 3,
                transition: `border-color ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': {
                  borderColor: TOKENS.borderHover,
                },
              }}
            >
              <Box
                component="img"
                src={block.icon}
                sx={{
                  width: 38,
                  height: 38,
                  mt: 0.5,
                  flexShrink: 0,
                  filter:
                    'invert(28%) sepia(87%) saturate(2222%) hue-rotate(210deg) brightness(98%) contrast(92%)',
                }}
              />
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 750, mb: 0.8, color: TOKENS.ink }}
                >
                  {block.title}
                </Typography>
                <Typography
                  sx={{
                    color: TOKENS.textMuted,
                    lineHeight: 1.65,
                    fontSize: '0.95rem',
                  }}
                >
                  {block.text}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>

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

      {/* ═══════ 8. DE CE RIDELANCE ═══════ */}
      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 } }}>
        <SectionHeader
          title="De ce RIDElance"
          subtitle="De ce aleg soferii RIDElance"
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: { xs: 2, md: 3 },
          }}
        >
          {homeSec8.map((reason, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                px: { xs: 3, md: 4 },
                py: { xs: 2, md: 2.5 },
                borderRadius: '50px',
                backgroundColor: alpha(TOKENS.primary, 0.03),
                border: `1px solid ${alpha(TOKENS.primary, 0.08)}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': {
                  backgroundColor: alpha(TOKENS.primary, 0.05),
                  borderColor: alpha(TOKENS.primary, 0.15),
                  transform: 'translateX(4px)',
                },
              }}
            >
              <Box
                component="img"
                src={arrowRight}
                sx={{
                  width: 18,
                  height: 18,
                  flexShrink: 0,
                  opacity: 0.8,
                  filter:
                    'invert(28%) sepia(87%) saturate(2222%) hue-rotate(210deg) brightness(98%) contrast(92%)',
                }}
              />
              <Typography
                sx={{ fontWeight: 600, color: TOKENS.ink, fontSize: '0.9rem', lineHeight: 1.3 }}
              >
                {reason}
              </Typography>
            </Paper>
          ))}
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

function FaqPage() {
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

function CalculatorPage() {
  const GROSS_SALARY = 4050
  const UBER_BOLT_ANNUAL_INCOME_NORM = 49005

  const roundToInt = (value: number) => Math.round(value)
  const toNumber = (value: string) => {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const [anualIncome, setAnualIncome] = useState(0)
  const [deductibleExpenses, setDeductibleExpenses] = useState(0)
  const [realIncomeTax, setRealIncomeTax] = useState(0)
  const [realCAS, setRealCAS] = useState(0)
  const [realCASS, setRealCASS] = useState(0)
  const [normIncomeTax, setNormIncomeTax] = useState(0)
  const [normCAS, setNormCAS] = useState(0)
  const [normCASS, setNormCASS] = useState(0)
  const [netIncomeRealSystem, setNetIncomeRealSystem] = useState(0)
  const [netIncomeNormaSystem, setNetIncomeNormaSystem] = useState(0)

  const computeTaxes = useCallback(() => {
    const netIncome = anualIncome - deductibleExpenses
    let CAS = 0
    let CASS = 0
    let incomeTax = 0
    let netIncomeAfterTaxes = 0

    if (netIncome < GROSS_SALARY * 12) {
      CAS = 0
    } else if (
      netIncome >= GROSS_SALARY * 12 &&
      netIncome < GROSS_SALARY * 24
    ) {
      CAS = 0.25 * (GROSS_SALARY * 12)
    } else if (netIncome >= GROSS_SALARY * 24) {
      CAS = 0.25 * (GROSS_SALARY * 24)
    }

    if (netIncome <= 0) {
      CASS = 0
    } else if (netIncome > 0 && netIncome < GROSS_SALARY * 6) {
      CASS = 0.1 * (GROSS_SALARY * 6)
    } else if (
      netIncome >= GROSS_SALARY * 6 &&
      netIncome < GROSS_SALARY * 72
    ) {
      CASS = 0.1 * netIncome
    } else if (netIncome >= GROSS_SALARY * 72) {
      CASS = 0.1 * GROSS_SALARY * 72
    }

    incomeTax = 0.1 * Math.max(0, netIncome - CAS - CASS)
    netIncomeAfterTaxes = netIncome - CAS - CASS - incomeTax

    setRealCAS(roundToInt(CAS))
    setRealCASS(roundToInt(CASS))
    setRealIncomeTax(roundToInt(incomeTax))
    setNetIncomeRealSystem(roundToInt(netIncomeAfterTaxes))

    // Norma pe venit calculations
    let normCAS = 0
    let normCASS = 0
    let normIncomeTaxCalc = 0

    if (UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 12) {
      normCAS = 0
    } else if (
      UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 12 &&
      UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 24
    ) {
      normCAS = 0.25 * (GROSS_SALARY * 12)
    } else if (UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 24) {
      normCAS = 0.25 * (GROSS_SALARY * 24)
    }

    if (UBER_BOLT_ANNUAL_INCOME_NORM <= 0) {
      normCASS = 0
    } else if (
      UBER_BOLT_ANNUAL_INCOME_NORM > 0 &&
      UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 6
    ) {
      normCASS = 0.1 * (GROSS_SALARY * 6)
    } else if (
      UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 6 &&
      UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 72
    ) {
      normCASS = 0.1 * UBER_BOLT_ANNUAL_INCOME_NORM
    } else if (UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 72) {
      normCASS = 0.1 * GROSS_SALARY * 72
    }

    normIncomeTaxCalc =
      0.1 *
      Math.max(0, UBER_BOLT_ANNUAL_INCOME_NORM - normCAS - normCASS)
    const normNetIncome =
      anualIncome - normCAS - normCASS - normIncomeTaxCalc

    setNormCAS(roundToInt(normCAS))
    setNormCASS(roundToInt(normCASS))
    setNormIncomeTax(roundToInt(normIncomeTaxCalc))
    setNetIncomeNormaSystem(roundToInt(normNetIncome))
  }, [anualIncome, deductibleExpenses])

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: TOKENS.paper,
      color: TOKENS.ink,
      borderRadius: TOKENS.radius.md,
      fontWeight: 500,
      transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
      '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
      '&:hover': { backgroundColor: alpha(TOKENS.paper, 0.98) },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: TOKENS.borderHover,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: TOKENS.primary,
        borderWidth: 2,
      },
    },
    '& .MuiInputBase-input::placeholder': {
      color: alpha(TOKENS.ink, 0.4),
      opacity: 1,
    },
    '& .MuiInputLabel-root': { color: TOKENS.textMuted, fontWeight: 600 },
  }

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="md">
        <Stack spacing={4} sx={{ justifyContent: "center", textAlign: "center" }}>
          <SectionHeader
            title="Calculator Taxe"
            subtitle="Estimeaza ce taxe vei plati ca PFA in functie de venitul tau anual si cheltuielile deductibile"
          />

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: TOKENS.radius.xl,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.md,
              backgroundColor: TOKENS.paper,
            }}
          >
            <Stack spacing={3}>
              <TextField
                type="number"
                fullWidth
                size="medium"
                label="Venit anual estimat (RON)"
                placeholder="Introdu venitul anual estimat"
                onChange={(e) => setAnualIncome(toNumber(e.target.value))}
                sx={inputSx}
              />
              <TextField
                type="number"
                fullWidth
                size="medium"
                label="Cheltuieli deductibile (RON)"
                placeholder="Introdu cheltuielile deductibile"
                onChange={(e) => setDeductibleExpenses(toNumber(e.target.value))}
                sx={inputSx}
              />
              <Button
                variant="contained"
                onClick={computeTaxes}
                size="large"
                sx={{
                  alignSelf: { xs: 'stretch', sm: 'center' },
                  px: 5,
                  py: 1.2,
                  color: '#FFFFFF',
                  backgroundColor: TOKENS.primary,
                  borderRadius: TOKENS.radius.full,
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  boxShadow: TOKENS.shadow.glow,
                  '&:hover': {
                    backgroundColor: TOKENS.primaryStrong,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(26,100,237,0.25)',
                  },
                }}
              >
                Calculeaza
              </Button>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: TOKENS.radius.lg,
                border: `1px solid ${TOKENS.border}`,
                backgroundColor: TOKENS.paper,
                boxShadow: TOKENS.shadow.md,
              }}
            >
              <Stack spacing={2}>
                <Typography
                  sx={{
                    color: TOKENS.textSubtle,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Sistem Real
                </Typography>
                <TaxRow
                  label="Venit brut"
                  value={`${roundToInt(anualIncome)} RON`}
                />
                <TaxRow
                  label="Venit impozabil"
                  value={`${roundToInt(anualIncome - deductibleExpenses)} RON`}
                />
                <TaxRow
                  label="Impozit pe venit (10%)"
                  value={`-${realIncomeTax} RON`}
                />
                <TaxRow
                  label="Contributie CAS (25%)"
                  value={`-${realCAS} RON`}
                />
                <TaxRow
                  label="Contributie CASS (10%)"
                  value={`-${realCASS} RON`}
                />
                <Box
                  sx={{
                    mt: 1,
                    pt: 2,
                    borderTop: `1px dashed ${TOKENS.borderHover}`,
                  }}
                >
                  <TaxRow
                    label="Venit net PFA real"
                    value={`${netIncomeRealSystem} RON`}
                    bold
                  />
                </Box>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: TOKENS.radius.lg,
                border: `2px solid ${alpha(TOKENS.primary, 0.12)}`,
                backgroundColor: alpha(TOKENS.primary, 0.02),
                boxShadow: `0 12px 40px rgba(26,100,237,0.06)`,
              }}
            >
              <Stack spacing={2}>
                <Typography
                  sx={{
                    color: TOKENS.primaryStrong,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Norma pe Venit
                </Typography>
                <TaxRow
                  label="Norma anuala"
                  value={`${UBER_BOLT_ANNUAL_INCOME_NORM} RON`}
                />
                <TaxRow
                  label="Impozit pe venit (10%)"
                  value={`-${normIncomeTax} RON`}
                />
                <TaxRow
                  label="Contributie CAS (25%)"
                  value={`-${normCAS} RON`}
                />
                <TaxRow
                  label="Contributie CASS (10%)"
                  value={`-${normCASS} RON`}
                />
                <Box
                  sx={{
                    mt: 1,
                    pt: 2,
                    borderTop: `1px dashed ${alpha(TOKENS.primary, 0.25)}`,
                  }}
                >
                  <TaxRow
                    label="Venit net PFA norma"
                    value={`${netIncomeNormaSystem} RON`}
                    bold
                    highlight
                  />
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

function TaxRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string
  value: string
  bold?: boolean
  highlight?: boolean
}) {
  return (
    <Stack
      direction="row"
      sx={{ justifyContent: 'space-between', alignItems: 'center' }}
    >
      <Typography
        variant="body2"
        sx={{
          color: bold ? TOKENS.ink : TOKENS.textMuted,
          fontWeight: bold ? 650 : 400,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: highlight
            ? TOKENS.primaryStrong
            : bold
              ? TOKENS.ink
              : TOKENS.textMain,
          fontWeight: bold ? 700 : 600,
          textAlign: 'right',
        }}
      >
        {value}
      </Typography>
    </Stack>
  )
}

function PricingPage() {
  const navigate = useNavigate()

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="xl">
        <Stack sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={4} >
          <SectionHeader
            title="Abonamente/Preturi"
            subtitle="Planuri simple. Beneficii reale. Sprijin complet."
          />
          <Typography
            sx={{
              textAlign: 'center',
              color: TOKENS.textMuted,
              fontSize: '1.05rem',
              maxWidth: 600,
              mx: 'auto',
              mt: -2,
            }}
          >
            Alege varianta care ți se potrivește și concentrează-te pe drum, nu pe birocrație.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'stretch' },
              justifyContent: 'center',
              gap: 4,
              width: '100%',
            }}
          >
            {pricingCards.map((item, index) => (
              <Card
                key={`${item.title}-${index}`}
                elevation={0}
                sx={{
                  width: { xs: '100%', sm: '80%', md: '35%' },
                  maxWidth: { md: 500 },
                  display: 'flex',
                  flexDirection: 'column',
                  p: { xs: 3, md: 4.5 },
                  borderRadius: TOKENS.radius.sm,
                  backgroundColor: TOKENS.paper,
                  border:
                    index === 1
                      ? `2px solid ${TOKENS.primary}`
                      : `1px solid ${TOKENS.border}`,
                  boxShadow:
                    index === 1 ? TOKENS.shadow.glow : TOKENS.shadow.md,
                  transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow:
                      index === 1
                        ? '0 20px 56px rgba(26,100,237,0.2)'
                        : TOKENS.shadow.lg,
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    height: '100%',
                    gap: 2.5,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.3rem',
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
                    <Typography
                      sx={{
                        color: TOKENS.textMuted,
                        fontSize: '0.95rem',
                        mt: 1.2,
                        lineHeight: 1.6,
                      }}
                    >
                      {item.summary}
                    </Typography>
                  </Box>

                  <Box
                    component="ul"
                    sx={{
                      p: 0,
                      m: 0,
                      alignSelf: 'stretch',
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'left',
                      gap: 1.2,
                    }}
                  >
                    {item.intro && (
                      <Typography
                        sx={{
                          fontSize: '0.9rem',
                          color: TOKENS.textMuted,
                          pr: 1.2,
                        }}
                      >
                        {item.intro}
                      </Typography>
                    )}
                    {item.list.map((point) => (
                      <Box
                        component="li"
                        key={point}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.2,
                        }}
                      >
                        <CheckCircleOutlineRoundedIcon
                          sx={{
                            fontSize: 18,
                            minWidth: 18,
                            mt: 0.2,
                            color: alpha(TOKENS.primary, 0.8),
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: '0.9rem',
                            color: alpha(TOKENS.ink, 0.85),
                            lineHeight: 1.6,
                          }}
                        >
                          {point}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => navigate('/auth')}
                    sx={{
                      mt: 'auto',
                      py: 1.2,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      borderRadius: TOKENS.radius.full,
                      color: '#fff',
                      backgroundColor: TOKENS.primary,
                      boxShadow: TOKENS.shadow.glow,
                      '&:hover': {
                        backgroundColor: TOKENS.primaryStrong,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {item.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

function PartnersPage() {
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

function ContactPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="sm">
        <Stack spacing={4}>
          <SectionHeader
            title="Contact"
            subtitle="Dacă ai întrebări despre platformă, abonamente, zona fiscală sau o posibilă colaborare, ne poți trimite un mesaj prin formularul de mai jos. Revenim către tine cât mai curând posibil."
          />

          <Paper
            elevation={0}
            sx={{
              backgroundColor: TOKENS.paper,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.lg,
              p: { xs: 3, md: 5 },
              borderRadius: TOKENS.radius.xl,
              transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
              '&:hover': {
                boxShadow: TOKENS.shadow.xl,
                borderColor: TOKENS.borderHover,
              },
            }}
          >
            <Stack component="form" spacing={3}>
              <TextField
                fullWidth
                size="medium"
                label="Nume complet"
                placeholder="Nume complet"
                sx={inputSx}
              />
              <TextField
                type="email"
                fullWidth
                size="medium"
                label="Adresă de email"
                placeholder="Adresă de email"
                sx={inputSx}
              />
              <TextField
                fullWidth
                multiline
                minRows={5}
                label="Mesajul tău"
                placeholder="Mesajul tău"
                sx={inputSx}
              />
              <Button
                variant="contained"
                size="large"
                sx={{
                  mt: 1,
                  px: 5,
                  py: 1.4,
                  fontSize: '1.05rem',
                  color: '#FFFFFF',
                  backgroundColor: TOKENS.primary,
                  borderRadius: TOKENS.radius.full,
                  fontWeight: 700,
                  boxShadow: TOKENS.shadow.glow,
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  '&:hover': {
                    backgroundColor: TOKENS.primaryStrong,
                    boxShadow: '0 12px 40px rgba(26,100,237,0.3)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Trimite mesajul
              </Button>
            </Stack>
          </Paper>

          {/* Info Emails Section */}
          <Stack spacing={2.5}>
            <Box
              sx={{
                p: 3,
                borderRadius: TOKENS.radius.lg,
                border: `1px solid ${TOKENS.border}`,
                backgroundColor: alpha(TOKENS.primary, 0.03),
                transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': {
                  borderColor: TOKENS.primary,
                  backgroundColor: alpha(TOKENS.primary, 0.05),
                  transform: 'translateY(-2px)',
                  boxShadow: TOKENS.shadow.sm,
                },
              }}
            >
              <Typography
                component="a"
                href="mailto:contact@ridelance.ro"
                sx={{
                  fontWeight: 800,
                  color: TOKENS.primary,
                  textDecoration: 'none',
                  fontSize: '1.1rem',
                  display: 'block',
                  mb: 0.8,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                contact@ridelance.ro
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: TOKENS.textMuted,
                  lineHeight: 1.7,
                  fontSize: '0.92rem',
                }}
              >
                Pentru întrebări generale despre platformă, suport, informații
                administrative sau alte solicitări legate de utilizarea
                Ridelance.
              </Typography>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: TOKENS.radius.lg,
                border: `1px solid ${TOKENS.border}`,
                backgroundColor: alpha(TOKENS.primary, 0.03),
                transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': {
                  borderColor: TOKENS.primary,
                  backgroundColor: alpha(TOKENS.primary, 0.05),
                  transform: 'translateY(-2px)',
                  boxShadow: TOKENS.shadow.sm,
                },
              }}
            >
              <Typography
                component="a"
                href="mailto:sales@ridelance.ro"
                sx={{
                  fontWeight: 800,
                  color: TOKENS.primary,
                  textDecoration: 'none',
                  fontSize: '1.1rem',
                  display: 'block',
                  mb: 0.8,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                sales@ridelance.ro
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: TOKENS.textMuted,
                  lineHeight: 1.7,
                  fontSize: '0.92rem',
                }}
              >
                Pentru întrebări despre abonamente, oferte, activarea
                serviciilor, colaborări și oportunități comerciale.
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: TOKENS.surface,
    color: TOKENS.ink,
    borderRadius: TOKENS.radius.md,
    fontWeight: 500,
    transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
    '&:hover': { backgroundColor: alpha(TOKENS.surface, 0.8) },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: TOKENS.borderHover,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: TOKENS.primary,
      borderWidth: 2,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: alpha(TOKENS.ink, 0.4),
    opacity: 1,
  },
  '& .MuiInputLabel-root': { color: TOKENS.textMuted, fontWeight: 600 },
}

function TermsPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: TOKENS.radius.xl,
            border: `1px solid ${TOKENS.border}`,
            boxShadow: TOKENS.shadow.md,
            backgroundColor: TOKENS.paper,
          }}
        >
          <SectionHeader title="Termeni si conditii" />
          <Typography
            sx={{
              lineHeight: 1.8,
              color: TOKENS.textMuted,
              textAlign: 'center',
              mt: 2,
            }}
          >
            {loremLongText}
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}

function PrivacyPolicyPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: TOKENS.radius.xl,
            border: `1px solid ${TOKENS.border}`,
            boxShadow: TOKENS.shadow.md,
            backgroundColor: TOKENS.paper,
          }}
        >
          <SectionHeader title="Privacy Policy" />
          <Typography
            sx={{
              lineHeight: 1.8,
              color: TOKENS.textMuted,
              textAlign: 'center',
              mt: 2,
            }}
          >
            {loremLongText}
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}
function ServicesPage() {
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
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 4,
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

function AboutPage() {
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

/* ────────────────────────────────────────────────
   AppLayout / Shell
   ──────────────────────────────────────────────── */

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const [isNavPinned, setIsNavPinned] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  useEffect(() => {
    const onScroll = () => setIsNavPinned(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (path: string) => {
    setIsMobileMenuOpen(false)
    navigate(path)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: TOKENS.ink,
        backgroundColor: TOKENS.surface,
      }}
    >
      {/* ── Navigation ── */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          backgroundColor: isNavPinned
            ? alpha(TOKENS.paper, 0.95)
            : 'transparent',
          backdropFilter: isNavPinned ? 'blur(12px)' : 'none',
          borderBottom: isNavPinned
            ? `1px solid ${TOKENS.border}`
            : '1px solid transparent',
          transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
          zIndex: (t) => t.zIndex.appBar,
        }}
      >
        <Container
          maxWidth="xl"
          disableGutters={!isMdUp}
          sx={{ px: { xs: 2, md: 3 } }}
        >
          <Toolbar
            disableGutters
            sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}
          >
            {/* Logo */}
            <Box
              component="button"
              onClick={() => goTo('/')}
              sx={{
                border: 'none',
                backgroundColor: 'transparent',
                p: 0,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src={logo}
                alt="Ridelance Logo"
                sx={{ height: { xs: 34, md: 50 }, width: 'auto', display: 'block' }}
              />
            </Box>

            {/* Desktop Nav */}
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                display: { xs: 'none', md: 'flex' },
                flex: 1,
                justifyContent: 'center',
                flexWrap: 'wrap',
                rowGap: 0.5,
              }}
            >
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Button
                    key={item.path}
                    onClick={() => goTo(item.path)}
                    sx={{
                      color: isActive
                        ? TOKENS.primaryStrong
                        : alpha(TOKENS.ink, 0.8),
                      minWidth: 'auto',
                      px: 1.8,
                      py: 0.8,
                      borderRadius: TOKENS.radius.sm,
                      fontSize: '0.88rem',
                      fontWeight: 650,
                      backgroundColor: isActive
                        ? alpha(TOKENS.primary, 0.1)
                        : 'transparent',
                      '&:hover': {
                        color: TOKENS.primaryStrong,
                        backgroundColor: alpha(TOKENS.primary, 0.08),
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </Stack>

            {/* Desktop CTA */}
            <Button
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={() => goTo('/demo')}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                px: 3,
                py: 1,
                color: '#fff',
                backgroundColor: TOKENS.primary,
                borderRadius: TOKENS.radius.full,
                fontWeight: 700,
                boxShadow: TOKENS.shadow.glow,
                '&:hover': {
                  backgroundColor: TOKENS.primaryStrong,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Demo
            </Button>

            {/* Mobile Controls */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                ml: 'auto',
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
              }}
            >
              <Button
                variant="contained"
                size="small"
                onClick={() => goTo('/demo')}
                sx={{
                  px: 2,
                  py: 0.6,
                  minWidth: 'unset',
                  color: '#fff',
                  backgroundColor: TOKENS.primary,
                  borderRadius: TOKENS.radius.full,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                Dashboard
              </Button>
              <IconButton
                size="small"
                aria-label="Deschide meniul"
                onClick={() => setIsMobileMenuOpen(true)}
                sx={{
                  border: `1px solid ${TOKENS.border}`,
                  color: TOKENS.primaryStrong,
                  backgroundColor: alpha(TOKENS.paper, 0.8),
                }}
              >
                <MenuRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <Drawer
        anchor="right"
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '85vw', sm: 340 },
              p: 3,
              backgroundColor: TOKENS.paper,
            },
          },
        }}
      >
        <Stack spacing={2} sx={{ height: '100%' }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Box
              component="img"
              src={logo}
              alt="Ridelance Logo"
              sx={{ height: 38, width: 'auto', display: 'block' }}
            />
            <IconButton
              aria-label="Inchide meniul"
              onClick={() => setIsMobileMenuOpen(false)}
              sx={{ color: TOKENS.ink }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {navItems.map((item) => (
              <Button
                key={`mobile-${item.path}`}
                onClick={() => goTo(item.path)}
                sx={{
                  justifyContent: 'flex-start',
                  px: 1.5,
                  py: 1,
                  borderRadius: TOKENS.radius.md,
                  color:
                    location.pathname === item.path
                      ? TOKENS.primaryStrong
                      : alpha(TOKENS.ink, 0.85),
                  backgroundColor:
                    location.pathname === item.path
                      ? alpha(TOKENS.primary, 0.1)
                      : 'transparent',
                  fontWeight: 650,
                  fontSize: '0.95rem',
                  '&:hover': {
                    backgroundColor: alpha(TOKENS.primary, 0.06),
                    color: TOKENS.primaryStrong,
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>

          <Button
            variant="contained"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => goTo('/demo')}
            sx={{
              mt: 'auto',
              color: '#fff',
              backgroundColor: TOKENS.primary,
              borderRadius: TOKENS.radius.full,
              py: 1.2,
              fontWeight: 700,
              boxShadow: TOKENS.shadow.glow,
            }}
          >
            Dashboard
          </Button>
        </Stack>
      </Drawer>

      {/* ── Main Content ── */}
      <Box component="main" sx={{ flex: 1, position: 'relative' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/intrebari-frecvente" element={<FaqPage />} />
          <Route path="/servicii" element={<ServicesPage />} />
          <Route path="/despre-ridelance" element={<AboutPage />} />
          <Route path="/calculator-taxe" element={<CalculatorPage />} />
          <Route path="/abonamente-preturi" element={<PricingPage />} />
          <Route path="/parteneri" element={<PartnersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/dashboard" element={<Navigate to="/demo" replace />} />
          <Route
            path="/dashboard-demo"
            element={<Navigate to="/demo" replace />}
          />
          <Route path="/termeni-si-conditii" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      {/* ── Footer ── */}
      <Box
        component="footer"
        sx={{
          py: { xs: 6, md: 8 },
          backgroundColor: TOKENS.ink,
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 3, md: 4 },
              pb: 3,
              borderBottom: `1px solid ${alpha('#fff', 0.15)}`,
            }}
          >
            <Stack spacing={1.2} sx={{ alignItems: 'flex-start' }}>
              <Box
                component="a"
                href="mailto:contact@ridelance.ro"
                sx={{
                  color: alpha('#fff', 0.9),
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  '&:hover': { color: '#fff' },
                }}
              >
                contact@ridelance.ro
              </Box>
              <Box
                component="a"
                href="tel:+40070000000"
                sx={{
                  color: alpha('#fff', 0.9),
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  '&:hover': { color: '#fff' },
                }}
              >
                +40 700 000 000
              </Box>
            </Stack>

            <Stack
              spacing={1.2}
              sx={{ alignItems: { xs: 'flex-start', md: 'flex-end' } }}
            >
              <Button
                onClick={() => goTo('/termeni-si-conditii')}
                sx={{
                  p: 0,
                  minWidth: 'unset',
                  color: alpha('#fff', 0.9),
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  textTransform: 'none',
                  '&:hover': { color: '#fff', backgroundColor: 'transparent' },
                }}
              >
                Termeni si conditii
              </Button>
              <Button
                onClick={() => goTo('/privacy-policy')}
                sx={{
                  p: 0,
                  minWidth: 'unset',
                  color: alpha('#fff', 0.9),
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  textTransform: 'none',
                  '&:hover': { color: '#fff', backgroundColor: 'transparent' },
                }}
              >
                Privacy Policy
              </Button>
            </Stack>
          </Box>

          <Typography
            sx={{
              pt: 3,
              textAlign: 'center',
              color: alpha('#fff', 0.7),
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            © Copyright 2026 by ridelance.ro
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Auth pages — no navbar/footer */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/inregistrare/pfa" element={<RegisterPfaPage />} />
        <Route path="/inregistrare/succes" element={<RegistrationSuccessPage />} />
        {/* Real dashboard — uses its own layout */}
        <Route path="/app/*" element={<DashboardPage />} />
        {/* Demo dashboard */}
        <Route path="/demo/*" element={<DashboardDemoPage />} />
        {/* Landing pages — wrapped in AppLayout with navbar & footer */}
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App