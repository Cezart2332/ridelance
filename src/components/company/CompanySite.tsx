import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded'
import ForumRoundedIcon from '@mui/icons-material/ForumRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded'
import DirectionsRoundedIcon from '@mui/icons-material/DirectionsRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import MapRoundedIcon from '@mui/icons-material/MapRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

import CarListCard from '../cars/CarListCard'
import { FleetMap, PlaceMap } from '../cars/map/LazyMaps'
import type { FleetMapPoint } from '../cars/map/FleetMap'
import { OwnerAvatar } from '../common/OwnerAvatar'
import { uploadUrl } from '../../lib/api'
import { TOKENS } from '../../constants/tokens'
import type { Car } from '../../services/cars.service'
import type { PublicCompany } from '../../services/company.service'
import { formatCarStatus } from '../../utils/carLabels'
import { hasActiveDiscount } from '../../utils/carPricing'
import { normalizeContent, normalizeTheme, themeVars, withAlpha } from './companyTheme'
import { highlightIcon } from './highlightIcons'
import { hasPin, visibleSections, type SectionId } from './sections'

/**
 * Mini-site-ul public al unei firme.
 *
 * Un singur component pentru două locuri: pagina publică de la `/{slug}` și previzualizarea din
 * editorul de flotă. Previzualizarea nu are cum să mintă, fiindcă nu e o a doua implementare — e
 * exact ce vede vizitatorul, cu datele nesalvate încă.
 *
 * Tot conținutul e pe o singură pagină. Meniul derulează, nu navighează: o flotă cu patru mașini
 * n-are nevoie de cinci rute, iar linkul distribuit trebuie să ducă la tot.
 *
 * Pe ecran lat meniul stă vertical, lipit în stânga, ca la un site de firmă; pe telefon devine
 * banda orizontală de sub bara RIDElance. Pragurile sunt pe lățimea containerului, nu a ferestrei:
 * previzualizarea din dashboard e un panou îngust într-un ecran lat și trebuie să arate ca pagina
 * văzută pe un ecran de lățimea panoului, nu ca o pagină de desktop strivită.
 *
 * Culorile firmei trăiesc într-un set de variabile CSS puse pe containerul de aici. În afara lui
 * — bara RIDElance de sus, subsolul — nimic nu se tematizează. Pagina e a firmei, dar e găzduită
 * la noi, iar asta trebuie să se vadă fără să scrie nicăieri „găzduit de".
 */

interface CompanySiteProps {
  company: PublicCompany
  /** În editor: fără bară lipită, fără linkuri care navighează. */
  preview?: boolean
}

/** Înălțimea barei RIDElance de sus, ca titlurile să nu ajungă sub ea la scroll. */
const APP_BAR = { xs: 64, md: 72 }
const SECTION_NAV = { xs: 52, md: 56 }
const SIDEBAR_WIDTH = 216

/** Pragurile mini-site-ului, pe lățimea containerului `site`. */
const WIDE = '@container site (min-width: 960px)'
const MEDIUM = '@container site (min-width: 620px)'
const XWIDE = '@container site (min-width: 1240px)'

const SECTION_ICONS: Record<SectionId, typeof InfoOutlinedIcon> = {
  despre: InfoOutlinedIcon,
  avantaje: StarRoundedIcon,
  flota: DirectionsCarFilledRoundedIcon,
  program: EventNoteRoundedIcon,
  intrebari: HelpOutlineRoundedIcon,
  locatie: LocationOnRoundedIcon,
  contact: ForumRoundedIcon,
}

export function CompanySite({ company, preview = false }: CompanySiteProps) {
  const theme = normalizeTheme(company.theme)
  const content = normalizeContent(company.content)
  const sections = visibleSections({ ...company, content })
  const [active, setActive] = useState<SectionId | null>(null)

  // Lista de secțiuni se recalculează la fiecare randare, deci ca dependență ar fi repornit
  // observatorul de fiecare dată. Cheia de mai jos se schimbă doar când chiar apare sau dispare
  // o secțiune — adică exact când observatorul trebuie refăcut.
  const sectionKey = sections.map((section) => section.id).join(',')

  useEffect(() => {
    if (preview) return

    const observed = sectionKey
      .split(',')
      .map((id) => document.getElementById(`sectiune-${id}`))
      .filter((element): element is HTMLElement => element !== null)

    if (observed.length === 0) return

    // Banda de sus a ferestrei, sub bara fixă: secțiunea „activă" e cea care tocmai a ajuns
    // acolo, nu cea care ocupă cel mai mult ecran — altfel Flota, fiind cea mai înaltă, ar fi
    // rămas marcată aproape tot timpul. Banda ține până la jumătatea ecranului tocmai ca ultima
    // secțiune să apuce să intre în ea: la capătul paginii nu mai există scroll care s-o ridice.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

        if (visible) {
          setActive(visible.target.id.replace('sectiune-', '') as SectionId)
        }
      },
      { rootMargin: '-140px 0px -45% 0px' },
    )

    observed.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [preview, sectionKey])

  const hasContact = Boolean(company.phone || company.email || company.whatsAppEnabled)

  return (
    <Box
      sx={{
        ...themeVars(theme),
        containerType: 'inline-size',
        containerName: 'site',
        bgcolor: 'var(--cs-bg)',
        color: 'var(--cs-text)',
        // Previzualizarea trăiește într-un panou de dashboard, nu într-o fereastră: fără asta,
        // fundalul firmei s-ar termina la ultima secțiune și ar arăta ca o eroare de randare.
        minHeight: preview ? 'auto' : '100%',
      }}
    >
      {sections.length > 1 && (
        <Box sx={{ [WIDE]: { display: 'none' } }}>
          <SectionStrip sections={sections} active={active} preview={preview} />
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          [WIDE]: { gridTemplateColumns: `${SIDEBAR_WIDTH}px minmax(0, 1fr)` },
        }}
      >
        <Box sx={{ display: 'none', [WIDE]: { display: 'block' } }}>
          <SectionRail
            company={company}
            sections={sections}
            active={active}
            preview={preview}
          />
        </Box>

        <Box
          sx={{
            minWidth: 0,
            px: 2,
            pt: 2,
            pb: { xs: 6, md: 9 },
            [MEDIUM]: { px: 3, pt: 3 },
            [WIDE]: { px: 4, pt: 3.5 },
          }}
        >
          <Box sx={{ maxWidth: 1376, mx: 'auto' }}>
            <Hero company={company} preview={preview} />

            <Stack spacing={{ xs: 7, md: 10 }} sx={{ mt: { xs: 7, md: 9 } }}>
              {sections.some((s) => s.id === 'despre') && (
                <Section id="despre" title="Despre noi" preview={preview}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '21px',
                      bgcolor: 'var(--cs-surface)',
                      border: '1px solid var(--cs-border)',
                      [MEDIUM]: { p: 5 },
                    }}
                  >
                    <Typography
                      sx={{
                        color: 'var(--cs-text-muted)',
                        fontSize: '1.05rem',
                        lineHeight: 1.85,
                        maxWidth: 820,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {company.publicDescription}
                    </Typography>
                  </Box>
                </Section>
              )}

              {sections.some((s) => s.id === 'avantaje') && (
                <Section id="avantaje" title="De ce noi" preview={preview}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: 2,
                      [MEDIUM]: { gridTemplateColumns: 'repeat(2, 1fr)' },
                      [WIDE]: { gridTemplateColumns: 'repeat(3, 1fr)' },
                    }}
                  >
                    {content.highlights.map((highlight, index) => {
                      const Icon = highlightIcon(highlight.iconKey)
                      return (
                        <Box
                          key={`${highlight.title}-${index}`}
                          sx={{
                            p: 3.2,
                            borderRadius: `${TOKENS.radius.xl}px`,
                            bgcolor: 'var(--cs-bg)',
                            border: '1px solid var(--cs-border)',
                          }}
                        >
                          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2.2 }}>
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: `${TOKENS.radius.lg}px`,
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: 'var(--cs-accent-soft)',
                              }}
                            >
                              <Icon sx={{ fontSize: 22, color: 'var(--cs-accent)' }} />
                            </Box>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--cs-accent)' }}>
                              {String(index + 1).padStart(2, '0')}
                            </Typography>
                          </Stack>
                          <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.02em', mb: 0.8 }}>
                            {highlight.title}
                          </Typography>
                          {highlight.text && (
                            <Typography sx={{ color: 'var(--cs-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                              {highlight.text}
                            </Typography>
                          )}
                        </Box>
                      )
                    })}
                  </Box>
                </Section>
              )}

              <Section
                id="flota"
                title={company.cars.length === 0 ? 'Flota' : `Flota (${company.cars.length})`}
                preview={preview}
              >
                <FleetCatalogue company={company} preview={preview} />
              </Section>

              {sections.some((s) => s.id === 'program') && (
                <Section id="program" title="Program și zone de predare" preview={preview}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: 3,
                      [MEDIUM]: { gridTemplateColumns: content.schedule.length > 0 ? '1fr 1fr' : '1fr', gap: 4 },
                    }}
                  >
                    {content.schedule.length > 0 && (
                      <Box>
                        <Stack
                          divider={<Box sx={{ height: '1px', bgcolor: 'var(--cs-border)' }} />}
                          sx={{
                            borderRadius: `${TOKENS.radius.xl}px`,
                            border: '1px solid var(--cs-border)',
                            bgcolor: 'var(--cs-surface)',
                            px: 2.4,
                          }}
                        >
                          {content.schedule.map((row, index) => (
                            <Stack
                              key={`${row.day}-${index}`}
                              direction="row"
                              spacing={2}
                              sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1.6 }}
                            >
                              <Typography sx={{ fontWeight: 800, fontSize: '0.92rem' }}>{row.day}</Typography>
                              <Typography sx={{ color: 'var(--cs-text-muted)', fontSize: '0.92rem', fontWeight: 600 }}>
                                {row.hours}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {(content.coverageAreas.length > 0 || content.coverageNote) && (
                      <Box>
                        {content.coverageAreas.length > 0 && (
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, mb: 1.8 }}>
                            {content.coverageAreas.map((area) => (
                              <Box
                                key={area}
                                sx={{
                                  px: 1.6,
                                  py: 0.7,
                                  borderRadius: `${TOKENS.radius.full}px`,
                                  bgcolor: 'var(--cs-accent-soft)',
                                  border: '1px solid var(--cs-accent-line)',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                }}
                              >
                                {area}
                              </Box>
                            ))}
                          </Stack>
                        )}
                        {content.coverageNote && (
                          <Typography
                            sx={{
                              color: 'var(--cs-text-muted)',
                              fontSize: '0.95rem',
                              lineHeight: 1.7,
                              whiteSpace: 'pre-line',
                            }}
                          >
                            {content.coverageNote}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Section>
              )}

              {sections.some((s) => s.id === 'intrebari') && (
                <Section id="intrebari" title="Întrebări frecvente" preview={preview}>
                  <Box sx={{ maxWidth: 880, borderTop: '1px solid var(--cs-border)' }}>
                    {content.faq.map((entry, index) => (
                      <Box
                        key={`${entry.question}-${index}`}
                        component="details"
                        sx={{
                          borderBottom: '1px solid var(--cs-border)',
                          '& summary': {
                            listStyle: 'none',
                            py: 2.4,
                            px: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            cursor: 'pointer',
                            fontWeight: 900,
                            fontSize: '1rem',
                          },
                          '& summary::-webkit-details-marker': { display: 'none' },
                          '& summary::after': {
                            content: '"+"',
                            fontSize: '1.5rem',
                            fontWeight: 500,
                            lineHeight: 1,
                            color: 'var(--cs-accent)',
                          },
                          '&[open] summary::after': { content: '"−"' },
                        }}
                      >
                        <summary>{entry.question}</summary>
                        <Typography
                          sx={{
                            color: 'var(--cs-text-muted)',
                            fontSize: '0.94rem',
                            lineHeight: 1.75,
                            whiteSpace: 'pre-line',
                            px: 0.5,
                            pb: 2.6,
                            pr: 4,
                          }}
                        >
                          {entry.answer}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Section>
              )}

              {sections.some((s) => s.id === 'locatie') && (
                <Section id="locatie" title="Unde ne găsiți" preview={preview}>
                  <PickupBlock company={company} accent={theme.accent} preview={preview} />
                </Section>
              )}

              <Section id="contact" title="Contact" preview={preview}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: '21px',
                    bgcolor: 'var(--cs-accent-soft)',
                    [MEDIUM]: { p: 5 },
                  }}
                >
                  {hasContact || company.location || company.website ? (
                    <Stack spacing={3}>
                      <Stack spacing={1.6}>
                        {company.location && (
                          <ContactLine icon={LocationOnRoundedIcon}>{company.location}</ContactLine>
                        )}
                        {company.website && (
                          <ContactLine icon={LanguageRoundedIcon}>
                            <Box
                              component="a"
                              href={normalizeUrl(company.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ color: 'var(--cs-accent)', textDecoration: 'none' }}
                            >
                              {company.website}
                            </Box>
                          </ContactLine>
                        )}
                      </Stack>
                      {hasContact && <ContactButtons company={company} />}
                    </Stack>
                  ) : (
                    <Typography sx={{ color: 'var(--cs-text-muted)' }}>
                      Firma nu a făcut publice date de contact. Poți trimite o cerere direct de pe anunțul
                      mașinii care te interesează.
                    </Typography>
                  )}
                </Box>
              </Section>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

/**
 * Antetul: textul firmei într-un panou, fotografia în celălalt.
 *
 * Fără cover, fotografia e prima mașină din flotă — o pagină de flotă care arată o mașină spune
 * mai mult decât un dreptunghi gri care așteaptă un upload. Fără niciuna, panoul de text ocupă
 * tot rândul.
 */
function Hero({ company, preview }: { company: PublicCompany; preview: boolean }) {
  const theme = normalizeTheme(company.theme)
  const firstCar = company.cars.find((car) => car.images.length > 0)
  // Calea vine relativă de la API; fără origine, fundalul s-ar cere de la adresa paginii.
  const photo = uploadUrl(company.coverImageUrl ?? firstCar?.images[0]?.imageUrl)
  const hasPhoto = photo.length > 0
  const photoCaption = company.coverImageUrl ? null : firstCar ? `${firstCar.brand} ${firstCar.model}, ${firstCar.year}` : null

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 2,
        [XWIDE]: { gridTemplateColumns: hasPhoto ? '1.04fr 0.96fr' : '1fr' },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '21px',
          bgcolor: 'var(--cs-accent-soft)',
          px: 3,
          py: 4.5,
          minHeight: preview ? 300 : 360,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          [MEDIUM]: { px: 6, py: 6, minHeight: preview ? 340 : 440 },
        }}
      >
        <Stack direction="row" spacing={1.6} sx={{ alignItems: 'center', mb: 3 }}>
          <OwnerAvatar
            name={company.legalName}
            logoUrl={company.logoUrl}
            size={52}
            sx={{
              border: '3px solid var(--cs-bg)',
              boxShadow: TOKENS.shadow.md,
              // Inițialele iau culoarea firmei, nu pe cea a platformei: altfel o pastilă albastră
              // rămâne în mijlocul unui antet verde, la fiecare flotă care n-a urcat încă un logo.
              ...(company.logoUrl ? {} : { bgcolor: 'var(--cs-accent)', color: 'var(--cs-button-text)' }),
            }}
          />
          {company.location && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 22, height: 2, bgcolor: 'var(--cs-accent)' }} />
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--cs-accent)',
                }}
              >
                {company.location}
              </Typography>
            </Stack>
          )}
        </Stack>

        <Typography
          component="h1"
          sx={{
            fontSize: 'clamp(2.1rem, 4.6cqi, 4.1rem)',
            fontWeight: 900,
            lineHeight: 1.06,
            letterSpacing: '-0.045em',
            color: 'var(--cs-text)',
          }}
        >
          {company.legalName}
          {/* În titlu, nu lângă el: bifa rămâne lipită de ultimul cuvânt când numele trece pe două rânduri. */}
          {company.isVerified && (
            <VerifiedRoundedIcon
              titleAccess="Flotă verificată RIDElance"
              sx={{ fontSize: '0.5em', ml: '0.25em', verticalAlign: 'middle', color: 'var(--cs-accent)' }}
            />
          )}
        </Typography>

        {company.tagline && (
          <Typography
            sx={{
              mt: 2.2,
              fontSize: { xs: '1rem', md: '1.08rem' },
              fontWeight: 600,
              lineHeight: 1.7,
              maxWidth: 520,
              color: 'var(--cs-text-muted)',
            }}
          >
            {company.tagline}
          </Typography>
        )}

        <Stack direction="row" spacing={1.2} sx={{ mt: 3.5, flexWrap: 'wrap', rowGap: 1.2 }}>
          <Button
            component={preview ? 'span' : 'a'}
            href={preview ? undefined : '#sectiune-flota'}
            variant="contained"
            disableElevation
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              px: 2.6,
              py: 1.4,
              borderRadius: `${TOKENS.radius.lg}px`,
              bgcolor: 'var(--cs-text)',
              color: 'var(--cs-bg)',
              '&:hover': { bgcolor: 'var(--cs-text)', filter: 'brightness(1.15)' },
            }}
          >
            Vezi mașinile
          </Button>
          <Button
            component={preview ? 'span' : 'a'}
            href={preview ? undefined : '#sectiune-contact'}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              px: 2.6,
              py: 1.4,
              borderRadius: `${TOKENS.radius.lg}px`,
              bgcolor: 'var(--cs-bg)',
              color: 'var(--cs-text)',
              '&:hover': { bgcolor: 'var(--cs-bg)', filter: 'brightness(0.97)' },
            }}
          >
            Contact
          </Button>
        </Stack>

        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: -105,
            bottom: -115,
            width: 260,
            height: 260,
            borderRadius: '50%',
            border: '35px solid var(--cs-accent-soft)',
            pointerEvents: 'none',
          }}
        />
      </Box>

      {hasPhoto && (
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '21px',
            minHeight: preview ? 240 : 300,
            bgcolor: 'var(--cs-hero-overlay)',
            backgroundImage: `url(${photo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(0deg, ${withAlpha(theme.heroOverlay, Math.max(theme.heroOverlayOpacity, 40) / 100)}, transparent 55%)`,
            }}
          />
          {company.isVerified && (
            <Box
              sx={{
                position: 'absolute',
                top: 20,
                left: 20,
                px: 1.6,
                py: 0.9,
                borderRadius: `${TOKENS.radius.full}px`,
                bgcolor: 'rgba(255,255,255,0.93)',
                color: TOKENS.ink,
                fontSize: '0.72rem',
                fontWeight: 900,
              }}
            >
              Partener verificat RIDElance
            </Box>
          )}
          {photoCaption && (
            <Typography
              sx={{
                position: 'absolute',
                left: 28,
                right: 28,
                bottom: 26,
                color: '#FFFFFF',
                fontSize: '1.4rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
              }}
            >
              {photoCaption}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

/**
 * Meniul vertical, pe ecran lat.
 *
 * Lipit sub bara RIDElance cât se derulează pagina. Jos stă semnătura platformei, în culorile
 * ei, nu ale firmei: e singurul loc din pagină care spune unde te afli. O flotă cu fundal negru și
 * accent roșu poate face pagina să arate ca site-ul ei — dar nu și ca un site care nu are nicio
 * legătură cu noi.
 */
function SectionRail({
  company,
  sections,
  active,
  preview,
}: {
  company: PublicCompany
  sections: { id: SectionId; label: string }[]
  active: SectionId | null
  preview: boolean
}) {
  const top = preview ? 0 : APP_BAR.md

  return (
    <Box
      component="nav"
      aria-label="Secțiunile paginii"
      sx={{
        position: 'sticky',
        top,
        height: preview ? 'auto' : `calc(100vh - ${top}px)`,
        minHeight: preview ? 480 : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.6,
        px: 1.6,
        pt: 4,
        pb: 3,
        borderRight: '1px solid var(--cs-border)',
        bgcolor: 'var(--cs-bg)',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
      }}
    >
      <Typography
        sx={{
          px: 1.8,
          pb: 1.6,
          fontSize: '0.66rem',
          fontWeight: 900,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--cs-text-subtle)',
        }}
      >
        Explorează flota
      </Typography>

      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.id]
        const isActive = active === section.id
        return (
          <Box
            key={section.id}
            component={preview ? 'span' : 'a'}
            href={preview ? undefined : `#sectiune-${section.id}`}
            aria-current={isActive ? 'location' : undefined}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              minHeight: 45,
              px: 1.6,
              borderRadius: '11px',
              fontSize: '0.85rem',
              fontWeight: 800,
              textDecoration: 'none',
              cursor: preview ? 'default' : 'pointer',
              color: isActive ? 'var(--cs-text)' : 'var(--cs-text-muted)',
              bgcolor: isActive ? 'var(--cs-accent-soft)' : 'transparent',
              transition: `background-color ${TOKENS.duration} ${TOKENS.easing}, color ${TOKENS.duration} ${TOKENS.easing}`,
              '& svg': { fontSize: 18, color: isActive ? 'var(--cs-accent)' : 'var(--cs-text-subtle)' },
              '&:hover': preview
                ? undefined
                : { color: 'var(--cs-text)', bgcolor: 'var(--cs-accent-soft)', '& svg': { color: 'var(--cs-accent)' } },
            }}
          >
            <Icon />
            {section.label}
          </Box>
        )
      })}

      {company.cars.some(hasCarPin) && (
        <Box
          component={preview ? 'span' : 'a'}
          href={preview ? undefined : '#harta-flotei'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            minHeight: 45,
            mt: 1,
            pt: 1,
            px: 1.6,
            borderTop: '1px solid var(--cs-border)',
            fontSize: '0.85rem',
            fontWeight: 800,
            textDecoration: 'none',
            color: 'var(--cs-text-muted)',
            '& svg': { fontSize: 18, color: 'var(--cs-text-subtle)' },
            '&:hover': preview ? undefined : { color: 'var(--cs-text)', '& svg': { color: 'var(--cs-accent)' } },
          }}
        >
          <MapRoundedIcon />
          Hartă
        </Box>
      )}

      <Box sx={{ mt: 'auto', pt: 3, px: 1.4 }}>
        <Box
          sx={{
            p: 1.6,
            borderRadius: `${TOKENS.radius.lg}px`,
            bgcolor: TOKENS.paper,
            border: `1px solid ${TOKENS.border}`,
            color: TOKENS.ink,
          }}
        >
          <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontSize: '0.76rem', fontWeight: 800 }}>Flotă pe RIDElance</Typography>
            {company.isVerified && (
              <VerifiedRoundedIcon titleAccess="Verificată" sx={{ fontSize: 15, color: TOKENS.primaryStrong }} />
            )}
          </Stack>
          {preview ? (
            <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: TOKENS.primaryStrong }}>
              Vezi toate mașinile
            </Typography>
          ) : (
            <Box
              component={RouterLink}
              to="/masini"
              sx={{ fontSize: '0.76rem', fontWeight: 700, color: TOKENS.primaryStrong, textDecoration: 'none' }}
            >
              Vezi toate mașinile
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

/** Meniul pe ecran îngust: banda orizontală lipită sub bara RIDElance. */
function SectionStrip({
  sections,
  active,
  preview,
}: {
  sections: { id: SectionId; label: string }[]
  active: SectionId | null
  preview: boolean
}) {
  return (
    <Box
      sx={{
        // `html` are deja `scroll-behavior: smooth`, deci ancorele derulează lin fără cod.
        position: preview ? 'static' : 'sticky',
        top: preview ? undefined : APP_BAR,
        zIndex: 2,
        bgcolor: 'var(--cs-bg)',
        borderBottom: '1px solid var(--cs-border)',
      }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          minHeight: SECTION_NAV,
          px: 1.5,
          alignItems: 'center',
          // Pe telefon secțiunile nu încap; se derulează lateral, nu se înghesuie pe două rânduri.
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {sections.map((section) => {
          const isActive = active === section.id
          return (
            <Box
              key={section.id}
              component={preview ? 'span' : 'a'}
              href={preview ? undefined : `#sectiune-${section.id}`}
              sx={{
                flexShrink: 0,
                px: 1.6,
                py: 0.9,
                borderRadius: `${TOKENS.radius.full}px`,
                fontSize: '0.86rem',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                cursor: preview ? 'default' : 'pointer',
                color: isActive ? 'var(--cs-accent)' : 'var(--cs-text-muted)',
                bgcolor: isActive ? 'var(--cs-accent-soft)' : 'transparent',
                transition: `background-color ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': { bgcolor: preview ? 'transparent' : 'var(--cs-accent-soft)' },
              }}
            >
              {section.label}
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}

type SortKey = 'recomandate' | 'pret-crescator' | 'pret-descrescator' | 'an'

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'recomandate', label: 'Recomandate' },
  { id: 'pret-crescator', label: 'Preț crescător' },
  { id: 'pret-descrescator', label: 'Preț descrescător' },
  { id: 'an', label: 'An fabricație' },
]

function hasCarPin(car: Car): boolean {
  return car.details?.latitude != null && car.details?.longitude != null
}

/**
 * Catalogul flotei: filtre, carduri și harta cu prețuri alături.
 *
 * Filtrele apar doar când au ce despărți — o flotă numai cu benzină n-are nevoie de un buton
 * „Benzină" care arată exact aceeași listă. Harta apare doar dacă măcar o mașină are pin; o hartă
 * goală centrată pe București ar fi fost o informație inventată.
 */
function FleetCatalogue({ company, preview }: { company: PublicCompany; preview: boolean }) {
  const [engine, setEngine] = useState<string>('toate')
  const [sort, setSort] = useState<SortKey>('recomandate')
  const [activeCarId, setActiveCarId] = useState<string | null>(null)

  const engines = useMemo(
    () => [...new Set(company.cars.map((car) => car.engine).filter(Boolean))],
    [company.cars],
  )

  const cars = useMemo(() => {
    const list = company.cars.filter((car) => engine === 'toate' || car.engine === engine)
    if (sort === 'pret-crescator') return [...list].sort((a, b) => a.pricePerWeek - b.pricePerWeek)
    if (sort === 'pret-descrescator') return [...list].sort((a, b) => b.pricePerWeek - a.pricePerWeek)
    if (sort === 'an') return [...list].sort((a, b) => b.year - a.year)
    return list
  }, [company.cars, engine, sort])

  const mapPoints = useMemo<FleetMapPoint[]>(
    () =>
      cars.filter(hasCarPin).map((car) => ({
        id: car.id,
        slug: car.slug,
        latitude: car.details!.latitude!,
        longitude: car.details!.longitude!,
        title: `${car.brand} ${car.model}, ${car.year}`,
        pricePerWeek: car.pricePerWeek,
        oldPrice: hasActiveDiscount(car) ? car.oldPrice : undefined,
        imageUrl: car.images[0]?.imageUrl,
        specs: [car.location, car.engine, car.transmission].filter(Boolean).slice(0, 3),
        statusLabel: formatCarStatus(car.status),
        available: car.status === 'Available',
      })),
    [cars],
  )

  if (company.cars.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          borderRadius: `${TOKENS.radius.xl}px`,
          border: '1px dashed var(--cs-border)',
          bgcolor: 'var(--cs-surface)',
        }}
      >
        <Typography sx={{ color: 'var(--cs-text-muted)' }}>
          {preview
            ? 'Aici apar mașinile publicate ale flotei.'
            : 'Firma nu are anunțuri active acum. Revino mai târziu.'}
        </Typography>
      </Box>
    )
  }

  // Harta are nevoie de cel puțin o mașină cu pin în flota întreagă, nu în filtrul curent: altfel
  // coloana ar apărea și ar dispărea la fiecare apăsare pe un filtru.
  const showMap = company.cars.some(hasCarPin)
  const filterOptions = ['toate', ...engines]

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ mb: 2.2, gap: 1.5, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}
      >
        {engines.length > 1 ? (
          <Box
            role="group"
            aria-label="Motorizare"
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.6,
              p: 0.6,
              borderRadius: `${TOKENS.radius.lg}px`,
              bgcolor: 'var(--cs-surface)',
              border: '1px solid var(--cs-border)',
            }}
          >
            {filterOptions.map((option) => {
              const selected = engine === option
              return (
                <Box
                  key={option}
                  component="button"
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setEngine(option)}
                  sx={{
                    border: 0,
                    cursor: 'pointer',
                    font: 'inherit',
                    px: 1.6,
                    py: 1,
                    borderRadius: '9px',
                    fontSize: '0.78rem',
                    fontWeight: 850,
                    whiteSpace: 'nowrap',
                    color: selected ? 'var(--cs-text)' : 'var(--cs-text-muted)',
                    bgcolor: selected ? 'var(--cs-bg)' : 'transparent',
                    boxShadow: selected ? TOKENS.shadow.md : 'none',
                  }}
                >
                  {option === 'toate' ? 'Toate mașinile' : option}
                </Box>
              )
            })}
          </Box>
        ) : (
          <Box />
        )}

        {company.cars.length > 1 && (
          <TextField
            select
            size="small"
            label="Sortare"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            sx={{
              minWidth: 180,
              '& .MuiInputBase-root': {
                borderRadius: `${TOKENS.radius.lg}px`,
                bgcolor: 'var(--cs-bg)',
                color: 'var(--cs-text)',
                fontWeight: 800,
                fontSize: '0.85rem',
              },
              '& .MuiInputLabel-root': { color: 'var(--cs-text-muted)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--cs-border)' },
              '& .MuiSvgIcon-root': { color: 'var(--cs-text-muted)' },
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 2.5,
          alignItems: 'start',
          [XWIDE]: showMap ? { gridTemplateColumns: 'minmax(0, 1.08fr) minmax(380px, 0.92fr)' } : {},
        }}
      >
        {cars.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: `${TOKENS.radius.xl}px`,
              border: '1px dashed var(--cs-border)',
            }}
          >
            <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Nicio mașină cu acest filtru</Typography>
            <Button
              onClick={() => setEngine('toate')}
              sx={{ textTransform: 'none', fontWeight: 800, color: 'var(--cs-accent)' }}
            >
              Toate mașinile
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 2,
              // Cardurile sunt ale platformei și rămân în culorile ei: dincolo de ele începe
              // fluxul RIDElance de contactare, nu pagina firmei.
              color: TOKENS.ink,
              [MEDIUM]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
              ...(showMap ? {} : { [XWIDE]: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' } }),
            }}
          >
            {cars.map((car) => (
              <Box
                key={car.id}
                // Trecerea peste card ridică pinul corespunzător: legătura dintre listă și hartă e
                // ce face alăturarea lor utilă.
                onMouseEnter={() => setActiveCarId(car.id)}
                onMouseLeave={() => setActiveCarId(null)}
              >
                <CarListCard car={car} companySlug={company.slug} />
              </Box>
            ))}
          </Box>
        )}

        {showMap && (
          <Box
            id="harta-flotei"
            sx={{
              scrollMarginTop: preview ? 0 : APP_BAR.md + 16,
              height: preview ? 360 : 460,
              borderRadius: '18px',
              overflow: 'hidden',
              border: '1px solid var(--cs-border)',
              boxShadow: `0 12px 45px ${alpha(TOKENS.ink, 0.08)}`,
              [XWIDE]: preview
                ? {}
                : { position: 'sticky', top: APP_BAR.md + 24, height: `calc(100vh - ${APP_BAR.md + 48}px)`, maxHeight: 720 },
            }}
          >
            <FleetMap points={mapPoints} activeId={activeCarId} onSelect={setActiveCarId} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

function Section({
  id,
  title,
  preview,
  children,
}: {
  id: SectionId
  title: string
  preview: boolean
  children: React.ReactNode
}) {
  return (
    <Box
      id={`sectiune-${id}`}
      component="section"
      sx={{
        // Pe telefon, cât bara RIDElance plus banda de secțiuni; pe lat, doar bara.
        scrollMarginTop: preview
          ? 0
          : { xs: APP_BAR.xs + SECTION_NAV.xs + 16, md: APP_BAR.md + SECTION_NAV.md + 16 },
        [WIDE]: preview ? {} : { scrollMarginTop: `${APP_BAR.md + 24}px` },
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: 'clamp(1.6rem, 3cqi, 2.6rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.13,
          mb: 3,
          color: 'var(--cs-text)',
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  )
}

function ContactLine({ icon: Icon, children }: { icon: typeof PhoneRoundedIcon; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'var(--cs-bg)',
        }}
      >
        <Icon sx={{ fontSize: 19, color: 'var(--cs-accent)' }} />
      </Box>
      <Typography component="div" sx={{ fontWeight: 800, fontSize: '0.98rem', minWidth: 0, overflowWrap: 'anywhere' }}>
        {children}
      </Typography>
    </Stack>
  )
}

function ContactButtons({ company }: { company: PublicCompany }) {
  const filled = {
    textTransform: 'none' as const,
    fontWeight: 800,
    borderRadius: `${TOKENS.radius.lg}px`,
    bgcolor: 'var(--cs-accent)',
    color: 'var(--cs-button-text)',
    boxShadow: 'none',
    '&:hover': { bgcolor: 'var(--cs-accent)', filter: 'brightness(0.94)', boxShadow: 'none' },
  }

  const outlined = {
    textTransform: 'none' as const,
    fontWeight: 700,
    borderRadius: `${TOKENS.radius.lg}px`,
    color: 'var(--cs-text)',
    borderColor: 'var(--cs-border)',
    '&:hover': { borderColor: 'var(--cs-accent)', bgcolor: 'var(--cs-accent-soft)' },
  }

  return (
    <Stack direction="row" spacing={1.2} sx={{ flexWrap: 'wrap', rowGap: 1.2 }}>
      {company.whatsAppEnabled && company.phone && (
        <Button
          variant="contained"
          disableElevation
          startIcon={<WhatsAppIcon />}
          href={`https://wa.me/${company.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener"
          sx={filled}
        >
          WhatsApp
        </Button>
      )}
      {company.phone && (
        <Button
          variant="outlined"
          startIcon={<PhoneRoundedIcon />}
          href={`tel:${company.phone.replace(/\s/g, '')}`}
          sx={outlined}
        >
          {company.phone}
        </Button>
      )}
      {company.email && (
        <Button
          variant="outlined"
          startIcon={<EmailRoundedIcon />}
          href={`mailto:${company.email}`}
          sx={outlined}
        >
          {company.email}
        </Button>
      )}
    </Stack>
  )
}

/**
 * Adresa firmei, cu harta lângă ea.
 *
 * Harta e ilustrația unei adrese, nu o unealtă de navigat: butonul „Deschide în hărți" stă sub
 * ea, fiindcă nimeni nu conduce după o hartă încastrată într-o pagină — o deschide în aplicația
 * pe care o are deja pe telefon.
 *
 * Fără pin nu dispare secțiunea: rămân adresa și indicația scrise de om. „București, Sector 3"
 * e tot un răspuns la întrebarea din titlu.
 */
function PickupBlock({
  company,
  accent,
  preview,
}: {
  company: PublicCompany
  accent: string
  preview: boolean
}) {
  const { pickup } = company
  const pinned = hasPin(pickup)

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: pinned ? '1fr 1fr' : '1fr' },
        gap: { xs: 2.5, md: 3.5 },
        alignItems: 'start',
      }}
    >
      <Stack spacing={2}>
        {pickup.address && (
          <Stack direction="row" spacing={1.2} sx={{ alignItems: 'flex-start' }}>
            <LocationOnRoundedIcon sx={{ fontSize: 20, color: 'var(--cs-accent)', mt: '2px' }} />
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.5 }}>
              {pickup.address}
            </Typography>
          </Stack>
        )}

        {pickup.note && (
          <Typography
            sx={{
              color: 'var(--cs-text-muted)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
            }}
          >
            {pickup.note}
          </Typography>
        )}

        {pinned && !preview && (
          <Box>
            <Button
              variant="outlined"
              startIcon={<DirectionsRoundedIcon />}
              href={directionsUrl(pickup.latitude!, pickup.longitude!)}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: `${TOKENS.radius.lg}px`,
                color: 'var(--cs-text)',
                borderColor: 'var(--cs-border)',
                '&:hover': { borderColor: 'var(--cs-accent)', bgcolor: 'var(--cs-accent-soft)' },
              }}
            >
              Deschide în hărți
            </Button>
          </Box>
        )}
      </Stack>

      {pinned && (
        <Box
          sx={{
            borderRadius: `${TOKENS.radius.xl}px`,
            overflow: 'hidden',
            border: '1px solid var(--cs-border)',
          }}
        >
          <PlaceMap
            latitude={pickup.latitude!}
            longitude={pickup.longitude!}
            accent={accent}
            height={preview ? 200 : 300}
            // În previzualizare harta stă locului: panoul de editor se derulează, iar o hartă
            // care prinde rotița sub cursor ar fi blocat derularea paginii.
            interactive={!preview}
          />
        </Box>
      )}
    </Box>
  )
}

/**
 * Link către aplicația de hărți a dispozitivului.
 *
 * `google.com/maps/search/?api=1&query=` e forma pe care Android o predă aplicației Google Maps,
 * iOS o deschide în Apple Maps prin redirecționare, iar un desktop o arată în browser. Un link
 * `geo:` ar fi fost mai curat, dar nu face nimic pe desktop.
 */
function directionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}

/** Un website scris „firma.ro" e tot un website; fără schemă, browserul l-ar lua ca rută internă. */
function normalizeUrl(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`
}

export default CompanySite
