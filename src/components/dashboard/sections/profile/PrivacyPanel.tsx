import { Link as RouterLink } from 'react-router-dom'
import { Paper, Stack, Typography } from '@mui/material'
import GavelRoundedIcon from '@mui/icons-material/GavelRounded'

import { DASHBOARD_TOKENS } from '../../dashboardTheme'

const LINKS = [
  { label: 'Termeni și condiții', to: '/termeni-si-conditii' },
  { label: 'Politica de confidențialitate', to: '/privacy-policy' },
  { label: 'Politica de cookies', to: '/politica-cookies' },
  { label: 'Politica de plăți și abonamente', to: '/politica-plati-abonamente' },
]

/**
 * Confidențialitate și cont, în subsolul Profilului.
 *
 * Exportul de date și ștergerea contului se cer prin suport, nu printr-un buton: ambele au
 * consecințe pe care un click nu le poate lua înapoi, iar fluxul de ștergere are pași stabiliți
 * (abonament activ, obligații fiscale deschise) care nu se rezolvă în frontend.
 */
export function PrivacyPanel() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <GavelRoundedIcon sx={{ fontSize: 20, color: DASHBOARD_TOKENS.primaryStrong }} />
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
          Confidențialitate și cont
        </Typography>
      </Stack>

      <Stack spacing={1.2}>
        {LINKS.map((link) => (
          <Typography
            key={link.to}
            component={RouterLink}
            to={link.to}
            target="_blank"
            sx={{
              color: DASHBOARD_TOKENS.primaryStrong,
              fontWeight: 650,
              fontSize: '0.88rem',
              textDecoration: 'none',
              width: 'fit-content',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {link.label}
          </Typography>
        ))}
      </Stack>

      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.84rem', mt: 2.5, lineHeight: 1.6 }}>
        Pentru exportul datelor tale sau pentru ștergerea contului, scrie-ne în{' '}
        <Typography
          component={RouterLink}
          to="/app/dashboard/suport"
          sx={{ color: DASHBOARD_TOKENS.primaryStrong, fontWeight: 650, textDecoration: 'none', fontSize: 'inherit' }}
        >
          Suport
        </Typography>
        . Ștergerea contului urmează fluxul stabilit — verificăm întâi abonamentul activ și
        obligațiile fiscale deschise.
      </Typography>
    </Paper>
  )
}
