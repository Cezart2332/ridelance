import { useEffect, useRef, useState } from 'react'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Alert, Box, Button, ButtonBase, IconButton, Stack, Tooltip, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { isAccountingApiError } from '../../api/errors'
import type { PfaAccountingSummary, PlatformDocumentListItem } from '../../api/types'
import { formatMoney } from '../../format'
import { ConfirmDialog } from '../components'
import { DocumentReviewDialog } from '../documents/DocumentReviewDialog'
import { useAccountingNav } from '../navigation'
import { useNotify } from '../notify'
import { errorMessage, POLL_INTERVAL_MS } from '../useApi'
import { Panel, StatusPill } from './parts'
import { documentGroups, STATUS_CELL, uploadInputId, type DocumentGroup } from './documentGroups'
import { HAIRLINE, INK } from './status'

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/** Documentele Uber și Bolt ale lunii: un rând pe tip, cu cel mai urgent status. */
export function MonthDocuments({
  summary,
  period,
  documents,
  onChanged,
  onClientFiles,
}: {
  summary: PfaAccountingSummary
  period: string
  documents: PlatformDocumentListItem[]
  onChanged: () => void
  /** Deschide documentele încărcate de client (bon, facturi, extrase). */
  onClientFiles?: () => void
}) {
  const nav = useAccountingNav()
  const notify = useNotify()
  const readOnly = summary.readOnly
  const canDelete = nav.role === 'Admin' && !readOnly
  const [expanded, setExpanded] = useState<string | null>(null)
  const [issues, setIssues] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<PlatformDocumentListItem | null>(null)
  const groups = documentGroups(summary, documents)
  const pending = documents.filter((document) => document.status === 'PENDING_CONFIRMATION')

  // Documentele în citire se reîmprospătează singure până ies din citire.
  const reading = documents.some((document) => document.status === 'UPLOADED' || document.status === 'EXTRACTING')
  const refresh = useRef(onChanged)
  useEffect(() => {
    refresh.current = onChanged
  })
  useEffect(() => {
    if (!reading) return
    const timer = window.setTimeout(() => refresh.current(), POLL_INTERVAL_MS)
    return () => window.clearTimeout(timer)
  }, [reading, documents])

  const upload = async (files: File[]) => {
    const found: string[] = []
    setUploading(true)
    for (const file of files) {
      if (!isPdf(file)) {
        found.push(`${file.name}: doar fișiere PDF.`)
        continue
      }
      try {
        await accountingApi.documents.upload(summary.id, { file, period })
      } catch (error) {
        found.push(`${file.name}: ${isAccountingApiError(error) ? error.message : errorMessage(error)}`)
      }
    }
    setUploading(false)
    setIssues(found)
    onChanged()
  }

  const open = (group: DocumentGroup) => {
    if (group.documents.length === 1) nav.setParam('document', group.documents[0].id)
    else if (group.documents.length > 1) setExpanded((current) => (current === group.key ? null : group.key))
  }

  return (
    <Panel>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, gap: 1 }}>
        <Typography component="h2" sx={{ fontSize: 14, fontWeight: 600, color: INK }}>
          Documente
        </Typography>
        {!readOnly && (
          <Stack direction="row" sx={{ gap: 0.5 }}>
            {onClientFiles && (
              <Button size="small" onClick={onClientFiles}>
                De la client
              </Button>
            )}
            {pending.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                onClick={async () => {
                  const result = await accountingApi.documents.confirmBulk({ ids: pending.map((document) => document.id) })
                  notify(result.confirmed.length === 1 ? 'Un document confirmat.' : `${result.confirmed.length} documente confirmate.`, 'success')
                  onChanged()
                }}
              >
                Confirmă
              </Button>
            )}
            <Button size="small" variant="outlined" disabled={uploading} component="label" htmlFor={uploadInputId(summary.id)}>
              {uploading ? 'Se încarcă…' : 'Încarcă'}
            </Button>
          </Stack>
        )}
        <input
          id={uploadInputId(summary.id)}
          type="file"
          accept="application/pdf"
          multiple
          hidden
          onChange={(event) => {
            const files = [...(event.target.files ?? [])]
            event.target.value = ''
            if (files.length > 0) void upload(files)
          }}
        />
      </Stack>

      {issues.length > 0 && (
        <Alert severity="warning" onClose={() => setIssues([])} sx={{ mx: 2, mb: 1 }}>
          {issues.map((issue) => (
            <Box key={issue}>{issue}</Box>
          ))}
        </Alert>
      )}

      {groups.map((group) => {
        const first = group.documents[0]
        const total = group.documents.reduce((sum, document) => sum + (document.mainAmount ?? 0), 0)
        const multiple = group.documents.length > 1
        return (
          <Box key={group.key} sx={{ borderTop: `1px solid ${HAIRLINE}` }}>
            <Stack direction="row" sx={{ alignItems: 'center', pr: !multiple && first && canDelete ? 1.5 : 0 }}>
            <ButtonBase
              onClick={() => open(group)}
              disabled={!first}
              aria-expanded={multiple ? expanded === group.key : undefined}
              sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, textAlign: 'left', fontFamily: 'inherit' }}
            >
              <Typography sx={{ flexGrow: 1, fontSize: 13, fontWeight: 500, color: INK }}>{group.label}</Typography>
              <Typography sx={{ fontSize: 13, color: INK, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {first ? formatMoney(multiple ? total : first.mainAmount, first.currency) : ''}
              </Typography>
              <Box sx={{ minWidth: 104, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                <StatusPill cell={first ? STATUS_CELL[first.status] : { tone: 'red', label: 'Lipsă' }} />
                {multiple && (
                  <ExpandMoreRoundedIcon
                    fontSize="small"
                    sx={{ color: 'var(--rl-text-muted)', transform: expanded === group.key ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
                  />
                )}
              </Box>
            </ButtonBase>
              {!multiple && first && canDelete && (
                <Tooltip title="Șterge documentul">
                  <IconButton size="small" aria-label={`Șterge ${first.fileName}`} onClick={() => setDeleting(first)}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            {multiple && expanded === group.key && (
              <Box sx={{ bgcolor: 'var(--rl-card-alt)', pb: 1 }}>
                {group.documents.map((document) => (
                  <Stack key={document.id} direction="row" sx={{ alignItems: 'center', gap: 1.5, px: 2, py: 0.5 }}>
                    <ButtonBase
                      onClick={() => nav.setParam('document', document.id)}
                      sx={{ flexGrow: 1, justifyContent: 'flex-start', fontFamily: 'inherit', fontSize: 12, color: 'var(--rl-fg-soft)', textAlign: 'left', minWidth: 0 }}
                    >
                      <Box component="span" sx={{ overflowWrap: 'anywhere' }}>
                        {document.fileName}
                      </Box>
                    </ButtonBase>
                    <Typography sx={{ fontSize: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatMoney(document.mainAmount, document.currency)}</Typography>
                    <Box sx={{ minWidth: 104, display: 'flex', justifyContent: 'flex-end' }}>
                      <StatusPill cell={STATUS_CELL[document.status]} />
                    </Box>
                    {canDelete && (
                      <Tooltip title="Șterge documentul">
                        <IconButton size="small" aria-label={`Șterge ${document.fileName}`} onClick={() => setDeleting(document)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                ))}
              </Box>
            )}
          </Box>
        )
      })}

      {nav.documentId && (
        <DocumentReviewDialog
          key={nav.documentId}
          documentId={nav.documentId}
          readOnly={readOnly}
          onClose={() => nav.setParam('document', null)}
          onChanged={onChanged}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Șterge documentul"
        message={deleting ? `${deleting.fileName} dispare din lună, din verificări și din calcul.` : ''}
        confirmLabel="Șterge"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          await accountingApi.documents.remove(deleting.id)
          notify('Documentul a fost șters.', 'success')
          setDeleting(null)
          onChanged()
        }}
      />
    </Panel>
  )
}

