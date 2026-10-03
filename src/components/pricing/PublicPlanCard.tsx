import { useId, useState } from 'react'
import { Box, Button, Card, Checkbox, Chip, Dialog, DialogContent, DialogTitle, FormControlLabel, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { TOKENS } from '../../constants/tokens'
import { FLEET_ANONYMIZATION_LEI, FLEET_EXTRA_AD_LEI, type BillingCycle, type Plan } from '../../data/plans'
import { BCR_DISCOUNT } from '../../data/bcrDiscount'
import { BcrDiscountCheckbox } from './BcrDiscountCheckbox'
import { PlanFeatureItem } from './PlanFeatureItem'
import { PricingPartnersDialog } from './PricingPartnersDialog'

const money = (value: number) => `${value.toLocaleString('ro-RO', {
  minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2,
})} lei`
const smallTextSx = { fontSize: '0.76rem', lineHeight: 1.45, color: TOKENS.textMuted }
const optionSx = { px: 1.2, py: 0.65, borderRadius: `${TOKENS.radius.md}px`, border: `1px solid ${TOKENS.border}` }

/** Oferta publică: opțiunile calculează doar o estimare locală, fără apeluri de plată. */
export function PublicPlanCard({ plan, cycle = 'monthly', bcrDiscount, onBcrDiscountChange, onStart }: {
  plan: Plan
  cycle?: BillingCycle
  bcrDiscount: boolean
  onBcrDiscountChange: (checked: boolean) => void
  onStart: () => void
}) {
  const detailsId = useId()
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [extraAds, setExtraAds] = useState(0)
  const [anonymousAds, setAnonymousAds] = useState(0)
  const [partnersOpen, setPartnersOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const addons = plan.addons ?? []
  const selected = addons.filter((addon) => !addon.included && selectedAddons.includes(addon.key))
  const extraMonthly = selected.reduce((sum, addon) => sum + addon.monthlyLei, 0) + extraAds * FLEET_EXTRA_AD_LEI
  const annual = cycle === 'annual' && plan.pricing.annualTotalLei != null
  const baseMonthly = annual ? plan.pricing.annualMonthlyLei! : plan.pricing.monthlyLei
  const discount = bcrDiscount ? BCR_DISCOUNT.monthlyLei * (annual ? BCR_DISCOUNT.months : 1) : 0
  // La anual BCR scade 6 × 50 lei din prima factură, nu 50 lei din fiecare lună a anului.
  const annualDue = annual ? plan.pricing.annualTotalLei! - discount : 0
  const displayMonthly = annual ? Math.round(annualDue / 12 * 100) / 100 : baseMonthly - discount
  const total = displayMonthly + extraMonthly
  const fleet = plan.audience === 'srl' && !plan.comingSoon

  return (
    <Card component="article" aria-label={plan.title} elevation={0} sx={{
      p: { xs: 2.25, md: 2.5 }, minWidth: 0, height: '100%', boxSizing: 'border-box', position: 'relative',
      borderRadius: `${TOKENS.radius.xl}px`, display: 'flex', flexDirection: 'column', gap: 1.25,
      backgroundColor: TOKENS.paper, border: `1px solid ${plan.recommended ? TOKENS.primaryStrong : TOKENS.border}`,
      boxShadow: plan.recommended ? '0 8px 24px rgba(92,203,245,0.12)' : TOKENS.shadow.sm,
      overflow: 'visible',
    }}>
      {(plan.recommended || plan.comingSoon) && <Chip label={plan.comingSoon ? 'În curând' : 'Recomandat'} size="small" sx={{
        position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', height: 22,
        backgroundColor: TOKENS.surfaceAlt, border: `1px solid ${alpha(TOKENS.primary, 0.4)}`, color: TOKENS.primaryStrong, fontWeight: 800, fontSize: '0.66rem',
      }} />}
      <Typography variant="h5" sx={{ fontWeight: 800, color: TOKENS.ink, textAlign: 'center', fontSize: '1.2rem' }}>{plan.title}</Typography>
      <Box sx={{ textAlign: 'center' }}>
        {plan.comingSoon ? <Box sx={{ minHeight: 58, display: 'grid', placeItems: 'center' }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: TOKENS.primaryStrong }}>Preț la lansare</Typography>
        </Box> : <Box data-testid="plan-price" sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'center', columnGap: 1.2, height: { xs: 76, sm: 54 }, textAlign: 'left' }}>
          <Box>
            <Typography component="s" aria-hidden={!bcrDiscount} sx={{ ...smallTextSx, display: 'block', height: 15, visibility: bcrDiscount ? 'visible' : 'hidden' }}>{money(baseMonthly)}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: { xs: 0, sm: 0.5 }, alignItems: { xs: 'flex-start', sm: 'baseline' }, whiteSpace: 'nowrap' }}>
              <Typography sx={{ color: TOKENS.primaryStrong, fontWeight: 900, fontSize: { xs: '1.45rem', sm: '1.75rem' }, lineHeight: 1.2 }}>{money(displayMonthly)}</Typography>
              <Typography sx={{ ...smallTextSx, fontWeight: 700 }}>/ lună</Typography>
            </Stack>
          </Box>
          <Typography data-testid="bcr-price-note" sx={{ fontSize: '0.73rem', fontWeight: 650, lineHeight: 1.4, color: TOKENS.primaryStrong, visibility: bcrDiscount ? 'visible' : 'hidden' }}>
            {annual ? `BCR: −${money(discount)} în primul an, apoi ${money(baseMonthly)}/lună.` : `primele 6 luni, apoi ${money(baseMonthly)}/lună.`}
          </Typography>
        </Box>}
        <Typography sx={{ ...smallTextSx, fontSize: '0.72rem', minHeight: 18 }}>
          {plan.comingSoon ? plan.noteMonthly : annual ? `${money(annualDue)} facturați anual · reducere 10%` : 'Abonament lunar, cu reînnoire automată.'}
        </Typography>
        {!plan.comingSoon && <BcrDiscountCheckbox checked={bcrDiscount} onChange={onBcrDiscountChange} align="center" />}
      </Box>
      <Box>
        <Typography sx={{ mb: 0.8, fontWeight: 750, fontSize: '0.8rem', color: TOKENS.ink }}>{plan.intro}</Typography>
        <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none', display: 'grid', gap: 0.7,
          gridTemplateColumns: { xs: '1fr', sm: plan.audience === 'srl' ? 'repeat(2, minmax(0, 1fr))' : '1fr' },
          '& .MuiTypography-root': { fontSize: '0.79rem', lineHeight: 1.4 },
          '& .MuiSvgIcon-root': { fontSize: 16, minWidth: 16, mt: 0.1 },
        }}>
          {plan.features.map((feature, index) => <PlanFeatureItem key={index} feature={{ ...feature, text: undefined }} showPartnerLogo={false} />)}
        </Box>
      </Box>
      {addons.length > 0 && <Stack spacing={0.75} sx={{ pt: 1.2, borderTop: `1px solid ${TOKENS.border}` }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 750, color: TOKENS.ink }}>
          {addons.every((addon) => addon.included) ? 'Automatizări incluse' : 'Opțiuni suplimentare'}
        </Typography>
        {addons.map((addon) => <Stack key={addon.key} direction="row" sx={{ ...optionSx, alignItems: 'center', gap: 0.7 }}>
          {addon.included ? <Typography sx={{ fontSize: '0.79rem', fontWeight: 650, flex: 1 }}>{addon.title}</Typography> : <FormControlLabel sx={{ m: 0, flex: 1, gap: 0.8 }} control={
            <Checkbox size="small" checked={selectedAddons.includes(addon.key)} onChange={(_, checked) => {
              setSelectedAddons((previous) => checked ? [...previous, addon.key] : previous.filter((key) => key !== addon.key))
            }} sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 } }} />
          } label={<Typography sx={{ fontSize: '0.79rem', fontWeight: 650 }}>{addon.title}</Typography>} />}
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 750, color: addon.included ? 'success.main' : TOKENS.primaryStrong, whiteSpace: 'nowrap' }}>{addon.included ? 'Inclus' : `+${money(addon.monthlyLei)}/lună`}</Typography>
          <Tooltip title={`${addon.text} ${addon.alternative ?? ''}`} enterTouchDelay={0} arrow><IconButton size="small" aria-label={`Detalii ${addon.title}`} sx={{ p: 0.2 }}><InfoOutlinedIcon sx={{ fontSize: 15, color: TOKENS.textSubtle }} /></IconButton></Tooltip>
        </Stack>)}
        {fleet && <>
          <FleetOption title="Anunțuri suplimentare" price={`+${money(FLEET_EXTRA_AD_LEI)}/lună / anunț`} value={extraAds} onChange={setExtraAds} />
          <FleetOption title="Anunțuri anonimizate" price={`${money(FLEET_ANONYMIZATION_LEI)} / anunț · plată unică`} value={anonymousAds} onChange={setAnonymousAds} />
        </>}
      </Stack>}
      <Stack spacing={1} sx={{ mt: 'auto' }}>
        {!plan.comingSoon && <Box aria-live="polite" sx={{ ...optionSx, py: 1, backgroundColor: TOKENS.surface }}>
          <SummaryLine label={annual ? 'Echivalent lunar' : 'Total lunar'} value={money(total)} emphasized />
          {extraMonthly > 0 && annual && <Typography sx={smallTextSx}>Opțiuni facturate separat: {money(extraMonthly)}/lună.</Typography>}
          {anonymousAds > 0 && <SummaryLine label={`Plată unică anonimizare (${anonymousAds})`} value={money(anonymousAds * FLEET_ANONYMIZATION_LEI)} />}
        </Box>}
        <Stack direction="row" sx={{ justifyContent: 'center', alignItems: 'center', gap: 1 }}>
          <Button size="small" onClick={() => setDetailsOpen(true)} sx={{ fontSize: '0.75rem', color: TOKENS.textMuted, py: 0.25 }}>Detalii și calcul</Button>
          {!plan.comingSoon && <Button size="small" onClick={() => setPartnersOpen(true)} sx={{ fontSize: '0.75rem', py: 0.25 }}>Beneficii parteneri</Button>}
        </Stack>
        <Button onClick={onStart} disabled={plan.comingSoon} variant={plan.recommended ? 'contained' : 'outlined'} fullWidth sx={{ py: 0.8, fontWeight: 800, borderRadius: `${TOKENS.radius.md}px`, boxShadow: 'none' }}>{plan.cta}</Button>
        <Typography sx={{ ...smallTextSx, fontSize: '0.68rem' }}>
          {plan.comingSoon ? 'Prețul și condițiile vor fi anunțate la lansare.' : fleet ? '10 anunțuri incluse · 0% comision din chirii.' : plan.recommended ? 'Open Banking și automatizarea casei de marcat sunt incluse.' : 'Depunerea declarațiilor fiscale nu este inclusă.'}
        </Typography>
      </Stack>
      <PricingPartnersDialog audience={plan.audience} open={partnersOpen} onClose={() => setPartnersOpen(false)} />
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm" aria-labelledby={detailsId} slotProps={{ paper: { sx: { borderRadius: `${TOKENS.radius.xl}px` } } }}>
        <DialogTitle id={detailsId} sx={{ fontWeight: 800, pr: 7 }}>{plan.title} — detalii
          <IconButton aria-label="Închide detaliile" onClick={() => setDetailsOpen(false)} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseRoundedIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ ...smallTextSx, mb: 2 }}>{plan.summary}</Typography>
          <Typography sx={{ fontWeight: 800, mb: 1 }}>{plan.intro}</Typography>
          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1.5 }}>
            {plan.features.map((feature, index) => <PlanFeatureItem key={index} feature={feature} showPartnerLogo={false} />)}
          </Box>
          {addons.map((addon) => <Box key={addon.key} sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 750, fontSize: '0.9rem' }}>{addon.title} · {addon.included ? 'inclus' : `+${money(addon.monthlyLei)}/lună`}</Typography>
            <Typography sx={smallTextSx}>{addon.text}</Typography>
            <Typography sx={smallTextSx}>{addon.alternative}</Typography>
          </Box>)}
          {!plan.comingSoon && <Box sx={{ ...optionSx, mt: 2, p: 2, backgroundColor: TOKENS.surface }}>
            <SummaryLine label={annual ? 'Abonament anual, cu reducere 10%' : plan.title} value={money(annual ? plan.pricing.annualTotalLei! : baseMonthly)} />
            {bcrDiscount && <SummaryLine label={annual ? 'BCR: 50 lei × 6 luni, în primul an' : 'BCR: reducere lunară, timp de 6 luni'} value={`−${money(discount)}`} />}
            {annual && <SummaryLine label="Total abonament facturat anual" value={money(annualDue)} emphasized />}
            {selected.map((addon) => <SummaryLine key={addon.key} label={addon.title} value={`+${money(addon.monthlyLei)}/lună`} />)}
            {extraAds > 0 && <SummaryLine label={`Anunțuri suplimentare (${extraAds})`} value={`+${money(extraAds * FLEET_EXTRA_AD_LEI)}/lună`} />}
            <SummaryLine label={annual ? 'Echivalent lunar, cu opțiuni' : 'Total lunar'} value={money(total)} emphasized />
            {annual && <Typography sx={{ ...smallTextSx, mt: 1 }}>Reducerea de 10% se aplică abonamentului. Opțiunile suplimentare se facturează lunar, separat.</Typography>}
            {anonymousAds > 0 && <SummaryLine label={`Plată unică anonimizare (${anonymousAds})`} value={money(anonymousAds * FLEET_ANONYMIZATION_LEI)} />}
          </Box>}
          <Typography sx={{ ...smallTextSx, mt: 2 }}>{plan.footnote}</Typography>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function FleetOption({ title, price, value, onChange }: { title: string; price: string; value: number; onChange: (value: number) => void }) {
  return <Stack direction="row" sx={{ ...optionSx, alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.79rem', fontWeight: 650 }}>{title}</Typography>
      <Typography sx={{ ...smallTextSx, fontSize: '0.7rem' }}>{price}</Typography>
    </Box>
    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
      <IconButton aria-label={`Scade ${title.toLowerCase()}`} size="small" disabled={value === 0} onClick={() => onChange(Math.max(0, value - 1))}><RemoveRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
      <Typography aria-label={title} sx={{ minWidth: 18, textAlign: 'center', fontWeight: 750, fontSize: '0.8rem' }}>{value}</Typography>
      <IconButton aria-label={`Adaugă ${title.toLowerCase()}`} size="small" onClick={() => onChange(value + 1)}><AddRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
    </Stack>
  </Stack>
}

function SummaryLine({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, py: 0.25, alignItems: 'baseline' }}>
    <Typography sx={{ fontSize: emphasized ? '0.85rem' : '0.76rem', fontWeight: emphasized ? 750 : 500, color: TOKENS.ink }}>{label}</Typography>
    <Typography sx={{ fontSize: emphasized ? '1rem' : '0.76rem', fontWeight: 800, color: emphasized ? TOKENS.primaryStrong : TOKENS.ink, whiteSpace: 'nowrap' }}>{value}</Typography>
  </Stack>
}
