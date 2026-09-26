import { useState, type ReactNode } from 'react'
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
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'

import { StatusBadge } from '../../../components/admin'
import { accountingApi } from '../api/accountingApi'
import { EMPTY, formatPeriod } from '../format'
import type { StatusDescriptor } from '../statusLabels'
import { errorMessage, useApi } from './useApi'

/** Badge-ul unui status din `statusLabels`, cu explicația din spec în tooltip. */
export function AccountingBadge({ descriptor, suffix }: { descriptor: StatusDescriptor | null | undefined; suffix?: string }) {
  if (!descriptor) {
    return (
      <Typography variant="body2" color="text.secondary" component="span">
        {EMPTY}
      </Typography>
    )
  }
  const badge = <StatusBadge label={suffix ? `${descriptor.label} ${suffix}` : descriptor.label} tone={descriptor.tone} />
  return descriptor.hint ? (
    <Tooltip title={descriptor.hint}>
      <Box component="span" sx={{ display: 'inline-flex' }}>
        {badge}
      </Box>
    </Tooltip>
  ) : (
    badge
  )
}

export function LoadingBlock() {
  return (
    <Stack sx={{ alignItems: 'center', py: 6 }}>
      <CircularProgress size={28} />
    </Stack>
  )
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Reîncearcă
          </Button>
        )
      }
    >
      {message}
    </Alert>
  )
}

export function EmptyText({ children }: { children: ReactNode }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
      {children}
    </Typography>
  )
}

/**
 * Dialog cu motiv obligatoriu (spec §0 pct. 7: orice modificare manuală are motiv). `children`
 * pune câmpuri în plus deasupra motivului; butonul rămâne inactiv până e completat motivul și
 * până `canSubmit` e adevărat.
 */
export function ReasonDialog({
  open,
  title,
  description,
  reasonLabel = 'Motiv',
  confirmLabel = 'Salvează',
  requireReason = true,
  showReason = true,
  canSubmit = true,
  destructive = false,
  children,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  description?: ReactNode
  reasonLabel?: string
  confirmLabel?: string
  requireReason?: boolean
  /** Fără câmpul de motiv (confirmările simple). */
  showReason?: boolean
  canSubmit?: boolean
  destructive?: boolean
  children?: ReactNode
  onClose: () => void
  /** Aruncă la eroare; mesajul apare în dialog. */
  onSubmit: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    if (busy) return
    setReason('')
    setError(null)
    onClose()
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSubmit(reason.trim())
      setReason('')
      onClose()
    } catch (submitError) {
      setError(errorMessage(submitError))
    } finally {
      setBusy(false)
    }
  }

  const ready = canSubmit && (!requireReason || !showReason || reason.trim().length > 0)

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {description && (typeof description === 'string' ? <Typography variant="body2">{description}</Typography> : description)}
          {children}
          {showReason && <TextField
            label={requireReason ? `${reasonLabel} (obligatoriu)` : reasonLabel}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            multiline
            minRows={2}
            fullWidth
          />}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={busy}>
          Renunță
        </Button>
        <Button variant="contained" color={destructive ? 'error' : 'primary'} onClick={submit} disabled={!ready || busy}>
          {busy ? 'Se salvează…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/** Confirmare simplă, fără motiv. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmă',
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  return (
    <ReasonDialog
      open={open}
      title={title}
      description={message}
      confirmLabel={confirmLabel}
      requireReason={false}
      showReason={false}
      onClose={onClose}
      onSubmit={() => onConfirm()}
    />
  )
}

/** O pereche etichetă / valoare, pentru antete și carduri. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ typography: 'body2', fontWeight: 500 }}>{children}</Box>
    </Stack>
  )
}

/** Selectorul de lună al unui dosar: lunile colaborării, din `periods.list`. */
export function PeriodSelect({ pfaId, value, onChange }: { pfaId: string; value: string; onChange: (period: string) => void }) {
  const periods = useApi(() => accountingApi.periods.list(pfaId), [pfaId])
  const options = (periods.data ?? []).map((item) => item.period)
  if (!options.includes(value)) options.unshift(value)
  return (
    <TextField select label="Luna" value={value} onChange={(event) => onChange(event.target.value)} sx={{ minWidth: 220 }}>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {formatPeriod(option)}
        </MenuItem>
      ))}
    </TextField>
  )
}
