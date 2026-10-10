import { useState } from 'react'
import { usePageSeo } from '../../seo/pageSeo'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'

import logo from '../../assets/logo.svg'
import { TOKENS } from '../../constants/tokens'
import { useAppSelector } from '../../store/hooks'
import { authService } from '../../services/auth.service'
import { ROUTES } from '../../constants/routes'
import { roleLabel } from '../auth/loginDestination'

export type ErrorCode = 403 | 404 | 500

interface ErrorPageProps {
  code: ErrorCode
  /** 403: rolul căruia îi aparține pagina, ca mesajul să spună de ce nu intri. */
  requiredRole?: string | null
  /** În interiorul unui layout (site, dashboard): fără logo și fără înălțimea întregului ecran. */
  embedded?: boolean
  /** Unde duce butonul principal. Implicit: contul tău dacă ești logat, altfel prima pagină. */
  homePath?: string
}

const TITLES: Record<ErrorCode, string> = {
  403: 'Nu ai acces aici',
  404: 'Pagina nu există',
  500: 'Ceva n-a mers',
}

/**
 * Paginile de eroare: 403 (pagina e a altui tip de cont), 404 (adresa nu duce nicăieri), 500 (o
 * eroare în pagină). Înlocuiesc redirecționările tăcute: cine ajunge aici află ce s-a întâmplat.
 */
export function ErrorPage({ code, requiredRole, embedded = false, homePath }: ErrorPageProps) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { accessToken, role } = useAppSelector((s) => s.auth)
  const [leaving, setLeaving] = useState(false)
  const loggedIn = Boolean(accessToken)
  const home = homePath ?? (loggedIn ? '/app' : '/')

  // Adresele inexistente răspund tot cu 200 (aplicația e servită pe orice cale), deci pagina își
  // spune singură că nu trebuie indexată.
  usePageSeo({ title: `${code} · ${TITLES[code]}`, noindex: true })

  const message =
    code === 403
      ? requiredRole && role
        ? `Pagina e pentru conturile de ${roleLabel(requiredRole)}, iar tu ești conectat cu un cont de ${roleLabel(role)}.`
        : 'Contul cu care ești conectat nu are acces la această pagină.'
      : code === 404
        ? 'Adresa e greșită sau pagina a fost mutată.'
        : 'A apărut o eroare în pagină. Reîncarcă și încearcă din nou.'

  const switchAccount = async () => {
    setLeaving(true)
    await authService.logout()
    navigate(ROUTES.login, { replace: true, state: { returnTo: pathname + search } })
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: embedded ? '60vh' : '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
        bgcolor: embedded ? 'transparent' : TOKENS.surface,
      }}
    >
      <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 460 }}>
        {!embedded && <Box component="img" src={logo} alt="RIDElance" sx={{ height: 32, mb: 3 }} />}
        <Typography
          sx={{ fontSize: { xs: '4.5rem', sm: '6rem' }, fontWeight: 800, lineHeight: 1, color: TOKENS.primary, letterSpacing: '-0.04em' }}
        >
          {code}
        </Typography>
        <Typography component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.8rem' }, fontWeight: 800, color: TOKENS.ink }}>
          {TITLES[code]}
        </Typography>
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.98rem' }}>{message}</Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 2, width: { xs: '100%', sm: 'auto' } }}>
          {code === 500 ? (
            <Button variant="contained" onClick={() => window.location.reload()}>
              Reîncarcă pagina
            </Button>
          ) : (
            <Button variant="contained" onClick={() => navigate(home)}>
              {loggedIn ? 'Mergi la contul tău' : 'Prima pagină'}
            </Button>
          )}
          {code === 403 && loggedIn ? (
            <Button variant="outlined" onClick={switchAccount} disabled={leaving}>
              Schimbă contul
            </Button>
          ) : code === 500 ? (
            <Button variant="outlined" onClick={() => { window.location.href = home }}>
              {loggedIn ? 'Mergi la contul tău' : 'Prima pagină'}
            </Button>
          ) : (
            window.history.length > 1 && (
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Înapoi
              </Button>
            )
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
