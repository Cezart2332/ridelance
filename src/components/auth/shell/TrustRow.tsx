import { Stack, Typography } from '@mui/material'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import PublicRoundedIcon from '@mui/icons-material/PublicRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import { SHORT } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'

const ITEMS = [
  { Icon: LockRoundedIcon, label: 'Conexiune securizată' },
  { Icon: PublicRoundedIcon, label: 'Date criptate' },
  { Icon: VerifiedUserRoundedIcon, label: 'Acces protejat' },
]

/**
 * O singură apariție, sub CTA. Dacă bugetul vertical se epuizează, rândul ăsta se taie primul —
 * de aici `display: none` sub 640px înălțime, în loc de scroll.
 */
export function TrustRow() {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        mt: 3,
        pt: 2.25,
        borderTop: `1px solid ${TOKENS.border}`,
        flexWrap: 'wrap',
        justifyContent: 'center',
        rowGap: 1,
        [SHORT]: { display: 'none' },
      }}
    >
      {ITEMS.map(({ Icon, label }) => (
        <Stack key={label} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Icon sx={{ fontSize: 16, color: TOKENS.textMuted }} />
          <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
            {label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}
