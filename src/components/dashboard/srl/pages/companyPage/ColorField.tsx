import { Box, Stack, TextField, Typography } from '@mui/material'

import { DASHBOARD_TOKENS, dashboardInputSx } from '../../../dashboardTheme'
import { isHex } from '../../../../company/companyTheme'

/**
 * O culoare din tema mini-site-ului: pastilă de ales + hex scris de mână.
 *
 * `<input type="color">` nativ, fără bibliotecă de picker: proiectul n-are una, iar selectorul
 * sistemului e cel pe care omul îl cunoaște deja și cel care are pipetă pe majoritatea
 * platformelor. Câmpul hex de lângă el există pentru cazul real — cineva are codul culorii de
 * brand scris undeva și vrea să-l lipească, nu să-l caute pe roată.
 */
interface ColorFieldProps {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  /** Avertismentul de contrast, când culoarea asta face textul greu de citit. */
  warning?: string | null
}

export function ColorField({ label, hint, value, onChange, warning }: ColorFieldProps) {
  const valid = isHex(value)

  return (
    <Box>
      <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
        <Box
          component="input"
          type="color"
          aria-label={label}
          value={valid ? value : '#FFFFFF'}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value.toUpperCase())
          }
          sx={{
            width: 46,
            height: 40,
            p: 0,
            flexShrink: 0,
            cursor: 'pointer',
            borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            bgcolor: 'transparent',
            // Chrome desenează culoarea într-un pătrat cu marginile lui; le scoatem ca pastila să
            // arate ca restul câmpurilor din dashboard.
            '&::-webkit-color-swatch-wrapper': { padding: '3px' },
            '&::-webkit-color-swatch': { border: 'none', borderRadius: `${DASHBOARD_TOKENS.radius.sm}px` },
          }}
        />
        <TextField
          label={label}
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          size="small"
          fullWidth
          error={!valid}
          helperText={!valid ? 'Scrie un cod de forma #RRGGBB.' : (hint ?? ' ')}
          sx={dashboardInputSx}
        />
      </Stack>

      {warning && (
        <Typography
          role="status"
          sx={{ mt: 0.4, fontSize: '0.78rem', fontWeight: 600, color: DASHBOARD_TOKENS.stateWarning }}
        >
          {warning}
        </Typography>
      )}
    </Box>
  )
}
