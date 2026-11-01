import { Box, Stack, Typography } from '@mui/material'

import { DASHBOARD_TOKENS as T } from '../dashboard/dashboardTheme'
import { StatCard, StatGrid, StatusChip, type StatusTone } from '../dashboard/ui'
import { REFERRAL_STAGE_LABELS, formatReferralDate, type Referral, type ReferralStage } from '../../services/referrals.service'

const TONES: Record<ReferralStage, StatusTone> = {
  Invited: 'neutral',
  Onboarding: 'warning',
  Active: 'active',
  Inactive: 'neutral',
  Closed: 'error',
}

/** Cifrele recomandărilor: invitate, acceptate, cu abonament activ. Aceleași la client și la admin. */
export function ReferralStats({ referrals }: { referrals: Referral[] }) {
  return (
    <StatGrid columns={3} mobileColumns={3}>
      <StatCard size="sm" label="Invitații" value={String(referrals.length)} />
      <StatCard size="sm" label="Acceptate" value={String(referrals.filter((r) => r.accepted).length)} />
      <StatCard size="sm" label="Abonați" value={String(referrals.filter((r) => r.stage === 'Active').length)} />
    </StatGrid>
  )
}

/** Lista invitațiilor, cu stadiul fiecăreia. */
export function ReferralList({ referrals }: { referrals: Referral[] }) {
  if (referrals.length === 0) {
    return <Typography sx={{ color: T.textMuted, py: 2, textAlign: 'center' }}>Nicio invitație</Typography>
  }

  return (
    <Stack divider={<Box sx={{ borderTop: `1px solid ${T.border}` }} />}>
      {referrals.map((referral) => {
        return (
          <Stack
            key={referral.email}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 0.75, sm: 2 }}
            sx={{ py: 1.5, alignItems: { sm: 'center' } }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 650, overflowWrap: 'anywhere' }}>{referral.name ?? referral.email}</Typography>
              {referral.name && (
                <Typography variant="body2" sx={{ color: T.textMuted, overflowWrap: 'anywhere' }}>
                  {referral.email}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" sx={{ color: T.textMuted, minWidth: 96 }}>
              {formatReferralDate(referral.joinedAtUtc ?? referral.invitedAtUtc)}
            </Typography>
            <Box sx={{ minWidth: 150, display: 'flex', justifyContent: { sm: 'flex-end' } }}>
              <StatusChip size="sm" tone={TONES[referral.stage] ?? 'neutral'} label={REFERRAL_STAGE_LABELS[referral.stage] ?? referral.stage} />
            </Box>
          </Stack>
        )
      })}
    </Stack>
  )
}
