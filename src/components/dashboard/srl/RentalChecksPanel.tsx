import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import {
  CHECK_SLOTS,
  checksService,
  SLOT_LABELS,
  type CheckKind,
  type CheckRecord,
  type Checks,
  type CheckSlot,
} from '../../../services/checks.service'
import { openDocument } from '../../common/documentViewerBus'
import { type Rental } from '../../../services/rentals.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'
import { Amount, Panel } from '../ui'
import { DateField } from '../../common/DateField'

/**
 * Predarea și primirea unei închirieri, una lângă alta.
 *
 * Comparația e **pur vizuală** (spec §8): două coloane, slot lângă slot, iar cine se uită decide.
 * Nicio detecție automată de daune în V1 — un algoritm care spune „zgârietură" fără să poată fi
 * contestat ar muta o dispută între oameni într-o dispută cu software-ul.
 */

const KIND_LABELS: Record<CheckKind, string> = {
  CheckIn: 'Predare',
  CheckOut: 'Primire',
}

const formatDate = (iso: string): string => new Date(iso).toLocaleDateString('ro-RO')

const isoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function RentalChecksPanel({ rental }: { rental: Rental }) {
  const [checks, setChecks] = useState<Checks | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<CheckKind | null>(null)

  const load = useCallback(() => {
    checksService
      .get(rental.id)
      .then(setChecks)
      .catch(() => setError('Nu am putut încărca predarea și primirea.'))
  }, [rental.id])

  useEffect(load, [load])

  if (error) {
    return (
      <Panel title="Predare și primire">
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      </Panel>
    )
  }

  if (!checks) {
    return (
      <Panel title="Predare și primire">
        <Skeleton variant="rounded" height={160} />
      </Panel>
    )
  }

  const driven =
    checks.checkIn && checks.checkOut ? checks.checkOut.mileage - checks.checkIn.mileage : null

  return (
    <Panel
      title="Predare și primire"
      subtitle={
        driven === null
          ? 'Starea mașinii la plecare și la întoarcere.'
          : `${driven.toLocaleString('ro-RO')} km parcurși în perioada închirierii.`
      }
    >
      {/* Două coloane, aceleași rânduri: comparația se face din ochi, nu din memorie. */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        <CheckColumn
          kind="CheckIn"
          rentalId={rental.id}
          record={checks.checkIn}
          onEdit={() => setEditing('CheckIn')}
          onPhotoAdded={load}
          disabled={false}
        />
        <CheckColumn
          kind="CheckOut"
          rentalId={rental.id}
          record={checks.checkOut}
          onEdit={() => setEditing('CheckOut')}
          onPhotoAdded={load}
          // Primirea vine după predare. Butonul stins spune de ce, în loc să lase serverul s-o refuze.
          disabled={checks.checkIn === null}
        />
      </Box>

      {checks.checkOut && (checks.checkOut.depositWithheldBani ?? 0) > 0 && (
        <Alert
          severity="warning"
          sx={{ mt: 2.5, borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}
        >
          S-au reținut {((checks.checkOut.depositWithheldBani ?? 0) / 100).toLocaleString('ro-RO')} lei
          din garanție: {checks.checkOut.withholdingReason}
        </Alert>
      )}

      <CheckDialog
        kind={editing}
        rental={rental}
        existing={editing === 'CheckIn' ? checks.checkIn : checks.checkOut}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          load()
        }}
      />
    </Panel>
  )
}

function CheckColumn({
  kind,
  rentalId,
  record,
  onEdit,
  onPhotoAdded,
  disabled,
}: {
  kind: CheckKind
  rentalId: string
  record: CheckRecord | null
  onEdit: () => void
  onPhotoAdded: () => void
  disabled: boolean
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploadingSlot, setUploadingSlot] = useState<CheckSlot | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const pick = (slot: CheckSlot) => {
    setUploadingSlot(slot)
    inputRef.current?.click()
  }

  const onFile = async (file: File | undefined) => {
    if (!file || !uploadingSlot) return
    setUploadError(null)
    try {
      await checksService.addPhoto(rentalId, kind, uploadingSlot, file)
      onPhotoAdded()
    } catch (cause) {
      const detail = (cause as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setUploadError(detail ?? 'Nu am putut urca fotografia.')
    } finally {
      setUploadingSlot(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
      }}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 850, fontSize: '0.95rem', color: DASHBOARD_TOKENS.ink }}>
          {KIND_LABELS[kind]}
        </Typography>
        <Button
          size="small"
          onClick={onEdit}
          disabled={disabled}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {record ? 'Modifică' : 'Consemnează'}
        </Button>
      </Stack>

      {!record && (
        <Typography sx={{ fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted }}>
          {disabled ? 'După consemnarea predării.' : 'Neconsemnată.'}
        </Typography>
      )}

      {record && (
        <Stack spacing={0.6}>
          <Line label="Data" value={formatDate(record.occurredAtUtc)} />
          <Line label="Kilometraj" value={`${record.mileage.toLocaleString('ro-RO')} km`} />
          <Line label="Combustibil" value={record.fuelLevel ?? '—'} />
          <Line
            label="Accesorii"
            value={record.accessories.length > 0 ? record.accessories.join(', ') : '—'}
          />
          {record.notes && <Line label="Observații" value={record.notes} />}

          {kind === 'CheckOut' && (
            <>
              <Line
                label="Garanție returnată"
                value={record.depositReturnedBani == null ? '—' : `${(record.depositReturnedBani / 100).toLocaleString('ro-RO')} lei`}
              />
              <Line
                label="Garanție reținută"
                value={record.depositWithheldBani == null ? '—' : `${(record.depositWithheldBani / 100).toLocaleString('ro-RO')} lei`}
              />
            </>
          )}

          {/* Sloturile se afișează toate, în aceeași ordine pe ambele coloane: o poză lipsă pe o
              parte trebuie să se vadă ca gol, nu prin absența rândului. */}
          {uploadError && (
            <Alert severity="error" sx={{ mt: 1, borderRadius: `${DASHBOARD_TOKENS.radius.sm}px`, fontSize: '0.78rem' }}>
              {uploadError}
            </Alert>
          )}

          <Box
            component="input"
            type="file"
            accept="image/*"
            ref={inputRef}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => void onFile(event.target.files?.[0])}
            sx={{ display: 'none' }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.8, pt: 1 }}>
            {CHECK_SLOTS.map((slot) => {
              const photo = record.photos.find((p) => p.slot === slot)
              return (
                <Box
                  key={slot}
                  component="button"
                  type="button"
                  // Plin, se deschide. Gol, cere o poză. Aceeași casetă, două înțelesuri, fără
                  // buton separat care ar dubla numărul de ținte pe ecran.
                  onClick={() =>
                    photo ? openDocument(photo.documentId, `${SLOT_LABELS[slot]}.jpg`) : pick(slot)
                  }
                  disabled={uploadingSlot !== null}
                  title={photo ? `Vezi ${SLOT_LABELS[slot]}` : `Adaugă ${SLOT_LABELS[slot]}`}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: `${DASHBOARD_TOKENS.radius.sm}px`,
                    border: photo
                      ? `1px solid ${DASHBOARD_TOKENS.border}`
                      : `1px dashed ${DASHBOARD_TOKENS.borderHover}`,
                    bgcolor: photo ? DASHBOARD_TOKENS.accentWash : 'transparent',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    color: photo ? DASHBOARD_TOKENS.accent : DASHBOARD_TOKENS.textSubtle,
                    textAlign: 'center',
                    px: 0.3,
                    '&:hover': { borderColor: DASHBOARD_TOKENS.primary },
                  }}
                >
                  {uploadingSlot === slot ? '…' : SLOT_LABELS[slot]}
                </Box>
              )
            })}
          </Box>
        </Stack>
      )}
    </Box>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
      <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink, textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  )
}

function CheckDialog({
  kind,
  rental,
  existing,
  onClose,
  onSaved,
}: {
  kind: CheckKind | null
  rental: Rental
  existing: CheckRecord | null
  onClose: () => void
  onSaved: () => void
}) {
  if (!kind) return null

  return (
    <CheckDialogBody
      key={`${kind}-${existing?.id ?? 'new'}`}
      kind={kind}
      rental={rental}
      existing={existing}
      onClose={onClose}
      onSaved={onSaved}
    />
  )
}

function CheckDialogBody({
  kind,
  rental,
  existing,
  onClose,
  onSaved,
}: {
  kind: CheckKind
  rental: Rental
  existing: CheckRecord | null
  onClose: () => void
  onSaved: () => void
}) {
  const [date, setDate] = useState(() =>
    isoDate(existing ? new Date(existing.occurredAtUtc) : new Date()),
  )
  const [mileage, setMileage] = useState(
    existing?.mileage != null ? String(existing.mileage) : String(rental.startMileage ?? ''),
  )
  const [fuel, setFuel] = useState(existing?.fuelLevel ?? rental.fuelLevelAtPickup ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [returned, setReturned] = useState(
    existing?.depositReturnedBani != null ? String(existing.depositReturnedBani / 100) : '',
  )
  const [withheld, setWithheld] = useState(
    existing?.depositWithheldBani != null ? String(existing.depositWithheldBani / 100) : '',
  )
  const [reason, setReason] = useState(existing?.withholdingReason ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReturn = kind === 'CheckOut'
  const withheldNumber = withheld === '' ? 0 : Number(withheld)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await checksService.save(rental.id, kind, {
        occurredAtUtc: new Date(`${date}T12:00:00Z`).toISOString(),
        mileage: Number(mileage) || 0,
        fuelLevel: fuel.trim() || null,
        // Accesoriile pornesc de la ce s-a convenit în contract; se corectează la fața locului.
        accessories: existing?.accessories ?? rental.accessories,
        notes: notes.trim() || null,
        depositReturnedBani: isReturn && returned !== '' ? Math.round(Number(returned) * 100) : null,
        depositWithheldBani: isReturn && withheld !== '' ? Math.round(Number(withheld) * 100) : null,
        withholdingReason: isReturn ? reason.trim() || null : null,
        extraMileageChargeBani: null,
        otherChargesBani: null,
      })
      onSaved()
    } catch (cause) {
      const detail = (cause as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Nu am putut salva.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>{KIND_LABELS[kind]}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
              {error}
            </Alert>
          )}

          <DateField label="Data" value={date} onChange={setDate} fullWidth size="small" sx={dashboardInputSx} />
          <TextField
            label="Kilometraj"
            type="number"
            value={mileage}
            onChange={(event) => setMileage(event.target.value)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          />
          <TextField
            label="Nivel combustibil"
            value={fuel}
            onChange={(event) => setFuel(event.target.value)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
            placeholder="plin, 3/4, 80%"
          />

          {isReturn && (
            <>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Garanție returnată (lei)"
                  type="number"
                  value={returned}
                  onChange={(event) => setReturned(event.target.value)}
                  fullWidth
                  size="small"
                  sx={dashboardInputSx}
                />
                <TextField
                  label="Garanție reținută (lei)"
                  type="number"
                  value={withheld}
                  onChange={(event) => setWithheld(event.target.value)}
                  fullWidth
                  size="small"
                  sx={dashboardInputSx}
                />
              </Stack>

              {withheldNumber > 0 && (
                <TextField
                  label="Motivul reținerii"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  sx={dashboardInputSx}
                  required
                  helperText="Obligatoriu. O sumă reținută fără motiv scris devine o dispută."
                />
              )}

              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
                  Garanția din contract:
                </Typography>
                <Amount value={rental.depositBani / 100} size="row" />
              </Stack>
            </>
          )}

          <TextField
            label="Observații"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            fullWidth
            multiline
            minRows={2}
            size="small"
            sx={dashboardInputSx}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Anulează
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={() => void save()}
          disabled={saving || (withheldNumber > 0 && reason.trim() === '')}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
        >
          {saving ? 'Se salvează…' : 'Salvează'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
