import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { CircularProgress, IconButton, ListItem, ListItemIcon, Stack, Tooltip, Typography } from '@mui/material'

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
 * Bifa și X-ul apar doar cât documentul e în așteptare; pe unul deja verificat n-ar avea ce face.
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
}: {
  name: string
  meta: string
  statusLabel?: string
  statusTone?: StatusTone
  /** Lipsesc când documentul nu mai e în așteptare. */
  onApprove?: () => void
  onReject?: () => void
  onOpen: () => void
  onDownload: () => void
  updatingStatus?: boolean
  opening?: boolean
  downloading?: boolean
}) {
  return (
    <ListItem divider sx={{ minHeight: 44, px: 2.5, gap: 1.5 }}>
      <ListItemIcon sx={{ minWidth: 0 }}>
        <InsertDriveFileOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
      </ListItemIcon>

      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {meta}
        </Typography>
      </Stack>

      {statusLabel && <StatusBadge label={statusLabel} tone={statusTone} />}

      <Stack direction="row" sx={{ flexShrink: 0 }}>
        {onApprove && (
          <RowAction
            title="Aprobă document"
            color="success.main"
            busy={updatingStatus}
            onClick={onApprove}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
          </RowAction>
        )}
        {onReject && (
          <RowAction
            title="Respinge document"
            color="error.main"
            busy={updatingStatus}
            onClick={onReject}
          >
            <CancelRoundedIcon sx={{ fontSize: 18 }} />
          </RowAction>
        )}
        <RowAction title="Deschide" color="primary.dark" busy={opening} onClick={onOpen}>
          <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
        </RowAction>
        <RowAction title="Descarcă" color="primary.dark" busy={downloading} onClick={onDownload}>
          <FileDownloadRoundedIcon sx={{ fontSize: 18 }} />
        </RowAction>
      </Stack>
    </ListItem>
  )
}
