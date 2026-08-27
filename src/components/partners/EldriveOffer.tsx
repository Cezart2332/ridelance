import { useEffect, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'

import {
  ELDRIVE_CAPABILITIES,
  ELDRIVE_NETWORK,
  ELDRIVE_NONSTOP,
  ELDRIVE_TARIFFS,
  ELDRIVE_UNIT,
  ELDRIVE_VAT_NOTE,
  eldriveTariffAt,
} from '../../data/eldrive'

/**
 * Oferta Eldrive, aceeași componentă în pagina publică de Parteneri și în Beneficii.
 *
 * Singurul lucru care deosebește oferta asta de a celorlalți parteneri e că prețul depinde de oră.
 * Un tabel cu două rânduri ar fi ascuns exact asta, așa că întrebarea reală — „dacă bag în priză
 * acum, cât plătesc?" — primește un răspuns, nu o cifră de căutat.
 *
 * Banda merge de la 06:00 la 06:00, nu de la miezul nopții: așa ziua rămâne un bloc întreg, iar
 * noaptea nu se sparge în două capete. Pe o axă care începe la 00:00, tariful de noapte ar fi
 * apărut ca două felii, dintre care una de 8% — imposibil de etichetat și de citit.
 */

interface OfferTokens {
  ink: string
  primary: string
  primaryStrong: string
  paper: string
  surface: string
  border: string
  textMuted: string
  textSubtle: string
  radius: { md: number; lg: number; xl: number; full: number }
}

interface EldriveOfferProps {
  tokens: OfferTokens
  /** Titlul secțiunii diferă între prezentarea publică și dashboard. */
  title: string
}

/** Prima oră de pe axă. Vezi comentariul componentei. */
const AXIS_START = 6
const HOURS = 24

/** Ora → poziția pe bandă, în procente. */
const hourToPercent = (hour: number) => (((hour - AXIS_START + HOURS) % HOURS) / HOURS) * 100

const NIGHT_SURFACE = '#141B2E'
const DAY_SURFACE = '#232F4D'

const TICKS = [6, 12, 18, 0]

const pad2 = (value: number) => String(value).padStart(2, '0')

export function EldriveOffer({ tokens, title }: EldriveOfferProps) {
  const night = ELDRIVE_TARIFFS.find((t) => t.kind === 'night')!
  const day = ELDRIVE_TARIFFS.find((t) => t.kind === 'day')!

  // Minutarul, nu secundarul: marcajul se mișcă vizibil o dată la 24 de minute, deci un tick pe
  // minut e deja mai des decât are nevoie cineva care se uită la un tarif.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const active = eldriveTariffAt(now)
  const nowPercent = hourToPercent(now.getHours() + now.getMinutes() / 60)

  return (
    <Stack spacing={3}>
      <Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'baseline' }, justifyContent: 'space-between', mb: 2 }}
        >
          <Typography sx={{ fontWeight: 850, fontSize: '1.15rem', color: tokens.ink }}>
            {title}
          </Typography>

          <Stack
            direction="row"
            spacing={0.9}
            sx={{
              alignItems: 'center',
              alignSelf: { xs: 'flex-start', sm: 'auto' },
              px: 1.4,
              py: 0.6,
              borderRadius: `${tokens.radius.full}px`,
              border: `1px solid ${alpha(tokens.primary, 0.35)}`,
              backgroundColor: alpha(tokens.primary, 0.08),
            }}
          >
            <BoltRoundedIcon sx={{ fontSize: 15, color: tokens.primaryStrong }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 750, color: tokens.ink }}>
              Acum {pad2(now.getHours())}:{pad2(now.getMinutes())} — {active.price} {ELDRIVE_UNIT}
            </Typography>
          </Stack>
        </Stack>

        {/* Banda de 24 de ore */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: 132, sm: 124 },
            borderRadius: `${tokens.radius.lg}px`,
            overflow: 'hidden',
            backgroundColor: NIGHT_SURFACE,
          }}
        >
          <Segment
            left={hourToPercent(day.fromHour)}
            width={((day.toHour - day.fromHour + HOURS) % HOURS || HOURS) / HOURS * 100}
            surface={DAY_SURFACE}
            icon={<LightModeRoundedIcon sx={{ fontSize: 14 }} />}
            label={day.label}
            hours={`${pad2(day.fromHour)}:00 – ${pad2(day.toHour)}:00`}
            price={day.price}
            priceColor="#FFFFFF"
            isActive={active.kind === 'day'}
            accent={tokens.primary}
          />
          <Segment
            left={hourToPercent(night.fromHour)}
            width={((night.toHour - night.fromHour + HOURS) % HOURS || HOURS) / HOURS * 100}
            surface={NIGHT_SURFACE}
            icon={<DarkModeRoundedIcon sx={{ fontSize: 14 }} />}
            label={night.label}
            hours={`${pad2(night.fromHour)}:00 – ${pad2(night.toHour)}:00`}
            price={night.price}
            // Noaptea e tariful mic. Accentul marchei stă pe el, nu pe cel scump: culoarea spune
            // când merită încărcat, nu doar că există două prețuri.
            priceColor={tokens.primary}
            isActive={active.kind === 'night'}
            accent={tokens.primary}
          />

          {/* Marcajul orei curente */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${nowPercent}%`,
              width: 2,
              backgroundColor: tokens.primary,
              boxShadow: `0 0 12px ${alpha(tokens.primary, 0.8)}`,
            }}
          />

          {/* Reperele de oră, pe talpa benzii */}
          <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 8, height: 14 }}>
            {TICKS.map((hour) => {
              const percent = hourToPercent(hour)
              return (
                <Typography
                  key={hour}
                  sx={{
                    position: 'absolute',
                    left: `${percent}%`,
                    // Primul reper stă lipit de marginea din stânga; centrarea l-ar fi tăiat.
                    transform: percent < 1 ? 'none' : 'translateX(-50%)',
                    pl: percent < 1 ? 1.4 : 0,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    color: 'rgba(255,255,255,0.42)',
                  }}
                >
                  {pad2(hour)}:00
                </Typography>
              )
            })}
          </Box>
        </Box>

        <Typography sx={{ mt: 1.4, fontSize: '0.84rem', color: tokens.textMuted, lineHeight: 1.6 }}>
          La {ELDRIVE_NONSTOP.stations}, {ELDRIVE_NONSTOP.price} {ELDRIVE_UNIT} non-stop. Prețurile
          se aplică stațiilor eligibile din rețea, {ELDRIVE_VAT_NOTE}.
        </Typography>
      </Box>

      {/* Rețeaua și ce vezi despre fiecare stație */}
      <Box
        sx={{
          borderTop: `1px solid ${tokens.border}`,
          pt: 3,
        }}
      >
        <Stack direction="row" spacing={1.2} sx={{ alignItems: 'baseline', mb: 2.5 }}>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: tokens.ink, lineHeight: 1 }}>
            {ELDRIVE_NETWORK.stationCount}
          </Typography>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: tokens.ink }}>
            stații eligibile
          </Typography>
          <Typography sx={{ fontSize: '0.92rem', color: tokens.textMuted }}>
            în {ELDRIVE_NETWORK.area}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: { xs: 2.2, md: 3 },
          }}
        >
          {ELDRIVE_CAPABILITIES.map((capability, index) => (
            <Box key={capability.title}>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: 1,
                  color: tokens.primaryStrong,
                  mb: 0.9,
                }}
              >
                {pad2(index + 1)}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: tokens.ink, mb: 0.5 }}>
                {capability.title}
              </Typography>
              <Typography sx={{ fontSize: '0.86rem', color: tokens.textMuted, lineHeight: 1.65 }}>
                {capability.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  )
}

interface SegmentProps {
  left: number
  width: number
  surface: string
  icon: React.ReactNode
  label: string
  hours: string
  price: string
  priceColor: string
  isActive: boolean
  accent: string
}

/** O felie din bandă: intervalul, tariful lui și starea „acum aici". */
function Segment({ left, width, surface, icon, label, hours, price, priceColor, isActive, accent }: SegmentProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: `${left}%`,
        width: `${width}%`,
        // Lățimea e procentul din zi pe care îl acoperă felia. Fără `border-box`, padding-ul s-ar
        // adăuga peste el: felia de noapte ieșea 36px în afara benzii și era tăiată de `overflow`,
        // iar textul din ea se așeza după o lățime pe care n-o avea.
        boxSizing: 'border-box',
        backgroundColor: surface,
        px: { xs: 1.2, sm: 1.8 },
        pt: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        // Feliile se ating; linia le desparte fără să adauge un chenar în jurul benzii.
        borderLeft: left > 0 ? '1px solid rgba(255,255,255,0.10)' : 'none',
      }}
    >
      <Stack
        direction="row"
        spacing={0.7}
        sx={{
          alignItems: 'center',
          color: isActive ? accent : 'rgba(255,255,255,0.55)',
          mb: 0.4,
        }}
      >
        {icon}
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 1 }}>
          {label.toUpperCase()}
        </Typography>
      </Stack>

      {/* Pe ecran îngust felia de noapte are o treime din bandă: unitatea trece pe rândul de
          dedesubt în loc să fie tăiată. */}
      <Stack direction="row" spacing={0.6} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
        <Typography
          sx={{
            fontSize: { xs: '1.35rem', sm: '1.6rem' },
            fontWeight: 900,
            letterSpacing: -0.5,
            color: priceColor,
            lineHeight: 1.1,
          }}
        >
          {price}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 650, color: 'rgba(255,255,255,0.55)' }}>
          {ELDRIVE_UNIT}
        </Typography>
      </Stack>

      <Typography
        sx={{
          mt: 0.4,
          fontSize: '0.72rem',
          fontWeight: 650,
          color: 'rgba(255,255,255,0.45)',
          whiteSpace: 'nowrap',
        }}
      >
        {hours}
      </Typography>
    </Box>
  )
}
