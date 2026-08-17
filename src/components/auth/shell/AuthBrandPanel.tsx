import { Box, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { alpha } from '@mui/material/styles'
import { DENSE } from './authShellSx'
import { TOKENS } from '../../../constants/tokens'
import logo from '../../../assets/logo.svg'

const BADGES = ['Date protejate', 'Acces securizat', 'Experiență adaptată tipului de cont']

/**
 * Captura de produs e fundalul întregii coloane, nu un card în interiorul ei.
 *
 * Cât timp a stat într-un card în flux, poza a fost mereu limitată de înălțime: împărțea coloana
 * cu titlul, subtitlul și card-urile informative, așa că la 1440×900 ajungea la 755×426 și lăsa
 * jumătate din panou gol. Ca fundal `cover` ocupă toată suprafața, la orice raport de ecran.
 *
 * Costul e că textul stă acum peste imagine, de unde vălul de mai jos: opac sus și jos, unde e
 * textul, și transparent la mijloc, unde sunt dispozitivele. Fără el, contrastul pică sub 4.5:1
 * peste zonele deschise ale capturii.
 *
 * Card-urile „Pentru clienți PFA / Flote" au dispărut: erau exact blocurile care acopereau poza.
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
        p: 5,
        [DENSE]: { p: 4 },
        // Colțurile capturii sunt aproape albe (248–254), deci se topesc în `surface`: imaginea
        // pare că se continuă în panou, fără muchie vizibilă.
        backgroundColor: TOKENS.surface,
      }}
    >
      {/*
        `objectFit: cover` pe toată coloana ar fi tăiat jumătate din lățime — panoul e portret,
        captura e 16:9 — și dispozitivele deveneau un crop mărit, de nerecunoscut. În schimb o
        lățim peste marginile panoului și o ancorăm jos: rămâne întreagă pe orizontală, iar
        laptopul și telefonul cresc cât permite coloana.
      */}
      <Box
        component="img"
        src="/auth-visual.webp"
        alt=""
        aria-hidden
        sx={{
          position: 'absolute',
          // Ancorată la dreapta, nu la stânga: bleed-ul cade atunci peste logo-ul RIDElance
          // înfipt în colțul din stânga-jos al capturii, care altfel s-ar tăia la jumătate și ar
          // dubla logo-ul real de sus.
          right: '-2%',
          bottom: 0,
          width: '122%',
          maxWidth: 'none',
          height: 'auto',
        }}
      />

      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          // Stopurile sunt calibrate pe unde ajunge textul: pe ecrane de 768px subtitlul coboară
          // până la ~39% din înălțime, iar captura urcă până la ~30%. Zona aia trebuie să rămână
          // aproape opacă, altfel textul cade peste ecranul laptopului și devine ilizibil.
          background: `linear-gradient(180deg,
            ${TOKENS.surface} 0%,
            ${alpha(TOKENS.surface, 0.98)} 30%,
            ${alpha(TOKENS.surface, 0.7)} 42%,
            ${alpha(TOKENS.surface, 0)} 56%,
            ${alpha(TOKENS.surface, 0)} 68%,
            ${alpha(TOKENS.surface, 0.6)} 85%,
            ${alpha(TOKENS.surface, 0.94)} 100%)`,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, flex: 'none', maxWidth: 720 }}>
        <Link component={RouterLink} to="/" sx={{ display: 'inline-flex' }}>
          <Box component="img" src={logo} alt="RIDElance" sx={{ height: 38, width: 'auto' }} />
        </Link>

        {/* Wrapper de tip bloc: logo-ul e `inline-flex`, deci fără el pilula i s-ar lipi în dreapta. */}
        <Box sx={{ mt: 2.5, [DENSE]: { display: 'none' } }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 32,
              px: 1.5,
              borderRadius: `${TOKENS.radius.full}px`,
              backgroundColor: alpha(TOKENS.primary, 0.16),
              border: `1px solid ${alpha(TOKENS.primary, 0.28)}`,
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
          sx={{ mt: 1.5, maxWidth: 620, color: TOKENS.textMuted, [DENSE]: { display: 'none' } }}
        >
          Pentru șoferi PFA și flote care vor să-și administreze activitatea, mașinile și
          colaborările simplu, dintr-un singur dashboard.
        </Typography>
      </Box>

      {/* Împinge subsolul jos și lasă mijlocul coloanei liber pentru captură. */}
      <Box sx={{ flex: 1, minHeight: 0 }} />

      <Stack
        direction="row"
        spacing={2}
        sx={{ position: 'relative', zIndex: 1, flex: 'none', flexWrap: 'wrap', rowGap: 1 }}
      >
        {BADGES.map((badge) => (
          <Stack key={badge} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: `${TOKENS.radius.full}px`,
                backgroundColor: TOKENS.primaryStrong,
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 500, color: TOKENS.ink }}>
              {badge}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack
        direction="row"
        spacing={2}
        sx={{ position: 'relative', zIndex: 1, flex: 'none', alignItems: 'center', mt: 1 }}
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
