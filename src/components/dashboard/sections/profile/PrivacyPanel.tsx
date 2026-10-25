import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Button, Paper, Stack, Typography } from '@mui/material'
import GavelRoundedIcon from '@mui/icons-material/GavelRounded'

import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { DeleteAccountDialog } from '../../../common/DeleteAccountDialog'

const LINKS = [
  { label: 'Termeni și condiții', to: '/termeni-si-conditii' },
  { label: 'Politica de confidențialitate', to: '/privacy-policy' },
  { label: 'Politica de cookies', to: '/politica-cookies' },
  { label: 'Politica de plăți și abonamente', to: '/politica-plati-abonamente' },
]

/**
 * Confidențialitate și cont, în subsolul Profilului.
 *
 * Ștergerea contului se face de aici (`DeleteAccountDialog`); exportul datelor se cere în
 * continuare prin Suport.
 */
export function PrivacyPanel() {
  const [deleting, setDeleting] = useState(false)

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: `${DASHBOARD_TOKENS.radius.lg}px`,
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
        Pentru exportul datelor tale, scrie-ne în{' '}
        <Typography
          component={RouterLink}
          to="/app/dashboard/suport"
          sx={{ color: DASHBOARD_TOKENS.primaryStrong, fontWeight: 650, textDecoration: 'none', fontSize: 'inherit' }}
        >
          Suport
        </Typography>
        .
      </Typography>

      <Button
        variant="outlined"
        color="error"
        onClick={() => setDeleting(true)}
        sx={{ mt: 2.5, textTransform: 'none', fontWeight: 750, borderRadius: `${DASHBOARD_TOKENS.radius.full}px`, px: 3 }}
      >
        Șterge contul
      </Button>

      <DeleteAccountDialog open={deleting} onClose={() => setDeleting(false)} />
    </Paper>
  )
}
