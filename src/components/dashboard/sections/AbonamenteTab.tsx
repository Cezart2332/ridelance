import { useState, useEffect } from 'react'
import { Box, Button, Paper, Typography, CircularProgress, Snackbar, Alert } from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { alpha } from '@mui/material/styles'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import {
  subscriptionPlansFor,
  stripeService,
  type PlanKey,
  type SubscriptionResponse,
} from '../../../services/stripe.service'
import { cycleLabel, formatRomanianDate, nextBillingDate as projectNextBilling } from '../../../utils/billing'
import { PaymentPolicyAcceptance } from '../../common/PaymentPolicyAcceptance'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { PageHeader, StatusChip } from '../ui'
import { PFA_PATHS } from '../../../config/pfaNavigation'

const T = DASHBOARD_TOKENS

/**
 * Un abonament plătit e activ, punct. Chipul avea și starea „Programat Luni", pentru intervalul
 * dintre plată și ancora de facturare — un interval care nu mai există.
 */
function SubscriptionStatusChip() {
  return (
    <StatusChip
      outlined
      icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: '14px !important' }} />}
      label="Activ"
      tone="active"
    />
  )
}

export function AbonamenteTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [subStatus, setSubStatus] = useState<SubscriptionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [planChangeNotice, setPlanChangeNotice] = useState(false)
  const [paymentPolicyAccepted, setPaymentPolicyAccepted] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

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
  const cycle = subStatus?.billingCycle === 'Annual' ? 'annual' : 'monthly'
  const plans = subscriptionPlansFor(cycle)
  // Data reală vine de la server; proiecția locală acoperă doar fereastra dintre plată și
  // primul webhook, când abonamentul există dar data încă n-a fost scrisă.
  const nextBillingDate = subStatus?.nextBillingDateUtc
    ? new Date(subStatus.nextBillingDateUtc)
    : projectNextBilling(new Date(), subStatus?.billingCycle ?? 'Monthly')

  // Default to start plan if no active plan
  const currentPlanKey: PlanKey = activePlan || 'start'
  const currentPlan = plans.find(p => p.key === currentPlanKey) || plans[1]

  const handleUpgrade = (key: PlanKey) => {
    if (!paymentPolicyAccepted) return
    const origin = window.location.origin
    setCheckoutError(null)
    stripeService
      .redirectToPlan(
        key,
        `${origin}${PFA_PATHS.svcSubscriptions}?plan_changed=1`,
        `${origin}${PFA_PATHS.svcSubscriptions}`,
        { isPlanChange: true, cycle },
      )
      .catch(() => {
        setCheckoutError('Nu am putut deschide plata. Încearcă din nou în câteva momente.')
      })
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <Snackbar
        open={planChangeNotice}
        autoHideDuration={6000}
        onClose={() => setPlanChangeNotice(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setPlanChangeNotice(false)} sx={{ width: '100%' }}>
          Plata a fost înregistrată. Noul abonament este activ de acum.
        </Alert>
      </Snackbar>

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
        <PageHeader title="Abonamentul meu" />
      </Box>

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
              <SubscriptionStatusChip />
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
              Următoarea plată:
            </Typography>
            <Typography sx={{ color: T.textMuted, fontSize: '0.85rem' }}>
              {formatRomanianDate(nextBillingDate)} · abonament {cycleLabel(subStatus?.billingCycle)}
            </Typography>
          </Box>
        </Box>

        {/* Blocul care explica ancora de luni 15:00 a dispărut odată cu ea: abonamentul se
            încasează la cumpărare, iar data de mai sus spune deja tot ce era de spus. */}

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
          <Box sx={{ mb: 2 }}>
            <PaymentPolicyAcceptance
              checked={paymentPolicyAccepted}
              onChange={setPaymentPolicyAccepted}
            />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {plans.map((plan) => {
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
                    disabled={isCurrent || !paymentPolicyAccepted}
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
