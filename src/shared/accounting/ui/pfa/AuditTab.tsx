import { Fragment, useState } from 'react'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  Collapse,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { EMPTY, formatDateTime } from '../../format'
import { EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useApi } from '../useApi'
import { actionLabel, auditValue, changedFields, entityLabel } from './auditLabels'

/** Tabul „Istoric”: jurnalul de audit al dosarului, cu filtre pe entitate și interval. */
export function AuditTab({ pfaId }: { pfaId: string }) {
  const [entity, setEntity] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const audit = useApi(
    () => accountingApi.pfas.getAudit(pfaId, { entity: entity || undefined, from: from || undefined, to: to || undefined }),
    [pfaId, entity, from, to],
  )
  const all = useApi(() => accountingApi.pfas.getAudit(pfaId), [pfaId])
  const entities = [...new Set((all.data ?? []).map((entry) => entry.entity))].sort()

  return (
    <Paper>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, p: 2.5, flexWrap: 'wrap' }}>
        <TextField select label="Entitate" value={entity} onChange={(event) => setEntity(event.target.value)} sx={{ minWidth: 220 }}>
          <MenuItem value="">Toate</MenuItem>
          {entities.map((item) => (
            <MenuItem key={item} value={item}>
              {entityLabel(item)}
            </MenuItem>
          ))}
        </TextField>
        <TextField type="date" label="De la" value={from} onChange={(event) => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField type="date" label="Până la" value={to} onChange={(event) => setTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </Stack>

      {audit.error && <ErrorBlock message={audit.error} onRetry={audit.reload} />}
      {!audit.data && !audit.error && <LoadingBlock />}
      {audit.data && audit.data.length === 0 && (
        <Stack sx={{ px: 2.5, pb: 1 }}>
          <EmptyText>Nicio modificare înregistrată în intervalul ales.</EmptyText>
        </Stack>
      )}
      {audit.data && audit.data.length > 0 && (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Când</TableCell>
                <TableCell>Cine</TableCell>
                <TableCell>Ce</TableCell>
                <TableCell>Acțiune</TableCell>
                <TableCell>Motiv</TableCell>
                <TableCell padding="checkbox" />
              </TableRow>
            </TableHead>
            <TableBody>
              {audit.data.map((entry) => {
                const fields = changedFields(entry.before, entry.after)
                const expanded = open === entry.id
                return (
                  <Fragment key={entry.id}>
                    <TableRow hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(entry.at)}</TableCell>
                      <TableCell>{entry.user.name}</TableCell>
                      <TableCell>{entityLabel(entry.entity)}</TableCell>
                      <TableCell>{actionLabel(entry.action)}</TableCell>
                      <TableCell>{entry.reason ?? EMPTY}</TableCell>
                      <TableCell padding="checkbox">
                        {fields.length > 0 && (
                          <IconButton
                            size="small"
                            aria-label={expanded ? 'Ascunde detaliile' : 'Arată valorile vechi și noi'}
                            onClick={() => setOpen(expanded ? null : entry.id)}
                          >
                            <ExpandMoreRoundedIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, borderBottom: expanded ? undefined : 0 }}>
                        <Collapse in={expanded} unmountOnExit>
                          <Stack spacing={0.5} sx={{ py: 1.5 }}>
                            {fields.map((field) => (
                              <Typography key={field} variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                                <strong>{field}</strong>: {auditValue(entry.before?.[field])} → {auditValue(entry.after?.[field])}
                              </Typography>
                            ))}
                          </Stack>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}
