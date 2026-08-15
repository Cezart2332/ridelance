import { useRef, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'

import { DASHBOARD_TOKENS, dashboardInputSx } from '../../dashboardTheme'
import { documentService } from '../../../../services/document.service'
import { expenseService, type DeductibleExpense } from '../../../../services/expense.service'
import {
  deductibleExpenseOptions,
  type DeductibleExpenseOption,
} from '../../../../utils/deductibleExpenseCatalog'
import { getErrorMessage } from '../../../../utils/errorHandler'

type Step = 'pick-file' | 'extracting' | 'confirm'

interface FormState {
  option: DeductibleExpenseOption | null
  supplierName: string
  expenseDate: string
  amount: string
  vat: string
  documentTypeLabel: string
}

const EMPTY_FORM: FormState = {
  option: null,
  supplierName: '',
  expenseDate: '',
  amount: '',
  vat: '',
  documentTypeLabel: '',
}

/** Câte încercări de citire a extragerii, la 1,5s — jobul AI rulează asincron. */
const POLL_ATTEMPTS = 12
const POLL_DELAY_MS = 1500

const toNumber = (value: string): number | null => {
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/** Data de pe document decide luna contabilă; fără ea, luna curentă. */
function periodFrom(expenseDate: string): { year: number; month: number } {
  const date = expenseDate ? new Date(expenseDate) : new Date()
  const valid = Number.isNaN(date.getTime()) ? new Date() : date
  return { year: valid.getFullYear(), month: valid.getMonth() + 1 }
}

/**
 * Fluxul din spec §7.2: încarci documentul, OCR-ul citește, tu confirmi.
 *
 * Extragerea eșuată nu blochează nimic — formularul rămâne complet editabil, iar cheltuiala
 * se salvează la fel. OCR-ul e o scutire de tastat, nu o condiție.
 *
 * Se montează doar cât e deschis (vezi `ExpensesPage`), deci starea pornește curată de
 * fiecare dată, fără efect care să o reseteze.
 */
export function AddExpenseDialog({
  pfaRegistrationId,
  onClose,
  onSaved,
}: {
  pfaRegistrationId: string | null
  onClose: () => void
  onSaved: (expense: DeductibleExpense) => void
}) {
  const [step, setStep] = useState<Step>('pick-file')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [draft, setDraft] = useState<DeductibleExpense | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = async (file: File) => {
    if (!pfaRegistrationId) return
    setStep('extracting')
    setError(null)
    setNotice(null)

    try {
      // Cheltuiala se creează fără sumă: rămâne ciornă până la confirmare, deci nu atinge
      // niciun calcul cât timp datele sunt încă ale modelului, nu ale omului.
      const created = await expenseService.createForPfa(pfaRegistrationId, {
        catalogCategory: 'Nedefinit',
        itemName: file.name,
        deductibleLabel: '100%',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        file,
      })
      setDraft(created)

      const extracted = await pollExtraction(created.documentId)
      if (extracted) {
        setForm((prev) => ({ ...prev, ...extracted }))
      } else {
        setNotice('Nu am putut citi automat documentul. Completează câmpurile manual.')
      }
    } catch (cause) {
      setError(getErrorMessage(cause, 'Documentul nu a putut fi încărcat.'))
    } finally {
      setStep('confirm')
    }
  }

  const handleSave = async () => {
    if (!pfaRegistrationId || !draft) return

    const amount = toNumber(form.amount)
    const vat = toNumber(form.vat)

    if (amount === null) {
      setError('Completează suma totală ca să poți confirma cheltuiala.')
      return
    }
    if (vat !== null && vat > amount) {
      setError('TVA-ul nu poate depăși suma totală.')
      return
    }
    if (!form.option) {
      setError('Alege categoria cheltuielii.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const period = periodFrom(form.expenseDate)
      const saved = await expenseService.updateForPfa(pfaRegistrationId, draft.id, {
        catalogCategory: form.option.category,
        itemName: form.option.name,
        deductibleLabel: form.option.deductible,
        amountRon: amount,
        year: period.year,
        month: period.month,
        expenseDate: form.expenseDate || null,
        supplierName: form.supplierName || null,
        vatAmount: vat,
        documentTypeLabel: form.documentTypeLabel || null,
        confirm: true,
      })
      onSaved(saved)
      onClose()
    } catch (cause) {
      setError(getErrorMessage(cause, 'Cheltuiala nu a putut fi salvată.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Adaugă cheltuială</DialogTitle>

      <DialogContent>
        {step === 'pick-file' && (
          <Stack spacing={2} sx={{ alignItems: 'center', py: 3, textAlign: 'center' }}>
            <UploadFileRoundedIcon sx={{ fontSize: 40, color: DASHBOARD_TOKENS.primaryStrong }} />
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
              Încarcă bonul, factura sau chitanța. Citim automat data, furnizorul, suma și TVA-ul,
              iar tu doar confirmi.
            </Typography>
            <input
              ref={inputRef}
              type="file"
              hidden
              accept="image/*,application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleFile(file)
                event.target.value = ''
              }}
            />
            <Button
              variant="contained"
              onClick={() => inputRef.current?.click()}
              disabled={!pfaRegistrationId}
              sx={{
                textTransform: 'none',
                fontWeight: 750,
                borderRadius: DASHBOARD_TOKENS.radius.full,
                px: 3,
                bgcolor: DASHBOARD_TOKENS.primary,
                color: DASHBOARD_TOKENS.ink,
                boxShadow: 'none',
                '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' },
              }}
            >
              Alege document
            </Button>
          </Stack>
        )}

        {step === 'extracting' && (
          <Stack spacing={2} sx={{ alignItems: 'center', py: 5 }}>
            <CircularProgress size={30} sx={{ color: DASHBOARD_TOKENS.primary }} />
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
              Citim documentul…
            </Typography>
          </Stack>
        )}

        {step === 'confirm' && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {notice && (
              <Alert severity="info" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md }}>
                {notice}
              </Alert>
            )}

            <Autocomplete
              options={deductibleExpenseOptions}
              value={form.option}
              onChange={(_, option) => setForm((prev) => ({ ...prev, option }))}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => (
                <TextField {...params} label="Categorie" size="small" sx={dashboardInputSx} />
              )}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Data documentului"
                type="date"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={form.expenseDate}
                onChange={(e) => setForm((prev) => ({ ...prev, expenseDate: e.target.value }))}
                sx={dashboardInputSx}
              />
              <TextField
                label="Furnizor"
                size="small"
                value={form.supplierName}
                onChange={(e) => setForm((prev) => ({ ...prev, supplierName: e.target.value }))}
                sx={dashboardInputSx}
              />
              <TextField
                label="Sumă totală (lei)"
                size="small"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                sx={dashboardInputSx}
              />
              <TextField
                label="TVA (lei)"
                size="small"
                value={form.vat}
                onChange={(e) => setForm((prev) => ({ ...prev, vat: e.target.value }))}
                sx={dashboardInputSx}
              />
              <TextField
                label="Tip document"
                size="small"
                placeholder="Bon fiscal, factură…"
                value={form.documentTypeLabel}
                onChange={(e) => setForm((prev) => ({ ...prev, documentTypeLabel: e.target.value }))}
                sx={dashboardInputSx}
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md }}>
                {error}
              </Alert>
            )}
          </Stack>
        )}

        {step !== 'confirm' && error && (
          <Alert severity="error" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Renunță
        </Button>
        {step === 'confirm' && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !draft}
            sx={{
              textTransform: 'none',
              fontWeight: 750,
              borderRadius: DASHBOARD_TOKENS.radius.full,
              px: 3,
              bgcolor: DASHBOARD_TOKENS.primary,
              color: DASHBOARD_TOKENS.ink,
              boxShadow: 'none',
              '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' },
            }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Confirmă cheltuiala'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

/**
 * Jobul de extragere rulează asincron după upload, deci se așteaptă puțin. Dacă nu vine nimic
 * util, funcția întoarce null și formularul rămâne gol — nu se inventează valori.
 */
async function pollExtraction(documentId: string): Promise<Partial<FormState> | null> {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    try {
      const response = await documentService.getExtractedFields(documentId)
      const values = new Map(response.fields.map((field) => [field.fieldKey, field.effectiveValue]))

      if (values.size > 0) {
        return {
          supplierName: values.get('supplier_name') ?? '',
          expenseDate: values.get('document_date') ?? '',
          amount: values.get('total_amount') ?? '',
          vat: values.get('vat_amount') ?? '',
          documentTypeLabel: values.get('document_type') ?? '',
        }
      }
    } catch {
      // 404 cât timp extragerea nu s-a încheiat — se reîncearcă.
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS))
  }

  return null
}
