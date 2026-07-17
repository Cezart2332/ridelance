import { Box, Typography } from '@mui/material'
import { TOKENS } from '../../../constants/tokens'
import { InsuranceLinksGrid } from '../../insurance/InsuranceLinksGrid'

export function InsuranceTab() {
  return (
    <Box sx={{ maxWidth: 1060, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: TOKENS.ink, mb: 1 }}>
        Asigurări
      </Typography>
      <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.95rem', mb: 3, lineHeight: 1.7 }}>
        Prin partenerul nostru asigurari.ro poți obține rapid oferte pentru toate tipurile de
        asigurări de care ai nevoie. Alege categoria potrivită, iar oferta se deschide direct pe
        asigurari.ro.
      </Typography>
      <InsuranceLinksGrid compact />
    </Box>
  )
}
