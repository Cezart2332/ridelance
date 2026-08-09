import { DocumentFirstUpload } from '../DocumentFirstUpload'
import { requirementOf } from '../documentRequirements'
import type { MicroStepDef } from '../microStepTypes'
import { useOnboarding } from '../useOnboarding'

/**
 * Ecranul unui singur document. Nu rescrie uploadul: `DocumentFirstUpload` are deja tot ciclul
 * (progres real, prevalidare automată, respingere cu motiv lângă document, înlocuire), iar
 * catalogul (`documentRequirements.ts`) știe deja categoriile echivalente și proveniența.
 *
 * Ce adaugă micro-pasul e doar contextul: un singur document, zonă de upload mare, hint propriu.
 */
export function MicroUploadStep({ def }: { def: MicroStepDef }) {
  const { state, documents, refresh } = useOnboarding()
  const document = def.document
  if (!document) return null

  const requirement = requirementOf(def.macroStep, document.category)

  // Documentul se cere prima dată la alt pas: îl arătăm preluat, nu îl cerem din nou.
  const fromStep =
    requirement && requirement.originStep !== def.macroStep
      ? state?.steps.find((s) => s.key === requirement.originStep)
      : undefined

  return (
    <DocumentFirstUpload
      category={document.category}
      label={document.label}
      alsoAccepts={requirement?.alsoAccepts}
      fromStepLabel={fromStep?.label}
      requireBothSides={document.requireBothSides}
      documents={documents}
      pfaRegistrationId={state?.pfaRegistrationId}
      onUploaded={refresh}
      spacious
      hint={document.hint}
      hideLabel
    />
  )
}
