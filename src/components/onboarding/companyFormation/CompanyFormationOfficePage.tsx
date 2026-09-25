import { Alert } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import {
  companyFormationService,
  type CompanyFormationState,
} from '../../../services/companyFormation.service'
import { AutoContinue } from '../AutoContinue'
import { PanelHeading } from '../PanelCard'
import { TOKENS } from '../onboardingTheme'
import { useOnboardingResource } from '../useOnboarding'
import { RegisteredOfficeForm, type RegisteredOfficeValue } from './RegisteredOfficeForm'
import { useCompanyFormation } from './useCompanyFormation'

/** Etapa 2 din dosarul de înființare: unde va avea firma sediul social. */
export default function CompanyFormationOfficePage() {
  const navigate = useNavigate()
  const { state, patch, autosave, submit, submitting, error } = useCompanyFormation()
  const { data: offices } = useOnboardingResource('consultoOffices', () =>
    companyFormationService.getConsultoOffices(),
  )

  if (!state) return null

  const office = state.office
  const disabled = state.isLocked

  const payload = (source: CompanyFormationState) => ({
    type: source.office.type,
    consultoOfficeId: source.office.consultoOfficeId,
    isOwner: source.office.isOwner,
    adresa: source.office.adresa,
    acknowledgedOwnershipDocs: source.office.acknowledgedOwnershipDocs,
    acknowledgedSubmitLater: source.office.acknowledgedSubmitLater,
    acknowledgedOwnerConsent: source.office.acknowledgedOwnerConsent,
    owners: source.owners.map((o) => ({
      id: o.id || null,
      persoana: o.persoana,
    })),
  })

  /** Salvează starea dată explicit — bifele trebuie trimise imediat, nu la următorul blur. */
  const persist = (source?: CompanyFormationState) =>
    void autosave(() => companyFormationService.saveRegisteredOffice(payload(source ?? state)))

  const change = (next: RegisteredOfficeValue, commit: boolean) => {
    const updated = { ...state, office: next.office, owners: next.owners }
    patch(updated)
    if (commit) persist(updated)
  }

  const goNext = async () => {
    const saved = await submit(() => companyFormationService.saveRegisteredOffice(payload(state)))
    if (saved?.registeredOfficeComplete) {
      navigate('/onboarding/pfa/consimtamant')
    }
  }

  return (
    <AutoContinue
      // Datele de înființare se verifică înainte de trimitere: cu „Continuă”, nu cu trecerea singură.
      manual
      spacing={3}
      ready={state.registeredOfficeComplete}
      disabled={disabled}
      restartKey={JSON.stringify(office)}
      onContinue={() => void goNext()}
      busy={submitting}
      reasons={['Completează datele sediului și bifele de mai sus.']}
    >
      <PanelHeading title="Sediul social" />

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

      <RegisteredOfficeForm
        value={{ office, owners: state.owners }}
        domiciliu={state.solicitant.domiciliu}
        offices={offices}
        onChange={change}
        onBlur={() => persist()}
        disabled={disabled}
      />
    </AutoContinue>
  )
}
