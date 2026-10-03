import { useState } from 'react'
import { Box, Container, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { PublicPlanCard } from '../components/pricing/PublicPlanCard'
import { Switcher } from '../components/pricing/Switcher'
import { readBcrDiscountIntent, writeBcrDiscountIntent } from '../data/bcrDiscount'
import { pageFrameSx } from '../constants/layout'
import { ANNUAL_DISCOUNT, INCLUDED_FOOTNOTE, INCLUDED_IN_ALL, partnerLogoFor, plansFor, type Audience, type BillingCycle } from '../data/plans'
import { useAppSelector } from '../store/hooks'
import ridelanceLogo from '../assets/logo.svg'

export function PricingPage() {
  const navigate = useNavigate()
  const { accessToken, isInitialized } = useAppSelector((s) => s.auth)
  const [audience, setAudience] = useState<Audience>('pfa')
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [bcrDiscount, setBcrDiscount] = useState(readBcrDiscountIntent)
  const plans = plansFor(audience)

  const handleStart = () => {
    if (!isInitialized) return
    navigate(accessToken ? '/app' : ROUTES.login)
  }

  return (
    <Box sx={{ ...pageFrameSx, py: 3 }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <SectionHeader title="Abonamente" subtitle="Planuri simple. Beneficii reale. Sprijin complet." />
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <Switcher value={audience} onChange={setAudience} options={[{ value: 'pfa', label: 'PFA' }, { value: 'srl', label: 'SRL' }]} />
            <Switcher value={cycle} onChange={setCycle} options={[{ value: 'monthly', label: 'Lunar' }, { value: 'annual', label: 'Anual', badge: `-${Math.round(ANNUAL_DISCOUNT * 100)}%` }]} />
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: { xs: 3, md: 3 }, width: '100%', pt: 1 }}>
            {plans.map((plan) => <PublicPlanCard key={plan.key} plan={plan} cycle={cycle} onStart={handleStart} bcrDiscount={bcrDiscount} onBcrDiscountChange={(next) => {
              setBcrDiscount(next)
              writeBcrDiscountIntent(next)
            }} />)}
          </Box>
          {audience === 'pfa' && <IncludedInAll />}
        </Stack>
      </Container>
    </Box>
  )
}
function IncludedInAll() {
  return (
    <Box sx={{ width: '100%', mt: { xs: 4, md: 8 } }}>
      <Stack spacing={1} sx={{ alignItems: 'center', mb: 4 }}>
        <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.4rem', md: '1.8rem' }, color: TOKENS.ink, textAlign: 'center' }}>
          Incluse în toate planurile RIDElance
        </Typography>
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '1rem', textAlign: 'center', maxWidth: 620 }}>
          Beneficiile de bază ale ecosistemului RIDElance, indiferent de planul ales.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
        }}
      >
        {INCLUDED_IN_ALL.map((benefit) => {
          const logo = benefit.partner ? partnerLogoFor(benefit.partner) : null

          return (
            <Stack
              key={benefit.title}
              spacing={1.4}
              sx={{
                p: 2.6,
                borderRadius: `${TOKENS.radius.lg}px`,
                backgroundColor: TOKENS.paper,
                border: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: `${TOKENS.radius.md}px`,
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: alpha(TOKENS.ink, 0.03),
                  border: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
                }}
              >
                {logo ? (
                  <Box
                    component="img"
                    src={logo}
                    alt={benefit.partner}
                    sx={{ maxWidth: 36, maxHeight: 26, width: 'auto', height: 'auto', objectFit: 'contain' }}
                  />
                ) : (
                  // Beneficiile care nu vin de la un partener poartă marca RIDElance.
                  <Box
                    component="img"
                    src={ridelanceLogo}
                    alt="RIDElance"
                    sx={{ maxWidth: 36, maxHeight: 26, width: 'auto', height: 'auto', objectFit: 'contain' }}
                  />
                )}
              </Box>

              <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', color: TOKENS.ink }}>
                {benefit.title}
              </Typography>
              <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>
                {benefit.text}
              </Typography>
            </Stack>
          )
        })}
      </Box>

      <Typography
        sx={{ mt: 3, fontSize: '0.82rem', color: TOKENS.textMuted, fontStyle: 'italic', textAlign: 'center' }}
      >
        {INCLUDED_FOOTNOTE}
      </Typography>
    </Box>
  )
}
