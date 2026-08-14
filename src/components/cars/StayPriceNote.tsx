import { Box, ClickAwayListener, Tooltip, Typography } from '@mui/material'
import { useState, type ReactElement } from 'react'

import { TOKENS } from '../../constants/tokens'

/**
 * Informarea de la prețurile „La Rămânere”.
 *
 * Textul e o condiție contractuală, nu un slogan: prețul redus ține cât ține abonamentul PRO. E
 * prea important ca să lipsească și prea lung ca să stea desfășurat peste tot unde apare o mașină
 * — deci stă sub un asterisc, care se deschide la hover sau la click.
 *
 * Click-ul e oprit din propagare fiindcă declanșatorul stă peste un card care navighează: cine
 * cere explicația vrea explicația, nu pagina mașinii.
 */

const TITLE = 'Prețurile „La Rămânere”'

const PARAGRAPHS = [
  'Prețurile reduse afișate pentru vehiculele „La Rămânere” sunt disponibile exclusiv clienților cu abonament RIDElance PRO activ.',
  'Reducerea se menține doar pe perioada în care abonamentul RIDElance PRO este activ și achitat. Dacă abonamentul expiră, este suspendat sau nu mai este plătit, prețul săptămânal al vehiculului revine automat la tariful standard, începând cu următoarea perioadă de facturare.',
  'Condiția este prevăzută în Contractul de Rămânere, iar continuarea beneficiului ține de menținerea unui abonament RIDElance PRO activ pe toată durata contractului.',
]

/** Asteriscul de pus lângă etichetă. Ridicat ca exponent, în aceeași culoare cu textul. */
export function StayAsterisk() {
  return (
    <Box component="span" aria-hidden sx={{ ml: '1px', fontSize: '0.85em', verticalAlign: 'super' }}>
      *
    </Box>
  )
}

interface StayPriceNoteProps {
  /** Declanșatorul — pastila, chipul sau textul de care se agață informarea. */
  children: ReactElement
}

export function StayPriceNote({ children }: StayPriceNoteProps) {
  const [open, setOpen] = useState(false)

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Tooltip
        open={open}
        // Controlat, deci ascultătorii proprii ai lui Tooltip nu se aplică: le punem noi pe copil,
        // ca aceeași informare să meargă și cu mouse-ul, și la atingere.
        onClose={() => setOpen(false)}
        title={
          <Box sx={{ p: 0.5 }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: TOKENS.ink, mb: 1 }}>
              {TITLE}
            </Typography>
            {PARAGRAPHS.map((paragraph) => (
              <Typography
                key={paragraph}
                sx={{
                  fontSize: '0.78rem',
                  color: TOKENS.textMuted,
                  lineHeight: 1.6,
                  '& + &': { mt: 1 },
                }}
              >
                {paragraph}
              </Typography>
            ))}
          </Box>
        }
        placement="bottom-start"
        slotProps={{
          tooltip: {
            sx: {
              maxWidth: 340,
              p: 1.5,
              backgroundColor: TOKENS.paper,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.xl,
              borderRadius: `${TOKENS.radius.lg}px`,
            },
          },
        }}
      >
        <Box
          component="span"
          role="button"
          tabIndex={0}
          aria-label={`${TITLE} — condiții`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setOpen((value) => !value)
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            event.stopPropagation()
            setOpen((value) => !value)
          }}
          sx={{ display: 'inline-flex', cursor: 'help' }}
        >
          {children}
        </Box>
      </Tooltip>
    </ClickAwayListener>
  )
}
