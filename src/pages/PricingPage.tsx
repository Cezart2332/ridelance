import { useState } from 'react'
import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'

import { ROUTES } from '../constants/routes'
import { TOKENS } from '../constants/tokens'
import { BcrDiscountCheckbox } from '../components/pricing/BcrDiscountCheckbox'
import { readBcrDiscountIntent, writeBcrDiscountIntent } from '../data/bcrDiscount'
import { SectionHeader } from '../components/common/SectionHeader'
import { PlanFeatureItem } from '../components/pricing/PlanFeatureItem'
import { Switcher } from '../components/pricing/Switcher'
import { pageFrameSx } from '../constants/layout'
import {
  ANNUAL_DISCOUNT,
  INCLUDED_FOOTNOTE,
  INCLUDED_IN_ALL,
  annualSummary,
  partnerLogoFor,
  plansFor,
  priceFor,
  type Audience,
  type BillingCycle,
  type Plan,
} from '../data/plans'
import { useAppSelector } from '../store/hooks'
import ridelanceLogo from '../assets/logo.svg'

/**
 * Pagina de abonamente.
 *
 * Două comutatoare, nu unul: cine cumpără (PFA sau flotă) și cum plătește (lunar sau anual).
 * Al doilea apare doar pe PFA, fiindcă planul de flotă n-are variantă anuală — un comutator care
 * nu schimbă nimic e mai rău decât unul absent.
 *
 * Cardurile își păstrează forma dinainte. S-a schimbat ce scrie în ele și de unde vine: din
 * `data/plans.ts`, nu din trei liste paralele.
 */
export function PricingPage() {
  const navigate = useNavigate()
  const { accessToken, isInitialized } = useAppSelector((s) => s.auth)

  const [audience, setAudience] = useState<Audience>('pfa')
  // Bifa e o singură decizie, deci o singură stare pentru toate cardurile. Se reține în sesiune și
  // devine valoarea implicită la alegerea abonamentului, unde chiar pleacă spre server.
  const [bcrDiscount, setBcrDiscount] = useState(readBcrDiscountIntent)
  const [cycle, setCycle] = useState<BillingCycle>('monthly')

  const plans = plansFor(audience)
  const showCycle = audience === 'pfa'

  const handleStart = () => {
    if (!isInitialized) return
    navigate(accessToken ? '/app' : ROUTES.login)
  }

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="xl">
        <Stack sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={4}>
          <SectionHeader
            title="Abonamente"
            subtitle="Planuri simple. Beneficii reale. Sprijin complet."
          />
          <Typography
            sx={{
              textAlign: 'center',
              color: TOKENS.textMuted,
              fontSize: '1.05rem',
              maxWidth: 620,
              mx: 'auto',
              mt: -2,
            }}
          >
            {audience === 'pfa'
              ? 'Tot ce ai nevoie pentru activitatea ta de PFA în ridesharing.'
              : 'Administrare digitală completă pentru flota ta, într-un singur loc.'}
          </Typography>

          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <Switcher
              value={audience}
              onChange={(next) => {
                setAudience(next)
                // Flota n-are plată anuală; revenirea pe PFA nu trebuie să găsească un ciclu orfan.
                if (next === 'srl') setCycle('monthly')
              }}
              options={[
                { value: 'pfa', label: 'PFA' },
                { value: 'srl', label: 'Flotă / SRL' },
              ]}
            />

            {showCycle && (
              <Switcher
                value={cycle}
                onChange={setCycle}
                options={[
                  { value: 'monthly', label: 'Lunar' },
                  { value: 'annual', label: 'Anual', badge: `-${Math.round(ANNUAL_DISCOUNT * 100)}%` },
                ]}
              />
            )}
          </Stack>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'stretch' },
              justifyContent: 'center',
              gap: 4,
              width: '100%',
            }}
          >
            {plans.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                cycle={cycle}
                single={plans.length === 1}
                onStart={handleStart}
                // Doar planurile PFA: contul BCR e pentru afacerea unei persoane fizice
                // autorizate, iar abonamentul de flotă nu are cum să-l primească.
                bcrDiscount={audience === 'pfa' ? bcrDiscount : null}
                onBcrDiscountChange={(next) => {
                  setBcrDiscount(next)
                  writeBcrDiscountIntent(next)
                }}
              />
            ))}
          </Box>

          <IncludedInAll />
        </Stack>
      </Container>
    </Box>
  )
}

function PlanCard({
  plan,
  cycle,
  single,
  onStart,
  bcrDiscount,
  onBcrDiscountChange,
}: {
  plan: Plan
  cycle: BillingCycle
  single: boolean
  onStart: () => void
  /** `null` ascunde bifa: planul nu e eligibil. */
  bcrDiscount: boolean | null
  onBcrDiscountChange: (checked: boolean) => void
}) {
  const price = priceFor(plan, cycle)
  const annual = cycle === 'annual' ? annualSummary(plan) : null

  return (
    <Card
      elevation={0}
      sx={{
        width: { xs: '100%', sm: '80%', md: single ? '100%' : '30%' },
        maxWidth: { md: single ? 560 : 420 },
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 3, md: 4.5 },
        borderRadius: TOKENS.radius.xl,
        backgroundColor: TOKENS.paper,
        position: 'relative',
        border: plan.recommended
          ? `1.5px solid ${TOKENS.primaryStrong}`
          : `1px solid ${alpha(TOKENS.ink, 0.06)}`,
        boxShadow: plan.recommended
          ? '0 16px 40px rgba(92,203,245,0.14)'
          : '0 4px 20px rgba(0,0,0,0.01)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: plan.recommended
            ? '0 24px 50px rgba(92,203,245,0.22)'
            : '0 16px 36px rgba(0,0,0,0.04)',
        },
      }}
    >
      {plan.recommended && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: TOKENS.primaryStrong,
            color: '#fff',
            px: 1.8,
            py: 0.5,
            borderRadius: TOKENS.radius.sm,
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: '0 4px 12px rgba(92,203,245,0.2)',
          }}
        >
          Recomandat
        </Box>
      )}

      <CardContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          height: '100%',
          gap: 2.5,
        }}
      >
        <Box sx={{ minHeight: { xs: 'auto', md: 128 } }}>
          <Typography variant="h5" sx={{ fontWeight: 800, fontSize: '1.35rem', color: TOKENS.ink }}>
            {plan.title}
          </Typography>

          <Stack direction="row" spacing={0.6} sx={{ justifyContent: 'center', alignItems: 'baseline', mt: 0.5 }}>
            <Typography sx={{ color: TOKENS.primaryStrong, fontWeight: 900, fontSize: '1.9rem', lineHeight: 1.1 }}>
              {price.amount} lei
            </Typography>
            <Typography sx={{ color: TOKENS.textMuted, fontWeight: 700, fontSize: '0.9rem' }}>
              {price.unit}
            </Typography>
          </Stack>

          {annual && (
            <Typography sx={{ color: TOKENS.primaryStrong, fontSize: '0.8rem', fontWeight: 700, mt: 0.4 }}>
              {annual}
            </Typography>
          )}

          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.78rem', mt: 0.5, fontStyle: 'italic' }}>
            {price.note}
          </Typography>

          {bcrDiscount !== null && (
            <BcrDiscountCheckbox checked={bcrDiscount} onChange={onBcrDiscountChange} align="center" />
          )}
        </Box>

        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.95rem', lineHeight: 1.6 }}>
          {plan.summary}
        </Typography>

        <Box
          component="ul"
          sx={{
            p: 0,
            m: 0,
            alignSelf: 'stretch',
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left',
            gap: 1.2,
            flexGrow: 1,
          }}
        >
          {plan.intro && (
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: TOKENS.ink, pr: 1.2 }}>
              {plan.intro}
            </Typography>
          )}
          {plan.features.map((feature, index) => (
            <PlanFeatureItem
              key={`${feature.strong ?? ''}-${feature.text ?? ''}-${index}`}
              feature={feature}
              showPartnerLogo={false}
            />
          ))}
        </Box>

        {plan.extras && (
          <Box
            sx={{
              alignSelf: 'stretch',
              textAlign: 'left',
              p: 2,
              borderRadius: TOKENS.radius.lg,
              backgroundColor: alpha(TOKENS.ink, 0.02),
              border: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
            }}
          >
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: TOKENS.ink, mb: 1 }}>
              Extra opționale:
            </Typography>
            <Stack spacing={0.8}>
              {plan.extras.map((extra) => (
                <Typography key={extra.amount} sx={{ fontSize: '0.85rem', color: alpha(TOKENS.ink, 0.85), lineHeight: 1.6 }}>
                  <Box component="strong" sx={{ fontWeight: 800, color: TOKENS.primaryStrong }}>
                    {extra.amount}
                  </Box>{' '}
                  {extra.text}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        {plan.footnote && (
          <Typography sx={{ fontSize: '0.8rem', color: TOKENS.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
            {plan.footnote}
          </Typography>
        )}

        <Button
          onClick={onStart}
          variant={plan.recommended ? 'contained' : 'outlined'}
          fullWidth
          size="large"
          sx={{
            mt: 'auto',
            py: 1.4,
            fontWeight: 800,
            fontSize: '0.95rem',
            borderRadius: TOKENS.radius.lg,
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            color: plan.recommended ? '#fff' : TOKENS.ink,
            borderColor: plan.recommended ? 'transparent' : alpha(TOKENS.ink, 0.12),
            '&:hover': plan.recommended
              ? { backgroundColor: TOKENS.primaryStrong, boxShadow: 'none' }
              : { borderColor: alpha(TOKENS.ink, 0.3), backgroundColor: alpha(TOKENS.ink, 0.01) },
          }}
        >
          {plan.cta}
        </Button>
      </CardContent>
    </Card>
  )
}

/** Ce primește oricine, indiferent de plan. Scris o dată, jos, nu de trei ori în carduri. */
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
                borderRadius: TOKENS.radius.lg,
                backgroundColor: TOKENS.paper,
                border: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: TOKENS.radius.md,
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
