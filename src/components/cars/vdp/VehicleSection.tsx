import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState, type ReactNode } from 'react'

import { TOKENS } from '../../../constants/tokens'
import { VDP } from './vdpLayout'

/**
 * O secțiune din coloana stângă: titlu, conținut, linie.
 *
 * Ritmul vertical al paginii vine din faptul că **toate** secțiunile trec pe aici. Dacă una își
 * desenează singură titlul sau divider-ul, se vede imediat — de asta componenta nu are variante.
 *
 * `id` e ancora pentru bara de secțiuni; `info` deschide o explicație, ca tooltip pe desktop și ca
 * bottom sheet pe mobil, fiindcă un tooltip la atingere e o promisiune nerespectată.
 */
interface VehicleSectionProps {
  id: string
  title: string
  info?: string
  /** Ultima secțiune nu are linie dedesubt: ar despărți conținutul de nimic. */
  last?: boolean
  children: ReactNode
}

export function VehicleSection({ id, title, info, last = false, children }: VehicleSectionProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <Box
      component="section"
      id={id}
      sx={{
        // Ancora trebuie să se oprească sub barele lipite, nu dedesubtul lor.
        scrollMarginTop: { xs: VDP.headerOffset.xs + 16, md: VDP.headerOffset.md + 16 },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2.5 }}>
        <Typography
          variant="h2"
          sx={{
            fontSize: 21,
            lineHeight: 1.25,
            color: TOKENS.ink,
            ...VDP.display,
          }}
        >
          {title}
        </Typography>

        {info && (
          <>
            <Box sx={{ flex: 1 }} />
            {isMobile ? (
              <IconButton
                size="small"
                aria-label={`Despre „${title}”`}
                onClick={() => setSheetOpen(true)}
                sx={{ color: TOKENS.textSubtle }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            ) : (
              <Tooltip title={info} placement="left" arrow>
                <InfoOutlinedIcon
                  aria-label={`Despre „${title}”`}
                  sx={{ fontSize: 18, color: TOKENS.textSubtle, cursor: 'help' }}
                />
              </Tooltip>
            )}
          </>
        )}
      </Stack>

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

      {info && (
        <Drawer
          anchor="bottom"
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          slotProps={{
            paper: {
              sx: {
                p: 3,
                pb: 'calc(24px + env(safe-area-inset-bottom))',
                borderTopLeftRadius: VDP.radius.card,
                borderTopRightRadius: VDP.radius.card,
              },
            },
          }}
        >
          <Typography sx={{ fontWeight: 800, color: TOKENS.ink, mb: 1 }}>{title}</Typography>
          <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.7 }}>{info}</Typography>
        </Drawer>
      )}
    </Box>
  )
}
