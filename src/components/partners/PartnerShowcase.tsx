import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import BuildRoundedIcon from '@mui/icons-material/BuildRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import GavelRoundedIcon from '@mui/icons-material/GavelRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import LocalCarWashRoundedIcon from '@mui/icons-material/LocalCarWashRounded'
import LocalGasStationRoundedIcon from '@mui/icons-material/LocalGasStationRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import PercentRoundedIcon from '@mui/icons-material/PercentRounded'
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded'
import StoreRoundedIcon from '@mui/icons-material/StoreRounded'
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded'
import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import WifiRoundedIcon from '@mui/icons-material/WifiRounded'
import { Box, Button, Stack, Typography, type SvgIconProps } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion, useReducedMotion } from 'motion/react'
import type { ComponentType, ReactNode } from 'react'

import type { PartnerShowcase as ShowcaseData, ShowcaseIcon } from '../../data/partnerShowcases'
import type { OfferTokens } from './offerTokens'

/**
 * Pagina unui partener, desenată din `data/partnerShowcases.ts`.
 *
 * Materialele primite (câte un HTML de la fiecare partener) aveau aceeași structură — hero cu
 * oferta principală, carduri de beneficii, pașii, fluxul, motivele, un îndemn final — dar fiecare
 * cu fonturile și culorile lui. Aici e o singură structură, cu tokenii noștri, pe ambele suprafețe:
 * pagina publică de Parteneri și Beneficii din dashboard.
 *
 * Nu repetă logoul și numele partenerului: le are deja antetul panoului în care e pus.
 */

const ICONS: Record<ShowcaseIcon, ComponentType<SvgIconProps>> = {
  account: AccountCircleRoundedIcon,
  bank: AccountBalanceRoundedIcon,
  bolt: BoltRoundedIcon,
  build: BuildRoundedIcon,
  business: BusinessRoundedIcon,
  card: CreditCardRoundedIcon,
  carWash: LocalCarWashRoundedIcon,
  document: DescriptionRoundedIcon,
  fuel: LocalGasStationRoundedIcon,
  gavel: GavelRoundedIcon,
  insights: InsightsRoundedIcon,
  link: LinkRoundedIcon,
  location: LocationOnRoundedIcon,
  percent: PercentRoundedIcon,
  receipt: ReceiptRoundedIcon,
  register: StoreRoundedIcon,
  savings: SavingsRoundedIcon,
  security: SecurityRoundedIcon,
  speed: SpeedRoundedIcon,
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

  const heading = (title: string, lead?: string) => (
    <Box sx={{ mb: { xs: 2, md: 2.75 }, maxWidth: 720 }}>
      <Typography
        component="h3"
        sx={{ fontWeight: 850, fontSize: { xs: '1.2rem', md: '1.4rem' }, letterSpacing: '-0.02em', color: t.ink, lineHeight: 1.25 }}
      >
        {title}
      </Typography>
      {lead && (
        <Typography sx={{ color: t.textMuted, fontSize: '0.95rem', lineHeight: 1.7, mt: 0.75 }}>{lead}</Typography>
      )}
    </Box>
  )

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
        whiteSpace: 'nowrap',
        color: strong ? t.primaryStrong : t.ink,
        backgroundColor: strong ? alpha(t.primary, 0.12) : t.surface,
        border: `1px solid ${strong ? alpha(t.primary, 0.3) : t.border}`,
      }}
    >
      {label}
    </Box>
  )

  const externalButton = (label: string, href: string, variant: 'contained' | 'outlined') => (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant={variant}
      endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
      sx={{
        fontWeight: 800,
        textTransform: 'none',
        borderRadius: `${t.radius.full}px`,
        px: 2.5,
        py: 1,
        boxShadow: 'none',
        ...(variant === 'contained'
          ? { backgroundColor: t.primary, color: t.ink, '&:hover': { backgroundColor: t.primaryStrong, boxShadow: 'none' } }
          : { color: t.ink, borderColor: t.border, '&:hover': { borderColor: t.primary, backgroundColor: alpha(t.primary, 0.06) } }),
      }}
    >
      {label}
    </Button>
  )

  const { highlight, offers, facts, steps, flow, products, locations, reasons, notes, cta } = showcase

  return (
    <Stack spacing={{ xs: 5, md: 6.5 }}>
      {/* Hero: promisiunea parteneriatului, lângă oferta principală */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: highlight ? '1.3fr 1fr' : '1fr' },
          gap: { xs: 3, md: 4 },
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography
            sx={{ fontSize: '0.74rem', fontWeight: 850, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.primaryStrong }}
          >
            {showcase.eyebrow}
          </Typography>
          <Typography
            component="h2"
            sx={{
              mt: 1,
              fontWeight: 900,
              fontSize: { xs: '1.75rem', md: '2.35rem' },
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              color: t.ink,
            }}
          >
            {showcase.headline}
          </Typography>
          <Typography sx={{ mt: 2, color: t.textMuted, fontSize: { xs: '0.95rem', md: '1.02rem' }, lineHeight: 1.75 }}>
            {showcase.lead}
          </Typography>
          <Stack direction="row" sx={{ mt: 3, gap: 1.25, flexWrap: 'wrap' }}>
            {externalButton(cta.label, cta.href, 'contained')}
          </Stack>
        </Box>

        {highlight && (
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
            {/* Un cerc decorativ, ca să nu fie o cutie plată */}
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                width: 180,
                height: 180,
                right: -60,
                top: -70,
                borderRadius: '50%',
                border: `28px solid ${alpha(t.primary, 0.12)}`,
              }}
            />
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, position: 'relative' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: t.primary, boxShadow: `0 0 0 4px ${alpha(t.primary, 0.2)}` }} />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: t.ink }}>{highlight.badge}</Typography>
            </Stack>
            <Typography
              sx={{ mt: 1.5, fontWeight: 900, fontSize: { xs: '1.4rem', md: '1.6rem' }, letterSpacing: '-0.03em', lineHeight: 1.15, color: t.ink, position: 'relative' }}
            >
              {highlight.title}
            </Typography>
            {highlight.text && (
              <Typography sx={{ mt: 1, color: t.textMuted, fontSize: '0.9rem', lineHeight: 1.65, position: 'relative' }}>
                {highlight.text}
              </Typography>
            )}
            {highlight.stats && (
              <Box
                sx={{
                  mt: 2.25,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(highlight.stats.length, 2)}, minmax(0, 1fr))`,
                  gap: 1.25,
                }}
              >
                {highlight.stats.map((stat) => (
                  <Box
                    key={stat.label}
                    sx={{ p: 1.5, borderRadius: `${t.radius.md}px`, backgroundColor: t.paper, border: `1px solid ${t.border}` }}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', color: t.ink, letterSpacing: '-0.02em' }}>
                      {stat.value}
                    </Typography>
                    <Typography sx={{ fontSize: '0.76rem', color: t.textMuted, lineHeight: 1.45, mt: 0.25 }}>{stat.label}</Typography>
                  </Box>
                ))}
              </Box>
            )}
            {highlight.chips && (
              <Stack direction="row" sx={{ mt: 2.25, gap: 0.75, flexWrap: 'wrap', position: 'relative' }}>
                {highlight.chips.map((chip) => (
                  <Box key={chip}>{pill(chip)}</Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Box>

      {facts && (
        <Reveal>
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))`, gap: { xs: 1, sm: 1.5 } }}>
            {facts.map((fact) => (
              <Box key={fact.label} sx={{ ...card, p: { xs: 1.5, md: 2.75 }, '&:hover': undefined, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.35rem', md: '1.9rem' }, letterSpacing: '-0.04em', color: t.primaryStrong }}>
                  {fact.value}
                </Typography>
                <Typography sx={{ fontSize: { xs: '0.72rem', md: '0.85rem' }, color: t.textMuted, lineHeight: 1.5 }}>{fact.label}</Typography>
              </Box>
            ))}
          </Box>
        </Reveal>
      )}

      {/* Casele de marcat (Constalaris): produsul concret, cu comanda la partener */}
      {products && (
        <Reveal>
          {heading(products.title, products.lead)}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
            {products.items.map((product) => (
              <Box key={product.name} sx={{ ...card, display: 'flex', flexDirection: 'column' }}>
                <Box>{pill(product.variant, true)}</Box>
                <Typography sx={{ mt: 1.5, fontWeight: 850, fontSize: '1.2rem', color: t.ink }}>{product.name}</Typography>
                <Typography sx={{ color: t.textMuted, fontSize: '0.9rem', mt: 0.25 }}>{product.subtitle}</Typography>
                <Typography sx={{ mt: 2, fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.04em', color: t.ink }}>
                  {product.price}
                  <Box component="span" sx={{ fontSize: '0.9rem', fontWeight: 700, color: t.textMuted, letterSpacing: 0 }}>
                    {' '}/ aparat
                  </Box>
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: t.textSubtle }}>{product.priceNote}</Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {product.checks.map((check) => (
                    <Stack key={check} direction="row" spacing={1}>
                      <CheckCircleRoundedIcon sx={{ fontSize: 18, color: t.primaryStrong, mt: 0.2, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.9rem', color: t.ink, lineHeight: 1.55 }}>{check}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Stack
                  direction="row"
                  sx={{
                    mt: 'auto',
                    pt: 2.5,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: '0.78rem', color: t.textMuted }}>{product.firstYear.label}</Typography>
                    <Typography sx={{ fontWeight: 850, color: t.ink }}>{product.firstYear.value}</Typography>
                  </Box>
                  {externalButton('Comandă pe Constalaris', product.href, 'outlined')}
                </Stack>
              </Box>
            ))}
          </Box>
          {products.note && (
            <Typography sx={{ mt: 1.75, fontSize: '0.8rem', color: t.textSubtle, lineHeight: 1.6 }}>{products.note}</Typography>
          )}
        </Reveal>
      )}

      {offers && (
        <Reveal>
          {heading(offers.title, offers.lead)}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: offers.cards.length === 4 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {offers.cards.map((item) => (
              <Box key={item.title} sx={{ ...card, display: 'flex', flexDirection: 'column' }}>
                {iconTile(item.icon)}
                <Typography sx={{ mt: 1.75, fontWeight: 850, color: t.ink, fontSize: '1rem' }}>{item.title}</Typography>
                <Typography sx={{ mt: 0.75, color: t.textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>{item.text}</Typography>
                {item.value && <Box sx={{ mt: 'auto', pt: 2 }}>{pill(item.value, true)}</Box>}
              </Box>
            ))}
          </Box>
        </Reveal>
      )}

      {steps && (
        <Reveal>
          {heading(steps.title, steps.lead)}
          {steps.tags && (
            <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap', mb: 2.25, mt: -0.75 }}>
              {steps.tags.map((tag) => (
                <Box key={tag}>{pill(tag)}</Box>
              ))}
            </Stack>
          )}
          <Box
            component="ol"
            sx={{
              listStyle: 'none',
              m: 0,
              p: 0,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: `repeat(${steps.items.length}, 1fr)` },
              gap: 2,
              counterReset: 'step',
            }}
          >
            {steps.items.map((item, index) => (
              <Box component="li" key={item.title} sx={{ ...card, '&:hover': undefined, position: 'relative' }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '50%',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    color: t.ink,
                    backgroundColor: t.primary,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography sx={{ mt: 1.5, fontWeight: 850, color: t.ink }}>{item.title}</Typography>
                <Typography sx={{ mt: 0.6, color: t.textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>{item.text}</Typography>
              </Box>
            ))}
          </Box>
        </Reveal>
      )}

      {locations && (
        <Reveal>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, gap: 1.5 }}
          >
            {heading(locations.title, locations.lead)}
            <Box sx={{ mb: { sm: 2.75 } }}>{pill(locations.price, true)}</Box>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 1.25 }}>
            {locations.items.map((place) => (
              <Stack
                key={place.city}
                direction="row"
                spacing={1}
                sx={{ ...card, p: 1.5, alignItems: 'center' }}
              >
                <LocationOnRoundedIcon sx={{ fontSize: 20, color: t.primaryStrong, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: t.ink }} noWrap>
                    {place.city}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: t.textMuted }}>{place.county}</Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        </Reveal>
      )}

      {/* Fluxul: cutii legate prin săgeți — pe telefon, una sub alta */}
      {flow && (
        <Reveal>
          {heading(flow.title, flow.lead)}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: flow.items.map(() => 'minmax(0, 1fr)').join(' auto '),
              },
              gap: { xs: 1, md: 1.25 },
              alignItems: 'stretch',
            }}
          >
            {flow.items.flatMap((item, index) => {
              const node = (
                <Box
                  key={item.title}
                  sx={{
                    ...card,
                    '&:hover': undefined,
                    backgroundColor: index === flow.items.length - 1 ? alpha(t.primary, 0.08) : t.paper,
                    borderColor: index === flow.items.length - 1 ? alpha(t.primary, 0.4) : t.border,
                  }}
                >
                  {iconTile(item.icon, 40)}
                  <Typography sx={{ mt: 1.5, fontWeight: 850, color: t.ink }}>{item.title}</Typography>
                  <Typography sx={{ mt: 0.5, color: t.textMuted, fontSize: '0.86rem', lineHeight: 1.55 }}>{item.text}</Typography>
                </Box>
              )
              if (index === flow.items.length - 1) return [node]
              return [
                node,
                <Box key={`${item.title}-arrow`} aria-hidden sx={{ display: 'grid', placeItems: 'center', color: t.primaryStrong }}>
                  <ArrowForwardRoundedIcon sx={{ transform: { xs: 'rotate(90deg)', md: 'none' } }} />
                </Box>,
              ]
            })}
          </Box>
        </Reveal>
      )}

      {reasons && (
        <Reveal>
          {heading(reasons.title, reasons.lead)}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${reasons.items.length}, 1fr)` }, gap: 2 }}>
            {reasons.items.map((item) => (
              <Stack key={item.title} direction="row" spacing={1.75} sx={card}>
                {iconTile(item.icon, 40)}
                <Box>
                  <Typography sx={{ fontWeight: 850, color: t.ink }}>{item.title}</Typography>
                  <Typography sx={{ mt: 0.5, color: t.textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>{item.text}</Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        </Reveal>
      )}

      {notes && (
        <Reveal>
          <Box sx={{ borderRadius: `${t.radius.lg}px`, border: `1px solid ${t.border}`, backgroundColor: t.surface, overflow: 'hidden' }}>
            {notes.map((note, index) => (
              <Box key={note.title} sx={{ p: { xs: 2, md: 2.5 }, borderTop: index === 0 ? 'none' : `1px solid ${t.border}` }}>
                <Typography sx={{ fontWeight: 850, color: t.ink, fontSize: '0.95rem' }}>{note.title}</Typography>
                <Typography sx={{ mt: 0.5, color: t.textMuted, fontSize: '0.85rem', lineHeight: 1.65 }}>{note.text}</Typography>
              </Box>
            ))}
          </Box>
        </Reveal>
      )}

      {/* Îndemnul final: banda închisă la culoare, ca pagina să aibă un capăt */}
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
            sx={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 90% 10%, ${alpha(t.primary, 0.35)} 0%, transparent 45%)`,
            }}
          />
          <Box sx={{ position: 'relative', maxWidth: 640 }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.3rem', md: '1.6rem' }, letterSpacing: '-0.03em', color: t.paper, lineHeight: 1.2 }}>
              {cta.title}
            </Typography>
            <Typography sx={{ mt: 1, color: alpha(t.paper, 0.72), fontSize: '0.93rem', lineHeight: 1.7 }}>{cta.text}</Typography>
          </Box>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>{externalButton(cta.label, cta.href, 'contained')}</Box>
        </Box>
      </Reveal>
    </Stack>
  )
}
