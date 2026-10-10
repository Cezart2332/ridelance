import { formatLei } from '../../../../shared/money'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Collapse,
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material'
import AddAPhotoRoundedIcon from '@mui/icons-material/AddAPhotoRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'

import { IS_DARK_SKIN } from '../../dashboardSkin'
import { DASHBOARD_TOKENS as T } from '../../dashboardTheme'
import { PageHeader, StatusChip, type StatusTone } from '../../ui'
import { clientLedgerService, type ClientTransaction, type ClientTransactions, type ClientTransactionState } from '../../../../services/clientLedger.service'
import type { ExpenseDocumentUploadResult, ExpensePaymentChoice } from '../../../../shared/accounting/api/types'
import { getErrorMessage } from '../../../../utils/errorHandler'

const STATE: Record<ClientTransactionState, { label: string; tone: StatusTone }> = {
  DOCUMENT_MISSING: { label: 'Document lipsă', tone: 'warning' },
  INVOICE_FOUND: { label: 'Factura găsită automat ✓', tone: 'active' },
  DOCUMENT_ATTACHED: { label: 'Document atașat ✓', tone: 'active' },
  NEEDS_REVIEW: { label: 'De verificat', tone: 'warning' },
  PAYOUT_PENDING: { label: 'Payout identificat – așteaptă reconcilierea', tone: 'neutral' },
  PAYOUT_RECONCILED: { label: 'Payout reconciliat ✓', tone: 'active' },
  TRANSFER: { label: 'Transfer ✓', tone: 'active' },
  TAX: { label: 'Taxe ANAF ✓', tone: 'active' },
  INCOME: { label: 'Încasare ✓', tone: 'active' },
  CORRECTION: { label: 'Corecție contabilă', tone: 'neutral' },
}

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const lei = (value: number) => `${value > 0 ? '+' : ''}${formatLei(value)}`

const dayLabel = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })

/**
 * Tranzacții (spec flux contabil §8): PFA-ul nu completează registre. Vede fiecare plată cu starea ei,
 * câte cer atenție, și asociază bonurile: la o plată din bancă sau ca o cheltuială nouă, cu „Cum ai plătit?”.
 */
export function TransactionsPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [data, setData] = useState<ClientTransactions | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [receipt, setReceipt] = useState<{ upload: ExpenseDocumentUploadResult; ledgerEntryId: string | null } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const target = useRef<string | null>(null)

  const load = useCallback(() => {
    const from = iso(month)
    const to = iso(new Date(month.getFullYear(), month.getMonth() + 1, 0))
    return clientLedgerService.transactions(from, to)
      .then((result) => { setData(result); setError('') })
      .catch((err) => setError(getErrorMessage(err, 'Nu am putut încărca tranzacțiile.')))
  }, [month])

  useEffect(() => { void load() }, [load])

  const pickReceipt = (ledgerEntryId: string | null) => {
    target.current = ledgerEntryId
    fileInput.current?.click()
  }

  const uploaded = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      setReceipt({ upload: await clientLedgerService.uploadReceipt(file), ledgerEntryId: target.current })
    } catch (err) {
      setError(getErrorMessage(err, 'Bonul nu a putut fi încărcat.'))
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const resolve = async (id: string, accept: boolean) => {
    try {
      await clientLedgerService.resolveProposal(id, accept)
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Asocierea nu a putut fi salvată.'))
    }
  }

  const monthLabel = month.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Încasări și plăți"
        subtitle="Bancă și numerar într-un singur loc. Vezi ce a identificat contabilitatea și asociază documentele lipsă."
        keepTitleOnMobile
        actions={
          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <AddAPhotoRoundedIcon />}
            disabled={uploading}
            onClick={() => pickReceipt(null)}
          >
            Adaugă cheltuială
          </Button>
        }
      />
      <input ref={fileInput} type="file" accept="image/*,application/pdf" capture="environment" hidden onChange={(event) => void uploaded(event.target.files?.[0])} />

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Stack direction="row" sx={{ alignItems: 'center' }}>
          <IconButton aria-label="Luna anterioară" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <ChevronLeftRoundedIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700, color: T.ink, minWidth: 140, textAlign: 'center', textTransform: 'capitalize' }}>{monthLabel}</Typography>
          <IconButton aria-label="Luna următoare" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <ChevronRightRoundedIcon />
          </IconButton>
        </Stack>
        {data && (
          <Stack direction="row" useFlexGap sx={{ gap: 2, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, color: data.attentionCount > 0 ? T.ink : T.textMuted }}>
              Cheltuieli care necesită atenție – {data.attentionCount}
            </Typography>
            {(data.incomeAttentionCount ?? 0) > 0 && (
              <Typography sx={{ fontWeight: 700, color: T.ink }}>Încasări de identificat – {data.incomeAttentionCount}</Typography>
            )}
          </Stack>
        )}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {data?.proposals.map((proposal) => (
        <Paper key={proposal.id} elevation={0} sx={{ p: 2, borderRadius: `${T.radius.lg}px`, border: `1px solid ${T.primary}` }}>
          <Typography sx={{ fontWeight: 700, color: T.ink }}>Am găsit plata acestui bon în cont. Asociază?</Typography>
          <Typography sx={{ color: T.textMuted, fontSize: '0.88rem', mt: 0.5 }}>
            {proposal.entry.counterparty ?? proposal.entry.description} · {lei(proposal.transaction.amount)} · {proposal.transaction.date ? dayLabel(proposal.transaction.date) : ''}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button variant="contained" size="small" onClick={() => void resolve(proposal.id, true)}>Asociază</Button>
            <Button size="small" onClick={() => void resolve(proposal.id, false)}>Nu e același</Button>
          </Stack>
        </Paper>
      ))}

      <Paper elevation={0} sx={{ borderRadius: `${T.radius.lg}px`, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        {!data ? (
          <Stack sx={{ alignItems: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: T.primary }} />
          </Stack>
        ) : data.rows.length === 0 ? (
          <Typography sx={{ p: 3, color: T.textMuted }}>Nicio tranzacție în {monthLabel}.</Typography>
        ) : (
          data.rows.map((row) => <TransactionRow key={row.id} row={row} onAttach={pickReceipt} busy={uploading} />)
        )}
      </Paper>

      {receipt && (
        <ReceiptDialog
          upload={receipt.upload}
          ledgerEntryId={receipt.ledgerEntryId}
          onClose={() => setReceipt(null)}
          onSaved={() => { setReceipt(null); void load() }}
        />
      )}
    </Stack>
  )
}

function TransactionRow({ row, onAttach, busy }: { row: ClientTransaction; onAttach: (ledgerEntryId: string) => void; busy: boolean }) {
  const state = STATE[row.state]
  const [open, setOpen] = useState(false)
  return (
    <Box sx={{ borderBottom: `1px solid ${T.border}`, '&:last-of-type': { borderBottom: 'none' } }}>
    <Stack
      direction="row"
      useFlexGap
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setOpen((value) => !value)
        }
      }}
      sx={{ alignItems: 'center', gap: 1.5, px: 2, py: 1.5, flexWrap: 'wrap', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
    >
      <Typography sx={{ color: T.textMuted, fontSize: '0.82rem', width: 52, flexShrink: 0 }}>{dayLabel(row.date)}</Typography>
      <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 600, color: T.ink }}>{row.title}</Typography>
        {row.detail && <Typography noWrap sx={{ color: T.textMuted, fontSize: '0.8rem' }}>{row.detail}</Typography>}
      </Box>
      <Typography sx={{ fontWeight: 700, color: row.amount < 0 ? T.ink : IS_DARK_SKIN ? '#4ADE80' : '#15803D', whiteSpace: 'nowrap' }}>{lei(row.amount)}</Typography>
      <Stack direction="row" useFlexGap sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', flex: '0 1 auto' }}>
        <StatusChip label={state.label} tone={state.tone} size="sm" />
        {row.ledgerEntryId && (
          <Button
            size="small"
            disabled={busy}
            onClick={(event) => {
              event.stopPropagation()
              onAttach(row.ledgerEntryId!)
            }}
          >
            Asociază bon
          </Button>
        )}
      </Stack>
    </Stack>
      <Collapse in={open} unmountOnExit>
        <Stack spacing={0.5} sx={{ px: 2, pb: 1.5, pl: { sm: '76px' } }}>
          <Typography sx={{ color: T.textMuted, fontSize: '0.85rem' }}>
            {new Date(`${row.date}T00:00:00`).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {PAYMENT_LABEL[row.paymentMethod]}
          </Typography>
          {row.detail && <Typography sx={{ color: T.ink, fontSize: '0.88rem', wordBreak: 'break-word' }}>{row.detail}</Typography>}
        </Stack>
      </Collapse>
    </Box>
  )
}

const PAYMENT_LABEL: Record<ClientTransaction['paymentMethod'], string> = { BANK: 'Bancă', CASH: 'Numerar', MANUAL: 'Card sau cont neconectat' }

/**
 * Confirmarea bonului: ce s-a citit, liniile personale (R30) și „Cum ai plătit?” (R34). Asociat unei
 * plăți din bancă, plata e deja știută.
 */
function ReceiptDialog({
  upload,
  ledgerEntryId,
  onClose,
  onSaved,
}: {
  upload: ExpenseDocumentUploadResult
  ledgerEntryId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const { extracted, proposedMatch } = upload
  const [lines, setLines] = useState(extracted.lines ?? [])
  // QA 9: întrebarea e obligatorie și fără preselecție; doar asocierea pornită de pe rândul plății știe plata.
  const [payment, setPayment] = useState<ExpensePaymentChoice | ''>(ledgerEntryId ? 'BANK' : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const bankEntryId = ledgerEntryId ?? proposedMatch?.id ?? null
  const personal = Math.min(
    lines.filter((line) => line.personal).reduce((sum, line) => sum + (line.amount ?? 0), 0),
    extracted.total ?? 0,
  )

  const save = async () => {
    if (!payment) return
    setSaving(true)
    setError('')
    try {
      await clientLedgerService.confirmReceipt(upload.expenseDocumentId, payment, payment === 'BANK' ? bankEntryId : null, Math.round(personal * 100) / 100)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err, 'Bonul nu a putut fi salvat.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>{extracted.merchant ?? 'Bon'}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ color: T.textMuted }}>{extracted.date ? dayLabel(extracted.date) : 'Data necitită'}</Typography>
            <Typography sx={{ fontWeight: 800 }}>{extracted.total !== null ? lei(-extracted.total) : 'Total necitit'}</Typography>
          </Stack>

          {!extracted.beneficiaryCui && <Alert severity="info">Cere CUI-ul PFA pe bon.</Alert>}

          {lines.length > 1 && (
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5 }}>Personal</Typography>
              {lines.map((line, index) => (
                <FormControlLabel
                  key={`${line.name}-${index}`}
                  sx={{ display: 'flex', mr: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={line.personal}
                      onChange={(event) => setLines(lines.map((item, i) => (i === index ? { ...item, personal: event.target.checked } : item)))}
                    />
                  }
                  label={`${line.name}${line.amount !== null ? ` · ${line.amount.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei` : ''}`}
                />
              ))}
            </Box>
          )}

          {!ledgerEntryId && (
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5 }}>Cum ai plătit?</Typography>
              <RadioGroup value={payment} onChange={(event) => setPayment(event.target.value as ExpensePaymentChoice)}>
                {proposedMatch && (
                  <FormControlLabel value="BANK" control={<Radio size="small" />} label={`Din cont · ${dayLabel(proposedMatch.date)}`} />
                )}
                <FormControlLabel value="CASH" control={<Radio size="small" />} label="Numerar" />
                <FormControlLabel value="MANUAL" control={<Radio size="small" />} label="Card sau cont neconectat" />
              </RadioGroup>
            </Box>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Renunță</Button>
        <Button variant="contained" onClick={() => void save()} disabled={saving || !payment || extracted.total === null}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Salvează'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
