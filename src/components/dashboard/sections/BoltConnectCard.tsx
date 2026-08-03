import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { StatusChip } from '../ui'
import { boltService, type BoltIntegrationDto } from '../../../services/bolt.service'
import { BoltIntegrationTab } from './BoltIntegrationTab'

/**
 * Singurul modul de platformă rămas în profil: conectarea contului Bolt. Datele rezultate
 * se văd pe „Acasă", iar rapoartele Uber se încarcă din Admin, nu de aici.
 */
export function BoltConnectCard() {
  const [integration, setIntegration] = useState<BoltIntegrationDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = () =>
    boltService
      .getIntegration()
      .then(setIntegration)
      .catch((cause) => console.error(cause))
      .finally(() => setLoading(false))

  useEffect(() => {
    void load()
  }, [])

  const isConnected = integration?.isConnected ?? false
  const isConfigured = integration !== null

  const statusText = !isConfigured
    ? 'Contul Bolt nu este conectat. Conectează-l ca să apară automat cursele și încasările.'
    : isConnected
      ? integration?.lastFetchedAtUtc
        ? `Ultima sincronizare: ${new Date(integration.lastFetchedAtUtc).toLocaleString('ro-RO')}`
        : 'Conectat. Prima sincronizare urmează.'
      : integration?.errorMessage || 'Conexiunea Bolt necesită reautentificare.'

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.6} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                display: 'grid',
                placeItems: 'center',
                color: DASHBOARD_TOKENS.accent,
                bgcolor: alpha(DASHBOARD_TOKENS.accent, 0.1),
              }}
            >
              <BoltRoundedIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 850, fontSize: '1rem' }}>
                  Cont Bolt
                </Typography>
                {!loading && (
                  <StatusChip
                    size="sm"
                    label={!isConfigured ? 'Neconectat' : isConnected ? 'Conectat' : 'Reconectează'}
                    tone={isConnected ? 'active' : 'neutral'}
                  />
                )}
              </Stack>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mt: 0.3 }}>
                {loading ? 'Se verifică starea conexiunii…' : statusText}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant={isConnected ? 'outlined' : 'contained'}
            disableElevation
            onClick={() => setDialogOpen(true)}
            sx={{
              flexShrink: 0,
              borderRadius: DASHBOARD_TOKENS.radius.md,
              fontWeight: 800,
              textTransform: 'none',
              ...(isConnected
                ? {}
                : { bgcolor: DASHBOARD_TOKENS.primary, '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong } }),
            }}
          >
            {isConfigured ? 'Gestionează conexiunea' : 'Conectează Bolt'}
          </Button>
        </Stack>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: DASHBOARD_TOKENS.radius.xl,
              overflow: 'hidden',
              bgcolor: DASHBOARD_TOKENS.paper,
            },
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 950, fontSize: '1.15rem' }}>
              Conectare Bolt
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem', mt: 0.35 }}>
              Conectează contul pentru încasări și curse sincronizate automat.
            </Typography>
          </Box>
          <IconButton
            aria-label="Închide"
            onClick={() => setDialogOpen(false)}
            sx={{
              flexShrink: 0,
              color: DASHBOARD_TOKENS.textMuted,
              bgcolor: DASHBOARD_TOKENS.surface,
              '&:hover': { bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.06) },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: DASHBOARD_TOKENS.surface, overflowX: 'hidden' }}>
          <BoltIntegrationTab
            embedded
            onConnected={() => {
              setDialogOpen(false)
              setLoading(true)
              void load()
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
