import { useState } from 'react'
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { VatRegistration, VatRegistrationFileKind } from '../../api/types'
import { formatDate, formatPeriod } from '../../format'
import { ReasonDialog } from '../components'
import { downloadBlob, errorMessage, openBlob, useApi } from '../useApi'
import { StatusPill } from './parts'
import { HAIRLINE, INK, MUTED, VAT_STATUS_CELL } from './status'

const DARK = { bgcolor: 'var(--rl-primary)', color: 'var(--rl-primary-fg)', '&:hover': { bgcolor: 'var(--rl-fg-soft)' } }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, py: 1, borderTop: `1px solid ${HAIRLINE}` }}>
      <Typography sx={{ fontSize: 14, color: MUTED }}>{label}</Typography>
      <Box sx={{ fontSize: 14, color: INK, textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' }}>{children}</Box>
    </Stack>
  )
}

/**
 * Cererea D700 a unui client: datele, fișierele și pasul următor. Același card în secțiunea
 * „Cod TVA” a contabilului și în profilul de onboarding din admin.
 */
export function VatRegistrationCard({ request, onChanged }: { request: VatRegistration; onChanged: (next: VatRegistration) => void }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [registering, setRegistering] = useState(false)

  const run = async (key: string, action: () => Promise<VatRegistration | void>) => {
    setBusy(key)
    setError(null)
    try {
      const next = await action()
      if (next) onChanged(next)
    } catch (actionError) {
      setError(errorMessage(actionError))
    } finally {
      setBusy(null)
    }
  }

  const file = (kind: VatRegistrationFileKind) =>
    run(kind, async () => {
      const blob = await accountingApi.vatRegistrations.getFile(request.id, kind)
      if (kind === 'xml') downloadBlob(blob, `D700_${request.cui ?? ''}_${request.period}.xml`)
      else openBlob(blob)
    })

  const button = (key: string, label: string, action: () => Promise<VatRegistration | void>, primary = false) => (
    <Button key={key} variant={primary ? 'contained' : 'outlined'} disabled={busy !== null} onClick={() => void run(key, action)} sx={primary ? DARK : undefined}>
      {busy === key ? 'Se lucrează…' : label}
    </Button>
  )

  const regenerate = () => accountingApi.vatRegistrations.generate(request.pfaId)
  const actions: React.ReactNode[] = []
  switch (request.status) {
    case 'WAITING_FOR_DATA':
    case 'REJECTED':
      actions.push(button('generate', 'Generează din nou', regenerate, true))
      break
    case 'GENERATED':
      actions.push(button('validate', 'Verifică la ANAF', () => accountingApi.vatRegistrations.validate(request.id), true))
      break
    case 'VALIDATION_FAILED':
      actions.push(button('validate', 'Verifică din nou', () => accountingApi.vatRegistrations.validate(request.id), true))
      actions.push(button('generate', 'Generează din nou', regenerate))
      break
    case 'READY_FOR_REVIEW':
      actions.push(button('approve', 'Aprobă', () => accountingApi.vatRegistrations.transition(request.id, 'APPROVED'), true))
      actions.push(
        <Button key="reject" variant="outlined" color="error" disabled={busy !== null} onClick={() => setRejecting(true)}>
          Respinge
        </Button>,
      )
      break
    case 'APPROVED':
      actions.push(button('submit', 'Marchează depusă', () => accountingApi.vatRegistrations.transition(request.id, 'SUBMITTED'), true))
      actions.push(
        <Button key="reject" variant="outlined" color="error" disabled={busy !== null} onClick={() => setRejecting(true)}>
          Respinge
        </Button>,
      )
      break
    case 'SUBMITTED':
      actions.push(
        <Button key="code" variant="contained" disabled={busy !== null} onClick={() => setRegistering(true)} sx={DARK}>
          Cod primit
        </Button>,
      )
      break
    default:
      break
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography component="h3" sx={{ fontSize: 16, fontWeight: 700, color: INK }}>
          D700 · cod TVA art. 317
        </Typography>
        <StatusPill cell={VAT_STATUS_CELL[request.status]} />
      </Stack>

      {request.missingData && <Alert severity="warning">{request.missingData}</Alert>}
      {request.status === 'VALIDATION_FAILED' && request.errors.length > 0 && (
        <Alert severity="error">
          {request.errors.map((message) => (
            <Box key={message}>{message}</Box>
          ))}
        </Alert>
      )}
      {request.status === 'REJECTED' && request.rejectionReason && <Alert severity="error">{request.rejectionReason}</Alert>}

      <Box>
        <Row label="Client">{request.clientName}</Row>
        <Row label="CUI">{request.cui ?? '—'}</Row>
        <Row label="Luna cererii">{formatPeriod(request.period)}</Row>
        {request.vatCode && (
          <Row label="Cod TVA">
            {request.vatCode}
            {request.vatCodeValidFrom && `, din ${formatDate(request.vatCodeValidFrom)}`}
          </Row>
        )}
      </Box>

      {(request.hasPdf || request.hasXml || request.hasCertificate) && (
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {request.hasPdf && (
            <Button variant="text" disabled={busy !== null} onClick={() => void file('pdf')}>
              {busy === 'pdf' ? 'Se deschide…' : 'PDF'}
            </Button>
          )}
          {request.hasXml && (
            <Button variant="text" disabled={busy !== null} onClick={() => void file('xml')}>
              XML
            </Button>
          )}
          {request.hasCertificate && (
            <Button variant="text" disabled={busy !== null} onClick={() => void file('certificate')}>
              Certificat
            </Button>
          )}
        </Stack>
      )}

      {error && <Alert severity="error">{error}</Alert>}
      {actions.length > 0 && <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>{actions}</Stack>}

      <ReasonDialog
        open={rejecting}
        title="Respinge D700"
        reasonLabel="Motivul"
        confirmLabel="Respinge"
        destructive
        onClose={() => setRejecting(false)}
        onSubmit={async (reason) => onChanged(await accountingApi.vatRegistrations.transition(request.id, 'REJECTED', reason))}
      />
      {registering && <VatCodeDialog request={request} onClose={() => setRegistering(false)} onSaved={onChanged} />}
    </Stack>
  )
}

/** Codul primit de la ANAF: ajunge în setările contabile și în profilul fiscal. */
function VatCodeDialog({ request, onClose, onSaved }: { request: VatRegistration; onClose: () => void; onSaved: (next: VatRegistration) => void }) {
  const [vatCode, setVatCode] = useState(request.cui ? `RO${request.cui}` : 'RO')
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10))
  const [certificate, setCertificate] = useState<File | null>(null)

  return (
    <ReasonDialog
      open
      title="Cod primit"
      confirmLabel="Salvează"
      requireReason={false}
      showReason={false}
      canSubmit={vatCode.trim().length > 2 && validFrom.length === 10}
      onClose={onClose}
      onSubmit={async () =>
        onSaved(await accountingApi.vatRegistrations.registerCode(request.id, { vatCode: vatCode.trim(), validFrom, file: certificate ?? undefined }))
      }
    >
      <TextField label="Cod TVA" value={vatCode} onChange={(event) => setVatCode(event.target.value)} fullWidth />
      <TextField
        label="Valabil de la"
        type="date"
        value={validFrom}
        onChange={(event) => setValidFrom(event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />
      <Button variant="outlined" component="label">
        {certificate ? certificate.name : 'Certificat (PDF)'}
        <input hidden type="file" accept="application/pdf,image/*" onChange={(event) => setCertificate(event.target.files?.[0] ?? null)} />
      </Button>
    </ReasonDialog>
  )
}

/**
 * D700 în profilul de onboarding al unui client care a răspuns „Nu” la TVA intracomunitar:
 * cererea generată automat sau, dacă lipsește, butonul care o generează.
 */
export function VatRegistrationBlock({ pfaId }: { pfaId: string }) {
  const loaded = useApi(() => accountingApi.vatRegistrations.forPfa(pfaId), [pfaId])
  const [current, setCurrent] = useState<VatRegistration | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loaded.error && loaded.data === null) return <Alert severity="warning">{loaded.error}</Alert>
  if (loaded.loading && !current) return <CircularProgress size={20} />
  const request = current ?? loaded.data

  if (!request) {
    return (
      <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Typography sx={{ fontSize: 14, color: INK }}>D700 negenerată</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          variant="contained"
          disabled={busy}
          sx={DARK}
          onClick={() => {
            setBusy(true)
            setError(null)
            accountingApi.vatRegistrations
              .generate(pfaId)
              .then(setCurrent)
              .catch((generateError: unknown) => setError(errorMessage(generateError)))
              .finally(() => setBusy(false))
          }}
        >
          {busy ? 'Se generează…' : 'Generează D700'}
        </Button>
      </Stack>
    )
  }

  return <VatRegistrationCard request={request} onChanged={setCurrent} />
}
