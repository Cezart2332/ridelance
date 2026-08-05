import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { documentService, type DocumentSummary } from '../../services/document.service'
import { pfaService } from '../../services/pfa.service'
import { stripeService } from '../../services/stripe.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { buildUploadFile } from '../../utils/imagesToPdf'
import { PaymentPolicyAcceptance } from '../common/PaymentPolicyAcceptance'
import { CertificateReadout } from './CertificateReadout'
import { TOKENS, inputSx } from './onboardingTheme'
import { UploadField } from './UploadField'
import { useOnboarding } from './useOnboarding'

/** Etapa dosarului de înființare → ruta ei. Necunoscut înseamnă „de la început". */
function companyFormationPath(stage: string | null): string {
  switch (stage) {
    case 'RegisteredOffice':
      return '/onboarding/pfa/sediu'
    case 'Consent':
      return '/onboarding/pfa/consimtamant'
    default:
      return '/onboarding/pfa/date-personale'
  }
}

function redirectToInfiintarePayment() {
  const origin = window.location.origin
  stripeService.redirectToInfiintarePfa(
    `${origin}/onboarding?pfa_setup_paid=1&session_id={{CHECKOUT_SESSION_ID}}`,
    `${origin}/onboarding/pfa`,
  )
}

/**
 * Documentele pasului PFA care au fost respinse (AI sau admin) și trebuie reîncărcate.
 * Cartea de identitate nu e aici: se încarcă la Eligibilitate și se reia de acolo.
 */
const PFA_STEP_CATEGORIES: Record<string, string> = {
  AtestatSofer: 'Atestat șofer',
}

function rejectedPfaDocs(documents: DocumentSummary[]): DocumentSummary[] {
  return Object.keys(PFA_STEP_CATEGORIES).flatMap((category) => {
    const newest = documents
      .filter((d) => d.category === category)
      .sort((a, b) => new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime())[0]
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

export default function OnboardingPfaPage() {
  const navigate = useNavigate()
  const { state, documents, refresh } = useOnboarding()

  const [tab, setTab] = useState(0) // 0 = Am PFA, 1 = Nu am PFA

  // Secțiunea PFA e deja validată → shell-ul decide pasul următor.
  useEffect(() => {
    if (state?.pfaStatus === 'Approved') {
      navigate('/onboarding', { replace: true })
    }
  }, [state?.pfaStatus, navigate])

  // Ramura „Nu am PFA": după plată, pasul continuă în dosarul de înființare, de unde a rămas.
  // Cât timp dosarul nu e semnat, nu are ce valida adminul.
  const formationStatus = state?.companyFormationStatus ?? null
  const formationStage = state?.companyFormationStage ?? null

  useEffect(() => {
    if (state?.registrationType !== 'NuAmPfa' || !state.hasPaidInfiintare) return
    if (formationStatus !== null && formationStatus !== 'Draft' && formationStatus !== 'InfoRequested') return

    navigate(companyFormationPath(formationStage), { replace: true })
  }, [state?.registrationType, state?.hasPaidInfiintare, formationStatus, formationStage, navigate])

  // „Am PFA": se cer aceleași acte pe care le-am fi primit de la Consulto la înființare.
  // Nimic nu se tastează — CUI-ul, denumirea, CAEN-ul și sediul le citește OCR-ul din ele.
  const [amPfaName, setAmPfaName] = useState('')
  const [amPfaPhone, setAmPfaPhone] = useState('')
  const [certificateFiles, setCertificateFiles] = useState<File[]>([])
  const [constatatorFiles, setConstatatorFiles] = useState<File[]>([])
  const [rezolutieFiles, setRezolutieFiles] = useState<File[]>([])
  const [alteActeFiles, setAlteActeFiles] = useState<File[]>([])

  // „Nu am PFA": aici se deschide doar dosarul. Cartea de identitate e deja încărcată la
  // Eligibilitate, iar restul datelor se completează în dosarul de înființare.
  const [paymentPolicyAccepted, setPaymentPolicyAccepted] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryAfterReject, setRetryAfterReject] = useState(false)

  const handleSubmitNuAmPfa = async () => {
    setError(null)
    if (!state?.hasPaidInfiintare && !paymentPolicyAccepted) {
      setError('Te rugam sa accepti Politica de Plati si Abonamente pentru a continua.')
      return
    }

    try {
      setIsLoading(true)

      // Dosarul se deschide gol: datele vin din etapele următoare, documentele de la Eligibilitate.
      // `isOwner` rămâne pe fals — proprietarul imobilului se declară în etapa de sediu.
      await pfaService.create({ registrationType: 'NuAmPfa', isOwner: false })

      // 2. Plata înființării (dacă nu e deja achitată), apoi înapoi la hub
      sessionStorage.setItem('pfa_registered', 'NuAmPfa')
      if (state?.hasPaidInfiintare) {
        navigate('/onboarding/pfa/date-personale', { replace: true })
      } else {
        redirectToInfiintarePayment()
      }
    } catch (err) {
      console.error(err)
      setError(getErrorMessage(err, 'A aparut o eroare la inregistrare. Te rugam sa incerci din nou.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitAmPfa = async () => {
    setError(null)
    if (!amPfaName || !amPfaPhone) {
      setError('Te rugam sa completezi toate campurile.')
      return
    }
    if (certificateFiles.length === 0 || constatatorFiles.length === 0) {
      setError(
        'Încarcă certificatul de înregistrare și certificatul constatator — pe amândouă le cere ARR.',
      )
      return
    }

    setIsLoading(true)
    try {
      // Dosarul se creează întâi, ca documentele să aibă de ce se lega; CUI-ul, denumirea,
      // codurile CAEN și sediul le completează OCR-ul din certificate.
      const pfaId = await pfaService.create({
        registrationType: 'AmPfa',
        fullName: amPfaName,
        phone: amPfaPhone,
        isOwner: false, // default
      })

      // Rezoluția și restul actelor sunt opționale: nu blochează fluxul dacă cele două
      // certificate conțin ce trebuie. Se păstrează pentru arhiva dosarului.
      const uploads: [File[], string, string][] = [
        [certificateFiles, 'CertificatInregistrare', 'Certificat de inregistrare'],
        [constatatorFiles, 'CertificatConstatator', 'Certificat constatator'],
        [rezolutieFiles, 'RezolutieOnrc', 'Rezolutie ONRC'],
        [alteActeFiles, 'AlteDocumenteInfiintare', 'Alte documente infiintare'],
      ]

      for (const [files, category, label] of uploads) {
        if (files.length === 0) continue
        const file = await buildUploadFile(files, label)
        await documentService.upload(file, category, pfaId)
      }

      // Dosarul intră la validarea adminului — userul așteaptă în hub
      sessionStorage.setItem('pfa_registered', 'AmPfa')
      await refresh()
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'A aparut o eroare. Te rugam sa incerci din nou.'))
    } finally {
      setIsLoading(false)
    }
  }

  const isPending = state?.pfaStatus === 'Pending'
  const isRejected = state?.pfaStatus === 'Rejected'
  const needsPayment = isPending && state?.registrationType === 'NuAmPfa' && !state.hasPaidInfiintare

  // ── Dosar trimis, plata înființării încă neconfirmată ──
  if (needsPayment) {
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
        <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: TOKENS.ink, mb: 1 }}>
          Finalizează plata pentru Înființare PFA
        </Typography>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={redirectToInfiintarePayment}
          sx={{
            py: 1.3,
            px: 4,
            fontWeight: 700,
            borderRadius: `${TOKENS.radius.md}px`,
            color: '#fff',
            backgroundColor: TOKENS.primary,
            boxShadow: TOKENS.shadow.glow,
            '&:hover': { backgroundColor: TOKENS.primaryStrong },
          }}
        >
          Plătește înființarea
        </Button>
      </Paper>
    )
  }

  // ── Dosar trimis, în validare la admin ──
  if (isPending) {
    const rejectedDocs = rejectedPfaDocs(documents)

    // Ce am citit din actele ONRC încărcate la „Am PFA", cât timp dosarul e în validare.
    const newestOf = (category: string) =>
      documents
        .filter((d) => d.category === category)
        .sort((a, b) => new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime())[0]

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
                pfaRegistrationId={state?.pfaRegistrationId}
                onUploaded={refresh}
              />
            ))}
          </Stack>
        )}
      </Paper>
    )
  }

  // ── Formularul (dosar nou sau reluare după respingere) ──
  return (
    <Stack spacing={3}>
      {isRejected && !retryAfterReject && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: `${TOKENS.radius.xl}px`,
            border: `1px solid ${alpha('#d32f2f', 0.25)}`,
            backgroundColor: TOKENS.paper,
          }}
        >
          <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px`, mb: 2 }}>
            Dosarul tău PFA a fost respins.
            {state?.pfaReviewNote ? ` Motiv: ${state.pfaReviewNote}` : ''}
          </Alert>
          <Button
            variant="contained"
            onClick={() => setRetryAfterReject(true)}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: `${TOKENS.radius.md}px`,
              color: '#fff',
              backgroundColor: TOKENS.primary,
              '&:hover': { backgroundColor: TOKENS.primaryStrong },
            }}
          >
            Completează din nou
          </Button>
        </Paper>
      )}

      {(!isRejected || retryAfterReject) && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: `${TOKENS.radius.xl}px`,
            border: `1px solid ${TOKENS.border}`,
            boxShadow: TOKENS.shadow.md,
            backgroundColor: TOKENS.paper,
          }}
        >
          <Typography
            sx={{ fontWeight: 800, fontSize: '1.3rem', color: TOKENS.ink, mb: 1, textAlign: 'center' }}
          >
            Pasul 1: PFA
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: `${TOKENS.radius.md}px` }}>
              {error}
            </Alert>
          )}

          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v)
              setError(null)
            }}
            variant="fullWidth"
            sx={{
              mb: 4,
              backgroundColor: alpha(TOKENS.ink, 0.03),
              borderRadius: `${TOKENS.radius.md}px`,
              p: 0.5,
              '& .MuiTabs-indicator': {
                backgroundColor: TOKENS.primary,
                height: 3,
                borderRadius: 2,
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: TOKENS.textMuted,
                '&.Mui-selected': { color: TOKENS.primary },
              },
            }}
          >
            <Tab label="Am PFA" />
            <Tab label="Nu am PFA" />
          </Tabs>

          {tab === 0 ? (
            /* ── AM PFA ── */
            <Stack spacing={3}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Certificatul de înregistrare al PFA-ului
                  </Typography>
                  <UploadField
                    label="Încarcă certificatul de înregistrare"
                    files={certificateFiles}
                    onFilesChange={setCertificateFiles}
                    disabled={isLoading}
                  />
                </Box>
                <Box>
                  <UploadField
                    label="Certificat constatator ONRC"
                    files={constatatorFiles}
                    onFilesChange={setConstatatorFiles}
                    disabled={isLoading}
                  />
                </Box>
                <Box>
                  <UploadField
                    label="Rezoluția ONRC (opțional)"
                    files={rezolutieFiles}
                    onFilesChange={setRezolutieFiles}
                    disabled={isLoading}
                  />
                </Box>
                <Box>
                  <UploadField
                    label="Alte acte de la înființare (opțional)"
                    files={alteActeFiles}
                    onFilesChange={setAlteActeFiles}
                    disabled={isLoading}
                  />
                </Box>
                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Nume complet
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Numele tau"
                    value={amPfaName}
                    onChange={(e) => setAmPfaName(e.target.value)}
                    sx={inputSx}
                  />
                </Box>
                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Telefon
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="07XX XXX XXX"
                    type="tel"
                    value={amPfaPhone}
                    onChange={(e) => setAmPfaPhone(e.target.value)}
                    sx={inputSx}
                  />
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isLoading}
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={handleSubmitAmPfa}
                  sx={{
                    mt: 1,
                    py: 1.4,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: `${TOKENS.radius.md}px`,
                    color: '#fff',
                    backgroundColor: TOKENS.primary,
                    boxShadow: TOKENS.shadow.glow,
                    '&:hover': {
                      backgroundColor: TOKENS.primaryStrong,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {isLoading ? 'Se incarca...' : 'Trimite datele'}
                </Button>
              </Stack>
            </Stack>
          ) : (
            /* ── NU AM PFA ── */
            <Stack spacing={2.5}>
              {!state?.hasPaidInfiintare && (
                <PaymentPolicyAcceptance
                  checked={paymentPolicyAccepted}
                  onChange={setPaymentPolicyAccepted}
                  disabled={isLoading}
                />
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading || (!state?.hasPaidInfiintare && !paymentPolicyAccepted)}
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={handleSubmitNuAmPfa}
                sx={{
                  mt: 1,
                  py: 1.4,
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: `${TOKENS.radius.md}px`,
                  color: '#fff',
                  backgroundColor: TOKENS.primary,
                  boxShadow: TOKENS.shadow.glow,
                  '&:hover': {
                    backgroundColor: TOKENS.primaryStrong,
                    transform: 'translateY(-1px)',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: alpha(TOKENS.primary, 0.6),
                    color: '#fff',
                  },
                }}
              >
                {/* Nu se mai trimit documente aici: urmează plata, apoi completarea dosarului. */}
                {isLoading
                  ? 'Se proceseaza...'
                  : state?.hasPaidInfiintare
                    ? 'Continuă spre completarea dosarului'
                    : 'Continuă spre plată'}
              </Button>
            </Stack>
          )}
        </Paper>
      )}
    </Stack>
  )
}
