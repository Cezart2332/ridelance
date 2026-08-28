import { useEffect, useRef, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import DrawRoundedIcon from '@mui/icons-material/DrawRounded'

import { SignaturePad, type SignatureResult } from '../../../onboarding/companyFormation/SignaturePad'
import { companyService } from '../../../../services/company.service'
import { documentService } from '../../../../services/document.service'
import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { Panel } from '../../ui'

/**
 * Specimenul de semnătură al firmei.
 *
 * Se desenează o dată aici și se tipărește apoi pe fiecare contract și proces-verbal generat, pe
 * linia proprietarului. Altfel proprietarul ar fi trebuit să printeze, să semneze și să scaneze
 * fiecare document — pentru o semnătură care e de fiecare dată aceeași.
 *
 * Nu se încarcă dintr-un fișier, se desenează: o poză cu o semnătură de pe alt act e exact felul
 * de imagine pe care n-o vrem urcată aici.
 */

interface CompanySignaturePanelProps {
  /** Specimenul salvat, sau `null` dacă nu există încă. */
  signatureDocumentId: string | null
  /** Semnătura se atașează unui profil existent, deci prima salvare trebuie să fi avut loc. */
  hasProfile: boolean
  onSignatureChange: (documentId: string | null) => void
}

export function CompanySignaturePanel({
  signatureDocumentId,
  hasProfile,
  onSignatureChange,
}: CompanySignaturePanelProps) {
  const [drawing, setDrawing] = useState(false)
  const [signature, setSignature] = useState<SignatureResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Previzualizarea se ține împreună cu id-ul din care a ieșit, ca la o schimbare de semnătură să
  // nu se afișeze o clipă imaginea veche sub id-ul nou.
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null)

  const objectUrlRef = useRef<string | null>(null)

  // Specimenul e un document criptat: se cere cu sesiunea, nu se poate pune direct într-un `src`.
  useEffect(() => {
    if (!signatureDocumentId) return

    let cancelled = false

    void documentService
      .download(signatureDocumentId)
      .then((blob) => {
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        objectUrlRef.current = url
        setPreview({ id: signatureDocumentId, url })
      })
      .catch(() => undefined)

    // `blob:` URL-urile trăiesc până sunt revocate explicit; fără asta, fiecare schimbare de
    // semnătură ar lăsa în urmă un fișier ținut în memorie până la refresh.
    return () => {
      cancelled = true
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [signatureDocumentId])

  const save = async () => {
    if (!signature) return

    setSaving(true)
    setError(null)
    try {
      const id = await companyService.saveSignature(signature.image)
      onSignatureChange(id)
      setDrawing(false)
      setSignature(null)
    } catch {
      setError('Nu am putut salva semnătura. Încearcă din nou.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setSaving(true)
    setError(null)
    try {
      await companyService.deleteSignature()
      onSignatureChange(null)
    } catch {
      setError('Nu am putut șterge semnătura. Încearcă din nou.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel
      title="Semnătura firmei"
      subtitle="Se tipărește pe linia proprietarului, pe fiecare contract și proces-verbal generat de aici înainte."
    >
      <Stack spacing={2.5}>
        {!hasProfile && (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>
            Salvează întâi datele firmei — semnătura se atașează profilului.
          </Typography>
        )}

        {!drawing && (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}>
            <Box
              sx={{
                width: 220,
                height: 84,
                display: 'grid',
                placeItems: 'center',
                border: `1px dashed ${DASHBOARD_TOKENS.border}`,
                borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
                px: 1.5,
              }}
            >
              {preview?.id === signatureDocumentId ? (
                <Box
                  component="img"
                  src={preview.url}
                  alt="Semnătura firmei"
                  sx={{ maxWidth: '100%', maxHeight: 68, objectFit: 'contain' }}
                />
              ) : (
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem' }}>
                  Nicio semnătură
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Button
                variant="contained"
                disableElevation
                disabled={saving || !hasProfile}
                startIcon={<DrawRoundedIcon />}
                onClick={() => setDrawing(true)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
              >
                {signatureDocumentId ? 'Schimbă semnătura' : 'Adaugă semnătura'}
              </Button>
              {signatureDocumentId && (
                <Button
                  variant="text"
                  disabled={saving}
                  onClick={() => void remove()}
                  sx={{ textTransform: 'none', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}
                >
                  Șterge
                </Button>
              )}
            </Stack>
          </Stack>
        )}

        {drawing && (
          <Stack spacing={1.5}>
            <SignaturePad onChange={setSignature} disabled={saving} />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                disableElevation
                disabled={saving || signature === null}
                onClick={() => void save()}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
              >
                {saving ? 'Se salvează…' : 'Salvează semnătura'}
              </Button>
              <Button
                variant="text"
                disabled={saving}
                onClick={() => {
                  setDrawing(false)
                  setSignature(null)
                }}
                sx={{ textTransform: 'none', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}
              >
                Renunță
              </Button>
            </Stack>
          </Stack>
        )}

        {error && (
          <Typography role="alert" sx={{ color: DASHBOARD_TOKENS.stateError, fontSize: '0.85rem', fontWeight: 600 }}>
            {error}
          </Typography>
        )}

        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem' }}>
          Documentele deja generate nu se schimbă. Semnătura nouă intră pe cele generate de acum
          înainte.
        </Typography>
      </Stack>
    </Panel>
  )
}
