import { useState } from 'react'
import { Alert, Box, Button, Chip, Paper, Snackbar, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { ONE_TIME_SERVICES, stripeService, type ServiceKey } from '../../../services/stripe.service'
import type { OwnerType } from '../../../config/ownerType'
import { PaymentPolicyAcceptance } from '../../common/PaymentPolicyAcceptance'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { PageHeader } from '../ui'

const T = DASHBOARD_TOKENS

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

interface ServiciiTabProps {
  /** Filtrează catalogul după tipul de cont (spec §3.2). Implicit PFA, contul care le are pe toate. */
  ownerType?: OwnerType
}

export function ServiciiTab({ ownerType = 'Pfa' }: ServiciiTabProps) {
  const services = ONE_TIME_SERVICES.filter((svc) => svc.ownerTypes.includes(ownerType))
  const [paymentPolicyAccepted, setPaymentPolicyAccepted] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const handleBuy = (key: ServiceKey) => {
    if (!paymentPolicyAccepted) return
    setCheckoutError(null)
    stripeService.redirectToService(key).catch(() => {
      setCheckoutError('Nu am putut deschide plata. Încearcă din nou în câteva momente.')
    })
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <Snackbar
        open={checkoutError !== null}
        autoHideDuration={6000}
        onClose={() => setCheckoutError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setCheckoutError(null)} sx={{ width: '100%' }}>
          {checkoutError}
        </Alert>
      </Snackbar>
      <Box sx={{ mb: 3 }}>
        <PageHeader
          title="Servicii individuale"
          subtitle="Ai nevoie de un serviciu punctual, fără abonament? Poți achiziționa orice serviciu separat, direct prin platforma noastră."
        />
      </Box>
      {services.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <PaymentPolicyAcceptance
            checked={paymentPolicyAccepted}
            onChange={setPaymentPolicyAccepted}
          />
        </Box>
      )}

      {services.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: T.radius.xl,
            border: `1px solid ${T.border}`,
            backgroundColor: T.paper,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontWeight: 800, color: T.ink }}>
            Momentan nu avem servicii individuale pentru SRL
          </Typography>
          <Typography sx={{ mt: 0.8, fontSize: '0.9rem', color: T.textMuted }}>
            Cele existente sunt legate de înființarea și operarea unui PFA. Când apar servicii pentru
            societăți, le găsești aici.
          </Typography>
        </Paper>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {services.map((svc) => {
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
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
              </Box>

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
                disabled={!paymentPolicyAccepted}
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
