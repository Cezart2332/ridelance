import { DocumentFirstUpload } from './DocumentFirstUpload'
import { requirementOf } from './documentRequirements'
import { useOnboarding } from './useOnboarding'

/**
 * Un câmp de document, cu tot ce știe catalogul despre el: eticheta, categoriile echivalente și
 * pasul de unde provine. Panourile spun doar „la pasul X vreau documentul Y" — restul (lista de
 * documente, id-ul dosarului, refresh-ul) vine din provider, ca să nu se repete în șase locuri.
 */
export function StepDocument({
  step,
  category,
  label,
}: {
  step: string
  category: string
  /** Suprascrie eticheta din catalog, când panoul are un context mai bun. */
  label?: string
}) {
  const { state, documents, refresh } = useOnboarding()
  const requirement = requirementOf(step, category)

  // Doar când documentul se cere prima dată în alt pas — altfel n-are ce „prelua".
  const fromStep =
    requirement && requirement.originStep !== step
      ? state?.steps.find((s) => s.key === requirement.originStep)
      : undefined

  return (
    <DocumentFirstUpload
      category={category}
      label={label ?? requirement?.label ?? category}
      alsoAccepts={requirement?.alsoAccepts}
      fromStepLabel={fromStep?.label}
      documents={documents}
      pfaRegistrationId={state?.pfaRegistrationId}
      onUploaded={refresh}
    />
  )
}
