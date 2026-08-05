import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { Alert, Button, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import {
  companyFormationService,
  type PersoanaFizica,
} from '../../../services/companyFormation.service'
import { PanelCard, PanelHeading } from '../PanelCard'
import { TOKENS } from '../onboardingTheme'
import { useOnboarding } from '../useOnboarding'
import { PersoanaFizicaForm } from './PersoanaFizicaForm'
import { useCompanyFormation } from './useCompanyFormation'

/** Etapa 1 din dosarul de înființare: cine ești, cu ce act și unde ai domiciliul. */
export default function CompanyFormationPersonalDataPage() {
  const navigate = useNavigate()
  const { eligibility } = useOnboarding()
  const { state, patch, autosave, submit, submitting, error } = useCompanyFormation()

  if (!state) return null

  const solicitant = state.solicitant
  const prefilled = new Set(state.prefilledFields.map((f) => f.toUpperCase()))

  const update = (next: PersoanaFizica) => patch({ ...state, solicitant: next })

  const persist = () =>
    void autosave(() =>
      companyFormationService.savePersonalData({
        nume: solicitant.nume,
        prenume: solicitant.prenume,
        cnp: solicitant.cnp,
        tipAct: solicitant.tipAct,
        serieAct: solicitant.serieAct,
        numarAct: solicitant.numarAct,
        autoritateEmitenta: solicitant.autoritateEmitenta,
        dataEmiterii: solicitant.dataEmiterii,
        dataExpirarii: solicitant.dataExpirarii,
        domiciliu: solicitant.domiciliu,
      }),
    )

  const goNext = async () => {
    const saved = await submit(() =>
      companyFormationService.savePersonalData({
        nume: solicitant.nume,
        prenume: solicitant.prenume,
        cnp: solicitant.cnp,
        tipAct: solicitant.tipAct,
        serieAct: solicitant.serieAct,
        numarAct: solicitant.numarAct,
        autoritateEmitenta: solicitant.autoritateEmitenta,
        dataEmiterii: solicitant.dataEmiterii,
        dataExpirarii: solicitant.dataExpirarii,
        domiciliu: solicitant.domiciliu,
      }),
    )

    if (saved?.personalDataComplete) {
      navigate('/onboarding/pfa/sediu')
    }
  }

  return (
    <Stack spacing={3}>
      <PanelHeading title="Datele tale" />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      {state.isLocked && (
        <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          Dosarul a fost trimis. Datele nu mai pot fi modificate.
        </Alert>
      )}

      <PanelCard>
        <PersoanaFizicaForm
          value={solicitant}
          onChange={update}
          onBlur={persist}
          prefilled={prefilled}
          knownBirthDate={eligibility?.dateOfBirth ?? null}
          disabled={state.isLocked}
        />
      </PanelCard>

      <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={() => void goNext()}
          disabled={submitting || state.isLocked || !state.personalDataComplete}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            backgroundColor: TOKENS.primary,
            '&:hover': { backgroundColor: TOKENS.primaryStrong },
          }}
        >
          Continuă
        </Button>
      </Stack>
    </Stack>
  )
}
