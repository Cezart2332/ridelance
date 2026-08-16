import { Box, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { alpha } from '@mui/material/styles'
import { DENSE, ROOMY } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'
import logo from '../../../assets/logo.svg'

const USER_TYPES = [
  {
    tag: 'PFA',
    title: 'Pentru clienți PFA',
    body: 'Îți vezi încasările, taxele, facturile și activitatea de ridesharing într-un dashboard simplu și clar.',
  },
  {
    tag: 'FLT',
    title: 'Pentru clienți Flote',
    body: 'Publici mașini, gestionezi cereri, documente, expirări și ai propria pagină publică de companie.',
  },
]

const BADGES = ['Date protejate', 'Acces securizat', 'Experiență adaptată tipului de cont']

/**
 * Aranjarea vine din mockup — brand, eyebrow, titlu, captură, cele două card-uri, badge-uri.
 * Pictura vine de la noi: fundal plat în locul gradienților radiali, rame de 1px în locul
 * cardurilor de sticlă cu `backdrop-filter`, greutățile din temă în locul lui 850/900/950.
 *
 * Blocurile secundare cad pe rând când ecranul e scund, ca pagina să rămână fără scroll:
 * card-urile sub 820px, eyebrow-ul și subtitlul sub 720px.
 */
export function AuthBrandPanel() {
  return (
    <Box
      component="aside"
      sx={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        p: 5,
        [DENSE]: { p: 4 },
        backgroundColor: TOKENS.surfaceAlt,
      }}
    >
      <Box sx={{ flex: 'none', maxWidth: 720 }}>
        <Link component={RouterLink} to="/" sx={{ display: 'inline-flex' }}>
          <Box component="img" src={logo} alt="RIDElance" sx={{ height: 38, width: 'auto' }} />
        </Link>

        {/* Wrapper de tip bloc: logo-ul e `inline-flex`, deci fără el pilula i s-ar lipi în dreapta. */}
        <Box sx={{ mt: 3, [DENSE]: { display: 'none' } }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 32,
            px: 1.5,
            borderRadius: `${TOKENS.radius.full}px`,
            backgroundColor: alpha(TOKENS.primary, 0.12),
            border: `1px solid ${alpha(TOKENS.primary, 0.24)}`,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, color: TOKENS.primaryStrong }}>
            RIDElance pentru PFA & Flote
          </Typography>
        </Box>
        </Box>

        <Typography
          variant="h3"
          component="h1"
          sx={{
            mt: 2,
            fontSize: { md: '2rem', lg: '2.375rem' },
            color: TOKENS.ink,
            [DENSE]: { mt: 2, fontSize: '1.75rem' },
          }}
        >
          Tot businessul tău de ridesharing.
          <br />
          <Box component="span" sx={{ color: TOKENS.primaryStrong }}>
            Într-un singur loc.
          </Box>
        </Typography>

        <Typography
          variant="body1"
          sx={{ mt: 2, maxWidth: 620, color: TOKENS.textMuted, [DENSE]: { display: 'none' } }}
        >
          Pentru șoferi PFA și flote care vor să-și administreze activitatea, mașinile și
          colaborările simplu, dintr-un singur dashboard.
        </Typography>
      </Box>

      {/*
        Captura stă în flux, într-un card, exact ca în mockup — nu ancorată cu bleed în colț.
        `flex: 1` + `minHeight: 0` îi dau spațiul rămas, iar `maxHeight/maxWidth: 100%` cu
        dimensiuni `auto` o micșorează păstrând raportul, deci se vede întotdeauna întreagă.
      */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          mt: 2,
          display: 'flex',
          alignItems: 'flex-start',
          // Plasă de siguranță: dacă `maxHeight: 100%` nu se rezolvă într-un layout viitor,
          // captura e tăiată aici, nu trece peste card-urile de dedesubt.
          overflow: 'hidden',
          [DENSE]: { mt: 2 },
        }}
      >
        {/*
          Rama se lipește de marginile reale ale imaginii. Un card lat cât panoul cu
          `objectFit: contain` ar fi lăsat benzi albe în stânga și în dreapta, iar captura ar fi
          părut mică și pierdută în el.
        */}
        <Box
          component="img"
          src="/auth-visual.webp"
          alt=""
          aria-hidden
          sx={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            borderRadius: `${TOKENS.radius.lg}px`,
            border: `1px solid ${TOKENS.border}`,
            boxShadow: TOKENS.shadow.lg,
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 'none',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
          mt: 2,
          [ROOMY]: { display: 'none' },
        }}
      >
        {USER_TYPES.map((type) => (
          <Box
            key={type.tag}
            sx={{
              p: 2,
              borderRadius: `${TOKENS.radius.lg}px`,
              backgroundColor: TOKENS.paper,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.sm,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                display: 'grid',
                placeItems: 'center',
                mb: 1.5,
                borderRadius: `${TOKENS.radius.md}px`,
                backgroundColor: alpha(TOKENS.primary, 0.12),
                color: TOKENS.primaryStrong,
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {type.tag}
            </Box>
            <Typography component="h2" sx={{ fontSize: '1rem', fontWeight: 700, color: TOKENS.ink }}>
              {type.title}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: TOKENS.textMuted }}>
              {type.body}
            </Typography>
          </Box>
        ))}
      </Box>

      <Stack
        direction="row"
        spacing={2}
        sx={{ flex: 'none', flexWrap: 'wrap', rowGap: 1, mt: 2, [DENSE]: { mt: 1.5 } }}
      >
        {BADGES.map((badge) => (
          <Stack key={badge} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: `${TOKENS.radius.full}px`,
                backgroundColor: TOKENS.primary,
              }}
            />
            <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
              {badge}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack
        direction="row"
        spacing={2}
        sx={{ flex: 'none', alignItems: 'center', mt: 1, [DENSE]: { mt: 1 } }}
      >
        <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>
          © {new Date().getFullYear()} RIDElance
        </Typography>
        <Link
          component={RouterLink}
          to="/termeni-si-conditii"
          underline="hover"
          variant="caption"
          sx={{ color: TOKENS.textSubtle }}
        >
          Termeni
        </Link>
        <Link
          component={RouterLink}
          to="/privacy-policy"
          underline="hover"
          variant="caption"
          sx={{ color: TOKENS.textSubtle }}
        >
          Confidențialitate
        </Link>
      </Stack>
    </Box>
  )
}
