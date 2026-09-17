import { Suspense, lazy, useMemo, useState } from 'react'
import { Box, ButtonBase, InputAdornment, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { ELDRIVE_MAP_SECTION, ELDRIVE_STATIONS, type EldriveStationTariff } from '../../../data/eldrive'
import { reloadOnceOnChunkError } from '../../../utils/lazyWithRetry'
import type { OfferTokens } from '../offerTokens'
import { DAY_PRICE, NIGHT_PRICE, NONSTOP_COLOR, NONSTOP_PRICE } from './stationRates'

/**
 * Stațiile Eldrive incluse în ofertă: filtre, căutare, lista și harta.
 *
 * Refacerea hărții primite de la partener, cu componentele și culorile noastre. Stă sub oferta
 * Eldrive și în pagina publică de Parteneri, și în Beneficii, deci primește tokenii ca argument.
 *
 * Harta (mapbox-gl, 1,8 MB) se încarcă separat: lista și filtrele apar imediat.
 */

const EldriveStationsMap = lazy(() =>
  import('./EldriveStationsMap').then((m) => ({ default: m.EldriveStationsMap })).catch(reloadOnceOnChunkError),
)

type Filter = 'all' | EldriveStationTariff

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Toate stațiile' },
  { key: 'daynight', label: 'Zi / noapte' },
  { key: 'nonstop', label: `${NONSTOP_PRICE} lei non-stop` },
]

/** Căutare fără diacritice: „bragadiru" găsește și „Popești" scris „popesti". */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function EldriveStations({ tokens }: { tokens: OfferTokens }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const visible = useMemo(() => {
    const needle = normalize(query.trim())
    return ELDRIVE_STATIONS.filter(
      (station) =>
        (filter === 'all' || station.tariff === filter) &&
        (!needle || normalize(`${station.name} ${station.address}`).includes(needle)),
    )
  }, [filter, query])

  if (ELDRIVE_STATIONS.length === 0) return null

  const changeFilter = (next: Filter) => {
    setFilter(next)
    setActiveId(null)
  }

  return (
    <Box component="section" aria-labelledby="eldrive-stations-title">
      <Typography
        sx={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: tokens.primaryStrong }}
      >
        {ELDRIVE_MAP_SECTION.kicker}
      </Typography>
      <Typography id="eldrive-stations-title" sx={{ fontWeight: 850, fontSize: '1.15rem', color: tokens.ink, mt: 0.5 }}>
        {ELDRIVE_MAP_SECTION.title}
      </Typography>
      <Typography sx={{ fontSize: '0.9rem', color: tokens.textMuted, mt: 0.5, mb: 2.5, maxWidth: 640, lineHeight: 1.6 }}>
        {ELDRIVE_MAP_SECTION.text}
      </Typography>

      {/* Filtre + căutare */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between', mb: 1.5 }}
      >
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          {FILTERS.map((item) => {
            const selected = filter === item.key
            return (
              <ButtonBase
                key={item.key}
                onClick={() => changeFilter(item.key)}
                aria-pressed={selected}
                sx={{
                  px: 1.75,
                  height: 36,
                  borderRadius: `${tokens.radius.md}px`,
                  border: `1px solid ${selected ? alpha(tokens.primary, 0.5) : tokens.border}`,
                  bgcolor: selected ? alpha(tokens.primary, 0.1) : tokens.paper,
                  color: selected ? tokens.primaryStrong : tokens.textMuted,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  transition: 'all 140ms ease',
                }}
              >
                {item.label}
              </ButtonBase>
            )
          })}
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <TextField
            size="small"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveId(null)
            }}
            placeholder="Caută stație sau adresă"
            sx={{ width: { xs: '100%', md: 260 }, '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.md}px`, bgcolor: tokens.paper } }}
            slotProps={{
              htmlInput: { 'aria-label': 'Caută stație sau adresă' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 18, color: tokens.textSubtle }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography sx={{ fontSize: '0.8rem', color: tokens.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {visible.length} {visible.length === 1 ? 'stație' : 'stații'}
          </Typography>
        </Stack>
      </Stack>

      {/* Lista + harta */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '340px minmax(0, 1fr)' },
          height: { md: 580 },
          border: `1px solid ${tokens.border}`,
          borderRadius: `${tokens.radius.lg}px`,
          overflow: 'hidden',
          bgcolor: tokens.paper,
        }}
      >
        <Box
          component="ul"
          aria-label="Stații Eldrive"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 1,
            overflowY: 'auto',
            maxHeight: { xs: 320, md: 'none' },
            borderRight: { md: `1px solid ${tokens.border}` },
            borderBottom: { xs: `1px solid ${tokens.border}`, md: 0 },
          }}
        >
          {visible.length === 0 && (
            <Typography component="li" sx={{ p: 3, textAlign: 'center', fontSize: '0.85rem', color: tokens.textMuted }}>
              Nicio stație nu corespunde căutării.
            </Typography>
          )}
          {visible.map((station) => {
            const active = station.id === activeId
            const nonstop = station.tariff === 'nonstop'
            const accent = nonstop ? NONSTOP_COLOR : tokens.primaryStrong
            return (
              <Box component="li" key={station.id}>
                <ButtonBase
                  onClick={() => setActiveId(active ? null : station.id)}
                  aria-current={active}
                  sx={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: '32px minmax(0, 1fr) auto',
                    gap: 1.25,
                    alignItems: 'center',
                    textAlign: 'left',
                    p: 1.25,
                    borderRadius: `${tokens.radius.md}px`,
                    bgcolor: active ? alpha(tokens.primary, 0.1) : 'transparent',
                    '&:hover': { bgcolor: active ? alpha(tokens.primary, 0.12) : alpha(tokens.ink, 0.03) },
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: `${tokens.radius.md}px`,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(accent, 0.1),
                      color: accent,
                    }}
                  >
                    <BoltRoundedIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: '0.85rem', fontWeight: 700, color: tokens.ink }}>
                      {station.name}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: '0.74rem', color: tokens.textMuted, mt: 0.2 }}>
                      {station.address}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: nonstop ? NONSTOP_COLOR : tokens.ink, whiteSpace: 'nowrap' }}>
                      {nonstop ? NONSTOP_PRICE : `${NIGHT_PRICE} / ${DAY_PRICE}`}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: tokens.textSubtle, whiteSpace: 'nowrap' }}>
                      {nonstop ? 'lei/kWh · 24/7' : 'lei/kWh'}
                    </Typography>
                  </Box>
                </ButtonBase>
              </Box>
            )
          })}
        </Box>

        <Box sx={{ position: 'relative', minHeight: { xs: 420, md: 0 } }}>
          <Suspense fallback={<Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0, height: '100%' }} />}>
            <EldriveStationsMap stations={visible} activeId={activeId} onSelect={setActiveId} />
          </Suspense>
        </Box>
      </Box>
    </Box>
  )
}
