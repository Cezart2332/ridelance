import { useState } from 'react'
import { Box, Button, IconButton, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'

import { getCarImageUrl, type Car } from '../../../services/cars.service'
import type { Rental } from '../../../services/rentals.service'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { Amount, StatusChip } from '../ui'
import type { StatusTone } from '../ui'
import { ListingScoreIndicator } from './ListingScoreIndicator'

/**
 * O mașină din flotă, ca și card.
 *
 * Lista era un tabel de nouă coloane, bun la comparat anunțuri și prost la operat o flotă: ca să
 * dai mașina cuiva trebuia să pleci din ea, în altă pagină, și să o alegi din nou dintr-un select.
 * Cardul pune în același loc ce e mașina, ce se întâmplă cu ea acum și cele patru lucruri care se
 * fac pe ea — deschis dosarul, închiriere, contract, proces-verbal.
 *
 * Restul — publicare, editare, scoatere din flotă — stau în meniul din colț: se fac rar și n-au
 * de ce să concureze vizual cu operațiunile zilnice.
 */

const LISTING_STATE: Record<string, { label: string; tone: StatusTone }> = {
  Draft: { label: 'Nepublicat', tone: 'neutral' },
  Published: { label: 'Publicat', tone: 'active' },
  Paused: { label: 'Pe pauză', tone: 'neutral' },
  Archived: { label: 'Scoasă din flotă', tone: 'neutral' },
}

/** Doar stările care cer ceva. „Aprobat" și „nu necesită plată" nu se anunță. */
const APPROVAL_WARNINGS: Record<string, { label: string; tone: StatusTone }> = {
  Pending: { label: 'În validare', tone: 'warning' },
  Rejected: { label: 'Respins', tone: 'error' },
}

const PAYMENT_WARNINGS: Record<string, { label: string; tone: StatusTone }> = {
  Pending: { label: 'Necesită plată', tone: 'warning' },
  PastDue: { label: 'Plată eșuată', tone: 'error' },
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })

const formatKm = (km: number | null | undefined): string | null =>
  km == null ? null : `${km.toLocaleString('ro-RO')} km`

/**
 * A doua linie a blocului de închiriere.
 *
 * O închiriere care n-a început încă e tot o mașină ocupată, dar data care contează e alta: „până
 * la" pe un contract viitor ar fi ascuns tocmai faptul că mașina e liberă până atunci.
 */
function rentalLine(rental: Rental): string {
  const upcoming = rental.status === 'upcoming' || rental.status === 'draft'
  return upcoming
    ? `${rental.publicCode} · de la ${formatDate(rental.startAtUtc)}`
    : `${rental.publicCode} · până la ${formatDate(rental.endAtUtc)}`
}

export interface FleetCarCardProps {
  car: Car
  /** Închirierea care ține mașina acum, dacă e vreuna. */
  rental: Rental | null
  onOpen: () => void
  onNewRental: () => void
  onContract: () => void
  onProtocol: () => void
  onEdit: () => void
  onTogglePublish: () => void
  onArchive: () => void
  onPay: () => void
}

export function FleetCarCard({
  car,
  rental,
  onOpen,
  onNewRental,
  onContract,
  onProtocol,
  onEdit,
  onTogglePublish,
  onArchive,
  onPay,
}: FleetCarCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const closeMenu = () => setMenuAnchor(null)
  const run = (action: () => void) => () => {
    closeMenu()
    action()
  }

  const listing = LISTING_STATE[car.listingStatus] ?? { label: car.listingStatus, tone: 'neutral' as StatusTone }
  const approval = APPROVAL_WARNINGS[car.approvalStatus]
  const payment = PAYMENT_WARNINGS[car.paymentStatus]
  const archived = car.listingStatus === 'Archived'
  const cover = getCarImageUrl(car.images[0]?.imageUrl)
  const identity = [car.details?.plateNumber, formatKm(car.details?.mileage)].filter(Boolean).join(' · ')

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: `${DASHBOARD_TOKENS.radius.lg}px`,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.paper,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        overflow: 'hidden',
        transition: 'border-color 160ms ease, box-shadow 160ms ease',
        '&:hover': { borderColor: DASHBOARD_TOKENS.borderHover, boxShadow: DASHBOARD_TOKENS.shadow.md },
        // O mașină scoasă din flotă rămâne vizibilă, dar nu mai trage atenția.
        opacity: archived ? 0.7 : 1,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '16 / 9',
          bgcolor: DASHBOARD_TOKENS.surfaceAlt,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {cover ? (
          <Box
            component="img"
            src={cover}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <DirectionsCarFilledRoundedIcon sx={{ fontSize: 42, color: DASHBOARD_TOKENS.textSubtle }} />
        )}

        <Stack
          direction="row"
          spacing={0.7}
          sx={{ position: 'absolute', top: 10, left: 10, flexWrap: 'wrap', gap: 0.7 }}
        >
          <StatusChip label={listing.label} tone={listing.tone} size="sm" />
          {approval && <StatusChip label={approval.label} tone={approval.tone} size="sm" />}
          {payment && <StatusChip label={payment.label} tone={payment.tone} size="sm" />}
        </Stack>

        <IconButton
          size="small"
          aria-label={`Mai multe pentru ${car.brand} ${car.model}`}
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: alpha('#fff', 0.92),
            color: DASHBOARD_TOKENS.ink,
            '&:hover': { bgcolor: '#fff' },
          }}
        >
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Stack spacing={1.4} sx={{ p: 2, flexGrow: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Typography noWrap sx={{ fontWeight: 850, fontSize: '1rem', color: DASHBOARD_TOKENS.ink, minWidth: 0 }}>
              {car.brand} {car.model}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textSubtle, fontWeight: 700 }}>
              {car.year}
            </Typography>
          </Stack>
          <Typography noWrap sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>
            {identity || 'Fără număr de înmatriculare'}
          </Typography>
        </Box>

        {/* Cine are mașina acum. Fără închiriere, se spune că e liberă — nu se lasă gol. */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.2,
            py: 1,
            borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
            bgcolor: rental ? DASHBOARD_TOKENS.accentWash : alpha(DASHBOARD_TOKENS.ink, 0.03),
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: '0.82rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
              {rental ? rental.tenant.name : 'Liberă'}
            </Typography>
            <Typography noWrap sx={{ fontSize: '0.75rem', color: DASHBOARD_TOKENS.textMuted }}>
              {rental ? rentalLine(rental) : 'Nicio închiriere în desfășurare'}
            </Typography>
          </Box>
          <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
            <Amount value={car.pricePerWeek} unit="lei/săpt." size="row" decimals={0} />
          </Box>
        </Stack>

        {/* Scorul e vizibil doar proprietarului, pe anunțul lui (spec §5.2). */}
        {car.recommendationScore != null && (
          <ListingScoreIndicator score={car.recommendationScore} suggestions={car.scoreSuggestions ?? []} />
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Stack spacing={0.9}>
          <Button
            variant="contained"
            disableElevation
            fullWidth
            onClick={onOpen}
            startIcon={<FolderOpenRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
              bgcolor: DASHBOARD_TOKENS.accent,
              '&:hover': { bgcolor: DASHBOARD_TOKENS.accent },
            }}
          >
            Deschide dosarul
          </Button>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.8 }}>
            <QuickAction
              label="Închiriere"
              icon={<EventAvailableRoundedIcon sx={{ fontSize: 17 }} />}
              onClick={onNewRental}
              disabled={archived}
            />
            <QuickAction
              label="Contract"
              icon={<DescriptionRoundedIcon sx={{ fontSize: 17 }} />}
              onClick={onContract}
            />
            <QuickAction
              label="Proces-verbal"
              icon={<ArticleRoundedIcon sx={{ fontSize: 17 }} />}
              onClick={onProtocol}
            />
          </Box>
        </Stack>
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={closeMenu}
        slotProps={{ paper: { sx: { borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, minWidth: 210 } } }}
      >
        <MenuItem onClick={run(onEdit)} sx={menuItemSx}>
          Editează mașina
        </MenuItem>
        <MenuItem
          component="a"
          href={`/masini/${car.slug}`}
          target="_blank"
          rel="noopener"
          onClick={closeMenu}
          sx={menuItemSx}
        >
          Vezi anunțul public
        </MenuItem>
        <MenuItem onClick={run(onTogglePublish)} disabled={archived} sx={menuItemSx}>
          {car.listingStatus === 'Published' ? 'Retrage anunțul' : 'Publică anunțul'}
        </MenuItem>
        {payment && (
          <MenuItem onClick={run(onPay)} sx={menuItemSx}>
            Plătește anunțul
          </MenuItem>
        )}
        <MenuItem onClick={run(onArchive)} disabled={archived} sx={{ ...menuItemSx, color: DASHBOARD_TOKENS.stateError }}>
          Scoate din flotă
        </MenuItem>
      </Menu>
    </Paper>
  )
}

/** Butoanele mici de sub acțiunea principală. Aceeași greutate între ele, mai mică decât a ei. */
function QuickAction({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      sx={{
        flexDirection: 'column',
        gap: 0.3,
        py: 0.9,
        px: 0.5,
        textTransform: 'none',
        fontWeight: 700,
        fontSize: '0.72rem',
        lineHeight: 1.2,
        color: DASHBOARD_TOKENS.textMuted,
        borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        '&:hover': {
          borderColor: alpha(DASHBOARD_TOKENS.accent, 0.4),
          bgcolor: DASHBOARD_TOKENS.accentWash,
          color: DASHBOARD_TOKENS.accent,
        },
      }}
    >
      {icon}
      {label}
    </Button>
  )
}

const menuItemSx = { fontSize: '0.86rem', fontWeight: 700, py: 1.1 } as const

export default FleetCarCard
