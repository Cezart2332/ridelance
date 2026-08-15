import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'

import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { PageHeader, StatusChip, type StatusTone } from '../../ui'
import { documentService } from '../../../../services/document.service'
import {
  documentsOverviewService,
  type DocumentGroup,
  type DocumentOverviewItem,
  type DocumentOverviewStatus,
} from '../../../../services/documentsOverview.service'
import { getErrorMessage } from '../../../../utils/errorHandler'

const GROUP_COPY: Record<DocumentGroup, { title: string; subtitle: string; category: string }> = {
  personal: {
    title: 'Documente personale',
    subtitle: 'Actele tale personale și profesionale, preluate automat din onboarding.',
    category: 'CarteIdentitate',
  },
  pfa: {
    title: 'Documente PFA',
    subtitle: 'Actele PFA-ului tău.',
    category: 'CertificatInregistrare',
  },
  vehicle: {
    title: 'Documente mașină',
    subtitle: 'Actele autoturismului cu care lucrezi pe platforme.',
    category: 'Talon',
  },
}

/** Categoria în care se încarcă un document nou pentru fiecare tip din registry. */
const UPLOAD_CATEGORY: Record<string, string> = {
  'id-card': 'CarteIdentitate',
  'driving-license': 'PermisConducere',
  'professional-certificate': 'AtestatTransport',
  'criminal-record': 'CazierJudiciar',
  'medical-certificate': 'AdeverintaMedicala',
  'psychological-certificate': 'AvizPsihologic',
  'registration-certificate': 'CertificatInregistrare',
  constatator: 'CertificatConstatator',
  'vat-certificate': 'CertificatTvaIntracomunitar',
  'registration-document': 'Talon',
  'vehicle-identity-card': 'CarteIdentitateAuto',
  rca: 'RCA',
  'passenger-insurance': 'AsigurareCalatori',
  casco: 'Casco',
  'copie-conforma': 'CopieConforma',
  'ecuson-uber': 'EcusonUber',
  'ecuson-bolt': 'EcusonBolt',
}

/**
 * Cele trei stări roșii sunt singurele care semnalează ceva efectiv greșit. Un document
 * neîncărcat e neutru — altfel prima vizită ar arăta ca un ecran plin de erori.
 */
const STATUS_TONE: Record<DocumentOverviewStatus, StatusTone> = {
  Lipsa: 'neutral',
  InVerificare: 'neutral',
  Valid: 'active',
  ExpiraCurand: 'neutral',
  Expirat: 'error',
  Respins: 'error',
}

function statusLabel(item: DocumentOverviewItem): string {
  switch (item.status) {
    case 'Lipsa':
      return 'Lipsește'
    case 'InVerificare':
      return 'În verificare'
    case 'Respins':
      return 'Respins'
    case 'Expirat':
      return 'Expirat'
    case 'ExpiraCurand':
      // Serverul dă numărul; aici doar se scrie propoziția.
      return item.daysUntilExpiry === 0 ? 'Expiră azi' : `Expiră în ${item.daysUntilExpiry} zile`
    default:
      return 'Valid'
  }
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const [year, month, day] = value.split('-')
  return day && month && year ? `${day}.${month}.${year}` : value
}

function DocumentRow({
  item,
  busy,
  onView,
  onDownload,
  onReplace,
}: {
  item: DocumentOverviewItem
  busy: boolean
  onView: () => void
  onDownload: () => void
  onReplace: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const hasDocument = item.documentId !== null
  const validUntil = formatDate(item.expiresOn)
  const issuedOn = formatDate(item.issuedOn)

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${item.status === 'Expirat' ? alpha(DASHBOARD_TOKENS.stateError, 0.3) : DASHBOARD_TOKENS.border}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        bgcolor: DASHBOARD_TOKENS.paper,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.6 }}>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 750, fontSize: '0.95rem' }}>
              {item.label}
            </Typography>
            <StatusChip tone={STATUS_TONE[item.status]} label={statusLabel(item)} size="sm" />
            {item.isOptional && (
              <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.72rem' }}>opțional</Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={2} sx={{ mt: 0.6, flexWrap: 'wrap', rowGap: 0.3 }}>
            {issuedOn && (
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem' }}>
                Eliberat la {issuedOn}
              </Typography>
            )}
            {validUntil && (
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem' }}>
                Valabil până la {validUntil}
              </Typography>
            )}
            {!hasDocument && (
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem' }}>
                Nu avem încă acest document.
              </Typography>
            )}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
          {hasDocument && (
            <>
              <Tooltip title="Vezi document">
                <span>
                  <IconButton size="small" onClick={onView} disabled={busy}>
                    <VisibilityRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Descarcă">
                <span>
                  <IconButton size="small" onClick={onDownload} disabled={busy}>
                    <DownloadRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            hidden
            accept="image/*,application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onReplace(file)
              event.target.value = ''
            }}
          />
          <Button
            size="small"
            variant={hasDocument ? 'outlined' : 'contained'}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <UploadRoundedIcon />}
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: DASHBOARD_TOKENS.radius.full,
              whiteSpace: 'nowrap',
              ...(hasDocument
                ? {}
                : {
                    bgcolor: DASHBOARD_TOKENS.primary,
                    color: DASHBOARD_TOKENS.ink,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' },
                  }),
            }}
          >
            {hasDocument ? 'Înlocuiește' : 'Încarcă'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

/**
 * Una și aceeași pagină pentru Documente personale, PFA și mașină — se schimbă doar grupul.
 *
 * Registry-ul și statusurile vin de la server, deci cele trei pagini nu pot ajunge să spună
 * lucruri diferite despre același act, iar „Lipsește" apare exclusiv când chiar nu există
 * înregistrare: documentele din onboarding sunt aceleași rânduri, deci se preiau automat.
 */
export function DocumentsGroupPage({ group }: { group: DocumentGroup }) {
  /**
   * Ce s-a încărcat și pentru ce cheie. Ținând cheia lângă date, „se încarcă" se deduce
   * (`cheia încărcată ≠ cheia curentă`) în loc să fie pusă pe un `setState` din efect —
   * același tipar ca în `useDashboardData`.
   */
  const [reloadToken, setReloadToken] = useState(0)
  const [loaded, setLoaded] = useState<{
    key: string
    items: DocumentOverviewItem[]
    error: string | null
  }>({ key: '', items: [], error: null })
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const copy = GROUP_COPY[group]

  const key = `${group}|${reloadToken}`

  useEffect(() => {
    const controller = new AbortController()

    documentsOverviewService
      .getGroup(group, controller.signal)
      .then((data) => {
        // `?? []` nu e paranoia gratuită: pagina e montată în shell-ul dashboardului, iar un
        // răspuns fără listă ar arunca din randare și ar lua sidebar-ul cu ea.
        if (!controller.signal.aborted) setLoaded({ key, items: data.items ?? [], error: null })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setLoaded({ key, items: [], error: getErrorMessage(cause, 'Nu am putut încărca documentele.') })
      })

    return () => controller.abort()
  }, [key, group])

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])
  const loading = loaded.key !== key
  const items = loaded.items
  const error = loaded.error

  const handleReplace = async (item: DocumentOverviewItem, file: File) => {
    setBusyKey(item.key)
    try {
      await documentService.upload(file, UPLOAD_CATEGORY[item.key] ?? copy.category)
      setSnackbar({ open: true, message: `„${item.label}" a fost încărcat.`, severity: 'success' })
      reload()
    } catch (cause) {
      setSnackbar({
        open: true,
        message: getErrorMessage(cause, `Încărcarea documentului „${item.label}" a eșuat.`),
        severity: 'error',
      })
    } finally {
      setBusyKey(null)
    }
  }

  const withDocument = async (item: DocumentOverviewItem, action: (id: string, name: string) => Promise<void>) => {
    if (!item.documentId) return
    setBusyKey(item.key)
    try {
      await action(item.documentId, item.originalFileName ?? item.label)
    } catch (cause) {
      setSnackbar({ open: true, message: getErrorMessage(cause, 'Documentul nu a putut fi deschis.'), severity: 'error' })
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}>
          <CircularProgress size={28} sx={{ color: DASHBOARD_TOKENS.primary }} />
        </Stack>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md }}>
          {error}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => (
            <DocumentRow
              key={item.key}
              item={item}
              busy={busyKey === item.key}
              onView={() => withDocument(item, documentService.openInNewTab)}
              onDownload={() => withDocument(item, documentService.downloadAndSave)}
              onReplace={(file) => handleReplace(item, file)}
            />
          ))}
        </Stack>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
