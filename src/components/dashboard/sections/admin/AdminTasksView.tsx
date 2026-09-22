import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'

import { fiscalProfileService, type AdminCallTask } from '../../../../services/fiscalProfile.service'
import { FiscalProfileStatusChip } from '../../../../shared/fiscal-profile'
import { getErrorMessage } from '../../../../utils/errorHandler'

const STATE_LABEL: Record<AdminCallTask['state'], string> = {
  OPEN: 'De sunat',
  DONE: 'Efectuat',
  RESCHEDULED: 'Reprogramat',
  RESOLVED_BY_COMPLETION: 'Rezolvat de PFA',
}

type Outcome = { task: AdminCallTask; state: 'DONE' | 'RESCHEDULED' }

/**
 * ADMIN → Sarcini → Profil fiscal. Apelurile create la ziua 30 pentru PFA-urile fără profil
 * fiscal completat. Dacă PFA-ul completează înainte, sarcina se închide singură.
 */
export function AdminTasksView({ onOpenPfa }: { onOpenPfa: (userId: string) => void }) {
  const [tasks, setTasks] = useState<AdminCallTask[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [includeClosed, setIncludeClosed] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [outcomeText, setOutcomeText] = useState('')
  const [rescheduleTo, setRescheduleTo] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fiscalProfileService
      .tasks(includeClosed)
      .then((items) => {
        if (cancelled) return
        setTasks(items)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(getErrorMessage(err, 'Nu am putut încărca sarcinile.'))
        setTasks([])
      })
    return () => {
      cancelled = true
    }
  }, [includeClosed])

  const update = async (task: AdminCallTask, body: Parameters<typeof fiscalProfileService.updateTask>[1]) => {
    setBusy(true)
    try {
      const updated = await fiscalProfileService.updateTask(task.id, body)
      setTasks((current) => current?.map((t) => (t.id === updated.id ? updated : t)) ?? null)
      return true
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut actualiza sarcina.'))
      return false
    } finally {
      setBusy(false)
    }
  }

  const saveOutcome = async () => {
    if (!outcome) return
    const ok = await update(outcome.task, {
      state: outcome.state,
      callOutcome: outcomeText,
      rescheduledToUtc: outcome.state === 'RESCHEDULED' && rescheduleTo ? new Date(rescheduleTo).toISOString() : null,
    })
    if (ok) setOutcome(null)
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">Sarcini</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Profil fiscal: PFA-uri care nu și-au completat profilul la 30 de zile de la acces. Sună-i și notează rezultatul.
        </Typography>
      </Box>

      <FormControlLabel
        control={<Switch checked={includeClosed} onChange={(e) => setIncludeClosed(e.target.checked)} />}
        label="Arată și sarcinile închise"
      />

      {error && <Alert severity="error">{error}</Alert>}
      {tasks === null && (
        <Stack sx={{ alignItems: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      )}
      {tasks?.length === 0 && !error && (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Nicio sarcină deschisă.
        </Typography>
      )}

      {!!tasks?.length && (
        <Paper sx={{ overflow: 'hidden' }}>
          {tasks.map((task) => {
            const closed = task.state === 'DONE' || task.state === 'RESOLVED_BY_COMPLETION'
            return (
              <Box
                key={task.id}
                component="article"
                data-testid="admin-task"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: 'minmax(220px, 1.4fr) minmax(180px, 1fr) auto' },
                  gap: 2,
                  p: 2.5,
                  alignItems: 'center',
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 0 },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                    {task.pfaName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                    {[task.phone, task.email].filter(Boolean).join(' · ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Profil incomplet la 30 de zile · creată {new Date(task.createdAtUtc).toLocaleDateString('ro-RO')}
                  </Typography>
                </Box>
                <Stack spacing={0.75} sx={{ alignItems: 'flex-start' }}>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={STATE_LABEL[task.state]} color={closed ? 'default' : 'primary'} />
                    <FiscalProfileStatusChip status={task.profileStatus} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {task.ownerName ? `Preluată de ${task.ownerName}` : 'Nepreluată'}
                    {task.rescheduledToUtc &&
                      ` · reapel ${new Date(task.rescheduledToUtc).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })}`}
                  </Typography>
                  {task.callOutcome && (
                    <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                      {task.callOutcome}
                    </Typography>
                  )}
                </Stack>
                <Stack direction={{ xs: 'row', lg: 'column' }} sx={{ gap: 0.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <Button size="small" variant="outlined" onClick={() => onOpenPfa(task.pfaUserId)}>
                    Deschide dosarul
                  </Button>
                  {!closed && (
                    <>
                      {!task.ownerUserId && (
                        <Button size="small" disabled={busy} onClick={() => void update(task, { assignToMe: true })}>
                          Preia
                        </Button>
                      )}
                      <Button
                        size="small"
                        disabled={busy}
                        onClick={() => {
                          setOutcome({ task, state: 'DONE' })
                          setOutcomeText(task.callOutcome ?? '')
                        }}
                      >
                        Apel efectuat
                      </Button>
                      <Button
                        size="small"
                        disabled={busy}
                        onClick={() => {
                          setOutcome({ task, state: 'RESCHEDULED' })
                          setOutcomeText(task.callOutcome ?? '')
                          setRescheduleTo('')
                        }}
                      >
                        Reprogramează
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>
            )
          })}
        </Paper>
      )}

      <Dialog open={outcome !== null} onClose={() => setOutcome(null)} fullWidth maxWidth="sm">
        <DialogTitle>{outcome?.state === 'DONE' ? 'Rezultatul apelului' : 'Reprogramează apelul'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {outcome?.state === 'RESCHEDULED' && (
              <TextField
                type="datetime-local"
                label="Reapel la"
                value={rescheduleTo}
                onChange={(e) => setRescheduleTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
            )}
            <TextField
              label="Rezultatul apelului"
              multiline
              minRows={3}
              value={outcomeText}
              onChange={(e) => setOutcomeText(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 2000 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOutcome(null)}>Renunță</Button>
          <Button
            variant="contained"
            disabled={busy || (outcome?.state === 'RESCHEDULED' && !rescheduleTo)}
            onClick={() => void saveOutcome()}
          >
            Salvează
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
