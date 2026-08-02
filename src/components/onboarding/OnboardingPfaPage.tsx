import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
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

type Locality = { nume: string }
type County = { auto: string; nume: string; localitati: Locality[] }

function redirectToInfiintarePayment() {
  const origin = window.location.origin
  stripeService.redirectToInfiintarePfa(
    `${origin}/onboarding?pfa_setup_paid=1&session_id={{CHECKOUT_SESSION_ID}}`,
    `${origin}/onboarding/pfa`,
  )
}

/** Documentele pasului PFA care au fost respinse (AI sau admin) și trebuie reîncărcate. */
const PFA_STEP_CATEGORIES: Record<string, string> = {
  Buletin: 'Buletin',
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
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const label = PFA_STEP_CATEGORIES[doc.category] ?? doc.category
  const reason =
    doc.aiStatus === 'Failed' && doc.aiSummary
      ? `respins la verificarea automată: ${doc.aiSummary}`
      : 'respins de echipa RIDElance.'

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    setUploadError(null)
    try {
      const uploadFile = await buildUploadFile(files, label)
      await documentService.upload(uploadFile, doc.category, pfaRegistrationId ?? undefined)
      setFiles([])
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
        files={files}
        onFilesChange={setFiles}
        disabled={uploading}
      />
      <Button
        variant="contained"
        disabled={files.length === 0 || uploading}
        onClick={handleUpload}
        sx={{
          alignSelf: 'flex-start',
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: `${TOKENS.radius.md}px`,
          px: 3,
          py: 1,
          color: '#fff',
          backgroundColor: TOKENS.primary,
          '&:hover': { backgroundColor: TOKENS.primaryStrong },
          '&.Mui-disabled': { backgroundColor: alpha(TOKENS.primary, 0.4), color: '#fff' },
        }}
      >
        {uploading ? 'Se încarcă...' : 'Salvează documentul'}
      </Button>
    </Stack>
  )
}

export default function OnboardingPfaPage() {
  const navigate = useNavigate()
  const { state, documents, refresh } = useOnboarding()

  const [tab, setTab] = useState(0) // 0 = Am PFA, 1 = Nu am PFA
  const [countiesData, setCountiesData] = useState<County[]>([])

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/virgil-av/judet-oras-localitati-romania/master/judete.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.judete) {
          setCountiesData(data.judete)
        }
      })
      .catch((err) => console.error('Failed to load counties:', err))
  }, [])

  // Secțiunea PFA e deja validată → shell-ul decide pasul următor.
  useEffect(() => {
    if (state?.pfaStatus === 'Approved') {
      navigate('/onboarding', { replace: true })
    }
  }, [state?.pfaStatus, navigate])

  // "Am PFA" form state — CUI-ul nu se mai tastează, se citește din certificat.
  const [amPfaName, setAmPfaName] = useState('')
  const [amPfaPhone, setAmPfaPhone] = useState('')
  const [certificateFiles, setCertificateFiles] = useState<File[]>([])

  // "Nu am PFA" form state
  const [buletinFiles, setBuletinFiles] = useState<File[]>([])
  const [durataContract, setDurataContract] = useState('3')
  const [strada, setStrada] = useState('')
  const [numar, setNumar] = useState('')
  const [oras, setOras] = useState('')
  const [judet, setJudet] = useState('')
  const [suntProprietar, setSuntProprietar] = useState(false)
  const [paymentPolicyAccepted, setPaymentPolicyAccepted] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryAfterReject, setRetryAfterReject] = useState(false)

  const availableCities = useMemo(() => {
    if (!judet || countiesData.length === 0) return []
    const selectedCounty = countiesData.find((c) => c.nume === judet)
    return selectedCounty ? selectedCounty.localitati.map((loc) => loc.nume).sort() : []
  }, [judet, countiesData])

  const handleSubmitNuAmPfa = async () => {
    setError(null)
    if (buletinFiles.length === 0 || !strada || !numar || !oras || !judet) {
      setError('Te rugam sa completezi adresa si sa incarci buletinul.')
      return
    }
    if (!state?.hasPaidInfiintare && !paymentPolicyAccepted) {
      setError('Te rugam sa accepti Politica de Plati si Abonamente pentru a continua.')
      return
    }

    try {
      setIsLoading(true)

      // 1. Create PFA record
      const pfaId = await pfaService.create({
        registrationType: 'NuAmPfa',
        contractDuration: parseInt(durataContract, 10),
        street: strada,
        number: numar,
        city: oras,
        county: judet,
        isOwner: suntProprietar,
      })

      // 2. Upload Documents (atestatul de șofer se cere la secțiunea „Autorizație transport”)
      if (buletinFiles.length > 0) {
        const buletin = await buildUploadFile(buletinFiles, 'Buletin')
        await documentService.upload(buletin, 'Buletin', pfaId)
      }

      // 3. Plata înființării (dacă nu e deja achitată), apoi înapoi la hub
      sessionStorage.setItem('pfa_registered', 'NuAmPfa')
      if (state?.hasPaidInfiintare) {
        navigate('/onboarding', { replace: true })
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
    if (certificateFiles.length === 0) {
      setError('Încarcă certificatul de înregistrare — din el citim CUI-ul PFA-ului tău.')
      return
    }

    setIsLoading(true)
    try {
      // Dosarul se creează întâi, ca documentul să aibă de ce să se lege; CUI-ul, denumirea și
      // codurile CAEN le completează OCR-ul din certificat.
      const pfaId = await pfaService.create({
        registrationType: 'AmPfa',
        fullName: amPfaName,
        phone: amPfaPhone,
        isOwner: false, // default
      })

      const certificate = await buildUploadFile(certificateFiles, 'Certificat de inregistrare')
      await documentService.upload(certificate, 'CertificatInregistrare', pfaId)

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
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mb: 3 }}>
          Dosarul tău a fost creat. Ca să pornim înființarea PFA-ului, mai e nevoie doar de achitarea
          serviciului de înființare.
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
    // Certificatul încărcat la „Am PFA" — arătăm ce am citit din el cât timp dosarul e în validare.
    const certificate = documents
      .filter((d) => d.category === 'CertificatInregistrare')
      .sort((a, b) => new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime())[0]

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
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', maxWidth: 440, mx: 'auto' }}>
          {state?.registrationType === 'NuAmPfa'
            ? 'Echipa RIDElance se ocupă de înființarea PFA-ului tău. Te anunțăm imediat ce este gata și se deblochează pasul următor.'
            : 'Echipa RIDElance îți verifică datele PFA-ului. Te anunțăm imediat ce dosarul este validat și se deblochează pasul următor.'}
        </Typography>

        {certificate && (
          <Box sx={{ mt: 3, textAlign: 'left' }}>
            <CertificateReadout document={certificate} />
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
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mb: 3, textAlign: 'center' }}>
            Selecteaza situatia ta actuala pentru a continua
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
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${TOKENS.radius.lg}px`,
                  backgroundColor: alpha(TOKENS.primary, 0.04),
                  border: `1px solid ${alpha(TOKENS.primary, 0.1)}`,
                }}
              >
                <Typography
                  sx={{
                    color: TOKENS.ink,
                    fontWeight: 650,
                    fontSize: '0.95rem',
                    lineHeight: 1.7,
                    textAlign: 'center',
                  }}
                >
                  Daca ai deja PFA inregistrat, completeaza formularul de mai jos sau contacteaza-ne la:{' '}
                  <Box
                    component="a"
                    href="mailto:contact@ridelance.ro"
                    sx={{
                      color: TOKENS.primary,
                      fontWeight: 700,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    contact@ridelance.ro
                  </Box>
                </Typography>
              </Paper>

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
                  <Typography sx={{ mt: 0.8, color: TOKENS.textMuted, fontSize: '0.8rem' }}>
                    Nu-ți mai cerem CUI-ul: îl citim din certificat, împreună cu denumirea PFA-ului și
                    codurile CAEN.
                  </Typography>
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
              <UploadField label="Buletin" files={buletinFiles} onFilesChange={setBuletinFiles} />

              <Box>
                <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                  Durata Contract de comodat
                </Typography>
                <Select
                  fullWidth
                  value={durataContract}
                  onChange={(e) => setDurataContract(e.target.value)}
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: `${TOKENS.radius.md}px`,
                    fontWeight: 500,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(TOKENS.ink, 0.18),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: TOKENS.primary,
                      borderWidth: 2,
                    },
                  }}
                >
                  <MenuItem value="1">1 an</MenuItem>
                  <MenuItem value="2">2 ani</MenuItem>
                  <MenuItem value="3">
                    3 ani
                    <Box
                      component="span"
                      sx={{
                        ml: 1,
                        px: 1.2,
                        py: 0.2,
                        borderRadius: 50,
                        backgroundColor: alpha(TOKENS.primary, 0.1),
                        color: TOKENS.primary,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      Recomandat
                    </Box>
                  </MenuItem>
                  <MenuItem value="4">4 ani</MenuItem>
                  <MenuItem value="5">5 ani</MenuItem>
                </Select>
              </Box>

              <Box>
                <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                  Adresa sediu
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 1.5 }}>
                    <TextField
                      fullWidth
                      placeholder="Strada"
                      value={strada}
                      onChange={(e) => setStrada(e.target.value)}
                      sx={inputSx}
                    />
                    <TextField
                      fullWidth
                      placeholder="Numar"
                      value={numar}
                      onChange={(e) => setNumar(e.target.value)}
                      sx={inputSx}
                    />
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                    <Select
                      fullWidth
                      displayEmpty
                      value={oras}
                      onChange={(e) => setOras(e.target.value)}
                      disabled={!judet || availableCities.length === 0}
                      MenuProps={{ sx: { '& .MuiPaper-root': { maxHeight: 250 } } }}
                      sx={{
                        backgroundColor: '#fff',
                        borderRadius: `${TOKENS.radius.md}px`,
                        fontWeight: 500,
                        color: oras ? TOKENS.ink : alpha(TOKENS.ink, 0.45),
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.18) },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: TOKENS.primary,
                          borderWidth: 2,
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        {judet ? 'Oras/Localitate' : 'Selecteaza Judet intai'}
                      </MenuItem>
                      {availableCities.map((city, index) => (
                        <MenuItem key={`${city}-${index}`} value={city}>
                          {city}
                        </MenuItem>
                      ))}
                    </Select>

                    <Select
                      fullWidth
                      displayEmpty
                      value={judet}
                      onChange={(e) => {
                        setJudet(e.target.value)
                        setOras('') // reset city when county changes
                      }}
                      MenuProps={{ sx: { '& .MuiPaper-root': { maxHeight: 250 } } }}
                      sx={{
                        backgroundColor: '#fff',
                        borderRadius: `${TOKENS.radius.md}px`,
                        fontWeight: 500,
                        color: judet ? TOKENS.ink : alpha(TOKENS.ink, 0.45),
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.18) },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: TOKENS.primary,
                          borderWidth: 2,
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        {countiesData.length === 0 ? 'Se incarca...' : 'Judet'}
                      </MenuItem>
                      {countiesData.map((c) => (
                        <MenuItem key={c.auto} value={c.nume}>
                          {c.nume}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Stack>
              </Box>

              <Box>
                <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                  Proprietar Sediu
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={suntProprietar}
                      onChange={(e) => setSuntProprietar(e.target.checked)}
                      sx={{
                        color: TOKENS.borderHover,
                        '&.Mui-checked': { color: TOKENS.primary },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', color: TOKENS.ink }}>
                      Sunt proprietar
                    </Typography>
                  }
                />
              </Box>

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
                {isLoading ? 'Se proceseaza...' : 'Trimite documentele'}
              </Button>
            </Stack>
          )}
        </Paper>
      )}
    </Stack>
  )
}
