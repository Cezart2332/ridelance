import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState } from 'react'

import { BCR_ONBOARDING_URL, BCR_QR_CODES } from '../../data/partners'
import { displaySx, TOKENS } from './onboardingTheme'

const [bcrQr] = BCR_QR_CODES

/**
 * Ce se întâmplă când clientul spune că nu are încă un cont de PFA. În loc să-l lăsăm blocat
 * într-un pas pe care nu-l poate completa, îi oferim calea scurtă (oferta BCR–RIDElance, cu QR
 * ca să deschidă contul de pe telefon) și, dacă preferă altă bancă, îi spunem exact când să
 * revină. Ambele ramuri se închid cu aceeași concluzie: contul se declară aici, cu document.
 */
export function BcrAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [otherBank, setOtherBank] = useState(false)

  const close = () => {
    onClose()
    // Resetăm abia după animația de închidere, ca dialogul să nu comute vizibil sub degete.
    window.setTimeout(() => setOtherBank(false), 200)
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="sm"
      aria-labelledby="bcr-dialog-title"
      slotProps={{ paper: { sx: { borderRadius: `${TOKENS.radius.lg}px` } } }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, pt: 2.5 }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: `${TOKENS.radius.md}px`,
              display: 'grid',
              placeItems: 'center',
              color: TOKENS.primaryStrong,
              backgroundColor: alpha(TOKENS.primary, 0.12),
            }}
          >
            <AccountBalanceRoundedIcon />
          </Box>
          <Typography
            id="bcr-dialog-title"
            component="h2"
            sx={{ ...displaySx, fontWeight: 800, fontSize: '1.08rem', color: TOKENS.ink }}
          >
            {otherBank ? 'Deschide contul la banca ta' : 'Deschide contul PFA la BCR prin RIDElance'}
          </Typography>
        </Stack>
        <IconButton aria-label="Închide" onClick={close} sx={{ color: TOKENS.textMuted, mt: -0.5 }}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>

      <DialogContent sx={{ px: 3, pb: 3, pt: 2 }}>
        {otherBank ? (
          <Stack spacing={2.5}>
            <Typography sx={{ color: TOKENS.ink, fontSize: '0.95rem', lineHeight: 1.7 }}>
              Poți deschide contul la banca aleasă. După ce contul este activ, revino în această
              secțiune și încarcă IBAN-ul și documentul de confirmare.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button onClick={() => setOtherBank(false)} sx={{ color: TOKENS.textMuted, fontWeight: 700 }}>
                Înapoi la oferta BCR
              </Button>
              <Button
                variant="contained"
                onClick={close}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none',
                  backgroundColor: TOKENS.primary,
                  '&:hover': { backgroundColor: TOKENS.primaryStrong },
                }}
              >
                Am înțeles
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2.5}>
            <Typography sx={{ color: TOKENS.ink, fontSize: '0.95rem', lineHeight: 1.7 }}>
              Beneficiezi de oferta dedicată parteneriatului RIDElance–BCR și îți poți folosi contul
              pentru încasările de la platforme, plata taxelor și administrarea activității PFA.
            </Typography>

            {bcrQr && (
              <Stack
                spacing={1.2}
                sx={{
                  alignItems: 'center',
                  p: 2,
                  borderRadius: `${TOKENS.radius.md}px`,
                  border: `1px solid ${TOKENS.border}`,
                  backgroundColor: TOKENS.surface,
                }}
              >
                <Box
                  component="img"
                  src={bcrQr.image}
                  alt={bcrQr.label}
                  sx={{ width: '100%', maxWidth: 170, height: 'auto', borderRadius: `${TOKENS.radius.sm}px` }}
                />
                <Stack direction="row" spacing={0.7} sx={{ alignItems: 'flex-start' }}>
                  <QrCode2RoundedIcon sx={{ fontSize: 16, color: TOKENS.textMuted, mt: 0.2 }} />
                  <Typography
                    sx={{
                      color: TOKENS.textMuted,
                      fontSize: '0.78rem',
                      fontWeight: 650,
                      textAlign: 'center',
                    }}
                  >
                    {bcrQr.label}
                  </Typography>
                </Stack>
              </Stack>
            )}

            <Stack spacing={1.2}>
              <Button
                variant="contained"
                component="a"
                href={BCR_ONBOARDING_URL}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewRoundedIcon />}
                sx={{
                  fontWeight: 800,
                  textTransform: 'none',
                  py: 1.2,
                  backgroundColor: TOKENS.primary,
                  '&:hover': { backgroundColor: TOKENS.primaryStrong },
                }}
              >
                Deschide cont la BCR
              </Button>
              <Button
                onClick={() => setOtherBank(true)}
                sx={{ fontWeight: 700, textTransform: 'none', color: TOKENS.textMuted }}
              >
                Prefer altă bancă
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
