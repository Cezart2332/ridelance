import { Box } from '@mui/material'

import type {
  AdminCompanyPageDetail,
  AdminCompanyPageVersion,
} from '../../../../../services/adminCompanyPage.service'
import type { BlockableSectionId, PublicCompany } from '../../../../../services/company.service'
import { CompanySite } from '../../../../company/CompanySite'
import { withoutBlockedSections } from '../../../../company/sections'
import { TOKENS } from '../../../../../constants/tokens'

/**
 * Pagina firmei, randată exact cu componenta pe care o vede vizitatorul.
 *
 * Moderarea se face uitându-te la pagină, nu citind câmpuri într-un tabel. Un titlu inofensiv
 * lângă o fotografie nepotrivită arată altfel decât suma celor două citite separat — iar decizia
 * se ia pe ce se vede.
 *
 * Mașinile lipsesc: au propriul drum de aprobare, iar aici întrebarea e ce a scris firma.
 */
interface CompanyPagePreviewProps {
  detail: AdminCompanyPageDetail
  version: AdminCompanyPageVersion
  /** Secțiunile oprite se scot și din previzualizare, ca ea să arate rezultatul, nu intenția. */
  blockedSections: readonly BlockableSectionId[]
  maxHeight?: number | string
}

export function CompanyPagePreview({
  detail,
  version,
  blockedSections,
  maxHeight = 620,
}: CompanyPagePreviewProps) {
  const company = withoutBlockedSections(toPublicCompany(detail, version), blockedSections)

  return (
    <Box
      sx={{
        borderRadius: TOKENS.radius.md,
        border: `1px solid rgba(0,0,0,0.08)`,
        overflow: 'hidden',
        maxHeight,
        overflowY: 'auto',
      }}
    >
      <CompanySite company={company} preview />
    </Box>
  )
}

function toPublicCompany(
  detail: AdminCompanyPageDetail,
  version: AdminCompanyPageVersion,
): PublicCompany {
  return {
    legalName: detail.legalName,
    slug: detail.slug,
    logoUrl: detail.logoUrl,
    coverImageUrl: version.coverImageUrl,
    tagline: version.tagline,
    publicDescription: version.publicDescription,
    isVerified: false,
    phone: detail.phone,
    email: detail.email,
    website: detail.website,
    // Butonul de WhatsApp depinde de comutatoarele din Profilul firmei, care nu sunt subiectul
    // moderării. Aici rămâne stins, ca previzualizarea să nu sugereze o setare pe care n-o vedem.
    whatsAppEnabled: false,
    location: null,
    theme: version.theme,
    content: version.content,
    pickup: version.pickup,
    cars: [],
  }
}
