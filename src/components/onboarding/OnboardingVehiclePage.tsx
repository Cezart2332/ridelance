import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { Alert, Box, Button, Chip, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

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
import { PanelCard, PanelHeading } from './PanelCard'

const COPY_STATUS_LABELS: Record<string, string> = {
  Draft: 'Inițiată',
  DossierGenerated: 'Dosar generat',
  Submitted: 'Depusă la ARR',
  Issued: 'Copie conformă emisă',
  Rejected: 'Respinsă',
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
  const [uberSets, setUberSets] = useState(0)
  const [boltSets, setBoltSets] = useState(0)

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
    setUberSets(d.badges.find((b) => b.provider === 'Uber')?.setCount ?? 0)
    setBoltSets(d.badges.find((b) => b.provider === 'Bolt')?.setCount ?? 0)
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

  const saveVehicle = () =>
    run(async () =>
      apply(
        await onboardingService.submitVehicle({
          ownershipMode,
          addLater,
          plateNumber: plateNumber || null,
          vin: vin || null,
          make: make || null,
          model: model || null,
          firstRegistrationYear: year ? Number(year) : null,
        }),
      ),
    )

  const saveCopyRequest = () =>
    run(async () => {
      const badges: { provider: PlatformProvider; setCount: number }[] = [
        { provider: 'Uber', setCount: uberSets },
        { provider: 'Bolt', setCount: boltSets },
      ]
      apply(await onboardingService.submitCopyRequest(years, badges))
    })

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
      <PanelHeading
        title="Vehicul, copie conformă și ecusoane"
        description={`Declară mașina, apoi solicităm copia conformă (${lei(copyFeePerYear)} lei/an) și ecusoanele (${lei(badgeFeePerSet)} lei/set) și generăm dosarul pentru ARR.`}
      />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      {/* Documentele necesare pentru înrolare */}
      <PanelCard>
        <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink, mb: 0.5 }}>
          Documentele vehiculului
        </Typography>
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.9rem', mb: 2 }}>
          Încarcă documentele mașinii. Datele se citesc automat din ele, iar echipa RIDElance le verifică — tu
          nu completezi nimic.
        </Typography>
        <Stack spacing={2.5}>
          <StepDocument
            step="vehicle"
            category="RCA"
            label="RCA"
            hint="Citim automat numărul de înmatriculare."
          />
          <StepDocument
            step="vehicle"
            category="AsigurareCalatori"
            label="Asigurare călători și bagaje"
            hint="Obligatorie pentru transportul alternativ."
          />
          {ownershipMode !== 'Owned' && !addLater && (
            <StepDocument
              step="vehicle"
              category="ContractVehicul"
              label="Contract de închiriere / comodat / leasing"
              hint="Documentul care atestă dreptul de folosință asupra mașinii."
            />
          )}
          <StepDocument
            step="vehicle"
            category="DovadaPlataCopieConformaEcusoane"
            label="Dovada plății copie conformă și ecusoane"
            hint="Ordinul de plată sau chitanța de la ARR."
          />
        </Stack>
      </PanelCard>

      {/* Vehiculul */}
      <PanelCard>
        <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink, mb: 1.5 }}>
          Vehiculul
        </Typography>
        <Stack spacing={2}>
          <TextField
            select
            label="Mod de deținere"
            value={addLater ? 'AddedLater' : ownershipMode}
            onChange={(e) => {
              const v = e.target.value as VehicleOwnershipMode
              if (v === 'AddedLater') {
                setAddLater(true)
              } else {
                setAddLater(false)
                setOwnershipMode(v)
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
              <StepDocument
                step="vehicle"
                category="Talon"
                label="Talon (certificat de înmatriculare)"
                hint="Citim automat nr. de înmatriculare, VIN, marca și modelul."
              />
              <StepDocument
                step="vehicle"
                category="CarteIdentitateAuto"
                label="Cartea de identitate a vehiculului (CIV)"
                hint="Citim automat VIN-ul și marca."
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

          <Box>
            <Button
              variant="outlined"
              onClick={saveVehicle}
              disabled={busy}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderColor: TOKENS.primary,
                color: TOKENS.primaryStrong,
              }}
            >
              Salvează vehiculul
            </Button>
          </Box>
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
              onChange={(e) => setYears(Number(e.target.value))}
              sx={inputSx}
              fullWidth
            >
              {Array.from({ length: maxYears }, (_, i) => i + 1).map((y) => (
                <MenuItem key={y} value={y}>
                  {y} an{y > 1 ? 'i' : ''} — {lei(copyFeePerYear * y)} lei
                </MenuItem>
              ))}
            </TextField>

            <Typography sx={{ fontWeight: 700, color: TOKENS.ink }}>Ecusoane per platformă</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                type="number"
                label="Seturi Uber"
                value={uberSets}
                onChange={(e) => setUberSets(Math.max(0, Number(e.target.value)))}
                sx={inputSx}
                fullWidth
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <TextField
                type="number"
                label="Seturi Bolt"
                value={boltSets}
                onChange={(e) => setBoltSets(Math.max(0, Number(e.target.value)))}
                sx={inputSx}
                fullWidth
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Stack>

            <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
              Total copie conformă: <b>{lei(copyTotal)} lei</b> · Total ecusoane:{' '}
              <b>{lei(badgesTotal)} lei</b>
            </Alert>

            <Box>
              <Button
                variant="outlined"
                onClick={saveCopyRequest}
                disabled={busy}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: TOKENS.primary,
                  color: TOKENS.primaryStrong,
                }}
              >
                Salvează cererea
              </Button>
            </Box>
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
              hint="Citim automat numărul și data de expirare."
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
