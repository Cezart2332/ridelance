import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Alert, Box, Button, CircularProgress, IconButton, ListItem, Stack, Tooltip, Typography } from '@mui/material'

import { StatusBadge, type StatusTone } from './StatusBadge'

/**
 * O acțiune de pe rândul de document: iconiță, tooltip, culoare din temă și un indicator propriu
 * cât timp cererea e în zbor.
 */
function RowAction({
  title,
  color,
  busy,
  onClick,
  children,
}: {
  title: string
  color: 'success.main' | 'error.main' | 'primary.dark'
  busy: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip title={title}>
      {/* `span`: un IconButton dezactivat nu emite evenimente, deci Tooltip n-ar mai apărea. */}
      <span>
        <IconButton size="small" onClick={onClick} disabled={busy} aria-label={title} sx={{ color }}>
          {busy ? <CircularProgress size={15} color="inherit" /> : children}
        </IconButton>
      </span>
    </Tooltip>
  )
}

/**
 * Un rând de document: nume, meta pe rândul doi, status, apoi aceleași acțiuni ca în panoul de
 * onboarding — bifă, respinge, deschide, descarcă — vizibile direct, nu ascunse într-un „⋯".
 *
 * Acțiunile sunt etichetate explicit și se așază pe un rând separat pe ecrane înguste.
 */
export function DocumentRow({
  name,
  meta,
  statusLabel,
  statusTone = 'neutral',
  onApprove,
  onReject,
  onOpen,
  onDownload,
  updatingStatus = false,
  opening = false,
  downloading = false,
  reviewNote,
  extra,
}: {
  name: string
  meta: string
  statusLabel?: string
  statusTone?: StatusTone
  /** Disponibilitatea este decisă de ecranul care folosește rândul. */
  onApprove?: () => void
  onReject?: () => void
  onOpen: () => void
  onDownload: () => void
  updatingStatus?: boolean
  opening?: boolean
  downloading?: boolean
  reviewNote?: string | null
  extra?: React.ReactNode
}) {
  return (
    <ListItem component="article" aria-label={name} divider sx={{ display: 'block', px: { xs: 2, sm: 2.5 }, py: 2 }}>
      <Stack direction="row" sx={{ gap: 1.5, alignItems: 'flex-start' }}>
        <Box sx={{ display: 'grid', placeItems: 'center', width: 36, height: 40, borderRadius: 1.5, bgcolor: 'grey.50', flexShrink: 0 }}>
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 21, color: 'text.secondary' }} />
        </Box>
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.5 }}>
          <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>{name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{meta}</Typography>
        </Stack>
      </Stack>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
        {statusLabel && <StatusBadge label={statusLabel} tone={statusTone} />}
        {extra}
        <Box sx={{ flex: 1 }} />
        <RowAction title="Deschide" color="primary.dark" busy={opening} onClick={onOpen}>
          <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
        </RowAction>
        <RowAction title="Descarcă" color="primary.dark" busy={downloading} onClick={onDownload}>
          <FileDownloadRoundedIcon sx={{ fontSize: 18 }} />
        </RowAction>
      </Stack>
      {(onApprove || onReject) && <Stack direction="row" sx={{ gap: 1, mt: 1, flexWrap: 'wrap' }}>
        {onApprove && (
          <Button size="small" variant="outlined" disabled={updatingStatus} onClick={onApprove} startIcon={<CheckCircleRoundedIcon />}>Aprobă document</Button>
        )}
        {onReject && (
          <Button size="small" color="error" disabled={updatingStatus} onClick={onReject} startIcon={<CancelRoundedIcon />}>Respinge document</Button>
        )}
        {updatingStatus && <CircularProgress size={18} aria-label="Se salvează statusul" />}
      </Stack>}
      {reviewNote && <Alert severity="error" icon={false} sx={{ mt: 1.5, overflowWrap: 'anywhere' }}><strong>Motivul respingerii:</strong> {reviewNote}</Alert>}
    </ListItem>
  )
}
