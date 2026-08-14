import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import { Alert, Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState } from 'react'

import { documentService, type DocumentSummary } from '../../../services/document.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { buildUploadFile } from '../../../utils/imagesToPdf'
import { CertificateReadout } from '../CertificateReadout'
import { TOKENS } from '../onboardingTheme'
import { UploadField } from '../UploadField'

/**
 * Dosarul PFA e la admin. Nu e un ecran de întrebări, deci nu e un micro-pas: userul n-are nimic
 * de răspuns aici, doar de așteptat — și, dacă ceva a fost respins, de reîncărcat.
 */

/**
 * Documentele pasului PFA care au fost respinse (AI sau admin) și trebuie reîncărcate.
 * Cartea de identitate nu e aici: se încarcă la Eligibilitate și se reia de acolo.
 */
const PFA_STEP_CATEGORIES: Record<string, string> = {
  AtestatSofer: 'Atestat șofer',
}

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

function rejectedPfaDocs(documents: DocumentSummary[]): DocumentSummary[] {
  return Object.keys(PFA_STEP_CATEGORIES).flatMap((category) => {
    const newest = documents.filter((d) => d.category === category).sort(byNewest)[0]
    return newest && newest.status.toLowerCase() === 'rejected' ? [newest] : []
  })
}

function PfaDocReupload({
  doc,
  pfaRegistrationId,
  onUploaded,
}: {
  doc: DocumentSummary
  pfaRegistrationId?: string | null
  onUploaded: () => Promise<unknown>
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const label = PFA_STEP_CATEGORIES[doc.category] ?? doc.category
  const reason =
    doc.aiStatus === 'Failed' && doc.aiSummary
      ? `respins la verificarea automată: ${doc.aiSummary}`
      : 'respins de echipa RIDElance.'

  /** Documentul pleacă de îndată ce a fost ales — nu mai există un al doilea pas de confirmat. */
  const handleUpload = async (picked: File[]) => {
    if (picked.length === 0) return
    setUploading(true)
    setUploadError(null)
    try {
      const uploadFile = await buildUploadFile(picked, label)
      await documentService.upload(uploadFile, doc.category, pfaRegistrationId ?? undefined)
      await onUploaded()
    } catch (err) {
      setUploadError(getErrorMessage(err, 'Nu am putut încărca documentul. Încearcă din nou.'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
      <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
        Documentul „{label}” a fost {reason} Încarcă o variantă corectă mai jos.
      </Alert>
      {uploadError && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {uploadError}
        </Alert>
      )}
      <UploadField
        label={`Reîncarcă: ${label}`}
        onPick={(picked) => void handleUpload(picked)}
        disabled={uploading}
      />
      {uploading && (
        <Typography sx={{ fontSize: '0.82rem', color: TOKENS.textMuted, fontWeight: 600 }}>
          Se încarcă…
        </Typography>
      )}
    </Stack>
  )
}

export function PfaPendingCard({
  documents,
  pfaRegistrationId,
  onRefresh,
}: {
  documents: DocumentSummary[]
  pfaRegistrationId?: string | null
  onRefresh: () => Promise<unknown>
}) {
  const rejectedDocs = rejectedPfaDocs(documents)
  const newestOf = (category: string) =>
    documents.filter((d) => d.category === category).sort(byNewest)[0]

  const certificate = newestOf('CertificatInregistrare')
  const constatator = newestOf('CertificatConstatator')

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 5 },
        borderRadius: `${TOKENS.radius.xl}px`,
        border: `1px solid ${TOKENS.border}`,
        boxShadow: TOKENS.shadow.md,
        backgroundColor: TOKENS.paper,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(TOKENS.pendingBase, 0.1),
          mx: 'auto',
          mb: 2,
        }}
      >
        <HourglassTopRoundedIcon sx={{ fontSize: 30, color: TOKENS.pending }} />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: TOKENS.ink, mb: 1 }}>
        Dosarul tău PFA este în validare
      </Typography>

      {certificate && (
        <Box sx={{ mt: 3, textAlign: 'left' }}>
          <CertificateReadout document={certificate} />
        </Box>
      )}

      {constatator && (
        <Box sx={{ mt: 2, textAlign: 'left' }}>
          <CertificateReadout
            document={constatator}
            title="Am citit din certificatul constatator"
            verifyWithAnaf={false}
          />
        </Box>
      )}

      {rejectedDocs.length > 0 && (
        <Stack spacing={3} sx={{ mt: 3 }}>
          {rejectedDocs.map((doc) => (
            <PfaDocReupload
              key={doc.id}
              doc={doc}
              pfaRegistrationId={pfaRegistrationId}
              onUploaded={onRefresh}
            />
          ))}
        </Stack>
      )}
    </Paper>
  )
}
