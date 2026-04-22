import { Accordion, AccordionDetails, AccordionSummary, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'

import { dashboardFaqItems } from '../dashboardData'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'
import type { ChatMessage } from '../types'

type SupportChatTabProps = {
  chatMessage: string
  chatMessages: ChatMessage[]
  onChatChange: (value: string) => void
  onSend: () => void
}

export function SupportChatTab({ chatMessage, chatMessages, onChatChange, onSend }: SupportChatTabProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection:'column',
        gap: 16,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 2 }}>FAQ</Typography>
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
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Chat suport</Typography>

        <Stack spacing={1.2} sx={{ mt: 2, maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
          {chatMessages.map((message, index) => (
            <Paper
              key={`${message.time}-${index}`}
              elevation={0}
              sx={{
                p: 1.2,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                backgroundColor:
                  message.sender === 'Tu' ? alpha(DASHBOARD_TOKENS.primary, 0.1) : DASHBOARD_TOKENS.surface,
                border: `1px solid ${DASHBOARD_TOKENS.border}`,
              }}
            >
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.86rem' }}>
                  {message.sender}
                </Typography>
                <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.75rem', fontWeight: 600 }}>
                  {message.time}
                </Typography>
              </Stack>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.6, fontSize: '0.9rem' }}>
                {message.text}
              </Typography>
            </Paper>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            value={chatMessage}
            onChange={(event) => onChatChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onSend()
              }
            }}
            placeholder="Scrie un mesaj pentru echipă..."
            sx={dashboardInputSx}
          />
          <Button
            variant="contained"
            onClick={onSend}
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
            Trimite
          </Button>
        </Stack>
      </Paper>
    </div>
  )
}
