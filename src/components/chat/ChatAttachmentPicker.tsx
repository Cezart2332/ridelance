import { useRef, useState } from 'react'
import { Box, Chip, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@mui/material'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

import { CHAT_ATTACHMENT_ACCEPT, CHAT_ATTACHMENT_MAX_BYTES } from '../../services/chat.service'
import { formatFileSize } from '../../utils/fileSize'

/** Butonul de atașare: alege un fișier, îl verifică și îl ține până la „Trimite”. */
export function ChatAttachButton({
  disabled,
  onPick,
  onError,
}: {
  disabled?: boolean
  onPick: (file: File) => void
  onError: (message: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={CHAT_ATTACHMENT_ACCEPT}
        data-testid="chat-attachment-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          // Pozele (în afară de GIF) se micșorează înainte de upload; restul trebuie să intre în limită.
          const compressible = file.type.startsWith('image/') && file.type !== 'image/gif'
          if (!compressible && file.size > CHAT_ATTACHMENT_MAX_BYTES) {
            onError('Fișierul e prea mare. Limita e 25 MB.')
            return
          }
          onPick(file)
        }}
      />
      <Tooltip title="Atașează o poză sau un fișier">
        <span>
          <IconButton onClick={() => inputRef.current?.click()} disabled={disabled} aria-label="Atașează o poză sau un fișier">
            <AttachFileRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>
    </>
  )
}

/**
 * Fișierul ales, încă netrimis, deasupra câmpului de mesaj. O poză apare ca miniatură (dacă
 * browserul o poate afișa), restul ca un chip cu nume și mărime.
 */
export function PendingAttachment(props: { file: File; progress: number | null; onRemove: () => void }) {
  // Alt fișier ales = altă miniatură: componenta se montează din nou.
  const { file } = props
  return <PendingAttachmentView key={`${file.name}-${file.size}-${file.lastModified}`} {...props} />
}

function PendingAttachmentView({
  file,
  progress,
  onRemove,
}: {
  file: File
  progress: number | null
  onRemove: () => void
}) {
  // Nu se eliberează la demontare: în StrictMode componenta se demontează o dată imediat și
  // miniatura ar rămâne goală. Câteva URL-uri de poze alese într-o sesiune nu contează.
  const [previewUrl] = useState(() => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null))
  const [previewFailed, setPreviewFailed] = useState(false)

  const uploading = progress != null

  return (
    <Box sx={{ mt: 1.5 }}>
      {previewUrl && !previewFailed ? (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Box
              component="img"
              src={previewUrl}
              alt={file.name}
              data-testid="chat-pending-preview"
              onError={() => setPreviewFailed(true)}
              sx={{ display: 'block', width: 72, height: 72, objectFit: 'cover', borderRadius: 1.5, opacity: uploading ? 0.6 : 1 }}
            />
            {!uploading && (
              <IconButton
                size="small"
                onClick={onRemove}
                aria-label="Renunță la poză"
                sx={(theme) => ({
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  p: 0.25,
                  bgcolor: 'background.paper',
                  boxShadow: theme.shadows[2],
                  '&:hover': { bgcolor: 'background.paper' },
                })}
              >
                <CloseRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 0 }} noWrap>
            {uploading ? 'Se trimite poza…' : 'Poză gata de trimis. Poți adăuga o descriere.'}
          </Typography>
        </Stack>
      ) : (
        <Chip
          icon={<AttachFileRoundedIcon />}
          label={`${file.name} · ${formatFileSize(file.size)}`}
          onDelete={uploading ? undefined : onRemove}
          sx={{ maxWidth: '100%' }}
        />
      )}
      {uploading && <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.75, borderRadius: 1 }} aria-label="Se încarcă fișierul" />}
    </Box>
  )
}
