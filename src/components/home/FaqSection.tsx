import { useState } from 'react'
import { Box, ButtonBase, Collapse, Container, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddRoundedIcon from '@mui/icons-material/AddRounded'

import { TOKENS } from '../../constants/tokens'
import { HOME_FAQ } from '../../data/faq'
import questionSticker from '../../assets/Stickers/character 3.png'

/**
 * Întrebările frecvente.
 *
 * Forma vine din modelul primit (tema ITZone, pagina de serviciu): cartonașe albe separate, cu
 * umbră mare și difuză, titlul îngroșat și o iconiță în culoarea mărcii care se schimbă la deschidere;
 * răspunsul coboară lin, iar o singură întrebare stă deschisă odată. Pe ecrane late, în stânga
 * stă stickerul cu semnul întrebării și un îndemn spre suport.
 */

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

interface FaqSectionProps {
  /** Titlul secțiunii; pe pagina „Despre” diferă de cel de pe prima pagină. */
  title?: string
}

export function FaqSection({ title = 'Întrebări frecvente' }: FaqSectionProps) {
  // Prima întrebare e deschisă, ca în model.
  const [open, setOpen] = useState<number | null>(0)

  return (
    <Box component="section" aria-labelledby="faq-title" sx={{ mt: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 4fr) minmax(0, 8fr)' },
            gap: { xs: 3, md: 6 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ position: { md: 'sticky' }, top: { md: 110 } }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: TOKENS.primaryStrong,
                mb: 1,
              }}
            >
              FAQ
            </Typography>
            <Typography
              id="faq-title"
              component="h2"
              sx={{ fontWeight: 900, fontSize: { xs: '1.7rem', md: '2.2rem' }, lineHeight: 1.15, color: TOKENS.ink, letterSpacing: '-0.02em' }}
            >
              {title}
            </Typography>
            <Typography sx={{ mt: 1.5, color: TOKENS.textMuted, lineHeight: 1.65, maxWidth: 380 }}>
              Răspunsuri scurte la ce ne întreabă cel mai des șoferii. Pentru orice altceva, echipa RIDELANCE îți
              răspunde din platformă.
            </Typography>
            <Box
              component="img"
              src={questionSticker}
              alt=""
              loading="lazy"
              sx={{
                display: { xs: 'none', md: 'block' },
                width: '100%',
                maxWidth: 300,
                mt: 4,
                animation: 'faqFloat 6s ease-in-out infinite',
                '@keyframes faqFloat': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            />
          </Box>

          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {HOME_FAQ.map((item, index) => (
              <FaqItem
                key={item.q}
                index={index}
                question={item.q}
                answer={item.a}
                isOpen={open === index}
                onToggle={() => setOpen((current) => (current === index ? null : index))}
              />
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

function FaqItem({
  index,
  question,
  answer,
  isOpen,
  onToggle,
}: {
  index: number
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  const answerId = `faq-answer-${index}`

  return (
    <Box
      component="li"
      sx={{
        bgcolor: TOKENS.paper,
        borderRadius: `${TOKENS.radius.lg}px`,
        overflow: 'hidden',
        // Umbra mare și difuză din model, trasă spre stânga: cartonașele par să plutească.
        boxShadow: isOpen ? '-10px 0 60px rgba(16, 60, 90, 0.12)' : '-10px 0 60px rgba(0, 0, 0, 0.07)',
        border: `1px solid ${isOpen ? alpha(TOKENS.primary, 0.35) : 'transparent'}`,
        transition: `box-shadow .5s ${EASE}, border-color .5s ${EASE}`,
        '& + &': { mt: { xs: 1.5, md: 2.5 } },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      <Box component="h3" sx={{ m: 0 }}>
      <ButtonBase
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={answerId}
        sx={{
          m: 0,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          textAlign: 'left',
          px: { xs: 2.25, md: 3.1 },
          py: { xs: 1.75, md: 2.1 },
          fontFamily: 'inherit',
          fontSize: { xs: '0.98rem', md: '1.1rem' },
          fontWeight: 700,
          lineHeight: 1.45,
          color: isOpen ? TOKENS.primaryStrong : TOKENS.ink,
          transition: `color .3s ${EASE}`,
          '&:hover': { color: TOKENS.primaryStrong },
          '&:focus-visible': { outline: `2px solid ${TOKENS.primaryStrong}`, outlineOffset: -2 },
        }}
      >
        {question}
        <Box
          component="span"
          aria-hidden
          sx={{
            flexShrink: 0,
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            borderRadius: `${TOKENS.radius.md}px`,
            bgcolor: isOpen ? TOKENS.primary : alpha(TOKENS.primary, 0.12),
            color: isOpen ? '#fff' : TOKENS.primaryStrong,
            transition: `background-color .3s ${EASE}, color .3s ${EASE}`,
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        >
          <AddRoundedIcon
            sx={{
              fontSize: 20,
              transform: isOpen ? 'rotate(45deg)' : 'none',
              transition: `transform .45s ${EASE}`,
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          />
        </Box>
      </ButtonBase>
      </Box>

      <Collapse in={isOpen} timeout={500} easing={EASE}>
        <Typography
          id={answerId}
          sx={{
            px: { xs: 2.25, md: 3.1 },
            pt: 0.5,
            pb: { xs: 2.25, md: 3.5 },
            color: TOKENS.textMuted,
            fontSize: { xs: '0.92rem', md: '0.98rem' },
            lineHeight: 1.75,
          }}
        >
          {answer}
        </Typography>
      </Collapse>
    </Box>
  )
}
