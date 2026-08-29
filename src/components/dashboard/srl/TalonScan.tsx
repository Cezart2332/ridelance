import { useRef, useState } from 'react'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import DocumentScannerRoundedIcon from '@mui/icons-material/DocumentScannerRounded'

import { carsService, type VehicleRegistrationScan } from '../../../services/cars.service'
import { DASHBOARD_TOKENS } from '../dashboardTheme'

/**
 * Citește talonul și completează numărul de înmatriculare și VIN-ul.
 *
 * Există pentru că amândouă se tastează greșit des și niciunul nu se poate ghici din altceva:
 * pozele anunțului nu ajută, lor li se estompează plăcuța la încărcare, deliberat. Fișierul ales
 * aici nu se salvează — e o citire, nu o depunere în dosarul mașinii.
 *
 * Câmpurile se completează chiar și când valoarea citită nu are formatul obișnuit; atunci se
 * spune asta sub buton. Un câmp lăsat gol, fără explicație, ar fi trimis omul să caute singur ce
 * n-a mers.
 */

type State =
  | { kind: 'idle' }
  | { kind: 'scanning' }
  | { kind: 'done'; message: string; warning: boolean }

export interface TalonScanProps {
  /** Ce s-a citit. Părintele decide în ce câmpuri pune valorile. */
  onRead: (scan: VehicleRegistrationScan) => void
}

/** Ce s-a completat și ce merită verificat, într-o singură propoziție. */
function summarise(scan: VehicleRegistrationScan): { message: string; warning: boolean } {
  if (scan.note) {
    return { message: scan.note, warning: true }
  }

  const filled = [scan.plateNumber && 'numărul', scan.vin && 'VIN-ul'].filter(Boolean)
  const suspect = [
    scan.plateNumber && !scan.plateNumber.matchesFormat && 'numărul',
    scan.vin && !scan.vin.matchesFormat && 'VIN-ul',
  ].filter(Boolean)

  if (filled.length === 0) {
    return { message: 'N-am găsit nimic de completat în document.', warning: true }
  }

  const completed = `Am completat ${filled.join(' și ')}.`

  return suspect.length > 0
    ? { message: `${completed} Verifică ${suspect.join(' și ')} — nu arată a format obișnuit.`, warning: true }
    : { message: completed, warning: false }
}

export function TalonScan({ onRead }: TalonScanProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [state, setState] = useState<State>({ kind: 'idle' })

  const scan = async (file: File | undefined) => {
    if (!file) return

    setState({ kind: 'scanning' })
    try {
      const result = await carsService.scanRegistration(file)
      onRead(result)
      setState({ kind: 'done', ...summarise(result) })
    } catch (cause) {
      const detail = (cause as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setState({
        kind: 'done',
        message: detail ?? 'Nu am putut citi documentul. Completează câmpurile de mai jos.',
        warning: true,
      })
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const scanning = state.kind === 'scanning'

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1.6}
        onClick={scanning ? undefined : () => inputRef.current?.click()}
        sx={{
          alignItems: 'center',
          px: 1.8,
          py: 1.4,
          borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
          border: `1.5px dashed ${DASHBOARD_TOKENS.borderHover}`,
          bgcolor: DASHBOARD_TOKENS.surface,
          cursor: scanning ? 'progress' : 'pointer',
          transition: 'border-color 150ms ease, background-color 150ms ease',
          '&:hover': scanning
            ? undefined
            : { borderColor: DASHBOARD_TOKENS.accent, bgcolor: DASHBOARD_TOKENS.accentWash },
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: `${DASHBOARD_TOKENS.radius.sm}px`,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(DASHBOARD_TOKENS.accent, 0.1),
            color: DASHBOARD_TOKENS.accent,
          }}
        >
          {scanning ? (
            <CircularProgress size={16} sx={{ color: DASHBOARD_TOKENS.accent }} />
          ) : (
            <DocumentScannerRoundedIcon sx={{ fontSize: 18 }} />
          )}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: DASHBOARD_TOKENS.ink }}>
            {scanning ? 'Se citește talonul…' : 'Scanează talonul'}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }}>
            O poză sau un PDF, iar numărul și VIN-ul se completează singure.
          </Typography>
        </Box>

        <Box
          component="input"
          type="file"
          ref={inputRef}
          accept="image/jpeg,image/png,application/pdf"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => void scan(event.target.files?.[0])}
          sx={{ display: 'none' }}
        />
      </Stack>

      {state.kind === 'done' && (
        <Typography
          sx={{
            mt: 0.8,
            fontSize: '0.78rem',
            fontWeight: 600,
            color: state.warning ? DASHBOARD_TOKENS.stateWarning : DASHBOARD_TOKENS.accent,
          }}
        >
          {state.message}
        </Typography>
      )}
    </Box>
  )
}

export default TalonScan
