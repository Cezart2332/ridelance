import { useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, CircularProgress, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'

import {
  FISCAL_PROFILE_CHANGED,
  announceFiscalProfileChanged,
  currentTaxYear,
  fiscalProfileService,
  type StaffTaxInputs,
  type StaffTaxInputValues,
} from '../../services/fiscalProfile.service'
import { getErrorMessage } from '../../utils/errorHandler'

type Draft = Record<'otherIndependentNetAnnual' | 'carriedLossesAmount' | 'cassOptInBase' | 'otherIncomeCassInsured', string>

function toDraft(data: StaffTaxInputs): Draft {
  const text = (value: number | null) => (value == null ? '' : String(value))
  return {
    otherIndependentNetAnnual: text(data.otherIndependentNetAnnual),
    carriedLossesAmount: text(data.carriedLossesAmount),
    cassOptInBase: text(data.cassOptInBase),
    otherIncomeCassInsured: data.otherIncomeCassInsured ?? '',
  }
}

function parseAmount(value: string): number | null | 'invalid' {
  const trimmed = value.trim().replace(',', '.')
  if (trimmed === '') return null
  const amount = Number(trimmed)
  return Number.isFinite(amount) && amount >= 0 ? amount : 'invalid'
}

/**
 * Ce completează contabilul din evidența lui ca taxele să se poată calcula. PFA-ul răspunde în
 * profil doar cu Da/Nu; secțiunea apare numai pentru întrebările la care a spus „Da”.
 */
export function StaffTaxInputsPanel({ mode, pfaId }: { mode: 'admin' | 'accounting'; pfaId: string }) {
  const taxYear = currentTaxYear()
  const [data, setData] = useState<StaffTaxInputs | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    fiscalProfileService
      .staffInputs(mode, taxYear, pfaId)
      .then((loaded) => {
        if (cancelled) return
        setData(loaded)
        setDraft(toDraft(loaded))
      })
      .catch((err: unknown) => !cancelled && setError(getErrorMessage(err, 'Nu am putut încărca datele de completat.')))
    return () => {
      cancelled = true
    }
  }, [mode, taxYear, pfaId, reloadToken])

  // PFA-ul (sau altcineva) a schimbat profilul: alte întrebări pot fi acum cu „Da”, iar revizia e nouă.
  useEffect(() => {
    const reload = () => setReloadToken((t) => t + 1)
    window.addEventListener(FISCAL_PROFILE_CHANGED, reload)
    return () => window.removeEventListener(FISCAL_PROFILE_CHANGED, reload)
  }, [])

  if (!data || !draft) {
    return error ? <Alert severity="error">{error}</Alert> : null
  }

  const fields = [
    data.askOtherIndependentNetAnnual && {
      key: 'otherIndependentNetAnnual' as const,
      label: `Venit net ${taxYear} din celelalte activități independente`,
      help: 'Venitul minus cheltuielile, pe tot anul. Intră în plafonul CAS. Poate fi 0.',
    },
    data.askCarriedLossesAmount && {
      key: 'carriedLossesAmount' as const,
      label: `Pierderi reportate de recuperat în ${taxYear}`,
      help: 'Pierderea rămasă, din Declarația unică. Scade din baza impozitului, cel mult 70% din net.',
    },
    data.askCassOptInBase && {
      key: 'cassOptInBase' as const,
      label: 'Baza aleasă pentru CASS (lei/an)',
      help: 'Din Declarația unică: baza pe care PFA-ul a optat să plătească CASS.',
    },
  ].filter((field): field is { key: 'otherIndependentNetAnnual' | 'carriedLossesAmount' | 'cassOptInBase'; label: string; help: string } => !!field)

  if (fields.length === 0 && !data.askOtherIncomeCassInsured) return null

  const values: StaffTaxInputValues = {
    otherIndependentNetAnnual: data.askOtherIndependentNetAnnual ? parseAmountOrNull(draft.otherIndependentNetAnnual) : null,
    carriedLossesAmount: data.askCarriedLossesAmount ? parseAmountOrNull(draft.carriedLossesAmount) : null,
    cassOptInBase: data.askCassOptInBase ? parseAmountOrNull(draft.cassOptInBase) : null,
    otherIncomeCassInsured: data.askOtherIncomeCassInsured && draft.otherIncomeCassInsured ? draft.otherIncomeCassInsured : null,
  }
  const invalid = fields.some((f) => parseAmount(draft[f.key]) === 'invalid')
  const dirty =
    values.otherIndependentNetAnnual !== data.otherIndependentNetAnnual ||
    values.carriedLossesAmount !== data.carriedLossesAmount ||
    values.cassOptInBase !== data.cassOptInBase ||
    values.otherIncomeCassInsured !== data.otherIncomeCassInsured
  const needed = fields.length + (data.askOtherIncomeCassInsured ? 1 : 0)
  const filled =
    fields.filter((f) => data[f.key] != null).length + (data.askOtherIncomeCassInsured && data.otherIncomeCassInsured ? 1 : 0)

  const save = async () => {
    setBusy(true)
    setSaved(false)
    try {
      const updated = await fiscalProfileService.saveStaffInputs(mode, taxYear, pfaId, values, data.revision)
      setData(updated)
      setDraft(toDraft(updated))
      setError(null)
      setSaved(true)
      // Cardul de taxe și profilul de alături se recitesc (revizie nouă, calcul nou).
      announceFiscalProfileChanged()
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setError(
        status === 409 || status === 412
          ? 'Profilul s-a schimbat între timp. Am reîncărcat datele; verifică și salvează din nou.'
          : getErrorMessage(err, 'Nu am putut salva.'),
      )
      if (status === 409 || status === 412) setReloadToken((t) => t + 1)
    } finally {
      setBusy(false)
    }
  }

  const set = (key: keyof Draft, value: string) => {
    setSaved(false)
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  return (
    <Box
      component="section"
      aria-labelledby="staff-tax-inputs-title"
      data-testid="staff-tax-inputs-panel"
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
          <FactCheckRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography id="staff-tax-inputs-title" variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
          De completat de contabil · {taxYear}
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          color={filled === needed ? 'success' : 'warning'}
          label={filled === needed ? 'Complet' : `${needed - filled} de completat`}
          sx={{ fontWeight: 700 }}
        />
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
        Clientul a răspuns „Da” în profilul fiscal. Completează din evidența ta; până atunci, taxele care depind de
        aceste date rămân „De clarificat”. Clientul nu vede și nu poate schimba câmpurile.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2} sx={{ mt: 2 }}>
        {fields.map((field) => (
          <TextField
            key={field.key}
            size="small"
            label={field.label}
            helperText={parseAmount(draft[field.key]) === 'invalid' ? 'Suma trebuie să fie un număr pozitiv.' : field.help}
            error={parseAmount(draft[field.key]) === 'invalid'}
            value={draft[field.key]}
            onChange={(e) => set(field.key, e.target.value)}
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
              input: { endAdornment: <InputAdornment position="end">lei</InputAdornment> },
            }}
          />
        ))}
        {data.askOtherIncomeCassInsured && (
          <TextField
            select
            size="small"
            label="Plătește deja CASS pentru chirii, dividende, investiții?"
            helperText="Dacă da, CASS pentru PFA nu se mai completează până la minim."
            value={draft.otherIncomeCassInsured}
            onChange={(e) => set('otherIncomeCassInsured', e.target.value)}
          >
            <MenuItem value="">Necompletat</MenuItem>
            <MenuItem value="yes">Da</MenuItem>
            <MenuItem value="no">Nu</MenuItem>
          </TextField>
        )}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, alignItems: { sm: 'center' } }}>
        <Button variant="contained" onClick={() => void save()} disabled={busy || !dirty || invalid}>
          {busy ? <CircularProgress size={20} color="inherit" /> : 'Salvează și recalculează'}
        </Button>
        {saved && (
          <Typography variant="body2" role="status" sx={{ color: 'success.main', fontWeight: 600 }}>
            Salvat. Taxele estimate se recalculează.
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

function parseAmountOrNull(value: string): number | null {
  const amount = parseAmount(value)
  return amount === 'invalid' ? null : amount
}
