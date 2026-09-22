import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'

import type { FiscalProfileStatus } from '../../services/fiscalProfile.service'

/**
 * Locul estimărilor de taxe cât timp profilul fiscal nu e confirmat (spec §6.2). Înlocuiește
 * complet cardul „Cât să pui deoparte” și secțiunea „Taxe estimate”: fără sume, fără „—”, fără
 * componente, fără texte despre aprobare.
 */
export function FiscalProfileInviteCard({
  status,
  onStart,
}: {
  status: FiscalProfileStatus
  onStart?: () => void
}) {
  return (
    <Box
      component="section"
      aria-labelledby="fp-invite-title"
      data-testid="fiscal-profile-invite"
      sx={(theme) => ({
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        p: { xs: 2, sm: 3 },
        height: '100%',
      })}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
        <Box
          aria-hidden
          sx={(theme) => ({
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
          })}
        >
          <AccountBalanceRoundedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id="fp-invite-title" variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
            Activează estimările de taxe
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Completează profilul fiscal ca să vezi cât să pui deoparte pentru taxe. Durează câteva minute.
          </Typography>
        </Box>
        {onStart && (
          <Button variant="contained" onClick={onStart} sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}>
            {status === 'DRAFT' ? 'Continuă completarea' : 'Completează profilul'}
          </Button>
        )}
      </Stack>
    </Box>
  )
}
