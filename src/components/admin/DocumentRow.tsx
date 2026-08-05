import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import { ListItem, ListItemIcon, Stack, Typography } from '@mui/material'

import { ActionMenu, type ActionMenuItem } from './ActionMenu'
import { StatusBadge, type StatusTone } from './StatusBadge'

/**
 * Un rând de document: nume, meta pe rândul doi, status, acțiuni în „⋯".
 *
 * Cele patru iconițe mereu vizibile de dinainte (bifă verde, X roșu, deschide, descarcă) puneau
 * o acțiune ireversibilă lângă una banală, fără etichetă și fără tooltip. Acum sunt un meniu,
 * iar respingerea e text roșu în el.
 */
export function DocumentRow({
  name,
  meta,
  statusLabel,
  statusTone = 'neutral',
  actions,
}: {
  name: string
  meta: string
  statusLabel?: string
  statusTone?: StatusTone
  actions: ActionMenuItem[]
}) {
  return (
    <ListItem
      divider
      sx={{
        minHeight: 44,
        px: 2.5,
        gap: 1.5,
        // Acțiunile apar la hover, dar rămân vizibile la focus (tastatură) și pe touch, unde
        // hover-ul nu există.
        '& .row-actions': { opacity: 0 },
        '&:hover .row-actions, &:focus-within .row-actions': { opacity: 1 },
        '@media (hover: none)': { '& .row-actions': { opacity: 1 } },
      }}
    >
      <ListItemIcon sx={{ minWidth: 0 }}>
        <InsertDriveFileOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
      </ListItemIcon>

      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {meta}
        </Typography>
      </Stack>

      {statusLabel && <StatusBadge label={statusLabel} tone={statusTone} />}

      <Stack className="row-actions" sx={{ transition: 'opacity 120ms' }}>
        <ActionMenu items={actions} label={`Acțiuni pentru ${name}`} />
      </Stack>
    </ListItem>
  )
}
