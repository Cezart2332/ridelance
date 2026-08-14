import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { Alert, Box, Button, Chip, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { documentService } from '../../services/document.service'
import {
  onboardingService,
  type PlatformProvider,
  type VehicleOwnershipMode,
  type VehicleState,
} from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { StepDocument } from './StepDocument'
import { TOKENS, inputSx } from './onboardingTheme'
import { useOnboarding, useOnboardingResource } from './useOnboarding'
import { useAutosave } from '../../hooks/useAutosave'
import { usePublishAutosave } from './autosaveStore'
import { PanelCard, PanelHeading } from './PanelCard'

const COPY_STATUS_LABELS: Record<string, string> = {
  Draft: 'Inițiată',
  DossierGenerated: 'Dosar generat',
  Submitted: 'Depusă la ARR',
  Issued: 'Copie conformă emisă',
  Rejected: 'Respinsă',
}

/** Se cere exact contractul pe care l-a declarat, nu o listă din care să aleagă mental. */
const CONTRACT_LABELS: Record<VehicleOwnershipMode, string> = {
  Owned: 'Contract',
  Rented: 'Contract de închiriere',
  Leased: 'Contract de leasing',
  Comodat: 'Contract de comodat',
  AddedLater: 'Contract',
}

const lei = (bani: number) => (bani / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2 })

export default function OnboardingVehiclePage() {
  const { refresh } = useOnboarding()
  const { data: loaded } = useOnboardingResource('vehicle', () => onboardingService.getVehicleState())

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<VehicleState | null>(null)

  // Vehicul
  const [ownershipMode, setOwnershipMode] = useState<VehicleOwnershipMode>('Owned')
  const [addLater, setAddLater] = useState(false)
  const [plateNumber, setPlateNumber] = useState('')
  const [vin, setVin] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')

  // Copie conformă & ecusoane
  const [years, setYears] = useState(1)

  // Ecusoanele nu sunt o cantitate pe care șoferul s-o aleagă: are o mașină, deci are nevoie de
  // exact un set pe fiecare platformă bifată la pasul „Uber & Bolt".
  const { data: platforms } = useOnboardingResource('platforms', () =>
    onboardingService.getPlatformOnboarding(),
  )
  const uberSets = platforms?.platforms.find((p) => p.provider === 'Uber')?.isSelectedByUser ? 1 : 0
  const boltSets = platforms?.platforms.find((p) => p.provider === 'Bolt')?.isSelectedByUser ? 1 : 0

  const apply = (d: VehicleState) => {
    setData(d)
    void refresh()
    setOwnershipMode(d.ownershipMode)
    setAddLater(d.addLater)
    setPlateNumber(d.plateNumber ?? '')
    setVin(d.vin ?? '')
    setMake(d.make ?? '')
    setModel(d.model ?? '')
    setYear(d.firstRegistrationYear ? String(d.firstRegistrationYear) : '')
    setYears(d.copyRequest?.years ?? 1)
  }

  // Formularul se semințează o singură dată din starea de pe server; după aceea e al userului.
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || !loaded) return
    seeded.current = true
    apply(loaded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  // RL-06 — vehiculul se salvează singur. `onBlur` pe containerul cardului prinde toate câmpurile
  // de text dintr-o dată (evenimentul urcă în React), iar controalele fără blur cheamă explicit.
  const vehicleSave = useAutosave<Parameters<typeof onboardingService.submitVehicle>[0]>({
    save: async (payload) => apply(await onboardingService.submitVehicle(payload)),
    storageKey: 'onboarding.vehicle.details',
  })

  const scheduleVehicle = (overrides?: Partial<{ ownershipMode: VehicleOwnershipMode; addLater: boolean }>) =>
    vehicleSave.schedule({
      ownershipMode: overrides?.ownershipMode ?? ownershipMode,
      addLater: overrides?.addLater ?? addLater,
      plateNumber: plateNumber || null,
      vin: vin || null,
      make: make || null,
      model: model || null,
      firstRegistrationYear: year ? Number(year) : null,
    })

  const copySave = useAutosave<{ years: number; uberSets: number; boltSets: number }>({
    save: async ({ years: y, uberSets: u, boltSets: b }) => {
      const badges: { provider: PlatformProvider; setCount: number }[] = [
        { provider: 'Uber', setCount: u },
        { provider: 'Bolt', setCount: b },
      ]
      apply(await onboardingService.submitCopyRequest(y, badges))
    },
    storageKey: 'onboarding.vehicle.copyRequest',
  })

  // Două zone, un singur indicator: cea care are ceva de spus acum.
  usePublishAutosave(vehicleSave.status === 'idle' ? copySave : vehicleSave)

  const generate = () => run(async () => apply(await onboardingService.generateVehicleDossier()))
  const markSubmitted = () =>
    run(async () => {
      await onboardingService.markVehicleSubmitted()
      apply(await onboardingService.getVehicleState())
    })

  const copy = data?.copyRequest ?? null
  const copyFeePerYear = data?.copyFeePerYearBani ?? 10000
  const badgeFeePerSet = data?.badgeFeePerSetBani ?? 800
  const maxYears = data?.maxCopyYears ?? 3
  const copyTotal = copyFeePerYear * years
  const badgesTotal = badgeFeePerSet * (uberSets + boltSets)

  return (
    <Stack spacing={3}>
      <PanelHeading title="Vehicul, copie conformă și ecusoane" />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      {/* Vehiculul. Stă înaintea documentelor: modul de deținere decide ce se cere mai jos. */}
      <PanelCard>
        <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink, mb: 1.5 }}>
          Vehiculul
        </Typography>
        {/* onBlur urcă în React: un singur handler acoperă toate câmpurile de text din card. */}
        <Stack spacing={2} onBlur={() => scheduleVehicle()}>
          <TextField
            select
            label="Mod de deținere"
            value={addLater ? 'AddedLater' : ownershipMode}
            onChange={(e) => {
              const v = e.target.value as VehicleOwnershipMode
              if (v === 'AddedLater') {
                setAddLater(true)
                scheduleVehicle({ addLater: true })
              } else {
                setAddLater(false)
                setOwnershipMode(v)
                scheduleVehicle({ addLater: false, ownershipMode: v })
              }
            }}
            sx={inputSx}
            fullWidth
          >
            <MenuItem value="Owned">Proprietate</MenuItem>
            <MenuItem value="Rented">Închiriere</MenuItem>
            <MenuItem value="Leased">Leasing</MenuItem>
            <MenuItem value="Comodat">Comodat</MenuItem>
            <MenuItem value="AddedLater">Adaug mașina mai târziu</MenuItem>
          </TextField>

          {!addLater && (
            <>
              {/* Lipit de selectorul care îl cere: mașina nu e a ta, deci vrem dovada folosinței.
                  Documentele care se cer oricum vin după el, nu între întrebare și răspuns. */}
              {ownershipMode !== 'Owned' && (
                <StepDocument
                  step="vehicle"
                  category="ContractVehicul"
                  label={CONTRACT_LABELS[ownershipMode]}
                />
              )}
              <StepDocument
                step="vehicle"
                category="Talon"
                label="Talon (certificat de înmatriculare)"
              />
              <StepDocument
                step="vehicle"
                category="CarteIdentitateAuto"
                label="Cartea de identitate a vehiculului (CIV) — față și verso"
                requireBothSides
              />
              {(data?.plateNumber || data?.vin) && (
                <Alert severity="success" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
                  Citit din documente:{' '}
                  <strong>
                    {[data.plateNumber, data.vin, data.make, data.model].filter(Boolean).join(' · ')}
                  </strong>
                </Alert>
              )}
            </>
          )}

        </Stack>
      </PanelCard>

      {/* Documentele care nu depind de niciun răspuns de mai sus */}
      <PanelCard>
        <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink, mb: 2 }}>
          Documentele vehiculului
        </Typography>
        <Stack spacing={2.5}>
          <Box>
            <StepDocument step="vehicle" category="RCA" label="RCA" />
            {/* Discret și doar informativ: nu condiționăm nimic de partener. */}
            <Typography sx={{ mt: 0.6, fontSize: '0.82rem', color: TOKENS.textMuted }}>
              N-ai încă RCA?{' '}
              <Box
                component={Link}
                to="/parteneri/asigurari-ro"
                sx={{ color: TOKENS.primaryStrong, fontWeight: 650, textDecoration: 'none' }}
              >
                Vezi oferta partenerului nostru asigurari.ro
              </Box>
            </Typography>
          </Box>
          <StepDocument
            step="vehicle"
            category="AsigurareCalatori"
            label="Asigurare călători și bagaje"
          />
          <StepDocument
            step="vehicle"
            category="DovadaPlataCopieConformaEcusoane"
            label="Dovada plății copie conformă și ecusoane"
          />
        </Stack>
      </PanelCard>

      {/* Copie conformă & ecusoane */}
      {data?.vehicleId && !addLater && (
        <PanelCard>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink }}>
              Copie conformă & ecusoane
            </Typography>
            {copy && (
              <Chip
                size="small"
                label={COPY_STATUS_LABELS[copy.status] ?? copy.status}
                sx={{ fontWeight: 700 }}
                color={copy.status === 'Issued' ? 'success' : 'default'}
              />
            )}
          </Stack>

          <Stack spacing={2}>
            <TextField
              select
              label="Perioadă copie conformă"
              value={years}
              onChange={(e) => {
                const next = Number(e.target.value)
                setYears(next)
                copySave.schedule({ years: next, uberSets, boltSets })
              }}
              sx={inputSx}
              fullWidth
            >
              {Array.from({ length: maxYears }, (_, i) => i + 1).map((y) => (
                <MenuItem key={y} value={y}>
                  {y} an{y > 1 ? 'i' : ''} — {lei(copyFeePerYear * y)} lei
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <Typography sx={{ fontWeight: 700, color: TOKENS.ink, mb: 0.5 }}>Ecusoane</Typography>
              <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.9rem' }}>
                {uberSets + boltSets === 0
                  ? 'Alege întâi platformele la pasul „Uber & Bolt”.'
                  : `Un set pentru fiecare platformă aleasă: ${[
                      uberSets > 0 ? 'Uber Fleet' : null,
                      boltSets > 0 ? 'Bolt Fleet' : null,
                    ]
                      .filter(Boolean)
                      .join(' și ')}.`}
              </Typography>
            </Box>

            <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
              Total copie conformă: <b>{lei(copyTotal)} lei</b> · Total ecusoane:{' '}
              <b>{lei(badgesTotal)} lei</b>
            </Alert>

          </Stack>
        </PanelCard>
      )}

      {/* Dosarul */}
      {copy && (
        <PanelCard>
          <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink, mb: 1.5 }}>
            Dosarul copie conformă & ecusoane
          </Typography>
          {copy.hasDossier && copy.dossierDocumentId ? (
            <Stack spacing={1.5}>
              <Alert
                icon={<CheckCircleOutlineRoundedIcon />}
                severity="success"
                sx={{ borderRadius: `${TOKENS.radius.md}px` }}
              >
                Dosarul a fost generat.
              </Alert>
              <Button
                startIcon={<DescriptionRoundedIcon />}
                onClick={() =>
                  documentService.openInNewTab(copy.dossierDocumentId!, 'Dosar_Copie_Conforma.pdf')
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  color: TOKENS.primaryStrong,
                  alignSelf: 'flex-start',
                }}
              >
                Vezi dosarul
              </Button>
              <Button
                onClick={generate}
                disabled={busy}
                sx={{ textTransform: 'none', color: TOKENS.textMuted, alignSelf: 'flex-start' }}
              >
                Regenerează
              </Button>
            </Stack>
          ) : (
            <Button
              variant="contained"
              onClick={generate}
              disabled={busy}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: TOKENS.primary,
                '&:hover': { backgroundColor: TOKENS.primaryStrong },
              }}
            >
              {busy ? 'Se generează...' : 'Generează dosarul'}
            </Button>
          )}

          {copy.hasDossier && (
            <>
              <Divider sx={{ my: 2 }} />
              {copy.submittedAtUtc ? (
                <Typography sx={{ color: '#2e7d32', fontWeight: 700 }}>
                  Ai marcat dosarul ca depus la ARR.
                </Typography>
              ) : (
                <Button
                  variant="contained"
                  onClick={markSubmitted}
                  disabled={busy}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    backgroundColor: TOKENS.primary,
                    '&:hover': { backgroundColor: TOKENS.primaryStrong },
                  }}
                >
                  Am depus dosarul la ARR
                </Button>
              )}
            </>
          )}
        </PanelCard>
      )}

      {/* Documentele primite de la ARR — numărul și expirarea copiei conforme se citesc automat. */}
      {copy?.submittedAtUtc && (
        <PanelCard>
          <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink, mb: 2 }}>
            Documentele primite de la ARR
          </Typography>
          <Stack spacing={2.5}>
            <StepDocument
              step="vehicle"
              category="CopieConforma"
              label="Copia conformă"
            />
            {uberSets > 0 && <StepDocument step="vehicle" category="EcusonUber" label="Ecuson Uber" />}
            {boltSets > 0 && <StepDocument step="vehicle" category="EcusonBolt" label="Ecuson Bolt" />}
          </Stack>
        </PanelCard>
      )}

      {copy?.status === 'Issued' && (
        <Alert severity="success" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          Copie conformă emisă{copy.copyConformaNumber ? ` (nr. ${copy.copyConformaNumber})` : ''}
          {copy.expiresOn ? `, valabilă până la ${copy.expiresOn}` : ''}.
        </Alert>
      )}
    </Stack>
  )
}
