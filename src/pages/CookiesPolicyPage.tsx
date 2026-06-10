import { LegalDocumentPage } from '../components/common/LegalDocumentPage'

export function CookiesPolicyPage() {
  return (
    <LegalDocumentPage
      title="Politica de Cookies RIDElance"
      updatedAt="04.06.2026"
      documentPath="/cookies-policy.txt"
      errorMessage="Nu am putut incarca politica de cookies. Te rugam sa reincarci pagina."
    />
  )
}
