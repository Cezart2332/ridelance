import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, Box, CircularProgress, Container } from '@mui/material'

import { CompanySite } from '../components/company/CompanySite'
import { TOKENS } from '../constants/tokens'
import { companyService, type PublicCompany } from '../services/company.service'

/**
 * Mini-site-ul public al unei firme, la `/{firma}` (spec §4.2). `/f/{slug}` rămâne valabil.
 *
 * Pagina se ocupă doar de aducerea datelor și de stările din jurul lor. Cum arată mini-site-ul
 * trăiește în `CompanySite`, care se randează identic și în previzualizarea din dashboard — o
 * previzualizare care ar fi fost o a doua implementare ar fi început, la prima modificare, să
 * arate altceva decât pagina reală.
 *
 * Nu decide nimic despre confidențialitate. Serverul trimite doar contactele marcate publice.
 */
export function CompanyPublicPage() {
  // Două rute duc aici: /f/{slug}, cea veche, și /{companySlug}, cea de azi.
  const { slug, companySlug } = useParams<{ slug?: string; companySlug?: string }>()
  const companyPath = slug ?? companySlug
  const [company, setCompany] = useState<PublicCompany | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!companyPath) return
    let cancelled = false

    companyService
      .getPublic(companyPath)
      .then((data) => {
        if (!cancelled) setCompany(data)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [companyPath])

  useEffect(() => {
    if (!company) return
    const previous = document.title
    document.title = `${company.legalName} — RIDElance`
    return () => {
      document.title = previous
    }
  }, [company])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (notFound || !company) {
    return (
      <Container maxWidth="md" sx={{ py: 10 }}>
        <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.lg}px`, fontWeight: 600 }}>
          Pagina firmei nu există sau a fost mutată.
        </Alert>
      </Container>
    )
  }

  return <CompanySite company={company} />
}

export default CompanyPublicPage
