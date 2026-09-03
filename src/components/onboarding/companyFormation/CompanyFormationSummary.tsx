import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState } from 'react'

import type { OnboardingState } from '../../../services/onboarding.service'
import { TOKENS, tabularSx } from '../onboardingTheme'
import { PanelCard } from '../PanelCard'

/**
 * Ce se primește pe avans, pe fiecare ramură. Scris o dată, ca ecranul să nu promită altceva
 * decât livrăm: cine are deja PFA nu cumpără o înființare, deci lista aia i-ar fi fost falsă.
 */
const INCLUDED_NEW_PFA = [
  'Rezervarea denumirii și pregătirea dosarului pentru ONRC',
  'Depunerea dosarului și urmărirea lui până la eliberare',
  'Certificatul de înregistrare și certificatul constatator',
  'Înregistrarea la ANAF și deschiderea dosarului fiscal',
]

const INCLUDED_HAS_PFA = [
  'Autorizația de transport alternativ și copia conformă, cu dosarul pregătit de noi',
  'Deschiderea conturilor de flotă Uber și Bolt pe numele tău',
  'Contul de facturare Oblio, administrat de noi',
  'Împuternicirile și contractele, pregătite pentru semnat o singură dată',
]

/**
 * Suma NU stă aici. Vine din `Pricing.RidelanceStart.OnboardingAdvanceBani` (backend), prin
 * starea de onboarding — o schimbare de preț nu are voie să ceară o modificare de cod în UI.
 */
const lei = (bani: number) =>
  (bani / 100).toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

/**
 * RL-03 — ecranul de plată al înființării, luat ÎNAINTEA dosarului: ce se cumpără, cât costă și
 * ce urmează după.
 *
 * Nu mai recapitulează date completate, fiindcă la momentul ăsta nu există niciuna: dosarul se
 * deschide după plată, nu invers.
 */
export function CompanyFormationSummary({
  state,
  onPay,
  paying,
}: {
  state: OnboardingState
  onPay: () => void
  paying: boolean
}) {
  const [acknowledged, setAcknowledged] = useState(false)

  const amount = lei(state.onboardingAdvanceBani)
  // Avansul se cere pe ambele ramuri, dar nu cumpără același lucru: pentru unul deschidem PFA-ul,
  // pentru celălalt continuăm de la PFA-ul lui. Ecranul spune ce primește fiecare.
  const opensNewPfa = state.registrationType === 'NuAmPfa'
  const included = opensNewPfa ? INCLUDED_NEW_PFA : INCLUDED_HAS_PFA

  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: TOKENS.ink }}>
          {opensNewPfa ? 'Îți deschidem PFA-ul' : 'Începem înrolarea'}
        </Typography>
        {/*
          Ecranul vine ÎNAINTEA dosarului, nu după: se plătește serviciul, apoi începem lucrul
          la el. Deci aici nu e nimic de recapitulat — nu s-a completat încă nimic — ci de
          arătat ce se cumpără și ce urmează după plată.
        */}
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5 }}>
          {opensNewPfa
            ? 'După confirmarea plății îți deschidem dosarul de înființare și completezi datele.'
            : 'După confirmarea plății continuăm cu documentele PFA-ului tău.'}
        </Typography>
      </Box>

      {state.paymentStatus === 'FAILED' && (
        <Alert severity="warning" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          Plata anterioară nu a trecut. Poți reîncerca acum.
        </Alert>
      )}

      <PanelCard title="Ce include">
        <Stack spacing={1}>
          {included.map((item) => (
            <Stack key={item} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <CheckRoundedIcon sx={{ fontSize: 18, color: TOKENS.success, mt: '2px' }} />
              <Typography sx={{ fontSize: '0.88rem', color: TOKENS.ink }}>{item}</Typography>
            </Stack>
          ))}
        </Stack>
      </PanelCard>

      <PanelCard title="Plata abonamentului RIDElance Start">
        <Typography sx={{ fontSize: '0.92rem', color: TOKENS.ink, lineHeight: 1.6 }}>
          Pentru continuarea procedurii este necesară plata în avans a abonamentului{' '}
          <Box component="strong" sx={{ fontWeight: 800 }}>
            RIDElance Start — {amount} lei
          </Box>
          .
        </Typography>
        <Typography sx={{ fontSize: '0.92rem', color: TOKENS.ink, lineHeight: 1.6, mt: 1.5 }}>
          {opensNewPfa
            ? 'Ne ocupăm de deschiderea PFA-ului, de obținerea documentelor necesare și de setarea conturilor pentru desfășurarea activității independente.'
            : 'Ne ocupăm de autorizația de transport, de conturile de flotă și de setarea contabilității pentru activitatea ta.'}
        </Typography>

        {/*
          Partea care schimbă natura sumei: nu e un cost în plus, e prima lună de abonament
          plătită mai devreme. Fără rândul ăsta, ecranul cerea 399 de lei pentru „ceva", iar
          reducerea de la final apărea ca o surpriză nelegată de plata asta.
        */}
        <Typography sx={{ fontSize: '0.92rem', color: TOKENS.ink, lineHeight: 1.6, mt: 1.5 }}>
          Suma se întoarce integral la finalul înrolării, ca reducere pe primul abonament:{' '}
          <Box component="strong" sx={{ fontWeight: 800 }}>
            Solo — două luni gratuite, Start — o lună gratuită, Pro — {amount} lei reducere în
            prima lună
          </Box>
          . Din luna următoare, prețul e cel normal.
        </Typography>

        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, mt: 2.5, mb: 1 }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: TOKENS.ink, ...tabularSx }}>
            {amount} lei
          </Typography>
          {!state.onboardingAdvanceIsRefundable && (
            <Chip
              label="Nerambursabilă"
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: alpha(TOKENS.pendingBase, 0.14),
                color: TOKENS.pending,
              }}
            />
          )}
        </Stack>

        {/*
          Bifa nu e formalitate: nerambursabilitatea e singura condiție pe care userul nu o poate
          deduce din nimic altceva de pe ecran, deci trebuie confirmată explicit înainte de plată.
        */}
        <FormControlLabel
          sx={{ alignItems: 'flex-start', mt: 1, mr: 0 }}
          control={
            <Checkbox
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              sx={{ pt: 0.5 }}
            />
          }
          label={
            <Typography sx={{ fontSize: '0.88rem', color: TOKENS.ink, lineHeight: 1.5 }}>
              Am înțeles că suma de {amount} lei reprezintă plata în avans a abonamentului
              RIDElance Start, că nu se returnează în bani și că se recuperează integral ca
              reducere la primul abonament.
            </Typography>
          }
        />

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={paying || !state.canPay || !acknowledged}
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={onPay}
          sx={{
            mt: 2,
            py: 1.3,
            fontWeight: 700,
            borderRadius: `${TOKENS.radius.md}px`,
            color: '#fff',
            backgroundColor: TOKENS.primary,
            '&:hover': { backgroundColor: TOKENS.primaryStrong },
          }}
        >
          {paying ? 'Se deschide plata...' : `Plătește ${amount} lei`}
        </Button>

        {!acknowledged && (
          <Typography
            role="status"
            aria-live="polite"
            sx={{ mt: 1, fontSize: '0.82rem', color: TOKENS.textMuted, textAlign: 'center' }}
          >
            Bifează confirmarea de mai sus ca să poți plăti.
          </Typography>
        )}
      </PanelCard>
    </Stack>
  )
}
