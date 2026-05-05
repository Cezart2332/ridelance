import { Box, Container, Typography, Stack, alpha, useTheme, useMediaQuery } from '@mui/material'
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
}

const ITEMS: ProcessItem[] = [
  {
    label: 'Deschidere PFA',
    icon: <BusinessRoundedIcon sx={{ fontSize: 28 }} />,
    x: 18,
    y: 55,
  },
  {
    label: 'Autorizații ARR',
    icon: <AssignmentRoundedIcon sx={{ fontSize: 28 }} />,
    x: 28,
    y: 35,
  },
  {
    label: 'TVA intracomunitar',
    icon: <PublicRoundedIcon sx={{ fontSize: 28 }} />,
    x: 40,
    y: 20,
  },
  {
    label: 'Deschidere conturi Fleet Uber si Bolt',
    icon: <DirectionsCarRoundedIcon sx={{ fontSize: 28 }} />,
    x: 52,
    y: 15,
  },
  {
    label: 'Gestionare conturi Fleet',
    icon: <SettingsRoundedIcon sx={{ fontSize: 28 }} />,
    x: 65,
    y: 20,
  },
  {
    label: 'Deschidere si management cont SPV',
    icon: <LockOpenRoundedIcon sx={{ fontSize: 28 }} />,
    x: 77,
    y: 35,
  },
  {
    label: 'Trimiterea facturilor asociate fiecarei curse, direct in SPV',
    icon: <ReceiptLongRoundedIcon sx={{ fontSize: 28 }} />,
    x: 87,
    y: 55,
  },
  {
    label: 'Contabilitate completă pentru PFA',
    icon: <CalculateRoundedIcon sx={{ fontSize: 28 }} />,
    x: 35,
    y: 65,
  },
  {
    label: 'Dashboard pentru încărcarea cheltuielilor și documentelor',
    icon: <DashboardRoundedIcon sx={{ fontSize: 28 }} />,
    x: 52,
    y: 60,
  },
  {
    label: 'Acces la mașini de închiriat',
    icon: <NoCrashRoundedIcon sx={{ fontSize: 28 }} />,
    x: 70,
    y: 65,
  },
]

export function ProcessVisual() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

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
          height: { xs: 'auto', md: 550 },
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 4,
          pb: { xs: 4, md: 0 },
        }}
      >
        {/* Concentric Arcs (Desktop only) */}
        {!isMobile && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -150,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 1000,
              height: 1000,
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
                  width: i * 200,
                  height: i * 200,
                  border: `1px solid ${alpha(TOKENS.primary, 0.08)}`,
                  borderRadius: '50%',
                }}
              />
            ))}
          </Box>
        )}

        {/* Items */}
        {isMobile ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 3,
              width: '100%',
              px: 2,
            }}
          >
            {ITEMS.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2,
                  borderRadius: '24px',
                  backgroundColor: alpha(TOKENS.paper, 0.6),
                  border: `1px solid ${TOKENS.border}`,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    backgroundColor: TOKENS.primary,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(TOKENS.primary, 0.2)}`,
                  }}
                >
                  {item.icon}
                </Box>
                <Typography sx={{ fontWeight: 750, fontSize: '0.85rem', color: TOKENS.ink }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
            {ITEMS.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    transform: 'translate(-50%, -58%)',
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
                    width: 72,
                    height: 72,
                    borderRadius: '20px',
                    backgroundColor: TOKENS.primary,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 24px ${alpha(TOKENS.primary, 0.25)}`,
                    transition: 'inherit',
                  }}
                >
                  {item.icon}
                </Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    color: TOKENS.ink,
                    maxWidth: 160,
                    textAlign: 'center',
                    lineHeight: 1.2,
                    textShadow: '0 0 20px #fff',
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  )
}
