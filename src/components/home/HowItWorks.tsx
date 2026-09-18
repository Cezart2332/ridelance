import { useState, type ReactNode } from 'react'
import { Box, ButtonBase, Collapse, Container, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { TOKENS } from '../../constants/tokens'
import stepStart from '../../assets/Stickers/scene 1.png'
import stepVerify from '../../assets/Stickers/scene 9.png'
import stepActivate from '../../assets/Stickers/scene 2.png'
import stepBenefits from '../../assets/Stickers/scene 13.png'
import stepSupport from '../../assets/Stickers/scene 11.png'

/**
 * „Cum funcționează”: cei cinci pași, de la onboarding la suportul de după.
 *
 * Textul și forma vin din machetă (`cum-functioneaza.html`): cercuri numerotate legate printr-o
 * linie, cartonașe care se deschid pe rând, cu detalii. Pe telefon pașii se așază unul sub altul,
 * cu numărul în stânga. Fiecare pas are un sticker din setul nostru, ca secțiunea să se lege de
 * restul paginii.
 */

interface Step {
  title: string
  summary: string
  expandLabel: string
  sticker: string
  details: ReactNode
}

const B = ({ children }: { children: ReactNode }) => (
  <Box component="strong" sx={{ fontWeight: 650, color: '#29364c' }}>
    {children}
  </Box>
)

const STEPS: Step[] = [
  {
    title: 'Pregătim startul',
    summary: 'Eligibilitate, PFA, SPV, facturare, bancă și autorizare — într-un singur onboarding online.',
    expandLabel: 'Ce include onboardingul',
    sticker: stepStart,
    details: (
      <>
        <Bullets
          items={[
            <>Verificăm eligibilitatea și <B>înființăm PFA-ul</B>, dacă nu ai deja unul.</>,
            <>Obținem <B>codul TVA intracomunitar</B> și accesul în <B>SPV</B>.</>,
            <>Un agent configurează contul de facturare pentru <B>trimiterea automată în SPV a facturilor aferente curselor</B>.</>,
            <>Îți conectezi <B>contul bancar</B> la RIDELANCE.</>,
            <>Parcurgi online procesul pentru <B>autorizația de transport, copia conformă și ecusoane</B>.</>,
          ]}
        />
        <Note>Ai deja PFA sau documente valabile? Parcurgi doar pașii necesari.</Note>
      </>
    ),
  },
  {
    title: 'Verificăm împreună',
    summary: 'Datele trec prin verificări automate și prin validarea unui agent RIDELANCE.',
    expandLabel: 'Cum verificăm',
    sticker: stepVerify,
    details: (
      <>
        <P>Verificăm automat datele completate, iar un agent RIDELANCE validează informațiile și documentele.</P>
        <P>
          Dacă lipsește ceva sau sunt necesare corecturi, <B>te ghidăm pentru completare</B> înainte de activare.
        </P>
      </>
    ),
  },
  {
    title: 'Activezi abonamentul',
    summary: 'Alegi abonamentul și ai acces în dashboard: activitatea ta, pe web și mobil.',
    expandLabel: 'Ce primești',
    sticker: stepActivate,
    details: (
      <>
        <P>
          Alegi abonamentul potrivit și, după activare, accesezi <B>dashboard-ul RIDELANCE</B>.
        </P>
        <P>
          Facturile, contul bancar, documentele și conexiunile tale sunt într-un singur loc, cu acces pe{' '}
          <B>web și în aplicația mobilă</B>.
        </P>
      </>
    ),
  },
  {
    title: 'Alegi beneficiile',
    summary: 'Combustibil, spălătorii, bancă, încărcare electrică, Benefit Edenred și fiscalizare cash.',
    expandLabel: 'Descoperă beneficiile',
    sticker: stepBenefits,
    details: (
      <>
        <Bullets
          items={[
            <><B>Card de reduceri</B> la combustibil și spălătorii.</>,
            <><B>Cont bancar fără comisioane</B> și reducere la abonamentul RIDELANCE, în condițiile ofertei partenere.</>,
            <><B>Tarife reduse</B> la încărcarea mașinilor electrice.</>,
            <><B>Benefit Edenred:</B> acces la reduceri, oferte și cashback de la companii din numeroase categorii.</>,
            <>
              Ai curse cash? Alegi o <B>casă de marcat cu reducere</B>, o conectezi și comanzi emiterea bonurilor din
              dashboard, fără să folosești butoanele aparatului.
            </>,
          ]}
        />
        <Note>Casa de marcat fizică rămâne necesară. Beneficiile se activează în condițiile fiecărui partener.</Note>
      </>
    ),
  },
  {
    title: 'Rămânem alături',
    summary: 'Contabilitate și suport pentru PFA pe tot parcursul colaborării, nu doar la început.',
    expandLabel: 'Suport pe termen lung',
    sticker: stepSupport,
    details: (
      <>
        <P>
          <B>Contabilii colaboratori RIDELANCE</B> țin constant evidența contabilă și se ocupă de partea contabilă a
          PFA-ului pe durata colaborării.
        </P>
        <P>
          <B>Agenții RIDELANCE</B> îți oferă suport pentru nevoile PFA-ului. În paralel, îmbunătățim continuu aplicația
          web și mobilă, inclusiv pe baza feedbackului tău.
        </P>
      </>
    ),
  },
]

const INK = '#191c31'
const MUTED = '#616a7d'
const ACCENT = '#197fa8'
const SKY = '#55c2eb'
const PAGE_BG = '#f0faff'
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function HowItWorks() {
  // Primul pas e deschis, ca în machetă; un singur pas deschis odată.
  const [open, setOpen] = useState<number | null>(0)

  return (
    <Box
      component="section"
      aria-labelledby="how-title"
      sx={{ width: '100%', mt: { xs: 8, md: 12 }, py: { xs: 5, md: 7 }, bgcolor: PAGE_BG, color: INK }}
    >
      <Container maxWidth="lg">
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: { xs: 2.5, md: 3 } }}
        >
          <Box>
            <Typography
              id="how-title"
              component="h2"
              sx={{ m: 0, mb: 0.75, fontSize: { xs: 26, md: 30 }, fontWeight: 800, letterSpacing: '-1.1px', lineHeight: 1.15 }}
            >
              Cum funcționează
            </Typography>
            <Typography sx={{ fontSize: { xs: 13, md: 14 }, lineHeight: 1.5, color: MUTED }}>
              De la primul pas la activitatea de zi cu zi. Totul conectat, cu noi alături.
            </Typography>
          </Box>
          <Typography
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1,
              fontSize: 12,
              color: '#365867',
              whiteSpace: 'nowrap',
              '&::before': { content: '""', width: 8, height: 8, borderRadius: '50%', bgcolor: SKY },
            }}
          >
            Online, cu suport uman
          </Typography>
        </Stack>

        <Box
          sx={{
            display: { xs: 'flex', sm: 'grid' },
            flexDirection: 'column',
            gridTemplateColumns: { sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' },
            gap: { xs: 1.25, sm: 1.75 },
            alignItems: 'start',
          }}
        >
          {STEPS.map((step, index) => (
            <StepCard
              key={step.title}
              step={step}
              index={index}
              isOpen={open === index}
              isLast={index === STEPS.length - 1}
              onToggle={() => setOpen((current) => (current === index ? null : index))}
            />
          ))}
        </Box>

        <Typography
          sx={{ fontSize: { xs: 11, md: 12 }, color: '#617689', mt: 2, lineHeight: 1.5, textAlign: 'center' }}
        >
          Tu conduci. Noi conectăm actele, contabilitatea și beneficiile.
        </Typography>
      </Container>
    </Box>
  )
}

function StepCard({
  step,
  index,
  isOpen,
  isLast,
  onToggle,
}: {
  step: Step
  index: number
  isOpen: boolean
  isLast: boolean
  onToggle: () => void
}) {
  const number = String(index + 1).padStart(2, '0')
  const detailsId = `how-step-${index}`

  return (
    <Box
      sx={{
        position: 'relative',
        mt: { xs: 0, sm: '70px' },
        bgcolor: '#fff',
        border: `1px solid ${isOpen ? '#a8e3f7' : '#dceef6'}`,
        borderRadius: { xs: `${TOKENS.radius.lg}px`, sm: `${TOKENS.radius.lg + 4}px` },
        boxShadow: isOpen ? '0 16px 38px rgba(26,93,122,.11)' : '0 9px 32px rgba(32,96,124,.055)',
        transition: `box-shadow .25s ${EASE}, border-color .25s ${EASE}`,
        '&:hover': { borderColor: '#a8e3f7', boxShadow: '0 16px 38px rgba(26,93,122,.11)' },
        // Linia care leagă cercurile, ca în machetă. Pe tabletă (3 coloane) se rupe după al treilea.
        '&::before': isLast
          ? undefined
          : {
              content: '""',
              display: { xs: 'none', sm: index === 2 ? 'none' : 'block', lg: 'block' },
              position: 'absolute',
              left: '50%',
              top: -42,
              width: 'calc(100% + 16px)',
              height: 2,
              background: 'linear-gradient(90deg,#a2e0f5,#66c9ee)',
              pointerEvents: 'none',
            },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      {/* Cercul cu numărul: deasupra cartonașului pe ecrane late, în stânga lui pe telefon. */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          zIndex: 2,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          fontWeight: 800,
          bgcolor: isOpen ? SKY : '#fff',
          color: isOpen ? '#fff' : '#24addf',
          boxShadow: isOpen ? '0 9px 24px rgba(63,185,232,.25)' : '0 7px 20px rgba(40,150,193,.12)',
          border: { xs: `5px solid ${PAGE_BG}`, sm: `7px solid ${PAGE_BG}` },
          width: { xs: 45, sm: 58 },
          height: { xs: 45, sm: 58 },
          fontSize: { xs: 14, sm: 18 },
          top: { xs: 13, sm: -70 },
          left: { xs: 11, sm: '50%' },
          transform: { xs: 'none', sm: isOpen ? 'translateX(-50%) scale(1.06)' : 'translateX(-50%)' },
          transition: `background-color .25s ${EASE}, color .25s ${EASE}, transform .35s ${EASE}`,
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        {number}
      </Box>

      <ButtonBase
        component="div"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={detailsId}
        sx={{
          width: '100%',
          display: 'block',
          textAlign: 'left',
          position: 'relative',
          borderRadius: 'inherit',
          px: { xs: '69px', sm: 2.5 },
          pr: { xs: '44px', sm: 2.5 },
          pt: { xs: 2, sm: 1.5 },
          pb: { xs: 2, sm: 5.5 },
          minHeight: { sm: 250 },
          '&:focus-visible': { outline: `3px solid #1483b1`, outlineOffset: -4 },
        }}
      >
        {/* Stickerul pasului: doar pe ecrane late, unde cartonașul are loc de ilustrație. */}
        <Box
          component="img"
          src={step.sticker}
          alt=""
          loading="lazy"
          sx={{
            display: { xs: 'none', sm: 'block' },
            height: 92,
            width: '100%',
            objectFit: 'contain',
            mb: 1.25,
            transform: isOpen ? 'translateY(-2px) scale(1.04)' : 'none',
            transition: `transform .4s ${EASE}`,
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        />
        <Typography
          component="h3"
          sx={{ m: 0, mb: { xs: 0.5, sm: 1.1 }, fontSize: { xs: 14, sm: 16 }, lineHeight: 1.3, letterSpacing: '-.4px', fontWeight: 750, color: INK }}
        >
          {step.title}
        </Typography>
        <Typography sx={{ m: 0, fontSize: { xs: 12, sm: 13 }, lineHeight: { xs: 1.5, sm: 1.6 }, color: MUTED }}>
          {step.summary}
        </Typography>

        <Stack
          direction="row"
          sx={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: ACCENT,
            fontSize: 11,
            fontWeight: 700,
            left: { xs: 'auto', sm: 20 },
            right: { xs: 16, sm: 20 },
            top: { xs: 22, sm: 'auto' },
            bottom: { xs: 'auto', sm: 15 },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {step.expandLabel}
          </Box>
          <Box
            component="span"
            aria-hidden
            sx={{
              fontSize: 18,
              lineHeight: '16px',
              fontWeight: 400,
              display: 'inline-block',
              transform: isOpen ? 'rotate(45deg)' : 'none',
              transition: `transform .3s ${EASE}`,
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          >
            +
          </Box>
        </Stack>
      </ButtonBase>

      <Collapse in={isOpen} timeout={380} easing={EASE} unmountOnExit={false}>
        <Box
          id={detailsId}
          sx={{
            borderTop: '1px solid #e8f2f7',
            pl: { xs: '69px', sm: 2.5 },
            pr: { xs: 2.25, sm: 2.5 },
            pt: 1.75,
            pb: 2.25,
            fontSize: 12,
            lineHeight: 1.65,
            color: '#505b6e',
          }}
        >
          {step.details}
        </Box>
      </Collapse>
    </Box>
  )
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
      {items.map((item, i) => (
        <Box
          component="li"
          key={i}
          sx={{
            position: 'relative',
            pl: '13px',
            mb: i === items.length - 1 ? 0 : 1.25,
            '&::before': {
              content: '""',
              position: 'absolute',
              width: 4,
              height: 4,
              top: 8,
              left: 0,
              borderRadius: '50%',
              bgcolor: '#3aadd7',
            },
          }}
        >
          {item}
        </Box>
      ))}
    </Box>
  )
}

function P({ children }: { children: ReactNode }) {
  return <Box component="p" sx={{ m: 0, mb: 1.4, '&:last-child': { mb: 0 } }}>{children}</Box>
}

function Note({ children }: { children: ReactNode }) {
  return (
    <Box component="span" sx={{ display: 'block', mt: 1.5, fontSize: 11, color: alpha('#69768a', 1) }}>
      {children}
    </Box>
  )
}
