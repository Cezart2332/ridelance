import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'

import { invoicesService, type OblioConnection } from '../../../services/invoices.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'
import { Amount } from '../ui'

/**
 * Emiterea unei facturi fără a intra în Oblio.
 *
 * Formularul cere exact ce cere Oblio ca să numeroteze documentul, nimic în plus. Seria, numărul
 * și data nu se aleg aici: seria e a proprietarului, iar numărul îl dă Oblio, în ordinea lui — un
 * număr ales de noi ar fi rupt continuitatea seriei.
 *
 * CUI-ul precompletează restul din registrul ANAF. Transcrise de mână, denumirea și adresa ajung
 * greșite pe un document care nu se mai poate corecta decât prin storno.
 */

/** Cotele din România, cu eticheta pe care o cere Oblio pentru fiecare. */
const VAT_RATES = [21, 11, 9, 5, 0]

const DUE_OPTIONS = [
  { days: 0, label: 'Fără scadență' },
  { days: 5, label: '5 zile' },
  { days: 15, label: '15 zile' },
  { days: 30, label: '30 de zile' },
  { days: 60, label: '60 de zile' },
]

const UNITS = ['buc', 'ora', 'zi', 'luna', 'km', 'serviciu']

interface DraftLine {
  id: string
  name: string
  quantity: string
  price: string
  unit: string
  vat: number
}

const emptyLine = (): DraftLine => ({
  id: crypto.randomUUID(),
  name: '',
  quantity: '1',
  price: '',
  unit: 'buc',
  vat: 21,
})

const toNumber = (value: string): number => {
  const parsed = Number(value.trim().replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

export function NewInvoiceDialog({
  open,
  connection,
  onClose,
  onIssued,
}: {
  open: boolean
  connection: OblioConnection
  onClose: () => void
  onIssued: () => void
}) {
  const [cif, setCif] = useState('')
  const [clientName, setClientName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [county, setCounty] = useState('')
  const [series, setSeries] = useState(connection.seriesName ?? connection.availableSeries[0] ?? '')
  const [dueDays, setDueDays] = useState(30)
  const [note, setNote] = useState('')
  const [sendToSpv, setSendToSpv] = useState(false)
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()])

  const [looking, setLooking] = useState(false)
  const [lookupNote, setLookupNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const patchLine = (id: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  const noSeries = connection.availableSeries.length === 0

  const total = lines.reduce((sum, line) => sum + toNumber(line.quantity) * toNumber(line.price), 0)

  const lookup = async () => {
    if (cif.trim().length === 0) return
    setLooking(true)
    setLookupNote(null)
    const company = await invoicesService.lookupCompany(cif)
    setLooking(false)

    if (!company) {
      setLookupNote('Nu am găsit firma în registrul ANAF. Completează datele manual.')
      return
    }

    setClientName(company.name)
    if (company.address) setAddress(company.address)
    if (company.city) setCity(company.city)
    if (company.county) setCounty(company.county)
    setLookupNote(
      company.vatPayer
        ? 'Firmă găsită — plătitoare de TVA.'
        : 'Firmă găsită — neplătitoare de TVA. Verifică dacă factura poartă TVA.',
    )
  }

  const issue = async () => {
    setSaving(true)
    setError(null)
    try {
      await invoicesService.issue({
        seriesName: series,
        clientName: clientName.trim(),
        clientCif: cif.trim() || null,
        clientEmail: email.trim() || null,
        clientAddress: address.trim() || null,
        clientCity: city.trim() || null,
        clientState: county.trim() || null,
        dueDateDays: dueDays,
        note: note.trim() || null,
        sendToSpv,
        lines: lines.map((line) => ({
          name: line.name.trim(),
          quantity: toNumber(line.quantity),
          priceBani: Math.round(toNumber(line.price) * 100),
          measuringUnit: line.unit,
          vatPercent: line.vat,
          vatIncluded: false,
        })),
      })
      onIssued()
      onClose()
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(detail ?? 'Nu am putut emite factura. Verifică datele și încearcă din nou.')
    } finally {
      setSaving(false)
    }
  }

  const canIssue =
    clientName.trim().length > 0 &&
    series.length > 0 &&
    lines.length > 0 &&
    lines.every((line) => line.name.trim().length > 0 && toNumber(line.quantity) > 0 && toNumber(line.price) > 0)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Factură nouă
        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
              {error}
            </Alert>
          )}

          <SectionLabel>Client</SectionLabel>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="CUI"
              value={cif}
              onChange={(e) => setCif(e.target.value)}
              onBlur={() => void lookup()}
              size="small"
              sx={{ ...dashboardInputSx, flex: 1 }}
              placeholder="RO12345678"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {looking ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Button size="small" onClick={() => void lookup()} sx={{ textTransform: 'none', fontWeight: 700 }}>
                          Caută
                        </Button>
                      )}
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Denumire client"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              size="small"
              sx={{ ...dashboardInputSx, flex: 2 }}
            />
          </Stack>

          {lookupNote && (
            <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted, mt: -1 }}>
              {lookupNote}
            </Typography>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} size="small" sx={{ ...dashboardInputSx, flex: 1 }} helperText="Completat, Oblio trimite factura pe el." />
            <TextField label="Adresă" value={address} onChange={(e) => setAddress(e.target.value)} size="small" sx={{ ...dashboardInputSx, flex: 1 }} />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Localitate" value={city} onChange={(e) => setCity(e.target.value)} size="small" sx={{ ...dashboardInputSx, flex: 1 }} />
            <TextField label="Județ" value={county} onChange={(e) => setCounty(e.target.value)} size="small" sx={{ ...dashboardInputSx, flex: 1 }} />
          </Stack>

          <Divider />
          <SectionLabel>Produse și servicii</SectionLabel>

          {lines.map((line) => (
            <Stack key={line.id} direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
              <TextField label="Denumire" required value={line.name} onChange={(e) => patchLine(line.id, { name: e.target.value })} size="small" sx={{ ...dashboardInputSx, flex: 3 }} />
              <TextField label="Cant." value={line.quantity} onChange={(e) => patchLine(line.id, { quantity: e.target.value })} size="small" sx={{ ...dashboardInputSx, width: { xs: '100%', md: 90 } }} />
              <TextField select label="UM" value={line.unit} onChange={(e) => patchLine(line.id, { unit: e.target.value })} size="small" sx={{ ...dashboardInputSx, width: { xs: '100%', md: 110 } }}>
                {UNITS.map((unit) => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}
              </TextField>
              <TextField label="Preț unitar" value={line.price} onChange={(e) => patchLine(line.id, { price: e.target.value })} size="small" sx={{ ...dashboardInputSx, width: { xs: '100%', md: 130 } }} slotProps={{ input: { endAdornment: <InputAdornment position="end">lei</InputAdornment> } }} />
              <TextField select label="TVA" value={line.vat} onChange={(e) => patchLine(line.id, { vat: Number(e.target.value) })} size="small" sx={{ ...dashboardInputSx, width: { xs: '100%', md: 100 } }}>
                {VAT_RATES.map((rate) => <MenuItem key={rate} value={rate}>{rate}%</MenuItem>)}
              </TextField>
              <IconButton
                onClick={() => setLines((prev) => prev.filter((l) => l.id !== line.id))}
                disabled={lines.length === 1}
                size="small"
                aria-label={`Șterge linia ${line.name || 'nouă'}`}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}

          <Box>
            <Button
              startIcon={<AddRoundedIcon />}
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Adaugă linie
            </Button>
          </Box>

          <Divider />
          <SectionLabel>Emitere</SectionLabel>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Serie"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              size="small"
              sx={{ ...dashboardInputSx, flex: 1 }}
              error={noSeries}
              // Fără serie nu se poate emite, iar o listă goală fără explicație arată ca un câmp
              // stricat. Seriile sunt ale contului Oblio, deci acolo se rezolvă.
              helperText={
                noSeries
                  ? 'Contul Oblio nu are nicio serie de tip Factură. Creează una în Oblio (Setări → Serii documente), apoi reconectează contul.'
                  : undefined
              }
            >
              {connection.availableSeries.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </TextField>
            <TextField select label="Scadență" value={dueDays} onChange={(e) => setDueDays(Number(e.target.value))} size="small" sx={{ ...dashboardInputSx, flex: 1 }}>
              {DUE_OPTIONS.map((option) => <MenuItem key={option.days} value={option.days}>{option.label}</MenuItem>)}
            </TextField>
          </Stack>

          <TextField label="Mențiuni pe factură" value={note} onChange={(e) => setNote(e.target.value)} size="small" multiline minRows={2} sx={dashboardInputSx} />

          <FormControlLabel
            control={<Switch checked={sendToSpv} onChange={(e) => setSendToSpv(e.target.checked)} />}
            label="Trimite factura în SPV (e-Factura)"
            sx={{ '& .MuiFormControlLabel-label': { fontWeight: 700, fontSize: '0.88rem' } }}
          />

          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
            <Typography sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>Total fără TVA</Typography>
            <Amount value={total} unit="lei" size="row" decimals={2} />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textSubtle }}>
          Renunță
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={!canIssue || saving}
          onClick={() => void issue()}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
        >
          {saving ? 'Se emite…' : 'Emite factura'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: '0.72rem',
        fontWeight: 800,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: DASHBOARD_TOKENS.textSubtle,
      }}
    >
      {children}
    </Typography>
  )
}
