import { useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'

import { TOKENS } from '../../../constants/tokens'
import type { EldriveStation } from '../../../data/eldrive'
import { DAY_PRICE, NIGHT_PRICE, NONSTOP_COLOR, NONSTOP_PRICE, googleMapsUrl, wazeUrl } from './stationRates'

/** Cardul de la pinul ales: tariful stației și cum ajungi la ea. */
export function EldriveStationCard({ station }: { station: EldriveStation }) {
  const [copied, setCopied] = useState(false)
  const nonstop = station.tariff === 'nonstop'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(station.address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // Clipboard blocat (context nesecurizat, permisiune refuzată): adresa e oricum afișată.
    }
  }

  return (
    <Box sx={{ width: 300, maxWidth: '78vw', p: 2, bgcolor: TOKENS.paper }}>
      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: TOKENS.ink, pr: 3, lineHeight: 1.3 }}>
        {station.name}
      </Typography>
      <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted, mt: 0.5, lineHeight: 1.45 }}>
        {station.address}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: nonstop ? '1fr' : '1fr 1fr', gap: 1, mt: 1.5 }}>
        {nonstop ? (
          <Rate label="Non-stop · 24/7" price={NONSTOP_PRICE} color={NONSTOP_COLOR} />
        ) : (
          <>
            <Rate label="Noapte · 22–06" price={NIGHT_PRICE} color={TOKENS.primaryStrong} />
            <Rate label="Zi · 06–22" price={DAY_PRICE} />
          </>
        )}
      </Box>

      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button
          size="small"
          variant="contained"
          href={googleMapsUrl(station)}
          target="_blank"
          rel="noopener noreferrer"
          disableElevation
          sx={{ flex: 1, fontWeight: 700, borderRadius: `${TOKENS.radius.md}px` }}
        >
          Google Maps
        </Button>
        <Button
          size="small"
          variant="outlined"
          href={wazeUrl(station)}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ flex: 1, fontWeight: 700, borderRadius: `${TOKENS.radius.md}px` }}
        >
          Waze
        </Button>
        <Button
          size="small"
          variant="text"
          onClick={() => void copy()}
          aria-label="Copiază adresa"
          sx={{ minWidth: 40, color: TOKENS.textMuted, borderRadius: `${TOKENS.radius.md}px` }}
        >
          {copied ? <CheckRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
        </Button>
      </Stack>
    </Box>
  )
}

function Rate({ label, price, color }: { label: string; price: string; color?: string }) {
  return (
    <Box
      sx={{
        p: 1.1,
        borderRadius: `${TOKENS.radius.md}px`,
        border: `1px solid ${color ? alpha(color, 0.3) : TOKENS.border}`,
        bgcolor: color ? alpha(color, 0.06) : 'transparent',
      }}
    >
      <Typography sx={{ fontSize: '0.68rem', color: TOKENS.textMuted, fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontSize: '1.05rem', fontWeight: 850, color: color ?? TOKENS.ink, lineHeight: 1.2, mt: 0.25 }}>
        {price} <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 650, color: TOKENS.textMuted }}>lei/kWh</Box>
      </Typography>
    </Box>
  )
}
