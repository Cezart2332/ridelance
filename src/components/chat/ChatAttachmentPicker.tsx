import { useRef } from 'react'
import { Box, Chip, IconButton, LinearProgress, Tooltip } from '@mui/material'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'

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
          // Pozele mari se micșorează înainte de upload; restul trebuie să intre în limită.
          const compressible = file.type === 'image/jpeg' || file.type === 'image/png'
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

/** Fișierul ales, încă netrimis, deasupra câmpului de mesaj. */
export function PendingAttachment({
  file,
  progress,
  onRemove,
}: {
  file: File
  progress: number | null
  onRemove: () => void
}) {
  return (
    <Box sx={{ mt: 1.5 }}>
      <Chip
        icon={<AttachFileRoundedIcon />}
        label={`${file.name} · ${formatFileSize(file.size)}`}
        onDelete={progress == null ? onRemove : undefined}
        sx={{ maxWidth: '100%' }}
      />
      {progress != null && <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.75, borderRadius: 1 }} aria-label="Se încarcă fișierul" />}
    </Box>
  )
}
