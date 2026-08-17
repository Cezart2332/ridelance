import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'

import { BCR_ACCOUNT } from '../../data/partners'
import { TOKENS } from '../../constants/tokens'

/**
 * Deschiderea contului bancar: butonul ȘI codul QR, în aceeași componentă.
 *
 * De ce împreună: cele două erau în două locuri diferite, iar pe ramura „am nevoie de cont"
 * ajunsese să se randeze doar butonul. Pe desktop QR-ul e singura cale rezonabilă de a continua
 * pe telefon, unde onboardingul BCR chiar se face.
 *
 * Pe mobil QR-ul nu dispare — se strânge într-un acordeon: acolo butonul e suficient, dar
 * scanarea de pe alt dispozitiv rămâne un caz real (telefonul altcuiva, tableta).
 *
 * Sursa e una singură (`BCR_ACCOUNT`), deci linkul din buton și cel din QR nu pot diverge.
 */
export function BankAccountCta() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const button = (
    <Button
      component="a"
      href={BCR_ACCOUNT.url}
      target="_blank"
      rel="noopener noreferrer"
      variant="contained"
      size="large"
      endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
      sx={{
        alignSelf: { xs: 'stretch', sm: 'flex-start' },
        py: 1.2,
        px: 3,
        fontWeight: 700,
        textTransform: 'none',
      }}
    >
      {BCR_ACCOUNT.ctaLabel}
    </Button>
  )

  const qr = (
    <Stack
      spacing={1.2}
      sx={{
        alignItems: 'center',
        p: 2,
        borderRadius: `${TOKENS.radius.lg}px`,
        border: `1px solid ${TOKENS.border}`,
        backgroundColor: TOKENS.paper,
        width: 'fit-content',
      }}
    >
      <Box
        component="img"
        src={BCR_ACCOUNT.qrImage}
        alt={BCR_ACCOUNT.qrLabel}
        sx={{ width: 160, height: 'auto', borderRadius: `${TOKENS.radius.md}px` }}
      />
      <Stack direction="row" spacing={0.7} sx={{ alignItems: 'flex-start', maxWidth: 200 }}>
        <QrCode2RoundedIcon sx={{ fontSize: 16, color: TOKENS.textMuted, mt: 0.2 }} />
        <Typography
          sx={{ color: TOKENS.textMuted, fontSize: '0.78rem', fontWeight: 650, textAlign: 'center' }}
        >
          {BCR_ACCOUNT.qrLabel}
        </Typography>
      </Stack>
    </Stack>
  )

  if (isMobile) {
    return (
      <Stack spacing={2} sx={{ width: '100%' }}>
        {button}
        <Accordion
          disableGutters
          elevation={0}
          sx={{
            border: `1px solid ${TOKENS.border}`,
            borderRadius: `${TOKENS.radius.md}px`,
            '&::before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: TOKENS.ink }}>
              Continuă pe alt dispozitiv
            </Typography>
          </AccordionSummary>
          <AccordionDetails>{qr}</AccordionDetails>
        </Accordion>
      </Stack>
    )
  }

  return (
    <Stack
      direction="row"
      spacing={3}
      sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 2 }}
    >
      {button}
      {qr}
    </Stack>
  )
}
