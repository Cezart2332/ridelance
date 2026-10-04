import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { SpvMessage } from '../../api/types'
import { formatDate, formatDateTime } from '../../format'
import { EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useNotify } from '../notify'
import { errorMessage, openBlob, useApi } from '../useApi'
import { Panel, StatusPill } from './parts'
import { SPV_FIELD_LABEL, SPV_MESSAGE_CELL, SPV_REQUEST_CELL, SPV_REQUEST_TYPES, spvTypeLabel } from './spv'
import { HAIRLINE, INK, MUTED } from './status'

const DARK = { bgcolor: 'var(--rl-primary)', color: 'var(--rl-primary-fg)', '&:hover': { bgcolor: 'var(--rl-fg-soft)' } }

/** Mesajele SPV ale clientului (aduse de aplicația desktop) și cererile către SPV. */
export function SpvSection({ pfaId }: { pfaId: string }) {
  const state = useApi(() => accountingApi.spv.forPfa(pfaId), [pfaId])
  const [asking, setAsking] = useState(false)
  const [opening, setOpening] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (state.error && !state.data) return <ErrorBlock message={state.error} onRetry={state.reload} />
  if (!state.data) return <LoadingBlock />
  const { messages, requests, lastSyncAtUtc } = state.data

  const open = async (message: SpvMessage) => {
    setOpening(message.id)
    setError(null)
    try {
      openBlob(await accountingApi.spv.getFile(message.id))
      if (!message.read) {
        await accountingApi.spv.markRead(message.id)
        state.reload()
      }
    } catch (openError) {
      setError(errorMessage(openError))
    } finally {
      setOpening(null)
    }
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1.5 }}>
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: INK }}>
            SPV
          </Typography>
          <Typography sx={{ fontSize: 13, color: MUTED }}>{lastSyncAtUtc ? formatDateTime(lastSyncAtUtc) : 'nesincronizat'}</Typography>
        </Stack>
        <Button variant="contained" onClick={() => setAsking(true)} sx={DARK}>
          Cere document
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Panel>
        {messages.length === 0 ? (
          <Box sx={{ px: 2.5, py: 1 }}>
            <EmptyText>Niciun mesaj SPV.</EmptyText>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ '& td, & th': { borderColor: HAIRLINE } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 2.5 }}>Mesaj</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Data</TableCell>
                  <TableCell>Stare</TableCell>
                  <TableCell align="right" sx={{ pr: 2.5 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell sx={{ pl: 2.5 }}>
                      <Typography sx={{ fontWeight: message.read ? 500 : 700, fontSize: 14 }}>
                        {message.requestType ? spvTypeLabel(message.requestType) : spvTypeLabel(message.type)}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: MUTED, overflowWrap: 'anywhere' }}>{message.note ?? message.details}</Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>{formatDate(message.createdAtUtc)}</TableCell>
                    <TableCell>
                      <StatusPill cell={SPV_MESSAGE_CELL[message.status]} />
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 2.5 }}>
                      {message.hasDocument && (
                        <Button size="small" disabled={opening !== null} onClick={() => void open(message)}>
                          PDF
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Panel>

      {requests.length > 0 && (
        <Panel>
          {requests.map((request, index) => (
            <Stack
              key={request.id}
              direction="row"
              sx={{ alignItems: 'center', gap: 2, px: 2.5, py: 1.5, borderTop: index === 0 ? 'none' : `1px solid ${HAIRLINE}` }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                  {spvTypeLabel(request.type)}
                  {Object.values(request.parameters).length > 0 && ` · ${Object.values(request.parameters).join(' ')}`}
                </Typography>
                <Typography sx={{ fontSize: 13, color: MUTED }}>{formatDateTime(request.createdAtUtc)}</Typography>
              </Box>
              <StatusPill cell={{ ...SPV_REQUEST_CELL[request.status], title: request.error ?? undefined }} />
            </Stack>
          ))}
        </Panel>
      )}

      {asking && (
        <RequestDialog
          onClose={() => setAsking(false)}
          onQueued={() => {
            setAsking(false)
            state.reload()
          }}
          pfaId={pfaId}
        />
      )}
    </Stack>
  )
}

function RequestDialog({ pfaId, onClose, onQueued }: { pfaId: string; onClose: () => void; onQueued: () => void }) {
  const notify = useNotify()
  const now = new Date()
  const [type, setType] = useState(SPV_REQUEST_TYPES[0].type)
  const [values, setValues] = useState<Record<string, string>>({ an: String(now.getFullYear()), luna: String(now.getMonth() || 12) })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fields = SPV_REQUEST_TYPES.find((item) => item.type === type)?.fields ?? []

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await accountingApi.spv.queueRequest(pfaId, type, Object.fromEntries(fields.map((field) => [field, values[field] ?? ''])))
      notify('Cererea pleacă la următoarea trimitere a aplicației SPV.', 'success')
      onQueued()
    } catch (submitError) {
      setError(errorMessage(submitError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cere document</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField select label="Document" value={type} onChange={(event) => setType(event.target.value)} fullWidth>
            {SPV_REQUEST_TYPES.map((item) => (
              <MenuItem key={item.type} value={item.type}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>
          {fields.map((field) => (
            <TextField
              key={field}
              label={SPV_FIELD_LABEL[field]}
              value={values[field] ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
              fullWidth
            />
          ))}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Renunță
        </Button>
        <Button variant="contained" onClick={() => void submit()} disabled={busy || fields.some((field) => !values[field]?.trim())}>
          {busy ? 'Se trimite…' : 'Cere'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
