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
  Typography,
} from '@mui/material'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'

import {
  parseMissingFields,
  rentalsService,
  type GeneratedDocument,
  type MissingField,
  type Rental,
  type RentalDocumentType,
} from '../../../services/rentals.service'
import { openDocument } from '../../common/documentViewerBus'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
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

/** Unde se completează un câmp lipsă. Textul spune omului unde să se ducă, nu doar ce lipsește. */
const OWNER_HINTS: Record<MissingField['owner'], string> = {
  car: 'Se completează în pagina mașinii.',
  company: 'Se completează în Profilul firmei.',
  tenant: 'Se completează pe chiriaș, la editarea închirierii.',
  rental: 'Se completează pe închiriere.',
}

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })

export function RentalDocumentsPanel({ rental }: { rental: Rental }) {
  const [documents, setDocuments] = useState<GeneratedDocument[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState<RentalDocumentType | null>(null)
  const [missing, setMissing] = useState<MissingField[] | null>(null)

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
                </Stack>
              </Stack>
            )
          })}
        </Stack>
      )}

      <MissingFieldsDialog missing={missing} onClose={() => setMissing(null)} />
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
  missing,
  onClose,
}: {
  missing: MissingField[] | null
  onClose: () => void
}) {
  if (!missing) return null

  const owners = [...new Set(missing.map((m) => m.owner))]

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Mai trebuie completate</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {owners.map((owner) => (
            <Box key={owner}>
              <Stack component="ul" sx={{ m: 0, pl: 2.5 }}>
                {missing
                  .filter((m) => m.owner === owner)
                  .map((field) => (
                    <Typography
                      component="li"
                      key={field.field}
                      sx={{ fontSize: '0.92rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink, py: 0.3 }}
                    >
                      {field.label}
                    </Typography>
                  ))}
              </Stack>
              <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted, mt: 0.5 }}>
                {OWNER_HINTS[owner]}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Am înțeles
        </Button>
      </DialogActions>
    </Dialog>
  )
}
