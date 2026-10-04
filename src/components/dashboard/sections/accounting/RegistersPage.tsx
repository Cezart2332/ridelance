import { formatLei } from '../../../../shared/money'
import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { DASHBOARD_TOKENS as T } from '../../dashboardTheme'
import { PageHeader, StatusChip, type StatusTone } from '../../ui'
import { clientRegistersService } from '../../../../services/clientRegisters.service'
import type {
  AccountingYear,
  Asset,
  InventoryCategory,
  InventoryCount,
  InventoryItem,
  InventoryItemStatus,
} from '../../../../shared/accounting/api/types'
import { INVENTORY_CATEGORIES } from '../../../../shared/accounting/api/types'
import { ASSET_KIND_LABEL, INVENTORY_CATEGORY_LABEL } from '../../../../shared/accounting/statusLabels'
import { getErrorMessage } from '../../../../utils/errorHandler'

const lei = (value: number) => formatLei(value)

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })

const ITEM_STATE: Record<InventoryItemStatus, { label: string; tone: StatusTone }> = {
  PREFILLED: { label: 'De confirmat', tone: 'warning' },
  CONFIRMED: { label: 'Confirmat ✓', tone: 'active' },
  ADJUSTED: { label: 'Corectat', tone: 'active' },
  REMOVED: { label: 'Scos din folosință', tone: 'neutral' },
  ADDED_MANUALLY: { label: 'Adăugat', tone: 'active' },
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

type Editing = { item: InventoryItem; mode: 'adjust' | 'remove'; value: string; note: string }

/**
 * Registrele pentru PFA (spec registre §5, §8): inventarul de confirmat („RIDElance a identificat X
 * elemente”), activele cu fișele MF și pachetele anuale ale anilor închiși. Doar citire, în rest.
 */
export function RegistersPage() {
  const [inventory, setInventory] = useState<InventoryCount | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [years, setYears] = useState<AccountingYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [adding, setAdding] = useState<{ category: InventoryCategory; description: string; value: string; note: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    () =>
      Promise.all([clientRegistersService.inventory(), clientRegistersService.assets(), clientRegistersService.years()])
        .then(([count, owned, closed]) => {
          setInventory(count)
          setAssets(owned)
          setYears(closed)
          setError(null)
        })
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => { void load() }, [load])

  const act = async (work: () => Promise<InventoryCount | void>) => {
    setBusy(true)
    try {
      const next = await work()
      if (next) setInventory(next)
      setError(null)
      return true
    } catch (err) {
      setError(getErrorMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const toConfirm = inventory?.status === 'AWAITING_PFA_CONFIRMATION' ? inventory : null
  const open = toConfirm?.items.filter((item) => item.status === 'PREFILLED').length ?? 0
  const parse = (text: string) => {
    const value = Number(text.replace(/\s/g, '').replace(',', '.'))
    return Number.isFinite(value) && value >= 0 ? value : null
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title="Registre" />
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {loading && (
        <Stack sx={{ alignItems: 'center', py: 4 }}>
          <CircularProgress size={24} sx={{ color: T.primary }} />
        </Stack>
      )}

      {toConfirm && (
        <Paper elevation={0} sx={{ borderRadius: `${T.radius.lg}px`, border: `1px solid ${T.primary}`, overflow: 'hidden' }}>
          <Stack direction="row" useFlexGap sx={{ p: 2, gap: 1.5, alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${T.border}` }}>
            <Typography sx={{ fontWeight: 700, color: T.ink, flex: 1 }}>
              Inventar la {dayLabel(toConfirm.date)}: RIDElance a identificat {toConfirm.items.length} elemente
            </Typography>
            <Button size="small" onClick={() => setAdding({ category: 'INVENTORY_OBJECTS', description: '', value: '', note: '' })}>
              Adaugă
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={busy || open > 0}
              onClick={() => void act(() => clientRegistersService.submit(toConfirm.id))}
            >
              Trimite contabilului
            </Button>
          </Stack>
          {INVENTORY_CATEGORIES.filter((category) => toConfirm.items.some((item) => item.category === category)).map((category) => (
            <Box key={category}>
              <Typography sx={{ px: 2, pt: 1.5, pb: 0.5, fontSize: '0.8rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>
                {INVENTORY_CATEGORY_LABEL[category]}
              </Typography>
              {toConfirm.items
                .filter((item) => item.category === category)
                .map((item) => (
                  <Stack
                    key={item.id}
                    direction="row"
                    useFlexGap
                    sx={{ alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderTop: `1px solid ${T.border}`, flexWrap: 'wrap' }}
                  >
                    <Typography sx={{ flex: '1 1 200px', minWidth: 0, fontWeight: 600, color: T.ink }}>{item.description}</Typography>
                    <Typography sx={{ fontWeight: 700, color: T.ink, whiteSpace: 'nowrap' }}>{lei(item.confirmedValue ?? item.systemValue)}</Typography>
                    <StatusChip label={ITEM_STATE[item.status].label} tone={ITEM_STATE[item.status].tone} size="sm" />
                    {item.status === 'PREFILLED' && (
                      <Button size="small" variant="outlined" disabled={busy} onClick={() => void act(() => clientRegistersService.updateItem(toConfirm.id, item.id, { action: 'CONFIRM' }))}>
                        Confirm
                      </Button>
                    )}
                    <Button size="small" disabled={busy} onClick={() => setEditing({ item, mode: 'adjust', value: String(item.confirmedValue ?? item.systemValue), note: item.note ?? '' })}>
                      {item.category === 'CASH' ? 'Am numărat altă sumă' : 'Altă valoare'}
                    </Button>
                    {(item.category === 'FIXED_ASSETS' || item.category === 'INVENTORY_OBJECTS') && item.status !== 'REMOVED' && (
                      <Button size="small" color="inherit" disabled={busy} onClick={() => setEditing({ item, mode: 'remove', value: '', note: '' })}>
                        Scos din folosință
                      </Button>
                    )}
                  </Stack>
                ))}
            </Box>
          ))}
        </Paper>
      )}

      {inventory && !toConfirm && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: `${T.radius.lg}px`, border: `1px solid ${T.border}` }}>
          <Stack direction="row" useFlexGap sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, color: T.ink, flex: 1 }}>Inventar la {dayLabel(inventory.date)}</Typography>
            <Typography sx={{ fontWeight: 700, color: T.ink }}>{lei(inventory.total)}</Typography>
            <StatusChip label={inventory.status === 'FINAL' ? 'Final ✓' : 'La contabil'} tone={inventory.status === 'FINAL' ? 'active' : 'neutral'} size="sm" />
          </Stack>
        </Paper>
      )}

      {assets.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: `${T.radius.lg}px`, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <Typography sx={{ p: 2, fontWeight: 700, color: T.ink, borderBottom: `1px solid ${T.border}` }}>Active</Typography>
          {assets.map((asset) => (
            <Stack key={asset.id} direction="row" useFlexGap sx={{ alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', '&:last-of-type': { borderBottom: 'none' } }}>
              <Typography sx={{ color: T.textMuted, fontSize: '0.82rem', width: 64, flexShrink: 0 }}>{asset.inventoryNumber}</Typography>
              <Typography sx={{ flex: '1 1 180px', minWidth: 0, fontWeight: 600, color: T.ink }}>{asset.name}</Typography>
              <Typography sx={{ color: T.textMuted, fontSize: '0.82rem' }}>{ASSET_KIND_LABEL[asset.kind]}</Typography>
              <Typography sx={{ fontWeight: 700, color: T.ink, whiteSpace: 'nowrap' }}>{lei(asset.remaining)}</Typography>
              {asset.kind === 'FIXED_ASSET' && (
                <Button size="small" disabled={busy} onClick={() => void act(async () => download(await clientRegistersService.assetSheet(asset.id), `Fisa_MF_${asset.inventoryNumber}.pdf`))}>
                  Fișa MF
                </Button>
              )}
            </Stack>
          ))}
        </Paper>
      )}

      {years.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: `${T.radius.lg}px`, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          {years.map((year) => (
            <Stack key={year.year} direction="row" useFlexGap sx={{ alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderBottom: `1px solid ${T.border}`, '&:last-of-type': { borderBottom: 'none' } }}>
              <Typography sx={{ flex: 1, fontWeight: 600, color: T.ink }}>Registrele {year.year}</Typography>
              {year.hasPackage && (
                <Button size="small" variant="outlined" disabled={busy} onClick={() => void act(async () => download(await clientRegistersService.yearPackage(year.year), `Registre_${year.year}.zip`))}>
                  Descarcă
                </Button>
              )}
            </Stack>
          ))}
        </Paper>
      )}

      {!loading && !inventory && assets.length === 0 && years.length === 0 && (
        <Typography sx={{ color: T.textMuted }}>Nimic de confirmat.</Typography>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        {editing && (
          <>
            <DialogTitle>{editing.item.description}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                {editing.mode === 'adjust' && (
                  <TextField label="Valoarea reală (lei)" value={editing.value} onChange={(event) => setEditing({ ...editing, value: event.target.value })} autoFocus />
                )}
                <TextField
                  label="De ce?"
                  value={editing.note}
                  onChange={(event) => setEditing({ ...editing, note: event.target.value })}
                  multiline
                  minRows={2}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditing(null)}>Renunță</Button>
              <Button
                variant="contained"
                disabled={busy || (editing.mode === 'adjust' ? parse(editing.value) === null : !editing.note.trim())}
                onClick={async () => {
                  if (!toConfirm) return
                  const ok = await act(() =>
                    clientRegistersService.updateItem(toConfirm.id, editing.item.id, {
                      action: editing.mode === 'adjust' ? 'ADJUST' : 'REMOVE',
                      value: editing.mode === 'adjust' ? parse(editing.value) : null,
                      note: editing.note.trim() || null,
                    }),
                  )
                  if (ok) setEditing(null)
                }}
              >
                Salvează
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={adding !== null} onClose={() => setAdding(null)} fullWidth maxWidth="xs">
        {adding && (
          <>
            <DialogTitle>Adaugă un element</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField select label="Ce este" value={adding.category} onChange={(event) => setAdding({ ...adding, category: event.target.value as InventoryCategory })}>
                  {INVENTORY_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {INVENTORY_CATEGORY_LABEL[category]}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField label="Denumire" value={adding.description} onChange={(event) => setAdding({ ...adding, description: event.target.value })} />
                <TextField label="Valoare (lei)" value={adding.value} onChange={(event) => setAdding({ ...adding, value: event.target.value })} />
                <TextField label="De ce?" value={adding.note} onChange={(event) => setAdding({ ...adding, note: event.target.value })} />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAdding(null)}>Renunță</Button>
              <Button
                variant="contained"
                disabled={busy || !adding.description.trim() || parse(adding.value) === null}
                onClick={async () => {
                  if (!toConfirm) return
                  const ok = await act(() =>
                    clientRegistersService.addItem(toConfirm.id, {
                      category: adding.category,
                      description: adding.description.trim(),
                      value: parse(adding.value) ?? 0,
                      note: adding.note.trim() || null,
                    }),
                  )
                  if (ok) setAdding(null)
                }}
              >
                Adaugă
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  )
}
