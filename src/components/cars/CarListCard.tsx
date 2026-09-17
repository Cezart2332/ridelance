import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded'
import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link, useNavigate } from 'react-router-dom'

import { TOKENS } from '../../constants/tokens'
import { getCarImageUrl, type Car } from '../../services/cars.service'
import {
  formatCarOfferType,
  formatCarStatus,
  getCarStatusColor,
  isCarRentDisabled,
  isStayOffer,
} from '../../utils/carLabels'
import { hasActiveDiscount } from '../../utils/carPricing'
import { formatLei } from '../../utils/vehiclePricing'
import { CarOwnerBlock } from './CarOwnerBlock'
import { FavoriteButton } from './FavoriteButton'
import { StayAsterisk, StayPriceNote } from './StayPriceNote'
import { VDP } from './vdp/vdpLayout'

/**
 * Cardul public de mașină — unul singur, folosit în listă, pe landing și în dashboard.
 *
 * Rolul lui s-a schimbat: nu mai deschide formularul, ci duce pe pagina de detaliu. De aceea
 * butonul nu se dezactivează niciodată — și o mașină indisponibilă are o pagină care merită
 * citită, iar acolo CTA-ul devine „Anunță-mă”.
 *
 * Nici click-ul nu se mai numără aici: el duce la o vizualizare, care se contorizează pe VDP.
 *
 * Cardul întreg e clicabil, dar titlul și butonul sunt linkuri reale, ca să funcționeze
 * „deschide în tab nou” și navigarea de la tastatură. Rădăcina rămâne `Box` cu `onClick`,
 * altfel ar ieși ancore imbricate.
 *
 * Chiar e un card: fundal alb, chenar, colțuri, umbră. Până acum poza și textul stăteau direct pe
 * fundalul paginii, iar de când fundalul are tenta albastră din logo nu mai era clar unde se
 * termină un anunț și începe următorul. Albul cardului e și motivul pentru care `paper` a rămas
 * alb curat în tokeni.
 */

interface CarListCardProps {
  car: Car
  /** Dashboardul deschide într-un tab nou, ca sesiunea de lucru să nu se piardă. */
  newTab?: boolean
  /**
   * Slug-ul firmei, pe mini-site-ul ei: linkul devine `/{firma}/{masina}`.
   *
   * Lipsește în rest, unde anunțul se deschide la `/masini/{masina}` — aceeași pagină, dar adresa
   * spune de unde a fost deschisă, iar pe pagina firmei asta e tot ce se răsfoiește.
   */
  companySlug?: string
}

const COVER_RADIUS = `${VDP.radius.image}px`

export default function CarListCard({ car, newTab = false, companySlug }: CarListCardProps) {
  const navigate = useNavigate()

  const to = companySlug ? `/${companySlug}/${car.slug}` : `/masini/${car.slug}`
  const linkProps = newTab ? { target: '_blank' as const, rel: 'noopener' } : {}

  const cover = car.images[0]
  const photoCount = car.images.length
  const title = `${car.brand} ${car.model}, ${car.year}`
  const discounted = hasActiveDiscount(car)
  const unavailable = isCarRentDisabled(car.status)
  const categories = [...car.uberCategories, ...car.boltCategories].slice(0, 3)

  const open = () => {
    if (newTab) {
      window.open(to, '_blank', 'noopener')
      return
    }
    navigate(to)
  }

  return (
    <Box
      onClick={open}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        backgroundColor: TOKENS.paper,
        // Contur albastru, nu gri: pe fundalul cu tenta din logo un chenar de 6% negru se pierdea,
        // iar anunțurile păreau lipite unul de altul. Albastrul deschis desenează marginea fără să
        // concureze cu poza; la hover trece pe varianta tare, ca să se vadă care card e sub cursor.
        border: `1px solid ${TOKENS.primary}`,
        borderRadius: `${TOKENS.radius.lg}px`,
        // Poza urcă până în marginea cardului; colțurile ei le dă cardul, prin `overflow`.
        overflow: 'hidden',
        boxShadow: TOKENS.shadow.sm,
        transition: `transform ${TOKENS.duration} ${TOKENS.easing}, box-shadow ${TOKENS.duration} ${TOKENS.easing}, border-color ${TOKENS.duration} ${TOKENS.easing}`,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: TOKENS.shadow.lg,
          borderColor: TOKENS.primaryStrong,
        },
        '&:hover .car-card-cover img': { transform: 'scale(1.04)' },
        '&:hover .car-card-title': { textDecoration: 'underline' },
      }}
    >
      <Box
        className="car-card-cover"
        sx={{
          position: 'relative',
          aspectRatio: '16 / 10',
          overflow: 'hidden',
          backgroundColor: TOKENS.surfaceAlt,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {cover ? (
          <Box
            component="img"
            src={getCarImageUrl(cover.imageUrl)}
            alt={title}
            loading="lazy"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: `transform ${TOKENS.duration} ${TOKENS.easing}`,
            }}
          />
        ) : (
          <DirectionsCarFilledRoundedIcon sx={{ fontSize: 48, color: TOKENS.textSubtle }} />
        )}

        {isStayOffer(car.offerType) ? (
          <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
            <StayPriceNote>
              <Pill sx={{ position: 'static', cursor: 'help' }}>
                {formatCarOfferType(car.offerType)}
                <StayAsterisk />
              </Pill>
            </StayPriceNote>
          </Box>
        ) : (
          <Pill sx={{ top: 8, left: 8 }}>{formatCarOfferType(car.offerType)}</Pill>
        )}

        {/* Colțul din dreapta-sus e al inimii; pastila de reducere/status stă sub ea. */}
        <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
          <FavoriteButton carId={car.id} carTitle={title} />
        </Box>

        {discounted ? (
          <Pill sx={{ top: 50, right: 8, backgroundColor: '#ef4444', color: '#FFFFFF' }}>
            Reducere
          </Pill>
        ) : (
          unavailable && (
            <Pill sx={{ top: 50, right: 8, color: getCarStatusColor(car.status) }}>
              {formatCarStatus(car.status)}
            </Pill>
          )
        )}

        {photoCount > 1 && (
          <Pill sx={{ bottom: 8, right: 8 }}>
            <PhotoLibraryRoundedIcon sx={{ fontSize: 13 }} />
            {photoCount} poze
          </Pill>
        )}
      </Box>

      <Stack spacing={0.4} sx={{ p: 1.5, flexGrow: 1 }}>
        <Typography
          className="car-card-title"
          component={Link}
          to={to}
          {...linkProps}
          onClick={(event: React.MouseEvent) => event.stopPropagation()}
          sx={{
            fontSize: '0.92rem',
            fontWeight: 800,
            color: TOKENS.ink,
            lineHeight: 1.3,
            textDecoration: 'none',
          }}
        >
          {title}
        </Typography>

        <Typography noWrap sx={{ fontSize: '0.76rem', color: TOKENS.textMuted }}>
          {[car.engine, car.transmission, car.location].filter(Boolean).join(' · ')}
        </Typography>

        {categories.length > 0 && (
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', pt: 0.25 }}>
            {categories.map((category) => (
              <Box
                key={category}
                sx={{
                  px: 0.75,
                  py: 0.1,
                  borderRadius: `${TOKENS.radius.full}px`,
                  border: `1px solid ${TOKENS.border}`,
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  color: TOKENS.textMuted,
                }}
              >
                {category}
              </Box>
            ))}
          </Stack>
        )}

        <Box sx={{ pt: 0.6, mt: 'auto' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
            {discounted && (
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  color: TOKENS.textSubtle,
                  textDecoration: 'line-through',
                }}
              >
                {formatLei(car.oldPrice!)}
              </Typography>
            )}
            <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: TOKENS.ink }}>
              {formatLei(car.pricePerWeek)} lei
            </Typography>
            <Typography sx={{ fontSize: '0.74rem', color: TOKENS.textMuted }}>
              / săptămână
            </Typography>
          </Stack>

          {car.owner && (
            <Box sx={{ pt: 0.75 }}>
              <CarOwnerBlock owner={car.owner} />
            </Box>
          )}

          <Button
            fullWidth
            component={Link}
            to={to}
            {...linkProps}
            onClick={(event: React.MouseEvent) => event.stopPropagation()}
            variant="outlined"
            sx={{
              mt: 1,
              height: 34,
              fontSize: '0.8rem',
              borderRadius: COVER_RADIUS,
              fontWeight: 800,
              textTransform: 'none',
              color: TOKENS.ink,
              borderColor: TOKENS.borderHover,
              '&:hover': {
                borderColor: TOKENS.ink,
                backgroundColor: alpha(TOKENS.ink, 0.03),
              },
            }}
          >
            Vezi detalii
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}

/**
 * Pastilă albă peste imagine — fundal opac, nu translucid: pozele sunt imprevizibile.
 *
 * `position` din `sx` bate valoarea implicită: pastila cu informare e așezată de părinte, ca
 * declanșatorul tooltipului să fie el cel poziționat.
 */
function Pill({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        position: 'absolute',
        alignItems: 'center',
        px: 0.9,
        py: 0.3,
        borderRadius: `${TOKENS.radius.full}px`,
        backgroundColor: TOKENS.paper,
        color: TOKENS.ink,
        fontSize: '0.66rem',
        fontWeight: 800,
        boxShadow: TOKENS.shadow.sm,
        ...sx,
      }}
    >
      {children}
    </Stack>
  )
}
