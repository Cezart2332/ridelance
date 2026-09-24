import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import BuildRoundedIcon from '@mui/icons-material/BuildRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloudRoundedIcon from '@mui/icons-material/CloudRounded'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import DrawRoundedIcon from '@mui/icons-material/DrawRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import LocalCarWashRoundedIcon from '@mui/icons-material/LocalCarWashRounded'
import LocalGasStationRoundedIcon from '@mui/icons-material/LocalGasStationRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import PercentRoundedIcon from '@mui/icons-material/PercentRounded'
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded'
import RedeemRoundedIcon from '@mui/icons-material/RedeemRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import ShoppingBagRoundedIcon from '@mui/icons-material/ShoppingBagRounded'
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded'
import StoreRoundedIcon from '@mui/icons-material/StoreRounded'
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded'
import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded'
import WifiRoundedIcon from '@mui/icons-material/WifiRounded'
import { Box, Button, Stack, Typography, type SvgIconProps } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion, useReducedMotion } from 'motion/react'
import { Fragment, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { FaqAccordion } from '../home/FaqSection'

import type {
  PartnerShowcase as ShowcaseData,
  Rich,
  ShowcaseAction,
  ShowcaseHeroCard,
  ShowcaseIcon,
  ShowcaseSection,
} from '../../data/partnerShowcases'
import type { OfferTokens } from './offerTokens'

/**
 * Pagina unui partener, desenată din `data/partnerShowcases.ts`.
 *
 * Textul e al materialului primit, neschimbat; de aici vine doar forma: tokenii noștri, aceleași
 * carduri și aceeași tipografie pe ambele suprafețe (pagina publică de Parteneri și Beneficii).
 * Secțiunile apar în ordinea din material.
 *
 * Nu repetă logoul și numele partenerului: le are deja antetul panoului în care e pus.
 */

const ICONS: Record<ShowcaseIcon, ComponentType<SvgIconProps>> = {
  account: AccountCircleRoundedIcon,
  bank: AccountBalanceRoundedIcon,
  build: BuildRoundedIcon,
  business: BusinessRoundedIcon,
  card: CreditCardRoundedIcon,
  carWash: LocalCarWashRoundedIcon,
  cloud: CloudRoundedIcon,
  document: DescriptionRoundedIcon,
  fuel: LocalGasStationRoundedIcon,
  gift: RedeemRoundedIcon,
  heart: FavoriteRoundedIcon,
  insights: InsightsRoundedIcon,
  link: LinkRoundedIcon,
  location: LocationOnRoundedIcon,
  percent: PercentRoundedIcon,
  receipt: ReceiptRoundedIcon,
  register: StoreRoundedIcon,
  road: DirectionsCarRoundedIcon,
  savings: SavingsRoundedIcon,
  security: SecurityRoundedIcon,
  shopping: ShoppingBagRoundedIcon,
  signature: DrawRoundedIcon,
  speed: SpeedRoundedIcon,
  sport: FitnessCenterRoundedIcon,
  sun: WbSunnyRoundedIcon,
  support: SupportAgentRoundedIcon,
  sync: SyncRoundedIcon,
  verified: VerifiedRoundedIcon,
  wifi: WifiRoundedIcon,
}

/** Secțiunile intră la scroll, o singură dată. Fără mișcare pentru cine a cerut asta. */
function Reveal({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <Box>{children}</Box>
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

interface PartnerShowcaseProps {
  showcase: ShowcaseData
  tokens: OfferTokens
}

export function PartnerShowcase({ showcase, tokens: t }: PartnerShowcaseProps) {
  // Ancorele secțiunilor („Vezi ofertele”) sunt locale: un `#oferte` în URL s-ar bate cu rutarea.
  const sectionRefs = useRef(new Map<string, HTMLElement>())
  /** Filtrul ales în fiecare secțiune de carduri cu filtre, după indexul secțiunii. */
  const [filters, setFilters] = useState<Record<number, string>>({})
  const anchorRef = (id?: string) =>
    id
      ? (el: HTMLElement | null) => {
          if (el) sectionRefs.current.set(id, el)
          else sectionRefs.current.delete(id)
        }
      : undefined

  const rich = (value: Rich): ReactNode =>
    typeof value === 'string'
      ? value
      : value.map((part, index) => {
          if (typeof part === 'string') return <Fragment key={index}>{part}</Fragment>
          if ('strong' in part) {
            return (
              <Box component="strong" key={index} sx={{ fontWeight: 800, color: t.ink }}>
                {part.strong}
              </Box>
            )
          }
          return (
            <Box
              component="a"
              key={index}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: t.primaryStrong, fontWeight: 700 }}
            >
              {part.link}
            </Box>
          )
        })

  const card = {
    p: { xs: 2.25, md: 2.75 },
    borderRadius: `${t.radius.lg}px`,
    border: `1px solid ${t.border}`,
    backgroundColor: t.paper,
    transition: 'border-color .2s ease, transform .2s ease, box-shadow .2s ease',
    '&:hover': {
      borderColor: alpha(t.primary, 0.45),
      transform: 'translateY(-2px)',
      boxShadow: `0 12px 28px -18px ${alpha(t.ink, 0.35)}`,
    },
  } as const
  const staticCard = { ...card, '&:hover': undefined }

  const iconTile = (icon: ShowcaseIcon, size = 44) => {
    const Icon = ICONS[icon]
    return (
      <Box
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: `${t.radius.md}px`,
          backgroundColor: alpha(t.primary, 0.12),
          color: t.primaryStrong,
        }}
      >
        <Icon sx={{ fontSize: size * 0.5 }} />
      </Box>
    )
  }

  const eyebrowText = (text: string) => (
    <Typography sx={{ mb: 0.75, fontSize: '0.74rem', fontWeight: 850, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.primaryStrong }}>
      {text}
    </Typography>
  )

  const checkList = (items: string[], size: 'sm' | 'md' = 'md') => (
    <Stack component="ul" spacing={size === 'sm' ? 0.75 : 1.1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {items.map((item) => (
        <Stack component="li" key={item} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <CheckRoundedIcon sx={{ fontSize: size === 'sm' ? 17 : 19, color: t.primaryStrong, mt: 0.2, flexShrink: 0 }} />
          <Typography sx={{ fontSize: size === 'sm' ? '0.86rem' : '0.92rem', color: t.ink, lineHeight: 1.55 }}>{item}</Typography>
        </Stack>
      ))}
    </Stack>
  )

  const heading = (title?: string, lead?: string, eyebrow?: string) =>
    title || lead ? (
      <Box sx={{ mb: { xs: 2, md: 2.75 }, maxWidth: 760 }}>
        {eyebrow && eyebrowText(eyebrow)}
        {title && (
          <Typography
            component="h3"
            sx={{ fontWeight: 850, fontSize: { xs: '1.2rem', md: '1.4rem' }, letterSpacing: '-0.02em', color: t.ink, lineHeight: 1.25 }}
          >
            {title}
          </Typography>
        )}
        {lead && <Typography sx={{ color: t.textMuted, fontSize: '0.95rem', lineHeight: 1.7, mt: 0.75 }}>{lead}</Typography>}
      </Box>
    ) : null

  const pill = (label: string, strong = false) => (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.25,
        py: 0.4,
        borderRadius: `${t.radius.full}px`,
        fontSize: '0.78rem',
        fontWeight: 800,
        color: strong ? t.primaryStrong : t.ink,
        backgroundColor: strong ? alpha(t.primary, 0.12) : t.surface,
        border: `1px solid ${strong ? alpha(t.primary, 0.3) : t.border}`,
      }}
    >
      {label}
    </Box>
  )

  const buttonSx = (variant: 'contained' | 'outlined') => ({
    fontWeight: 800,
    textTransform: 'none',
    borderRadius: `${t.radius.full}px`,
    px: 2.5,
    py: 1,
    boxShadow: 'none',
    ...(variant === 'contained'
      ? { backgroundColor: t.primary, color: t.ink, '&:hover': { backgroundColor: t.primaryStrong, boxShadow: 'none' } }
      : { color: t.ink, borderColor: t.border, '&:hover': { borderColor: t.primary, backgroundColor: alpha(t.primary, 0.06) } }),
  })

  const actionButton = (action: ShowcaseAction, variant: 'contained' | 'outlined') =>
    'to' in action ? (
      <Button key={action.label} component={RouterLink} to={action.to} variant={variant} sx={buttonSx(variant)}>
        {action.label}
      </Button>
    ) : 'href' in action ? (
      <Button key={action.label} component="a" href={action.href} target="_blank" rel="noopener noreferrer" variant={variant} sx={buttonSx(variant)}>
        {action.label}
      </Button>
    ) : (
      <Button
        key={action.label}
        variant={variant}
        sx={buttonSx(variant)}
        onClick={() => sectionRefs.current.get(action.section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      >
        {action.label}
      </Button>
    )

  const heroCard = (c: ShowcaseHeroCard) => (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2.5, md: 3 },
        borderRadius: `${t.radius.xl}px`,
        border: `1px solid ${alpha(t.primary, 0.35)}`,
        background: `linear-gradient(150deg, ${alpha(t.primary, 0.16)} 0%, ${alpha(t.primary, 0.04)} 55%, ${t.paper} 100%)`,
      }}
    >
      <Box
        aria-hidden
        sx={{ position: 'absolute', width: 180, height: 180, right: -60, top: -70, borderRadius: '50%', border: `28px solid ${alpha(t.primary, 0.12)}` }}
      />
      <Stack spacing={2} sx={{ position: 'relative' }}>
        {(c.top || c.status) && (
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            {c.top && <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: t.ink }}>{c.top}</Typography>}
            {c.status && (
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: t.primaryStrong, whiteSpace: 'nowrap' }}>{c.status}</Typography>
            )}
          </Stack>
        )}

        <Box sx={{ p: { xs: 2, md: 2.25 }, borderRadius: `${t.radius.lg}px`, backgroundColor: t.paper, border: `1px solid ${t.border}` }}>
          {c.label && (
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 850, letterSpacing: '0.06em', color: t.primaryStrong }}>{c.label}</Typography>
          )}
          {c.title && (
            <Typography sx={{ mt: 0.75, fontWeight: 900, fontSize: { xs: '1.3rem', md: '1.5rem' }, letterSpacing: '-0.03em', lineHeight: 1.15, color: t.ink }}>
              {c.title}
            </Typography>
          )}
          {c.amount && (
            <Stack direction="row" sx={{ mt: 0.5, alignItems: 'baseline', gap: 0.75 }}>
              {c.amount.prefix && <Typography sx={{ color: t.textMuted, fontWeight: 700 }}>{c.amount.prefix}</Typography>}
              <Typography sx={{ fontWeight: 900, fontSize: '2.6rem', letterSpacing: '-0.05em', lineHeight: 1, color: t.ink }}>{c.amount.value}</Typography>
              {c.amount.unit && <Typography sx={{ fontWeight: 800, color: t.ink }}>{c.amount.unit}</Typography>}
            </Stack>
          )}
          {c.text && <Typography sx={{ mt: 0.75, color: t.textMuted, fontSize: '0.9rem', lineHeight: 1.65 }}>{rich(c.text)}</Typography>}
          {c.checks && <Box sx={{ mt: 1.75, pt: 1.75, borderTop: `1px solid ${t.border}` }}>{checkList(c.checks, 'sm')}</Box>}
          {c.lines && (
            <Stack spacing={0.25} sx={{ mt: 1.25 }}>
              {c.lines.map((line) => (
                <Typography key={line} sx={{ fontSize: '0.82rem', color: t.textMuted }}>
                  {line}
                </Typography>
              ))}
            </Stack>
          )}
          {c.chips && (
            <Stack direction="row" sx={{ mt: 1.75, gap: 0.75, flexWrap: 'wrap' }}>
              {c.chips.map((chip) => (
                <Box key={chip}>{pill(chip)}</Box>
              ))}
            </Stack>
          )}
          {c.stats && (
            <Box sx={{ mt: 1.75, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25 }}>
              {c.stats.map((stat) => (
                <Box key={stat.label} sx={{ p: 1.5, borderRadius: `${t.radius.md}px`, backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: t.ink, letterSpacing: '-0.02em' }}>{stat.value}</Typography>
                  <Typography sx={{ fontSize: '0.76rem', color: t.textMuted, lineHeight: 1.45, mt: 0.25 }}>{stat.label}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {c.metrics && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
            {c.metrics.map((metric) => (
              <Box key={metric.label} sx={{ p: 1.25, borderRadius: `${t.radius.md}px`, backgroundColor: t.paper, border: `1px solid ${t.border}` }}>
                <Typography sx={{ fontSize: '0.72rem', color: t.textMuted }}>{metric.label}</Typography>
                <Typography sx={{ fontWeight: 850, fontSize: '0.9rem', color: t.ink }}>{metric.value}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {c.rows && (
          <Stack spacing={1}>
            {c.rows.map((row) => (
              <Stack
                key={row.title}
                direction="row"
                sx={{ p: 1.5, gap: 1.5, alignItems: 'center', borderRadius: `${t.radius.md}px`, backgroundColor: t.paper, border: `1px solid ${t.border}` }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: t.ink }}>{row.title}</Typography>
                  <Typography sx={{ fontSize: '0.76rem', color: t.textMuted }}>{row.text}</Typography>
                </Box>
                <Typography sx={{ fontWeight: 850, fontSize: '0.9rem', whiteSpace: 'nowrap', color: row.positive ? t.primaryStrong : t.ink }}>
                  {row.amount}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {c.note && (
          <Box sx={{ p: 1.75, borderRadius: `${t.radius.md}px`, backgroundColor: t.paper, border: `1px solid ${t.border}` }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: t.ink }}>{c.note.title}</Typography>
            <Typography sx={{ mt: 0.4, fontSize: '0.8rem', color: t.textMuted, lineHeight: 1.55 }}>{c.note.text}</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  )

  const section = (s: ShowcaseSection, sectionIndex: number): ReactNode => {
    switch (s.kind) {
      case 'cards': {
        const active = filters[sectionIndex] ?? 'all'
        const visible = s.filters && active !== 'all' ? s.cards.filter((item) => item.category === active) : s.cards
        const filterButton = (key: string, label: string) => {
          const selected = active === key
          return (
            <Box
              key={key}
              component="button"
              type="button"
              aria-pressed={selected}
              onClick={() => setFilters((prev) => ({ ...prev, [sectionIndex]: key }))}
              sx={{
                px: 1.75,
                py: 0.75,
                borderRadius: `${t.radius.full}px`,
                border: `1px solid ${selected ? t.ink : t.border}`,
                backgroundColor: selected ? t.ink : t.paper,
                color: selected ? t.paper : t.ink,
                font: 'inherit',
                fontSize: '0.84rem',
                fontWeight: 750,
                cursor: 'pointer',
                transition: 'background-color .15s ease, border-color .15s ease',
                '&:hover': { borderColor: t.ink },
                '&:focus-visible': { outline: `2px solid ${t.primary}`, outlineOffset: 2 },
              }}
            >
              {label}
            </Box>
          )
        }

        return (
          <Box ref={anchorRef(s.id)} sx={{ scrollMarginTop: 96 }}>
            {heading(s.title, s.lead, s.eyebrow)}
            {s.filters && (
              <Stack direction="row" role="group" aria-label="Filtrează beneficiile" sx={{ mb: 2.25, gap: 1, flexWrap: 'wrap' }}>
                {filterButton('all', s.filters.all)}
                {s.filters.items.map((item) => filterButton(item.key, item.label))}
              </Stack>
            )}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: s.cards.length === 4 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              {visible.map((item) => (
                <Box key={item.title} sx={{ ...card, display: 'flex', flexDirection: 'column' }}>
                  {iconTile(item.icon)}
                  <Typography sx={{ mt: 1.75, fontWeight: 850, color: t.ink, fontSize: '1rem' }}>{item.title}</Typography>
                  <Typography sx={{ mt: 0.75, color: t.textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>{item.text}</Typography>
                  {item.value && <Box sx={{ mt: 'auto', pt: 2 }}>{pill(item.value, true)}</Box>}
                </Box>
              ))}
            </Box>
            {s.note && <Typography sx={{ mt: 1.75, fontSize: '0.85rem', color: t.textMuted, lineHeight: 1.6 }}>{s.note}</Typography>}
          </Box>
        )
      }

      case 'stats':
        return (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: `repeat(${s.items.length}, minmax(0, 1fr))` },
              borderRadius: `${t.radius.lg}px`,
              border: `1px solid ${t.border}`,
              backgroundColor: t.paper,
              overflow: 'hidden',
            }}
          >
            {s.items.map((item, index) => (
              <Stack
                key={item.title}
                direction="row"
                spacing={1.75}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  alignItems: 'center',
                  borderTop: { xs: index > 0 ? `1px solid ${t.border}` : 'none', sm: 'none' },
                  borderLeft: { xs: 'none', sm: index > 0 ? `1px solid ${t.border}` : 'none' },
                }}
              >
                <Typography
                  // Pe telefon cifrele stau una sub alta: aceeași lățime aliniază textele de lângă ele.
                  sx={{ minWidth: { xs: 96, sm: 0 }, fontWeight: 900, fontSize: { xs: '1.6rem', md: '1.85rem' }, letterSpacing: '-0.04em', color: t.ink, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
                >
                  {item.value}
                </Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: t.ink, lineHeight: 1.35 }}>{item.title}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: t.textMuted, lineHeight: 1.45 }}>{item.text}</Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        )

      case 'steps':
        return (
          <Box ref={anchorRef(s.id)} sx={{ scrollMarginTop: 96 }}>
            {heading(s.title, s.lead, s.eyebrow)}
            <Box
              component="ol"
              sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${s.items.length}, minmax(0, 1fr))` }, gap: 2 }}
            >
              {s.items.map((step, index) => (
                <Box component="li" key={step.title} sx={{ ...staticCard, borderTop: `3px solid ${index === 0 ? t.primary : t.border}` }}>
                  <Typography sx={{ fontWeight: 850, fontSize: '0.82rem', letterSpacing: '0.08em', color: t.primaryStrong, fontVariantNumeric: 'tabular-nums' }}>
                    {String(index + 1).padStart(2, '0')}
                  </Typography>
                  <Typography sx={{ mt: 1, fontWeight: 850, color: t.ink, fontSize: '1rem' }}>{step.title}</Typography>
                  <Typography sx={{ mt: 0.6, color: t.textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>{step.text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )

      case 'spotlight':
        return (
          <Box
            ref={anchorRef(s.id)}
            sx={{ scrollMarginTop: 96, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }, gap: { xs: 3, md: 4 }, alignItems: 'center' }}
          >
            <Box>
              {s.icon && <Box sx={{ mb: 1.75 }}>{iconTile(s.icon)}</Box>}
              {s.eyebrow && eyebrowText(s.eyebrow)}
              <Typography
                component="h3"
                sx={{ fontWeight: 850, fontSize: { xs: '1.2rem', md: '1.4rem' }, letterSpacing: '-0.02em', color: t.ink, lineHeight: 1.25 }}
              >
                {s.title}
              </Typography>
              {s.paragraphs.map((paragraph) => (
                <Typography key={paragraph} sx={{ mt: 1.25, color: t.textMuted, fontSize: '0.93rem', lineHeight: 1.7 }}>
                  {paragraph}
                </Typography>
              ))}
              {s.checks && <Box sx={{ mt: 2 }}>{checkList(s.checks)}</Box>}
              {s.note && (
                <Typography
                  sx={{ mt: 2, p: 1.5, borderRadius: `${t.radius.md}px`, backgroundColor: t.surface, border: `1px solid ${t.border}`, fontSize: '0.84rem', color: t.textMuted, lineHeight: 1.6 }}
                >
                  {s.note}
                </Typography>
              )}
            </Box>
            {heroCard(s.card)}
          </Box>
        )

      case 'faq':
        return (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 0.8fr) minmax(0, 1.2fr)' }, gap: { xs: 2, md: 4 }, alignItems: 'start' }}>
            <Box>
              {heading(s.title, s.lead, s.eyebrow)}
              {s.link && (
                <Typography
                  component="a"
                  href={s.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-block', mt: -1, fontWeight: 800, fontSize: '0.9rem', color: t.primaryStrong, textDecoration: 'none' }}
                >
                  {s.link.label}
                </Typography>
              )}
            </Box>
            <FaqAccordion items={s.items} dense idPrefix={`partner-faq-${sectionIndex}`} />
          </Box>
        )

      case 'aboutSteps':
        return (
          <Box ref={anchorRef(s.id)} sx={{ scrollMarginTop: 96 }}>
            {heading(s.title, s.lead)}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.1fr' }, gap: 2, alignItems: 'start' }}>
              <Box sx={{ ...staticCard, backgroundColor: alpha(t.primary, 0.05), borderColor: alpha(t.primary, 0.3) }}>
                {iconTile(s.about.icon)}
                <Typography sx={{ mt: 1.75, fontWeight: 850, fontSize: '1.1rem', color: t.ink }}>{s.about.title}</Typography>
                {s.about.paragraphs.map((paragraph) => (
                  <Typography key={paragraph} sx={{ mt: 1, color: t.textMuted, fontSize: '0.9rem', lineHeight: 1.7 }}>
                    {paragraph}
                  </Typography>
                ))}
                {s.about.link && (
                  <Typography
                    component="a"
                    href={s.about.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'inline-block', mt: 1.5, fontWeight: 800, fontSize: '0.9rem', color: t.primaryStrong, textDecoration: 'none' }}
                  >
                    {s.about.link.label}
                  </Typography>
                )}
                {s.about.stats && (
                  <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: `repeat(${s.about.stats.length}, minmax(0, 1fr))`, gap: 1 }}>
                    {s.about.stats.map((stat) => (
                      <Box key={stat.label} sx={{ p: 1.25, textAlign: 'center', borderRadius: `${t.radius.md}px`, backgroundColor: t.paper, border: `1px solid ${t.border}` }}>
                        <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.2rem', md: '1.45rem' }, letterSpacing: '-0.03em', color: t.primaryStrong }}>
                          {stat.value}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: t.textMuted, lineHeight: 1.4 }}>{stat.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                {s.about.labels && (
                  <Stack direction="row" sx={{ mt: 2, gap: 0.75, flexWrap: 'wrap' }}>
                    {s.about.labels.map((label, index) => (
                      <Box key={label}>{pill(label, index === 0)}</Box>
                    ))}
                  </Stack>
                )}
              </Box>

              <Box component="ol" sx={{ ...staticCard, listStyle: 'none', m: 0, display: 'flex', flexDirection: 'column', gap: 2.25 }}>
                {s.steps.map((step, index) => (
                  <Stack component="li" key={step.title} direction="row" spacing={1.75}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '50%',
                        fontWeight: 900,
                        fontSize: '0.9rem',
                        color: t.ink,
                        backgroundColor: t.primary,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 850, color: t.ink }}>{step.title}</Typography>
                      <Typography sx={{ mt: 0.4, color: t.textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>{step.text}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Box>
            </Box>
          </Box>
        )

      case 'chain':
        return (
          <Box
            ref={anchorRef(s.id)}
            sx={{
              scrollMarginTop: 96,
              p: { xs: 2.5, md: 3.5 },
              borderRadius: `${t.radius.xl}px`,
              backgroundColor: alpha(t.primary, 0.06),
              border: `1px solid ${alpha(t.primary, 0.2)}`,
            }}
          >
            {heading(s.title, s.lead)}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: s.items.map(() => 'minmax(0, 1fr)').join(' auto ') },
                gap: { xs: 1, md: 1.25 },
                alignItems: 'stretch',
              }}
            >
              {s.items.flatMap((item, index) => {
                const node = (
                  <Box key={item.title} sx={staticCard}>
                    {iconTile(item.icon, 40)}
                    <Typography sx={{ mt: 1.5, fontWeight: 850, color: t.ink }}>{item.title}</Typography>
                    <Typography sx={{ mt: 0.5, color: t.textMuted, fontSize: '0.86rem', lineHeight: 1.55 }}>{item.text}</Typography>
                  </Box>
                )
                if (index === s.items.length - 1) return [node]
                return [
                  node,
                  <Box key={`${item.title}-arrow`} aria-hidden sx={{ display: 'grid', placeItems: 'center', color: t.primaryStrong }}>
                    <ArrowForwardRoundedIcon sx={{ transform: { xs: 'rotate(90deg)', md: 'none' } }} />
                  </Box>,
                ]
              })}
            </Box>
          </Box>
        )

      case 'locations':
        return (
          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, gap: { xs: 0, sm: 2 } }}>
              {heading(s.title, s.lead)}
              <Box sx={{ mb: 2, flexShrink: 0 }}>{pill(s.price, true)}</Box>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 1.25 }}>
              {s.items.map((place) => (
                <Stack key={place.city} direction="row" spacing={1} sx={{ ...card, p: 1.5, alignItems: 'center' }}>
                  <LocationOnRoundedIcon sx={{ fontSize: 20, color: t.primaryStrong, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: t.ink }}>{place.city}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: t.textMuted }}>{place.county}</Typography>
                  </Box>
                </Stack>
              ))}
            </Box>
          </Box>
        )

      case 'callout':
        return (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{
              ...staticCard,
              gap: 2,
              alignItems: { sm: 'center' },
              justifyContent: 'space-between',
              backgroundColor: alpha(t.primary, 0.06),
              borderColor: alpha(t.primary, 0.3),
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 850, color: t.ink }}>{s.title}</Typography>
              <Typography sx={{ mt: 0.4, color: t.textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>{s.text}</Typography>
            </Box>
            <Box sx={{ flexShrink: 0 }}>{pill(s.badge, true)}</Box>
          </Stack>
        )

      case 'products':
        return (
          <Box ref={anchorRef(s.id)} sx={{ scrollMarginTop: 96 }}>
            {heading(s.title, s.lead)}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
              {s.items.map((product) => (
                <Box key={product.name} sx={{ ...card, display: 'flex', flexDirection: 'column' }}>
                  <Box>{pill(product.label, true)}</Box>
                  <Typography sx={{ mt: 1.5, fontWeight: 850, fontSize: '1.2rem', color: t.ink }}>{product.name}</Typography>
                  <Typography sx={{ color: t.textMuted, fontSize: '0.9rem', mt: 0.25 }}>{product.description}</Typography>
                  <Typography sx={{ mt: 2, fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.04em', color: t.ink }}>
                    {product.price}
                    <Box component="span" sx={{ fontSize: '0.9rem', fontWeight: 700, color: t.textMuted, letterSpacing: 0 }}>
                      {' '}
                      {product.unit}
                    </Box>
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: t.textSubtle }}>{product.taxNote}</Typography>
                  <Stack component="ul" spacing={1} sx={{ mt: 2, p: 0, listStyle: 'none' }}>
                    {product.features.map((feature) => (
                      <Stack component="li" key={feature} direction="row" spacing={1}>
                        <CheckCircleRoundedIcon sx={{ fontSize: 18, color: t.primaryStrong, mt: 0.2, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.9rem', color: t.ink, lineHeight: 1.55 }}>{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{ mt: 'auto', pt: 1.5, mb: 2, justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, borderTop: `1px solid ${t.border}` }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: t.ink }}>{product.firstYear.title}</Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: t.textMuted }}>{product.firstYear.subtitle}</Typography>
                    </Box>
                    <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.5, whiteSpace: 'nowrap' }}>
                      <Typography sx={{ fontSize: '0.8rem', color: t.textMuted }}>{product.firstYear.prefix}</Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: t.ink }}>{product.firstYear.value}</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: t.ink }}>{product.firstYear.unit}</Typography>
                    </Stack>
                  </Stack>
                  <Button component="a" href={product.cta.href} target="_blank" rel="noopener noreferrer" fullWidth sx={buttonSx('contained')}>
                    {product.cta.label}
                  </Button>
                </Box>
              ))}
            </Box>
            <Typography sx={{ mt: 1.75, fontSize: '0.8rem', color: t.textSubtle, lineHeight: 1.6 }}>{s.footnote}</Typography>
          </Box>
        )

      case 'notes':
        return (
          <Stack spacing={1.5}>
            {s.items.map((note, index) => (
              <Box key={index} sx={{ ...staticCard, backgroundColor: note.label ? alpha(t.primary, 0.06) : t.surface }}>
                {note.label && (
                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 850, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.primaryStrong }}>
                    {note.label}
                  </Typography>
                )}
                {note.title && (
                  <Typography sx={{ mt: note.label ? 0.5 : 0, fontWeight: 850, fontSize: note.titleUnit ? '1.35rem' : '1rem', color: t.ink }}>
                    {note.title}
                    {note.titleUnit && (
                      <Box component="span" sx={{ fontSize: '0.9rem', fontWeight: 700, color: t.textMuted }}>
                        {' '}
                        {note.titleUnit}
                      </Box>
                    )}
                  </Typography>
                )}
                <Typography sx={{ mt: note.title ? 0.5 : 0, color: t.textMuted, fontSize: '0.87rem', lineHeight: 1.65 }}>{rich(note.text)}</Typography>
              </Box>
            ))}
          </Stack>
        )
    }
  }

  const { hero, cta, footer } = showcase

  return (
    <Stack spacing={{ xs: 5, md: 6.5 }}>
      {showcase.intro && (
        <Typography sx={{ color: t.textMuted, fontSize: '1rem', lineHeight: 1.8 }}>{rich(showcase.intro)}</Typography>
      )}

      {/* Hero: promisiunea parteneriatului, lângă oferta principală */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' }, gap: { xs: 3, md: 4 }, alignItems: 'center' }}>
        <Box>
          <Typography sx={{ fontSize: '0.74rem', fontWeight: 850, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.primaryStrong }}>
            {hero.eyebrow}
          </Typography>
          <Typography
            component="h2"
            sx={{ mt: 1, fontWeight: 900, fontSize: { xs: '1.75rem', md: '2.35rem' }, letterSpacing: '-0.035em', lineHeight: 1.08, color: t.ink }}
          >
            {hero.headline}
          </Typography>
          <Typography sx={{ mt: 2, color: t.textMuted, fontSize: { xs: '0.95rem', md: '1.02rem' }, lineHeight: 1.75 }}>{rich(hero.lead)}</Typography>
          <Stack direction="row" sx={{ mt: 3, gap: 1.25, flexWrap: 'wrap' }}>
            {hero.actions.map((action, index) => actionButton(action, index === 0 ? 'contained' : 'outlined'))}
          </Stack>
          {hero.micro && (
            <Stack direction="row" sx={{ mt: 1.75, columnGap: 2.25, rowGap: 0.5, flexWrap: 'wrap' }}>
              {hero.micro.map((item) => (
                <Stack key={item} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <CheckRoundedIcon sx={{ fontSize: 16, color: t.primaryStrong }} />
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: t.textMuted }}>{item}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
        {heroCard(hero.card)}
      </Box>

      {showcase.sections.map((s, index) => (
        <Reveal key={index}>{section(s, index)}</Reveal>
      ))}

      {/* Îndemnul final: banda închisă la culoare, ca pagina să aibă un capăt */}
      {cta && (
        <Reveal>
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              p: { xs: 3, md: 4 },
              borderRadius: `${t.radius.xl}px`,
              backgroundColor: t.ink,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { md: 'center' },
              justifyContent: 'space-between',
              gap: 2.5,
            }}
          >
            <Box
              aria-hidden
              sx={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 90% 10%, ${alpha(t.primary, 0.35)} 0%, transparent 45%)` }}
            />
            <Box sx={{ position: 'relative', maxWidth: 640 }}>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.3rem', md: '1.6rem' }, letterSpacing: '-0.03em', color: t.paper, lineHeight: 1.2 }}>
                {cta.title}
              </Typography>
              <Typography sx={{ mt: 1, color: alpha(t.paper, 0.72), fontSize: '0.93rem', lineHeight: 1.7 }}>{cta.text}</Typography>
            </Box>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>{actionButton(cta.action, 'contained')}</Box>
          </Box>
        </Reveal>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 0.5, pt: 2, borderTop: `1px solid ${t.border}` }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: t.textMuted }}>{footer.left}</Typography>
        {footer.right && <Typography sx={{ fontSize: '0.8rem', color: t.textSubtle }}>{footer.right}</Typography>}
        {footer.link && (
          <Typography
            component="a"
            href={footer.link.href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ fontSize: '0.8rem', fontWeight: 800, color: t.primaryStrong, textDecoration: 'none' }}
          >
            {footer.link.label}
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
