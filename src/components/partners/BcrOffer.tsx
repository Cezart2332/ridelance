import { useRef, useState } from 'react'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded'

import {
  BCR_OFFER_CAMPAIGN,
  BCR_OFFER_CTA,
  BCR_OFFER_HERO,
  BCR_OFFER_LEGAL,
  BCR_OFFER_SECTION,
  BCR_OFFER_VALIDITY,
  BCR_OFFER_VARIANTS,
  type BcrTextSegment,
  type BcrVariant,
} from '../../data/bcrOffer'
import { BCR_ACCOUNT } from '../../data/partners'
import type { OfferTokens } from './offerTokens'

/**
 * Oferta BCR × RIDElance — aceeași componentă în pagina publică de Parteneri și în Beneficii.
 *
 * Textul vine întreg din `data/bcrOffer.ts` și nu se rescrie aici: sunt comisioane bancare și
 * clauze de campanie. Ce se schimbă față de materialul primit e doar desenul — tokenii noștri,
 * un singur accent de culoare, tabel real pentru grila de comisioane. Materialul avea gradiente,
 * patru culori de card și cifre uriașe; asta e o ofertă bancară, iar o ofertă bancară care strigă
 * se citește ca o reclamă, nu ca un contract.
 *
 * PFA și SRL stau pe același comutator, ca în material. Sunt aceleași rubrici cu alte cifre —
 * două secțiuni una sub alta ar fi făcut comparația imposibilă și pagina de două ori mai lungă.
 */

interface BcrOfferProps {
  tokens: OfferTokens
  /**
   * Codul QR de lângă butonul final.
   *
   * Se stinge unde pagina îl arată deja în altă parte, ca să nu apară de două ori pe același
   * ecran — QR-ul dublat arată a greșeală, nu a insistență.
   */
  showQr?: boolean
}

export function BcrOffer({ tokens, showQr = true }: BcrOfferProps) {
  const [variantId, setVariantId] = useState<BcrVariant['id']>('pfa')
  const variant = BCR_OFFER_VARIANTS.find((entry) => entry.id === variantId) ?? BCR_OFFER_VARIANTS[0]
  const variantsRef = useRef<HTMLDivElement>(null)

  // Derulare, nu link cu ancoră: oferta e randată în interiorul unei pagini de router, iar un
  // `href="#..."` ar fi fost interpretat ca navigare și ar fi schimbat ruta.
  const scrollToVariants = () =>
    variantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <Hero tokens={tokens} onSeeOffer={scrollToVariants} />
      <Validity tokens={tokens} />

      <Box ref={variantsRef}>
        <Typography
          sx={{ fontWeight: 850, fontSize: { xs: '1.25rem', md: '1.4rem' }, color: tokens.ink }}
        >
          {BCR_OFFER_SECTION.title}
        </Typography>
        <Typography
          sx={{
            color: tokens.textMuted,
            fontSize: '0.92rem',
            lineHeight: 1.7,
            mt: 0.6,
            maxWidth: 640,
          }}
        >
          {BCR_OFFER_SECTION.text}
        </Typography>

        <Stack
          direction="row"
          spacing={0.5}
          role="tablist"
          aria-label="Tip client"
          sx={{
            mt: 2.5,
            mb: 3,
            p: 0.5,
            borderRadius: `${tokens.radius.full}px`,
            backgroundColor: alpha(tokens.ink, 0.05),
            alignSelf: 'flex-start',
            width: 'fit-content',
          }}
        >
          {BCR_OFFER_VARIANTS.map((entry) => {
            const active = entry.id === variantId
            return (
              <Box
                key={entry.id}
                component="button"
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setVariantId(entry.id)}
                sx={{
                  appearance: 'none',
                  border: 0,
                  cursor: 'pointer',
                  px: 2.6,
                  py: 0.9,
                  borderRadius: `${tokens.radius.full}px`,
                  fontFamily: 'inherit',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  color: active ? tokens.ink : tokens.textMuted,
                  backgroundColor: active ? tokens.paper : 'transparent',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'background-color 160ms, color 160ms',
                }}
              >
                {entry.tab}
              </Box>
            )
          })}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.15fr) minmax(0, 0.85fr)' },
            gap: { xs: 2.5, lg: 3 },
            alignItems: 'start',
          }}
        >
          <ProductCard tokens={tokens} variant={variant} />
          <Stack spacing={{ xs: 2.5, lg: 3 }}>
            <FreePeriods tokens={tokens} variant={variant} />
            <DiscountConditions tokens={tokens} variant={variant} />
          </Stack>
        </Box>
      </Box>

      <Campaign tokens={tokens} />
      <CallToAction tokens={tokens} showQr={showQr} />
      <Legal tokens={tokens} />
    </Stack>
  )
}

/**
 * Antetul campaniei.
 *
 * Suma stă într-un card alb pe fundal colorat, nu într-un titlu de 68 de pixeli: „−50 lei" e
 * cifra care contează, iar un card o scoate în evidență fără să transforme pagina într-un afiș.
 */
function Hero({ tokens, onSeeOffer }: { tokens: OfferTokens; onSeeOffer: () => void }) {
  const { eyebrow, titleLines, lead, offer, seeOffer, openAccount } = BCR_OFFER_HERO

  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: `${tokens.radius.xl}px`,
        border: `1px solid ${alpha(tokens.primary, 0.3)}`,
        backgroundColor: alpha(tokens.primary, 0.06),
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
        gap: { xs: 3, md: 4 },
        alignItems: 'center',
      }}
    >
      <Box>
        <Chip
          label={eyebrow}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.68rem',
            letterSpacing: '0.04em',
            backgroundColor: alpha(tokens.primaryStrong, 0.16),
            color: tokens.ink,
            borderRadius: `${tokens.radius.full}px`,
            mb: 1.8,
          }}
        />

        <Typography
          component="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '1.7rem', md: '2.3rem' },
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            color: tokens.ink,
          }}
        >
          {titleLines.map((line) => (
            <Box key={line} component="span" sx={{ display: 'block' }}>
              {line}
            </Box>
          ))}
        </Typography>

        <Typography
          sx={{
            mt: 1.8,
            fontSize: { xs: '0.95rem', md: '1.02rem' },
            lineHeight: 1.75,
            color: tokens.textMuted,
            maxWidth: 620,
          }}
        >
          <Segments segments={lead} tokens={tokens} />
        </Typography>

        <Stack direction="row" spacing={1.2} sx={{ mt: 2.5, flexWrap: 'wrap', rowGap: 1.2 }}>
          <Button
            variant="contained"
            disableElevation
            onClick={onSeeOffer}
            sx={{
              px: 2.8,
              py: 1,
              fontSize: '0.9rem',
              fontWeight: 800,
              textTransform: 'none',
              color: '#fff',
              backgroundColor: tokens.primaryStrong,
              borderRadius: `${tokens.radius.full}px`,
              '&:hover': { backgroundColor: tokens.primaryStrong, filter: 'brightness(0.94)' },
            }}
          >
            {seeOffer}
          </Button>
          <Button
            component="a"
            href={BCR_ACCOUNT.url}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenInNewRoundedIcon />}
            sx={{
              px: 2.6,
              py: 1,
              fontSize: '0.9rem',
              fontWeight: 800,
              textTransform: 'none',
              color: tokens.ink,
              border: `1px solid ${alpha(tokens.ink, 0.16)}`,
              backgroundColor: tokens.paper,
              borderRadius: `${tokens.radius.full}px`,
              '&:hover': { backgroundColor: tokens.surface },
            }}
          >
            {openAccount}
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          p: 2.8,
          borderRadius: `${tokens.radius.lg}px`,
          border: `1px solid ${tokens.border}`,
          backgroundColor: tokens.paper,
          minWidth: { md: 260 },
        }}
      >
        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 850,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: tokens.primaryStrong,
          }}
        >
          {offer.label}
        </Typography>
        <Typography
          sx={{
            mt: 0.6,
            fontSize: '2.6rem',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: tokens.ink,
          }}
        >
          {offer.amount}
        </Typography>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: tokens.ink, mt: 0.4 }}>
          {offer.period}
        </Typography>
        <Box sx={{ mt: 1.8, pt: 1.8, borderTop: `1px solid ${tokens.border}` }}>
          <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: tokens.ink }}>
            {offer.totalTitle}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: tokens.textMuted, mt: 0.2 }}>
            {offer.totalNote}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

function Validity({ tokens }: { tokens: OfferTokens }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        px: { xs: 2, md: 2.6 },
        py: 2,
        borderRadius: `${tokens.radius.lg}px`,
        border: `1px solid ${tokens.border}`,
        backgroundColor: tokens.paper,
        alignItems: { sm: 'center' },
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: tokens.ink }}>
          {BCR_OFFER_VALIDITY.title}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: tokens.textMuted, mt: 0.3, lineHeight: 1.6 }}>
          {BCR_OFFER_VALIDITY.text}
        </Typography>
      </Box>
      <Chip
        label={BCR_OFFER_VALIDITY.badge}
        size="small"
        sx={{
          fontWeight: 800,
          fontSize: '0.75rem',
          backgroundColor: alpha(tokens.primary, 0.14),
          color: tokens.ink,
          borderRadius: `${tokens.radius.full}px`,
          alignSelf: { xs: 'flex-start', sm: 'center' },
          flexShrink: 0,
        }}
      />
    </Stack>
  )
}

/** Produsul bancar: ce e, ce include, cât costă. */
function ProductCard({ tokens, variant }: { tokens: OfferTokens; variant: BcrVariant }) {
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: `${tokens.radius.xl}px`,
        border: `1px solid ${tokens.border}`,
        backgroundColor: tokens.paper,
      }}
    >
      <Typography sx={{ fontWeight: 850, fontSize: '1.15rem', color: tokens.ink }}>
        {variant.title}
      </Typography>
      <Typography sx={{ color: tokens.textMuted, fontSize: '0.9rem', lineHeight: 1.7, mt: 0.6 }}>
        {variant.lead}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, mt: 2 }}>
        {variant.pills.map((pill) => (
          <Chip
            key={pill}
            label={pill}
            size="small"
            sx={{
              fontWeight: 750,
              fontSize: '0.72rem',
              backgroundColor: alpha(tokens.ink, 0.05),
              color: tokens.textMuted,
              borderRadius: `${tokens.radius.full}px`,
            }}
          />
        ))}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.2,
          mt: 2.5,
        }}
      >
        {variant.benefits.map((benefit) => (
          <Stack
            key={benefit.title}
            direction="row"
            spacing={1.2}
            sx={{
              p: 1.6,
              borderRadius: `${tokens.radius.md}px`,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              alignItems: 'flex-start',
            }}
          >
            <CheckRoundedIcon
              sx={{ fontSize: 17, color: tokens.primaryStrong, mt: '2px', flexShrink: 0 }}
            />
            <Box>
              <Typography sx={{ fontSize: '0.84rem', fontWeight: 800, color: tokens.ink }}>
                {benefit.title}
              </Typography>
              <Typography
                sx={{ fontSize: '0.78rem', color: tokens.textMuted, lineHeight: 1.55, mt: 0.3 }}
              >
                {benefit.text}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Box>

      <FeeTable tokens={tokens} variant={variant} />
    </Box>
  )
}

/**
 * Grila de comisioane.
 *
 * Tabel adevărat, nu carduri: sunt trei valori comparabile pe patru praguri, iar cardurile ar fi
 * rupt tocmai coloana pe care omul o citește — cât plătește la numărul lui de plăți lunare.
 * Derulează pe orizontală pe ecran mic; nu se restrânge, fiindcă un tabel de preț rupt în două
 * rânduri nu mai e un tabel de preț.
 */
function FeeTable({ tokens, variant }: { tokens: OfferTokens; variant: BcrVariant }) {
  return (
    <Box
      sx={{
        mt: 2.5,
        border: `1px solid ${tokens.border}`,
        borderRadius: `${tokens.radius.md}px`,
        overflowX: 'auto',
      }}
    >
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 380 }}>
        <Box component="thead">
          <Box component="tr">
            {BCR_OFFER_SECTION.feeTableHeaders.map((heading, index) => (
              <Box
                component="th"
                key={heading}
                sx={{
                  textAlign: index === 0 ? 'left' : 'right',
                  px: 1.6,
                  py: 1.2,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  color: tokens.textMuted,
                  backgroundColor: tokens.surface,
                  borderBottom: `1px solid ${tokens.border}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {heading}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {variant.fees.map((row, index) => (
            <Box component="tr" key={row.payments}>
              <Box
                component="td"
                sx={{
                  px: 1.6,
                  py: 1.25,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: tokens.ink,
                  borderTop: index === 0 ? 'none' : `1px solid ${tokens.border}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {row.payments}
              </Box>
              <Box
                component="td"
                sx={{
                  px: 1.6,
                  py: 1.25,
                  textAlign: 'right',
                  fontSize: '0.85rem',
                  color: tokens.textMuted,
                  borderTop: index === 0 ? 'none' : `1px solid ${tokens.border}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {row.standard}
              </Box>
              <Box
                component="td"
                sx={{
                  px: 1.6,
                  py: 1.25,
                  textAlign: 'right',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: tokens.primaryStrong,
                  borderTop: index === 0 ? 'none' : `1px solid ${tokens.border}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {row.discounted}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

/** Perioadele fără comision, după vechimea firmei. */
function FreePeriods({ tokens, variant }: { tokens: OfferTokens; variant: BcrVariant }) {
  return (
    <Stack spacing={1.5}>
      {variant.freePeriods.map((period) => (
        <Box
          key={period.scope}
          sx={{
            p: 2.4,
            borderRadius: `${tokens.radius.lg}px`,
            border: `1px solid ${period.featured ? alpha(tokens.primary, 0.4) : tokens.border}`,
            backgroundColor: period.featured ? alpha(tokens.primary, 0.07) : tokens.paper,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: 850,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: tokens.textMuted,
            }}
          >
            {period.scope}
          </Typography>
          <Typography
            sx={{
              mt: 0.6,
              fontSize: '1.05rem',
              fontWeight: 850,
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              color: tokens.ink,
            }}
          >
            {period.headline}
          </Typography>
          <Typography
            sx={{ mt: 0.7, fontSize: '0.83rem', color: tokens.textMuted, lineHeight: 1.6 }}
          >
            {period.text}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

/** Condițiile care aduc procente. Procentul stă în stânga, ca să se citească coloana, nu fraza. */
function DiscountConditions({ tokens, variant }: { tokens: OfferTokens; variant: BcrVariant }) {
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: `${tokens.radius.xl}px`,
        border: `1px solid ${tokens.border}`,
        backgroundColor: tokens.paper,
      }}
    >
      <Typography sx={{ fontWeight: 850, fontSize: '1.05rem', color: tokens.ink }}>
        {variant.discountsTitle}
      </Typography>
      <Typography sx={{ color: tokens.textMuted, fontSize: '0.86rem', lineHeight: 1.65, mt: 0.5 }}>
        {variant.discountsLead}
      </Typography>

      <Stack spacing={1.2} sx={{ mt: 2 }}>
        {variant.discounts.map((discount) => (
          <Stack
            key={discount.title}
            direction="row"
            spacing={1.6}
            sx={{
              p: 1.6,
              borderRadius: `${tokens.radius.md}px`,
              border: `1px solid ${tokens.border}`,
              alignItems: 'flex-start',
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                minWidth: 54,
                textAlign: 'center',
                px: 1,
                py: 0.6,
                borderRadius: `${tokens.radius.md}px`,
                backgroundColor: alpha(tokens.primary, 0.14),
                color: tokens.ink,
                fontSize: '0.82rem',
                fontWeight: 900,
              }}
            >
              {discount.value}
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: tokens.ink, lineHeight: 1.45 }}>
                {discount.title}
              </Typography>
              <Typography
                sx={{ fontSize: '0.79rem', color: tokens.textMuted, lineHeight: 1.55, mt: 0.3 }}
              >
                {discount.text}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

/** Beneficiul care e al nostru, nu al băncii — de aceea stă separat de tot ce e mai sus. */
function Campaign({ tokens }: { tokens: OfferTokens }) {
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3.5 },
        borderRadius: `${tokens.radius.xl}px`,
        border: `1px solid ${tokens.border}`,
        backgroundColor: tokens.surface,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
        gap: { xs: 2.5, md: 4 },
        alignItems: 'center',
      }}
    >
      <Box>
        <Typography sx={{ fontWeight: 850, fontSize: '1.2rem', color: tokens.ink }}>
          {BCR_OFFER_CAMPAIGN.title}
        </Typography>
        <Typography
          sx={{ mt: 0.8, fontSize: '0.92rem', lineHeight: 1.75, color: tokens.textMuted, maxWidth: 640 }}
        >
          <Segments segments={BCR_OFFER_CAMPAIGN.text} tokens={tokens} />
        </Typography>
      </Box>

      <Box
        sx={{
          px: 3,
          py: 2.4,
          borderRadius: `${tokens.radius.lg}px`,
          border: `1px solid ${alpha(tokens.primary, 0.35)}`,
          backgroundColor: tokens.paper,
          textAlign: 'center',
          minWidth: { md: 210 },
        }}
      >
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 850,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: tokens.textMuted,
          }}
        >
          {BCR_OFFER_CAMPAIGN.statLabel}
        </Typography>
        <Typography
          sx={{
            fontSize: '2.2rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: tokens.primaryStrong,
            my: 0.3,
          }}
        >
          {BCR_OFFER_CAMPAIGN.statValue}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: tokens.textMuted }}>
          {BCR_OFFER_CAMPAIGN.statNote}
        </Typography>
      </Box>
    </Box>
  )
}

/**
 * Închiderea: butonul și codul QR, unul lângă altul.
 *
 * QR-ul stă aici, nu în capul paginii, fiindcă e util exact în momentul deciziei — se scanează de
 * pe laptop ca să se continue pe telefon, unde se și deschide contul. Linkul din buton și cel din
 * QR vin din aceeași sursă (`BCR_ACCOUNT`), deci nu pot ajunge să ducă în locuri diferite.
 */
function CallToAction({ tokens, showQr }: { tokens: OfferTokens; showQr: boolean }) {
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3.5 },
        borderRadius: `${tokens.radius.xl}px`,
        border: `1px solid ${alpha(tokens.primary, 0.3)}`,
        backgroundColor: alpha(tokens.primary, 0.06),
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: showQr ? 'minmax(0, 1fr) auto' : '1fr' },
        gap: { xs: 3, md: 4 },
        alignItems: 'center',
      }}
    >
      <Box>
        <Typography sx={{ fontWeight: 850, fontSize: { xs: '1.2rem', md: '1.4rem' }, color: tokens.ink }}>
          {BCR_OFFER_CTA.title}
        </Typography>
        <Typography
          sx={{ mt: 0.8, fontSize: '0.92rem', lineHeight: 1.75, color: tokens.textMuted, maxWidth: 620 }}
        >
          {BCR_OFFER_CTA.text}
        </Typography>

        <Button
          variant="contained"
          component="a"
          href={BCR_ACCOUNT.url}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<OpenInNewRoundedIcon />}
          disableElevation
          sx={{
            mt: 2.5,
            px: 3.4,
            py: 1.15,
            fontSize: '0.95rem',
            fontWeight: 800,
            textTransform: 'none',
            color: '#fff',
            backgroundColor: tokens.primaryStrong,
            borderRadius: `${tokens.radius.full}px`,
            '&:hover': { backgroundColor: tokens.primaryStrong, filter: 'brightness(0.94)' },
          }}
        >
          {BCR_OFFER_CTA.button}
        </Button>
      </Box>

      {showQr && (
        <Box
          sx={{
            p: 2,
            borderRadius: `${tokens.radius.lg}px`,
            border: `1px solid ${tokens.border}`,
            backgroundColor: tokens.paper,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.2,
            width: 216,
            justifySelf: { xs: 'center', md: 'end' },
          }}
        >
          <Box
            component="img"
            src={BCR_ACCOUNT.qrImage}
            alt={BCR_ACCOUNT.qrLabel}
            sx={{ width: '100%', maxWidth: 176, height: 'auto', borderRadius: `${tokens.radius.md}px` }}
          />
          <Stack direction="row" spacing={0.7} sx={{ alignItems: 'flex-start' }}>
            <QrCode2RoundedIcon sx={{ fontSize: 16, color: tokens.textMuted, mt: '2px' }} />
            <Typography
              sx={{ color: tokens.textMuted, fontSize: '0.76rem', fontWeight: 700, textAlign: 'center' }}
            >
              {BCR_ACCOUNT.qrLabel}
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  )
}

/** Notele de subsol. Mici, dar prezente: sunt condițiile în care oferta de mai sus e adevărată. */
function Legal({ tokens }: { tokens: OfferTokens }) {
  return (
    <Stack spacing={1} sx={{ pt: 1 }}>
      {BCR_OFFER_LEGAL.map((entry) => (
        <Typography
          key={entry.label}
          sx={{ fontSize: '0.72rem', lineHeight: 1.7, color: tokens.textSubtle }}
        >
          <Box component="strong" sx={{ fontWeight: 800, color: tokens.textMuted }}>
            {entry.label}
          </Box>{' '}
          {entry.text}
        </Typography>
      ))}
    </Stack>
  )
}

/** Frazele care au o bucată îngroșată în mijloc, exact unde o avea materialul primit. */
function Segments({ segments, tokens }: { segments: readonly BcrTextSegment[]; tokens: OfferTokens }) {
  return (
    <>
      {segments.map((segment) => (
        <Box
          key={segment.text}
          component="span"
          sx={segment.strong ? { fontWeight: 800, color: tokens.ink } : undefined}
        >
          {segment.text}
        </Box>
      ))}
    </>
  )
}
