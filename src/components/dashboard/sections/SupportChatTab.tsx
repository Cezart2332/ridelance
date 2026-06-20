import { useEffect, useRef, useState } from 'react'
import {
  Accordion, AccordionDetails, AccordionSummary, Button,
  Alert, CircularProgress, Divider, Paper, Stack, TextField, Typography,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'

import { dashboardFaqItems } from '../dashboardData'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'
import { chatService, type ChatMessageDto } from '../../../services/chat.service'
import { getChatConnection, startChatConnection, stopChatConnection } from '../../../lib/signalr'
import { useAppSelector } from '../../../store/hooks'
import { groupMessagesByDate } from '../../../utils/chat'
import { Box } from '@mui/material'
import { AccountantChatTab } from './AccountantChatTab'
import { getBucharestBusinessHoursStatus } from '../../../utils/businessHours'

export function SupportChatTab() {
  const [activeChat, setActiveChat] = useState<'support' | 'accountant'>('support')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [noAgent, setNoAgent] = useState(false)
  const [sending, setSending] = useState(false)
  const [, setClockTick] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const myUserId = useAppSelector((s) => s.auth.userId) || ''
  const supportHours = getBucharestBusinessHoursStatus(10, 18)

  // Bootstrap: get support room, load history, connect to hub
  useEffect(() => {
    if (activeChat !== 'support') return

    let currentRoomId: string
    setLoading(true)
    setNoAgent(false)
    setMessages([])
    setRoomId(null)

    chatService.getSupportRoom()
      .then(async ({ roomId: id }) => {
        currentRoomId = id;
        setRoomId(id)

        // Load message history
        const history = await chatService.getMessages(id)
        setMessages(history.messages)

        // Connect to SignalR
        const conn = getChatConnection()
        conn.off('ReceiveMessage') // Clear previous listeners
        conn.on('ReceiveMessage', (msg: ChatMessageDto) => {
          setMessages((prev) => [...prev, msg])
        })
        await startChatConnection()
        await conn.invoke('JoinRoom', id)
      })
      .catch((err) => {
        // 404 means no support agent is available yet
        if (err?.response?.status === 404) {
          setNoAgent(true)
        } else {
          console.error(err)
        }
      })
      .finally(() => setLoading(false))

    return () => {
      const conn = getChatConnection()
      if (currentRoomId) {
        conn.invoke('LeaveRoom', currentRoomId).catch(() => {})
      }
      stopChatConnection()
    }
  }, [activeChat])

  // Auto scroll to bottom when messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick((value) => value + 1), 60000)
    return () => window.clearInterval(timer)
  }, [])

  const handleSend = async () => {
    if (!chatMessage.trim() || !roomId || sending || !supportHours.isOpen) return

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 2 }}>Întrebări Frecvente</Typography>
        {dashboardFaqItems.map((item) => (
          <Accordion
            key={item.title}
            disableGutters
            elevation={0}
            sx={{
              borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
              '&:before': { display: 'none' },
              backgroundColor: 'transparent',
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700 }}>{item.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, lineHeight: 1.7 }}>{item.text}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>Contact support</Typography>
        <Typography
          component="a"
          href="mailto:contact@ridelance.ro"
          sx={{
            mt: 0.6,
            display: 'inline-block',
            color: DASHBOARD_TOKENS.primaryStrong,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          contact@ridelance.ro
        </Typography>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 1,
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {[
          { id: 'support' as const, label: 'Chat suport', hours: 'Luni-Vineri 10:00-18:00' },
          { id: 'accountant' as const, label: 'Chat contabil', hours: 'Luni-Vineri 10:00-15:00' },
        ].map((item) => {
          const selected = activeChat === item.id
          return (
            <Button
              key={item.id}
              onClick={() => setActiveChat(item.id)}
              sx={{
                justifyContent: 'space-between',
                px: 2,
                py: 1.2,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                textTransform: 'none',
                color: selected ? DASHBOARD_TOKENS.primaryStrong : DASHBOARD_TOKENS.ink,
                bgcolor: selected ? `rgba(92,203,245,0.12)` : 'transparent',
                border: `1px solid ${selected ? 'rgba(92,203,245,0.35)' : 'transparent'}`,
                '&:hover': { bgcolor: `rgba(92,203,245,0.08)` },
              }}
            >
              <span style={{ fontWeight: 800 }}>{item.label}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.72 }}>{item.hours}</span>
            </Button>
          )
        })}
      </Paper>

      {activeChat === 'accountant' && <AccountantChatTab />}

      {activeChat === 'support' && <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
          Chat suport
        </Typography>
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem', mt: 0.4 }}>
          Program: {supportHours.label}
        </Typography>
        {!supportHours.isOpen && (
          <Alert severity="info" sx={{ mt: 2, borderRadius: DASHBOARD_TOKENS.radius.md }}>
            Chatul suport este disponibil doar în program. Poți citi mesajele existente, dar poți trimite mesaje în intervalul afișat.
          </Alert>
        )}

        {loading ? (
          <Stack sx={{ alignItems: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: DASHBOARD_TOKENS.primary }} />
          </Stack>
        ) : noAgent ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 2, fontSize: '0.9rem' }}>
            Chat-ul va fi disponibil dupa asignarea unui administrator pentru suport.
          </Typography>
        ) : (
          <>
            <Stack spacing={1.2} sx={{ mt: 2, maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
              {groupMessagesByDate(messages).map((group) => (
                <Box key={group.date}>
                  <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                    <Divider sx={{ flex: 1 }} />
                    <Typography variant="caption" sx={{ px: 2, color: DASHBOARD_TOKENS.textSubtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {group.date}
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Box>
                  <Stack spacing={1.2}>
                    {group.messages.map((message, index) => {
                      const isMe = message.senderId.toLowerCase() === myUserId.toLowerCase()
                      return (
                        <Paper
                          key={`${message.sentAtUtc}-${index}`}
                          elevation={0}
                          sx={{
                            p: 1.2,
                            borderRadius: DASHBOARD_TOKENS.radius.md,
                            backgroundColor: isMe
                              ? `rgba(92,203,245,0.10)`
                              : DASHBOARD_TOKENS.surface,
                            border: `1px solid ${DASHBOARD_TOKENS.border}`,
                          }}
                        >
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.86rem' }}>
                              {isMe ? 'Tu' : message.senderName}
                            </Typography>
                            <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.75rem', fontWeight: 600 }}>
                              {new Date(message.sentAtUtc).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Stack>
                          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.6, fontSize: '0.9rem' }}>
                            {message.content}
                          </Typography>
                        </Paper>
                      )
                    })}
                  </Stack>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleSend() }
                }}
                placeholder="Scrie un mesaj pentru echipă..."
                sx={dashboardInputSx}
                disabled={!supportHours.isOpen}
              />
              <Button
                variant="contained"
                onClick={handleSend}
                disabled={sending || !chatMessage.trim() || !supportHours.isOpen}
                sx={{
                  borderRadius: DASHBOARD_TOKENS.radius.full,
                  px: 2.4,
                  color: '#fff',
                  backgroundColor: DASHBOARD_TOKENS.primary,
                  fontWeight: 700,
                  boxShadow: DASHBOARD_TOKENS.shadow.glow,
                  '&:hover': { backgroundColor: DASHBOARD_TOKENS.primaryStrong },
                }}
              >
                {sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Trimite'}
              </Button>
            </Stack>
          </>
        )}
      </Paper>}
    </div>
  )
}
