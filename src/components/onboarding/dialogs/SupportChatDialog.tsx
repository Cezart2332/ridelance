import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'

import { getChatConnection, startChatConnection, stopChatConnection } from '../../../lib/signalr'
import { chatService, type ChatMessageDto } from '../../../services/chat.service'
import { useAppSelector } from '../../../store/hooks'
import { getBucharestBusinessHoursStatus } from '../../../utils/businessHours'
import { ChatAttachmentView } from '../../chat/ChatAttachmentView'
import { ChatAttachButton, PendingAttachment } from '../../chat/ChatAttachmentPicker'
import { useChatComposer } from '../../chat/useChatComposer'
import { displaySx, TOKENS } from '../onboardingTheme'

interface SupportChatDialogProps {
  open: boolean
  onClose: () => void
  /** Când chatul e închis (în afara programului), omul are totuși unde scrie. */
  onEmail: () => void
  /** Pasul de la care s-a cerut ajutor — pus în câmp la primul mesaj, ca să nu mai fie întrebat. */
  stepLabel?: string
}

/**
 * Chatul cu suportul, din onboarding. Aceeași cameră ca în dashboard (`chat/support-room`): ce
 * scrie omul acum rămâne în conversația pe care o regăsește după ce intră în cont.
 */
export function SupportChatDialog({ open, onClose, onEmail, stepLabel }: SupportChatDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="support-chat-title"
      slotProps={{ paper: { sx: { borderRadius: `${TOKENS.radius.xl}px` } } }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, pt: 2.5 }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: `${TOKENS.radius.md}px`,
              display: 'grid',
              placeItems: 'center',
              color: TOKENS.primaryStrong,
              backgroundColor: TOKENS.primaryTint,
            }}
          >
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography
            id="support-chat-title"
            component="h2"
            sx={{ ...displaySx, fontSize: '1.05rem', fontWeight: 700, color: TOKENS.ink }}
          >
            Scrie-ne pe chat
          </Typography>
        </Stack>

        <IconButton onClick={onClose} aria-label="Închide" size="small">
          <CloseRoundedIcon sx={{ fontSize: 19, color: TOKENS.textMuted }} />
        </IconButton>
      </Stack>

      <DialogContent sx={{ px: 3, pb: 3, pt: 2 }}>
        {/* Conexiunea se deschide doar cât dialogul e deschis. */}
        {open && <SupportChat onEmail={onEmail} stepLabel={stepLabel} />}
      </DialogContent>
    </Dialog>
  )
}

function SupportChat({ onEmail, stepLabel }: Pick<SupportChatDialogProps, 'onEmail' | 'stepLabel'>) {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const composer = useChatComposer(roomId, (sent) => setMessages((prev) => [...prev, sent]))
  const endRef = useRef<HTMLDivElement>(null)
  const myUserId = useAppSelector((s) => s.auth.userId) || ''
  const hours = getBucharestBusinessHoursStatus(10, 18)

  useEffect(() => {
    let joined: string | null = null
    let cancelled = false

    chatService
      .getSupportRoom()
      .then(async ({ roomId: id }) => {
        if (cancelled) return
        setRoomId(id)
        const history = await chatService.getMessages(id)
        if (cancelled) return
        setMessages(history.messages)
        // Prima întrebare pleacă cu pasul în ea; o conversație deja începută nu mai are nevoie.
        if (history.messages.length === 0 && stepLabel) setText(`Am o întrebare la pasul „${stepLabel}”: `)

        setLoading(false)

        // Fără conexiune în timp real, conversația rămâne vizibilă; trimiterea arată eroarea ei.
        const conn = getChatConnection()
        conn.off('ReceiveMessage')
        conn.on('ReceiveMessage', (msg: ChatMessageDto) => {
          setMessages((prev) => [...prev, msg])
        })
        try {
          await startChatConnection()
          await conn.invoke('JoinRoom', id)
          joined = id
        } catch {
          // Istoricul rămâne pe ecran; o trimitere eșuată își arată singură eroarea.
        }
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      const conn = getChatConnection()
      conn.off('ReceiveMessage')
      if (joined) conn.invoke('LeaveRoom', joined).catch(() => {})
      void stopChatConnection()
    }
  }, [stepLabel])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Se poate scrie oricând; programul spune doar când vine răspunsul.
  const canSend = text.trim() !== '' || composer.pendingFile !== null

  const send = async () => {
    if (!canSend) return
    if (await composer.send(text)) setText('')
  }

  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={26} />
      </Stack>
    )
  }

  if (unavailable) {
    return (
      <Stack spacing={2}>
        <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
          Chatul nu e disponibil acum. Scrie-ne pe email și îți răspundem în maximum 24 de ore.
        </Typography>
        <Button variant="contained" onClick={onEmail} fullWidth>
          Trimite un email
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={1.5} data-testid="onboarding-support-chat">
      <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
        Program: {hours.label}. Conversația rămâne și în contul tău, la Suport.
      </Typography>

      {!hours.isOpen && (
        <Alert
          severity="info"
          sx={{ borderRadius: `${TOKENS.radius.md}px` }}
          action={
            <Button size="small" onClick={onEmail} sx={{ whiteSpace: 'nowrap' }}>
              Trimite email
            </Button>
          }
        >
          Acum ești în afara programului. Poți scrie oricând: îți răspundem în program.
        </Alert>
      )}

      <Stack
        spacing={1}
        sx={{
          minHeight: 160,
          maxHeight: 340,
          overflowY: 'auto',
          p: 1.25,
          borderRadius: `${TOKENS.radius.lg}px`,
          border: `1px solid ${TOKENS.border}`,
          backgroundColor: TOKENS.surface,
        }}
      >
        {messages.length === 0 && (
          <Typography variant="body2" sx={{ color: TOKENS.textSubtle, textAlign: 'center', my: 'auto', py: 4 }}>
            Spune-ne unde te-ai blocat. Poți atașa și o poză cu documentul.
          </Typography>
        )}
        {messages.map((message, index) => {
          const isMe = message.senderId.toLowerCase() === myUserId.toLowerCase()
          return (
            <Box
              key={`${message.sentAtUtc}-${index}`}
              sx={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                p: 1.1,
                borderRadius: `${TOKENS.radius.md}px`,
                backgroundColor: isMe ? TOKENS.primarySoft : TOKENS.paper,
                border: `1px solid ${TOKENS.border}`,
              }}
            >
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: TOKENS.ink }}>
                  {isMe ? 'Tu' : message.senderName}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: TOKENS.textSubtle }}>
                  {new Date(message.sentAtUtc).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Stack>
              {message.attachment && <ChatAttachmentView messageId={message.id} attachment={message.attachment} />}
              {message.content && (
                <Typography
                  sx={{ mt: 0.4, fontSize: '0.88rem', color: TOKENS.ink, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                  {message.content}
                </Typography>
              )}
            </Box>
          )
        })}
        <div ref={endRef} />
      </Stack>

      {composer.pendingFile && (
        <PendingAttachment file={composer.pendingFile} progress={composer.progress} onRemove={composer.clearFile} />
      )}
      {composer.error && (
        <Alert severity="error" onClose={() => composer.setError(null)} sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {composer.error}
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <ChatAttachButton
          disabled={composer.sending}
          onPick={composer.pickFile}
          onError={composer.setError}
        />
        <TextField
          fullWidth
          size="small"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void send()
            }
          }}
          placeholder={composer.pendingFile ? 'Adaugă o descriere (opțional)...' : 'Scrie un mesaj...'}
          slotProps={{ htmlInput: { 'aria-label': 'Mesaj pentru suport' } }}
        />
        <Button variant="contained" onClick={() => void send()} disabled={composer.sending || !canSend}>
          {composer.sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Trimite'}
        </Button>
      </Stack>
    </Stack>
  )
}
