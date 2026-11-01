import { useEffect, useState } from 'react'
import { Alert, Box, Divider, Stack, Typography } from '@mui/material'

import { EmptyState, FieldGrid, Section, SectionSkeleton, StatusBadge, type StatusTone } from '../admin'
import {
  REFERRAL_STAGE_LABELS,
  formatReferralDate,
  referralsService,
  type ReferralStage,
  type Referrals,
} from '../../services/referrals.service'
import { getErrorMessage } from '../../utils/errorHandler'

const TONES: Record<ReferralStage, StatusTone> = {
  Invited: 'neutral',
  Onboarding: 'warning',
  Active: 'success',
  Inactive: 'neutral',
  Closed: 'error',
}

/** Admin → fișa clientului → Recomandări: codul lui, invitațiile trimise și stadiul fiecăreia. */
export function ClientReferralsPanel({ userId }: { userId: string }) {
  const [loaded, setLoaded] = useState<{ userId: string; data: Referrals | null; error: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    referralsService
      .ofClient(userId)
      .then((data) => {
        if (!cancelled) setLoaded({ userId, data, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setLoaded({ userId, data: null, error: getErrorMessage(err, 'Nu am putut încărca recomandările.') })
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const current = loaded?.userId === userId ? loaded : null
  const data = current?.data ?? null
  const referrals = data?.referrals ?? []

  return (
    <>
      <Section title="Cod de recomandare">
        {!current ? (
          <SectionSkeleton rows={1} />
        ) : current.error ? (
          <Alert severity="error">{current.error}</Alert>
        ) : (
          <FieldGrid
            columns={3}
            fields={[
              { label: 'Cod', value: data?.code, numeric: true },
              { label: 'Invitații', value: String(referrals.length), numeric: true },
              { label: 'Acceptate', value: String(referrals.filter((r) => r.accepted).length), numeric: true },
              { label: 'Abonament activ', value: String(referrals.filter((r) => r.stage === 'Active').length), numeric: true },
            ]}
          />
        )}
      </Section>

      <Section title="Invitații">
        {!current ? (
          <SectionSkeleton rows={3} />
        ) : referrals.length === 0 ? (
          <EmptyState title="Nicio invitație" />
        ) : (
          <Stack spacing={1.5} divider={<Divider />}>
            {referrals.map((referral) => (
              <Stack key={referral.email} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} sx={{ alignItems: { sm: 'center' } }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" sx={{ overflowWrap: 'anywhere' }}>{referral.name ?? referral.email}</Typography>
                  {referral.name && (
                    <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      {referral.email}
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 96 }}>
                  {formatReferralDate(referral.joinedAtUtc ?? referral.invitedAtUtc)}
                </Typography>
                <Box sx={{ minWidth: 150, display: 'flex', justifyContent: { sm: 'flex-end' } }}>
                  <StatusBadge tone={TONES[referral.stage] ?? 'neutral'} label={REFERRAL_STAGE_LABELS[referral.stage] ?? referral.stage} />
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Section>
    </>
  )
}
