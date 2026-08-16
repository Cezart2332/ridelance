import { Box, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { TOKENS } from '../../../constants/tokens'
import logo from '../../../assets/logo.svg'

/**
 * Panoul stâng e context, nu landing page: un singur mesaj și o singură dovadă vizuală.
 *
 * Nu se randează deloc sub `md` — `display: none` ar ascunde imaginea, dar browserul tot ar
 * descărca-o. Decizia de montare stă în `AuthLayout`.
 */
export function AuthBrandPanel() {
  return (
    <Box
      component="aside"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        p: 6,
        backgroundColor: TOKENS.surfaceAlt,
      }}
    >
      {/*
        Captura de produs are fundalul ei bleu, deci un bleed „gol" în colț ar arăta ca un
        dreptunghi rătăcit. Rama subțire plus o singură umbră o separă curat de panou —
        varianta permisă explicit de spec, în locul cardului de sticlă din mockup.
      */}
      <Box
        component="img"
        src="/auth-visual.webp"
        alt=""
        aria-hidden
        sx={{
          position: 'absolute',
          right: -40,
          bottom: -60,
          width: 'clamp(400px, 62%, 680px)',
          height: 'auto',
          borderRadius: `${TOKENS.radius.xl}px`,
          border: `1px solid ${TOKENS.border}`,
          boxShadow: TOKENS.shadow.xl,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
        <Link component={RouterLink} to="/" sx={{ display: 'inline-flex' }}>
          <Box component="img" src={logo} alt="RIDElance" sx={{ height: 40, width: 'auto' }} />
        </Link>

        <Typography
          variant="h3"
          component="h1"
          sx={{ mt: 6, fontSize: { md: '2.125rem', lg: '2.5rem' }, color: TOKENS.ink }}
        >
          Contabilitatea ta de PFA, pe pilot automat.
        </Typography>

        <Typography variant="body1" sx={{ mt: 2, color: TOKENS.textMuted }}>
          Încasări sincronizate direct din bancă, taxe calculate automat și declarații gata de
          depus la ANAF.
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={2}
        sx={{ position: 'relative', zIndex: 1, mt: 'auto', pt: 4, alignItems: 'center' }}
      >
        <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
          © {new Date().getFullYear()} RIDElance
        </Typography>
        <Link
          component={RouterLink}
          to="/termeni-si-conditii"
          underline="hover"
          variant="caption"
          sx={{ color: TOKENS.textMuted }}
        >
          Termeni
        </Link>
        <Link
          component={RouterLink}
          to="/privacy-policy"
          underline="hover"
          variant="caption"
          sx={{ color: TOKENS.textMuted }}
        >
          Confidențialitate
        </Link>
      </Stack>
    </Box>
  )
}
