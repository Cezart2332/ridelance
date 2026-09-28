import { useState } from 'react'
import type { ReactNode } from 'react'
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material'

import { pfaService } from '../../../../services/pfa.service'
import { formatDateTime, formatPeriod } from '../../format'
import { EmptyText, LoadingBlock } from '../components'
import { useNotify } from '../notify'
import { useApi } from '../useApi'
import { AuditTab } from '../pfa/AuditTab'
import { Panel } from '../workspace/parts'

/** Notele interne ale lunii, activitatea clientului și modificările contabile (audit). */
export function ClientHistorySection({ pfaId, year, month, refreshKey }: { pfaId: string; year: number; month: number; refreshKey: number }) {
  const notify = useNotify()
  const notesApi = useApi(() => pfaService.getInternalNotes(pfaId, year, month), [pfaId, year, month, refreshKey])
  const activityApi = useApi(() => pfaService.getActivityLogs(pfaId), [pfaId, refreshKey])
  const notes = notesApi.data ?? (notesApi.error ? [] : null)
  const activity = activityApi.data ?? (activityApi.error ? [] : null)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null)
  const period = `${year}-${String(month).padStart(2, '0')}`

  const load = () => {
    notesApi.reload()
    activityApi.reload()
  }

  const act = async (action: () => Promise<unknown>, success: string, failure: string) => {
    try {
      await action()
      notify(success, 'success')
      void load()
    } catch {
      notify(failure, 'error')
    }
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.2fr) minmax(0, 1fr)' }, alignItems: 'start' }}>
        <Card title={`Note interne · ${formatPeriod(period)}`}>
          <Stack spacing={2}>
            <TextField
              multiline
              minRows={2}
              placeholder="Notă vizibilă doar contabililor"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button
              variant="contained"
              sx={{ alignSelf: 'flex-start' }}
              disabled={!draft.trim()}
              onClick={() =>
                void act(
                  async () => {
                    await pfaService.createInternalNote(pfaId, year, month, draft.trim())
                    setDraft('')
                  },
                  'Nota a fost adăugată.',
                  'Adăugarea notei a eșuat.',
                )
              }
            >
              Adaugă notă
            </Button>
            {!notes && <LoadingBlock />}
            {notes?.length === 0 && <EmptyText>Nicio notă în această lună.</EmptyText>}
            {notes?.map((note) => (
              <Box key={note.id}>
                <Divider sx={{ mb: 1.5 }} />
                {editing?.id === note.id ? (
                  <Stack spacing={1}>
                    <TextField multiline minRows={2} value={editing.content} onChange={(event) => setEditing({ id: note.id, content: event.target.value })} />
                    <Stack direction="row" sx={{ gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!editing.content.trim()}
                        onClick={() =>
                          void act(
                            async () => {
                              await pfaService.updateInternalNote(note.id, editing.content.trim())
                              setEditing(null)
                            },
                            'Nota a fost modificată.',
                            'Modificarea notei a eșuat.',
                          )
                        }
                      >
                        Salvează
                      </Button>
                      <Button size="small" onClick={() => setEditing(null)}>
                        Anulează
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </Typography>
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        {note.createdByUserName} · {formatDateTime(note.createdAtUtc)}
                      </Typography>
                      <Stack direction="row">
                        <Button size="small" onClick={() => setEditing({ id: note.id, content: note.content })}>
                          Editează
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => void act(() => pfaService.deleteInternalNote(note.id), 'Nota a fost ștearsă.', 'Ștergerea notei a eșuat.')}
                        >
                          Șterge
                        </Button>
                      </Stack>
                    </Stack>
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        </Card>

        <Card title="Activitate client">
          {!activity && <LoadingBlock />}
          {activity?.length === 0 && <EmptyText>Nicio activitate.</EmptyText>}
          <Stack spacing={1.5} sx={{ maxHeight: 480, overflowY: 'auto' }}>
            {activity?.map((log) => (
              <Stack key={log.id} spacing={0.25} sx={{ pl: 1.5, borderLeft: 2, borderColor: log.activityType === 'MonthProcessed' ? 'success.main' : 'primary.main' }}>
                <Typography variant="body2">{log.description}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(log.createdAtUtc)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Card>
      </Box>

      <Stack spacing={1.5}>
        <Typography variant="subtitle2" component="h2">
          Modificări contabile
        </Typography>
        <AuditTab pfaId={pfaId} />
      </Stack>
    </Stack>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel sx={{ px: 2.5, py: 2 }}>
      <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Panel>
  )
}
