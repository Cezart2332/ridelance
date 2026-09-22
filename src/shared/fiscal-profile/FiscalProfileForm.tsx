import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Step,
  StepButton,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { isAxiosError } from 'axios'

import {
  announceFiscalProfileChanged,
  fiscalProfileService,
  type FiscalProfile,
  type FiscalProfileAnswers,
  type FiscalProfileKey,
  type FiscalProfileMode,
} from '../../services/fiscalProfile.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { QuestionCard } from './QuestionCard'
import {
  STEPS,
  answerLabel,
  formatDate,
  normalizeAnswers,
  questionHelp,
  questionTitle,
  questionsForStep,
  validateAll,
  validateStep,
} from './schema'

export interface FiscalProfileFormProps {
  open: boolean
  mode: FiscalProfileMode
  taxYear: number
  /** Dosarul PFA, pentru admin și contabilitate. PFA-ul nu-l trimite: backendul îl știe. */
  pfaId?: string
  onClose: () => void
  /** După confirmare sau salvare; primește profilul întors de server. */
  onSaved?: (profile: FiscalProfile, event: 'completed' | 'edited') => void
}

type Errors = Partial<Record<FiscalProfileKey | 'confirmed' | 'reason', string>>

const NO_CONDITIONS = { askPriorDocs: false, priorFrom: null, priorTo: null, askCarriedLosses: false }

const CONFLICT_MESSAGE = 'Profilul a fost modificat de altcineva. Reîncarcă pentru a vedea ultima versiune.'

/**
 * Formularul de profil fiscal, o singură implementare pentru cele trei dashboarduri (spec §1).
 *
 * `mode = 'pfa'`: ciorna se salvează la fiecare „Continuă” și la închidere; la final PFA-ul
 * bifează confirmarea și activează estimările. `mode = 'admin' | 'accounting'`: fără ciornă și
 * fără confirmare — staff-ul salvează cu un motiv obligatoriu, iar profilul nu trece niciodată
 * în „completat” din mâna lui.
 */
export function FiscalProfileForm(props: FiscalProfileFormProps) {
  // Montat doar cât e deschis: fiecare deschidere pornește de la pasul 1, cu profilul proaspăt.
  return props.open ? <FiscalProfileDialog {...props} /> : null
}

function FiscalProfileDialog({ mode, taxYear, pfaId, onClose, onSaved }: FiscalProfileFormProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const isStaff = mode !== 'pfa'

  const [profile, setProfile] = useState<FiscalProfile | null>(null)
  const [answers, setAnswers] = useState<FiscalProfileAnswers>({})
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [confirmed, setConfirmed] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const dirty = useRef(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fiscalProfileService
      .get(mode, taxYear, pfaId)
      .then((loaded) => {
        if (cancelled) return
        setProfile(loaded)
        setAnswers(normalizeAnswers(loaded.answers ?? {}, loaded.conditions))
        dirty.current = false
        setLoadError(null)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(getErrorMessage(err, 'Nu am putut încărca profilul fiscal.'))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode, taxYear, pfaId, reloadToken])

  /** După un conflict: ultima versiune de pe server, cu răspunsurile de acolo. */
  const reload = () => {
    setLoading(true)
    setConflict(false)
    setSaveError(null)
    setErrors({})
    setReloadToken((token) => token + 1)
  }

  const completed = profile?.status === 'COMPLETED'
  // PFA-ul completează tot; staff-ul poate lăsa o ciornă parțială, dar nu golește un profil completat.
  const requireAll = !isStaff || completed
  const conditions = profile?.conditions ?? NO_CONDITIONS
  const cassMinThreshold = profile?.cassMinThreshold ?? null
  const titleContext = useMemo(() => ({ conditions, taxYear, cassMinThreshold }), [conditions, taxYear, cassMinThreshold])

  const setAnswer = (key: FiscalProfileKey, value: string | number | null) => {
    dirty.current = true
    setAnswers((current) => normalizeAnswers({ ...current, [key]: value }, conditions))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const scrollTop = () => contentRef.current?.scrollTo({ top: 0 })

  /** Ciorna PFA-ului, doar cât profilul nu e confirmat. Staff-ul și editările nu au ciornă. */
  const saveDraft = async (): Promise<boolean> => {
    if (isStaff || completed || !profile || !dirty.current) return true
    try {
      const saved = await fiscalProfileService.saveDraft(taxYear, answers, profile.revision)
      setProfile(saved)
      dirty.current = false
      return true
    } catch (err) {
      return handleSaveError(err)
    }
  }

  function handleSaveError(err: unknown): false {
    if (isAxiosError(err) && err.response?.status === 409) {
      setConflict(true)
      return false
    }
    const serverErrors = isAxiosError(err) ? (err.response?.data as { errors?: { code: string; description: string }[] })?.errors : undefined
    if (serverErrors?.length) {
      const mapped: Errors = {}
      for (const e of serverErrors) mapped[e.code as FiscalProfileKey] = e.description
      setErrors(mapped)
      const firstStep = [1, 2, 3].find((s) => questionsForStep(s, answers, conditions).some((q) => mapped[q.key]))
      if (firstStep) setStep(firstStep - 1)
      return false
    }
    setSaveError(getErrorMessage(err, 'Nu am putut salva profilul.'))
    return false
  }

  const next = async () => {
    const stepErrors = validateStep(step + 1, answers, conditions, requireAll)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      const first = Object.keys(stepErrors)[0]
      contentRef.current?.querySelector<HTMLElement>(`[data-question="${first}"] input`)?.focus()
      return
    }
    setSaving(true)
    setSaveError(null)
    const ok = await saveDraft()
    setSaving(false)
    if (ok) {
      setStep((s) => s + 1)
      scrollTop()
    }
  }

  const back = () => {
    setStep((s) => Math.max(0, s - 1))
    scrollTop()
  }

  const close = async () => {
    if (saving) return
    await saveDraft()
    onClose()
  }

  const submit = async () => {
    if (!profile) return
    const allErrors: Errors = validateAll(answers, conditions, requireAll)
    if (!isStaff && !completed && !confirmed) allErrors.confirmed = 'Bifează confirmarea ca să activezi estimările.'
    if (isStaff && !reason.trim()) allErrors.reason = 'Scrie motivul modificării.'
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      const firstStep = [1, 2, 3].find((s) => questionsForStep(s, answers, conditions).some((q) => allErrors[q.key]))
      if (firstStep) setStep(firstStep - 1)
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const saved =
        !isStaff && !completed
          ? await fiscalProfileService.complete(taxYear, answers, profile.revision)
          : await fiscalProfileService.edit(mode, taxYear, answers, profile.revision, isStaff ? reason.trim() : undefined, pfaId)
      setProfile(saved)
      dirty.current = false
      announceFiscalProfileChanged()
      onSaved?.(saved, !isStaff && !completed ? 'completed' : 'edited')
      onClose()
    } catch (err) {
      handleSaveError(err)
    } finally {
      setSaving(false)
    }
  }

  const summaryStep = step === 3
  const submitLabel = !isStaff && !completed ? 'Confirmă și activează' : 'Salvează modificările'
  const submitDisabled = saving || (!isStaff && !completed && !confirmed) || (isStaff && !reason.trim())

  return (
    <Dialog
      open
      onClose={() => void close()}
      fullScreen={fullScreen}
      fullWidth
      maxWidth={false}
      aria-labelledby="fiscal-profile-title"
      slotProps={{ paper: { sx: { maxWidth: fullScreen ? '100%' : 720, width: '100%', bgcolor: 'background.default' } } }}
    >
      <DialogTitle id="fiscal-profile-title" sx={{ pr: 7, fontWeight: 700 }}>
        Profil fiscal {taxYear}
        <IconButton aria-label="Închide" onClick={() => void close()} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 1.5, overflowX: 'auto' }}>
        <Stepper nonLinear activeStep={step} alternativeLabel sx={{ minWidth: 0, '& .MuiStepLabel-label': { fontSize: '0.78rem' } }}>
          {STEPS.map((label, index) => (
            <Step key={label} completed={index < step}>
              {/* Pașii anteriori se pot redeschide direct; cei următori trec prin „Continuă”. */}
              <StepButton disabled={index > step || saving} onClick={() => setStep(index)}>
                {label}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent ref={contentRef} dividers sx={{ px: { xs: 2, sm: 3 } }}>
        {loading && (
          <Stack sx={{ alignItems: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        )}
        {loadError && <Alert severity="error">{loadError}</Alert>}

        {conflict && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={reload}>
                Reîncarcă
              </Button>
            }
          >
            {CONFLICT_MESSAGE}
          </Alert>
        )}
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}

        {profile && !loading && (
          <Stack spacing={2}>
            {step === 0 && <FactsBlock profile={profile} />}

            {!summaryStep &&
              questionsForStep(step + 1, answers, conditions).map((question) => (
                <QuestionCard
                  key={question.key}
                  question={question}
                  title={questionTitle(question, titleContext)}
                  help={questionHelp(question, titleContext)}
                  value={answers[question.key]}
                  error={errors[question.key]}
                  disabled={saving}
                  onChange={(value) => setAnswer(question.key, value)}
                />
              ))}

            {summaryStep && (
              <>
                {[1, 2, 3].map((s) => (
                  <SummarySection
                    key={s}
                    title={STEPS[s - 1]}
                    onEdit={() => setStep(s - 1)}
                    rows={questionsForStep(s, answers, conditions).map((q) => ({
                      label: questionTitle(q, titleContext),
                      value: answerLabel(q.key, answers[q.key]),
                      error: errors[q.key],
                    }))}
                  />
                ))}

                {!isStaff && !completed && (
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={confirmed}
                          onChange={(event) => {
                            setConfirmed(event.target.checked)
                            setErrors((e) => ({ ...e, confirmed: undefined }))
                          }}
                        />
                      }
                      label="Confirm că informațiile sunt corecte și le voi actualiza dacă se schimbă ceva. Înțeleg că sumele afișate sunt estimări."
                      sx={{ alignItems: 'flex-start', m: 0, '& .MuiCheckbox-root': { pt: 0.25 } }}
                    />
                    {errors.confirmed && (
                      <Typography role="alert" variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                        {errors.confirmed}
                      </Typography>
                    )}
                  </Box>
                )}

                {isStaff && (
                  <TextField
                    label="Motivul modificării"
                    required
                    fullWidth
                    multiline
                    minRows={2}
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value)
                      setErrors((e) => ({ ...e, reason: undefined }))
                    }}
                    error={!!errors.reason}
                    helperText={errors.reason ?? 'Apare în istoricul profilului, lângă numele tău.'}
                    slotProps={{ htmlInput: { maxLength: 1000 } }}
                  />
                )}
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, gap: 1 }}>
        {step > 0 && (
          <Button variant="outlined" onClick={back} disabled={saving}>
            Înapoi
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {!summaryStep ? (
          <Button variant="contained" onClick={() => void next()} disabled={saving || !profile || loading}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Continuă'}
          </Button>
        ) : (
          <Button variant="contained" onClick={() => void submit()} disabled={submitDisabled}>
            {saving ? <CircularProgress size={18} color="inherit" /> : submitLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

/** Datele preluate din cont, read-only. O dată greșită se semnalează, nu se editează aici. */
function FactsBlock({ profile }: { profile: FiscalProfile }) {
  const facts = profile.facts
  const rows: [string, string][] = [
    ['Nume PFA', facts.pfaName ?? '—'],
    ['CUI', facts.cui ?? '—'],
    ['Data înființării', formatDate(facts.pfaRegisteredOn.value)],
    ['Data începerii activității', formatDate(facts.activityStartedOn.value)],
    ['Acces RIDElance din', formatDate(facts.accessGrantedAt.value)],
    ['Sistem de impozitare', 'Sistem real'],
  ]

  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
        Am preluat aceste date din contul tău. Verifică dacă sunt corecte.
      </Typography>
      <Box
        sx={(theme) => ({
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.5,
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
        })}
      >
        {rows.map(([label, value]) => (
          <Box key={label} sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function SummarySection({
  title,
  rows,
  onEdit,
}: {
  title: string
  rows: { label: string; value: string; error?: string }[]
  onEdit: () => void
}) {
  return (
    <Box sx={(theme) => ({ bgcolor: 'background.paper', borderRadius: 2, boxShadow: theme.shadows[1], p: { xs: 2, sm: 3 } })}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Button size="small" onClick={onEdit} aria-label={`Modifică: ${title}`}>
          Modifică
        </Button>
      </Stack>
      <Stack spacing={1}>
        {rows.map((row) => (
          <Box key={row.label}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {row.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere', color: row.error ? 'error.main' : 'text.primary' }}>
              {row.error ?? row.value}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
