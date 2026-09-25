import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import {
  companyFormationService,
  emptyAdresa,
  emptyPersoana,
  type ConsultoOffice,
  type LegalConsentFlow,
  type PersoanaFizica,
} from '../../services/companyFormation.service'
import { ONE_TIME_SERVICES, stripeService, type ServiceKey } from '../../services/stripe.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { PaymentPolicyAcceptance } from '../common/PaymentPolicyAcceptance'
import { TermsAcceptance } from '../common/TermsAcceptance'
import { PanelCard } from '../onboarding/PanelCard'
import { ConsentWizard } from '../onboarding/companyFormation/ConsentWizard'
import { OfficeZonePicker } from '../onboarding/companyFormation/OfficeZonePicker'
import { PersoanaFizicaForm } from '../onboarding/companyFormation/PersoanaFizicaForm'
import { RegisteredOfficeForm, type RegisteredOfficeValue } from '../onboarding/companyFormation/RegisteredOfficeForm'
import { missingOfficeFields } from '../onboarding/companyFormation/officeRules'
import { SignaturePad, type SignatureResult } from '../onboarding/companyFormation/SignaturePad'
import { isValidCnp } from '../onboarding/companyFormation/cnp'
import { onboardingMuiTheme } from '../onboarding/onboardingMuiTheme'
import { TOKENS, displaySx, inputSx } from '../onboarding/onboardingTheme'

/**
 * Comanda unui serviciu individual, cu formularul lui — aceleași ecrane ca ramura „Nu am PFA"
 * din onboarding, fără cont.
 *
 * Înființarea PFA și Start Ride: datele tale, sediul social, acordul semnat. Găzduirea sediului:
 * datele titularului și zona din lista Consulto. La final plata; după ea dosarul pleacă singur
 * la Consulto. Nimic nu se salvează înainte de plată — serverul primește formularul întreg și
 * îl refuză dacă lipsește ceva, înainte să deschidă plata.
 */

type StepId = 'contact' | 'persoana' | 'sediu' | 'acord' | 'plata'

const STEP_TITLES: Record<StepId, string> = {
  contact: 'Cum te contactăm',
  persoana: 'Datele tale',
  sediu: 'Sediul social',
  acord: 'Acord de consimțământ',
  plata: 'Plata',
}

const FORMATION_STEPS: StepId[] = ['contact', 'persoana', 'sediu', 'acord', 'plata']
const HOSTING_STEPS: StepId[] = ['contact', 'persoana', 'sediu', 'plata']

/** Ce primește omul, spus pe primul ecran. Aceleași promisiuni ca pe card, cu pașii de după. */
const SERVICE_INTRO: Record<ServiceKey, string[]> = {
  infiintare_pfa: [
    'Completezi aici datele personale, sediul social și acordul, exact ca în aplicație.',
    'După plată, dosarul pleacă automat la Consulto, partenerul nostru pentru înființare. De ONRC și ANAF se ocupă ei.',
  ],
  start_ride: [
    'Include deschiderea PFA-ului și înregistrarea în scopuri de TVA intracomunitar.',
    'Completezi aici datele personale, sediul social și acordul, exact ca în aplicație. După plată, dosarul pleacă automat la Consulto.',
    'Taxele ARR nu sunt incluse.',
  ],
  sediu_social: [
    'Găzduirea sediului social pentru PFA, printr-o adresă pusă la dispoziție de Consulto. Tarif anual.',
    'Alegi zona. Adresa exactă și contractul de găzduire vin de la Consulto după validarea datelor.',
  ],
}

const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

interface IdentityDocument {
  fileName: string
  contentType: string
  data: string
}

export interface ServiceOrderContact {
  name: string
  email: string
  phone: string
}

interface ServiceOrderWizardProps {
  open: boolean
  serviceKey: ServiceKey | null
  onClose: () => void
  /** Din dashboard: datele de contact ale contului, ca omul să nu le mai scrie. */
  contact?: Partial<ServiceOrderContact>
  /** Unde se întoarce plata. Implicit pagina de servicii de pe site. */
  successUrl?: string
  cancelUrl?: string
}

const emptyOffice = (): RegisteredOfficeValue => ({
  office: {
    type: null,
    consultoOfficeId: null,
    isOwner: null,
    adresa: emptyAdresa(),
    acknowledgedOwnershipDocs: false,
    acknowledgedSubmitLater: false,
    acknowledgedOwnerConsent: null,
  },
  owners: [],
})

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Aceleași condiții ca pe server (`PersoanaFizica.IsComplete` + CNP valid). */
function personMissing(p: PersoanaFizica): string[] {
  const missing: string[] = []
  if (!p.nume?.trim()) missing.push('numele')
  if (!p.prenume?.trim()) missing.push('prenumele')
  if (!p.cnp || !isValidCnp(p.cnp)) missing.push('un CNP valid')
  if ((p.tipAct === 'CI' || p.tipAct === 'BI') && !p.serieAct?.trim()) missing.push('seria actului')
  if (!p.numarAct?.trim()) missing.push('numărul actului')
  if (!p.autoritateEmitenta?.trim()) missing.push('autoritatea emitentă')
  if (!p.dataEmiterii) missing.push('data emiterii')
  if (!p.dataExpirarii) missing.push('data expirării')
  const d = p.domiciliu
  if (!d.judet || !d.localitate || !d.strada || !d.numar) missing.push('domiciliul complet')
  return missing
}

/** Aceleași condiții ca `CompanyFormationRequest.RegisteredOfficeComplete`. */
function officeComplete({ office, owners }: RegisteredOfficeValue): boolean {
  if (office.type === 'ConsultoProvided') return office.consultoOfficeId !== null
  if (office.type !== 'Own') return false
  if (missingOfficeFields(office.adresa).length > 0) return false
  if (office.isOwner === null || !office.acknowledgedOwnershipDocs || !office.acknowledgedSubmitLater) return false
  if (office.isOwner) return true
  return office.acknowledgedOwnerConsent === true && owners.length > 0 && owners.every((o) => personMissing(o.persoana).length === 0)
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ServiceOrderWizard(props: ServiceOrderWizardProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <ThemeProvider theme={onboardingMuiTheme}>
      <Dialog
        open={props.open && props.serviceKey !== null}
        onClose={props.onClose}
        fullScreen={fullScreen}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { backgroundColor: TOKENS.surface, borderRadius: fullScreen ? 0 : `${TOKENS.radius.xl}px` } } }}
      >
        {/* Cheia pe serviciu: alt serviciu = formular gol, nu datele rămase de la precedentul. */}
        {props.serviceKey && <WizardBody key={props.serviceKey} {...props} serviceKey={props.serviceKey} />}
      </Dialog>
    </ThemeProvider>
  )
}

function WizardBody({
  serviceKey,
  onClose,
  contact: initialContact,
  successUrl,
  cancelUrl,
}: ServiceOrderWizardProps & { serviceKey: ServiceKey }) {
  const service = ONE_TIME_SERVICES.find((s) => s.key === serviceKey)
  const hosting = serviceKey === 'sediu_social'
  const steps = hosting ? HOSTING_STEPS : FORMATION_STEPS

  const [stepIndex, setStepIndex] = useState(0)
  const [contact, setContact] = useState<ServiceOrderContact>({
    name: initialContact?.name ?? '',
    email: initialContact?.email ?? '',
    phone: initialContact?.phone ?? '',
  })
  const [solicitant, setSolicitant] = useState<PersoanaFizica>(emptyPersoana())
  const [identityDocument, setIdentityDocument] = useState<IdentityDocument | null>(null)
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [officeValue, setOfficeValue] = useState<RegisteredOfficeValue>(emptyOffice())
  const [company, setCompany] = useState({ name: '', cui: '' })
  const [consentDone, setConsentDone] = useState(false)
  const [signature, setSignature] = useState<SignatureResult | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [offices, setOffices] = useState<ConsultoOffice[] | null>(null)
  const [flow, setFlow] = useState<LegalConsentFlow | null>(null)
  const [catalogError, setCatalogError] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      companyFormationService.getConsultoOffices(),
      hosting ? Promise.resolve(null) : companyFormationService.getConsentFlow(),
    ])
      .then(([list, consent]) => {
        if (cancelled) return
        setOffices(list)
        setFlow(consent)
      })
      .catch(() => {
        if (!cancelled) setCatalogError(true)
      })
    return () => {
      cancelled = true
    }
  }, [hosting])

  // Pasul nou începe de sus, nu de unde a rămas derularea celui vechi.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [stepIndex])

  const step = steps[stepIndex]

  const contactMissing = useMemo(() => {
    const missing: string[] = []
    if (!contact.name.trim()) missing.push('numele')
    if (!EMAIL.test(contact.email.trim())) missing.push('un email valid')
    if (contact.phone.replace(/\D/g, '').length < 10) missing.push('telefonul')
    return missing
  }, [contact])

  const persoanaMissing = useMemo(() => {
    const missing = personMissing(solicitant)
    if (!identityDocument) missing.push('copia actului de identitate')
    return missing
  }, [solicitant, identityDocument])

  const sediuReady = hosting ? officeValue.office.consultoOfficeId !== null : officeComplete(officeValue)

  const reasons: Record<StepId, string[]> = {
    contact: contactMissing,
    persoana: persoanaMissing,
    sediu: sediuReady ? [] : [hosting ? 'zona sediului' : 'datele sediului și bifele'],
    acord: consentDone && signature ? [] : [consentDone ? 'semnătura' : 'acceptarea declarațiilor'],
    plata: termsAccepted && policyAccepted ? [] : ['acceptarea termenilor și a politicii de plăți'],
  }

  const missing = reasons[step]
  const isLast = stepIndex === steps.length - 1

  const pickDocument = async (file: File | undefined) => {
    setDocumentError(null)
    if (!file) return
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      setDocumentError('Încarcă o poză (JPG, PNG, WebP) sau un PDF.')
      return
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setDocumentError('Fișierul are peste 10 MB. Fă o poză mai mică sau un PDF comprimat.')
      return
    }
    setIdentityDocument({ fileName: file.name, contentType: file.type, data: await readAsDataUrl(file) })
  }

  const pay = async () => {
    setSubmitting(true)
    setError(null)
    const { office, owners } = officeValue
    try {
      await stripeService.redirectToPublicService(
        serviceKey,
        { customerName: contact.name.trim(), customerEmail: contact.email.trim(), customerPhone: contact.phone.trim() },
        {
          solicitant: { ...solicitant },
          office: hosting
            ? {
                type: 'ConsultoProvided',
                consultoOfficeId: office.consultoOfficeId,
                acknowledgedOwnershipDocs: false,
                acknowledgedSubmitLater: false,
                owners: [],
              }
            : {
                type: office.type,
                consultoOfficeId: office.consultoOfficeId,
                isOwner: office.isOwner,
                adresa: office.adresa,
                acknowledgedOwnershipDocs: office.acknowledgedOwnershipDocs,
                acknowledgedSubmitLater: office.acknowledgedSubmitLater,
                acknowledgedOwnerConsent: office.acknowledgedOwnerConsent,
                owners: owners.map((o) => ({ id: o.id, persoana: o.persoana })),
              },
          companyName: hosting ? company.name.trim() || null : null,
          companyCui: hosting ? company.cui.trim() || null : null,
          identityDocument: identityDocument!,
          signature:
            !hosting && signature
              ? {
                  signatureImage: signature.image,
                  signatureVector: JSON.stringify(signature.strokes),
                  canvasWidth: signature.canvasWidth,
                  canvasHeight: signature.canvasHeight,
                  consents: (flow?.steps ?? []).map((s) => ({ stepKey: s.key })),
                }
              : null,
        },
        { successUrl, cancelUrl },
      )
    } catch (err) {
      // Mesajul serverului spune exact ce lipsește (CNP invalid, act expirat, zonă indisponibilă).
      setError(getErrorMessage(err, 'Nu am putut deschide plata. Încearcă din nou.'))
      setSubmitting(false)
    }
  }

  const next = () => {
    if (missing.length > 0) return
    if (isLast) {
      void pay()
      return
    }
    setStepIndex((i) => i + 1)
  }

  return (
    <>
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: { xs: 'calc(14px + var(--sat))', sm: 2.5 },
          pb: 2,
          borderBottom: `1px solid ${TOKENS.border}`,
          backgroundColor: TOKENS.paper,
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ ...displaySx, fontWeight: 800, fontSize: { xs: '1.15rem', sm: '1.3rem' }, color: TOKENS.ink }}>
              {service?.title}
            </Typography>
            <Typography sx={{ color: TOKENS.primaryStrong, fontWeight: 800, fontSize: '0.95rem' }}>
              {service?.price}
            </Typography>
          </Box>
          <IconButton onClick={onClose} disabled={submitting} aria-label="Închide" sx={{ mt: -0.5, mr: -1 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <StepRail steps={steps} current={stepIndex} />
      </Box>

      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <Stack spacing={2.5}>
          <Typography component="h2" sx={{ ...displaySx, fontWeight: 800, fontSize: '1.25rem', color: TOKENS.ink }}>
            {STEP_TITLES[step]}
          </Typography>

          {catalogError && (
            <Alert severity="warning" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
              Nu am putut încărca lista de sedii sau textele acordului. Închide și încearcă din nou.
            </Alert>
          )}

          {step === 'contact' && (
            <>
              <PanelCard>
                <Stack spacing={1.2}>
                  {SERVICE_INTRO[serviceKey].map((line) => (
                    <Stack key={line} direction="row" spacing={1.2} sx={{ alignItems: 'flex-start' }}>
                      <CheckRoundedIcon sx={{ fontSize: 18, color: TOKENS.success, mt: '2px' }} />
                      <Typography sx={{ color: TOKENS.ink, fontSize: '0.92rem', lineHeight: 1.6 }}>{line}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </PanelCard>
              <PanelCard title="Datele de contact">
                <Stack spacing={2}>
                  <TextField
                    label="Nume complet"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    autoComplete="name"
                    fullWidth
                    sx={inputSx}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    autoComplete="email"
                    helperText="Aici primești confirmarea plății și factura."
                    fullWidth
                    sx={inputSx}
                  />
                  <TextField
                    label="Telefon"
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    autoComplete="tel"
                    fullWidth
                    sx={inputSx}
                  />
                </Stack>
              </PanelCard>
            </>
          )}

          {step === 'persoana' && (
            <>
              <PanelCard>
                <PersoanaFizicaForm value={solicitant} onChange={setSolicitant} onBlur={() => {}} />
              </PanelCard>

              <PanelCard title="Actul de identitate">
                <Stack spacing={1.5}>
                  <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem' }}>
                    O poză clară sau un PDF cu actul de identitate. Merge la Consulto împreună cu dosarul.
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={identityDocument ? <CheckRoundedIcon /> : <UploadFileRoundedIcon />}
                    sx={{
                      alignSelf: 'flex-start',
                      textTransform: 'none',
                      fontWeight: 700,
                      maxWidth: '100%',
                      borderColor: identityDocument ? alpha(TOKENS.success, 0.5) : TOKENS.borderHover,
                      color: identityDocument ? TOKENS.success : TOKENS.ink,
                    }}
                  >
                    <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {identityDocument ? identityDocument.fileName : 'Încarcă actul'}
                    </Box>
                    <input
                      hidden
                      type="file"
                      accept={ALLOWED_DOCUMENT_TYPES.join(',')}
                      onChange={(e) => void pickDocument(e.target.files?.[0])}
                    />
                  </Button>
                  {documentError && (
                    <Typography sx={{ color: TOKENS.danger, fontSize: '0.85rem' }}>{documentError}</Typography>
                  )}
                </Stack>
              </PanelCard>

              {hosting && (
                <PanelCard title="Ai deja PFA?">
                  <Stack spacing={2}>
                    <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem' }}>
                      Dacă PFA-ul există deja, scrie-ne denumirea și CUI-ul. Dacă e în curs de înființare, lasă câmpurile goale.
                    </Typography>
                    <TextField
                      label="Denumirea PFA (opțional)"
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                      fullWidth
                      sx={inputSx}
                    />
                    <TextField
                      label="CUI (opțional)"
                      value={company.cui}
                      onChange={(e) => setCompany({ ...company, cui: e.target.value })}
                      fullWidth
                      sx={inputSx}
                    />
                  </Stack>
                </PanelCard>
              )}
            </>
          )}

          {step === 'sediu' &&
            (hosting ? (
              offices && offices.length > 0 ? (
                <PanelCard title="În ce zonă vrei sediul social?">
                  <Stack spacing={2}>
                    <Typography sx={{ fontSize: '0.88rem', color: TOKENS.textMuted }}>
                      Alege zona care ți se potrivește. Adresa exactă și contractul de găzduire vin de la
                      Consulto după validarea dosarului.
                    </Typography>
                    <OfficeZonePicker
                      offices={offices}
                      value={officeValue.office.consultoOfficeId}
                      onChange={(consultoOfficeId) =>
                        setOfficeValue({ ...officeValue, office: { ...officeValue.office, type: 'ConsultoProvided', consultoOfficeId } })
                      }
                    />
                  </Stack>
                </PanelCard>
              ) : (
                <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
                  {offices === null ? 'Se încarcă zonele disponibile…' : 'Momentan nu există zone disponibile. Revino mai târziu sau scrie-ne la contact@ridelance.ro.'}
                </Alert>
              )
            ) : (
              <RegisteredOfficeForm
                value={officeValue}
                domiciliu={solicitant.domiciliu}
                offices={offices}
                onChange={(value) => setOfficeValue(value)}
                onBlur={() => {}}
              />
            ))}

          {step === 'acord' &&
            (!flow ? (
              <Stack sx={{ alignItems: 'center', py: 6 }}>
                <CircularProgress sx={{ color: TOKENS.primary }} />
              </Stack>
            ) : !consentDone ? (
              <ConsentWizard steps={flow.steps} onComplete={() => setConsentDone(true)} />
            ) : (
              <PanelCard title="Semnătură de consimțământ">
                <Stack spacing={2}>
                  <Typography sx={{ color: TOKENS.ink, lineHeight: 1.65 }}>
                    Prin această semnătură confirmi că ai citit, înțeles și acceptat toate declarațiile
                    de mai sus și că semnătura aplicată are valoare juridică.
                  </Typography>
                  <SignaturePad onChange={setSignature} />
                </Stack>
              </PanelCard>
            ))}

          {step === 'plata' && (
            <>
              <PanelCard title="Rezumat">
                <Stack spacing={1}>
                  <SummaryRow label="Serviciu" value={service?.title ?? ''} />
                  <SummaryRow label="Solicitant" value={`${solicitant.nume ?? ''} ${solicitant.prenume ?? ''}`.trim()} />
                  <SummaryRow label="Sediu social" value={officeSummary(officeValue, offices)} />
                  {!hosting && signature && <SummaryRow label="Acord" value="Semnat" />}
                  <SummaryRow label="De plată" value={service?.price ?? ''} strong />
                </Stack>
              </PanelCard>
              <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>
                După plată, dosarul pleacă automat la Consulto. Primești pe email confirmarea și factura, iar echipa te
                contactează dacă mai e nevoie de ceva.
              </Typography>
              <Stack spacing={1}>
                <TermsAcceptance checked={termsAccepted} onChange={setTermsAccepted} disabled={submitting} />
                <PaymentPolicyAcceptance checked={policyAccepted} onChange={setPolicyAccepted} disabled={submitting} />
              </Stack>
              {error && (
                <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
                  {error}
                </Alert>
              )}
            </>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: 1.5,
          pb: { xs: 'calc(12px + var(--sab))', sm: 2 },
          borderTop: `1px solid ${TOKENS.border}`,
          backgroundColor: TOKENS.paper,
        }}
      >
        {missing.length > 0 && step !== 'acord' && (
          <Typography role="status" aria-live="polite" sx={{ color: TOKENS.textMuted, fontSize: '0.8rem', mb: 1 }}>
            Mai lipsește: {missing.join(', ')}.
          </Typography>
        )}
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between' }}>
          <Button
            onClick={() => (stepIndex === 0 ? onClose() : setStepIndex((i) => i - 1))}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 700, color: TOKENS.textMuted }}
          >
            {stepIndex === 0 ? 'Renunță' : 'Înapoi'}
          </Button>
          {/* La acord, butonul apare abia după declarații: până atunci wizardul lor are pașii proprii. */}
          {(step !== 'acord' || consentDone) && (
            <Button
              variant="contained"
              onClick={next}
              disabled={submitting || missing.length > 0}
              startIcon={submitting ? <CircularProgress size={16} sx={{ color: alpha('#fff', 0.9) }} /> : undefined}
              sx={{
                ...displaySx,
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                backgroundColor: TOKENS.primary,
                '&:hover': { backgroundColor: TOKENS.primaryStrong },
              }}
            >
              {isLast ? `Plătește ${service?.price ?? ''}` : 'Continuă'}
            </Button>
          )}
        </Stack>
      </Box>
    </>
  )
}

function officeSummary({ office }: RegisteredOfficeValue, offices: ConsultoOffice[] | null): string {
  if (office.type === 'ConsultoProvided') {
    const chosen = offices?.find((o) => o.id === office.consultoOfficeId)
    return chosen ? `Consulto · ${chosen.zona}` : 'Consulto'
  }
  if (office.type === 'Own') {
    const a = office.adresa
    return [a.strada && `Str. ${a.strada}`, a.numar && `nr. ${a.numar}`, a.localitate].filter(Boolean).join(', ')
  }
  return '—'
}

function SummaryRow({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
      <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.9rem' }}>{label}</Typography>
      <Typography sx={{ color: TOKENS.ink, fontWeight: strong ? 800 : 600, fontSize: '0.9rem', textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  )
}

/** Pașii, ca bare: cât s-a făcut și cât mai e, fără etichete care nu încap pe telefon. */
function StepRail({ steps, current }: { steps: StepId[]; current: number }) {
  return (
    <Stack spacing={0.8} sx={{ mt: 1.5 }}>
      <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.8rem', fontWeight: 600 }}>
        Pasul {current + 1} din {steps.length} · {STEP_TITLES[steps[current]]}
      </Typography>
      <Stack direction="row" spacing={0.6}>
        {steps.map((id, i) => (
          <Box
            key={id}
            sx={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i <= current ? TOKENS.primary : alpha(TOKENS.ink, 0.08),
            }}
          />
        ))}
      </Stack>
    </Stack>
  )
}
