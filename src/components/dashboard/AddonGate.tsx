import type { ReactNode } from 'react'
import { Button, Paper, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import LockRoundedIcon from '@mui/icons-material/LockRounded'

import { PFA_PATHS } from '../../config/pfaNavigation'
import { PFA_PLANS } from '../../data/plans'
import { DASHBOARD_TOKENS as T } from './dashboardTheme'
import { PageHeader } from './ui'
import { usePlanAccess } from './planAccess'
import type { AddonKey } from '../../services/stripe.service'

/**
 * Pagina unei opțiuni PFAlone (Open Banking, casa de marcat). La PFA Full e inclusă; la PFAlone
 * se vede doar după ce opțiunea e plătită, altfel pagina spune cât costă și unde se adaugă.
 */
export function AddonGate({ addon, title, children }: { addon: AddonKey; title: string; children: ReactNode }) {
  const access = usePlanAccess()
  const navigate = useNavigate()
  const included = addon === 'open-banking' ? access.includesOpenBanking : access.includesCashRegister
  if (included) return <>{children}</>

  const price = PFA_PLANS.find((plan) => plan.key === 'pfalone')?.addons?.find((option) => option.key === addon)?.monthlyLei

  return (
    <Stack spacing={2.5}>
      <PageHeader title={title} />
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: `${T.radius.lg}px`, border: `1px solid ${T.border}` }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, alignItems: { sm: 'center' } }}>
          <LockRoundedIcon sx={{ color: T.textMuted }} />
          <Typography sx={{ flex: 1, fontWeight: 700, color: T.ink }}>
            Opțiune PFAlone{price ? ` · +${price} lei / lună` : ''}
          </Typography>
          <Button variant="contained" onClick={() => navigate(PFA_PATHS.svcSubscriptions)} sx={{ fontWeight: 700 }}>
            Adaugă opțiunea
          </Button>
        </Stack>
      </Paper>
    </Stack>
  )
}
