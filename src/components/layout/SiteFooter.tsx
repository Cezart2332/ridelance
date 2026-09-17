import { useState, type FormEvent } from 'react'
import { Box, Button, Checkbox, Container, IconButton, InputBase, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import { FaFacebookF, FaInstagram } from 'react-icons/fa'
import { TOKENS } from '../../constants/tokens'
import { navItems } from '../../data/constants'
import { LOGO_WITH_MOTTO_ON_DARK } from '../../constants/brandLogo'
import appStoreBadge from '../../assets/appstore.webp'
import googlePlayBadge from '../../assets/googleplay.png'
import anpcSal from '../../assets/sal.jpg'
import anpcSol from '../../assets/sol.jpg'

const CONTACT_EMAIL = 'contact@ridelance.ro'

// Linkurile din magazine, când aplicația e publicată. Cât sunt goale, insignele apar fără link.
const APP_STORE_URL = ''
const GOOGLE_PLAY_URL = ''

const ANPC_SAL_URL = 'https://anpc.ro/ce-este-sal/'
const ANPC_SOL_URL = 'https://ec.europa.eu/consumers/odr'

const FOOTER_BG = '#10101d'

const legalLinks = [
  { label: 'Termeni și condiții', path: '/termeni-si-conditii' },
  { label: 'Politica de confidențialitate', path: '/privacy-policy' },
  { label: 'Politica de cookies', path: '/politica-cookies' },
  { label: 'Politica de plăți și abonamente', path: '/politica-plati-abonamente' },
]

const socialLinks = [
  { label: 'Facebook RIDElance', href: 'https://www.facebook.com/profile.php?id=61589705146000', icon: <FaFacebookF size={16} /> },
  { label: 'Instagram RIDElance', href: 'https://www.instagram.com/ridelance/', icon: <FaInstagram size={17} /> },
]

const columnTitleSx = {
  color: '#fff',
  fontSize: '1.2rem',
  fontWeight: 800,
  letterSpacing: '-0.01em',
  mb: { xs: 2, md: 3 },
}

const footerLinkSx = {
  p: 0,
  minWidth: 'unset',
  justifyContent: 'flex-start',
  color: alpha('#fff', 0.72),
  fontWeight: 500,
  fontSize: '0.95rem',
  lineHeight: 1.4,
  textTransform: 'none',
  transition: `color 0.2s ease, transform 0.2s ${TOKENS.easing}`,
  '&:hover': {
    color: TOKENS.primary,
    backgroundColor: 'transparent',
    transform: 'translateX(3px)',
  },
}

function NewsletterBand() {
  const [email, setEmail] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Introdu o adresă de email validă.')
      return
    }
    if (!accepted) {
      setError('Bifează acordul cu politica de confidențialitate.')
      return
    }
    setError(null)
    // Nu există încă un endpoint de newsletter: cererea pleacă pe email, către echipă.
    const subject = encodeURIComponent('Abonare newsletter RIDElance')
    const body = encodeURIComponent(`Vreau să mă abonez la newsletter cu adresa: ${email.trim()}`)
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 5, md: 6 },
        // Pornește din fundalul paginii și se colorează abia spre dreapta, ca trecerea de pe
        // conținutul alb să nu fie un bloc albastru pus direct dedesubt.
        background: `linear-gradient(180deg, ${TOKENS.surface} 0%, transparent 60%), linear-gradient(110deg, ${TOKENS.surfaceAlt} 0%, #E4F5FC 55%, #D3EFFB 100%)`,
        borderTop: `1px solid ${alpha(TOKENS.primary, 0.14)}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${alpha(TOKENS.primaryStrong, 0.22)} 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
          maskImage: 'linear-gradient(90deg, transparent 20%, #000 85%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr minmax(360px, 520px)' },
            gap: { xs: 3, md: 6 },
            alignItems: 'center',
          }}
        >
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography
              component="h2"
              sx={{
                color: TOKENS.ink,
                fontWeight: 900,
                fontSize: { xs: '1.7rem', md: '2.3rem' },
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
            >
              Abonează-te la newsletter
            </Typography>
            <Typography sx={{ mt: 1, color: alpha(TOKENS.ink, 0.78), fontWeight: 500, fontSize: '1rem' }}>
              Noutăți fiscale, oferte de la parteneri și ghiduri pentru șoferi, direct în inbox.
            </Typography>
          </Box>

          <Box component="form" noValidate onSubmit={onSubmit}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
                p: 0.75,
                borderRadius: `${TOKENS.radius.lg}px`,
                backgroundColor: '#fff',
                border: `1px solid ${alpha(TOKENS.primary, 0.25)}`,
                boxShadow: '0 8px 24px rgba(69,184,226,0.12)',
              }}
            >
              <InputBase
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresa ta de email"
                inputProps={{ 'aria-label': 'Adresa de email' }}
                sx={{
                  flex: 1,
                  px: 2,
                  py: { xs: 1, sm: 0 },
                  color: TOKENS.ink,
                  fontSize: '0.98rem',
                  fontWeight: 500,
                }}
              />
              <Button
                type="submit"
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  px: 3,
                  py: 1.35,
                  borderRadius: `${TOKENS.radius.md}px`,
                  backgroundColor: FOOTER_BG,
                  color: '#fff',
                  fontWeight: 800,
                  textTransform: 'none',
                  fontSize: '0.98rem',
                  boxShadow: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': { backgroundColor: TOKENS.ink, boxShadow: 'none' },
                }}
              >
                Abonează-te
              </Button>
            </Box>

            <Stack
              direction="row"
              sx={{ mt: 1.25, alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' } }}
            >
              <Checkbox
                size="small"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                slotProps={{ input: { 'aria-label': 'Accept politica de confidențialitate' } }}
                icon={<Box sx={{ width: 18, height: 18, borderRadius: '4px', border: `1.5px solid ${alpha(TOKENS.ink, 0.55)}`, backgroundColor: alpha('#fff', 0.6) }} />}
                checkedIcon={
                  <Box sx={{ width: 18, height: 18, borderRadius: '4px', backgroundColor: FOOTER_BG, color: '#fff', display: 'grid', placeItems: 'center' }}>
                    <CheckRoundedIcon sx={{ fontSize: 14 }} />
                  </Box>
                }
                sx={{ p: 0.5, ml: -0.5 }}
              />
              <Typography sx={{ color: alpha(TOKENS.ink, 0.82), fontSize: '0.88rem', fontWeight: 500 }}>
                Prin abonare, accepți{' '}
                <Box
                  component="a"
                  href="/privacy-policy"
                  sx={{ color: TOKENS.ink, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2 }}
                >
                  politica de confidențialitate
                </Box>
              </Typography>
            </Stack>
            {error && (
              <Typography role="alert" sx={{ mt: 0.5, color: '#8a1c1c', fontSize: '0.85rem', fontWeight: 700, textAlign: { xs: 'center', md: 'left' } }}>
                {error}
              </Typography>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

type Crop = { imgW: number; imgH: number; x: number; y: number; w: number; h: number }

// Fișierele insignelor au margini albe (și o tablă de șah „coaptă" în App Store). Afișăm doar
// dreptunghiul negru al insignei, măsurat în pixelii imaginii originale.
const APP_STORE_CROP: Crop = { imgW: 400, imgH: 180, x: 31, y: 31, w: 338, h: 99 }
const GOOGLE_PLAY_CROP: Crop = { imgW: 646, imgH: 249, x: 47, y: 47, w: 552, h: 155 }

const BADGE_HEIGHT = 44

function StoreBadge({ src, alt, href, crop }: { src: string; alt: string; href: string; crop: Crop }) {
  const scale = BADGE_HEIGHT / crop.h
  const frameSx = {
    position: 'relative',
    display: 'block',
    width: Math.round(crop.w * scale),
    height: BADGE_HEIGHT,
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#000',
    border: `1px solid ${alpha('#fff', 0.28)}`,
    boxSizing: 'content-box',
    transition: `transform 0.2s ${TOKENS.easing}, border-color 0.2s ease`,
  } as const
  const img = (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        position: 'absolute',
        maxWidth: 'none',
        width: crop.imgW * scale,
        height: crop.imgH * scale,
        left: -crop.x * scale,
        top: -crop.y * scale,
      }}
    />
  )
  if (!href) return <Box sx={frameSx}>{img}</Box>
  return (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ ...frameSx, '&:hover': { transform: 'translateY(-2px)', borderColor: alpha('#fff', 0.6) } }}
    >
      {img}
    </Box>
  )
}

export function SiteFooter() {
  const navigate = useNavigate()

  return (
    <Box component="footer">
      <NewsletterBand />

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          background: `linear-gradient(180deg, #202638 0%, ${FOOTER_BG} 100%)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 520,
            height: 520,
            right: -160,
            bottom: -220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(TOKENS.primary, 0.14)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', pt: { xs: 6, md: 9 }, pb: { xs: 4, md: 6 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.5fr 1fr 1.1fr 1.3fr' },
              gap: { xs: 5, md: 6 },
            }}
          >
            {/* Brand */}
            <Box sx={{ gridColumn: { sm: '1 / -1', md: 'auto' } }}>
              <Box
                component="img"
                src={LOGO_WITH_MOTTO_ON_DARK}
                alt="RIDElance — Independent. Dar nu singur."
                sx={{ width: 240, maxWidth: '100%', height: 'auto', display: 'block' }}
              />
              <Typography sx={{ mt: 3, maxWidth: 340, color: alpha('#fff', 0.72), fontSize: '0.95rem', lineHeight: 1.7 }}>
                Platforma care îi ajută pe șoferii de ridesharing să-și gestioneze firma, taxele și mașina, fără
                bătăi de cap.
              </Typography>
              <Stack direction="row" spacing={1.25} sx={{ mt: 3 }}>
                {socialLinks.map((s) => (
                  <IconButton
                    key={s.href}
                    component="a"
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    sx={{
                      width: 42,
                      height: 42,
                      color: '#fff',
                      border: `1px solid ${alpha('#fff', 0.35)}`,
                      transition: `all 0.2s ${TOKENS.easing}`,
                      '&:hover': {
                        color: FOOTER_BG,
                        backgroundColor: TOKENS.primary,
                        borderColor: TOKENS.primary,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {s.icon}
                  </IconButton>
                ))}
              </Stack>
            </Box>

            {/* Link-uri rapide */}
            <Box>
              <Typography component="h3" sx={columnTitleSx}>
                Link-uri rapide
              </Typography>
              <Stack spacing={1.6} sx={{ alignItems: 'flex-start' }}>
                {navItems.map((item) => (
                  <Button key={item.path} onClick={() => navigate(item.path)} sx={footerLinkSx}>
                    {item.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            {/* Legal */}
            <Box>
              <Typography component="h3" sx={columnTitleSx}>
                Legal
              </Typography>
              <Stack spacing={1.6} sx={{ alignItems: 'flex-start' }}>
                {legalLinks.map((item) => (
                  <Button key={item.path} onClick={() => navigate(item.path)} sx={{ ...footerLinkSx, textAlign: 'left' }}>
                    {item.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            {/* Contact + aplicație */}
            <Box>
              <Typography component="h3" sx={columnTitleSx}>
                Contact
              </Typography>
              <Stack
                component="a"
                href={`mailto:${CONTACT_EMAIL}`}
                direction="row"
                spacing={1.75}
                sx={{
                  alignItems: 'center',
                  color: alpha('#fff', 0.85),
                  textDecoration: 'none',
                  '&:hover': { color: '#fff' },
                  '&:hover .footer-contact-icon': { backgroundColor: TOKENS.primary, color: FOOTER_BG, borderColor: TOKENS.primary },
                }}
              >
                <Box
                  className="footer-contact-icon"
                  sx={{
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    border: `1px solid ${alpha('#fff', 0.35)}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <MailOutlineRoundedIcon sx={{ fontSize: 19 }} />
                </Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 500 }}>{CONTACT_EMAIL}</Typography>
              </Stack>

              <Typography sx={{ mt: 4, mb: 1.5, color: alpha('#fff', 0.55), fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Descarcă aplicația
              </Typography>
              <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <StoreBadge src={appStoreBadge} alt="Descarcă din App Store" href={APP_STORE_URL} crop={APP_STORE_CROP} />
                <StoreBadge src={googlePlayBadge} alt="Descarcă din Google Play" href={GOOGLE_PLAY_URL} crop={GOOGLE_PLAY_CROP} />
              </Stack>
            </Box>
          </Box>

          {/* ANPC — SAL / SOL */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mt: { xs: 5, md: 7 }, alignItems: { xs: 'center', sm: 'flex-start' } }}
          >
            {[
              { src: anpcSal, href: ANPC_SAL_URL, alt: 'ANPC — Soluționarea alternativă a litigiilor' },
              { src: anpcSol, href: ANPC_SOL_URL, alt: 'Soluționarea online a litigiilor' },
            ].map((b) => (
              <Box
                key={b.href}
                component="a"
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'block',
                  borderRadius: `${TOKENS.radius.md}px`,
                  overflow: 'hidden',
                  lineHeight: 0,
                  transition: `transform 0.2s ${TOKENS.easing}`,
                  '&:hover': { transform: 'translateY(-2px)' },
                }}
              >
                <Box component="img" src={b.src} alt={b.alt} sx={{ height: 62, width: 'auto', maxWidth: '100%', display: 'block' }} />
              </Box>
            ))}
          </Stack>
        </Container>

        {/* Bara de jos */}
        <Box sx={{ position: 'relative', borderTop: `1px solid ${alpha('#fff', 0.12)}` }}>
          <Container
            maxWidth="lg"
            sx={{
              py: 3,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 1.5,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ color: alpha('#fff', 0.72), fontSize: '0.92rem' }}>
              © 2026{' '}
              <Box component="span" sx={{ color: TOKENS.primary, fontWeight: 700 }}>
                ridelance.ro
              </Box>
              . Toate drepturile rezervate.
            </Typography>
            <Stack direction="row" spacing={3}>
              {[legalLinks[0], legalLinks[1]].map((item) => (
                <Button key={item.path} onClick={() => navigate(item.path)} sx={{ ...footerLinkSx, fontSize: '0.9rem', whiteSpace: 'nowrap', '&:hover': { color: '#fff', backgroundColor: 'transparent' } }}>
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Container>
        </Box>
      </Box>
    </Box>
  )
}
