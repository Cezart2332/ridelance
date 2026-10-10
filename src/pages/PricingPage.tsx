import { useState } from 'react'
import { Box, Container, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { SectionHeader } from '../components/common/SectionHeader'
import { PublicPlanCard } from '../components/pricing/PublicPlanCard'
import { Switcher } from '../components/pricing/Switcher'
import { readBcrDiscountIntent, writeBcrDiscountIntent } from '../data/bcrDiscount'
import { pageFrameSx } from '../constants/layout'
import { staticPageSeo, usePageSeo } from '../seo/pageSeo'
import { ANNUAL_DISCOUNT, plansFor, type Audience, type BillingCycle } from '../data/plans'
import { useAppSelector } from '../store/hooks'

const TITLE = 'Abonamente'
const SUBTITLE = 'Planuri simple. Beneficii reale. Sprijin complet.'

export function PricingPage() {
  usePageSeo(staticPageSeo(TITLE, '/abonamente-preturi', SUBTITLE))
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
          <SectionHeader as="h1" title={TITLE} subtitle={SUBTITLE} />
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
        </Stack>
      </Container>
    </Box>
  )
}
