import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Alert, Box, Button, CircularProgress, Collapse, IconButton, ListItem, Stack, Tooltip, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'

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
  color: 'success.main' | 'error.main' | 'primary.dark' | 'text.secondary'
  busy: boolean
  onClick: () => void
  children: ReactNode
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
 * Un rând de document, citit de sus în jos: ce act e (denumirea cerută de platformă), apoi fișierul
 * încărcat de client, apoi verdictul. Totul pe un singur rând, cu acțiunile la dreapta.
 *
 * Datele citite automat stau ascunse: la verificare contează actul, nu cele zece câmpuri OCR.
 * Se deschid dintr-un buton mic, doar când e nevoie de ele.
 */
export function DocumentRow({
  title,
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
  details,
  detailsLabel = 'Date citite',
}: {
  /** Denumirea standard a actului („Atestat șofer"), nu numele fișierului. */
  title: string
  /** Fișierul și restul detaliilor, pe rândul mic de dedesubt. */
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
  extra?: ReactNode
  /** Ce se deschide din butonul de detalii (datele citite). Se montează abia la deschidere. */
  details?: ReactNode
  detailsLabel?: string
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <ListItem component="article" aria-label={title} divider sx={{ display: 'block', px: { xs: 2, sm: 2.5 }, py: 1.75 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: { xs: 1.25, md: 2 }, alignItems: { md: 'center' } }}>
        <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'grid', placeItems: 'center', width: 34, height: 38, borderRadius: 1.5, bgcolor: 'action.hover', flexShrink: 0 }}>
            <InsertDriveFileOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.35, overflowWrap: 'anywhere' }}>{title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflowWrap: 'anywhere' }}>
              {meta}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" sx={{ alignItems: 'center', columnGap: 1.5, rowGap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
          {/* Două grupuri care nu se rup în ele: verdictul, apoi acțiunile. Pe telefon stau pe două rânduri. */}
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
            {statusLabel && <StatusBadge label={statusLabel} tone={statusTone} />}
            {extra}
          </Stack>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
            {onApprove && (
              <Button
                size="small"
                variant="outlined"
                color="success"
                disabled={updatingStatus}
                onClick={onApprove}
                startIcon={<CheckCircleRoundedIcon />}
              >
                Aprobă
              </Button>
            )}
            {onReject && (
              <Button size="small" color="error" disabled={updatingStatus} onClick={onReject} startIcon={<CancelRoundedIcon />}>
                Respinge
              </Button>
            )}
            {updatingStatus && (onApprove || onReject) && <CircularProgress size={16} aria-label="Se salvează statusul" />}
            <RowAction title="Deschide" color="primary.dark" busy={opening} onClick={onOpen}>
              <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
            </RowAction>
            <RowAction title="Descarcă" color="primary.dark" busy={downloading} onClick={onDownload}>
              <FileDownloadRoundedIcon sx={{ fontSize: 18 }} />
            </RowAction>
            {details && (
              <Tooltip title={detailsOpen ? `Ascunde ${detailsLabel.toLowerCase()}` : detailsLabel}>
                <IconButton
                  size="small"
                  aria-label={detailsLabel}
                  aria-expanded={detailsOpen}
                  onClick={() => setDetailsOpen((open) => !open)}
                  sx={{ color: 'text.secondary' }}
                >
                  <ExpandMoreRoundedIcon
                    sx={{ fontSize: 20, transform: detailsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Stack>

      {reviewNote && (
        <Alert severity="error" icon={false} sx={{ mt: 1.25, py: 0.25, overflowWrap: 'anywhere' }}>
          <strong>Motivul respingerii:</strong> {reviewNote}
        </Alert>
      )}

      {details && (
        <Collapse in={detailsOpen} unmountOnExit>
          <Box sx={{ mt: 1.5 }}>{details}</Box>
        </Collapse>
      )}
    </ListItem>
  )
}
