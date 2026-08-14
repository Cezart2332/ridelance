import { Box, Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import { TOKENS } from '../../../constants/tokens'

/**
 * Textul partenerului: patru rânduri, apoi „Citește mai mult" care expandează pe loc.
 *
 * Titlul secțiunii nu e aici — îl pune `VehicleSection`, ca toate secțiunile să aibă același ritm.
 *
 * Conținutul e text simplu — coloana din baza de date nu ține markup — deci se randează ca atare,
 * cu păstrarea rândurilor. Nu e nevoie de sanitizare pentru că nu se interpretează nimic.
 */
export function VehicleDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const trimmed = text.trim()

  if (trimmed.length === 0) {
    return null
  }

  // Prag, nu măsurătoare: un text scurt nu are ce expanda, iar un buton care nu face nimic e mai
  // supărător decât un rând în plus de text.
  const clampable = trimmed.length > 220 || trimmed.split('\n').length > 4

  return (
    <Stack spacing={1.5}>
      <Box sx={{ position: 'relative' }}>
        <Typography
          sx={{
            color: TOKENS.textMuted,
            lineHeight: 1.7,
            whiteSpace: 'pre-line',
            ...(expanded || !clampable
              ? {}
              : {
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }),
          }}
        >
          {trimmed}
        </Typography>
      </Box>

      {clampable && (
        <Button
          onClick={() => setExpanded((value) => !value)}
          sx={{
            alignSelf: 'flex-start',
            p: 0,
            minWidth: 0,
            fontWeight: 700,
            textTransform: 'none',
            color: TOKENS.primaryStrong,
            '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
          }}
        >
          {expanded ? 'Arată mai puțin' : 'Citește mai mult'}
        </Button>
      )}
    </Stack>
  )
}
