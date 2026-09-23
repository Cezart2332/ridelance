import { useEffect, useState } from 'react'
import { Box, ButtonBase, CircularProgress, Dialog, IconButton, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded'
import BrokenImageRoundedIcon from '@mui/icons-material/BrokenImageRounded'

import { chatService, type ChatAttachmentDto } from '../../services/chat.service'
import { formatFileSize } from '../../utils/fileSize'

// Tipurile pe care browserul le poate afișa ca <img>. HEIC nu — apare ca fișier de descărcat.
const PREVIEWABLE_IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Pozele deja descărcate în sesiune, pe mesaj: la schimbarea conversației sau la un mesaj nou nu
 * se mai cer o dată de la server.
 */
const imageCache = new Map<string, Promise<string>>()

function loadImage(messageId: string): Promise<string> {
  let cached = imageCache.get(messageId)
  if (!cached) {
    cached = chatService.downloadAttachment(messageId).then((blob) => URL.createObjectURL(blob))
    cached.catch(() => imageCache.delete(messageId))
    imageCache.set(messageId, cached)
  }
  return cached
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Fișierul dintr-un mesaj. Pozele se văd direct în conversație, ca pe WhatsApp: în bulă, cu
 * proporțiile lor, iar la click se deschid pe tot ecranul. Restul fișierelor apar ca un card cu
 * nume și mărime, descărcabil. Conținutul vine cu autentificarea utilizatorului.
 */
export function ChatAttachmentView({ messageId, attachment }: { messageId: string; attachment: ChatAttachmentDto }) {
  const isImage = PREVIEWABLE_IMAGES.includes(attachment.contentType.toLowerCase())
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!isImage) return undefined
    let cancelled = false
    loadImage(messageId)
      .then((url) => !cancelled && setImageUrl(url))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [isImage, messageId])

  const download = async () => {
    setDownloading(true)
    try {
      saveBlob(await chatService.downloadAttachment(messageId), attachment.fileName)
    } catch {
      setFailed(true)
    } finally {
      setDownloading(false)
    }
  }

  if (isImage && !failed) {
    return (
      <>
        <ButtonBase
          onClick={() => imageUrl && setOpen(true)}
          aria-label={`Deschide poza ${attachment.fileName}`}
          sx={{ mt: 0.5, display: 'block', borderRadius: 1.5, overflow: 'hidden', width: 280, maxWidth: '100%' }}
        >
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt={attachment.fileName}
              data-testid="chat-image"
              sx={{ display: 'block', width: '100%', height: 'auto', maxHeight: 360, objectFit: 'cover' }}
            />
          ) : (
            <Skeleton variant="rectangular" animation="wave" sx={{ width: '100%', height: 'auto', aspectRatio: '4 / 3' }} />
          )}
        </ButtonBase>

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullScreen
          slotProps={{
            // Numele ferestrei stă pe elementul cu role="dialog", nu pe fundal.
            paper: { 'aria-label': attachment.fileName, sx: { bgcolor: 'common.black', color: 'common.white' } },
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: { xs: 1, sm: 2 }, py: 1 }}>
            <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
              {attachment.fileName}
            </Typography>
            <Tooltip title="Descarcă">
              <IconButton onClick={() => void download()} disabled={downloading} aria-label="Descarcă poza" sx={{ color: 'inherit' }}>
                {downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadRoundedIcon />}
              </IconButton>
            </Tooltip>
            <IconButton onClick={() => setOpen(false)} aria-label="Închide" sx={{ color: 'inherit' }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          {/* Click pe fundal închide, ca pe telefon; pe poză nu. */}
          <Box
            onClick={() => setOpen(false)}
            sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 0, sm: 2 } }}
          >
            {imageUrl && (
              <Box
                component="img"
                src={imageUrl}
                alt={attachment.fileName}
                onClick={(e) => e.stopPropagation()}
                sx={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            )}
          </Box>
        </Dialog>
      </>
    )
  }

  const isPdf = attachment.contentType.toLowerCase() === 'application/pdf'
  const Icon = failed && isImage ? BrokenImageRoundedIcon : isPdf ? PictureAsPdfRoundedIcon : InsertDriveFileRoundedIcon

  return (
    <ButtonBase
      onClick={() => void download()}
      disabled={downloading}
      aria-label={`Descarcă ${attachment.fileName}`}
      sx={(theme) => ({
        mt: 0.75,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        pr: 1.5,
        width: 260,
        maxWidth: '100%',
        textAlign: 'left',
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
      })}
    >
      <Box
        sx={(theme) => ({
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: 1,
          display: 'grid',
          placeItems: 'center',
          color: isPdf ? 'error.main' : 'primary.main',
          bgcolor: alpha(isPdf ? theme.palette.error.main : theme.palette.primary.main, 0.1),
        })}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
          {attachment.fileName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {failed ? 'Nu am putut deschide fișierul. Încearcă din nou.' : formatFileSize(attachment.size)}
        </Typography>
      </Box>
      {downloading ? <CircularProgress size={18} /> : <DownloadRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />}
    </ButtonBase>
  )
}
