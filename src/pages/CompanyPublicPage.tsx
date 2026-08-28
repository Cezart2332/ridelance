import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

import CarListCard from '../components/cars/CarListCard'
import { OwnerAvatar } from '../components/common/OwnerAvatar'
import { TOKENS } from '../constants/tokens'
import { companyService, type PublicCompany } from '../services/company.service'

/**
 * Mini-site-ul public al unei firme, la `/{firma}` (spec §4.2). `/f/{slug}` rămâne valabil.
 *
 * E destinația blocului de proprietar de pe cardul de mașină, deci trebuie să răspundă la
 * întrebarea pe care și-o pune cineva care tocmai a dat click pe un nume: cine sunt ăștia și ce
 * altceva mai au.
 *
 * Nu decide nimic despre confidențialitate. Serverul trimite doar contactele marcate publice, iar
 * pagina afișează ce a primit — altfel un câmp ascuns ar fi rămas oricum în răspunsul API.
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

  const hasContact = company.phone || company.email || company.whatsAppEnabled

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
      <Stack spacing={2.5} sx={{ mb: 5 }}>
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 2 }}>
          <OwnerAvatar name={company.legalName} logoUrl={company.logoUrl} size={72} />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography
                component="h1"
                sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 900, color: TOKENS.ink }}
              >
                {company.legalName}
              </Typography>
              {company.isVerified && (
                <VerifiedRoundedIcon
                  titleAccess="Flotă verificată RIDElance"
                  sx={{ color: TOKENS.primaryStrong, fontSize: 24 }}
                />
              )}
            </Stack>
            {company.location && (
              <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center', mt: 0.5 }}>
                <LocationOnRoundedIcon sx={{ fontSize: 17, color: TOKENS.textSubtle }} />
                <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.95rem' }}>
                  {company.location}
                </Typography>
              </Stack>
            )}
          </Box>
        </Stack>

        {company.publicDescription && (
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '1rem', lineHeight: 1.7, maxWidth: 760 }}>
            {company.publicDescription}
          </Typography>
        )}

        {hasContact && (
          <Stack direction="row" spacing={1.2} sx={{ flexWrap: 'wrap', rowGap: 1.2 }}>
            {company.whatsAppEnabled && company.phone && (
              <Button
                variant="contained"
                disableElevation
                startIcon={<WhatsAppIcon />}
                href={`https://wa.me/${company.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener"
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${TOKENS.radius.lg}px` }}
              >
                WhatsApp
              </Button>
            )}
            {company.phone && (
              <Button
                variant="outlined"
                startIcon={<PhoneRoundedIcon />}
                href={`tel:${company.phone.replace(/\s/g, '')}`}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${TOKENS.radius.lg}px` }}
              >
                {company.phone}
              </Button>
            )}
            {company.email && (
              <Button
                variant="outlined"
                startIcon={<EmailRoundedIcon />}
                href={`mailto:${company.email}`}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${TOKENS.radius.lg}px` }}
              >
                {company.email}
              </Button>
            )}
          </Stack>
        )}
      </Stack>

      <Typography
        component="h2"
        sx={{ fontSize: '1.25rem', fontWeight: 800, color: TOKENS.ink, mb: 2.5 }}
      >
        {company.cars.length === 0
          ? 'Momentan fără mașini publicate'
          : `Mașini disponibile (${company.cars.length})`}
      </Typography>

      {company.cars.length === 0 ? (
        <Box
          sx={{
            p: 4,
            borderRadius: `${TOKENS.radius.xl}px`,
            border: `1px solid ${TOKENS.border}`,
            bgcolor: alpha(TOKENS.ink, 0.015),
          }}
        >
          <Typography sx={{ color: TOKENS.textMuted }}>
            Firma nu are anunțuri active acum. Revino mai târziu.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {company.cars.map((car) => (
            <CarListCard key={car.id} car={car} companySlug={company.slug} />
          ))}
        </Box>
      )}
    </Container>
  )
}

export default CompanyPublicPage
