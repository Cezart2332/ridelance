import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Button, Stack, Typography } from '@mui/material'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'

import { TOKENS } from '../constants/tokens'
import { ROUTES } from '../constants/routes'
import { authService } from '../services/auth.service'
import type { NativeUnavailableReason } from './platform'

/**
 * Ce vede în aplicație un cont care n-are încă dashboard.
 *
 * Aplicația nu face onboarding și nu vinde abonamente, deci aici nu există buton spre ele — nici
 * link spre site pentru plată, pe care magazinele de aplicații nu-l acceptă. Omul află de ce nu
 * vede nimic, poate verifica din nou după ce contul se activează sau se poate deconecta.
 */
const MESSAGES: Record<NativeUnavailableReason, { title: string; text: string }> = {
  onboarding: {
    title: 'Contul tău e încă în înrolare',
    text: 'Aplicația arată dashboardul PFA după ce înrolarea e finalizată și validată de echipa RIDElance.',
  },
  srl: {
    title: 'Contul firmei nu e încă configurat',
    text: 'Aplicația arată dashboardul SRL după ce configurarea contului firmei e finalizată.',
  },
  abonament: {
    title: 'Contul tău nu este activ',
    text: 'Dashboardul nu este disponibil momentan pentru acest cont. Pentru detalii, scrie-ne la suport.',
  },
  rol: {
    title: 'Aplicația e pentru PFA și SRL',
    text: 'Conturile de administrare și de contabil se folosesc din platforma web RIDElance.',
  },
  eroare: {
    title: 'Nu am putut verifica contul',
    text: 'Verifică conexiunea la internet și încearcă din nou.',
  },
}

export function NativeUnavailablePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const reason = (params.get('motiv') as NativeUnavailableReason | null) ?? 'onboarding'
  const message = MESSAGES[reason] ?? MESSAGES.onboarding

  const logout = async () => {
    await authService.logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        px: 3,
        bgcolor: TOKENS.surface,
      }}
    >
      <Stack spacing={2} sx={{ maxWidth: 420, textAlign: 'center', alignItems: 'center' }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            display: 'grid',
            placeItems: 'center',
            borderRadius: `${TOKENS.radius.md}px`,
            bgcolor: TOKENS.paper,
            border: `1px solid ${TOKENS.border}`,
            color: TOKENS.primaryStrong,
          }}
        >
          <HourglassTopRoundedIcon />
        </Box>
        <Typography component="h1" sx={{ fontSize: '1.3rem', fontWeight: 850, color: TOKENS.ink }}>
          {message.title}
        </Typography>
        <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.6 }}>{message.text}</Typography>
        <Stack spacing={1} sx={{ width: '100%', pt: 1 }}>
          <Button variant="contained" size="large" disableElevation onClick={() => navigate('/app', { replace: true })}>
            Verifică din nou
          </Button>
          <Button variant="text" onClick={() => void logout()} sx={{ color: TOKENS.textMuted }}>
            Deconectare
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
