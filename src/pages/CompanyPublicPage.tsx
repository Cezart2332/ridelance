import { useEffect, useState } from 'react'
import { usePageSeo } from '../seo/pageSeo'
import { useParams } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

import { CompanySite } from '../components/company/CompanySite'
import { ErrorPage } from '../components/common/ErrorPage'
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

  // /f/{slug} și /{slug} arată aceeași pagină; canonica e cea de la rădăcină.
  usePageSeo(company && companyPath ? { title: company.legalName, path: `/${companyPath}` } : null)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (notFound || !company) {
    // `/:companySlug` prinde orice adresă cu un singur segment, deci și greșelile de tastare.
    return <ErrorPage code={404} embedded />
  }

  return <CompanySite company={company} />
}

export default CompanyPublicPage
