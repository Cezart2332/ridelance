import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { PANEL_COMPAT_TOKENS as TOKENS } from '../../../panel/tokens'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { eldriveService, type EldriveInviteAdmin } from '../../../../services/eldrive.service'
import { fade } from '../../../panel/tokens'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: fade(color, 0.1), color, border: `1px solid ${fade(color, 0.25)}` }}
    />
  )
}

/**
 * Evidența Eldrive: cine e în contul de partener RIDElance. Invitațiile active ale clienților
 * fără abonament plătit stau primele — pe ele trebuie apăsat „Șterge”.
 */
export function EldriveAdminView() {
  const [invites, setInvites] = useState<EldriveInviteAdmin[] | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<EldriveInviteAdmin | null>(null)
  const [removing, setRemoving] = useState(false)

  const load = useCallback(() => {
    eldriveService.listInvites()
      .then((items) => { setInvites(items); setError('') })
      .catch((err) => setError(getErrorMessage(err, 'Nu am putut încărca evidența Eldrive.')))
  }, [])

  useEffect(() => { load() }, [load])

  const remove = async () => {
    if (!pending) return
    setRemoving(true)
    try {
      await eldriveService.removeInvite(pending.id)
      setPending(null)
      load()
    } catch (err) {
      setError(getErrorMessage(err, 'Ștergerea din Eldrive nu a reușit.'))
      setPending(null)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: TOKENS.ink }}>Eldrive</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper elevation={0} sx={{ borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
        {invites === null ? (
          <Stack sx={{ alignItems: 'center', py: 5 }}>
            <CircularProgress size={26} />
          </Stack>
        ) : invites.length === 0 ? (
          <Typography sx={{ p: 3, color: TOKENS.textMuted }}>Niciun client conectat la Eldrive.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell>Email Eldrive</TableCell>
                  <TableCell>ID invitație</TableCell>
                  <TableCell>Abonament</TableCell>
                  <TableCell>Conectat din</TableCell>
                  <TableCell>Eldrive</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {invites.map((invite) => {
                  const active = invite.removedAtUtc === null
                  return (
                    <TableRow key={invite.id} sx={{ opacity: active ? 1 : 0.55 }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{invite.clientName || '—'}</Typography>
                        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.75rem' }}>{invite.accountEmail}</Typography>
                      </TableCell>
                      <TableCell>{invite.eldriveEmail}</TableCell>
                      <TableCell>{invite.eldriveInviteId}</TableCell>
                      <TableCell>
                        {invite.subscriptionActive
                          ? <Tag label="Activ" color="var(--rl-green-text)" />
                          : <Tag label={invite.subscriptionStatus === 'Cancelled' ? 'Anulat' : 'Inactiv'} color="var(--rl-red-text)" />}
                      </TableCell>
                      <TableCell>{formatDate(invite.createdAtUtc)}</TableCell>
                      <TableCell>
                        {active
                          ? <Tag label="Activ" color="var(--rl-green-text)" />
                          : <Tag label={`Șters ${formatDate(invite.removedAtUtc!)}`} color="var(--rl-text-muted)" />}
                      </TableCell>
                      <TableCell align="right">
                        {active && (
                          <Button size="small" color="error" onClick={() => setPending(invite)}>
                            Șterge
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={pending !== null} onClose={() => !removing && setPending(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Scoți clientul din Eldrive?</DialogTitle>
        <DialogContent>
          <Typography>{pending?.clientName} · {pending?.eldriveEmail}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)} disabled={removing}>Renunță</Button>
          <Button color="error" variant="contained" onClick={remove} disabled={removing}>
            {removing ? <CircularProgress size={18} color="inherit" /> : 'Șterge'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
