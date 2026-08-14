import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Alert, Box, Button, Divider, Link, Stack, Typography } from '@mui/material'
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

const PRICE_LEI = 300

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
  const { data: formation } = useOnboardingResource('companyFormation', () =>
    companyFormationService.getState(),
  )

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
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5 }}>
          Verifică datele de mai jos. După plată, depunem dosarul la Registrul Comerțului.
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

      <PanelCard title="Total de plată">
        <Stack
          direction="row"
          sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}
        >
          <Typography sx={{ fontSize: '0.9rem', color: TOKENS.textMuted }}>
            Înființare PFA, taxă unică
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: TOKENS.ink, ...tabularSx }}>
            {PRICE_LEI} lei
          </Typography>
        </Stack>

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={paying || !state.canPay}
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={onPay}
          sx={{
            py: 1.3,
            fontWeight: 700,
            borderRadius: `${TOKENS.radius.md}px`,
            color: '#fff',
            backgroundColor: TOKENS.primary,
            '&:hover': { backgroundColor: TOKENS.primaryStrong },
          }}
        >
          {paying ? 'Se deschide plata...' : 'Plătește și depune dosarul'}
        </Button>
      </PanelCard>
    </Stack>
  )
}
