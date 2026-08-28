import { useCallback, useEffect, useState } from 'react'
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
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'

import {
  parseMissingFields,
  rentalsService,
  toFieldKey,
  type FilledDocumentFields,
  type GeneratedDocument,
  type MissingField,
  type Rental,
  type RentalDocumentType,
} from '../../../services/rentals.service'
import { openDocument } from '../../common/documentViewerBus'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'
import { Panel, StatusChip } from '../ui'

/**
 * Documentele unei închirieri: ce s-a generat și ce se mai poate genera.
 *
 * Acțiunea principală e „+ Închiriere nouă", nu „creează contract" (spec §6.1) — contractul e un
 * rezultat al închirierii, nu punctul din care pornește. De aceea panoul stă pe închiriere și
 * generarea e un buton, nu un flux separat.
 */

const DOCUMENT_TYPES: { type: RentalDocumentType; label: string }[] = [
  { type: 'RentalContract', label: 'Contract de închiriere' },
  { type: 'HandoverProtocol', label: 'Proces-verbal de predare' },
  { type: 'ReturnProtocol', label: 'Proces-verbal de primire' },
]

const TYPE_LABELS: Record<RentalDocumentType, string> = {
  RentalContract: 'Contract de închiriere',
  HandoverProtocol: 'Proces-verbal de predare',
  ReturnProtocol: 'Proces-verbal de primire',
}

const STATUS_LABELS: Record<GeneratedDocument['status'], { label: string; tone: 'active' | 'neutral' }> = {
  Generated: { label: 'Generat', tone: 'neutral' },
  SentForSignature: { label: 'Trimis spre semnare', tone: 'neutral' },
  Signed: { label: 'Semnat', tone: 'active' },
  Cancelled: { label: 'Anulat', tone: 'neutral' },
}

/**
 * Titlul grupei de câmpuri. Spune unde ajunge valoarea, fiindcă se salvează la sursă: adresa
 * completată aici rămâne pe chiriaș și la închirierea următoare.
 */
const OWNER_TITLES: Record<MissingField['owner'], string> = {
  car: 'Mașina',
  company: 'Firma',
  tenant: 'Chiriașul',
  rental: 'Închirierea',
}

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })

export function RentalDocumentsPanel({ rental }: { rental: Rental }) {
  const [documents, setDocuments] = useState<GeneratedDocument[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState<RentalDocumentType | null>(null)
  const [missing, setMissing] = useState<MissingField[] | null>(null)
  /** Ce document se aștepta să iasă. Se reia singur după ce câmpurile au fost completate. */
  const [missingFor, setMissingFor] = useState<RentalDocumentType | null>(null)
  /** Documentul pentru care se cere adresa de email. */
  const [sendingFor, setSendingFor] = useState<GeneratedDocument | null>(null)

  const load = useCallback(() => {
    rentalsService
      .getDocuments(rental.id)
      .then(setDocuments)
      .catch(() => setError('Nu am putut încărca documentele.'))
  }, [rental.id])

  useEffect(load, [load])

  const generate = async (type: RentalDocumentType) => {
    setGenerating(type)
    setError(null)
    try {
      await rentalsService.generateDocument(rental.id, type)
      load()
    } catch (cause) {
      // Câmpurile lipsă nu sunt o eroare de sistem: sunt o listă de completat. Se deschide
      // modalul cu exact ele, nu un mesaj roșu care nu spune ce e de făcut.
      const fields = parseMissingFields(cause)
      if (fields) {
        setMissing(fields)
        setMissingFor(type)
      } else {
        setError('Nu am putut genera documentul.')
      }
    } finally {
      setGenerating(null)
    }
  }

  return (
    <Panel
      title="Documente"
      subtitle={`Contractul și procesele-verbale pentru ${rental.publicCode}.`}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
        {DOCUMENT_TYPES.map((entry) => (
          <Button
            key={entry.type}
            variant="outlined"
            startIcon={<DescriptionRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => void generate(entry.type)}
            disabled={generating !== null}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            {generating === entry.type ? 'Se generează…' : `Generează ${entry.label.toLowerCase()}`}
          </Button>
        ))}
      </Stack>

      {documents === null && !error && <Skeleton variant="rounded" height={80} />}

      {documents?.length === 0 && (
        <Typography sx={{ fontSize: '0.9rem', color: DASHBOARD_TOKENS.textMuted }}>
          Niciun document generat încă.
        </Typography>
      )}

      {documents && documents.length > 0 && (
        <Stack>
          {documents.map((doc, index) => {
            const status = STATUS_LABELS[doc.status]
            const name = `${TYPE_LABELS[doc.type]} · v${doc.version}`

            return (
              <Stack
                key={doc.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{
                  justifyContent: 'space-between',
                  alignItems: { sm: 'center' },
                  py: 1.3,
                  borderTop: index === 0 ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: DASHBOARD_TOKENS.ink }}>
                    {name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }}>
                    {/* Statusul cu moment, ca în spec §7. */}
                    {status.label} · {formatDateTime(doc.signedAtUtc ?? doc.sentAtUtc ?? doc.generatedAtUtc)}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                  <StatusChip tone={status.tone} label={status.label} />
                  <Button
                    size="small"
                    startIcon={<VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => openDocument(doc.signedDocumentId ?? doc.documentId, `${name}.pdf`)}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Vezi
                  </Button>
                  {/* Cele două căi din spec §7 sunt de rang egal: descarci și semnezi pe hârtie,
                      sau trimiți linkul. RIDElance n-o forțează pe niciuna. */}
                  {doc.status !== 'Signed' && (
                    <Button
                      size="small"
                      startIcon={<SendRoundedIcon sx={{ fontSize: 16 }} />}
                      onClick={() => setSendingFor(doc)}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      {doc.status === 'SentForSignature' ? 'Retrimite' : 'Trimite'}
                    </Button>
                  )}
                </Stack>
              </Stack>
            )
          })}
        </Stack>
      )}

      <MissingFieldsDialog
        rentalId={rental.id}
        missing={missing}
        onClose={() => setMissing(null)}
        onFilled={() => {
          const type = missingFor
          setMissing(null)
          setMissingFor(null)
          // Reia generarea de la sine: omul a cerut documentul, nu completarea formularului.
          if (type) void generate(type)
        }}
      />

      <SendForSignatureDialog
        document={sendingFor}
        defaultEmail={rental.tenant.email ?? ''}
        onClose={() => setSendingFor(null)}
        onSent={() => {
          setSendingFor(null)
          load()
        }}
      />
    </Panel>
  )
}

/**
 * Ce mai trebuie completat, exact.
 *
 * Spec §5 cere lista de câmpuri, nu o trimitere înapoi în formularul complet de editare. Grupate
 * după unde se completează: patru câmpuri împrăștiate în trei ecrane sunt trei drumuri, iar omul
 * trebuie să știe câte are de făcut înainte să înceapă.
 */
function MissingFieldsDialog({
  rentalId,
  missing,
  onClose,
  onFilled,
}: {
  rentalId: string
  missing: MissingField[] | null
  onClose: () => void
  onFilled: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!missing) return null

  const owners = [...new Set(missing.map((m) => m.owner))]
  // Profilul firmei lipsește cu totul: are slug și vizibilități, adică decizii care se iau în
  // ecranul lui. Aici se spune atât, fără să pretindem că un câmp de text rezolvă.
  const needsProfile = missing.some((m) => m.field === 'company.profile')
  const editable = missing.filter((m) => m.field !== 'company.profile')
  const complete = editable.every((m) => (values[m.field] ?? '').trim().length > 0)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload: FilledDocumentFields = {}
      for (const field of editable) {
        const value = (values[field.field] ?? '').trim()
        if (!value) continue

        if (field.field === 'rental.startMileage') {
          payload.rentalStartMileage = Number(value)
        } else {
          // Cheile sunt fixe și verificate de tip; valoarea e mereu text.
          ;(payload as Record<string, string | number>)[toFieldKey(field.field)] = value
        }
      }

      await rentalsService.fillDocumentFields(rentalId, payload)
      onFilled()
    } catch {
      setError('Nu am putut salva. Verifică valorile și încearcă din nou.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Mai trebuie completate</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          {needsProfile && (
            <Alert severity="info" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, fontWeight: 600 }}>
              Firma n-are încă profil. Completează-l în Profil firmă, apoi revino aici.
            </Alert>
          )}

          {owners.map((owner) => {
            const fields = editable.filter((m) => m.owner === owner)
            if (fields.length === 0) return null

            return (
              <Box key={owner}>
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: DASHBOARD_TOKENS.textSubtle,
                    mb: 1,
                  }}
                >
                  {OWNER_TITLES[owner]}
                </Typography>

                <Stack spacing={1.5}>
                  {fields.map((field) => (
                    <TextField
                      key={field.field}
                      label={field.label}
                      size="small"
                      fullWidth
                      value={values[field.field] ?? ''}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [field.field]: event.target.value }))
                      }
                      slotProps={
                        field.field === 'rental.startMileage'
                          ? { htmlInput: { inputMode: 'numeric' } }
                          : undefined
                      }
                      sx={dashboardInputSx}
                    />
                  ))}
                </Stack>
              </Box>
            )
          })}

          {error && (
            <Alert severity="error" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, fontWeight: 600 }}>
              {error}
            </Alert>
          )}

          <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }}>
            Valorile se salvează acolo unde le e locul — pe chiriaș, pe mașină, pe firmă — deci nu
            se mai cer a doua oară.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Renunț
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={() => void save()}
          disabled={saving || !complete}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {saving ? 'Se salvează…' : 'Salvează și generează'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}


/**
 * Un singur câmp: adresa. Precompletată de pe chiriaș, editabilă — spec §7 cere exact atât.
 */
function SendForSignatureDialog({
  document: target,
  defaultEmail,
  onClose,
  onSent,
}: {
  document: GeneratedDocument | null
  defaultEmail: string
  onClose: () => void
  onSent: () => void
}) {
  if (!target) return null

  return (
    <SendDialogBody
      key={target.id}
      document={target}
      defaultEmail={defaultEmail}
      onClose={onClose}
      onSent={onSent}
    />
  )
}

function SendDialogBody({
  document: target,
  defaultEmail,
  onClose,
  onSent,
}: {
  document: GeneratedDocument
  defaultEmail: string
  onClose: () => void
  onSent: () => void
}) {
  // Remontare per document, ca adresa să pornească de la chiriașul potrivit fără reset într-un efect.
  const [email, setEmail] = useState(target.sentToEmail ?? defaultEmail)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setSending(true)
    setError(null)
    try {
      await rentalsService.sendForSignature(target.id, email.trim())
      onSent()
    } catch (cause) {
      const detail = (cause as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Nu am putut trimite documentul.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Trimite pentru semnare</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            fullWidth
            size="small"
            autoFocus
          />
          <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>
            Chiriașul primește un link valabil șapte zile, folosibil o singură dată. Nu are nevoie
            de cont.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Anulează
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={() => void send()}
          disabled={sending || !email.includes('@')}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
        >
          {sending ? 'Se trimite…' : 'Trimite'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
