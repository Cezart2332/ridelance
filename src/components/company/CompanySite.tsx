import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

import CarListCard from '../cars/CarListCard'
import { OwnerAvatar } from '../common/OwnerAvatar'
import { uploadUrl } from '../../lib/api'
import { TOKENS } from '../../constants/tokens'
import type { PublicCompany } from '../../services/company.service'
import { normalizeContent, normalizeTheme, themeVars, withAlpha } from './companyTheme'
import { highlightIcon } from './highlightIcons'
import { visibleSections, type SectionId } from './sections'

/**
 * Mini-site-ul public al unei firme.
 *
 * Un singur component pentru două locuri: pagina publică de la `/{slug}` și previzualizarea din
 * editorul de flotă. Previzualizarea nu are cum să mintă, fiindcă nu e o a doua implementare — e
 * exact ce vede vizitatorul, cu datele nesalvate încă.
 *
 * Tot conținutul e pe o singură pagină. Bara de secțiuni derulează, nu navighează: o flotă cu
 * patru mașini n-are nevoie de cinci rute, iar linkul distribuit trebuie să ducă la tot.
 *
 * Culorile firmei trăiesc într-un set de variabile CSS puse pe containerul de aici. În afara lui
 * — bara RIDElance de sus, subsolul, banda de platformă — nimic nu se tematizează. Pagina e a
 * firmei, dar e găzduită la noi, iar asta trebuie să se vadă fără să scrie nicăieri „găzduit de".
 */

interface CompanySiteProps {
  company: PublicCompany
  /** În editor: fără bară lipită, fără linkuri care navighează. */
  preview?: boolean
}

/** Înălțimea barei RIDElance de sus, ca titlurile să nu ajungă sub ea la scroll. */
const APP_BAR = { xs: 64, md: 72 }
const SECTION_NAV = { xs: 52, md: 56 }

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
        bgcolor: 'var(--cs-bg)',
        color: 'var(--cs-text)',
        // Previzualizarea trăiește într-un panou de dashboard, nu într-o fereastră: fără asta,
        // fundalul firmei s-ar termina la ultima secțiune și ar arăta ca o eroare de randare.
        minHeight: preview ? 'auto' : '100%',
      }}
    >
      <Hero company={company} preview={preview} />

      <PlatformRibbon verified={company.isVerified} preview={preview} />

      {sections.length > 1 && (
        <SectionNav sections={sections} active={active} preview={preview} />
      )}

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Stack spacing={{ xs: 6, md: 9 }}>
          {sections.some((s) => s.id === 'despre') && (
            <Section id="despre" title="Despre noi" preview={preview}>
              <Typography
                sx={{
                  color: 'var(--cs-text-muted)',
                  fontSize: '1.02rem',
                  lineHeight: 1.8,
                  maxWidth: 780,
                  whiteSpace: 'pre-line',
                }}
              >
                {company.publicDescription}
              </Typography>
            </Section>
          )}

          {sections.some((s) => s.id === 'avantaje') && (
            <Section id="avantaje" title="De ce noi" preview={preview}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                  gap: 2,
                }}
              >
                {content.highlights.map((highlight, index) => {
                  const Icon = highlightIcon(highlight.iconKey)
                  return (
                    <Box
                      key={`${highlight.title}-${index}`}
                      sx={{
                        p: 2.4,
                        borderRadius: `${TOKENS.radius.xl}px`,
                        bgcolor: 'var(--cs-surface)',
                        border: '1px solid var(--cs-border)',
                      }}
                    >
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: `${TOKENS.radius.lg}px`,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: 'var(--cs-accent-soft)',
                          mb: 1.6,
                        }}
                      >
                        <Icon sx={{ fontSize: 22, color: 'var(--cs-accent)' }} />
                      </Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '1rem', mb: 0.6 }}>
                        {highlight.title}
                      </Typography>
                      {highlight.text && (
                        <Typography sx={{ color: 'var(--cs-text-muted)', fontSize: '0.9rem', lineHeight: 1.65 }}>
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
            {company.cars.length === 0 ? (
              <Box
                sx={{
                  p: 4,
                  borderRadius: `${TOKENS.radius.xl}px`,
                  border: '1px solid var(--cs-border)',
                  bgcolor: 'var(--cs-surface)',
                }}
              >
                <Typography sx={{ color: 'var(--cs-text-muted)' }}>
                  {preview
                    ? 'Aici apar mașinile publicate ale flotei.'
                    : 'Firma nu are anunțuri active acum. Revino mai târziu.'}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: 3,
                  // Cardurile sunt ale platformei și rămân în culorile ei: dincolo de ele începe
                  // fluxul RIDElance de contactare, nu pagina firmei.
                  color: TOKENS.ink,
                }}
              >
                {company.cars.map((car) => (
                  <CarListCard key={car.id} car={car} companySlug={company.slug} />
                ))}
              </Box>
            )}
          </Section>

          {sections.some((s) => s.id === 'program') && (
            <Section id="program" title="Program și zone de predare" preview={preview}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: content.schedule.length > 0 ? '1fr 1fr' : '1fr' },
                  gap: { xs: 3, md: 4 },
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
                          sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}
                        >
                          <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>{row.day}</Typography>
                          <Typography sx={{ color: 'var(--cs-text-muted)', fontSize: '0.92rem' }}>
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
              <Stack spacing={1.6} sx={{ maxWidth: 820 }}>
                {content.faq.map((entry, index) => (
                  <Box
                    key={`${entry.question}-${index}`}
                    sx={{
                      p: 2.4,
                      borderRadius: `${TOKENS.radius.xl}px`,
                      bgcolor: 'var(--cs-surface)',
                      border: '1px solid var(--cs-border)',
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', mb: 0.8 }}>
                      {entry.question}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'var(--cs-text-muted)',
                        fontSize: '0.93rem',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {entry.answer}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Section>
          )}

          <Section id="contact" title="Contact" preview={preview}>
            {hasContact || company.location || company.website ? (
              <Stack spacing={2.5}>
                {hasContact && <ContactButtons company={company} />}
                <Stack spacing={1}>
                  {company.location && (
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <LocationOnRoundedIcon sx={{ fontSize: 18, color: 'var(--cs-text-subtle)' }} />
                      <Typography sx={{ color: 'var(--cs-text-muted)', fontSize: '0.95rem' }}>
                        {company.location}
                      </Typography>
                    </Stack>
                  )}
                  {company.website && (
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <LanguageRoundedIcon sx={{ fontSize: 18, color: 'var(--cs-text-subtle)' }} />
                      <Box
                        component="a"
                        href={normalizeUrl(company.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: 'var(--cs-accent)', fontSize: '0.95rem', fontWeight: 700 }}
                      >
                        {company.website}
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            ) : (
              <Typography sx={{ color: 'var(--cs-text-muted)' }}>
                Firma nu a făcut publice date de contact. Poți trimite o cerere direct de pe anunțul
                mașinii care te interesează.
              </Typography>
            )}
          </Section>
        </Stack>
      </Container>
    </Box>
  )
}

function Hero({ company, preview }: { company: PublicCompany; preview: boolean }) {
  // Calea vine relativă de la API; fără origine, fundalul s-ar cere de la adresa paginii.
  const cover = uploadUrl(company.coverImageUrl)
  const hasCover = cover.length > 0
  const theme = normalizeTheme(company.theme)

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        // Fără fotografie, antetul rămâne o bandă în culorile firmei — nu un dreptunghi gri care
        // așteaptă un upload care poate nu vine niciodată.
        bgcolor: hasCover ? 'var(--cs-hero-overlay)' : 'var(--cs-surface)',
        backgroundImage: hasCover ? `url(${cover})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderBottom: hasCover ? 'none' : '1px solid var(--cs-border)',
      }}
    >
      {hasCover && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: withAlpha(theme.heroOverlay, theme.heroOverlayOpacity / 100),
          }}
        />
      )}

      <Container
        maxWidth="lg"
        sx={{ position: 'relative', py: { xs: preview ? 5 : 7, md: preview ? 6 : 10 } }}
      >
        <Stack spacing={2.5} sx={{ alignItems: 'flex-start' }}>
          <OwnerAvatar
            name={company.legalName}
            logoUrl={company.logoUrl}
            size={preview ? 64 : 84}
            sx={{
              border: `3px solid ${hasCover ? 'rgba(255,255,255,0.85)' : 'var(--cs-border)'}`,
              boxShadow: TOKENS.shadow.lg,
              // Inițialele iau culoarea firmei, nu pe cea a platformei: altfel o pastilă albastră
              // rămâne în mijlocul unui antet verde, la fiecare flotă care n-a urcat încă un logo.
              ...(company.logoUrl ? {} : { bgcolor: 'var(--cs-accent)', color: 'var(--cs-button-text)' }),
            }}
          />

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: '1.7rem', md: preview ? '2rem' : '2.4rem' },
                  fontWeight: 900,
                  lineHeight: 1.15,
                  // Peste fotografie textul e alb; fără ea, în culoarea aleasă de firmă.
                  color: hasCover ? '#FFFFFF' : 'var(--cs-text)',
                }}
              >
                {company.legalName}
              </Typography>
              {company.isVerified && (
                <VerifiedRoundedIcon
                  titleAccess="Flotă verificată RIDElance"
                  sx={{ fontSize: 26, color: hasCover ? '#FFFFFF' : 'var(--cs-accent)' }}
                />
              )}
            </Stack>

            {company.tagline && (
              <Typography
                sx={{
                  mt: 1,
                  fontSize: { xs: '1rem', md: '1.12rem' },
                  fontWeight: 600,
                  maxWidth: 720,
                  color: hasCover ? 'rgba(255,255,255,0.9)' : 'var(--cs-text-muted)',
                }}
              >
                {company.tagline}
              </Typography>
            )}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

/**
 * Banda de platformă.
 *
 * Deliberat în culorile RIDElance, nu ale firmei: e singurul loc din pagină care spune unde te
 * afli. O flotă cu fundal negru și accent roșu poate face pagina să arate ca site-ul ei — dar nu
 * și ca un site care nu are nicio legătură cu noi.
 */
function PlatformRibbon({ verified, preview }: { verified: boolean; preview: boolean }) {
  return (
    <Box
      sx={{
        bgcolor: TOKENS.paper,
        borderBottom: `1px solid ${TOKENS.border}`,
        color: TOKENS.ink,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction="row"
          spacing={2}
          sx={{
            py: 1.2,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            rowGap: 1,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: TOKENS.textMuted }}>
              Flotă pe RIDElance
            </Typography>
            {verified && (
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  alignItems: 'center',
                  px: 1,
                  py: 0.3,
                  borderRadius: `${TOKENS.radius.full}px`,
                  bgcolor: alpha(TOKENS.primary, 0.14),
                }}
              >
                <VerifiedRoundedIcon sx={{ fontSize: 14, color: TOKENS.primaryStrong }} />
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: TOKENS.primaryStrong }}>
                  Verificată
                </Typography>
              </Stack>
            )}
          </Stack>

          {preview ? (
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: TOKENS.textSubtle }}>
              Vezi toate mașinile
            </Typography>
          ) : (
            <Button
              component={RouterLink}
              to="/masini"
              size="small"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: TOKENS.primaryStrong,
              }}
            >
              Vezi toate mașinile
            </Button>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

function SectionNav({
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
        // Lipită sub bara RIDElance. `html` are deja `scroll-behavior: smooth`, deci ancorele
        // derulează lin fără cod. (Pe Safari sub 16, `overflow-x: clip` cade pe `hidden` și
        // lipirea nu se întâmplă — bara rămâne unde e, ceea ce e o degradare acceptabilă.)
        position: preview ? 'static' : 'sticky',
        top: preview ? undefined : APP_BAR,
        zIndex: 2,
        bgcolor: 'var(--cs-bg)',
        borderBottom: '1px solid var(--cs-border)',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            minHeight: SECTION_NAV,
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
      </Container>
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
        // Cât bara RIDElance plus bara de secțiuni: fără asta, titlul aterizează sub ele.
        scrollMarginTop: preview
          ? 0
          : { xs: APP_BAR.xs + SECTION_NAV.xs + 12, md: APP_BAR.md + SECTION_NAV.md + 12 },
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: { xs: '1.25rem', md: '1.45rem' },
          fontWeight: 900,
          mb: 2.5,
          color: 'var(--cs-text)',
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
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

/** Un website scris „firma.ro" e tot un website; fără schemă, browserul l-ar lua ca rută internă. */
function normalizeUrl(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`
}

export default CompanySite
