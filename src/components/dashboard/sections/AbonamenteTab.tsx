import { useState, useEffect } from 'react'
import { Box, Button, Chip, Paper, Typography, CircularProgress, Snackbar, Alert } from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { alpha } from '@mui/material/styles'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import {
  SUBSCRIPTION_PLANS,
  stripeService,
  type PlanKey,
  type SubscriptionResponse,
} from '../../../services/stripe.service'
import { getNextMondayBillingDate, formatRomanianDate, isPendingBilling } from '../../../utils/billing'

const T = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#F8F9FC',
  border: 'rgba(0,0,0,0.06)',
  textMuted: 'rgba(26,26,46,0.55)',
  success: '#22c55e',
  radius: { md: 4, lg: 6, xl: 10, full: 50 },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.05)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    glow: '0 4px 20px rgba(92,203,245,0.18)',
  },
}

function StatusChip({ pending }: { pending: boolean }) {
  return (
    <Chip
      icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: '14px !important' }} />}
      label={pending ? 'Programat Luni' : 'Activ'}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: '0.75rem',
        backgroundColor: pending ? alpha('#f59e0b', 0.1) : alpha(T.success, 0.1),
        color: pending ? '#b45309' : '#16a34a',
        border: `1px solid ${pending ? alpha('#f59e0b', 0.25) : alpha(T.success, 0.25)}`,
        '& .MuiChip-icon': { color: pending ? '#b45309' : '#16a34a' },
        borderRadius: T.radius.full,
      }}
    />
  )
}

export function AbonamenteTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [subStatus, setSubStatus] = useState<SubscriptionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [planChangeNotice, setPlanChangeNotice] = useState(false)

  useEffect(() => {
    if (searchParams.get('plan_changed') === '1') {
      setPlanChangeNotice(true)
      const next = new URLSearchParams(searchParams)
      next.delete('plan_changed')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    async function fetchStatus() {
      const data = await stripeService.getSubscriptionStatus()
      setSubStatus(data)
      setIsLoading(false)
    }
    fetchStatus()
  }, [])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress sx={{ color: T.primary }} />
      </Box>
    )
  }

  const activePlan = subStatus?.plan
  const nextBillingDate = subStatus?.nextBillingDateUtc ? new Date(subStatus.nextBillingDateUtc) : getNextMondayBillingDate()
  const pending = isPendingBilling(nextBillingDate)

  // Default to start plan if no active plan
  const currentPlanKey: PlanKey = activePlan || 'start'
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.key === currentPlanKey) || SUBSCRIPTION_PLANS[1]

  const handleUpgrade = (key: PlanKey) => {
    const origin = window.location.origin
    void stripeService.redirectToPlan(
      key,
      `${origin}/app/dashboard?section=abonamente&plan_changed=1`,
      `${origin}/app/dashboard?section=abonamente`,
      { isPlanChange: true },
    )
  }

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Snackbar
        open={planChangeNotice}
        autoHideDuration={6000}
        onClose={() => setPlanChangeNotice(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setPlanChangeNotice(false)} sx={{ width: '100%' }}>
          Plata a fost înregistrată. Noul abonament se activează de luni la 15:00; până atunci păstrezi accesul curent.
        </Alert>
      </Snackbar>
      <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: T.ink, mb: 3 }}>
        Abonamentul meu
      </Typography>

      {/* Current Plan Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: T.radius.xl,
          border: `2px solid ${T.primary}`,
          boxShadow: T.shadow.glow,
          backgroundColor: T.paper,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: T.ink }}>
                {currentPlan.title}
              </Typography>
              <StatusChip pending={pending} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: T.primaryStrong }}>
              {currentPlan.price}
            </Typography>
            <Typography sx={{ color: T.textMuted, fontSize: '0.82rem', mt: 0.5, fontStyle: 'italic' }}>
              {currentPlan.priceNote}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 160 }}>
            <Button
              variant="outlined"
              startIcon={<SwapHorizRoundedIcon />}
              disabled={!!subStatus?.pendingPlan}
              onClick={() => setShowUpgrade((v) => !v)}
              size="small"
              sx={{
                borderRadius: T.radius.full,
                fontWeight: 700,
                fontSize: '0.82rem',
                borderColor: alpha(T.ink, 0.15),
                color: T.ink,
                '&:hover': { borderColor: T.primary, color: T.primary },
              }}
            >
              Schimbă planul
            </Button>
            <Button
              variant="text"
              startIcon={<OpenInNewRoundedIcon />}
              onClick={() => window.open('https://billing.stripe.com/p/login/test_00g', '_blank')}
              size="small"
              sx={{ fontWeight: 600, fontSize: '0.82rem', color: T.textMuted }}
            >
              Portal facturare
            </Button>
          </Box>
        </Box>

        {/* Billing info */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: T.radius.lg,
            backgroundColor: alpha(T.primary, 0.05),
            border: `1px solid ${alpha(T.primary, 0.12)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <CalendarTodayRoundedIcon sx={{ color: T.primaryStrong, fontSize: 18, flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, color: T.ink, fontSize: '0.88rem' }}>
              {pending ? 'Prima plată automată:' : 'Următoarea plată:'}
            </Typography>
            <Typography sx={{ color: T.textMuted, fontSize: '0.85rem' }}>
              {formatRomanianDate(nextBillingDate)} la 15:00
            </Typography>
          </Box>
        </Box>

        {/* Pending billing explanation */}
        {pending && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: T.radius.lg,
              backgroundColor: alpha('#f59e0b', 0.06),
              border: `1px solid ${alpha('#f59e0b', 0.15)}`,
              display: 'flex',
              gap: 1.5,
            }}
          >
            <InfoOutlinedIcon sx={{ color: '#b45309', fontSize: 18, mt: 0.1, flexShrink: 0 }} />
            <Typography sx={{ color: '#92400e', fontSize: '0.83rem', lineHeight: 1.6 }}>
              {subStatus?.pendingPlan ? (
                <>
                  Ai deja o modificare de abonament programată pentru <strong>luni la 15:00</strong>:
                  trecerea de la <strong>{currentPlan.title}</strong> la <strong>{SUBSCRIPTION_PLANS.find(p => p.key === subStatus.pendingPlan)?.title}</strong>.
                  Poți schimba din nou tipul abonamentului doar o singură dată pe săptămână, după ce noua perioadă devine activă.
                </>
              ) : subStatus?.status === 'ActivePendingBilling' ? (
                <>
                  Abonamentul tău este activ. Prima factură automată se va genera{' '}
                  <strong>luni la 15:00</strong>. Dacă ai plătit luni înainte de 15:00, factura va fi
                  generată lunea următoare, nu în aceeași zi.
                </>
              ) : (
                <>
                  Abonamentul tău este activ. Prima factură automată se va genera{' '}
                  <strong>luni la 15:00</strong>. Dacă ai plătit luni înainte de 15:00, factura va fi
                  generată lunea următoare, nu în aceeași zi.
                </>
              )}
            </Typography>
          </Box>
        )}

        {/* Feature list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 3 }}>
          {currentPlan.intro && (
            <Typography sx={{ fontWeight: 700, color: T.ink, fontSize: '0.88rem' }}>{currentPlan.intro}</Typography>
          )}
          {currentPlan.list.map((feat) => (
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'flex-start' }} key={feat}>
              <CheckCircleOutlineRoundedIcon sx={{ color: T.primary, fontSize: 17, mt: 0.15, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.88rem', color: alpha(T.ink, 0.82) }}>{feat}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Upgrade/Downgrade section */}
      {showUpgrade && (
        <Box>
          <Typography sx={{ fontWeight: 700, color: T.ink, mb: 2, fontSize: '1rem' }}>
            Celelalte planuri disponibile
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrent = plan.key === currentPlanKey
              return (
                <Paper
                  key={plan.key}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: T.radius.xl,
                    border: isCurrent
                      ? `2px solid ${T.primary}`
                      : `1px solid ${T.border}`,
                    backgroundColor: isCurrent ? alpha(T.primary, 0.04) : T.paper,
                    position: 'relative',
                  }}
                >
                  {plan.highlighted && (
                    <Box
                      sx={{
                        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                        px: 1.5, py: 0.4, borderRadius: T.radius.full, backgroundColor: T.primary,
                        display: 'flex', alignItems: 'center', gap: 0.5,
                      }}
                    >
                      <StarRoundedIcon sx={{ fontSize: 11, color: '#fff' }} />
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}>Popular</Typography>
                    </Box>
                  )}
                  <Typography sx={{ fontWeight: 800, color: T.ink, fontSize: '1rem', mb: 0.5 }}>
                    {plan.title}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: T.primaryStrong, fontSize: '1.2rem', mb: 2 }}>
                    {plan.price}
                  </Typography>
                  <Button
                    variant={isCurrent ? 'outlined' : 'contained'}
                    fullWidth
                    disabled={isCurrent}
                    size="small"
                    onClick={() => handleUpgrade(plan.key)}
                    sx={{
                      borderRadius: T.radius.full,
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      backgroundColor: isCurrent ? 'transparent' : T.primary,
                      color: isCurrent ? T.textMuted : '#fff',
                      '&:hover': { backgroundColor: T.primaryStrong },
                    }}
                  >
                    {isCurrent ? 'Plan curent' : 'Treci la acest plan'}
                  </Button>
                </Paper>
              )
            })}
          </Box>
        </Box>
      )}
    </Box>
  )
}
