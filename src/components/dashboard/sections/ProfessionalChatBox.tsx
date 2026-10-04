import { useState, useEffect, useRef } from 'react'
import {
  Alert, Box, Paper, Typography, TextField, IconButton, Stack, CircularProgress, Divider
} from '@mui/material'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'

import { PANEL_COMPAT_TOKENS as TOKENS, fade as alpha } from '../../panel/tokens'
import { chatService, type ChatMessageDto } from '../../../services/chat.service'
import { getChatConnection, startChatConnection } from '../../../lib/signalr'
import { useAppSelector } from '../../../store/hooks'
import { groupMessagesByDate } from '../../../utils/chat'
import { ChatAttachmentView } from '../../chat/ChatAttachmentView'
import { ChatAttachButton, PendingAttachment } from '../../chat/ChatAttachmentPicker'
import { useChatComposer } from '../../chat/useChatComposer'

interface ProfessionalChatBoxProps {
  clientUserId: string
  clientName: string
}

export function ProfessionalChatBox({ clientUserId, clientName }: ProfessionalChatBoxProps) {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const composer = useChatComposer(roomId, (sent) => setMessages((prev) => [...prev, sent]))
  const sending = composer.sending
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const myUserId = useAppSelector((s) => s.auth.userId) || ''
  const myRole = useAppSelector((s) => s.auth.role) || ''

  useEffect(() => {
    let currentRoomId: string | null = null
    let disposed = false
    let joined = false
    const conn = getChatConnection()
    const onMessage = (msg: ChatMessageDto) => {
      if (disposed || (myRole === 'Contabil' && msg.senderRole === 'Admin')) return
      setMessages((prev) => [...prev, msg])
    }

    const loadChat = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const id = await chatService.getOrCreateRoom(clientUserId)
        if (disposed) return
        currentRoomId = id
        setRoomId(id)

        const history = await chatService.getMessages(id)
        if (disposed) return
        setMessages(history.messages)

        conn.on('ReceiveMessage', onMessage)
        await startChatConnection()
        if (disposed) return
        await conn.invoke('JoinRoom', id)
        joined = true
      } catch (err) {
        if (disposed) return
        console.error('Eroare la încărcarea chat-ului', err)
        setLoadError('Conversația nu a putut fi încărcată complet. Redeschide fila Mesaje pentru a reîncerca.')
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    loadChat()

    return () => {
      disposed = true
      conn.off('ReceiveMessage', onMessage)
      if (currentRoomId && joined) {
        conn.invoke('LeaveRoom', currentRoomId).catch(() => {})
      }
    }
  }, [clientUserId, myRole])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const canSend = chatMessage.trim() !== '' || composer.pendingFile !== null

  const handleSend = async () => {
    if (!canSend) return
    if (await composer.send(chatMessage)) setChatMessage('')
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        height: { xs: 'min(70vh, 520px)', md: 600 },
        minHeight: { xs: 360, md: 600 },
        display: 'flex',
        flexDirection: 'column',
        borderRadius: `${TOKENS.radius.xl}px`,
        border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
        boxShadow: TOKENS.shadow.sm,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 650, mb: 2 }}>Mesaje · {clientName}</Typography>
      
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 3, display: 'flex', flexDirection: 'column', pr: 1 }}>
        {loading ? (
          <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }} component="div">
            <CircularProgress size={32} sx={{ color: TOKENS.primary }} />
          </Stack>
        ) : messages.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <InboxRoundedIcon sx={{ fontSize: 40, color: TOKENS.textSubtle }} />
            <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>Niciun mesaj încă.</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {groupMessagesByDate(messages).map((group) => (
              <Box key={group.date}>
                <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                  <Divider sx={{ flex: 1 }} />
                  <Typography variant="caption" sx={{ px: 2, color: TOKENS.textSubtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {group.date}
                  </Typography>
                  <Divider sx={{ flex: 1 }} />
                </Box>
                <Stack spacing={1.5}>
                  {group.messages.map((message, index) => {
                    const isMe = message.senderId.toLowerCase() === myUserId.toLowerCase()
                    return (
                      <Box key={`${message.sentAtUtc}-${index}`} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            maxWidth: '85%',
                            borderRadius: `${TOKENS.radius.md}px`,
                            backgroundColor: isMe ? 'var(--rl-muted, rgba(92,203,245,0.12))' : TOKENS.surface,
                            border: `1px solid ${isMe ? 'transparent' : alpha(TOKENS.ink, 0.08)}`,
                          }}
                        >
                          {message.attachment && <ChatAttachmentView messageId={message.id} attachment={message.attachment} />}
                          {message.content && (
                            <Typography sx={{ color: TOKENS.ink, mt: message.attachment ? 0.75 : 0, mb: 0.5, fontSize: '0.85rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                              {message.content}
                            </Typography>
                          )}
                          <Typography sx={{ color: TOKENS.textSubtle, fontSize: '0.7rem', fontWeight: 600, textAlign: 'right' }}>
                            {new Date(message.sentAtUtc).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Paper>
                      </Box>
                    )
                  })}
                </Stack>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Stack>
        )}
      </Box>

      {loadError && <Alert severity="error" sx={{ mb: 1.5 }}>{loadError}</Alert>}
      {composer.pendingFile && (
        <Box sx={{ mt: -1.5, mb: 1.5 }}>
          <PendingAttachment file={composer.pendingFile} progress={composer.progress} onRemove={composer.clearFile} />
        </Box>
      )}
      {composer.error && (
        <Alert severity="error" onClose={() => composer.setError(null)} sx={{ mb: 1.5 }}>
          {composer.error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <ChatAttachButton disabled={!roomId || sending} onPick={composer.pickFile} onError={composer.setError} />
        <TextField
          slotProps={{ htmlInput: { 'aria-label': `Mesaj pentru ${clientName}` } }}
          fullWidth
          size="small"
          placeholder={composer.pendingFile ? 'Adaugă o descriere (opțional)...' : 'Scrie un mesaj...'}
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSend() }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: `${TOKENS.radius.md}px`,
              bgcolor: alpha(TOKENS.surface, 0.9),
              '& fieldset': { borderColor: alpha(TOKENS.ink, 0.08) },
              '&:hover fieldset': { borderColor: alpha(TOKENS.ink, 0.16) },
              '&.Mui-focused fieldset': { borderColor: alpha(TOKENS.primary, 0.6) },
            },
          }}
        />
        <IconButton 
          aria-label="Trimite mesaj"
          onClick={handleSend} 
          disabled={!roomId || !canSend || sending}
          sx={{ 
            bgcolor: TOKENS.primary, color: 'var(--rl-primary-fg, #fff)',
            '&:hover': { bgcolor: TOKENS.primaryStrong },
            '&.Mui-disabled': { bgcolor: alpha(TOKENS.ink, 0.1), color: alpha(TOKENS.ink, 0.3) }
          }}
        >
          {sending ? <CircularProgress size={20} color="inherit" /> : <SendRoundedIcon fontSize="small" />}
        </IconButton>
      </Box>
    </Paper>
  )
}
