import { useRef, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'

import { uploadUrl } from '../../../../../lib/api'
import { companyService } from '../../../../../services/company.service'
import { DASHBOARD_TOKENS } from '../../../dashboardTheme'

/**
 * Fotografia din antetul mini-site-ului.
 *
 * Validarea din browser dublează pe cea de pe server, ca la logo: o eroare arătată înainte de a
 * urca cinci megaocteți e o eroare pe care o vezi imediat, nu după așteptare.
 *
 * Fără SVG, spre deosebire de logo — asta e o fotografie panoramică, nu o marcă vectorială.
 */

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']
const ACCEPT_ATTR = '.png,.jpg,.jpeg,.webp'
const MAX_BYTES = 5 * 1024 * 1024
const MIN_WIDTH = 1600
const MIN_HEIGHT = 600

interface CompanyCoverPanelProps {
  coverUrl: string | null
  /** Fotografia se atașează unui profil existent, deci prima salvare trebuie să fi avut loc. */
  hasProfile: boolean
  onCoverChange: (url: string | null) => void
}

async function validate(file: File): Promise<string | null> {
  if (!ACCEPTED.includes(file.type)) {
    return 'Format acceptat: PNG, JPG sau WEBP.'
  }
  if (file.size > MAX_BYTES) {
    return 'Fișierul depășește 5 MB.'
  }

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
  if (dimensions.width < MIN_WIDTH || dimensions.height < MIN_HEIGHT) {
    // Antetul se întinde pe toată lățimea ecranului: sub pragul ăsta se vede pixelată exact acolo
    // unde e primul lucru pe care îl vede vizitatorul.
    return `Imaginea are ${dimensions.width}×${dimensions.height} px. Minimul este ${MIN_WIDTH}×${MIN_HEIGHT}.`
  }
  return null
}

export function CompanyCoverPanel({ coverUrl, hasProfile, onCoverChange }: CompanyCoverPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const problem = await validate(file)
    if (problem) {
      setError(problem)
      return
    }

    setError(null)
    setBusy(true)
    try {
      onCoverChange(await companyService.uploadCover(file))
    } catch {
      setError('Nu am putut încărca fotografia. Încearcă din nou.')
    } finally {
      setBusy(false)
    }
  }

  const removeCover = async () => {
    setBusy(true)
    setError(null)
    try {
      await companyService.deleteCover()
      onCoverChange(null)
    } catch {
      setError('Nu am putut șterge fotografia. Încearcă din nou.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={1.6}>
      <Box
        sx={{
          height: { xs: 140, md: 180 },
          borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
          border: `1px dashed ${DASHBOARD_TOKENS.border}`,
          bgcolor: DASHBOARD_TOKENS.accentWash,
          backgroundImage: coverUrl ? `url(${uploadUrl(coverUrl)})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {!coverUrl && (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem', px: 2, textAlign: 'center' }}>
            Fără fotografie, antetul rămâne o bandă în culorile firmei.
          </Typography>
        )}
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <Button
          variant="contained"
          disableElevation
          disabled={busy || !hasProfile}
          startIcon={<UploadRoundedIcon />}
          onClick={() => inputRef.current?.click()}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
        >
          {busy ? 'Se încarcă…' : coverUrl ? 'Schimbă fotografia' : 'Încarcă fotografia'}
        </Button>
        {coverUrl && (
          <Button
            variant="outlined"
            color="inherit"
            disabled={busy}
            startIcon={<DeleteOutlineRoundedIcon />}
            onClick={() => void removeCover()}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            Scoate
          </Button>
        )}
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

      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem' }}>
        PNG, JPG sau WEBP, maximum 5 MB, minimum {MIN_WIDTH}×{MIN_HEIGHT} px. Se salvează imediat,
        separat de restul paginii.
      </Typography>

      {!hasProfile && (
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>
          Salvează întâi datele firmei — fotografia se atașează profilului.
        </Typography>
      )}

      {error && (
        <Typography role="alert" sx={{ color: DASHBOARD_TOKENS.stateError, fontSize: '0.85rem', fontWeight: 600 }}>
          {error}
        </Typography>
      )}
    </Stack>
  )
}
