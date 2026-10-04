import { useEffect, useRef, useState, type DragEvent } from 'react'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { Autocomplete, Box, Button, ButtonBase, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { ClientWorkspaceRow, Period, PlatformInboxItem, PlatformInboxResult, PlatformInboxStatus } from '../../api/types'
import { formatPeriod } from '../../format'
import { useAction } from '../notify'
import { errorMessage } from '../useApi'
import { MonthSelect, Panel, SectionTitle, StatusPill } from './parts'
import { HAIRLINE, INK, type Cell } from './status'

const STATUS_CELL: Record<PlatformInboxStatus, Cell> = {
  MATCHING: { tone: 'blue', label: 'Se caută clientul' },
  ASSIGNED: { tone: 'green', label: 'Alocat' },
  NEEDS_REVIEW: { tone: 'yellow', label: 'De verificat' },
  UNKNOWN_CUI: { tone: 'red', label: 'CUI necunoscut' },
  DISMISSED: { tone: 'gray', label: 'Respins' },
  FAILED: { tone: 'red', label: 'Necitit' },
}

function resultCell(result: PlatformInboxResult): Cell {
  if (!result.status) return { tone: 'gray', label: result.message.startsWith('Duplicat') ? 'Duplicat' : 'Refuzat' }
  if (result.status === 'ASSIGNED') return { tone: 'green', label: result.pfaName ?? 'Alocat' }
  return STATUS_CELL[result.status]
}

/** Starea e deja pe insignă: motivul fără „De verificat:” în față. */
function withoutStatus(reason: string): string {
  const rest = reason.replace(/^De verificat:\s*/, '')
  return rest.charAt(0).toUpperCase() + rest.slice(1)
}

const isPdf = (file: File) => file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')

/**
 * „Încarcă documente” din „Clienți PFA”: rapoartele de venituri și facturile de comision pentru mai mulți
 * clienți deodată. Încărcarea pornește la alegerea fișierelor; fiecare rând spune unde a ajuns fișierul.
 */
export function UploadDocumentsDialog({
  open,
  period: initialPeriod,
  current,
  onClose,
  onUploaded,
}: {
  open: boolean
  period: Period
  current: Period
  onClose: () => void
  onUploaded: () => void
}) {
  const [period, setPeriod] = useState(initialPeriod)
  const [results, setResults] = useState<PlatformInboxResult[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const upload = async (files: File[]) => {
    if (files.length === 0 || busy) return
    setBusy(true)
    setError(null)
    try {
      const uploaded = await accountingApi.platformInbox.upload(period, files)
      setResults((previous) => [...uploaded, ...previous])
      onUploaded()
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  const drop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    void upload([...event.dataTransfer.files].filter(isPdf))
  }

  const close = () => {
    setResults([])
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Încarcă documente</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <MonthSelect value={period} current={current} onChange={setPeriod} />
          <ButtonBase
            onClick={() => input.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
            disabled={busy}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              py: 4,
              borderRadius: '12px',
              border: '1.5px dashed',
              borderColor: dragging ? 'var(--rl-fg)' : 'var(--rl-border-strong)',
              bgcolor: dragging ? 'var(--rl-hover)' : 'var(--rl-card-alt)',
              color: INK,
              fontFamily: 'inherit',
            }}
          >
            <UploadFileRoundedIcon />
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{busy ? 'Se încarcă…' : 'Alege sau trage fișierele PDF'}</Typography>
          </ButtonBase>
          <input
            ref={input}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            aria-label="Fișiere PDF"
            onChange={(event) => {
              const files = [...(event.target.files ?? [])]
              event.target.value = ''
              void upload(files)
            }}
          />
          {error && <Typography sx={{ color: 'var(--rl-red-text)', fontSize: 14 }}>{error}</Typography>}
          {results.length > 0 && (
            <Stack divider={<Box sx={{ borderTop: `1px solid ${HAIRLINE}` }} />}>
              {results.map((result, index) => (
                <Stack key={`${result.itemId ?? result.fileName}-${index}`} sx={{ py: 1.25, gap: 0.5 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, overflowWrap: 'anywhere' }}>{result.fileName}</Typography>
                    <StatusPill cell={resultCell(result)} />
                  </Stack>
                  {result.status !== 'ASSIGNED' && <Typography sx={{ fontSize: 13, color: 'var(--rl-text-muted)' }}>{withoutStatus(result.message)}</Typography>}
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Închide</Button>
      </DialogActions>
    </Dialog>
  )
}

function InboxRow({
  item,
  clients,
  busy,
  onAssign,
  onDismiss,
}: {
  item: PlatformInboxItem
  clients: ClientWorkspaceRow[]
  busy: boolean
  onAssign: (pfaId: string) => void
  onDismiss: () => void
}) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ px: 2.5, py: 1.5, gap: 1.5, alignItems: { md: 'center' } }}>
      <Stack sx={{ flex: 1, minWidth: 0, gap: 0.5 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14, overflowWrap: 'anywhere' }}>{item.fileName}</Typography>
          <Typography sx={{ fontSize: 13, color: 'var(--rl-text-muted)' }}>{formatPeriod(item.period)}</Typography>
          <StatusPill cell={STATUS_CELL[item.status]} />
        </Stack>
        {item.reason && <Typography sx={{ fontSize: 13, color: 'var(--rl-text-muted)' }}>{withoutStatus(item.reason)}</Typography>}
      </Stack>
      {item.status !== 'MATCHING' && (
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
          <Autocomplete
            options={clients}
            getOptionLabel={(client) => (client.cui ? `${client.name} · ${client.cui}` : client.name)}
            onChange={(_, client) => client && onAssign(client.pfaId)}
            disabled={busy}
            size="small"
            sx={{ width: { xs: '100%', md: 260 } }}
            renderInput={(params) => <TextField {...params} placeholder="Alocă la client" />}
          />
          <Button color="inherit" disabled={busy} onClick={onDismiss}>
            Respinge
          </Button>
        </Stack>
      )}
    </Stack>
  )
}

/** Documentele încărcate global care nu s-au putut aloca: Adminul alege clientul sau le respinge. */
export function UnassignedDocuments({
  items,
  clients,
  onChanged,
}: {
  items: PlatformInboxItem[]
  clients: ClientWorkspaceRow[]
  onChanged: () => void
}) {
  const { busy, run } = useAction()

  // Cât timp se caută clientul după comision, lista se reîmprospătează singură.
  const matching = items.some((item) => item.status === 'MATCHING')
  useEffect(() => {
    if (!matching) return
    const timer = setInterval(onChanged, 3000)
    return () => clearInterval(timer)
  }, [matching, onChanged])

  if (items.length === 0) return null
  const review = items.filter((item) => item.status !== 'MATCHING').length

  return (
    <Panel>
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <SectionTitle tone={review > 0 ? 'red' : 'blue'} title="Documente nealocate" count={items.length} />
      </Box>
      <Stack divider={<Box sx={{ borderTop: `1px solid ${HAIRLINE}` }} />}>
        {items.map((item) => (
          <InboxRow
            key={item.id}
            item={item}
            clients={clients}
            busy={busy === item.id}
            onAssign={(pfaId) =>
              void run(item.id, () => accountingApi.platformInbox.assign(item.id, pfaId), 'Document alocat.').then((ok) => ok && onChanged())
            }
            onDismiss={() => void run(item.id, () => accountingApi.platformInbox.dismiss(item.id), 'Document respins.').then((ok) => ok && onChanged())}
          />
        ))}
      </Stack>
    </Panel>
  )
}
