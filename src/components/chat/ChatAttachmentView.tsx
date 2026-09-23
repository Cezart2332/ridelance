import { useEffect, useState } from 'react'
import { Box, ButtonBase, CircularProgress, Dialog, IconButton, Stack, Tooltip, Typography } from '@mui/material'
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
 * Fișierul dintr-un mesaj: pozele se văd direct în conversație (click = mărire), restul apar ca
 * un card cu nume și mărime, descărcabil. Conținutul vine cu autentificarea utilizatorului.
 */
export function ChatAttachmentView({ messageId, attachment }: { messageId: string; attachment: ChatAttachmentDto }) {
  const isImage = PREVIEWABLE_IMAGES.includes(attachment.contentType.toLowerCase())
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!isImage) return undefined
    let url: string | null = null
    let cancelled = false
    chatService
      .downloadAttachment(messageId)
      .then((blob) => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setImageUrl(url)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
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
          aria-label={`Mărește poza ${attachment.fileName}`}
          sx={(theme) => ({
            mt: 0.75,
            display: 'block',
            borderRadius: 1.5,
            overflow: 'hidden',
            bgcolor: alpha(theme.palette.text.primary, 0.05),
            width: 220,
            maxWidth: '100%',
            aspectRatio: imageUrl ? 'auto' : '4 / 3',
          })}
        >
          {imageUrl ? (
            <Box component="img" src={imageUrl} alt={attachment.fileName} sx={{ display: 'block', width: '100%', maxHeight: 260, objectFit: 'cover' }} />
          ) : (
            <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={20} />
            </Stack>
          )}
        </ButtonBase>
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" aria-label={attachment.fileName}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 2, py: 1 }}>
            <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
              {attachment.fileName}
            </Typography>
            <Tooltip title="Descarcă">
              <IconButton onClick={() => void download()} disabled={downloading} aria-label="Descarcă poza">
                <DownloadRoundedIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={() => setOpen(false)} aria-label="Închide">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          {imageUrl && <Box component="img" src={imageUrl} alt={attachment.fileName} sx={{ display: 'block', maxWidth: '100%', maxHeight: '80vh', mx: 'auto' }} />}
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
