import { useState } from 'react'
import {
  Button,
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
import type { InventoryCategory, InventoryCount, InventoryItem, InventoryReason } from '../../api/types'
import { INVENTORY_CATEGORIES, INVENTORY_REASONS } from '../../api/types'
import { EMPTY, formatAmount, formatDate, parseAmount } from '../../format'
import { INVENTORY_CATEGORY_LABEL, INVENTORY_ITEM_STATUS, INVENTORY_REASON_LABEL, INVENTORY_STATUS } from '../../statusLabels'
import { AccountingBadge, EmptyText, ErrorBlock, LoadingBlock, ReasonDialog } from '../components'
import { useAction } from '../notify'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { downloadBlob, useApi } from '../useApi'
import { exportName } from './exportName'
import { ExportButtons } from './registerParts'

type ItemAction = 'ADJUST' | 'REMOVE' | 'NOTE'

/** Registre §5: inventarierea — pornire, revizuirea diferențelor, finalizarea și Registrul-inventar. */
export function InventoryCard({ summary, year, onChanged }: DossierTabProps & { year: number; onChanged: () => void }) {
  const { busy, run } = useAction()
  const counts = useApi(() => accountingApi.inventory.list(summary.id), [summary.id])
  const [starting, setStarting] = useState<{ date: string; reason: InventoryReason } | null>(null)
  const [editing, setEditing] = useState<{ item: InventoryItem; action: ItemAction; value: string } | null>(null)
  const [adding, setAdding] = useState<{ category: InventoryCategory; description: string; value: string } | null>(null)
  const [updated, setUpdated] = useState<InventoryCount | null>(null)

  const ofYear = (counts.data ?? []).filter((count) => count.date.startsWith(String(year)))
  const count = updated && updated.date.startsWith(String(year)) ? updated : ofYear[0] ?? null
  const editable = count !== null && count.status !== 'FINAL' && !summary.readOnly

  const apply = (next: InventoryCount) => {
    setUpdated(next)
    counts.reload()
    onChanged()
  }

  return (
    <Paper id="registers-inventory">
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h2">Registrul-inventar {year}</Typography>
            {count && <AccountingBadge descriptor={INVENTORY_STATUS[count.status]} />}
          </Stack>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {!summary.readOnly && !count && (
              <Button size="small" variant="contained" onClick={() => setStarting({ date: `${year}-12-31`, reason: 'YEAR_END' })}>
                Pornește inventarierea
              </Button>
            )}
            {editable && (
              <Button size="small" variant="outlined" onClick={() => setAdding({ category: 'INVENTORY_OBJECTS', description: '', value: '' })}>
                Adaugă element
              </Button>
            )}
            {count?.status === 'AWAITING_ADMIN_REVIEW' && !summary.readOnly && (
              <Button
                size="small"
                variant="contained"
                disabled={busy !== null}
                onClick={() => run('finalize', async () => apply(await accountingApi.inventory.finalize(summary.id, count.id)), 'Registrul-inventar e final.')}
              >
                Finalizează
              </Button>
            )}
            <ExportButtons
              busy={busy !== null}
              onExport={(format) =>
                run('inventory', async () => {
                  const blob = await accountingApi.registers.exportInventory(summary.id, year, format)
                  downloadBlob(blob, exportName(`Registru_inventar_${summary.cui}_${year}`, blob, format))
                })
              }
            />
          </Stack>
        </Stack>
      </Stack>

      {counts.error && <ErrorBlock message={counts.error} onRetry={counts.reload} />}
      {!counts.data && !counts.error && <LoadingBlock />}
      {counts.data && !count && (
        <Stack sx={{ px: 2.5, pb: 2.5 }}>
          <EmptyText>Nicio inventariere în {year}.</EmptyText>
        </Stack>
      )}
      {count && (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                <TableCell>Element</TableCell>
                <TableCell align="right">Sistem</TableCell>
                <TableCell align="right">Confirmat</TableCell>
                <TableCell align="right">Diferență</TableCell>
                <TableCell>Stare</TableCell>
                <TableCell>Notă</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {INVENTORY_CATEGORIES.filter((category) => count.items.some((item) => item.category === category)).flatMap((category) => [
                <TableRow key={category} sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={7} sx={{ fontWeight: 600 }}>
                    {INVENTORY_CATEGORY_LABEL[category]}
                  </TableCell>
                </TableRow>,
                ...count.items
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">{formatAmount(item.systemValue)}</TableCell>
                      <TableCell align="right">{item.confirmedValue === null ? EMPTY : formatAmount(item.confirmedValue)}</TableCell>
                      <TableCell align="right" sx={{ color: item.difference ? 'warning.main' : undefined, fontWeight: item.difference ? 600 : undefined }}>
                        {item.difference ? formatAmount(item.difference) : EMPTY}
                      </TableCell>
                      <TableCell>
                        <AccountingBadge descriptor={INVENTORY_ITEM_STATUS[item.status]} />
                      </TableCell>
                      <TableCell>{item.note ?? EMPTY}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {editable && (
                          <>
                            <Button size="small" onClick={() => setEditing({ item, action: 'NOTE', value: '' })}>
                              Notă
                            </Button>
                            <Button size="small" onClick={() => setEditing({ item, action: 'ADJUST', value: formatAmount(item.confirmedValue ?? item.systemValue) })}>
                              Corectează
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  )),
              ])}
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                <TableCell colSpan={2} align="right" sx={{ fontWeight: 600 }}>
                  {formatAmount(count.total)}
                </TableCell>
                <TableCell colSpan={4}>
                  {count.finalizedAt && `Finalizat ${formatDate(count.finalizedAt)}${count.finalizedBy ? ` · ${count.finalizedBy.name}` : ''}`}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ReasonDialog
        open={starting !== null}
        title="Pornește inventarierea"
        requireReason={false}
        showReason={false}
        canSubmit={Boolean(starting?.date)}
        onClose={() => setStarting(null)}
        onSubmit={async () => {
          if (!starting) return
          apply(await accountingApi.inventory.start(summary.id, starting.date, starting.reason))
        }}
      >
        {starting && (
          <>
            <TextField
              type="date"
              label="Data inventarului"
              value={starting.date}
              onChange={(event) => setStarting({ ...starting, date: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField select label="Motiv" value={starting.reason} onChange={(event) => setStarting({ ...starting, reason: event.target.value as InventoryReason })}>
              {INVENTORY_REASONS.map((reason) => (
                <MenuItem key={reason} value={reason}>
                  {INVENTORY_REASON_LABEL[reason]}
                </MenuItem>
              ))}
            </TextField>
          </>
        )}
      </ReasonDialog>

      <ReasonDialog
        open={editing !== null}
        title={editing?.item.description ?? ''}
        reasonLabel="Notă"
        requireReason={editing?.action !== 'ADJUST'}
        canSubmit={editing?.action !== 'ADJUST' || parseAmount(editing.value) !== null}
        onClose={() => setEditing(null)}
        onSubmit={async (note) => {
          if (!editing || !count) return
          apply(
            await accountingApi.inventory.updateItem(summary.id, count.id, editing.item.id, {
              action: editing.action,
              value: editing.action === 'ADJUST' ? parseAmount(editing.value) : null,
              note: note || null,
            }),
          )
        }}
      >
        {editing?.action === 'ADJUST' && (
          <TextField label="Valoarea reală (lei)" value={editing.value} onChange={(event) => setEditing({ ...editing, value: event.target.value })} />
        )}
      </ReasonDialog>

      <ReasonDialog
        open={adding !== null}
        title="Adaugă element"
        reasonLabel="Notă"
        canSubmit={Boolean(adding?.description.trim() && parseAmount(adding.value) !== null)}
        onClose={() => setAdding(null)}
        onSubmit={async (note) => {
          if (!adding || !count) return
          apply(
            await accountingApi.inventory.addItem(summary.id, count.id, {
              category: adding.category,
              description: adding.description.trim(),
              value: parseAmount(adding.value) ?? 0,
              note,
            }),
          )
        }}
      >
        {adding && (
          <>
            <TextField select label="Categorie" value={adding.category} onChange={(event) => setAdding({ ...adding, category: event.target.value as InventoryCategory })}>
              {INVENTORY_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {INVENTORY_CATEGORY_LABEL[category]}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Denumire" value={adding.description} onChange={(event) => setAdding({ ...adding, description: event.target.value })} />
            <TextField label="Valoare (lei)" value={adding.value} onChange={(event) => setAdding({ ...adding, value: event.target.value })} />
          </>
        )}
      </ReasonDialog>
    </Paper>
  )
}
