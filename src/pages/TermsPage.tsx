import { LegalDocumentPage } from '../components/common/LegalDocumentPage'

export function TermsPage() {
  return (
    <LegalDocumentPage
      title="Termeni si Conditii Generale RIDElance"
      updatedAt="04.06.2026"
      documentPath="/terms-and-conditions.txt"
      errorMessage="Nu am putut incarca termenii si conditiile. Te rugam sa reincarci pagina."
    />
  )
}
