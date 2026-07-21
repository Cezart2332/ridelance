import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ONBOARDING_SECTIONS } from '../../../../constants/documentSections'
import { TOKENS } from '../../../../constants/tokens'
import type { DocumentSummary } from '../../../../services/document.service'
import {
  onboardingService,
  type OnboardingSectionStatus,
  type OnboardingState,
} from '../../../../services/onboarding.service'
import { formatDocumentCategory } from '../../../../utils/formatters'

interface OnboardingSectionsPanelProps {
  pfaId: string
  pfaStatus: string
  documents: DocumentSummary[]
  statusUpdatingDocId: string | null
  openingId: string | null
  downloadingId: string | null
  onUpdateDocStatus: (id: string, status: 'Verified' | 'Rejected') => void
  onOpenDocument: (doc: DocumentSummary) => void
  onDownload: (doc: DocumentSummary) => void
  onOpenPfaApproveDialog: () => void
  onOpenPfaRejectDialog: () => void
  onSnackbar: (message: string, severity: 'success' | 'error') => void
  /** Incrementat de părinte după aprobarea PFA, ca panoul să-și reîncarce starea. */
  refreshKey?: number
}

function sectionStatusLabel(status: OnboardingSectionStatus): string {
  switch (status) {
    case 'Locked': return 'Blocat'
    case 'InProgress': return 'În completare'
    case 'AwaitingValidation': return 'În validare'
    case 'Validated': return 'Validat'
    case 'Rejected': return 'Respins'
    default: return status
  }
}

function sectionStatusColor(status: OnboardingSectionStatus): string {
  switch (status) {
    case 'Validated': return '#10b981'
    case 'AwaitingValidation': return '#f59e0b'
    case 'Rejected': return '#ef4444'
    case 'InProgress': return TOKENS.primaryStrong
    default: return 'rgba(26,26,46,0.45)'
  }
}

function docStatusColor(status: string): string {
  const s = status.toLowerCase()
  if (s === 'verified' || s === 'approved') return '#10b981'
  if (s === 'pending') return '#f59e0b'
  return '#ef4444'
}

function docStatusLabel(status: string): string {
  const s = status.toLowerCase()
  if (s === 'verified' || s === 'approved') return 'Verificat'
  if (s === 'pending') return 'În verificare'
  return 'Respins'
}

/** Chip cu verdictul prevalidării AI + tooltip cu detaliile extrase. */
function AiVerdictChip({ doc }: { doc: DocumentSummary }) {
  const config: Record<string, { label: string; color: string }> = {
    Queued: { label: 'AI: în curs', color: TOKENS.primaryStrong },
    Processing: { label: 'AI: în curs', color: TOKENS.primaryStrong },
    Passed: { label: 'AI: OK', color: '#10b981' },
    Failed: { label: 'AI: respins', color: '#ef4444' },
    Error: { label: 'AI: indisponibil', color: 'rgba(26,26,46,0.45)' },
  }
  const entry = config[doc.aiStatus]
  if (!entry) return null

  const details = [
    doc.aiSummary,
    doc.aiDetectedType ? `Detectat: ${doc.aiDetectedType}` : null,
    doc.aiExtractedExpiresAtUtc
      ? `Expirare citită din document: ${new Date(doc.aiExtractedExpiresAtUtc).toLocaleDateString('ro-RO')}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const chip = (
    <Chip
      label={entry.label}
      size="small"
      variant="outlined"
      sx={{
        fontSize: '0.66rem',
        fontWeight: 700,
        borderColor: alpha(entry.color, 0.35),
        bgcolor: alpha(entry.color, 0.06),
        color: entry.color,
        flexShrink: 0,
      }}
    />
  )

  return details ? <Tooltip title={details}>{chip}</Tooltip> : chip
}

export function OnboardingSectionsPanel({
  pfaId,
  pfaStatus,
  documents,
  statusUpdatingDocId,
  openingId,
  downloadingId,
  onUpdateDocStatus,
  onOpenDocument,
  onDownload,
  onOpenPfaApproveDialog,
  onOpenPfaRejectDialog,
  onSnackbar,
  refreshKey = 0,
}: OnboardingSectionsPanelProps) {
  const [state, setState] = useState<OnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [actionBusy, setActionBusy] = useState(false)
  const [confirmValidate, setConfirmValidate] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const loadState = useCallback(async () => {
    try {
      const next = await onboardingService.getForRegistration(pfaId)
      setState(next)
      setError(null)
      // Deschide implicit secțiunea aflată „la rând”
      const current = next.sections.find(
        (s) => s.status === 'AwaitingValidation' || s.status === 'InProgress' || s.status === 'Rejected',
      )
      if (current) {
        setExpanded((prev) => ({ ...prev, [current.key]: true }))
      }
    } catch {
      setError('Nu am putut încărca starea de onboarding a acestui dosar.')
    } finally {
      setLoading(false)
    }
  }, [pfaId])

  useEffect(() => {
    setLoading(true)
    void loadState()
  }, [loadState, refreshKey])

  // Documentele care nu aparțin niciunei secțiuni (ex. rapoarte lunare, buletin)
  const sectionCategories = useMemo(() => {
    const cats = new Set<string>()
    ONBOARDING_SECTIONS.forEach((s) => s.docs?.forEach((d) => d.categories.forEach((c) => cats.add(c))))
    return cats
  }, [])
  const otherDocuments = documents.filter((d) => !sectionCategories.has(d.category))

  const handleValidate = async (key: string) => {
    setActionBusy(true)
    try {
      await onboardingService.validateSection(pfaId, key)
      onSnackbar('Secțiunea a fost validată. Următorul pas al clientului este deblocat.', 'success')
      setConfirmValidate(null)
      await loadState()
    } catch {
      onSnackbar('Nu am putut valida secțiunea. Încearcă din nou.', 'error')
    } finally {
      setActionBusy(false)
    }
  }

  const handleReject = async (key: string) => {
    if (!rejectNote.trim()) return
    setActionBusy(true)
    try {
      await onboardingService.rejectSection(pfaId, key, rejectNote.trim())
      onSnackbar('Secțiunea a fost respinsă. Clientul a fost notificat.', 'success')
      setRejectDialog(null)
      setRejectNote('')
      await loadState()
    } catch {
      onSnackbar('Nu am putut respinge secțiunea. Încearcă din nou.', 'error')
    } finally {
      setActionBusy(false)
    }
  }

  const renderDocRow = (doc: DocumentSummary) => (
    <Stack
      key={doc.id}
      direction="row"
      sx={{
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.2,
        borderTop: `1px solid ${alpha(TOKENS.ink, 0.05)}`,
      }}
    >
      <Box sx={{ width: 30, height: 30, borderRadius: TOKENS.radius.sm, bgcolor: alpha(TOKENS.primary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.primaryStrong, flexShrink: 0 }}>
        <InsertDriveFileRoundedIcon sx={{ fontSize: 15 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 650 }} noWrap title={doc.originalFileName}>
          {doc.originalFileName}
        </Typography>
        <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
          {formatDocumentCategory(doc.category)}
          {doc.expiresAtUtc ? ` · Expiră ${new Date(doc.expiresAtUtc).toLocaleDateString('ro-RO')}` : ''}
        </Typography>
      </Box>
      <AiVerdictChip doc={doc} />
      <Chip
        label={docStatusLabel(doc.status)}
        size="small"
        sx={{ fontSize: '0.66rem', fontWeight: 700, bgcolor: alpha(docStatusColor(doc.status), 0.1), color: docStatusColor(doc.status), flexShrink: 0 }}
      />
      {doc.status.toLowerCase() === 'pending' && (
        <>
          <IconButton
            size="small"
            onClick={() => onUpdateDocStatus(doc.id, 'Verified')}
            disabled={statusUpdatingDocId === doc.id}
            sx={{ color: '#10b981', '&:hover': { bgcolor: alpha('#10b981', 0.1) } }}
            title="Aprobă document"
          >
            {statusUpdatingDocId === doc.id ? <CircularProgress size={15} color="inherit" /> : <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onUpdateDocStatus(doc.id, 'Rejected')}
            disabled={statusUpdatingDocId === doc.id}
            sx={{ color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.1) } }}
            title="Respinge document"
          >
            <CancelRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </>
      )}
      <IconButton
        size="small"
        onClick={() => onOpenDocument(doc)}
        disabled={openingId === doc.id}
        title="Deschide"
        sx={{ color: TOKENS.primaryStrong, '&:hover': { bgcolor: alpha(TOKENS.primary, 0.1) } }}
      >
        {openingId === doc.id ? <CircularProgress size={15} sx={{ color: TOKENS.primary }} /> : <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />}
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onDownload(doc)}
        disabled={downloadingId === doc.id}
        title="Descarcă"
        sx={{ color: TOKENS.primaryStrong, '&:hover': { bgcolor: alpha(TOKENS.primary, 0.1) } }}
      >
        {downloadingId === doc.id ? <CircularProgress size={15} sx={{ color: TOKENS.primary }} /> : <FileDownloadRoundedIcon sx={{ fontSize: 18 }} />}
      </IconButton>
    </Stack>
  )

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CircularProgress size={18} sx={{ color: TOKENS.primary }} />
          <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>Se încarcă secțiunile de onboarding...</Typography>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper elevation={0} sx={{ borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm, overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Onboarding pe secțiuni</Typography>
        <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
          Verifică documentele fiecărei secțiuni, apoi validează secțiunea pentru a debloca pasul următor al clientului.
        </Typography>
      </Box>

      {error && <Alert severity="warning" sx={{ m: 2 }}>{error}</Alert>}

      {ONBOARDING_SECTIONS.map((section) => {
        const sectionState = state?.sections.find((s) => s.key === section.key)
        const status: OnboardingSectionStatus = sectionState?.status ?? 'Locked'
        const color = sectionStatusColor(status)
        const isPfaSection = section.key === 'Pfa'
        const sectionDocs = isPfaSection
          ? []
          : documents.filter((d) => section.docs?.some((cfg) => cfg.categories.includes(d.category)))
        const pendingCount = sectionDocs.filter((d) => d.status.toLowerCase() === 'pending').length
        const isOpen = expanded[section.key] ?? false
        const canAct = status === 'AwaitingValidation' || status === 'InProgress' || status === 'Rejected'

        return (
          <Box key={section.key} sx={{ borderTop: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
            <Stack
              direction="row"
              onClick={() => setExpanded((prev) => ({ ...prev, [section.key]: !isOpen }))}
              sx={{
                alignItems: 'center',
                gap: 1.5,
                px: 2.5,
                py: 1.8,
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(TOKENS.primary, 0.03) },
              }}
            >
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(color, 0.12), color, fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                {section.order}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: TOKENS.ink }}>
                  {section.label}
                </Typography>
                {!isPfaSection && (
                  <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
                    {sectionDocs.length} documente
                    {pendingCount > 0 ? ` · ${pendingCount} de verificat` : ''}
                  </Typography>
                )}
              </Box>
              <Chip
                label={sectionStatusLabel(status)}
                size="small"
                sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: alpha(color, 0.1), color, flexShrink: 0 }}
              />
              <ExpandMoreRoundedIcon
                sx={{ color: TOKENS.textMuted, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </Stack>

            <Collapse in={isOpen}>
              {sectionState?.note && status === 'Rejected' && (
                <Alert severity="error" sx={{ mx: 2.5, mb: 1.5 }}>
                  Motivul respingerii: {sectionState.note}
                </Alert>
              )}

              {isPfaSection ? (
                <Box sx={{ px: 2.5, pb: 2 }}>
                  <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 1.5 }}>
                    Secțiunea PFA se validează prin aprobarea dosarului (CUI + certificat de înregistrare).
                  </Typography>
                  {pfaStatus.toLowerCase() === 'pending' && (
                    <Stack direction="row" spacing={1.5}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircleRoundedIcon />}
                        onClick={onOpenPfaApproveDialog}
                        sx={{ fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, boxShadow: 'none' }}
                      >
                        Validează secțiunea (aprobă PFA)
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CancelRoundedIcon />}
                        onClick={onOpenPfaRejectDialog}
                        sx={{ fontWeight: 700, borderColor: '#ef4444', color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.06), borderColor: '#dc2626' } }}
                      >
                        Respinge
                      </Button>
                    </Stack>
                  )}
                </Box>
              ) : (
                <>
                  {sectionDocs.length === 0 ? (
                    <Typography variant="body2" sx={{ color: TOKENS.textMuted, px: 2.5, pb: 2 }}>
                      Clientul nu a încărcat încă documente pentru această secțiune.
                    </Typography>
                  ) : (
                    <Box sx={{ pb: 1 }}>{sectionDocs.map(renderDocRow)}</Box>
                  )}

                  {canAct && (
                    <Stack direction="row" spacing={1.5} sx={{ px: 2.5, pb: 2, pt: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={actionBusy || status === 'Rejected'}
                        startIcon={<CheckCircleRoundedIcon />}
                        onClick={() => setConfirmValidate(section.key)}
                        sx={{ fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, boxShadow: 'none' }}
                      >
                        Validează secțiunea
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={actionBusy || status === 'Rejected'}
                        startIcon={<CancelRoundedIcon />}
                        onClick={() => { setRejectNote(''); setRejectDialog(section.key) }}
                        sx={{ fontWeight: 700, borderColor: '#ef4444', color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.06), borderColor: '#dc2626' } }}
                      >
                        Respinge secțiunea
                      </Button>
                    </Stack>
                  )}
                </>
              )}
            </Collapse>
          </Box>
        )
      })}

      {/* Documente care nu aparțin secțiunilor de onboarding */}
      {otherDocuments.length > 0 && (
        <Box sx={{ borderTop: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
          <Box sx={{ px: 2.5, py: 1.8 }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: TOKENS.ink }}>
              Alte documente
            </Typography>
            <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
              Documente din afara secțiunilor de onboarding (buletin, rapoarte lunare etc.)
            </Typography>
          </Box>
          <Box sx={{ pb: 1 }}>{otherDocuments.map(renderDocRow)}</Box>
        </Box>
      )}

      {/* Confirmare validare secțiune */}
      <Dialog open={!!confirmValidate} onClose={() => setConfirmValidate(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Validează secțiunea</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
            Secțiunea va fi marcată ca validată și clientului i se deblochează pasul următor.
          </Typography>
          {confirmValidate && (() => {
            const cfg = ONBOARDING_SECTIONS.find((s) => s.key === confirmValidate)
            const docsInSection = documents.filter((d) => cfg?.docs?.some((c) => c.categories.includes(d.category)))
            const pending = docsInSection.filter((d) => d.status.toLowerCase() === 'pending').length
            return pending > 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {pending} documente din această secțiune nu sunt încă verificate. Poți valida oricum, dar verifică-le mai întâi dacă e cazul.
              </Alert>
            ) : null
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmValidate(null)} disabled={actionBusy}>Anulează</Button>
          <Button
            variant="contained"
            disabled={actionBusy}
            onClick={() => confirmValidate && handleValidate(confirmValidate)}
            sx={{ fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, boxShadow: 'none' }}
          >
            {actionBusy ? 'Se validează...' : 'Validează'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Respingere secțiune cu motiv */}
      <Dialog open={!!rejectDialog} onClose={() => setRejectDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Respinge secțiunea</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 2 }}>
            Clientul va primi o notificare cu motivul respingerii și va putea corecta documentele.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Motivul respingerii (obligatoriu)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(null)} disabled={actionBusy}>Anulează</Button>
          <Button
            variant="contained"
            color="error"
            disabled={actionBusy || !rejectNote.trim()}
            onClick={() => rejectDialog && handleReject(rejectDialog)}
            sx={{ fontWeight: 700, boxShadow: 'none' }}
          >
            {actionBusy ? 'Se trimite...' : 'Respinge'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
