import type { ReactNode } from 'react'

import {
  onboardingService,
  type ArrState,
  type VehicleState,
} from '../../../services/onboarding.service'
import { BankAccountCta } from '../../common/BankAccountCta'
import { ArrPaymentDetailsCard } from '../arr/ArrPaymentDetailsCard'
import { DossierPanel } from '../arr/DossierPanel'
import type { MicroStepContext, MicroStepSlot } from '../microStepTypes'
import { useOnboarding } from '../useOnboarding'

/**
 * Blocurile bogate pe care le poate cere un micro-pas, într-un singur loc.
 *
 * De ce un registru și nu JSX în config: fișierele din `config/` sunt date — se citesc ca o
 * listă de ecrane, nu ca o componentă. Iar faptul că fiecare bloc are exact o implementare e
 * chiar fix-ul cerut: „conturi ARR" și „generare dosar" apar pe patru ramuri, iar înainte
 * fiecare avea propria copie, deci fix-urile prindeau doar una.
 */
export function MicroStepSlotContent({
  slot,
  context,
}: {
  slot: MicroStepSlot
  context: MicroStepContext
}): ReactNode {
  switch (slot) {
    case 'bankAccountCta':
      return <BankAccountCta />
    case 'arrPaymentDetails':
      return (
        <ArrPaymentDetailsCard
          county={arrCounty(context)}
          amountBani={amountFor(context)}
          amountLabel={amountLabelFor(context)}
        />
      )
    case 'arrDossier':
      return <ArrDossierSlot />
    case 'vehicleDossier':
      return <VehicleDossierSlot />
  }
}

/**
 * Județul agenției: ce a ales userul acum, altfel ce s-a salvat pe cerere, altfel județul
 * sediului social venit de la server (spec fix-uri §8.1).
 */
function arrCounty(c: MicroStepContext): string | null {
  const answered = c.answers['arr_agentie.county']
  if (typeof answered === 'string' && answered !== '') return answered

  const arr = (c.resources.arr as ArrState | undefined) ?? null
  return arr?.agencyName || c.state?.primaryCounty || null
}

/**
 * Ce se plătește în contul ARR, în funcție de pasul pe care e utilizatorul. Ambele sume sunt
 * stampilate pe cerere la deschiderea ei (`app_settings`) — nu se inventează nimic aici.
 */
function amountFor(c: MicroStepContext): number | null {
  if (c.state?.currentStep === 'vehicle') {
    const copy = (c.resources.vehicle as VehicleState | undefined)?.copyRequest ?? null
    return copy ? copy.totalFeeSnapshotBani : null
  }

  const arr = (c.resources.arr as ArrState | undefined) ?? null
  return arr ? arr.feeSnapshotBani : null
}

const amountLabelFor = (c: MicroStepContext) =>
  c.state?.currentStep === 'vehicle' ? 'copie conformă și ecusoane' : 'tarif autorizație ARR'

function ArrDossierSlot() {
  const { resources, refresh } = useOnboarding()
  const arr = (resources.arr as ArrState | undefined) ?? null

  return (
    <DossierPanel
      dossier={{
        hasDossier: arr?.hasDossier === true,
        documentId: arr?.dossierDocumentId ?? null,
        generatedAtUtc: arr?.dossierGeneratedAtUtc ?? null,
        submittedAtUtc: arr?.submittedAtUtc ?? null,
      }}
      fileName="Dosar-autorizatie-transport-alternativ.pdf"
      generate={() => onboardingService.generateArrDossier()}
      markSubmitted={() => onboardingService.markArrSubmitted()}
      onChanged={refresh}
    />
  )
}

function VehicleDossierSlot() {
  const { resources, refresh } = useOnboarding()
  const copy = ((resources.vehicle as VehicleState | undefined) ?? null)?.copyRequest ?? null

  return (
    <DossierPanel
      dossier={{
        hasDossier: copy?.hasDossier === true,
        documentId: copy?.dossierDocumentId ?? null,
        generatedAtUtc: copy?.dossierGeneratedAtUtc ?? null,
        submittedAtUtc: copy?.submittedAtUtc ?? null,
      }}
      fileName="Dosar-copie-conforma-si-ecusoane.pdf"
      generate={() => onboardingService.generateVehicleDossier()}
      markSubmitted={() => onboardingService.markVehicleSubmitted()}
      onChanged={refresh}
    />
  )
}
