import { useEffect, useRef, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'

import { OwnerAvatar } from '../../../common/OwnerAvatar'
import { prepareLogoImage } from '../../../../lib/imageProcessing'
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
 * Un logo prea mic nu se refuză, se mărește — la fel ca fotografia de antet. „Găsește altă
 * imagine" e un răspuns pe care nimeni nu-l urmează: ori renunță la logo, ori pune orice altceva
 * are la îndemână, iar cercul de 28 px de pe cardul de mașină rămâne tot gol.
 */

const ACCEPT_ATTR = 'image/*'

/** Plafon pe fișierul *ales*. Ce se trimite e mereu mic, fiindcă îl reîncodăm noi. */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024

interface CompanyLogoPanelProps {
  companyName: string
  logoUrl: string | null
  verified: boolean
  /** Logo-ul se atașează unui profil existent, deci prima salvare trebuie să fi avut loc. */
  hasProfile: boolean
  onLogoChange: (url: string | null) => void
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
  const [note, setNote] = useState<string | null>(null)
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

    if (!file.type.startsWith('image/')) {
      setError('Alege o imagine.')
      return
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError('Fișierul depășește 25 MB.')
      return
    }

    setError(null)
    setNote(null)
    setUploading(true)
    try {
      const prepared = await prepareLogoImage(file)
      const url = await companyService.uploadLogo(prepared.file)
      // Previzualizarea locală nu mai e necesară odată ce serverul a răspuns cu calea reală.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      onLogoChange(url)
      setNote(prepared.note)
    } catch (uploadError) {
      setError(
        uploadError instanceof Error && uploadError.message === 'decode'
          ? 'Nu am putut citi imaginea. Formatul HEIC de pe iPhone nu e acceptat — exportă-o ca PNG.'
          : 'Nu am putut încărca logo-ul. Încearcă din nou.',
      )
    } finally {
      setUploading(false)
    }
  }



  return (
    <Panel
      title="Logo firmă"
      subtitle="Recomandat: logo-ul firmei, nu o fotografie personală. Orice imagine — o pregătim noi pentru cele trei locuri de mai jos."
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
              {uploading ? 'Se pregătește…' : logoUrl ? 'Schimbă logo-ul' : 'Încarcă logo'}
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

        {note && (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', fontWeight: 600 }}>
            {note}
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
