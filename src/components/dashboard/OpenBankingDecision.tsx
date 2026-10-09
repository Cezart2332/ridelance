import { useState } from 'react'
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'

import { PFA_PATHS } from '../../config/pfaNavigation'
import { PFA_PLANS } from '../../data/plans'
import { stripeService, type AddonKey, type SubscriptionResponse } from '../../services/stripe.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { PaymentPolicyAcceptance } from '../common/PaymentPolicyAcceptance'
import { DASHBOARD_TOKENS as T } from './dashboardTheme'

const OPEN_BANKING_LEI = PFA_PLANS.find((plan) => plan.key === 'pfalone')?.addons?.find((addon) => addon.key === 'open-banking')?.monthlyLei

/**
 * PFAlone, la finalul lunii gratuite de Open Banking: dashboardul se oprește aici până alege.
 * „Păstrez” trece prin checkout (opțiunea se adaugă pe abonament); „Renunț” deconectează banca.
 */
export function OpenBankingDecision({ subscription, onDeclined }: { subscription: SubscriptionResponse; onDeclined: () => void }) {
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const keep = async () => {
    setBusy(true)
    setError('')
    const origin = window.location.origin
    // Opțiunea se cumpără ca orice schimbare de abonament: casa de marcat, dacă o avea, rămâne.
    const addons: AddonKey[] = ['open-banking', ...(subscription.hasCashRegisterAddon ? (['cash-register'] as const) : [])]
    try {
      await stripeService.redirectToPlan('pfalone', `${origin}${PFA_PATHS.home}?open_banking=1`, `${origin}${PFA_PATHS.home}`, {
        isPlanChange: true,
        cycle: subscription.billingCycle === 'Annual' ? 'annual' : 'monthly',
        addons,
      })
    } catch (cause) {
      setError(getErrorMessage(cause))
      setBusy(false)
    }
  }

  const decline = async () => {
    setBusy(true)
    setError('')
    try {
      await stripeService.declineOpenBanking()
      onDeclined()
    } catch (cause) {
      setError(getErrorMessage(cause))
      setBusy(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, backgroundColor: T.surface }}>
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 480, p: { xs: 3, md: 4 }, borderRadius: `${T.radius.xl}px`, border: `1px solid ${T.border}`, boxShadow: T.shadow.md }}>
        <Stack spacing={2.5}>
          <AccountBalanceRoundedIcon sx={{ fontSize: 36, color: T.primaryStrong }} />
          <Typography component="h1" sx={{ fontWeight: 800, fontSize: '1.4rem', color: T.ink }}>
            Păstrezi Open Banking?
          </Typography>
          <Typography sx={{ color: T.ink }}>Luna gratuită s-a încheiat.</Typography>
          <PaymentPolicyAcceptance checked={policyAccepted} onChange={setPolicyAccepted} />
          {error && <Alert severity="error">{error}</Alert>}
          <Button variant="contained" size="large" disabled={busy || !policyAccepted} onClick={() => void keep()} sx={{ fontWeight: 800 }}>
            Păstrez · +{OPEN_BANKING_LEI} lei / lună
          </Button>
          <Button variant="text" disabled={busy} onClick={() => void decline()} sx={{ fontWeight: 700, color: T.textMuted }}>
            Renunț și deconectez banca
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
