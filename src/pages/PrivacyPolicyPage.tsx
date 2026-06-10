import { LegalDocumentPage } from '../components/common/LegalDocumentPage'

export function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      title="Politica de Confidentialitate RIDElance"
      updatedAt="04.06.2026"
      documentPath="/privacy-policy.txt"
      errorMessage="Nu am putut incarca politica de confidentialitate. Te rugam sa reincarci pagina."
    />
  )
}
