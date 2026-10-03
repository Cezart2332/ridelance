import { useState } from 'react'
import { Box, Button, Card, Checkbox, Chip, FormControlLabel, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { TOKENS } from '../../constants/tokens'
import { FLEET_ANONYMIZATION_LEI, FLEET_EXTRA_AD_LEI, type Plan } from '../../data/plans'
import { BCR_DISCOUNT } from '../../data/bcrDiscount'
import { BcrDiscountCheckbox } from './BcrDiscountCheckbox'
import { PlanPrice } from './PlanPrice'
import { PlanFeatureItem } from './PlanFeatureItem'
import { PricingPartnersDialog } from './PricingPartnersDialog'

const money = (value: number) => `${value.toLocaleString('ro-RO', {
  minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2,
})} lei`
const optionSx = {
  p: 2, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}`,
  backgroundColor: TOKENS.paper,
}

/** Oferta publică: opțiunile calculează doar o estimare locală, fără apeluri de plată. */
export function PublicPlanCard({ plan, bcrDiscount, onBcrDiscountChange, onStart }: {
  plan: Plan
  bcrDiscount: boolean
  onBcrDiscountChange: (checked: boolean) => void
  onStart: () => void
}) {
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [extraAds, setExtraAds] = useState(0)
  const [anonymousAds, setAnonymousAds] = useState(0)
  const [partnersOpen, setPartnersOpen] = useState(false)
  const addons = plan.addons ?? []
  const selected = addons.filter((addon) => !addon.included && selectedAddons.includes(addon.key))
  const extraMonthly = selected.reduce((sum, addon) => sum + addon.monthlyLei, 0) + extraAds * FLEET_EXTRA_AD_LEI
  const total = plan.pricing.monthlyLei + extraMonthly - (bcrDiscount ? BCR_DISCOUNT.monthlyLei : 0)
  const fleet = plan.audience === 'srl' && !plan.comingSoon

  return (
    <Card component="article" aria-label={plan.title} elevation={0} sx={{
      p: { xs: 3, md: 4 }, minWidth: 0, height: '100%', boxSizing: 'border-box',
      borderRadius: `${TOKENS.radius.xl}px`, display: 'flex', flexDirection: 'column', gap: 2.5,
      backgroundColor: TOKENS.paper,
      border: `1px solid ${plan.recommended ? TOKENS.primaryStrong : TOKENS.border}`,
      boxShadow: plan.recommended ? '0 16px 40px rgba(92,203,245,0.14)' : TOKENS.shadow.sm,
    }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: TOKENS.ink }}>{plan.title}</Typography>
        {(plan.recommended || plan.comingSoon) && <Chip label={plan.comingSoon ? 'În curând' : 'Recomandat'} size="small" sx={{
          backgroundColor: alpha(TOKENS.primary, 0.12), color: TOKENS.primaryStrong, fontWeight: 800,
        }} />}
      </Stack>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', md: '1.45rem' }, lineHeight: 1.3, color: TOKENS.ink }}>{plan.tagline}</Typography>
        <Typography sx={{ mt: 1, color: TOKENS.textMuted, fontSize: '0.93rem', lineHeight: 1.65 }}>{plan.summary}</Typography>
      </Box>
      <Box>
        {plan.comingSoon ? (
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 900, color: TOKENS.primaryStrong }}>Preț la lansare</Typography>
        ) : <PlanPrice monthlyLei={plan.pricing.monthlyLei} unit="/ lună" discounted={bcrDiscount} />}
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.78rem', mt: 0.7, fontStyle: 'italic' }}>{plan.noteMonthly}</Typography>
        {!plan.comingSoon && <BcrDiscountCheckbox checked={bcrDiscount} onChange={onBcrDiscountChange} />}
      </Box>
      <Box>
        <Typography sx={{ mb: 1.5, fontWeight: 800, fontSize: '0.9rem', color: TOKENS.ink }}>{plan.intro}</Typography>
        <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none', display: 'grid', gap: 1.3 }}>
          {plan.features.map((feature, index) => <PlanFeatureItem key={index} feature={feature} showPartnerLogo={false} />)}
        </Box>
      </Box>
      {!plan.comingSoon && <>
        <Button variant="outlined" onClick={() => setPartnersOpen(true)} sx={{
          justifyContent: 'space-between', textAlign: 'left', p: 1.7, borderRadius: `${TOKENS.radius.lg}px`,
          color: TOKENS.ink, fontWeight: 700, borderColor: alpha(TOKENS.primary, 0.3),
        }}>Reduceri și beneficii prin partenerii oficiali RIDElance <Box component="span" sx={{ ml: 1, color: TOKENS.primaryStrong }}>→</Box></Button>
        <PricingPartnersDialog audience={plan.audience} open={partnersOpen} onClose={() => setPartnersOpen(false)} />
      </>}
      {addons.length > 0 && <Stack spacing={1.5} sx={{ pt: 2.5, borderTop: `1px solid ${TOKENS.border}` }}>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: TOKENS.ink }}>
          {addons.every((addon) => addon.included) ? 'Automatizările sunt deja incluse' : fleet ? 'Opțiuni suplimentare' : 'Automatizează și mai mult'}
        </Typography>
        {addons.map((addon) => <Box key={addon.key} sx={optionSx}>
          {addon.included ? <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800 }}>{addon.title}</Typography>
            <Chip size="small" label="Inclus" color="success" variant="outlined" />
          </Stack> : <FormControlLabel sx={{ m: 0, alignItems: 'flex-start', width: '100%' }} control={
            <Checkbox size="small" checked={selectedAddons.includes(addon.key)} onChange={(_, checked) => {
              setSelectedAddons((previous) => checked ? [...previous, addon.key] : previous.filter((key) => key !== addon.key))
            }} sx={{ p: 0, mr: 1.2, mt: 0.2 }} />
          } label={<Typography sx={{ fontSize: '0.9rem', fontWeight: 800 }}>{addon.title} <Box component="span" sx={{ color: TOKENS.primaryStrong }}>+{money(addon.monthlyLei)}/lună</Box></Typography>} />}
          <Typography sx={{ mt: 0.7, fontSize: '0.8rem', color: TOKENS.textMuted, lineHeight: 1.6 }}>{addon.text}</Typography>
          {addon.alternative && <Typography sx={{ mt: 0.7, fontSize: '0.75rem', color: TOKENS.textMuted }}>{addon.alternative}</Typography>}
        </Box>)}
        {fleet && <>
          <Box sx={optionSx}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800 }}>Anunțuri active peste cele 10 incluse</Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: TOKENS.primaryStrong, mt: 0.5 }}>+{money(FLEET_EXTRA_AD_LEI)}/lună / anunț</Typography>
            <Typography sx={{ mt: 0.7, fontSize: '0.8rem', color: TOKENS.textMuted, lineHeight: 1.6 }}>Adaugi capacitate doar pentru mașinile active peste limita inclusă.</Typography>
            <Quantity label="Anunțuri suplimentare" value={extraAds} onChange={setExtraAds} />
          </Box>
          <Box sx={optionSx}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800 }}>Anonimizare număr de înmatriculare</Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: TOKENS.primaryStrong, mt: 0.5 }}>{money(FLEET_ANONYMIZATION_LEI)} / anunț · plată unică</Typography>
            <Typography sx={{ mt: 0.7, fontSize: '0.8rem', color: TOKENS.textMuted, lineHeight: 1.6 }}>Numărul de înmatriculare este mascat în fotografiile publice ale anunțului.</Typography>
            <Quantity label="Anunțuri anonimizate" value={anonymousAds} onChange={setAnonymousAds} />
          </Box>
        </>}
      </Stack>}
      <Stack spacing={1.5} sx={{ mt: 'auto', pt: 1 }}>
        {!plan.comingSoon && <Box aria-live="polite" sx={{ ...optionSx, backgroundColor: TOKENS.surface }}>
          <SummaryLine label={plan.title} value={money(plan.pricing.monthlyLei)} />
          {addons.filter((addon) => addon.included || selectedAddons.includes(addon.key)).map((addon) => <SummaryLine key={addon.key} label={addon.title} value={addon.included ? 'Inclus' : `+${money(addon.monthlyLei)}`} />)}
          {extraAds > 0 && <SummaryLine label={`Anunțuri suplimentare (${extraAds})`} value={`+${money(extraAds * FLEET_EXTRA_AD_LEI)}`} />}
          {bcrDiscount && <SummaryLine label="Reducere BCR · 6 luni" value={`−${money(BCR_DISCOUNT.monthlyLei)}`} />}
          <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${TOKENS.border}` }}>
            <SummaryLine label="Total lunar" value={money(total)} emphasized />
            {bcrDiscount && <Typography sx={{ mt: 0.5, color: TOKENS.textMuted, fontSize: '0.75rem' }}>În primele 6 luni eligibile, apoi {money(plan.pricing.monthlyLei + extraMonthly)}/lună.</Typography>}
          </Box>
          {anonymousAds > 0 && <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${TOKENS.border}` }}><SummaryLine label={`Plată unică anonimizare (${anonymousAds})`} value={money(anonymousAds * FLEET_ANONYMIZATION_LEI)} /></Box>}
        </Box>}
        <Button onClick={onStart} disabled={plan.comingSoon} variant={plan.recommended ? 'contained' : 'outlined'} fullWidth size="large" sx={{ py: 1.4, fontWeight: 800, borderRadius: `${TOKENS.radius.lg}px`, boxShadow: 'none' }}>{plan.cta}</Button>
        <Typography sx={{ fontSize: '0.76rem', lineHeight: 1.6, color: TOKENS.textMuted }}>{plan.footnote}</Typography>
      </Stack>
    </Card>
  )
}

function Quantity({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <Stack direction="row" sx={{ mt: 1.2, alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
    <IconButton aria-label={`Scade ${label.toLowerCase()}`} size="small" disabled={value === 0} onClick={() => onChange(Math.max(0, value - 1))}><RemoveRoundedIcon fontSize="small" /></IconButton>
    <Typography aria-label={label} sx={{ minWidth: 24, textAlign: 'center', fontWeight: 800 }}>{value}</Typography>
    <IconButton aria-label={`Adaugă ${label.toLowerCase()}`} size="small" onClick={() => onChange(value + 1)}><AddRoundedIcon fontSize="small" /></IconButton>
    <Typography sx={{ fontSize: '0.75rem', color: TOKENS.textMuted }}>{label.toLowerCase()}</Typography>
  </Stack>
}

function SummaryLine({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, py: 0.4, alignItems: 'baseline' }}>
    <Typography sx={{ fontSize: emphasized ? '0.95rem' : '0.8rem', fontWeight: emphasized ? 800 : 500, color: TOKENS.ink }}>{label}</Typography>
    <Typography sx={{ fontSize: emphasized ? '1.1rem' : '0.8rem', fontWeight: 800, color: emphasized ? TOKENS.primaryStrong : TOKENS.ink, whiteSpace: 'nowrap' }}>{value}</Typography>
  </Stack>
}
