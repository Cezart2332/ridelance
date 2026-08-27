import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import { documentService } from '../../../services/document.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { TOKENS } from '../onboardingTheme'
import { openDocument } from '../../common/documentViewerBus'

/**
 * Generarea și descărcarea unui dosar PDF — o singură componentă pentru dosarul ARR și pentru
 * cel de copie conformă, pe toate ramurile (proprietate, leasing, comodat).
 *
 * Regulile care lipseau (spec fix-uri §9):
 *
 * - Generarea **așteaptă** răspunsul serverului. Bug-ul de dinainte era o avansare optimistă:
 *   ecranul trecea la „Am depus dosarul" fără să existe vreun PDF.
 * - La eroare, starea NU avansează: rămâne alerta și butonul de reîncercare.
 * - „Am depus dosarul" e blocat până când dosarul a fost generat **și** descărcat cel puțin o
 *   dată. Cine n-a descărcat n-are ce depune.
 */

/** Ce ține de dosar din starea serverului, indiferent de care dosar e vorba. */
export interface DossierView {
  hasDossier: boolean
  documentId: string | null
  generatedAtUtc: string | null
  submittedAtUtc: string | null
}

interface DossierPanelProps {
  dossier: DossierView
  /** Numele sub care se salvează PDF-ul pe disc. */
  fileName: string
  generate: () => Promise<unknown>
  markSubmitted: () => Promise<unknown>
  /** Reîncarcă starea de onboarding după o operație reușită. */
  onChanged: () => Promise<void>
}

export function DossierPanel({
  dossier,
  fileName,
  generate,
  markSubmitted,
  onChanged,
}: DossierPanelProps) {
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Descărcarea nu lasă urmă pe server, deci „a descărcat" se ține în sesiune. Un refresh cere
   * o nouă descărcare — corect: dosarul se descarcă înainte de drumul la agenție, nu cu o zi
   * înainte, iar costul unui click în plus e nul față de a marca depus un dosar inexistent.
   */
  const [downloaded, setDownloaded] = useState(false)

  const run = async (
    setBusy: (busy: boolean) => void,
    action: () => Promise<unknown>,
    fallback: string,
  ) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      await onChanged()
    } catch (err) {
      setError(getErrorMessage(err, fallback))
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    if (!dossier.documentId) return
    setDownloading(true)
    setError(null)
    try {
      await documentService.downloadAndSave(dossier.documentId, fileName)
      setDownloaded(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut descărca dosarul. Încearcă din nou.'))
    } finally {
      setDownloading(false)
    }
  }

  const preview = async () => {
    if (!dossier.documentId) return
    try {
      openDocument(dossier.documentId, fileName)
      // Deschiderea în tab e tot o vizualizare a documentului final: contează la fel de mult.
      setDownloaded(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut deschide dosarul.'))
    }
  }

  if (dossier.submittedAtUtc) {
    return (
      <Alert severity="success" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
        Dosarul e marcat ca depus. Din acest moment așteptăm răspunsul agenției.
      </Alert>
    )
  }

  return (
    <Stack spacing={2}>
      {error && (
        <Alert
          severity="error"
          role="alert"
          aria-live="polite"
          sx={{ borderRadius: `${TOKENS.radius.md}px` }}
        >
          {error}
        </Alert>
      )}

      {!dossier.hasDossier ? (
        <Button
          variant="contained"
          size="large"
          onClick={() => void run(setGenerating, generate, 'Nu am putut genera dosarul.')}
          disabled={generating}
          startIcon={generating ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ alignSelf: 'flex-start', py: 1.2, px: 3, fontWeight: 700, textTransform: 'none' }}
        >
          {generating ? 'Se generează dosarul...' : error ? 'Încearcă din nou' : 'Generează dosarul'}
        </Button>
      ) : (
        <>
          <Alert severity="success" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            Dosarul e gata. Deschide-l, verifică-l și descarcă-l înainte să mergi la agenție.
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              onClick={() => void preview()}
              startIcon={<VisibilityRoundedIcon />}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Previzualizează
            </Button>
            <Button
              variant="contained"
              onClick={() => void download()}
              disabled={downloading}
              startIcon={
                downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadRoundedIcon />
              }
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              {downloading ? 'Se descarcă...' : 'Descarcă dosarul (PDF)'}
            </Button>
          </Stack>

          <Button
            variant="contained"
            size="large"
            color="success"
            onClick={() =>
              void run(setSubmitting, markSubmitted, 'Nu am putut marca dosarul ca depus.')
            }
            disabled={submitting || !downloaded}
            sx={{ alignSelf: 'flex-start', py: 1.2, px: 3, fontWeight: 700, textTransform: 'none' }}
          >
            {submitting ? 'Se salvează...' : 'Am depus dosarul la ARR'}
          </Button>

          {!downloaded && (
            <Typography
              role="status"
              aria-live="polite"
              sx={{ fontSize: '0.82rem', color: TOKENS.textMuted }}
            >
              Descarcă dosarul ca să poți marca depunerea.
            </Typography>
          )}

          <Button
            onClick={() => void run(setGenerating, generate, 'Nu am putut regenera dosarul.')}
            disabled={generating}
            sx={{ alignSelf: 'flex-start', textTransform: 'none', color: TOKENS.textMuted }}
          >
            {generating ? 'Se regenerează...' : 'Regenerează dosarul'}
          </Button>
        </>
      )}
    </Stack>
  )
}
