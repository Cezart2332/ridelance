import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { formatDateTime } from '../../format'
import { ErrorBlock, LoadingBlock } from '../components'
import { errorMessage, useApi } from '../useApi'
import { Panel, StatusPill } from './parts'
import { HAIRLINE, INK, MUTED, type Cell } from './status'

const DARK = { bgcolor: 'var(--rl-primary)', color: 'var(--rl-primary-fg)', '&:hover': { bgcolor: 'var(--rl-fg-soft)' } }
const STALE_DAYS = 7

/** Aplicația desktop RIDElance SPV, pentru admin: ultima sincronizare și cheile ei. */
export function SpvAppCard() {
  const state = useApi(() => accountingApi.spv.overview(), [])
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Momentul deschiderii: „nesincronizat de 7 zile” nu trebuie să se schimbe la fiecare randare.
  const [openedAt] = useState(() => Date.now())

  if (state.error && !state.data) return <ErrorBlock message={state.error} onRetry={state.reload} />
  if (!state.data) return <LoadingBlock />
  const { keys, lastSuccessAtUtc, lastError, needsAttention } = state.data

  const stale = !lastSuccessAtUtc || openedAt - new Date(lastSuccessAtUtc).getTime() > STALE_DAYS * 86_400_000
  const cell: Cell = keys.length === 0 ? { tone: 'gray', label: 'Neconfigurată' } : stale ? { tone: 'red', label: 'Nesincronizat' } : { tone: 'green', label: 'Activă' }

  const revoke = async (keyId: string) => {
    setBusy(keyId)
    setError(null)
    try {
      await accountingApi.spv.revokeKey(keyId)
      state.reload()
    } catch (revokeError) {
      setError(errorMessage(revokeError))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Panel sx={{ px: 2.5, py: 2 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: INK }}>
          Aplicația SPV
        </Typography>
        <StatusPill cell={cell} />
      </Stack>
      <Stack direction="row" sx={{ justifyContent: 'space-between', py: 1, borderTop: `1px solid ${HAIRLINE}` }}>
        <Typography sx={{ fontSize: 14, color: MUTED }}>Ultima sincronizare</Typography>
        <Typography sx={{ fontSize: 14 }}>{lastSuccessAtUtc ? formatDateTime(lastSuccessAtUtc) : '—'}</Typography>
      </Stack>
      {needsAttention > 0 && (
        <Stack direction="row" sx={{ justifyContent: 'space-between', py: 1, borderTop: `1px solid ${HAIRLINE}` }}>
          <Typography sx={{ fontSize: 14, color: MUTED }}>Mesaje de verificat</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{needsAttention}</Typography>
        </Stack>
      )}
      {lastError && <Alert severity="warning" sx={{ mt: 1 }}>{lastError}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}

      {keys.map((key) => (
        <Stack key={key.id} direction="row" sx={{ alignItems: 'center', gap: 2, py: 1, borderTop: `1px solid ${HAIRLINE}` }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{key.name}</Typography>
            <Typography sx={{ fontSize: 13, color: MUTED }}>
              {key.prefix}… · {key.lastUsedAtUtc ? formatDateTime(key.lastUsedAtUtc) : 'nefolosită'}
            </Typography>
          </Box>
          <Button size="small" color="error" disabled={busy !== null} onClick={() => void revoke(key.id)}>
            Revocă
          </Button>
        </Stack>
      ))}

      <Box sx={{ pt: 1.5 }}>
        <Button variant="outlined" onClick={() => setCreating(true)}>
          Cheie nouă
        </Button>
      </Box>

      {creating && (
        <NewKeyDialog
          onClose={() => {
            setCreating(false)
            state.reload()
          }}
        />
      )}
    </Panel>
  )
}

function NewKeyDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      setSecret((await accountingApi.spv.createKey(name.trim())).secret)
    } catch (createError) {
      setError(errorMessage(createError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cheie nouă</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {secret ? (
            <>
              <Alert severity="info">Cheia apare o singură dată. Copiaz-o în aplicația RIDElance SPV.</Alert>
              <TextField value={secret} fullWidth slotProps={{ htmlInput: { readOnly: true, 'aria-label': 'Cheia' } }} />
            </>
          ) : (
            <TextField label="Nume" placeholder="Laptop birou" value={name} onChange={(event) => setName(event.target.value)} fullWidth autoFocus />
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        {secret ? (
          <>
            <Button
              onClick={() => {
                void navigator.clipboard.writeText(secret).then(() => setCopied(true))
              }}
            >
              {copied ? 'Copiată' : 'Copiază'}
            </Button>
            <Button variant="contained" onClick={onClose} sx={DARK}>
              Gata
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} disabled={busy}>
              Renunță
            </Button>
            <Button variant="contained" onClick={() => void create()} disabled={busy || !name.trim()} sx={DARK}>
              {busy ? 'Se creează…' : 'Creează'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
