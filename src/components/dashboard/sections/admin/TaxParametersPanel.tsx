import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
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
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { TOKENS } from '../../../../constants/tokens'
import {
  adminTaxParametersService,
  type TaxParametersResponse,
  type TaxParametersValues,
} from '../../../../services/adminTaxParameters.service'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { SectionSkeleton } from '../../../admin'

/**
 * Plafoanele fiscale ale unui an, editabile de admin: salariul minim, pragurile CAS și CASS și
 * cotele. Implicit sunt cele din fișierul anului (ANAF); ce se salvează aici le înlocuiește
 * până la „Revino la valorile implicite".
 *
 * După salvare, estimările de taxe ale tuturor PFA-urilor se refac singure, iar aceleași valori
 * ajung în rezumatul din dashboard și în notificările de prag.
 */

type Field = keyof TaxParametersValues

interface FieldDef {
  key: Field
  label: string
  /** Câte salarii minime face pragul — pentru explicația de sub câmp și pentru „Recalculează". */
  wages?: number
  percent?: boolean
  helper: string
}

const AMOUNT_FIELDS: FieldDef[] = [
  { key: 'cassMinThreshold', label: 'CASS — plafon minim', wages: 6, helper: 'Sub el, CASS se plătește la plafonul minim.' },
  { key: 'casThreshold12', label: 'CAS — primul prag', wages: 12, helper: 'Peste el, CAS se datorează la 12 salarii.' },
  { key: 'casThreshold24', label: 'CAS — al doilea prag', wages: 24, helper: 'Peste el, CAS se datorează la 24 de salarii.' },
  { key: 'cassMaxBase', label: 'CASS — plafon maxim', wages: 72, helper: 'Peste el, CASS nu mai crește.' },
]

const RATE_FIELDS: FieldDef[] = [
  { key: 'casRate', label: 'Cota CAS', percent: true, helper: 'Contribuția la pensie.' },
  { key: 'cassRate', label: 'Cota CASS', percent: true, helper: 'Contribuția la sănătate.' },
  { key: 'incomeTaxRate', label: 'Impozit pe venit', percent: true, helper: 'Pe venitul net, după CAS și CASS.' },
  { key: 'carriedLossOffsetLimit', label: 'Pierderi reportate', percent: true, helper: 'Cât din venitul anului pot acoperi.' },
]

type Draft = Record<Field, string>

const lei = (value: number) => `${value.toLocaleString('ro-RO', { maximumFractionDigits: 2 })} lei`

function toDraft(v: TaxParametersValues): Draft {
  const draft = {} as Draft
  for (const key of Object.keys(v) as Field[]) {
    const isRate = RATE_FIELDS.some((f) => f.key === key)
    // Procentele se editează ca procente: 0,25 → „25".
    draft[key] = String(isRate ? Math.round(v[key] * 10000) / 100 : v[key])
  }
  return draft
}

const parse = (raw: string) => Number(raw.replace(/\s/g, '').replace(',', '.'))

function fromDraft(d: Draft): TaxParametersValues | null {
  const values = {} as TaxParametersValues
  for (const key of Object.keys(d) as Field[]) {
    const n = parse(d[key])
    if (!Number.isFinite(n)) return null
    values[key] = RATE_FIELDS.some((f) => f.key === key) ? n / 100 : n
  }
  return values
}

const EMPTY: TaxParametersValues = {
  minWageReference: 0,
  cassMinThreshold: 0,
  casThreshold12: 0,
  casThreshold24: 0,
  cassMaxBase: 0,
  casRate: 0.25,
  cassRate: 0.1,
  incomeTaxRate: 0.1,
  carriedLossOffsetLimit: 0.7,
}

export function TaxParametersPanel() {
  const [year, setYear] = useState<number | null>(null)
  const [data, setData] = useState<TaxParametersResponse | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'save' | 'reset' | null>(null)

  const apply = useCallback((response: TaxParametersResponse) => {
    setData(response)
    setYear(response.taxYear)
    setDraft(toDraft(response.current ?? EMPTY))
  }, [])

  const fail = (err: unknown) => setError(getErrorMessage(err, 'Nu am putut încărca plafoanele fiscale.'))

  /** Alt an: se cere din nou, fără să se piardă pagina. */
  const load = async (target: number) => {
    setLoading(true)
    setError(null)
    setSaved(null)
    try {
      apply(await adminTaxParametersService.get(target))
    } catch (err) {
      fail(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    adminTaxParametersService
      .get()
      .then((response) => !cancelled && apply(response))
      .catch((err: unknown) => !cancelled && setError(getErrorMessage(err, 'Nu am putut încărca plafoanele fiscale.')))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [apply])

  const values = useMemo(() => (draft ? fromDraft(draft) : null), [draft])
  const dirty = useMemo(() => {
    if (!data || !values) return false
    const base = data.current ?? EMPTY
    return (Object.keys(base) as Field[]).some((k) => Math.abs(base[k] - values[k]) > 1e-9)
  }, [data, values])

  const set = (key: Field, raw: string) => {
    setSaved(null)
    setDraft((d) => (d ? { ...d, [key]: raw } : d))
  }

  /** Pragurile legale sunt multipli de salariu minim; schimbarea salariului le mută pe toate. */
  const recalcFromMinWage = () => {
    const wage = parse(draft?.minWageReference ?? '')
    if (!Number.isFinite(wage) || wage <= 0) return
    setSaved(null)
    setDraft((d) => {
      if (!d) return d
      const next = { ...d }
      for (const f of AMOUNT_FIELDS) next[f.key] = String(wage * (f.wages ?? 1))
      return next
    })
  }

  /** Un an fără plafoane pornește de la cele ale anului precedent, nu de la zero. */
  const copyPreviousYear = async () => {
    if (!year) return
    try {
      const previous = await adminTaxParametersService.get(year - 1)
      if (previous.current) setDraft(toDraft(previous.current))
    } catch {
      setError('Nu am găsit plafoanele anului precedent.')
    }
  }

  const save = async () => {
    if (!year || !values) return
    setConfirm(null)
    setSaving(true)
    setError(null)
    try {
      const response = await adminTaxParametersService.save(year, values)
      setData(response)
      setDraft(toDraft(response.current ?? EMPTY))
      setSaved('Plafoanele au fost salvate. Estimările de taxe se recalculează automat în câteva minute.')
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut salva plafoanele.'))
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    if (!year) return
    setConfirm(null)
    setSaving(true)
    setError(null)
    try {
      const response = await adminTaxParametersService.reset(year)
      setData(response)
      setDraft(toDraft(response.current ?? EMPTY))
      setSaved('Am revenit la valorile implicite. Estimările se recalculează automat.')
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut reveni la valorile implicite.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading && !data) {
    return (
      <Paper sx={{ p: 2 }}>
        <SectionSkeleton rows={6} />
      </Paper>
    )
  }

  if (!data || !draft) {
    return <Alert severity="error">{error ?? 'Nu am putut încărca plafoanele fiscale.'}</Alert>
  }

  const wage = parse(draft.minWageReference)
  const defaults = data.defaults

  const renderField = (f: FieldDef) => {
    const current = parse(draft[f.key])
    const def = defaults?.[f.key]
    const defDisplay = def === undefined ? null : f.percent ? `${Math.round(def * 10000) / 100}%` : lei(def)
    const changed = def !== undefined && Number.isFinite(current) && Math.abs((f.percent ? current / 100 : current) - def) > 1e-9
    const multiple = f.wages && Number.isFinite(wage) && wage > 0 ? current / wage : null

    const hints = [
      f.helper.replace(/\.$/, ''),
      multiple !== null && Number.isFinite(multiple) ? `= ${Math.round(multiple * 100) / 100} salarii minime` : null,
      changed && defDisplay ? `Implicit: ${defDisplay}` : null,
    ].filter(Boolean)

    return (
      <TextField
        key={f.key}
        label={f.label}
        value={draft[f.key]}
        onChange={(e) => set(f.key, e.target.value)}
        inputMode="decimal"
        size="small"
        fullWidth
        disabled={saving}
        helperText={hints.join(' · ')}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: `${TOKENS.radius.md}px`,
            backgroundColor: changed ? alpha(TOKENS.primary, 0.05) : TOKENS.paper,
          },
        }}
        slotProps={{
          input: { endAdornment: <InputAdornment position="end">{f.percent ? '%' : 'lei'}</InputAdornment> },
        }}
      />
    )
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: `${TOKENS.radius.lg}px`,
        border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
        bgcolor: TOKENS.paper,
      }}
    >
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 650, color: TOKENS.ink, lineHeight: 1.2 }}>
              Plafoane fiscale
            </Typography>
            <Typography variant="body2" sx={{ color: TOKENS.textMuted, mt: 0.4, maxWidth: 640 }}>
              Salariul minim, pragurile CAS și CASS și cotele folosite la taxele estimate, în rezumatul din dashboard și
              în notificările de prag.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              size="small"
              label={data.isOverridden ? `Modificat din admin${data.updatedAtUtc ? ` · ${new Date(data.updatedAtUtc).toLocaleDateString('ro-RO')}` : ''}` : data.current ? 'Valori implicite (ANAF)' : 'Fără plafoane'}
              sx={{
                fontWeight: 700,
                color: data.isOverridden ? TOKENS.primaryStrong : TOKENS.textMuted,
                bgcolor: data.isOverridden ? alpha(TOKENS.primary, 0.1) : alpha(TOKENS.ink, 0.05),
              }}
            />
            <TextField
              select
              size="small"
              label="An fiscal"
              value={year ?? ''}
              onChange={(e) => void load(Number(e.target.value))}
              disabled={saving}
              sx={{ minWidth: 120 }}
            >
              {data.availableYears.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        {!data.current && (
          <Alert
            severity="info"
            action={
              <Button onClick={() => void copyPreviousYear()} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Pornește de la {data.taxYear - 1}
              </Button>
            }
          >
            {data.taxYear} nu are încă plafoane. Până le salvezi, estimările pe {data.taxYear} rămân indisponibile.
          </Alert>
        )}

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: TOKENS.ink, mb: 1.2 }}>
            Salariul minim de referință
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'flex-start' } }}>
            <Box sx={{ flex: 1, maxWidth: { sm: 320 } }}>
              {renderField({ key: 'minWageReference', label: 'Salariul minim brut', helper: 'Pe lună, cel folosit pentru plafoane.' })}
            </Box>
            <Button
              variant="outlined"
              startIcon={<CalculateRoundedIcon />}
              onClick={recalcFromMinWage}
              disabled={saving || !(wage > 0)}
              sx={{ textTransform: 'none', fontWeight: 700, mt: { sm: 0.25 } }}
            >
              Recalculează plafoanele din salariu
            </Button>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: TOKENS.ink, mb: 1.2 }}>
            Plafoane
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
            {AMOUNT_FIELDS.map(renderField)}
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: TOKENS.ink, mb: 1.2 }}>
            Cote
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
            {RATE_FIELDS.map(renderField)}
          </Box>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {saved && <Alert severity="success">{saved}</Alert>}

        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
          {data.isOverridden && data.defaults ? (
            <Button
              startIcon={<RestartAltRoundedIcon />}
              onClick={() => setConfirm('reset')}
              disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 700, color: TOKENS.textMuted }}
            >
              Revino la valorile implicite
            </Button>
          ) : (
            <span />
          )}
          <Stack direction="row" spacing={1.5}>
            {dirty && (
              <Button
                onClick={() => setDraft(toDraft(data.current ?? EMPTY))}
                disabled={saving}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Anulează
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() => setConfirm('save')}
              disabled={saving || !dirty || !values}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
            >
              Salvează plafoanele
            </Button>
          </Stack>
        </Stack>
      </Stack>

      <Dialog open={confirm !== null} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirm === 'reset' ? `Revii la plafoanele implicite pe ${year}?` : `Salvezi plafoanele pe ${year}?`}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
            Taxele estimate ale tuturor PFA-urilor se recalculează cu noile valori, iar clienții le văd în „Cât să pui
            deoparte" în câteva minute.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)} sx={{ textTransform: 'none' }}>
            Renunță
          </Button>
          <Button
            variant="contained"
            onClick={() => void (confirm === 'reset' ? reset() : save())}
            sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
          >
            {confirm === 'reset' ? 'Revino la implicite' : 'Salvează'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
