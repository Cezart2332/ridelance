import { useState, useEffect } from 'react'
import { Box, Paper, Typography, CircularProgress } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import { stripeService, subscriptionPlansFor } from '../../../services/stripe.service'
import { cycleLabel } from '../../../utils/billing'
import { formatRomanianDate } from '../../../utils/billing'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { PageHeader, StatusChip, type StatusTone } from '../ui'


export interface PaymentItem {
  id: string
  date: Date
  amount: string
  description: string
  status: 'paid' | 'pending' | 'scheduled' | 'failed' | 'refunded'
}

const T = DASHBOARD_TOKENS

const STATUS_CONFIG: Record<PaymentItem['status'], { label: string; tone: StatusTone }> = {
  paid: { label: 'Plătit', tone: 'active' },
  pending: { label: 'În procesare', tone: 'neutral' },
  scheduled: { label: 'Programat', tone: 'neutral' },
  failed: { label: 'Eșuat', tone: 'error' },
  refunded: { label: 'Rambursat', tone: 'neutral' },
}

export function IstoricPlatiTab() {
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [statusData, historyData] = await Promise.all([
          stripeService.getSubscriptionStatus(),
          stripeService.getPaymentHistory(1, 100),
        ])

        // Map real payment records from database
        const mappedPayments: PaymentItem[] = historyData.map((item) => {
          let status: 'paid' | 'pending' | 'failed' | 'refunded' = 'paid'
          const s = item.status.toLowerCase()
          if (s === 'succeeded' || s === 'paid') status = 'paid'
          else if (s === 'pending') status = 'pending'
          else if (s === 'failed') status = 'failed'
          else if (s === 'refunded') status = 'refunded'

          return {
            id: item.id,
            date: new Date(item.createdAtUtc),
            amount: `${item.amountBani / 100} lei`,
            description: item.description,
            status,
          }
        })

        // Add scheduled future payment if active subscription exists
        if (statusData?.nextBillingDateUtc &&
            (statusData.status === 'Active' || statusData.status === 'ActivePendingBilling')) {
          const nextPlan = statusData.pendingPlan || statusData.plan
          const cycle = statusData.billingCycle === 'Annual' ? 'annual' : 'monthly'
          const planInfo = subscriptionPlansFor(cycle).find(p => p.key === nextPlan)

          // Fără plan cunoscut nu se inventează o sumă: rândul spune că urmează o plată, nu cât.
          mappedPayments.push({
            id: 'scheduled_next_payment',
            date: new Date(statusData.nextBillingDateUtc),
            amount: planInfo?.price ?? '—',
            description: `${planInfo?.title ?? 'Abonament RIDElance'} — abonament ${cycleLabel(statusData.billingCycle)}`,
            status: 'scheduled',
          })
        }

        // Sort descending by date
        mappedPayments.sort((a, b) => b.date.getTime() - a.date.getTime())
        setPayments(mappedPayments)
      } catch (err) {
        console.error('Failed to load payment history', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress sx={{ color: T.primary }} />
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeader title="Istoric Plăți" subtitle="Toate tranzacțiile tale cu RIDElance" />
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
                  <StatusChip label={statusConf.label} tone={statusConf.tone} size="sm" />
                </Box>
              </Paper>
            )
          })}
        </Box>
      )}


    </Box>
  )
}
