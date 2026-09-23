import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, CircularProgress, InputAdornment, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded'

import { priorPeriodService, type PriorPeriod, type StaffMode } from '../../services/estimatedTaxes.service'
import { announceFiscalProfileChanged, currentTaxYear } from '../../services/fiscalProfile.service'
import { ROMANIAN_MONTHS } from '../../utils/monthLabels'
import { getErrorMessage } from '../../utils/errorHandler'
import { formatLei } from './texts'

type Draft = Record<number, { income: string; expenses: string }>

function toDraft(period: PriorPeriod): Draft {
  return Object.fromEntries(
    period.months.map((m) => [
      m.month,
      { income: m.income == null ? '' : String(m.income), expenses: m.expenses == null ? '' : String(m.expenses) },
    ]),
  )
}

function parseAmount(value: string): number | null | 'invalid' {
  const trimmed = value.trim().replace(',', '.')
  if (trimmed === '') return null
  const amount = Number(trimmed)
  return Number.isFinite(amount) && amount >= 0 ? amount : 'invalid'
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('ro-RO')
}

/**
 * Veniturile și cheltuielile lunilor de dinainte ca PFA-ul să intre în RIDElance, trecute de
 * contabil sau admin. Până le completează, taxele anului se estimează din media lunilor cunoscute.
 */
export function PriorPeriodPanel({ mode, pfaId }: { mode: StaffMode; pfaId: string }) {
  const taxYear = currentTaxYear()
  const [period, setPeriod] = useState<PriorPeriod | null>(null)
  const [draft, setDraft] = useState<Draft>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    priorPeriodService
      .get(mode, pfaId, taxYear)
      .then((loaded) => {
        if (cancelled) return
        setPeriod(loaded)
        setDraft(toDraft(loaded))
      })
      .catch((err: unknown) => !cancelled && setError(getErrorMessage(err, 'Nu am putut încărca perioada de dinainte de RIDElance.')))
    return () => {
      cancelled = true
    }
  }, [mode, pfaId, taxYear])

  const changes = useMemo(() => {
    if (!period) return []
    return period.months
      .map((m) => ({ month: m, income: parseAmount(draft[m.month]?.income ?? ''), expenses: parseAmount(draft[m.month]?.expenses ?? '') }))
      .filter(({ month, income, expenses }) => income !== month.income || expenses !== month.expenses)
  }, [period, draft])

  const invalid = changes.some((c) => c.income === 'invalid' || c.expenses === 'invalid')
  const filled = period?.months.filter((m) => m.income != null || m.expenses != null).length ?? 0

  const save = async () => {
    if (invalid) {
      setError('Sumele trebuie să fie numere pozitive.')
      return
    }
    setBusy(true)
    setSaved(false)
    try {
      const updated = await priorPeriodService.save(
        mode,
        pfaId,
        taxYear,
        changes.map((c) => ({ month: c.month.month, income: c.income as number | null, expenses: c.expenses as number | null })),
      )
      setPeriod(updated)
      setDraft(toDraft(updated))
      setError(null)
      setSaved(true)
      // Cardul „Cât să pui deoparte” de alături își recitește estimările.
      announceFiscalProfileChanged()
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut salva.'))
    } finally {
      setBusy(false)
    }
  }

  const setField = (month: number, field: 'income' | 'expenses', value: string) => {
    setSaved(false)
    setDraft((prev) => ({ ...prev, [month]: { ...(prev[month] ?? { income: '', expenses: '' }), [field]: value } }))
  }

  return (
    <Box
      component="section"
      aria-labelledby="prior-period-title"
      data-testid="prior-period-panel"
      sx={(theme) => ({ bgcolor: 'background.paper', borderRadius: 2, boxShadow: theme.shadows[1], p: { xs: 2, sm: 3 }, minWidth: 0 })}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
        <Box
          aria-hidden
          sx={(theme) => ({
            width: 32,
            height: 32,
            borderRadius: 1,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
          })}
        >
          <HistoryEduRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography id="prior-period-title" variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
          Perioada dinainte de RIDElance · {taxYear}
        </Typography>
        {period && period.months.length > 0 && (
          <Chip
            size="small"
            variant="outlined"
            color={filled === period.months.length ? 'success' : 'warning'}
            label={`${filled} din ${period.months.length} luni completate`}
            sx={{ fontWeight: 700 }}
          />
        )}
      </Stack>

      {!period && !error && (
        <Box sx={{ mt: 1.5 }}>
          <Skeleton variant="text" />
          <Skeleton variant="rounded" height={120} sx={{ mt: 1 }} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}

      {period && period.months.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Clientul e în RIDElance din tot anul fiscal {taxYear}: nu e nimic de completat.
        </Typography>
      )}

      {period && period.months.length > 0 && (
        <>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {period.joinedOn ? `Clientul a intrat în RIDElance pe ${formatDate(period.joinedOn)}. ` : ''}
            Trece venitul brut și cheltuielile deductibile ale fiecărei luni din registrul de încasări și plăți. Suma unei luni
            înlocuiește ce avem în RIDElance pentru luna respectivă, nu se adună. O lună fără activitate se trece cu 0; până completezi,
            estimăm lunile lipsă din media celorlalte.
          </Typography>

          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mt: 2, display: 'grid', gap: 1 }}>
            {period.months.map((m) => {
              const row = draft[m.month] ?? { income: '', expenses: '' }
              const incomeInvalid = parseAmount(row.income) === 'invalid'
              const expensesInvalid = parseAmount(row.expenses) === 'invalid'
              return (
                <Box
                  component="li"
                  key={m.month}
                  sx={(theme) => ({
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '160px 1fr 1fr' },
                    gap: 1,
                    alignItems: 'center',
                    p: 1.25,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {ROMANIAN_MONTHS[m.month - 1]}
                    </Typography>
                    {m.joinMonth && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Luna intrării în RIDElance
                      </Typography>
                    )}
                    {(m.platformIncome > 0 || m.platformExpenses > 0) && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        În RIDElance: {formatLei(m.platformIncome)} venit
                        {m.platformExpenses > 0 ? ` · ${formatLei(m.platformExpenses)} cheltuieli` : ''}
                      </Typography>
                    )}
                  </Box>
                  <TextField
                    size="small"
                    label="Venit brut"
                    value={row.income}
                    onChange={(e) => setField(m.month, 'income', e.target.value)}
                    error={incomeInvalid}
                    slotProps={{
                      htmlInput: { inputMode: 'decimal', 'aria-label': `Venit brut ${ROMANIAN_MONTHS[m.month - 1]}` },
                      input: { endAdornment: <InputAdornment position="end">lei</InputAdornment> },
                    }}
                  />
                  <TextField
                    size="small"
                    label="Cheltuieli"
                    value={row.expenses}
                    onChange={(e) => setField(m.month, 'expenses', e.target.value)}
                    error={expensesInvalid}
                    slotProps={{
                      htmlInput: { inputMode: 'decimal', 'aria-label': `Cheltuieli deductibile ${ROMANIAN_MONTHS[m.month - 1]}` },
                      input: { endAdornment: <InputAdornment position="end">lei</InputAdornment> },
                    }}
                  />
                </Box>
              )
            })}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, alignItems: { sm: 'center' } }}>
            <Button variant="contained" onClick={() => void save()} disabled={busy || changes.length === 0 || invalid}>
              {busy ? <CircularProgress size={20} color="inherit" /> : 'Salvează și recalculează'}
            </Button>
            {saved && (
              <Typography variant="body2" role="status" sx={{ color: 'success.main', fontWeight: 600 }}>
                Salvat. Taxele estimate se recalculează.
              </Typography>
            )}
          </Stack>
        </>
      )}
    </Box>
  )
}
