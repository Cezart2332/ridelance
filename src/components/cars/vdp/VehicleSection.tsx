import { Box, Typography } from '@mui/material'
import { type ReactNode } from 'react'

import { TOKENS } from '../../../constants/tokens'
import { VDP } from './vdpLayout'

/**
 * O secțiune din coloana stângă: titlu, conținut, linie.
 *
 * Ritmul vertical al paginii vine din faptul că **toate** secțiunile trec pe aici. Dacă una își
 * desenează singură titlul sau divider-ul, se vede imediat — de asta componenta nu are variante.
 *
 * Fără iconițe de „info": explicațiile de lângă titluri repetau ce spune conținutul de dedesubt.
 */
interface VehicleSectionProps {
  /** Ancora pentru bara de secțiuni. */
  id: string
  title: string
  /** Ultima secțiune nu are linie dedesubt: ar despărți conținutul de nimic. */
  last?: boolean
  children: ReactNode
}

export function VehicleSection({ id, title, last = false, children }: VehicleSectionProps) {
  return (
    <Box
      component="section"
      id={id}
      sx={{
        // Ancora trebuie să se oprească sub barele lipite, nu dedesubtul lor.
        scrollMarginTop: { xs: VDP.headerOffset.xs + 16, md: VDP.headerOffset.md + 16 },
      }}
    >
      <Typography
        variant="h2"
        sx={{
          fontSize: 21,
          lineHeight: 1.25,
          color: TOKENS.ink,
          mb: 2.5,
          ...VDP.display,
        }}
      >
        {title}
      </Typography>

      {children}

      {!last && (
        <Box
          sx={{
            mt: `${VDP.sectionGap}px`,
            mb: `${VDP.sectionGap}px`,
            height: '1px',
            backgroundColor: TOKENS.border,
          }}
        />
      )}
    </Box>
  )
}
