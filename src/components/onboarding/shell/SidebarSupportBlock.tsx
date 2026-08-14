import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import HeadsetMicRoundedIcon from '@mui/icons-material/HeadsetMicRounded'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import { Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material'
import { useState } from 'react'

import { SHELL } from '../shellTokens'
import { useOnboardingSupport } from '../supportContext'

/**
 * Ajutorul, într-un singur loc din rail. Două căi, atât: scrii sau vii. Mai multe opțiuni pe un
 * ecran de onboarding înseamnă doar o decizie în plus într-un moment în care userul e deja blocat.
 */
export function SidebarSupportBlock() {
  const { openEmail, openBooking } = useOnboardingSupport()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const close = () => setAnchor(null)

  const pick = (action: () => void) => () => {
    close()
    action()
  }

  return (
    <>
      <Box
        sx={{
          p: 1.75,
          borderRadius: SHELL.radius.card,
          border: `1px solid ${SHELL.border.subtle}`,
          backgroundColor: SHELL.bg.surface2,
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: SHELL.text.primary }}>
          Ai nevoie de ajutor?
        </Typography>
        <Typography sx={{ fontSize: 12, color: SHELL.text.secondary, mt: 0.25, mb: 1.25 }}>
          Spune-ne ce document nu găsești.
        </Typography>

        <Button
          onClick={(event) => setAnchor(event.currentTarget)}
          startIcon={<HeadsetMicRoundedIcon sx={{ fontSize: 17 }} />}
          aria-haspopup="menu"
          aria-expanded={anchor !== null}
          variant="contained"
          disableElevation
          sx={{
            width: '100%',
            height: 36,
            textTransform: 'none',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: SHELL.radius.input,
            backgroundColor: SHELL.text.primary,
            '&:hover': { backgroundColor: SHELL.text.primary, opacity: 0.9 },
          }}
        >
          Contactează suportul
        </Button>
      </Box>

      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={close}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ list: { sx: { minWidth: 260 } } }}
      >
        <MenuItem onClick={pick(openEmail)} sx={{ py: 1.25 }}>
          <ListItemIcon>
            <MailOutlineRoundedIcon sx={{ fontSize: 19, color: SHELL.text.secondary }} />
          </ListItemIcon>
          <ListItemText
            primary="Trimite un email"
            secondary="Răspundem în maximum 24h"
            slotProps={{
              primary: { sx: { fontWeight: 600, fontSize: '0.9rem' } },
              secondary: { sx: { fontSize: '0.78rem' } },
            }}
          />
        </MenuItem>

        <MenuItem onClick={pick(openBooking)} sx={{ py: 1.25 }}>
          <ListItemIcon>
            <EventAvailableRoundedIcon sx={{ fontSize: 19, color: SHELL.text.secondary }} />
          </ListItemIcon>
          <ListItemText
            primary="Programează o vizită la birou"
            secondary="Te ajutăm față în față"
            slotProps={{
              primary: { sx: { fontWeight: 600, fontSize: '0.9rem' } },
              secondary: { sx: { fontSize: '0.78rem' } },
            }}
          />
        </MenuItem>
      </Menu>
    </>
  )
}
