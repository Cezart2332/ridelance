import { useState, type ReactNode } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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

import type { RuleResource } from '../../api/contract'
import type { RuleInput, Validity } from '../../api/types'
import { formatValidity, parseAmount } from '../../format'
import { EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useNotify } from '../notify'
import { errorMessage, useApi } from '../useApi'

type FormValue = string | boolean

export interface RuleField<T extends { id: string }> {
  key: keyof RuleInput<T> & string
  label: string
  kind: 'text' | 'number' | 'date' | 'bool' | 'select'
  options?: { value: string; label: string }[]
  /** Câmpul poate rămâne gol (devine `null`). */
  nullable?: boolean
  helperText?: string
  /** Afișat, dar needitabil (de ex. marcajul DE CONFIRMAT). */
  readOnly?: boolean
}

export interface RuleColumn<T extends { id: string }> {
  label: string
  render: (item: T) => ReactNode
  align?: 'right'
}

/** Regula fără `id`, ca intrare pentru `update`. */
function withoutId<T extends { id: string }>(item: T): RuleInput<T> {
  const copy: Record<string, unknown> = { ...item }
  delete copy.id
  return copy as RuleInput<T>
}

function toForm<T extends { id: string }>(fields: RuleField<T>[], item: Partial<RuleInput<T>>): Record<string, FormValue> {
  return Object.fromEntries(
    fields.map((field) => {
      const value = (item as Record<string, unknown>)[field.key]
      if (field.kind === 'bool') return [field.key, Boolean(value)]
      if (value === null || value === undefined) return [field.key, '']
      return [field.key, String(value).replace('.', field.kind === 'number' ? ',' : '.')]
    }),
  )
}

function fromForm<T extends { id: string }>(fields: RuleField<T>[], form: Record<string, FormValue>, base: Partial<RuleInput<T>>): { value: RuleInput<T> | null; error: string | null } {
  const result: Record<string, unknown> = { ...base }
  for (const field of fields) {
    if (field.readOnly) continue
    const raw = form[field.key]
    if (field.kind === 'bool') {
      result[field.key] = Boolean(raw)
      continue
    }
    const text = String(raw ?? '').trim()
    if (!text) {
      if (!field.nullable) return { value: null, error: `„${field.label}” e obligatoriu.` }
      result[field.key] = null
      continue
    }
    if (field.kind === 'number') {
      const number = parseAmount(text)
      if (number === null) return { value: null, error: `„${field.label}” nu e un număr valid.` }
      result[field.key] = number
    } else {
      result[field.key] = text
    }
  }
  return { value: result as RuleInput<T>, error: null }
}

/**
 * Un tabel de reguli fiscale versionate (§4.5): listă, adăugare, modificare și închidere prin
 * „Valabil până la”. Nu există ștergere. Suprapunerile le refuză API-ul, cu mesaj.
 */
export function RuleTable<T extends Validity & { id: string }>({
  title,
  description,
  resource,
  fields,
  columns,
  empty,
  prefill,
  onPrefillUsed,
}: {
  title: string
  description?: string
  resource: RuleResource<T>
  fields: RuleField<T>[]
  columns: RuleColumn<T>[]
  empty: RuleInput<T>
  /** Deschide direct formularul de adăugare, precompletat. */
  prefill?: Partial<RuleInput<T>> | null
  onPrefillUsed?: () => void
}) {
  const notify = useNotify()
  const rules = useApi(() => resource.list(), [title])
  const [editing, setEditing] = useState<{ item: T | null; form: Record<string, FormValue> } | null>(() =>
    prefill ? { item: null, form: toForm(fields, { ...empty, ...prefill }) } : null,
  )
  const [closing, setClosing] = useState<T | null>(null)
  const [closeDate, setCloseDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const openForm = (item: T | null) => {
    setError(null)
    setEditing({ item, form: toForm(fields, item ?? empty) })
  }

  const closeForm = () => {
    setEditing(null)
    setError(null)
    onPrefillUsed?.()
  }

  const save = async () => {
    if (!editing) return
    const base = editing.item ? withoutId(editing.item) : empty
    const { value, error: formError } = fromForm(fields, editing.form, base as Partial<RuleInput<T>>)
    if (!value) {
      setError(formError)
      return
    }
    setBusy(true)
    try {
      if (editing.item) await resource.update(editing.item.id, value)
      else await resource.create(value)
      notify(editing.item ? 'Regula a fost modificată.' : 'Regula a fost adăugată.', 'success')
      closeForm()
      rules.reload()
    } catch (saveError) {
      setError(errorMessage(saveError))
    } finally {
      setBusy(false)
    }
  }

  const closeRule = async () => {
    if (!closing) return
    setBusy(true)
    try {
      await resource.update(closing.id, { ...withoutId(closing), validTo: closeDate })
      notify('Regula a fost închisă.', 'success')
      setClosing(null)
      rules.reload()
    } catch (closeError) {
      setError(errorMessage(closeError))
    } finally {
      setBusy(false)
    }
  }

  const set = (key: string, value: FormValue) => setEditing((current) => current && { ...current, form: { ...current.form, [key]: value } })

  return (
    <Paper>
      <Stack direction="row" sx={{ px: 2.5, pt: 2.5, pb: 1.5, gap: 2, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Stack spacing={0.5}>
          <Typography variant="h2">{title}</Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Stack>
        <Button variant="contained" onClick={() => openForm(null)}>
          Adaugă
        </Button>
      </Stack>
      {rules.error && <ErrorBlock message={rules.error} onRetry={rules.reload} />}
      {!rules.data && !rules.error && <LoadingBlock />}
      {rules.data && rules.data.length === 0 && (
        <Stack sx={{ px: 2.5 }}>
          <EmptyText>Nicio regulă.</EmptyText>
        </Stack>
      )}
      {rules.data && rules.data.length > 0 && (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.label} align={column.align}>
                    {column.label}
                  </TableCell>
                ))}
                <TableCell>Valabilitate</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.data.map((item) => (
                <TableRow key={item.id} hover>
                  {columns.map((column) => (
                    <TableCell key={column.label} align={column.align}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatValidity(item.validFrom, item.validTo)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Button size="small" onClick={() => openForm(item)}>
                      Modifică
                    </Button>
                    {item.validTo === null && (
                      <Button
                        size="small"
                        onClick={() => {
                          setError(null)
                          setCloseDate(new Date().toISOString().slice(0, 10))
                          setClosing(item)
                        }}
                      >
                        Închide
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={editing !== null} onClose={closeForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editing?.item ? `Modifică: ${title}` : `Adaugă: ${title}`}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {editing?.item && (
              <Alert severity="info">
                Pentru o valoare nouă de la o anumită dată, închide regula actuală și adaugă alta; modificarea schimbă regula pe tot intervalul ei.
              </Alert>
            )}
            {editing &&
              fields.map((field) =>
                field.kind === 'bool' ? (
                  <FormControlLabel
                    key={field.key}
                    disabled={field.readOnly}
                    control={<Checkbox checked={Boolean(editing.form[field.key])} onChange={(event) => set(field.key, event.target.checked)} />}
                    label={field.label}
                  />
                ) : (
                  <TextField
                    key={field.key}
                    select={field.kind === 'select'}
                    type={field.kind === 'date' ? 'date' : 'text'}
                    label={`${field.label}${field.nullable ? ' (opțional)' : ''}`}
                    value={editing.form[field.key] as string}
                    disabled={field.readOnly}
                    helperText={field.helperText}
                    onChange={(event) => set(field.key, event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  >
                    {field.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ),
              )}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeForm} disabled={busy}>
            Renunță
          </Button>
          <Button variant="contained" onClick={save} disabled={busy}>
            {busy ? 'Se salvează…' : 'Salvează'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={closing !== null} onClose={() => setClosing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Închide regula</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2">Regula rămâne în istoric și se aplică până la data aleasă, inclusiv.</Typography>
            <TextField type="date" label="Valabil până la" value={closeDate} onChange={(event) => setCloseDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClosing(null)} disabled={busy}>
            Renunță
          </Button>
          <Button variant="contained" onClick={closeRule} disabled={busy || !closeDate}>
            Închide regula
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
