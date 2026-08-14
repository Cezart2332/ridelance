import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import CreditCardOffOutlinedIcon from '@mui/icons-material/CreditCardOffOutlined'
import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { TOKENS } from '../../../constants/tokens'
import type { Car } from '../../../services/cars.service'
import { hasActiveDiscount } from '../../../utils/carPricing'
import { approxDailyPrice, formatLei } from '../../../utils/vehiclePricing'
import { VDP } from './vdpLayout'

/**
 * Cardul lateral (spec §6) — singurul loc din pagină care cere o decizie.
 *
 * Unitatea e săptămâna, fără excepție. Echivalentul zilnic apare cu „≈", mic și gri, exact ca să
 * nu poată fi citit drept tarif. Nu există nicio sumă totală, nicio taxă și niciun element de
 * checkout: pagina generează un lead, iar prețul final se stabilește la telefon.
 *
 * Selectoarele de dată din spec lipsesc intenționat — nu avem rezervare pe interval, iar două
 * câmpuri care nu schimbă nimic în card ar fi doar un formular mutat mai sus.
 */

interface VehiclePriceCardProps {
  car: Car
  /** Mașina nu e disponibilă: CTA-ul devine listă de așteptare. */
  waitlist: boolean
  onRequest: () => void
  /** Cardul inline de pe mobil nu are umbră proprie; cel din coloană da. */
  elevated?: boolean
}

export function VehiclePriceCard({ car, waitlist, onRequest, elevated = true }: VehiclePriceCardProps) {
  const discounted = hasActiveDiscount(car)
  const url = typeof window === 'undefined' ? '' : window.location.href
  const shareText = `${car.brand} ${car.model} ${car.year} — ${formatLei(car.pricePerWeek)} lei/săptămână`

  return (
    <Box
      sx={{
        px: 2,
        py: 3,
        borderRadius: `${VDP.radius.card}px`,
        border: `1px solid ${TOKENS.border}`,
        backgroundColor: TOKENS.paper,
        boxShadow: elevated ? TOKENS.shadow.md : 'none',
      }}
    >
      {/* ── Preț ── */}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
        {discounted && (
          <Typography
            sx={{ fontSize: '1rem', color: TOKENS.textSubtle, textDecoration: 'line-through' }}
          >
            {formatLei(car.oldPrice!)}
          </Typography>
        )}
        <Typography
          sx={{
            fontSize: '1.9rem',
            fontWeight: 900,
            lineHeight: 1.1,
            color: TOKENS.ink,
            textDecoration: 'underline',
            textUnderlineOffset: 4,
            letterSpacing: VDP.display.letterSpacing,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {formatLei(car.pricePerWeek)} lei
        </Typography>
      </Stack>
      <Typography sx={{ mt: 0.5, fontSize: '0.82rem', color: TOKENS.textSubtle }}>
        pe săptămână · ≈ {formatLei(approxDailyPrice(car.pricePerWeek))} lei / zi
      </Typography>

      {car.garantie != null && car.garantie > 0 && (
        <>
          <CardDivider />
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '0.9rem', color: TOKENS.textMuted }}>Garanție</Typography>
            <Typography sx={{ fontWeight: 700, color: TOKENS.ink }}>
              {formatLei(car.garantie)} lei
            </Typography>
          </Stack>
        </>
      )}

      <Button
        fullWidth
        variant="contained"
        onClick={onRequest}
        sx={{
          mt: 3,
          height: 48,
          borderRadius: `${VDP.radius.image}px`,
          fontWeight: 800,
          fontSize: '1rem',
          textTransform: 'none',
          boxShadow: 'none',
          backgroundColor: TOKENS.primaryStrong,
          '&:hover': { backgroundColor: TOKENS.primaryStrong, boxShadow: TOKENS.shadow.glow },
        }}
      >
        {waitlist ? 'Anunță-mă când e liberă' : 'Solicită mașina'}
      </Button>

      <CardDivider />

      {/* ── Blocuri informative ── */}
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: TOKENS.ink, mb: 1.5 }}>
        Ce urmează
      </Typography>
      <Stack spacing={2}>
        <InfoRow
          icon={<CreditCardOffOutlinedIcon sx={{ fontSize: 24 }} />}
          title="Fără plată online"
          detail="Nu se cere card și nu se rețin bani pe pagina asta."
        />
        <InfoRow
          icon={<SupportAgentOutlinedIcon sx={{ fontSize: 24 }} />}
          title="Te contactăm în 24h"
          detail="În maximum 24 de ore lucrătoare, pentru detalii și programare."
        />
        {car.garantie != null && car.garantie > 0 && (
          <InfoRow
            icon={<SavingsOutlinedIcon sx={{ fontSize: 24 }} />}
            title="Garanție restituibilă"
            detail="Se returnează la predarea mașinii."
          />
        )}
      </Stack>

      <CardDivider />

      <ShareRow url={url} text={shareText} />

      <Stack spacing={1.25} sx={{ mt: 3, alignItems: 'center' }}>
        <TextLink to="/masini">Vezi toate mașinile</TextLink>
        <TextLink to="/servicii">Cum funcționează RIDElance</TextLink>
      </Stack>
    </Box>
  )
}

/** Liniile interne merg de la o margine la alta a cardului, peste padding-ul lui. */
function CardDivider() {
  return <Box sx={{ my: 2.5, mx: -2, height: '1px', backgroundColor: TOKENS.border }} />
}

function InfoRow({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Box sx={{ display: 'flex', color: TOKENS.textSubtle, mt: '1px' }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: TOKENS.ink }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: TOKENS.textMuted, lineHeight: 1.5 }}>
          {detail}
        </Typography>
      </Box>
    </Stack>
  )
}

/** Trei butoane rotunde: linkul anunțului, atât. Fără favorite — nu există unde să fie salvate. */
function ShareRow({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer')

  return (
    <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center' }}>
      <ShareButton label={copied ? 'Link copiat' : 'Copiază linkul'} onClick={copy}>
        {copied ? <CheckRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
      </ShareButton>

      <ShareButton
        label="Trimite pe WhatsApp"
        onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`)}
      >
        <WhatsAppIcon fontSize="small" />
      </ShareButton>

      <ShareButton
        label="Trimite pe Facebook"
        onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)}
      >
        <FacebookRoundedIcon fontSize="small" />
      </ShareButton>
    </Stack>
  )
}

function ShareButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <IconButton
      onClick={onClick}
      aria-label={label}
      sx={{
        border: `1px solid ${TOKENS.border}`,
        color: TOKENS.ink,
        '&:hover': { backgroundColor: alpha(TOKENS.ink, 0.03), borderColor: TOKENS.borderHover },
      }}
    >
      {children}
    </IconButton>
  )
}

function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        fontSize: '0.88rem',
        fontWeight: 700,
        color: TOKENS.ink,
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      {children}
    </Box>
  )
}
