import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'

import { carsService } from '../../../../services/cars.service'
import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { PageHeader, Panel } from '../../ui'
import { ListingPreview } from './ListingPreview'
import { StepRail } from './StepRail'
import {
  DossierStep,
  LocationStep,
  OfferStep,
  PhotosStep,
  VehicleStep,
  type DraftPhoto,
} from './WizardSteps'
import {
  EMPTY_DRAFT,
  STEPS,
  blockingSteps,
  dossierCompletion,
  missingFields,
  toCreateRequest,
  type CarDraft,
  type StepId,
} from './wizardModel'

/**
 * Adăugarea unei mașini, pe șase pași.
 *
 * Formularul dintr-un singur dialog cerea douăzeci de câmpuri deodată, fără să spună care sunt
 * obligatorii și fără să arate cum iese anunțul. Pașii separă deciziile — ce e mașina, cât
 * costă, cum arată, unde e — iar previzualizarea din dreapta arată în permanență rezultatul.
 *
 * Regula fluxului: nimic din dosarul administrativ nu blochează publicarea. Se poate ajunge la
 * pasul final cu doar marca, modelul, anul, prețul, descrierea și orașul completate.
 */

interface AddCarWizardProps {
  onCancel: () => void
  onSaved: (carId: string) => void
}

export function AddCarWizard({ onCancel, onSaved }: AddCarWizardProps) {
  const [draft, setDraft] = useState<CarDraft>(EMPTY_DRAFT)
  const [photos, setPhotos] = useState<DraftPhoto[]>([])
  const [step, setStep] = useState<StepId>('vehicul')
  const [visited, setVisited] = useState<Set<StepId>>(new Set(['vehicul']))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obiect-URL-urile fotografiilor trăiesc până sunt revocate; fără asta, fiecare încercare de
  // upload ar lăsa fișierul în memorie până la refresh.
  const urlsRef = useRef<string[]>([])
  useEffect(
    () => () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  const update = useCallback(<K extends keyof CarDraft>(key: K, value: CarDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  const incomplete = useMemo(() => new Set(blockingSteps(draft)), [draft])
  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const currentMissing = missingFields(draft, step)

  const goTo = (next: StepId) => {
    setVisited((prev) => new Set(prev).add(next))
    setStep(next)
  }

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const added = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file)
      urlsRef.current.push(url)
      return { id: `${file.name}-${file.size}-${crypto.randomUUID()}`, file, url }
    })
    setPhotos((prev) => [...prev, ...added])
  }

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id))
  }

  /** Prima poziție e coperta: mutarea în față e tot ce înseamnă „fă principală". */
  const makeCover = (id: string) => {
    setPhotos((prev) => {
      const picked = prev.find((photo) => photo.id === id)
      return picked ? [picked, ...prev.filter((photo) => photo.id !== id)] : prev
    })
  }

  const publish = async () => {
    setSaving(true)
    setError(null)
    try {
      const carId = await carsService.create(toCreateRequest(draft))

      // Fotografiile se urcă după ce anunțul există: au nevoie de id-ul lui. Secvențial, ca
      // ordinea de pe server să fie cea aleasă aici — coperta prima.
      for (const photo of photos) {
        await carsService.uploadImage(carId, photo.file)
      }

      onSaved(carId)
    } catch {
      setError('Nu am putut salva anunțul. Verifică datele și încearcă din nou.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Adaugă o mașină în flotă"
        subtitle="Completează informațiile necesare pentru administrare și pentru marketplace."
        actions={
          <Button onClick={onCancel} sx={{ textTransform: 'none', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
            Renunță
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ alignItems: 'flex-start' }}>
        <StepRail active={step} visited={visited} incomplete={incomplete} onSelect={goTo} />

        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Panel
            title={STEPS[stepIndex].title}
            subtitle={STEPS[stepIndex].hint}
            action={
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
                Pasul {stepIndex + 1} din {STEPS.length}
              </Typography>
            }
          >
            {step === 'vehicul' && <VehicleStep draft={draft} update={update} />}
            {step === 'oferta' && <OfferStep draft={draft} update={update} />}
            {step === 'poze' && (
              <PhotosStep photos={photos} onAdd={addPhotos} onRemove={removePhoto} onMakeCover={makeCover} />
            )}
            {step === 'locatie' && <LocationStep draft={draft} update={update} />}
            {step === 'dosar' && <DossierStep draft={draft} update={update} />}
            {step === 'preview' && (
              <PreviewStep draft={draft} photoCount={photos.length} incomplete={incomplete} onFix={goTo} />
            )}

            {currentMissing.length > 0 && step !== 'preview' && (
              <Alert severity="warning" sx={{ mt: 2.5, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
                Completează câmpurile obligatorii ca să poți publica anunțul.
              </Alert>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 3, justifyContent: 'space-between' }}>
              <Button
                disabled={stepIndex === 0}
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => goTo(STEPS[stepIndex - 1].id)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Înapoi
              </Button>

              {step === 'preview' ? (
                <Button
                  variant="contained"
                  disableElevation
                  disabled={saving || incomplete.size > 0}
                  onClick={() => void publish()}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
                >
                  {saving ? 'Se salvează…' : 'Salvează anunțul'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disableElevation
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={() => goTo(STEPS[stepIndex + 1].id)}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
                >
                  Continuă
                </Button>
              )}
            </Stack>
          </Panel>
        </Box>

        <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: DASHBOARD_TOKENS.textSubtle,
              mb: 1,
            }}
          >
            Cum arată în marketplace
          </Typography>
          <ListingPreview draft={draft} coverUrl={photos[0]?.url ?? null} photoCount={photos.length} />
        </Box>
      </Stack>
    </Stack>
  )
}

/** Pasul final: ce e gata, ce lipsește și ce nu blochează publicarea. */
function PreviewStep({
  draft,
  photoCount,
  incomplete,
  onFix,
}: {
  draft: CarDraft
  photoCount: number
  incomplete: Set<StepId>
  onFix: (step: StepId) => void
}) {
  const dossier = Math.round(dossierCompletion(draft) * 100)

  const checks: { ok: boolean; title: string; detail: string; step?: StepId; blocking: boolean }[] = [
    {
      ok: !incomplete.has('vehicul') && !incomplete.has('oferta'),
      title: 'Date principale',
      detail: incomplete.has('vehicul') || incomplete.has('oferta')
        ? 'Marca, modelul, anul, prețul și descrierea sunt obligatorii.'
        : 'Anunțul poate fi publicat.',
      step: incomplete.has('vehicul') ? 'vehicul' : 'oferta',
      blocking: true,
    },
    {
      ok: !incomplete.has('locatie'),
      title: 'Locație',
      detail: incomplete.has('locatie')
        ? 'Orașul e obligatoriu.'
        : draft.latitude != null
          ? 'Oraș și pin pe hartă.'
          : 'Oraș setat. Fără pin pe hartă, anunțul pierde 10 puncte.',
      step: 'locatie',
      blocking: true,
    },
    {
      ok: photoCount >= 3,
      title: `Fotografii (${photoCount})`,
      detail: photoCount >= 6
        ? 'Punctaj complet pentru media anunțului.'
        : photoCount >= 3
          ? 'Ai punctaj parțial. De la 6 fotografii primești punctajul complet.'
          : 'Fără fotografii anunțul e greu de ales. Nu blochează publicarea.',
      step: 'poze',
      blocking: false,
    },
    {
      ok: dossier >= 80,
      title: `Dosar vehicul ${dossier}%`,
      detail: 'Nu blochează publicarea. Poate fi completat oricând ulterior.',
      step: 'dosar',
      blocking: false,
    },
  ]

  return (
    <Stack spacing={1.2}>
      {checks.map((check) => (
        <Stack
          key={check.title}
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
            p: 1.5,
            borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              flexShrink: 0,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(
                check.ok ? DASHBOARD_TOKENS.accent : check.blocking ? DASHBOARD_TOKENS.stateError : DASHBOARD_TOKENS.stateWarning,
                0.12,
              ),
              color: check.ok
                ? DASHBOARD_TOKENS.accent
                : check.blocking
                  ? DASHBOARD_TOKENS.stateError
                  : DASHBOARD_TOKENS.stateWarning,
            }}
          >
            {check.ok ? <CheckCircleRoundedIcon sx={{ fontSize: 18 }} /> : <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: DASHBOARD_TOKENS.ink }}>
              {check.title}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>
              {check.detail}
            </Typography>
          </Box>

          {!check.ok && check.step && (
            <Button
              size="small"
              onClick={() => onFix(check.step!)}
              sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              Completează
            </Button>
          )}
        </Stack>
      ))}

      <Alert severity="info" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, mt: 1 }}>
        Anunțul se salvează ca nefiind încă vizibil public. Devine vizibil după validare și după
        activarea plății, din „Mașinile mele".
      </Alert>
    </Stack>
  )
}
