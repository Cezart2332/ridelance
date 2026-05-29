import { Box, Container, Typography, Stack, alpha } from '@mui/material'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded'
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded'
import PublicRoundedIcon from '@mui/icons-material/PublicRounded'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import NoCrashRoundedIcon from '@mui/icons-material/NoCrashRounded'
import { TOKENS } from '../../constants/tokens'

interface ProcessItem {
  label: string
  icon: React.ReactNode
  x: number
  y: number
  mx: number
  my: number
}

const ITEMS: ProcessItem[] = [
  {
    label: 'Deschidere PFA',
    icon: <BusinessRoundedIcon sx={{ fontSize: 28 }} />,
    x: 18,
    y: 55,
    mx: 20,
    my: 15,
  },
  {
    label: 'Autorizații ARR',
    icon: <AssignmentRoundedIcon sx={{ fontSize: 28 }} />,
    x: 28,
    y: 35,
    mx: 75,
    my: 20,
  },
  {
    label: 'TVA intracomunitar',
    icon: <PublicRoundedIcon sx={{ fontSize: 28 }} />,
    x: 40,
    y: 20,
    mx: 25,
    my: 35,
  },
  {
    label: 'Deschidere conturi Fleet Uber si Bolt',
    icon: <DirectionsCarRoundedIcon sx={{ fontSize: 28 }} />,
    x: 52,
    y: 15,
    mx: 80,
    my: 40,
  },
  {
    label: 'Gestionare conturi Fleet',
    icon: <SettingsRoundedIcon sx={{ fontSize: 28 }} />,
    x: 65,
    y: 20,
    mx: 20,
    my: 55,
  },
  {
    label: 'Deschidere si management cont SPV',
    icon: <LockOpenRoundedIcon sx={{ fontSize: 28 }} />,
    x: 77,
    y: 35,
    mx: 75,
    my: 60,
  },
  {
    label: 'Trimiterea facturilor asociate fiecarei curse, direct in SPV',
    icon: <ReceiptLongRoundedIcon sx={{ fontSize: 28 }} />,
    x: 87,
    y: 55,
    mx: 25,
    my: 75,
  },
  {
    label: 'Contabilitate completă pentru PFA',
    icon: <CalculateRoundedIcon sx={{ fontSize: 28 }} />,
    x: 35,
    y: 65,
    mx: 80,
    my: 80,
  },
  {
    label: 'Dashboard pentru încărcarea cheltuielilor și documentelor',
    icon: <DashboardRoundedIcon sx={{ fontSize: 28 }} />,
    x: 52,
    y: 60,
    mx: 30,
    my: 90,
  },
  {
    label: 'Acces la mașini de închiriat',
    icon: <NoCrashRoundedIcon sx={{ fontSize: 28 }} />,
    x: 70,
    y: 65,
    mx: 75,
    my: 95,
  },
]

export function ProcessVisual() {

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', overflow: 'hidden' }}>
      {/* Header */}
      <Stack component="div" spacing={2} sx={{ alignItems: 'center', mb: { xs: 6, md: 10 } }}>
        <Stack component="div" direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.8rem', md: '2.8rem' },
              fontWeight: 800,
              color: TOKENS.ink,
              letterSpacing: '-0.02em',
            }}
          >
            Tot procesul, intr-un singur loc
          </Typography>
        </Stack>
        <Typography
          sx={{
            color: TOKENS.textMuted,
            fontSize: { xs: '1rem', md: '1.15rem' },
            maxWidth: 650,
            lineHeight: 1.6,
          }}
        >
          Acoperim pasii esentiali, de la inceput pana la activitate
        </Typography>
      </Stack>

      {/* Visual Area */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 850, md: 550 },
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 4,
          pb: { xs: 4, md: 0 },
        }}
      >
        {/* Concentric Arcs */}
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: -150, md: -150 },
            left: '50%',
            transform: 'translateX(-50%)',
            width: { xs: 800, md: 1000 },
            height: { xs: 800, md: 1000 },
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: i * 150, md: i * 200 },
                  height: { xs: i * 150, md: i * 200 },
                  border: `1px solid ${alpha(TOKENS.primary, 0.25)}`,
                  borderRadius: '50%',
                }}
              />
            ))}
          </Box>

        {/* Items */}
        <Box sx={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
          {ITEMS.map((item, idx) => (
            <Box
              key={idx}
              sx={{
                position: 'absolute',
                left: { xs: `${item.mx}%`, md: `${item.x}%` },
                top: { xs: `${item.my}%`, md: `${item.y}%` },
                transform: { xs: 'translate(-50%, -50%) scale(0.85)', md: 'translate(-50%, -50%)' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: { xs: 1, md: 2 },
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  transform: { xs: 'translate(-50%, -55%) scale(0.85)', md: 'translate(-50%, -58%) scale(1.05)' },
                  '& > .icon-box': {
                    boxShadow: `0 12px 32px ${alpha(TOKENS.primary, 0.4)}`,
                    backgroundColor: TOKENS.primaryStrong,
                  },
                },
              }}
            >
              <Box
                className="icon-box"
                sx={{
                  width: { xs: 48, md: 72 },
                  height: { xs: 48, md: 72 },
                  borderRadius: { xs: '12px', md: '20px' },
                  backgroundColor: TOKENS.primary,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${alpha(TOKENS.primary, 0.25)}`,
                  transition: 'inherit',
                  '& svg': {
                    fontSize: { xs: 20, md: 28 }
                  }
                }}
              >
                {item.icon}
              </Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '0.62rem', md: '0.88rem' },
                  color: TOKENS.ink,
                  maxWidth: { xs: 90, md: 160 },
                  textAlign: 'center',
                  lineHeight: 1.1,
                  textShadow: '0 0 20px #fff',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  )
}
