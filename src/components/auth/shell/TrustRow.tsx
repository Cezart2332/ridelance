import { Stack, Typography } from '@mui/material'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import PublicRoundedIcon from '@mui/icons-material/PublicRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import { AUTH_COLORS, AUTH_DENSITY } from './authShellSx'

const ITEMS = [
  { Icon: LockRoundedIcon, label: 'Conexiune securizată' },
  { Icon: PublicRoundedIcon, label: 'Date criptate' },
  { Icon: VerifiedUserRoundedIcon, label: 'Acces protejat' },
]

/** Rândul de sub buton, cu linia de separare deasupra. */
export function TrustRow() {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        ...AUTH_DENSITY.ctaToFooter,
        display: 'var(--auth-trust-display, flex)',
        pt: 'var(--auth-footer-padding, 20px)',
        borderTop: `1px solid ${AUTH_COLORS.border}`,
        flexWrap: 'wrap',
        justifyContent: 'center',
        rowGap: 1,
      }}
    >
      {ITEMS.map(({ Icon, label }) => (
        <Stack key={label} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Icon sx={{ fontSize: 15, color: AUTH_COLORS.textSubtle }} />
          <Typography variant="caption" sx={{ color: AUTH_COLORS.textSubtle }}>
            {label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}
