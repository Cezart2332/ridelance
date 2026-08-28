import { useState } from 'react'
import { Alert, Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'

import { OwnerAvatar } from '../../../common/OwnerAvatar'
import { SRL_PATHS } from '../../../../config/srlNavigation'
import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { PageHeader, Panel, StatusChip } from '../../ui'
import { useCompanyProfile } from '../useCompanyProfile'

/**
 * Pagina firmei — controlul asupra mini-site-ului public (spec §4.2).
 *
 * Nu duplică setările: ce e vizibil se decide în Profil, iar aici se vede rezultatul și se ia
 * linkul. Două locuri în care se bifează „arată telefonul" ar fi devenit, în timp, două răspunsuri
 * diferite la aceeași întrebare.
 */
export function SrlCompanyPagePage() {
  const { data: profile, loading, error } = useCompanyProfile()
  const [copied, setCopied] = useState(false)

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={260} />
      </Stack>
    )
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  // Fără profil salvat nu există slug, deci nici pagină publică de arătat.
  if (!profile) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <PageHeader title="Pagina firmei" subtitle="Mini-site-ul public al firmei tale." />
        <Panel>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mb: 2 }}>
            Pagina publică apare după ce completezi datele firmei. Adresa ei se generează atunci și
            rămâne aceeași chiar dacă schimbi denumirea.
          </Typography>
          <Button
            component={RouterLink}
            to={SRL_PATHS.profile}
            variant="contained"
            disableElevation
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            Completează profilul
          </Button>
        </Panel>
      </Stack>
    )
  }

  // Adresa scurtă, cea care se dă mai departe. `/f/{slug}` rămâne valabilă pentru linkurile vechi.
  const path = `/${profile.slug}`
  const publicUrl = `${window.location.origin}${path}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard-ul e blocat în unele contexte; linkul rămâne vizibil și selectabil oricum.
      setCopied(false)
    }
  }

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Pagina firmei"
        subtitle="Linkul public pe care îl poți distribui. Ce apare pe el se decide în Profil."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ContentCopyRoundedIcon />}
              onClick={() => void copyLink()}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              {copied ? 'Link copiat' : 'Copiază link'}
            </Button>
            <Button
              variant="contained"
              disableElevation
              endIcon={<OpenInNewRoundedIcon />}
              href={path}
              target="_blank"
              rel="noopener"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              Vezi pagina publică
            </Button>
          </Stack>
        }
      />

      <Panel title="Adresa publică" subtitle="Rămâne aceeași chiar dacă schimbi denumirea firmei.">
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: DASHBOARD_TOKENS.accent,
            wordBreak: 'break-all',
          }}
        >
          {publicUrl}
        </Typography>
      </Panel>

      <Panel
        title="Cum arată"
        subtitle="Antetul paginii publice, exact cu datele pe care le-ai marcat vizibile."
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}>
          <OwnerAvatar name={profile.legalName} logoUrl={profile.logoUrl} size={64} />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', color: DASHBOARD_TOKENS.ink }}>
                {profile.legalName}
              </Typography>
              {profile.isVerified && (
                <VerifiedRoundedIcon sx={{ fontSize: 19, color: DASHBOARD_TOKENS.accent }} />
              )}
            </Stack>
            {profile.publicDescription && (
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem', mt: 0.5, maxWidth: 620 }}>
                {profile.publicDescription}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 2.5, flexWrap: 'wrap', rowGap: 1 }}>
          <VisibilityChip label="Telefon" on={profile.visibility.phone} />
          <VisibilityChip label="Email" on={profile.visibility.email} />
          <VisibilityChip label="WhatsApp" on={profile.visibility.whatsapp} />
          <VisibilityChip label="Locație" on={profile.visibility.location} />
        </Stack>

        <Typography sx={{ mt: 2, fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted }}>
          Se schimbă din{' '}
          <RouterLink to={SRL_PATHS.profile} style={{ fontWeight: 700, color: DASHBOARD_TOKENS.accent }}>
            Profil → Vizibilitate publică
          </RouterLink>
          .
        </Typography>
      </Panel>
    </Stack>
  )
}

function VisibilityChip({ label, on }: { label: string; on: boolean }) {
  return (
    <StatusChip
      label={on ? `${label}: vizibil` : `${label}: ascuns`}
      tone={on ? 'active' : 'neutral'}
      size="sm"
      outlined
    />
  )
}
