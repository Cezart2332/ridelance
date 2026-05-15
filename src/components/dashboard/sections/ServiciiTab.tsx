import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { ONE_TIME_SERVICES, stripeService, type ServiceKey } from '../../../services/stripe.service'

const T = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#F8F9FC',
  border: 'rgba(0,0,0,0.06)',
  textMuted: 'rgba(26,26,46,0.55)',
  radius: { md: 4, lg: 6, xl: 10, full: 50 },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.05)',
    md: '0 3px 12px rgba(0,0,0,0.07)',
    glow: '0 4px 20px rgba(92,203,245,0.18)',
  },
}

const SERVICE_ICONS: Record<ServiceKey, string> = {
  infiintare_pfa: '📋',
  sediu_social: '🏢',
  start_ride: '🚗',
}

const SERVICE_BADGES: Record<ServiceKey, { label: string; color: string; bg: string } | null> = {
  infiintare_pfa: null,
  sediu_social: null,
  start_ride: { label: 'Recomandat', color: T.primaryStrong, bg: alpha(T.primary, 0.08) },
}

export function ServiciiTab() {
  const handleBuy = (key: ServiceKey) => {
    stripeService.redirectToService(key)
  }

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: T.ink, mb: 1 }}>
        Servicii individuale
      </Typography>
      <Typography sx={{ color: T.textMuted, fontSize: '0.95rem', mb: 3, lineHeight: 1.7 }}>
        Ai nevoie de un serviciu punctual, fără abonament? Poți achiziționa orice serviciu separat,
        direct prin platforma noastră.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {ONE_TIME_SERVICES.map((svc) => {
          const badge = SERVICE_BADGES[svc.key]
          const icon = SERVICE_ICONS[svc.key]

          return (
            <Paper
              key={svc.key}
              elevation={0}
              sx={{
                p: { xs: 3, md: 3.5 },
                borderRadius: T.radius.xl,
                border: `1px solid ${T.border}`,
                backgroundColor: T.paper,
                boxShadow: T.shadow.sm,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: T.shadow.glow,
                  borderColor: alpha(T.primary, 0.3),
                  transform: 'translateY(-3px)',
                },
              }}
            >
              {/* Icon + Badge */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: T.radius.lg,
                    backgroundColor: alpha(T.primary, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                  }}
                >
                  {icon}
                </Box>
                {badge && (
                  <Chip
                    label={badge.label}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      color: badge.color,
                      backgroundColor: badge.bg,
                      borderRadius: T.radius.full,
                    }}
                  />
                )}
              </Stack>

              {/* Title + Price */}
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: T.ink, mb: 0.5 }}>
                  {svc.title}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: T.primaryStrong }}>
                  {svc.price}
                </Typography>
                {svc.priceNote && (
                  <Typography sx={{ color: T.textMuted, fontSize: '0.75rem', fontStyle: 'italic', mt: 0.3 }}>
                    {svc.priceNote}
                  </Typography>
                )}
              </Box>

              {/* Description */}
              <Typography
                sx={{
                  color: T.textMuted,
                  fontSize: '0.88rem',
                  lineHeight: 1.65,
                  flexGrow: 1,
                }}
              >
                {svc.desc}
              </Typography>

              {/* Tagline */}
              {svc.tagline && (
                <Typography
                  sx={{
                    color: T.ink,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    fontStyle: 'italic',
                  }}
                >
                  {svc.tagline}
                </Typography>
              )}

              {/* CTA */}
              <Button
                variant="contained"
                endIcon={<OpenInNewRoundedIcon />}
                onClick={() => handleBuy(svc.key)}
                sx={{
                  borderRadius: T.radius.full,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  py: 1.1,
                  backgroundColor: T.primary,
                  color: '#fff',
                  boxShadow: T.shadow.glow,
                  '&:hover': {
                    backgroundColor: T.primaryStrong,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {svc.cta}
              </Button>
            </Paper>
          )
        })}
      </Box>

      {/* Info note */}
      <Box
        sx={{
          mt: 4,
          p: 2.5,
          borderRadius: T.radius.lg,
          backgroundColor: alpha(T.primary, 0.04),
          border: `1px solid ${alpha(T.primary, 0.1)}`,
        }}
      >
        <Typography sx={{ color: T.textMuted, fontSize: '0.85rem', lineHeight: 1.7 }}>
          💡 <strong>Notă:</strong> Serviciile individuale se plătesc o singură dată și sunt procesate
          de echipa RIDElance sau partenerii noștri. Vei fi contactat după achiziție pentru pașii următori.
        </Typography>
      </Box>
    </Box>
  )
}
