import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import eldriveLogo from '../../../../assets/partners/eldrive.png'
import oblioLogo from '../../../../assets/partners/oblio.png'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../../dashboardTheme'
import { PageHeader, Panel, StatusChip } from '../../ui'
import type { StatusTone } from '../../ui'
import {
  connectionsService,
  type Integration,
  type IntegrationProvider,
  type IntegrationStatus,
} from '../../../../services/connections.service'
import { usePendingBackend } from '../pendingBackendContext'

/**
 * Conexiunile SRL (spec §3.4): Oblio, bancă și eldrive, ca grid de carduri.
 *
 * Restul integrărilor din PFA (Bolt, Uber) nu apar aici. Nu sunt șterse din cod — pur și simplu
 * nu sunt în configul de mai jos, care e locul unde se adaugă înapoi când vor fi cerute.
 */

/** Logo-urile providerilor, unde există. Cardul le arată în locul numelui scris. */
const PROVIDER_LOGO: Partial<Record<IntegrationProvider, string>> = {
  Oblio: oblioLogo,
  Eldrive: eldriveLogo,
}

const PROVIDER_COPY: Record<
  IntegrationProvider,
  { name: string; purpose: string; connectLabel: string; fields: { name: string; label: string; type?: string }[] }
> = {
  Oblio: {
    name: 'Oblio',
    purpose: 'Facturile emise prin RIDElance ajung direct în contabilitatea ta.',
    connectLabel: 'Conectează Oblio',
    fields: [
      { name: 'email', label: 'Email cont Oblio', type: 'email' },
      { name: 'apiKey', label: 'Cheie API' },
    ],
  },
  Bank: {
    name: 'Bancă',
    purpose: 'Tranzacțiile se citesc automat, fără extras încărcat manual.',
    connectLabel: 'Conectează banca',
    fields: [{ name: 'iban', label: 'IBAN' }],
  },
  Eldrive: {
    name: 'eldrive',
    purpose: 'Sesiunile de încărcare intră în costurile flotei, iar stațiile apar pe hartă.',
    connectLabel: 'Conectează eldrive',
    fields: [
      { name: 'email', label: 'Email cont eldrive', type: 'email' },
      { name: 'cardId', label: 'Card / RFID' },
    ],
  },
}

/** Cele patru stări din §3.4, traduse în cele trei tonuri pe care le are `StatusChip`. */
const STATUS_PRESENTATION: Record<IntegrationStatus, { label: string; tone: StatusTone }> = {
  disconnected: { label: 'Neconectat', tone: 'neutral' },
  connected: { label: 'Conectat', tone: 'active' },
  expiring: { label: 'Expiră curând', tone: 'warning' },
  error: { label: 'Eroare', tone: 'error' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string | null): string {
  if (!iso) return 'niciodată'
  return new Date(iso).toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SrlConnectionsPage() {
  const [data, setData] = useState<Integration[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogFor, setDialogFor] = useState<IntegrationProvider | null>(null)

  useEffect(() => {
    let cancelled = false

    connectionsService
      .getAll()
      .then((integrations) => {
        if (!cancelled) setData(integrations)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca integrările.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          <Skeleton variant="rounded" height={230} />
          <Skeleton variant="rounded" height={230} />
          <Skeleton variant="rounded" height={230} />
        </Box>
      </Stack>
    )
  }

  if (error || !data) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error ?? 'Nu am putut încărca integrările.'}
        </Alert>
      </Box>
    )
  }

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Conexiuni"
        subtitle="Serviciile externe din care RIDElance citește sau către care trimite date."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {data.map((integration) => (
          <IntegrationCard
            key={integration.provider}
            integration={integration}
            onConnect={() => setDialogFor(integration.provider)}
          />
        ))}
      </Box>

      <ConnectDialog provider={dialogFor} onClose={() => setDialogFor(null)} />
    </Stack>
  )
}

function IntegrationCard({ integration, onConnect }: { integration: Integration; onConnect: () => void }) {
  const notifyPending = usePendingBackend()
  const copy = PROVIDER_COPY[integration.provider]
  const presentation = STATUS_PRESENTATION[integration.status]
  const isConnected = integration.status !== 'disconnected'

  const logo = PROVIDER_LOGO[integration.provider]

  return (
    // `fill`: fără el corpul panoului nu e coloană flexibilă, iar spațiatorul de dinaintea
    // butoanelor le împingea în afara cardului.
    <Panel fill action={<StatusChip label={presentation.label} tone={presentation.tone} size="sm" outlined />}>
      {/* Identitatea providerului: logo unde există, altfel numele scris. Nu amândouă — ar fi
          aceeași informație de două ori pe un card mic. */}
      {logo ? (
        <Box
          component="img"
          src={logo}
          alt={copy.name}
          sx={{ height: 26, width: 'auto', maxWidth: 120, objectFit: 'contain', display: 'block', mb: 1 }}
        />
      ) : (
        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: DASHBOARD_TOKENS.ink }}>
          {copy.name}
        </Typography>
      )}

      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem', mb: 1.8, lineHeight: 1.5 }}>
        {copy.purpose}
      </Typography>
      {/* `flex: 1`, nu `height: 100%`: are frați deasupra (logo, descriere), iar 100% din corp
          ar fi însemnat înălțimea întregului card pe lângă ei. */}
      <Stack spacing={1.6} sx={{ flex: 1, minHeight: 0 }}>
        {integration.errorMessage && (
          <Typography sx={{ color: DASHBOARD_TOKENS.stateError, fontSize: '0.82rem', fontWeight: 600 }}>
            {integration.errorMessage}
          </Typography>
        )}

        {isConnected && (
          <Stack spacing={0.9}>
            {integration.details.map((detail) => (
              <DetailRow key={detail.label} label={detail.label} value={detail.value} />
            ))}
            {integration.expiresAtUtc && (
              <DetailRow label="Consimțământ până la" value={formatDate(integration.expiresAtUtc)} />
            )}
            <DetailRow label="Ultima sincronizare" value={formatDateTime(integration.lastSyncAtUtc)} />
          </Stack>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {!integration.available && (
          <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>
            Integrarea nu e disponibilă încă pentru conturile SRL.
          </Typography>
        )}

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          {!isConnected && integration.available && (
            <Button
              variant="contained"
              disableElevation
              onClick={onConnect}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              {copy.connectLabel}
            </Button>
          )}

          {integration.status === 'expiring' && (
            <Button
              variant="contained"
              disableElevation
              onClick={() => notifyPending('Reînnoirea consimțământului')}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              Reînnoiește consimțământul
            </Button>
          )}

          {isConnected && integration.provider === 'Oblio' && (
            <Button
              variant="outlined"
              onClick={() => notifyPending('Sincronizarea')}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              Sincronizează acum
            </Button>
          )}

          {isConnected && (
            <Button
              onClick={() => notifyPending('Deconectarea')}
              sx={{ textTransform: 'none', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}
            >
              Deconectează
            </Button>
          )}
        </Stack>
      </Stack>
    </Panel>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: '0.82rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink, textAlign: 'right', minWidth: 0 }}
      >
        {value}
      </Typography>
    </Stack>
  )
}

function ConnectDialog({ provider, onClose }: { provider: IntegrationProvider | null; onClose: () => void }) {
  const notifyPending = usePendingBackend()
  const copy = provider ? PROVIDER_COPY[provider] : null

  return (
    <Dialog open={provider !== null} onClose={onClose} fullWidth maxWidth="xs">
      {copy && (
        <>
          <DialogTitle sx={{ fontWeight: 800 }}>{copy.connectLabel}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted }}>
                {copy.purpose}
              </Typography>
              {copy.fields.map((field) => (
                <TextField
                  key={field.name}
                  label={field.label}
                  type={field.type ?? 'text'}
                  fullWidth
                  size="small"
                  sx={dashboardInputSx}
                />
              ))}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
              Renunță
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                notifyPending('Conectarea')
                onClose()
              }}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              Conectează
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}
