import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'

import { OwnerAvatar } from '../common/OwnerAvatar'
import { TOKENS } from '../../constants/tokens'
import type { CarOwner } from '../../services/cars.service'

/**
 * Cine închiriază mașina — pe cardul din marketplace și pe pagina de detaliu (spec §4.1).
 *
 * Agnostică la tipul de cont: primește un `CarOwner` și nu întreabă dacă e PFA sau SRL. Un
 * card care ar arăta proprietarul doar pentru firme ar spune, fără să vrea, că anunțurile
 * celorlalți n-au proprietar.
 *
 * Blocul e un `<a>` real către mini-site, imbricat într-un card care e el însuși clicabil, deci
 * opreste propagarea: un click pe numele firmei duce la firmă, nu la mașină.
 */

interface CarOwnerBlockProps {
  owner: CarOwner
  /** 28px pe cardul din listă, 32px pe pagina de detaliu (spec §4.1). */
  size?: 28 | 32
}

export function CarOwnerBlock({ owner, size = 28 }: CarOwnerBlockProps) {
  return (
    <Stack
      component={Link}
      to={`/${owner.slug}`}
      target="_blank"
      rel="noopener"
      onClick={(event: React.MouseEvent) => event.stopPropagation()}
      aria-label={`Vezi pagina publică a proprietarului ${owner.displayName}`}
      direction="row"
      spacing={0.9}
      sx={{
        alignItems: 'center',
        minWidth: 0,
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: `${TOKENS.radius.full}px`,
        '&:hover .car-owner-name': { textDecoration: 'underline' },
        '&:focus-visible': { outline: `2px solid ${TOKENS.primary}`, outlineOffset: 3 },
      }}
    >
      <OwnerAvatar name={owner.displayName} logoUrl={owner.logoUrl} size={size} />

      <Tooltip title={owner.displayName} enterDelay={600}>
        <Typography
          className="car-owner-name"
          noWrap
          sx={{
            fontSize: size === 32 ? '0.92rem' : '0.85rem',
            fontWeight: 700,
            color: TOKENS.ink,
            minWidth: 0,
          }}
        >
          {owner.displayName}
        </Typography>
      </Tooltip>

      {owner.verified && (
        <Box sx={{ display: 'flex', flexShrink: 0 }}>
          <VerifiedRoundedIcon
            titleAccess="Proprietar verificat"
            sx={{ fontSize: size === 32 ? 17 : 15, color: TOKENS.primaryStrong }}
          />
        </Box>
      )}
    </Stack>
  )
}
