import CallRoundedIcon from '@mui/icons-material/CallRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import RedeemRoundedIcon from '@mui/icons-material/RedeemRounded'
import { Box, Button, ButtonBase, Chip, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'

import {
  partnerBenefits,
  type BenefitBlock,
  type PartnerBenefit,
} from '../../../data/benefits'
import { PARTNER_LOGO } from '../../../data/partnerLogo'
import { BCR_OFFERS, BCR_ONBOARDING_URL } from '../../../data/partners'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { PageHeader } from '../ui'

/**
 * Beneficii — ce primește concret un client din partea partenerilor.
 *
 * Aceeași formă ca pagina publică de parteneri: un rând de taburi cu logouri sus, un singur panou
 * dedesubt. Motivul e că fac același lucru — pui un partener în față și îi arăți oferta — iar două
 * navigări diferite pentru același gest ar fi doar două lucruri de învățat.
 *
 * Diferența e conținutul: aici nu se prezintă partenerul, ci beneficiul. De aceea datele vin din
 * `data/benefits.ts`, nu din `data/partners.ts`.
 */

interface BeneficiiTabProps {
  /** Unele beneficii trimit într-o altă secțiune a dashboardului (Asigurări, Suport). */
  onNavigate?: (section: string) => void
}

export function BeneficiiTab({ onNavigate }: BeneficiiTabProps) {
  const [activeSlug, setActiveSlug] = useState(partnerBenefits[0].slug)
  const partner = partnerBenefits.find((item) => item.slug === activeSlug) ?? partnerBenefits[0]

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }}>
      <PageHeader
        title="Beneficii"
        subtitle="Oferte negociate de RIDElance, disponibile clienților noștri. Alege un partener pentru detalii."
      />

      <PartnerTabs activeSlug={partner.slug} onSelect={setActiveSlug} />
      <PartnerPanel partner={partner} onNavigate={onNavigate} />
    </Stack>
  )
}

/** Rândul de taburi. Sub 900px devine o bandă derulabilă, cu tabul activ adus în centru. */
function PartnerTabs({
  activeSlug,
  onSelect,
}: {
  activeSlug: string
  onSelect: (slug: string) => void
}) {
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const rail = railRef.current
    const active = rail?.querySelector<HTMLElement>('[data-active="true"]')
    if (rail && active) {
      rail.scrollLeft = active.offsetLeft - (rail.clientWidth - active.clientWidth) / 2
    }
  }, [activeSlug])

  return (
    <Box sx={{ borderBottom: `1px solid ${DASHBOARD_TOKENS.border}` }}>
      <Box
        ref={railRef}
        role="tablist"
        sx={{
          display: 'flex',
          gap: { xs: 0.5, md: 1 },
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {partnerBenefits.map((item) => {
          const isActive = item.slug === activeSlug
          return (
            <ButtonBase
              key={item.slug}
              role="tab"
              aria-selected={isActive}
              aria-label={item.name}
              title={item.name}
              data-active={isActive ? 'true' : undefined}
              onClick={() => onSelect(item.slug)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: { xs: 2, md: 2.6 },
                py: 1.4,
                flexShrink: 0,
                borderBottom: `2px solid ${isActive ? DASHBOARD_TOKENS.primary : 'transparent'}`,
                mb: '-1px',
                transition: 'all 200ms ease',
                '&:hover .benefit-tab-logo': { opacity: 1, filter: 'grayscale(0)' },
              }}
            >
              <Box
                component="img"
                src={item.image}
                alt=""
                className="benefit-tab-logo"
                sx={{
                  // Fără etichetă alături, logo-ul poartă singur identificarea, deci crește.
                  ...PARTNER_LOGO.tab,
                  width: 'auto',
                  objectFit: 'contain',
                  opacity: isActive ? 1 : 0.55,
                  filter: isActive ? 'grayscale(0)' : 'grayscale(1)',
                  transition: 'all 200ms ease',
                }}
              />
            </ButtonBase>
          )
        })}
      </Box>
    </Box>
  )
}

function PartnerPanel({
  partner,
  onNavigate,
}: {
  partner: PartnerBenefit
  onNavigate?: (section: string) => void
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: { xs: 2.2, md: 3 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
          backgroundColor: DASHBOARD_TOKENS.surfaceAlt,
        }}
      >
        <Box
          sx={{
            ...PARTNER_LOGO.panelBox,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: DASHBOARD_TOKENS.radius.md,
            backgroundColor: DASHBOARD_TOKENS.paper,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            p: 1,
          }}
        >
          <Box
            component="img"
            src={partner.image}
            alt={partner.name}
            sx={{ ...PARTNER_LOGO.panel, objectFit: 'contain' }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Numele nu se mai scrie: logo-ul de alături îl spune, iar dublarea lui făcea antetul
              să repete aceeași informație de două ori. Rămâne în `alt`, pentru cititoarele de ecran. */}
          <Typography
            sx={{
              color: DASHBOARD_TOKENS.ink,
              fontSize: { xs: '1rem', md: '1.1rem' },
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            {partner.tagline}
          </Typography>
        </Box>

        {partner.website && (
          <Button
            component="a"
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              flexShrink: 0,
              fontWeight: 750,
              fontSize: '0.84rem',
              textTransform: 'none',
              whiteSpace: 'nowrap',
              color: DASHBOARD_TOKENS.accent,
              border: `1px solid ${alpha(DASHBOARD_TOKENS.primary, 0.4)}`,
              borderRadius: DASHBOARD_TOKENS.radius.full,
              px: 2,
              '&:hover': { backgroundColor: DASHBOARD_TOKENS.accentWash },
            }}
          >
            {partner.website.replace('https://', '').replace('www.', '')}
          </Button>
        )}
      </Box>

      <Box sx={{ p: { xs: 2.2, md: 3 } }}>
        <Stack spacing={3}>
          {(partner.intro || partner.highlight) && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: partner.highlight ? '1.4fr 1fr' : '1fr' },
                gap: 2.5,
                alignItems: 'center',
              }}
            >
              {partner.intro && (
                <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
                  <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontSize: '0.95rem', lineHeight: 1.8 }}>
                    {partner.intro}
                  </Typography>
                  {partner.slug === 'bcr' && (
                    <Button
                      component="a"
                      href={BCR_ONBOARDING_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
                      sx={primaryButtonSx}
                    >
                      Deschide contul George
                    </Button>
                  )}
                </Stack>
              )}

              {partner.highlight && (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: DASHBOARD_TOKENS.radius.md,
                    border: `1px solid ${alpha(DASHBOARD_TOKENS.primary, 0.35)}`,
                    backgroundColor: DASHBOARD_TOKENS.accentWash,
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        backgroundColor: DASHBOARD_TOKENS.paper,
                        border: `1px solid ${alpha(DASHBOARD_TOKENS.primary, 0.35)}`,
                      }}
                    >
                      <RedeemRoundedIcon sx={{ color: DASHBOARD_TOKENS.accent }} />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        letterSpacing: -1,
                        color: DASHBOARD_TOKENS.accent,
                      }}
                    >
                      {partner.highlight.amount}
                    </Typography>
                  </Stack>
                  <Typography sx={{ mt: 1.5, fontWeight: 800, color: DASHBOARD_TOKENS.ink, lineHeight: 1.4 }}>
                    {partner.highlight.title}
                  </Typography>
                  {partner.highlight.note && (
                    <Typography sx={{ mt: 0.5, fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>
                      {partner.highlight.note}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}

          {partner.showBcrOffers && <BcrOffers />}

          {partner.blocks.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: partner.blocks.length > 1 ? '1fr 1fr' : '1fr',
                },
                gap: 2.5,
                alignItems: 'stretch',
              }}
            >
              {partner.blocks.map((block) => (
                <BlockCard key={block.title} block={block} onNavigate={onNavigate} />
              ))}
            </Box>
          )}
        </Stack>
      </Box>
    </Paper>
  )
}

/** Cele două variante BCR + comparativul. Singurul partener cu ofertă pe planuri. */
function BcrOffers() {
  return (
    <Box>
      <Typography sx={{ fontWeight: 850, fontSize: '1.05rem', color: DASHBOARD_TOKENS.ink }}>
        Oferta BCR pentru PFA Ridesharing
      </Typography>
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mt: 0.3, mb: 2.5 }}>
        Două variante, în funcție de vechimea PFA-ului tău.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2.5,
          alignItems: 'stretch',
        }}
      >
        {BCR_OFFERS.map((offer) => (
          <Box key={offer.title} sx={cardSx}>
            <Chip label={offer.chip} size="small" sx={badgeSx} />
            <Typography sx={{ fontWeight: 850, fontSize: '1rem', color: DASHBOARD_TOKENS.ink }}>
              {offer.title}
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem', mt: 0.3, mb: 2 }}>
              {offer.note}
            </Typography>

            <Stack spacing={1.4}>
              {offer.benefits.map((benefit) => (
                <Check key={benefit.title} label={benefit.title} />
              ))}
              <Check label="Bonus RIDElance: +100 lei" />
            </Stack>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function BlockCard({
  block,
  onNavigate,
}: {
  block: BenefitBlock
  onNavigate?: (section: string) => void
}) {
  const section = block.link?.href.startsWith('section:')
    ? block.link.href.slice('section:'.length)
    : null

  return (
    <Box sx={cardSx}>
      {block.badge && <Chip label={block.badge} size="small" sx={badgeSx} />}

      <Typography sx={{ fontWeight: 850, fontSize: '1rem', color: DASHBOARD_TOKENS.ink }}>
        {block.title}
      </Typography>

      {block.text && (
        <Typography
          sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem', lineHeight: 1.7, mt: 0.8 }}
        >
          {block.text}
        </Typography>
      )}

      {block.checks && (
        <Stack spacing={1.2} sx={{ mt: 2 }}>
          {block.checks.map((check) => (
            <Check key={check} label={check} />
          ))}
        </Stack>
      )}

      {block.rows && (
        <Box
          sx={{
            mt: 2,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            borderRadius: DASHBOARD_TOKENS.radius.sm,
            overflow: 'hidden',
          }}
        >
          {block.rows.map((row, index) => (
            <Stack
              key={row.label}
              direction="row"
              spacing={2}
              sx={{
                px: 1.6,
                py: 1.1,
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: index === 0 ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
              }}
            >
              <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
                {row.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: DASHBOARD_TOKENS.ink,
                  textAlign: 'right',
                }}
              >
                {row.value}
              </Typography>
            </Stack>
          ))}
        </Box>
      )}

      {block.contact && (
        <Box
          sx={{
            mt: 2,
            p: 1.6,
            borderRadius: DASHBOARD_TOKENS.radius.sm,
            backgroundColor: DASHBOARD_TOKENS.surfaceAlt,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: DASHBOARD_TOKENS.ink }}>
            {block.contact.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.2, flexWrap: 'wrap', rowGap: 1 }}>
            <Button
              component="a"
              href={`mailto:${block.contact.email}`}
              startIcon={<EmailRoundedIcon sx={{ fontSize: 16 }} />}
              sx={quietButtonSx}
            >
              {block.contact.email}
            </Button>
            <Button
              component="a"
              href={`tel:${block.contact.phone.replace(/\s/g, '')}`}
              startIcon={<CallRoundedIcon sx={{ fontSize: 16 }} />}
              sx={quietButtonSx}
            >
              {block.contact.phone}
            </Button>
          </Stack>
        </Box>
      )}

      {block.link && (
        <Box sx={{ mt: 'auto', pt: 2 }}>
          {section ? (
            <Button
              variant="contained"
              onClick={() => onNavigate?.(section)}
              disabled={!onNavigate}
              sx={primaryButtonSx}
            >
              {block.link.label}
            </Button>
          ) : (
            <Button
              component="a"
              href={block.link.href}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
              sx={primaryButtonSx}
            >
              {block.link.label}
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}

function Check({ label }: { label: string }) {
  return (
    <Stack direction="row" spacing={1.2} sx={{ alignItems: 'flex-start' }}>
      <CheckCircleRoundedIcon
        sx={{ fontSize: 18, color: DASHBOARD_TOKENS.accent, mt: '2px', flexShrink: 0 }}
      />
      <Typography sx={{ fontSize: '0.87rem', color: DASHBOARD_TOKENS.ink, lineHeight: 1.5 }}>
        {label}
      </Typography>
    </Stack>
  )
}

const cardSx = {
  p: { xs: 2, md: 2.4 },
  borderRadius: DASHBOARD_TOKENS.radius.md,
  border: `1px solid ${DASHBOARD_TOKENS.border}`,
  backgroundColor: DASHBOARD_TOKENS.paper,
  display: 'flex',
  flexDirection: 'column',
} as const

const badgeSx = {
  alignSelf: 'flex-start',
  mb: 1.2,
  fontWeight: 800,
  fontSize: '0.7rem',
  height: 24,
  borderRadius: DASHBOARD_TOKENS.radius.full,
  backgroundColor: DASHBOARD_TOKENS.accentWash,
  color: DASHBOARD_TOKENS.accent,
} as const

const primaryButtonSx = {
  px: 2.5,
  py: 1,
  fontWeight: 800,
  fontSize: '0.86rem',
  textTransform: 'none',
  color: '#fff',
  backgroundColor: DASHBOARD_TOKENS.primary,
  borderRadius: DASHBOARD_TOKENS.radius.full,
  boxShadow: 'none',
  '&:hover': { backgroundColor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' },
} as const

const quietButtonSx = {
  px: 1.4,
  fontWeight: 700,
  fontSize: '0.78rem',
  textTransform: 'none',
  color: DASHBOARD_TOKENS.accent,
  backgroundColor: DASHBOARD_TOKENS.paper,
  border: `1px solid ${DASHBOARD_TOKENS.border}`,
  borderRadius: DASHBOARD_TOKENS.radius.full,
  '&:hover': { backgroundColor: DASHBOARD_TOKENS.accentWash },
} as const
