import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import { Divider, IconButton, Menu, MenuItem, Tooltip } from '@mui/material'
import { useState, type ReactNode } from 'react'

export interface ActionMenuItem {
  key: string
  label: string
  onClick: () => void
  /** Acțiune distructivă: text roșu. Nu buton roșu — culoarea marchează, nu strigă. */
  destructive?: boolean
  disabled?: boolean
  icon?: ReactNode
  /** Linie de separare deasupra acestui element. */
  dividerBefore?: boolean
}

/**
 * Dropdown-ul „⋯". Ține acțiunile secundare în afara ecranului până sunt cerute, ca pe rând să
 * rămână un singur lucru de citit.
 */
export function ActionMenu({
  items,
  label = 'Mai multe acțiuni',
  size = 'small',
}: {
  items: ActionMenuItem[]
  label?: string
  size?: 'small' | 'medium'
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  if (items.length === 0) return null

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          size={size}
          aria-label={label}
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ color: 'text.secondary' }}
        >
          <MoreHorizRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {items.flatMap((item) => [
          ...(item.dividerBefore ? [<Divider key={`${item.key}-divider`} />] : []),
          <MenuItem
            key={item.key}
            disabled={item.disabled}
            onClick={() => {
              setAnchor(null)
              item.onClick()
            }}
            sx={item.destructive ? { color: 'error.main' } : undefined}
          >
            {item.label}
          </MenuItem>,
        ])}
      </Menu>
    </>
  )
}
