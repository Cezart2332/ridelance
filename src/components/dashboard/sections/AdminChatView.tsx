import { useState, useEffect, useRef } from 'react'
import {
  Box, Paper, Typography, TextField, IconButton, Stack, CircularProgress, Avatar, Divider
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'

import { TOKENS } from '../../../constants/tokens'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { chatService, type ChatMessageDto } from '../../../services/chat.service'
import { getChatConnection, startChatConnection } from '../../../lib/signalr'
import { useAppSelector } from '../../../store/hooks'
import { groupMessagesByDate } from '../../../utils/chat'

interface AdminChatViewProps {
  pfas: any[]
}

export function AdminChatView({ pfas }: AdminChatViewProps) {
  const [selectedPfa, setSelectedPfa] = useState<any | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const myUserId = useAppSelector((s) => s.auth.userId) || ''

  useEffect(() => {
    let currentRoomId: string | null = null

    const loadChat = async () => {
      if (!selectedPfa) return
      setLoading(true)
      try {
        const id = await chatService.getOrCreateRoom(selectedPfa.userId)
        currentRoomId = id
        setRoomId(id)

        const history = await chatService.getMessages(id)
        setMessages(history.messages)

        const conn = getChatConnection()
        conn.off('ReceiveMessage') // Clear previous listeners
        conn.on('ReceiveMessage', (msg: ChatMessageDto) => {
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
  }, [selectedPfa])

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
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, gap: 3, height: '75vh' }}>
      {/* Sidebar with PFA List */}
      <Paper elevation={0} sx={{ borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(TOKENS.ink, 0.08)}`, bgcolor: alpha(TOKENS.surface, 0.5) }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Contacte</Typography>
        </Box>
        <Box sx={{ overflowY: 'auto', flex: 1, p: 1 }}>
          {pfas.map(pfa => (
            <Box
              key={pfa.id}
              onClick={() => setSelectedPfa(pfa)}
              sx={{
                p: 1.5,
                mb: 0.5,
                borderRadius: TOKENS.radius.md,
                cursor: 'pointer',
                bgcolor: selectedPfa?.id === pfa.id ? alpha(TOKENS.primary, 0.08) : 'transparent',
                '&:hover': { bgcolor: alpha(TOKENS.primary, 0.04) },
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(TOKENS.primary, 0.12), color: TOKENS.primaryStrong, fontWeight: 700, fontSize: '0.9rem' }}>
                {pfa.userName[0]}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: selectedPfa?.id === pfa.id ? 800 : 600, color: TOKENS.ink }} noWrap>
                  {pfa.userName}
                </Typography>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: TOKENS.textSubtle }} noWrap>
                    {pfa.userEmail}
                  </Typography>
                  {pfa.lastActivityAtUtc && (
                    <Typography variant="caption" sx={{ color: TOKENS.primaryStrong, fontWeight: 700, ml: 1, fontSize: '0.65rem' }}>
                      {new Date(pfa.lastActivityAtUtc).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Box>
          ))}
          {pfas.length === 0 && (
            <Typography variant="body2" sx={{ p: 2, color: TOKENS.textMuted, textAlign: 'center' }}>
              Niciun utilizator disponibil.
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Chat Area */}
      <Paper elevation={0} sx={{ borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedPfa ? (
          <>
            <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(TOKENS.ink, 0.08)}`, bgcolor: alpha(TOKENS.surface, 0.5), display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha(TOKENS.primary, 0.12), color: TOKENS.primaryStrong, fontWeight: 700 }}>
                {selectedPfa.userName[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{selectedPfa.userName}</Typography>
                <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>{selectedPfa.userEmail}</Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1, p: 2, overflowY: 'auto', bgcolor: alpha(TOKENS.surface, 0.2) }}>
              {loading ? (
                <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }} component="div">
                  <CircularProgress size={32} sx={{ color: TOKENS.primary }} />
                </Stack>
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
                          const isMe = message.senderId === myUserId
                          return (
                            <Box key={`${message.sentAtUtc}-${index}`} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  maxWidth: '75%',
                                  borderRadius: TOKENS.radius.md,
                                  backgroundColor: isMe ? `rgba(92,203,245,0.12)` : TOKENS.surface,
                                  border: `1px solid ${isMe ? 'transparent' : alpha(TOKENS.ink, 0.08)}`,
                                }}
                              >
                                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mb: 0.5, fontSize: '0.85rem' }}>
                                  {message.content}
                                </Typography>
                                <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.7rem', fontWeight: 600, textAlign: 'right' }}>
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

            <Box sx={{ p: 2, borderTop: `1px solid ${alpha(TOKENS.ink, 0.08)}`, bgcolor: TOKENS.paper }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }} component="div">
                <TextField
                  fullWidth
                  size="small"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleSend() }
                  }}
                  placeholder="Scrie un mesaj..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: TOKENS.radius.full,
                      bgcolor: alpha(TOKENS.surface, 0.8),
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: alpha(TOKENS.ink, 0.1) },
                      '&.Mui-focused fieldset': { borderColor: alpha(TOKENS.primary, 0.5) },
                    }
                  }}
                />
                <IconButton
                  onClick={handleSend}
                  disabled={sending || !chatMessage.trim() || loading}
                  sx={{
                    bgcolor: TOKENS.primary, color: '#fff',
                    '&:hover': { bgcolor: TOKENS.primaryStrong },
                    '&.Mui-disabled': { bgcolor: alpha(TOKENS.ink, 0.1), color: alpha(TOKENS.ink, 0.3) }
                  }}
                >
                  {sending ? <CircularProgress size={20} color="inherit" /> : <SendRoundedIcon fontSize="small" />}
                </IconButton>
              </Stack>
            </Box>
          </>
        ) : (
          <Stack spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }} component="div">
            <InboxRoundedIcon sx={{ fontSize: 48, color: alpha(TOKENS.ink, 0.1) }} />
            <Typography sx={{ color: TOKENS.textMuted }}>Selectează un client pentru a începe conversația</Typography>
          </Stack>
        )}
      </Paper>
    </Box>
  )
}
