import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'

import { documentService, type DocumentSummary } from '../../../../services/document.service'
import { DASHBOARD_TOKENS, dashboardInputSx, responsiveTableContainerSx } from '../../dashboardTheme'
import { PageHeader, Panel, StatCard, StatusChip } from '../../ui'
import { DateField } from '../../../common/DateField'

/**
 * Documentele societății.
 *
 * Nu are backend propriu: folosește exact modulul de documente al platformei, filtrat pe
 * categoriile care descriu o firmă. O tabelă separată „documente SRL" ar fi însemnat două locuri
 * în care expiră acte, iar alertele de pe Acasă citesc dintr-unul singur.
 */

/** Categoriile care aparțin firmei, nu unei persoane sau unei mașini. */
const COMPANY_CATEGORIES: { value: string; label: string; expires: boolean }[] = [
  { value: 'CertificatInregistrare', label: 'Certificat de înregistrare', expires: false },
  { value: 'CertificatConstatator', label: 'Certificat constatator', expires: false },
  { value: 'AutorizatieTransportAlternativ', label: 'Autorizație transport alternativ', expires: true },
  { value: 'CopieConforma', label: 'Copie conformă', expires: true },
  { value: 'AsigurareCalatori', label: 'Asigurare călători', expires: true },
]

const CATEGORY_LABELS = new Map(COMPANY_CATEGORIES.map((c) => [c.value, c.label]))

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Zile rămase până la o dată. Ceasul vine de la apelant: citirea lui în randare e impură. */
function daysUntil(iso: string, nowMs: number): number {
  return Math.ceil((new Date(iso).getTime() - nowMs) / 86_400_000)
}

/** Zilele rămase până la expirare decid tonul; „fără expirare" nu e o stare de alarmă. */
function ExpiryChip({ expiresAtUtc, nowMs }: { expiresAtUtc: string | null; nowMs: number }) {
  if (!expiresAtUtc) {
    return <StatusChip label="Fără expirare" tone="neutral" size="sm" />
  }

  const days = daysUntil(expiresAtUtc, nowMs)

  if (days < 0) return <StatusChip label="Expirat" tone="error" size="sm" outlined />
  if (days <= 30) {
    return <StatusChip label={`${days} ${days === 1 ? 'zi' : 'zile'}`} tone="warning" size="sm" outlined />
  }
  return <StatusChip label={formatDate(expiresAtUtc)} tone="active" size="sm" />
}

export function SrlCompanyDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  // Un singur „acum" pentru toată pagina: două citiri ale ceasului ar putea încadra același
  // document în praguri diferite, în aceeași randare.
  const [nowMs] = useState(() => Date.now())

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    let cancelled = false

    documentService
      .getByUser()
      .then((all) => {
        if (cancelled) return
        // Filtrarea e în frontend fiindcă endpointul întoarce toate documentele contului, iar
        // „ale firmei" e o citire, nu o proprietate stocată pe document.
        setDocuments(all.filter((d) => CATEGORY_LABELS.has(d.category)))
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca documentele.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const download = async (doc: DocumentSummary) => {
    try {
      await documentService.downloadAndSave(doc.id, doc.originalFileName)
    } catch {
      setError('Nu am putut descărca documentul.')
    }
  }

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={300} />
      </Stack>
    )
  }

  if (error && !documents) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  const items = documents ?? []
  const expiringSoon = items.filter((d) => {
    if (!d.expiresAtUtc) return false
    const days = daysUntil(d.expiresAtUtc, nowMs)
    return days >= 0 && days <= 30
  }).length
  const totalSize = items.reduce((sum, d) => sum + d.fileSize, 0)

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Documente societate"
        subtitle="Actele firmei, cu alerte înainte de expirare."
        actions={
          <Button
            variant="contained"
            disableElevation
            startIcon={<UploadRoundedIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            Încarcă document
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <StatCard label="Documente stocate" value={String(items.length)} />
        <StatCard label="Expiră în 30 de zile" value={String(expiringSoon)} />
        <StatCard label="Spațiu folosit" value={formatSize(totalSize)} />
      </Box>

      <Panel title="Dosarul firmei" subtitle="Certificate, autorizații și polițe.">
        {items.length === 0 ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, py: 2 }}>
            Niciun document încărcat. Începe cu certificatul de înregistrare.
          </Typography>
        ) : (
          <Box sx={responsiveTableContainerSx}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <Box component="thead">
                <Box component="tr">
                  {['Document', 'Tip', 'Încărcat', 'Expirare', ''].map((h, i) => (
                    <Box component="th" key={h || i} sx={headSx}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {items.map((doc) => (
                  <Box component="tr" key={doc.id}>
                    <Box component="td" sx={cellSx}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.86rem', color: DASHBOARD_TOKENS.ink }}>
                        {doc.originalFileName}
                      </Typography>
                      <Typography sx={{ fontSize: '0.76rem', color: DASHBOARD_TOKENS.textSubtle }}>
                        {formatSize(doc.fileSize)}
                      </Typography>
                    </Box>
                    <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
                      {CATEGORY_LABELS.get(doc.category) ?? doc.category}
                    </Box>
                    <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem' }}>
                      {formatDate(doc.uploadedAtUtc)}
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <ExpiryChip expiresAtUtc={doc.expiresAtUtc ?? null} nowMs={nowMs} />
                    </Box>
                    <Box component="td" sx={{ ...cellSx, textAlign: 'right' }}>
                      <Tooltip title="Descarcă">
                        <IconButton
                          size="small"
                          aria-label={`Descarcă ${doc.originalFileName}`}
                          onClick={() => void download(doc)}
                          sx={{ color: DASHBOARD_TOKENS.textMuted }}
                        >
                          <DownloadRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Panel>

      <UploadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onUploaded={() => {
          setDialogOpen(false)
          reload()
        }}
      />
    </Stack>
  )
}

function UploadDialog({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean
  onClose: () => void
  onUploaded: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState(COMPANY_CATEGORIES[0].value)
  const [expiresAt, setExpiresAt] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const selected = COMPANY_CATEGORIES.find((c) => c.value === category)

  const upload = async () => {
    if (!file) {
      setError('Alege un fișier.')
      return
    }

    setUploading(true)
    setError(null)
    try {
      await documentService.upload(
        file,
        category,
        undefined,
        undefined,
        // Data se trimite la miezul zilei UTC, ca fusul să n-o mute cu o zi înapoi.
        expiresAt ? new Date(`${expiresAt}T12:00:00Z`).toISOString() : undefined,
        setProgress,
      )
      setFile(null)
      setExpiresAt('')
      setProgress(0)
      onUploaded()
    } catch {
      setError('Nu am putut încărca documentul.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Încarcă document</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
              {error}
            </Alert>
          )}

          <TextField
            select
            label="Tip document"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            size="small"
            sx={dashboardInputSx}
          >
            {COMPANY_CATEGORIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Data de expirare se cere doar acolo unde documentul chiar expiră. */}
          {selected?.expires && (
            <DateField
              label="Expiră la"
              value={expiresAt}
              onChange={setExpiresAt}
              fullWidth
              size="small"
              sx={dashboardInputSx}
              helperText="Primești alertă cu 30 de zile înainte."
            />
          )}

          <Button
            variant="outlined"
            onClick={() => inputRef.current?.click()}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            {file ? file.name : 'Alege fișier'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            hidden
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              e.target.value = ''
            }}
          />

          {uploading && progress > 0 && (
            <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
              Se încarcă… {progress}%
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
          Renunță
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={uploading || !file}
          onClick={() => void upload()}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
        >
          {uploading ? 'Se încarcă…' : 'Încarcă'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const headSx = {
  textAlign: 'left' as const,
  py: 1,
  px: 1.2,
  fontSize: '0.75rem',
  fontWeight: 700,
  color: DASHBOARD_TOKENS.textMuted,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
}

const cellSx = {
  py: 1.3,
  px: 1.2,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
  verticalAlign: 'top' as const,
}
