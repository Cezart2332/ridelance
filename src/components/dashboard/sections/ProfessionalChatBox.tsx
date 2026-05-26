import { useState, useEffect, useRef } from 'react'
import {
  Box, Paper, Typography, TextField, IconButton, Stack, CircularProgress, Divider
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'

import { TOKENS } from '../../../constants/tokens'
import { chatService, type ChatMessageDto } from '../../../services/chat.service'
import { getChatConnection, startChatConnection } from '../../../lib/signalr'
import { useAppSelector } from '../../../store/hooks'
import { groupMessagesByDate } from '../../../utils/chat'

interface ProfessionalChatBoxProps {
  clientUserId: string
  clientName: string
}

export function ProfessionalChatBox({ clientUserId, clientName }: ProfessionalChatBoxProps) {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const myUserId = useAppSelector((s) => s.auth.userId) || ''
  const myRole = useAppSelector((s) => s.auth.role) || ''

  useEffect(() => {
    let currentRoomId: string | null = null

    const loadChat = async () => {
      setLoading(true)
      try {
        const id = await chatService.getOrCreateRoom(clientUserId)
        currentRoomId = id
        setRoomId(id)

        const history = await chatService.getMessages(id)
        setMessages(history.messages)

        const conn = getChatConnection()
        conn.off('ReceiveMessage') // Clear previous listeners
        conn.on('ReceiveMessage', (msg: ChatMessageDto) => {
          if (myRole === 'Contabil' && msg.senderRole === 'Admin') {
            return // Contabil cannot see Admin's messages
          }
          setMessages((prev) => [...prev, msg])
        })
        await startChatConnection()
        await conn.invoke('JoinRoom', id)
      } catch (err) {
        console.error('Eroare la încărcarea chat-ului', err)
      } finally {
        setLoading(false)
      }
    }

    loadChat()

    return () => {
      if (currentRoomId) {
        const conn = getChatConnection()
        conn.invoke('LeaveRoom', currentRoomId).catch(() => {})
      }
    }
  }, [clientUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!chatMessage.trim() || !roomId || sending) return

    setSending(true)
    try {
      const conn = getChatConnection()
      await conn.invoke('SendMessage', roomId, chatMessage.trim())
      setChatMessage('')
    } catch (err) {
      console.error('Send failed:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: { xs: 'min(70vh, 520px)', md: 600 },
        minHeight: { xs: 360, md: 600 },
        display: 'flex',
        flexDirection: 'column',
        borderRadius: TOKENS.radius.xl,
        border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
        boxShadow: TOKENS.shadow.sm,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Mesaje Client ({clientName})</Typography>
      
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
                            borderRadius: TOKENS.radius.md,
                            backgroundColor: isMe ? `rgba(92,203,245,0.12)` : TOKENS.surface,
                            border: `1px solid ${isMe ? 'transparent' : alpha(TOKENS.ink, 0.08)}`,
                          }}
                        >
                          <Typography sx={{ color: TOKENS.ink, mb: 0.5, fontSize: '0.85rem' }}>
                            {message.content}
                          </Typography>
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

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Scrie un mesaj..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSend() }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: TOKENS.radius.full,
              bgcolor: alpha(TOKENS.surface, 0.9),
              '& fieldset': { borderColor: alpha(TOKENS.ink, 0.08) },
              '&:hover fieldset': { borderColor: alpha(TOKENS.ink, 0.16) },
              '&.Mui-focused fieldset': { borderColor: alpha(TOKENS.primary, 0.6) },
            },
          }}
        />
        <IconButton 
          onClick={handleSend} 
          disabled={!chatMessage.trim() || sending}
          sx={{ 
            bgcolor: TOKENS.primary, color: '#fff',
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
