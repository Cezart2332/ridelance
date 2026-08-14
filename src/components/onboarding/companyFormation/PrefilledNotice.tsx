import { Typography } from '@mui/material'

import { TOKENS } from '../onboardingTheme'

/**
 * RL-04 — o singură linie deasupra grupului de câmpuri precompletate din buletin.
 *
 * Înainte fiecare input purta propriul badge: pe un formular cu zece câmpuri citite din CI,
 * asta însemna zece semne identice care spuneau același lucru. Informația e „datele astea nu
 * le-ai scris tu, verifică-le” — se spune o dată, nu pe fiecare rând.
 */
export function PrefilledNotice({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <Typography
      sx={{ fontSize: '0.82rem', color: TOKENS.textMuted, lineHeight: 1.5 }}
    >
      Completat automat din buletin. Verifică datele.
    </Typography>
  )
}
