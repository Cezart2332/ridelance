import { Alert, Box, Stack, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'

import {
  onboardingService,
  type ArrState,
  type VehicleState,
} from '../../../services/onboarding.service'
import { stripeService } from '../../../services/stripe.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { canonicalCounty } from '../../../data/counties'
import { BankAccountCta } from '../../common/BankAccountCta'
import { InsuranceLinksGrid } from '../../insurance/InsuranceLinksGrid'
import { ArrPaymentDetailsCard } from '../arr/ArrPaymentDetailsCard'
import { DossierPanel } from '../arr/DossierPanel'
import { CompanyFormationSummary } from '../companyFormation/CompanyFormationSummary'
import type { MicroStepContext, MicroStepSlot } from '../microStepTypes'
import { TOKENS } from '../onboardingTheme'
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
    case 'arrPaymentDetails': {
      const isVehicle = context.state?.currentStep === 'vehicle'
      return (
        <ArrPaymentDetailsCard
          county={arrCounty(context)}
          amountBani={isVehicle ? amountFor(context) : null}
          amountLabel={isVehicle ? amountLabelFor(context) : undefined}
        />
      )
    }
    case 'arrDossier':
      return <ArrDossierSlot />
    case 'vehicleDossier':
      return <VehicleDossierSlot />
    case 'onboardingAdvance':
      return <OnboardingAdvanceSlot />
    case 'rcaOffer':
      return (
        <InsuranceOffer
          note="N-ai încă poliță? O poți face prin asigurari.ro, la tarifele negociate pentru RIDElance."
          slugs={['rca', 'casco_econom']}
        />
      )
    case 'travelInsuranceOffer':
      return (
        <InsuranceOffer
          note="O cere ARR și se face separat de RCA. Prin asigurari.ro o ai la tarif de partener."
          slugs={['accidents_traveler', 'travel']}
        />
      )
  }
}

/**
 * Plata avansului, ca ecran de onboarding.
 *
 * Înainte, ecranul înlocuia tot runnerul din pagina pasului PFA, deci putea sta doar DUPĂ
 * întrebarea „ai deja PFA?" — adică plata venea după alegere. Ca slot, e un micro-pas ca oricare
 * altul și poate sta primul, între eligibilitate și PFA: cerem banii înainte, indiferent de ce
 * urmează să aleagă.
 */
function OnboardingAdvanceSlot() {
  const { state } = useOnboarding()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!state) return null

  const startPayment = async () => {
    setError(null)
    setPaying(true)
    try {
      const origin = window.location.origin
      // Eticheta de preț se formatează din starea serverului, nu se scrie în cod.
      await stripeService.redirectToInfiintarePfa(
        `${origin}/onboarding?pfa_setup_paid=1&session_id={{CHECKOUT_SESSION_ID}}`,
        `${origin}/onboarding/pfa`,
        `${(state.onboardingAdvanceBani / 100).toLocaleString('ro-RO')} lei`,
      )
    } catch (err) {
      // 422 = plata nu poate fi deschisă acum. Mesajul serverului spune exact de ce.
      setError(getErrorMessage(err, 'Nu am putut deschide plata. Încearcă din nou.'))
      setPaying(false)
    }
  }

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}
      <CompanyFormationSummary state={state} onPay={() => void startPayment()} paying={paying} />
    </Stack>
  )
}

/**
 * Oferta partenerului, deasupra uploadului.
 *
 * Ecranele astea cereau o poliță pe care șoferul o are „de undeva", fără să spună de unde — deși
 * avem un partener și tarife negociate, ascunse într-un tab din Dashboard la care se ajunge abia
 * după înrolare. Linkurile vin din catalogul unic (`InsuranceLinksGrid`), ca URL-ul de afiliere
 * să nu ajungă scris în două locuri.
 */
function InsuranceOffer({ note, slugs }: { note: string; slugs: readonly string[] }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.85rem', color: TOKENS.textMuted, mb: 1.5 }}>{note}</Typography>
      <InsuranceLinksGrid compact only={slugs} />
    </Box>
  )
}

/**
 * Județul agenției: ce a ales userul acum, altfel ce s-a salvat pe cerere, altfel județul
 * sediului social venit de la server (spec fix-uri §8.1).
 */
function arrCounty(c: MicroStepContext): string | null {
  const answered = c.answers['arr_agentie.county']
  if (typeof answered === 'string' && answered !== '') return answered

  const arr = (c.resources.arr as ArrState | undefined) ?? null
  return arr?.agencyName || canonicalCounty(c.state?.primaryCounty)
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
