import { useState, useEffect } from 'react'
import { Box, Chip, Paper, Typography, CircularProgress } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import { stripeService, type SubscriptionResponse } from '../../../services/stripe.service'
import { formatRomanianDate } from '../../../utils/billing'
import { SUBSCRIPTION_PLANS } from '../../../services/stripe.service'

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
    md: '0 3px 12px rgba(0,0,0,0.07)',
  },
}

interface FakePayment {
  id: string
  date: Date
  amount: string
  description: string
  status: 'paid' | 'pending' | 'scheduled'
}

function buildFakeHistory(subStatus: SubscriptionResponse | null): FakePayment[] {
  const plan = subStatus?.plan
  const nextBilling = subStatus?.nextBillingDateUtc ? new Date(subStatus.nextBillingDateUtc) : null

  if (!plan || !nextBilling) return []

  const planInfo = SUBSCRIPTION_PLANS.find(p => p.key === plan)
  if (!planInfo) return []

  const now = new Date()
  const payments: FakePayment[] = []

  // Simulate registration payment (Înființare PFA)
  const regDate = new Date(now)
  regDate.setDate(regDate.getDate() - 1)
  payments.push({
    id: 'pay_reg_01',
    date: regDate,
    amount: '450 lei',
    description: 'Înființare PFA — serviciu individual',
    status: 'paid',
  })

  // Upcoming scheduled subscription payment
  payments.push({
    id: 'pay_sub_01',
    date: nextBilling,
    amount: planInfo.price,
    description: `${planInfo.title} — abonament săptămânal`,
    status: 'scheduled',
  })

  return payments.sort((a, b) => b.date.getTime() - a.date.getTime())
}

const STATUS_CONFIG = {
  paid: { label: 'Plătit', color: '#16a34a', bg: alpha('#22c55e', 0.1) },
  pending: { label: 'În procesare', color: '#b45309', bg: alpha('#f59e0b', 0.1) },
  scheduled: { label: 'Programat', color: '#1d4ed8', bg: alpha('#3b82f6', 0.1) },
}

export function IstoricPlatiTab() {
  const [subStatus, setSubStatus] = useState<SubscriptionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const payments = buildFakeHistory(subStatus)

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: T.ink }}>
            Istoric Plăți
          </Typography>
          <Typography sx={{ color: T.textMuted, fontSize: '0.9rem', mt: 0.3 }}>
            Toate tranzacțiile tale cu RIDElance
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.8,
            borderRadius: T.radius.lg,
            backgroundColor: alpha(T.primary, 0.06),
            border: `1px solid ${alpha(T.primary, 0.12)}`,
          }}
        >
          <CalendarTodayRoundedIcon sx={{ color: T.primaryStrong, fontSize: 16 }} />
          <Typography sx={{ fontWeight: 700, color: T.ink, fontSize: '0.82rem' }}>
            {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>

      {payments.length === 0 ? (
        /* Empty state */
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: T.radius.xl,
            border: `1px dashed ${T.border}`,
            backgroundColor: T.paper,
            textAlign: 'center',
          }}
        >
          <ReceiptLongRoundedIcon sx={{ fontSize: 48, color: alpha(T.ink, 0.18), mb: 2 }} />
          <Typography sx={{ fontWeight: 700, color: T.textMuted, fontSize: '1rem' }}>
            Nu ai plăți înregistrate
          </Typography>
          <Typography sx={{ color: T.textMuted, fontSize: '0.88rem', mt: 0.5 }}>
            Istoricul plăților va apărea aici după prima tranzacție.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {payments.map((payment) => {
            const statusConf = STATUS_CONFIG[payment.status]
            return (
              <Paper
                key={payment.id}
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: T.radius.xl,
                  border: `1px solid ${T.border}`,
                  backgroundColor: T.paper,
                  boxShadow: T.shadow.sm,
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': { boxShadow: T.shadow.md },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: T.radius.lg,
                      backgroundColor: alpha(T.primary, 0.08),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ReceiptLongRoundedIcon sx={{ color: T.primaryStrong, fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: T.ink, fontSize: '0.95rem' }}>
                      {payment.description}
                    </Typography>
                    <Typography sx={{ color: T.textMuted, fontSize: '0.82rem', mt: 0.3 }}>
                      {formatRomanianDate(payment.date)}
                      {payment.status === 'scheduled' && ' la 15:00'}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: { xs: 'center', sm: 'flex-end' }, gap: 0.8 }}
                >
                  <Typography sx={{ fontWeight: 800, color: T.ink, fontSize: '1.05rem' }}>
                    {payment.amount}
                  </Typography>
                  <Chip
                    label={statusConf.label}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      color: statusConf.color,
                      backgroundColor: statusConf.bg,
                      borderRadius: T.radius.full,
                    }}
                  />
                </Box>
              </Paper>
            )
          })}
        </Box>
      )}

      {/* Note about real-time data */}
      <Box
        sx={{
          mt: 4,
          p: 2,
          borderRadius: T.radius.lg,
          backgroundColor: alpha(T.primary, 0.04),
          border: `1px solid ${alpha(T.primary, 0.1)}`,
        }}
      >
        <Typography sx={{ color: T.textMuted, fontSize: '0.82rem', lineHeight: 1.6 }}>
          📊 Istoricul complet al plăților va fi disponibil după integrarea cu Stripe Webhooks.
          Poți vedea toate facturile și în{' '}
          <Box
            component="a"
            href="https://billing.stripe.com/p/login/test_00g"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: T.primaryStrong, fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            portalul de facturare Stripe
          </Box>
          .
        </Typography>
      </Box>
    </Box>
  )
}
