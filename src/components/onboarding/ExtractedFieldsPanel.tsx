import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

import {
  documentService,
  type ExtractedField,
  type ExtractedFieldsResponse,
} from '../../services/document.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { TOKENS, inputSx } from './onboardingTheme'

const FIELD_LABELS: Record<string, string> = {
  cui: 'CUI',
  legal_name: 'Denumire PFA',
  registry_number: 'Nr. registrul comerțului',
  plate_number: 'Nr. înmatriculare',
  vin: 'Serie șasiu (VIN)',
  make: 'Marcă',
  model: 'Model',
}

const fieldLabel = (key: string) => FIELD_LABELS[key] ?? key

export default function ExtractedFieldsPanel({
  documentId,
  readOnly = false,
}: {
  documentId: string
  readOnly?: boolean
}) {
  const [data, setData] = useState<ExtractedFieldsResponse | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const apply = (d: ExtractedFieldsResponse) => {
    setData(d)
    const next: Record<string, string> = {}
    for (const f of d.fields) {
      next[f.fieldKey] = f.effectiveValue ?? ''
    }
    setValues(next)
  }

  useEffect(() => {
    let active = true
    documentService
      .getExtractedFields(documentId)
      .then((d) => {
        if (active) apply(d)
      })
      .catch(() => {
        // Documentul poate să nu aibă câmpuri extrase — nu e o eroare vizibilă.
      })
    return () => {
      active = false
    }
  }, [documentId])

  if (!data || data.fields.length === 0) {
    return null
  }

  const editable = !readOnly && data.fields.some((f) => !f.isSensitive)

  const confirm = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = data.fields
        .filter((f) => !f.isSensitive)
        .map((f) => ({ fieldKey: f.fieldKey, value: values[f.fieldKey] ?? null }))
      apply(await documentService.confirmExtractedFields(documentId, payload))
      setSaved(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const fieldChip = (f: ExtractedField) => {
    if (f.confirmedSource !== 'None') {
      return <Chip size="small" icon={<CheckCircleRoundedIcon />} label="Confirmat" color="success" sx={{ fontWeight: 700 }} />
    }
    if (f.reviewState === 'NeedsManualReview') {
      return <Chip size="small" icon={<WarningAmberRoundedIcon />} label="De verificat" color="warning" sx={{ fontWeight: 700 }} />
    }
    return <Chip size="small" label="Din document" variant="outlined" sx={{ fontWeight: 700 }} />
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}`, backgroundColor: TOKENS.paper }}>
      <Typography sx={{ fontWeight: 750, fontSize: '1.02rem', color: TOKENS.ink }}>
        Date extrase din document
      </Typography>
      <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.85rem', mt: 0.3, mb: 2 }}>
        Le-am citit automat din document. Verifică-le și corectează dacă e nevoie — cele marcate „de
        verificat" au încredere mică.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: `${TOKENS.radius.md}px` }}>{error}</Alert>}

      <Stack spacing={2}>
        {data.fields.map((f) => (
          <Box key={f.id}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontWeight: 650, fontSize: '0.88rem', color: TOKENS.ink }}>
                {fieldLabel(f.fieldKey)}
              </Typography>
              {fieldChip(f)}
            </Stack>
            <TextField
              fullWidth
              size="small"
              value={f.isSensitive ? (f.effectiveValue ?? '') : (values[f.fieldKey] ?? '')}
              disabled={f.isSensitive || readOnly}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.fieldKey]: e.target.value }))}
              sx={inputSx}
            />
          </Box>
        ))}
      </Stack>

      {editable && (
        <Box sx={{ mt: 2.5 }}>
          <Button
            variant="contained"
            onClick={confirm}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: TOKENS.primary, '&:hover': { backgroundColor: TOKENS.primaryStrong } }}
          >
            {saving ? 'Se salvează...' : saved ? 'Salvat — confirmă din nou' : 'Confirmă datele'}
          </Button>
        </Box>
      )}
    </Paper>
  )
}
