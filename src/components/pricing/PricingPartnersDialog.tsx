import { Box, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { TOKENS } from '../../constants/tokens'
import { getPartnerBenefit } from '../../data/benefits'
import type { Audience } from '../../data/plans'

const benefits = [
  { slug: 'bcr', text: '50 lei/lună reducere la abonament timp de 6 luni, pentru un cont eligibil deschis prin RIDElance.', audience: ['pfa', 'srl'] },
  { slug: 'benefit-edenred', text: 'Acces la platforma Benefit, cu reduceri și oferte pentru cumpărături, servicii, timp liber și nevoi de zi cu zi.', audience: ['pfa'] },
  { slug: 'mol', text: 'Reduceri la carburant și beneficii la spălătoriile participante, în campaniile dedicate RIDElance.', audience: ['pfa', 'srl'] },
  { slug: 'eldrive', text: 'Reducere de 0,80 lei/kWh la stațiile Eldrive incluse în promoția RIDElance.', audience: ['pfa'] },
  { slug: 'eldrive', text: 'Beneficii pentru încărcarea vehiculelor electrice în stațiile incluse în promoțiile active.', audience: ['srl'] },
  { slug: 'consulto', text: 'Sediu profesional pentru PFA la 349 lei/an, 20% reducere la înființarea unui SRL și 85% reducere pentru operațiunile eligibile de modificare la ONRC ale acelui SRL.', audience: ['pfa'] },
  { slug: 'constalaris', text: 'Casă de marcat de la 550 lei, cu serviciile incluse în primul an, apoi 250 lei/an.', audience: ['pfa'] },
  { slug: 'asigurari-ro', text: 'Acces online la oferte de asigurare, direct prin ecosistemul RIDElance, pentru a compara și alege oferta potrivită.', audience: ['pfa', 'srl'] },
  { slug: 'oblio', text: 'Integrare pentru facturare și fluxuri administrative, conform condițiilor campaniei active.', audience: ['srl'] },
]

export function PricingPartnersDialog({ audience, open, onClose }: { audience: Audience; open: boolean; onClose: () => void }) {
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="pricing-partners-title" slotProps={{ paper: { sx: { borderRadius: `${TOKENS.radius.xl}px` } } }}>
    <DialogTitle id="pricing-partners-title" sx={{ pr: 7, fontWeight: 800, color: TOKENS.ink }}>
      Beneficii prin partenerii oficiali
      <IconButton aria-label="Închide beneficiile" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseRoundedIcon /></IconButton>
    </DialogTitle>
    <DialogContent>
      <Stack spacing={1.5}>
        {benefits.filter((benefit) => benefit.audience.includes(audience)).map((benefit) => {
          const partner = getPartnerBenefit(benefit.slug)
          return <Box key={benefit.slug} sx={{ p: 2, border: `1px solid ${TOKENS.border}`, borderRadius: `${TOKENS.radius.lg}px`, backgroundColor: TOKENS.surface }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1 }}>
              {partner && <Box component="img" src={partner.image} alt="" sx={{ width: 42, height: 26, objectFit: 'contain' }} />}
              <Typography sx={{ fontWeight: 800, color: TOKENS.ink }}>{partner?.name}</Typography>
            </Stack>
            <Typography sx={{ fontSize: '0.87rem', lineHeight: 1.65, color: TOKENS.textMuted }}>{benefit.text}</Typography>
          </Box>
        })}
      </Stack>
      <Typography sx={{ mt: 2, fontSize: '0.76rem', lineHeight: 1.6, color: TOKENS.textMuted }}>Beneficiile, valorile și condițiile comerciale pot varia în funcție de eligibilitate și de campaniile active ale partenerilor.</Typography>
    </DialogContent>
  </Dialog>
}
