import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import HeadsetMicRoundedIcon from '@mui/icons-material/HeadsetMicRounded'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import { useState } from 'react'

import { TOKENS } from '../onboardingTheme'
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
      <Button
        onClick={(event) => setAnchor(event.currentTarget)}
        startIcon={<HeadsetMicRoundedIcon sx={{ fontSize: 19 }} />}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          px: 1.5,
          height: 40,
          color: TOKENS.ink,
          fontWeight: 500,
          '&:hover': { backgroundColor: TOKENS.primarySoft },
        }}
      >
        Suport
      </Button>

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
            <MailOutlineRoundedIcon sx={{ fontSize: 19, color: TOKENS.textMuted }} />
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
            <EventAvailableRoundedIcon sx={{ fontSize: 19, color: TOKENS.textMuted }} />
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
