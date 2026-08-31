import { useRef, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'

import { uploadUrl } from '../../../../../lib/api'
import { prepareCoverImage } from '../../../../../lib/imageProcessing'
import { companyService } from '../../../../../services/company.service'
import { DASHBOARD_TOKENS } from '../../../dashboardTheme'

/**
 * Fotografia din antetul mini-site-ului.
 *
 * Nu se refuză nicio imagine pentru că e prea mică. Se aduce ea la dimensiunea de care are
 * nevoie antetul, aici în browser, înainte de upload — vezi `lib/imageProcessing.ts`. Ce urcă
 * pe server e întotdeauna o imagine lată de cel puțin 1920 px, indiferent cu ce a pornit omul.
 *
 * Fără SVG, spre deosebire de logo — asta e o fotografie panoramică, nu o marcă vectorială.
 */

// Orice format pe care îl decodează browserul: oricum reîncodăm noi rezultatul, deci tipul
// fișierului ales nu mai contează pentru server.
const ACCEPT_ATTR = 'image/*'

/** Plafon pe fișierul *ales*, nu pe cel trimis: cel trimis e mereu mic, după procesare. */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024

interface CompanyCoverPanelProps {
  coverUrl: string | null
  /** Fotografia se atașează unui profil existent, deci prima salvare trebuie să fi avut loc. */
  hasProfile: boolean
  onCoverChange: (url: string | null) => void
}

export function CompanyCoverPanel({ coverUrl, hasProfile, onCoverChange }: CompanyCoverPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
    setBusy(true)
    try {
      const prepared = await prepareCoverImage(file)
      onCoverChange(await companyService.uploadCover(prepared.file))
      setNote(prepared.note)
    } catch (uploadError) {
      // Procesarea și uploadul eșuează din motive diferite, iar omul are nevoie să știe care:
      // la prima poate schimba fișierul, la a doua doar să mai încerce.
      setError(
        uploadError instanceof Error && uploadError.message === 'decode'
          ? 'Nu am putut citi imaginea. Formatul HEIC de pe iPhone nu e acceptat — exportă-o ca JPG.'
          : 'Nu am putut încărca fotografia. Încearcă din nou.',
      )
    } finally {
      setBusy(false)
    }
  }

  const removeCover = async () => {
    setBusy(true)
    setError(null)
    setNote(null)
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
          {busy ? 'Se pregătește…' : coverUrl ? 'Schimbă fotografia' : 'Încarcă fotografia'}
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
        Orice fotografie — o mărim și o pregătim noi pentru antet. Se salvează imediat, separat
        de restul paginii.
      </Typography>

      {note && (
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem', fontWeight: 600 }}>
          {note}
        </Typography>
      )}

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
