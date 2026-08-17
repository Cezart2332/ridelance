import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { companyFormationService } from '../../../services/companyFormation.service'
import type { OnboardingState } from '../../../services/onboarding.service'
import { TOKENS, tabularSx } from '../onboardingTheme'
import { PanelCard } from '../PanelCard'
import { useOnboardingResource } from '../useOnboarding'

/** Ce intră în taxa de înființare — scris o dată, ca ecranul să nu promită altceva decât livrăm. */
const INCLUDED = [
  'Rezervarea denumirii și pregătirea dosarului pentru ONRC',
  'Depunerea dosarului și urmărirea lui până la eliberare',
  'Certificatul de înregistrare și certificatul constatator',
  'Înregistrarea la ANAF și deschiderea dosarului fiscal',
]

/**
 * Suma NU stă aici. Vine din `Pricing.RidelanceStart.OnboardingAdvanceBani` (backend), prin
 * starea de onboarding — o schimbare de preț nu are voie să ceară o modificare de cod în UI.
 */
const lei = (bani: number) =>
  (bani / 100).toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

interface SummaryRowProps {
  label: string
  value: string
  onEdit: () => void
}

function SummaryRow({ label, value, onEdit }: SummaryRowProps) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, py: 1.2 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted, fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.92rem', color: TOKENS.ink }}>{value}</Typography>
      </Box>
      <Link
        component="button"
        type="button"
        onClick={onEdit}
        sx={{ fontSize: '0.82rem', fontWeight: 700, flexShrink: 0, color: TOKENS.primaryStrong }}
      >
        Modifică
      </Link>
    </Stack>
  )
}

/**
 * RL-03 — ultimul ecran înainte de plată: ce a completat, ce urmează, cât costă și ce include.
 *
 * Ecranul e read-only intenționat. Modificarea se face întorcându-te la etapa respectivă, care
 * își păstrează datele — nu se editează nimic de aici, ca rezumatul să rămână o confirmare, nu
 * încă un formular.
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
  const navigate = useNavigate()
  const [acknowledged, setAcknowledged] = useState(false)
  const { data: formation } = useOnboardingResource('companyFormation', () =>
    companyFormationService.getState(),
  )

  const amount = lei(state.onboardingAdvanceBani)

  const solicitant = formation?.solicitant
  const office = formation?.office

  const fullName = [solicitant?.nume, solicitant?.prenume].filter(Boolean).join(' ') || '—'
  const address =
    [office?.adresa?.strada, office?.adresa?.numar, office?.adresa?.localitate, office?.adresa?.judet]
      .filter(Boolean)
      .join(', ') || '—'

  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: TOKENS.ink }}>
          Dosarul tău e gata
        </Typography>
        {/*
          Nimic nu a plecat încă nicăieri. Formularea anterioară („depunem dosarul") lăsa
          impresia că datele sunt deja la partener, iar userul plătea pentru ceva ce credea
          deja făcut.
        */}
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5 }}>
          Datele tale sunt pregătite pentru transmitere. După confirmarea plății, le trimitem
          către partenerul nostru contabil.
        </Typography>
      </Box>

      {state.paymentStatus === 'FAILED' && (
        <Alert severity="warning" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          Plata anterioară nu a trecut. Datele tale sunt intacte — poți reîncerca acum.
        </Alert>
      )}

      <PanelCard title="Ce ai completat">
        <SummaryRow
          label="Solicitant"
          value={fullName}
          onEdit={() => navigate('/onboarding/pfa/date-personale')}
        />
        <Divider />
        <SummaryRow
          label="Sediu profesional"
          value={address}
          onEdit={() => navigate('/onboarding/pfa/sediu')}
        />
        <Divider />
        <SummaryRow
          label="Semnătura"
          value={formation?.signature ? 'Dosar semnat' : 'Nesemnat'}
          onEdit={() => navigate('/onboarding/pfa/consimtamant')}
        />
      </PanelCard>

      <PanelCard title="Ce urmează">
        <Stack spacing={1}>
          {INCLUDED.map((item) => (
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
          Ne ocupăm de deschiderea PFA-ului, de obținerea documentelor necesare și de setarea
          conturilor pentru desfășurarea activității independente.
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
              RIDElance Start și este nerambursabilă.
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
