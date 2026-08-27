import { useEffect, useState } from 'react'
import { Alert, Box, CircularProgress, Dialog, IconButton, Stack, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'

import { documentService } from '../../services/document.service'
import { TOKENS } from '../../constants/tokens'

/**
 * Vizualizarea unui document, în aplicație.
 *
 * Până acum fiecare „Vezi" deschidea un tab nou cu un blob: pierdeai pagina pe care erai, iar pe
 * telefon tabul nou e practic o altă aplicație. Un document se consultă des și se descarcă rar —
 * inversul a ceea ce oferea interfața.
 *
 * Nu are nevoie de niciun endpoint public. Fișierul se ia cu aceeași cerere autorizată ca la
 * descărcare, iar `URL.createObjectURL` îi dă o adresă locală pe care `<iframe>` și `<img>` o pot
 * încărca. Planul prevedea un endpoint cu token HMAC; s-a dovedit inutil, iar o rută anonimă în
 * plus către fișierele clienților e exact ce nu merită adăugat fără motiv.
 */

interface DocumentViewerProps {
  /** `null` ține dialogul închis. */
  document: { id: string; fileName: string; contentType?: string | null } | null
  onClose: () => void
}

export function DocumentViewer({ document: target, onClose }: DocumentViewerProps) {
  if (!target) return null

  // Remontare la fiecare document: starea pornește curată, fără s-o resetăm noi într-un efect.
  // Un `setState` sincron într-un efect declanșează o a doua randare pentru ceva ce React poate
  // face singur dintr-o cheie.
  return <ViewerDialog key={target.id} target={target} onClose={onClose} />
}

function ViewerDialog({
  target,
  onClose,
}: {
  target: NonNullable<DocumentViewerProps['document']>
  onClose: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)

  /** Cât timp n-avem nici fișier, nici eroare, se încarcă. Derivat, nu ținut minte. */
  const loading = url === null && error === null

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    documentService
      .download(target.id)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        // Tipul vine de pe blob, nu din extensia numelui: un fișier redenumit „.pdf" tot imagine
        // rămâne, iar `<iframe>` ar fi afișat o pagină goală.
        setIsPdf(blob.type === 'application/pdf')
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut deschide documentul.')
      })

    return () => {
      cancelled = true
      // Adresa locală se eliberează la închidere. Fără asta, fiecare deschidere ar lăsa fișierul
      // în memoria filei până la reîncărcarea paginii.
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [target.id])

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      slotProps={{ paper: { sx: { height: { xs: '100%', sm: '90vh' }, borderRadius: { xs: 0, sm: `${TOKENS.radius.lg}px` } } } }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          px: 2,
          py: 1.2,
          borderBottom: `1px solid ${TOKENS.border}`,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{ flex: 1, minWidth: 0, fontWeight: 800, fontSize: '0.95rem', color: TOKENS.ink }}
          noWrap
        >
          {target.fileName}
        </Typography>

        {url && (
          <>
            <IconButton
              size="small"
              component="a"
              href={url}
              download={target.fileName}
              title="Descarcă"
            >
              <DownloadRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              component="a"
              href={url}
              target="_blank"
              rel="noopener"
              title="Deschide în tab nou"
            >
              <OpenInNewRoundedIcon fontSize="small" />
            </IconButton>
          </>
        )}

        <IconButton size="small" onClick={onClose} title="Închide">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center', bgcolor: TOKENS.surfaceAlt }}>
        {loading && <CircularProgress sx={{ color: TOKENS.primary }} />}

        {error && (
          <Alert severity="error" sx={{ m: 3, borderRadius: `${TOKENS.radius.md}px`, fontWeight: 600 }}>
            {error}
          </Alert>
        )}

        {url && !loading && !error && (
          isPdf ? (
            <Box
              component="iframe"
              src={url}
              title={target.fileName}
              sx={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <Box
              component="img"
              src={url}
              alt={target.fileName}
              sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          )
        )}
      </Box>
    </Dialog>
  )
}
