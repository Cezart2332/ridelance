import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { documentService } from '../../services/document.service'
import {
  onboardingService,
  type PlatformProvider,
  type VehicleOwnershipMode,
  type VehicleState,
} from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import OnboardingLayout from './OnboardingLayout'
import { TOKENS, inputSx } from './onboardingTheme'
import { useOnboardingState } from './useOnboardingState'

const COPY_STATUS_LABELS: Record<string, string> = {
  Draft: 'Inițiată',
  DossierGenerated: 'Dosar generat',
  Submitted: 'Depusă la ARR',
  Issued: 'Copie conformă emisă',
  Rejected: 'Respinsă',
}

const lei = (bani: number) => (bani / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2 })

export default function OnboardingVehiclePage() {
  const navigate = useNavigate()
  const { state } = useOnboardingState()

  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    onboardingService
      .getVehicleState()
      .then(apply)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

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

  if (loading) {
    return (
      <OnboardingLayout state={state} activeKey="vehicul">
        <Stack sx={{ alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ color: TOKENS.primary }} />
        </Stack>
      </OnboardingLayout>
    )
  }

  const copy = data?.copyRequest ?? null
  const copyFeePerYear = data?.copyFeePerYearBani ?? 10000
  const badgeFeePerSet = data?.badgeFeePerSetBani ?? 800
  const maxYears = data?.maxCopyYears ?? 5
  const copyTotal = copyFeePerYear * years
  const badgesTotal = badgeFeePerSet * (uberSets + boltSets)

  return (
    <OnboardingLayout state={state} activeKey="vehicul">
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: TOKENS.ink }}>
            Vehicul, copie conformă și ecusoane
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5 }}>
            Declară mașina, apoi solicităm copia conformă ({lei(copyFeePerYear)} lei/an) și ecusoanele
            ({lei(badgeFeePerSet)} lei/set) și generăm dosarul pentru ARR.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>{error}</Alert>}

        {/* Vehiculul */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
          <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink, mb: 1.5 }}>Vehiculul</Typography>
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
              <MenuItem value="Owned">Am mașină (proprietate)</MenuItem>
              <MenuItem value="Rented">Închiriez mașina</MenuItem>
              <MenuItem value="Leased">Mașina e în leasing</MenuItem>
              <MenuItem value="AddedLater">Adaug mașina mai târziu</MenuItem>
            </TextField>

            {!addLater && (
              <>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Nr. înmatriculare" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} sx={inputSx} fullWidth />
                  <TextField label="Serie șasiu (VIN)" value={vin} onChange={(e) => setVin(e.target.value)} sx={inputSx} fullWidth />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Marcă" value={make} onChange={(e) => setMake(e.target.value)} sx={inputSx} fullWidth />
                  <TextField label="Model" value={model} onChange={(e) => setModel(e.target.value)} sx={inputSx} fullWidth />
                  <TextField label="An fabricație" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))} sx={inputSx} fullWidth />
                </Stack>
              </>
            )}

            <Box>
              <Button variant="outlined" onClick={saveVehicle} disabled={busy}
                sx={{ textTransform: 'none', fontWeight: 700, borderColor: TOKENS.primary, color: TOKENS.primaryStrong }}>
                Salvează vehiculul
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* Copie conformă & ecusoane */}
        {data?.vehicleId && !addLater && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink }}>Copie conformă & ecusoane</Typography>
              {copy && <Chip size="small" label={COPY_STATUS_LABELS[copy.status] ?? copy.status} sx={{ fontWeight: 700 }} color={copy.status === 'Issued' ? 'success' : 'default'} />}
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
                  <MenuItem key={y} value={y}>{y} an{y > 1 ? 'i' : ''} — {lei(copyFeePerYear * y)} lei</MenuItem>
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
                Total copie conformă: <b>{lei(copyTotal)} lei</b> · Total ecusoane: <b>{lei(badgesTotal)} lei</b>
              </Alert>

              <Box>
                <Button variant="outlined" onClick={saveCopyRequest} disabled={busy}
                  sx={{ textTransform: 'none', fontWeight: 700, borderColor: TOKENS.primary, color: TOKENS.primaryStrong }}>
                  Salvează cererea
                </Button>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Dosarul */}
        {copy && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
            <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink, mb: 1.5 }}>
              Dosarul copie conformă & ecusoane
            </Typography>
            {copy.hasDossier && copy.dossierDocumentId ? (
              <Stack spacing={1.5}>
                <Alert icon={<CheckCircleOutlineRoundedIcon />} severity="success" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
                  Dosarul a fost generat.
                </Alert>
                <Button
                  startIcon={<DescriptionRoundedIcon />}
                  onClick={() => documentService.openInNewTab(copy.dossierDocumentId!, 'Dosar_Copie_Conforma.pdf')}
                  sx={{ textTransform: 'none', fontWeight: 700, color: TOKENS.primaryStrong, alignSelf: 'flex-start' }}
                >
                  Vezi dosarul
                </Button>
                <Button onClick={generate} disabled={busy} sx={{ textTransform: 'none', color: TOKENS.textMuted, alignSelf: 'flex-start' }}>
                  Regenerează
                </Button>
              </Stack>
            ) : (
              <Button variant="contained" onClick={generate} disabled={busy}
                sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: TOKENS.primary, '&:hover': { backgroundColor: TOKENS.primaryStrong } }}>
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
                  <Button variant="contained" onClick={markSubmitted} disabled={busy}
                    sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: TOKENS.primary, '&:hover': { backgroundColor: TOKENS.primaryStrong } }}>
                    Am depus dosarul la ARR
                  </Button>
                )}
              </>
            )}
          </Paper>
        )}

        {copy?.status === 'Issued' && (
          <Alert severity="success" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            Copie conformă emisă{copy.copyConformaNumber ? ` (nr. ${copy.copyConformaNumber})` : ''}
            {copy.expiresOn ? `, valabilă până la ${copy.expiresOn}` : ''}.
          </Alert>
        )}

        <Stack direction="row">
          <Button onClick={() => navigate('/onboarding')} sx={{ textTransform: 'none', color: TOKENS.textMuted }}>
            Înapoi la pași
          </Button>
        </Stack>
      </Stack>
    </OnboardingLayout>
  )
}
