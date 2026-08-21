import { useEffect, useRef, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'

import { OwnerAvatar } from '../../../common/OwnerAvatar'
import { companyService } from '../../../../services/company.service'
import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { Panel } from '../../ui'

/**
 * Uploaderul de logo, cu previzualizare în cele trei contexte cerute de spec §3.1: sidebar,
 * card de mașină și mini-site.
 *
 * Previzualizările nu sunt decor. Un logo dreptunghiular cu text mic arată acceptabil pe
 * mini-site și ilizibil în cercul de 28px de pe cardul de mașină — iar ăla e locul unde îl vede
 * publicul. Cele trei împreună sunt argumentul pentru care uploaderul cere explicit un logo, nu
 * o fotografie.
 *
 * Validarea din browser dublează pe cea de pe server. Nu e redundanță inutilă: o eroare
 * afișată înainte de a urca 2 MB e o eroare pe care o vezi imediat, nu după așteptare.
 */

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const ACCEPT_ATTR = '.png,.jpg,.jpeg,.webp,.svg'
const MAX_BYTES = 2 * 1024 * 1024
const MIN_EDGE = 256

interface CompanyLogoPanelProps {
  companyName: string
  logoUrl: string | null
  verified: boolean
  /** Logo-ul se atașează unui profil existent, deci prima salvare trebuie să fi avut loc. */
  hasProfile: boolean
  onLogoChange: (url: string | null) => void
}

/** Validările din §3.1: tip, dimensiune de fișier, latură minimă. */
async function validate(file: File): Promise<string | null> {
  if (!ACCEPTED.includes(file.type)) {
    return 'Format acceptat: PNG, JPG, WEBP sau SVG.'
  }
  if (file.size > MAX_BYTES) {
    return 'Fișierul depășește 2 MB.'
  }
  // SVG-ul e vectorial: „minim 256×256" nu înseamnă nimic pentru el.
  if (file.type === 'image/svg+xml') return null

  const dimensions = await new Promise<{ width: number; height: number } | null>((resolve) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
      URL.revokeObjectURL(url)
    }
    image.onerror = () => {
      resolve(null)
      URL.revokeObjectURL(url)
    }
    image.src = url
  })

  if (!dimensions) return 'Nu am putut citi imaginea.'
  if (dimensions.width < MIN_EDGE || dimensions.height < MIN_EDGE) {
    return `Imaginea are ${dimensions.width}×${dimensions.height} px. Minimul este ${MIN_EDGE}×${MIN_EDGE}.`
  }
  return null
}

export function CompanyLogoPanel({
  companyName,
  logoUrl,
  verified,
  hasProfile,
  onLogoChange,
}: CompanyLogoPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const objectUrlRef = useRef<string | null>(null)

  // `blob:` URL-urile trăiesc până sunt revocate explicit; fără asta, fiecare încercare de logo
  // ar lăsa în urmă un fișier ținut în memorie până la refresh.
  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    },
    [],
  )

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const problem = await validate(file)
    if (problem) {
      setError(problem)
      return
    }

    setError(null)
    setUploading(true)
    try {
      const url = await companyService.uploadLogo(file)
      // Previzualizarea locală nu mai e necesară odată ce serverul a răspuns cu calea reală.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      onLogoChange(url)
    } catch {
      setError('Nu am putut încărca logo-ul. Încearcă din nou.')
    } finally {
      setUploading(false)
    }
  }



  return (
    <Panel
      title="Logo firmă"
      subtitle="Recomandat: logo-ul firmei, nu o fotografie personală. PNG, JPG, WEBP sau SVG, maximum 2 MB, minimum 256×256 px."
    >
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}>
          <OwnerAvatar name={companyName} logoUrl={logoUrl} size={72} />
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button
              variant="contained"
              disableElevation
              disabled={uploading || !hasProfile}
              startIcon={<UploadRoundedIcon />}
              onClick={() => inputRef.current?.click()}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              {uploading ? 'Se încarcă…' : logoUrl ? 'Schimbă logo-ul' : 'Încarcă logo'}
            </Button>
          </Stack>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            hidden
            onChange={(event) => {
              void handleFile(event.target.files?.[0])
              // Fără reset, reîncărcarea aceluiași fișier după o eroare nu declanșează `change`.
              event.target.value = ''
            }}
          />
        </Stack>

        {!hasProfile && (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>
            Salvează întâi datele firmei — logo-ul se atașează profilului.
          </Typography>
        )}

        {error && (
          <Typography role="alert" sx={{ color: DASHBOARD_TOKENS.stateError, fontSize: '0.85rem', fontWeight: 600 }}>
            {error}
          </Typography>
        )}

        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: DASHBOARD_TOKENS.ink, mb: 1.2 }}>
            Cum se vede
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ flexWrap: 'wrap', rowGap: 1.5, alignItems: 'stretch' }}
          >
            <PreviewTile label="În meniu">
              <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', minWidth: 0 }}>
                <OwnerAvatar name={companyName} logoUrl={logoUrl} size={34} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
                    {companyName}
                  </Typography>
                  {verified && (
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: DASHBOARD_TOKENS.textMuted }}>
                      Flotă verificată
                    </Typography>
                  )}
                </Box>
              </Stack>
            </PreviewTile>

            <PreviewTile label="Pe cardul de mașină">
              <Stack direction="row" spacing={0.9} sx={{ alignItems: 'center', minWidth: 0 }}>
                <OwnerAvatar name={companyName} logoUrl={logoUrl} size={28} />
                <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.8rem', minWidth: 0 }}>
                  {companyName}
                </Typography>
                {verified && (
                  <VerifiedRoundedIcon sx={{ fontSize: 15, color: DASHBOARD_TOKENS.accent, flexShrink: 0 }} />
                )}
              </Stack>
            </PreviewTile>

            <PreviewTile label="Pe mini-site">
              <Stack spacing={1} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
                <OwnerAvatar name={companyName} logoUrl={logoUrl} size={48} />
                <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.95rem', minWidth: 0, maxWidth: '100%' }}>
                  {companyName}
                </Typography>
              </Stack>
            </PreviewTile>
          </Stack>
        </Box>


      </Stack>
    </Panel>
  )
}

function PreviewTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        flex: '1 1 200px',
        minWidth: 0,
        p: 1.6,
        borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.015),
      }}
    >
      <Typography
        sx={{
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: DASHBOARD_TOKENS.textSubtle,
          mb: 1.2,
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  )
}
