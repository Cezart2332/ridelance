import { LegalDocumentPage } from '../components/common/LegalDocumentPage'

export function PaymentPolicyPage() {
  return (
    <LegalDocumentPage
      title="Politica de Plati, Abonamente si Rambursari RIDElance"
      updatedAt="04.06.2026"
      documentPath="/payment-policy.txt"
      errorMessage="Nu am putut incarca politica de plati si abonamente. Te rugam sa reincarci pagina."
    />
  )
}
