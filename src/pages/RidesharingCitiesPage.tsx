import { useMemo, useRef, useState } from 'react'
import { Box, Container, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { TOKENS } from '../constants/tokens'
import { CoverageMap } from '../components/cities/LazyCoverageMap'
import {
  COVERAGE_CHECKED_AT,
  COVERAGE_DISCLAIMER,
  countFor,
  EXTRA_SOURCE,
  PLATFORMS,
  LOCATION_COUNT,
  RIDESHARING_LOCATIONS,
  type Platform,
  type PlatformId,
  type RidesharingLocation,
} from '../data/ridesharingCities'

/**
 * Unde se poate lucra pe ridesharing în România.
 *
 * Pagina răspunde la o singură întrebare, pusă de cineva care se gândește să înceapă: „platformele
 * astea merg și la mine în oraș?". Ordinea de pe ecran e ordinea în care se caută răspunsul —
 * titlul, cifrele, harta, apoi orașele. Harta ocupă toată lățimea fiindcă e prima verificare pe
 * care o face omul: se uită unde stă și vede dacă e punct acolo.
 *
 * Culorile mărcilor apar **doar** în logourile lor. Pe o pagină care compară trei companii,
 * colorarea secțiunilor în culoarea uneia ar fi arătat ca reclama lor, nu ca un material al nostru.
 */

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function RidesharingCitiesPage() {
  const [activePlatform, setActivePlatform] = useState<PlatformId | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  /**
   * Alegerea unui oraș dintr-un card aduce și harta în cadru.
   *
   * Fără asta, click-ul pe un card muta harta pe ascuns: ea e deasupra, iar cardurile sunt cu
   * câteva ecrane mai jos. Omul apăsa și nu se întâmpla nimic vizibil.
   *
   * Deselectarea nu mișcă nimic — n-are ce arăta.
   */
  const selectFromCard = (name: string | null) => {
    setSelected(name)
    if (!name) return

    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const visible = useMemo(() => {
    const needle = normalize(query.trim())
    return RIDESHARING_LOCATIONS.filter((location) => {
      if (activePlatform && !location.platforms.includes(activePlatform)) return false
      return !needle || normalize(location.name).includes(needle)
    })
  }, [activePlatform, query])

  return (
    <Box sx={{ py: { xs: 5, md: 8 } }}>
      <Container maxWidth="lg">
        <Hero />

        <Box ref={mapRef} sx={{ mt: { xs: 4, md: 6 } }}>
          {/* Harta primește toată lățimea și e cea mai înaltă bucată de pe pagină: la 47 de puncte
              pe o țară, orice tăiere din ea începe să lipească orașele unul de altul. */}
          <CoverageMap
            locations={RIDESHARING_LOCATIONS}
            activePlatform={activePlatform}
            selected={selected}
            onSelect={setSelected}
          />
          <MapLegend />
        </Box>

        <Box sx={{ mt: { xs: 5, md: 7 } }}>
          <Toolbar
            activePlatform={activePlatform}
            onPlatform={setActivePlatform}
            query={query}
            onQuery={setQuery}
            count={visible.length}
          />

          {visible.length === 0 ? (
            <Box
              sx={{
                mt: 4,
                py: 7,
                textAlign: 'center',
                border: `1px dashed ${alpha(TOKENS.ink, 0.16)}`,
                borderRadius: `${TOKENS.radius.lg}px`,
                color: TOKENS.textMuted,
              }}
            >
              Niciun oraș nu se potrivește cu ce ai căutat.
            </Box>
          ) : (
            <Box
              sx={{
                mt: 3.5,
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 2,
              }}
            >
              {visible.map((location) => (
                <CityCard
                  key={location.name}
                  location={location}
                  activePlatform={activePlatform}
                  selected={selected === location.name}
                  onSelect={() => selectFromCard(selected === location.name ? null : location.name)}
                />
              ))}
            </Box>
          )}
        </Box>

        <Sources />
      </Container>
    </Box>
  )
}

/**
 * Antetul.
 *
 * Cifrele stau pe o bandă, despărțite de linii, nu în trei cartonașe. Sunt trei mărimi de același
 * fel, care se citesc una lângă alta — trei cutii le-ar fi făcut să pară trei subiecte diferite.
 */
function Hero() {
  return (
    <Box>
      <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 2.5 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: TOKENS.primary,
            boxShadow: `0 0 0 5px ${alpha(TOKENS.primary, 0.16)}`,
          }}
        />
        <Typography
          sx={{
            fontSize: '0.78rem',
            fontWeight: 850,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: TOKENS.textMuted,
          }}
        >
          Acoperire ridesharing în România
        </Typography>
      </Stack>

      <Typography
        variant="h1"
        sx={{ fontSize: { xs: '2.3rem', md: '3.6rem' }, color: TOKENS.ink, maxWidth: 900 }}
      >
        Unde poți conduce pe Uber, Bolt și Blue
      </Typography>

      <Typography
        sx={{
          mt: 2.5,
          fontSize: { xs: '1rem', md: '1.15rem' },
          lineHeight: 1.7,
          color: TOKENS.textMuted,
          maxWidth: 720,
        }}
      >
        {LOCATION_COUNT} de orașe și zone, strânse din comunicările oficiale ale celor trei
        platforme. Caută-ți orașul înainte să-ți deschizi PFA-ul — de el depinde dacă ai unde lucra.
      </Typography>

      <Box
        sx={{
          mt: { xs: 4, md: 5 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          borderTop: `1px solid ${TOKENS.border}`,
          borderBottom: `1px solid ${TOKENS.border}`,
        }}
      >
        {PLATFORMS.map((platform, index) => (
          <Box
            key={platform.id}
            sx={{
              py: 3,
              px: { xs: 0, sm: 3 },
              pl: { sm: index === 0 ? 0 : 3 },
              borderTop: { xs: index === 0 ? 'none' : `1px solid ${TOKENS.border}`, sm: 'none' },
              borderLeft: { xs: 'none', sm: index === 0 ? 'none' : `1px solid ${TOKENS.border}` },
            }}
          >
            <PlatformLogo platform={platform} height={17} />
            <Typography
              sx={{
                mt: 1.8,
                fontSize: '2.6rem',
                fontWeight: 850,
                letterSpacing: '-0.045em',
                lineHeight: 1,
                color: TOKENS.ink,
              }}
            >
              {countFor(platform.id)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

/** Filtrul pe platformă și căutarea. Filtrarea se face cu logourile, nu cu numele scris. */
function Toolbar({
  activePlatform,
  onPlatform,
  query,
  onQuery,
  count,
}: {
  activePlatform: PlatformId | null
  onPlatform: (platform: PlatformId | null) => void
  query: string
  onQuery: (value: string) => void
  count: number
}) {
  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}
          role="group"
          aria-label="Filtrează după platformă"
        >
          <FilterChip active={activePlatform === null} onClick={() => onPlatform(null)}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800 }}>Toate</Typography>
          </FilterChip>

          {PLATFORMS.map((platform) => (
            <FilterChip
              key={platform.id}
              active={activePlatform === platform.id}
              onClick={() => onPlatform(activePlatform === platform.id ? null : platform.id)}
              label={platform.name}
            >
              <PlatformLogo platform={platform} height={15} />
            </FilterChip>
          ))}
        </Stack>

        <Box sx={{ position: 'relative', width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
          <SearchRoundedIcon
            sx={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 19,
              color: TOKENS.textSubtle,
              pointerEvents: 'none',
            }}
          />
          <Box
            component="input"
            value={query}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => onQuery(event.target.value)}
            placeholder="Caută un oraș"
            aria-label="Caută un oraș"
            sx={{
              width: '100%',
              font: 'inherit',
              fontSize: '0.95rem',
              color: TOKENS.ink,
              py: 1.3,
              pl: 5.2,
              pr: 2,
              borderRadius: `${TOKENS.radius.full}px`,
              border: `1px solid ${TOKENS.border}`,
              backgroundColor: TOKENS.paper,
              outline: 'none',
              transition: `border-color ${TOKENS.duration} ${TOKENS.easing}`,
              '&:focus': {
                borderColor: TOKENS.primary,
                boxShadow: `0 0 0 4px ${alpha(TOKENS.primary, 0.14)}`,
              },
              '&::placeholder': { color: TOKENS.textSubtle },
            }}
          />
        </Box>
      </Stack>

      <Typography sx={{ mt: 2, fontSize: '0.82rem', color: TOKENS.textSubtle }}>
        {count} {count === 1 ? 'rezultat' : 'rezultate'} · verificat {COVERAGE_CHECKED_AT}
      </Typography>
    </Box>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label?: string
  children: React.ReactNode
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
        px: 2.2,
        cursor: 'pointer',
        borderRadius: `${TOKENS.radius.full}px`,
        border: `1px solid ${active ? alpha(TOKENS.primary, 0.7) : TOKENS.border}`,
        backgroundColor: active ? alpha(TOKENS.primary, 0.1) : TOKENS.paper,
        color: TOKENS.ink,
        transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
        '&:hover': { borderColor: alpha(TOKENS.primary, 0.55) },
      }}
    >
      {children}
    </Box>
  )
}

/**
 * Cardul unui oraș.
 *
 * Cele trei mărci stau sub o linie, la baza cardului, nu amestecate în text: sunt răspunsul la
 * întrebarea pentru care s-a deschis pagina, iar pe aceeași poziție în fiecare card se citesc pe
 * verticală, cu ochiul, fără să fie nevoie să citești numele orașelor.
 *
 * Click-ul duce la punctul de pe hartă. Legătura merge în ambele sensuri — un card apăsat mută
 * harta, un punct apăsat aprinde cardul — altfel cele două ar fi două liste care se ignoră.
 */
function CityCard({
  location,
  activePlatform,
  selected,
  onSelect,
}: {
  location: RidesharingLocation
  activePlatform: PlatformId | null
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        textAlign: 'left',
        font: 'inherit',
        cursor: 'pointer',
        p: 2.2,
        borderRadius: `${TOKENS.radius.lg}px`,
        border: `1px solid ${selected ? alpha(TOKENS.primary, 0.75) : TOKENS.border}`,
        backgroundColor: selected ? alpha(TOKENS.primary, 0.06) : TOKENS.paper,
        transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
        '&:hover': {
          borderColor: alpha(TOKENS.primary, 0.55),
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Typography sx={{ fontSize: '1.02rem', fontWeight: 750, color: TOKENS.ink, lineHeight: 1.3 }}>
        {location.name}
      </Typography>

      {/* `mt: auto` împinge rândul la baza cardului, ca linia să cadă la aceeași înălțime în toată
          grila, indiferent dacă orașul are sau nu o precizare deasupra. */}
      <Stack
        direction="row"
        spacing={1.8}
        sx={{
          mt: 'auto',
          pt: 2,
          width: '100%',
          alignItems: 'center',
          borderTop: `1px solid ${TOKENS.border}`,
        }}
      >
        {PLATFORMS.map((platform) => {
          const available = location.platforms.includes(platform.id)
          const dimmed = Boolean(activePlatform) && activePlatform !== platform.id
          return (
            <PlatformLogo
              key={platform.id}
              platform={platform}
              height={14}
              // Trei stări, nu două: disponibil, indisponibil, și „nu despre asta întrebi acum".
              opacity={available ? (dimmed ? 0.35 : 1) : 0.14}
              grayscale={!available}
              suffix={available ? undefined : ' — indisponibil'}
            />
          )
        })}
      </Stack>
    </Box>
  )
}

/** Ce înseamnă mărimea punctelor de pe hartă. Fără ea, harta cere ghicit. */
function MapLegend() {
  const entries = [
    { size: 14, label: 'trei platforme' },
    { size: 10, label: 'două platforme' },
    { size: 7, label: 'o platformă' },
  ]

  return (
    <Stack
      direction="row"
      spacing={2.5}
      sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1.2, alignItems: 'center' }}
    >
      {entries.map((entry) => (
        <Stack key={entry.label} direction="row" spacing={0.9} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: entry.size,
              height: entry.size,
              borderRadius: '50%',
              backgroundColor: TOKENS.primary,
            }}
          />
          <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted }}>{entry.label}</Typography>
        </Stack>
      ))}
      <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textSubtle }}>
        · apasă un punct sau un card ca să le legi între ele
      </Typography>
    </Stack>
  )
}

/** Sursele, ca rând de linkuri. Închid pagina, fiindcă sunt ce o face verificabilă. */
function Sources() {
  const sources = [
    ...PLATFORMS.map((platform) => ({ url: platform.sourceUrl, label: platform.sourceLabel })),
    EXTRA_SOURCE,
  ]

  return (
    <Box sx={{ mt: { xs: 6, md: 9 }, pt: 3, borderTop: `1px solid ${TOKENS.border}` }}>
      <Typography
        sx={{
          fontSize: '0.74rem',
          fontWeight: 850,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: TOKENS.textSubtle,
          mb: 1.8,
        }}
      >
        Surse
      </Typography>

      <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 1.4 }}>
        {sources.map((source) => (
          <Stack
            key={source.url}
            component="a"
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            direction="row"
            spacing={0.6}
            sx={{
              alignItems: 'center',
              color: TOKENS.textMuted,
              textDecoration: 'none',
              transition: `color ${TOKENS.duration} ${TOKENS.easing}`,
              '&:hover': { color: TOKENS.ink },
            }}
          >
            <Typography sx={{ fontSize: '0.84rem', fontWeight: 600 }}>{source.label}</Typography>
            <NorthEastRoundedIcon sx={{ fontSize: 13, color: TOKENS.primaryStrong }} />
          </Stack>
        ))}
      </Stack>

      <Typography sx={{ mt: 2.5, fontSize: '0.8rem', lineHeight: 1.6, color: TOKENS.textSubtle, maxWidth: 640 }}>
        {COVERAGE_DISCLAIMER}
      </Typography>
    </Box>
  )
}

/**
 * Logoul unei platforme, la o înălțime dată.
 *
 * Lățimea vine din raportul mărcii, nu din `auto`: logourile au proporții foarte diferite — Uber e
 * de trei ori mai lat decât înalt, Bolt mai puțin de două — iar fără lățime rezervată rândul
 * tresare la încărcarea imaginilor.
 */
function PlatformLogo({
  platform,
  height,
  opacity = 1,
  grayscale = false,
  suffix = '',
}: {
  platform: Platform
  height: number
  opacity?: number
  grayscale?: boolean
  suffix?: string
}) {
  return (
    <Box
      component="img"
      src={platform.logo}
      alt={`${platform.name}${suffix}`}
      sx={{
        height,
        width: height * platform.aspect,
        objectFit: 'contain',
        opacity,
        filter: grayscale ? 'grayscale(1)' : 'none',
        transition: `opacity ${TOKENS.duration} ${TOKENS.easing}`,
      }}
    />
  )
}

export default RidesharingCitiesPage
