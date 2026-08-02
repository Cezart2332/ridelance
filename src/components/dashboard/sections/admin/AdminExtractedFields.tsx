import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useState } from 'react'

import { documentService, type ExtractedField } from '../../../../services/document.service'
import { TOKENS } from '../../../../constants/tokens'

const FIELD_LABELS: Record<string, string> = {
  cui: 'CUI',
  legal_name: 'Denumire PFA',
  registry_number: 'Nr. registrul comerțului',
  caen_codes: 'Coduri CAEN',
  plate_number: 'Nr. înmatriculare',
  vin: 'Serie șasiu (VIN)',
  make: 'Marcă',
  model: 'Model',
}

const fieldLabel = (key: string) => FIELD_LABELS[key] ?? key

function FieldRow({ field, onSaved }: { field: ExtractedField; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(field.effectiveValue ?? '')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const pct = Math.round(field.effectiveConfidence * 100)
  const lowConfidence = field.reviewState === 'NeedsManualReview'
  const confirmed = field.confirmedSource !== 'None'

  const chipColor = confirmed ? '#10b981' : lowConfidence ? '#f59e0b' : TOKENS.textMuted
  const chipLabel = confirmed
    ? `Confirmat (${field.confirmedSource === 'Admin' ? 'admin' : 'client'})`
    : lowConfidence
      ? `De verificat · ${pct}%`
      : `Din document · ${pct}%`

  const save = async () => {
    if (!reason.trim()) return
    setBusy(true)
    try {
      await documentService.correctExtractedField(field.id, value || null, reason.trim())
      setEditing(false)
      setReason('')
      onSaved()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ py: 0.6 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ minWidth: 140, color: TOKENS.textMuted, fontWeight: 700 }}>
          {fieldLabel(field.fieldKey)}
        </Typography>
        <Typography variant="body2" sx={{ flex: 1, fontWeight: 650, color: TOKENS.ink, wordBreak: 'break-word' }}>
          {field.effectiveValue || '—'}
        </Typography>
        <Chip
          size="small"
          label={chipLabel}
          sx={{ fontSize: '0.62rem', fontWeight: 700, bgcolor: alpha(chipColor, 0.1), color: chipColor, flexShrink: 0 }}
        />
        {!field.isSensitive && !editing && (
          <IconButton size="small" onClick={() => { setValue(field.effectiveValue ?? ''); setEditing(true) }} title="Corectează">
            <EditRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        )}
      </Stack>

      {editing && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 0.8, pl: { sm: '148px' } }}>
          <TextField size="small" label="Valoare corectă" value={value} onChange={(e) => setValue(e.target.value)} sx={{ flex: 1 }} />
          <TextField size="small" label="Motiv (obligatoriu)" value={reason} onChange={(e) => setReason(e.target.value)} sx={{ flex: 1 }} />
          <Button size="small" variant="contained" disabled={busy || !reason.trim()} startIcon={<CheckRoundedIcon />} onClick={save}
            sx={{ fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, boxShadow: 'none' }}>
            Salvează
          </Button>
          <Button size="small" onClick={() => setEditing(false)} sx={{ color: TOKENS.textMuted }}>Renunță</Button>
        </Stack>
      )}
    </Box>
  )
}

/** Datele extrase automat (OCR) ale unui document, cu corectare de către admin. */
export default function AdminExtractedFields({ documentId }: { documentId: string }) {
  const [fields, setFields] = useState<ExtractedField[]>([])

  const load = () => {
    documentService
      .getExtractedFieldsAdmin(documentId)
      .then((r) => setFields(r.fields))
      .catch(() => setFields([]))
  }

  useEffect(load, [documentId])

  if (fields.length === 0) {
    return null
  }

  return (
    <Box sx={{ px: 2, pb: 1.2, pl: 6.5 }}>
      <Box sx={{ borderLeft: `2px solid ${alpha(TOKENS.primary, 0.25)}`, pl: 1.5 }}>
        <Typography variant="caption" sx={{ color: TOKENS.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Date extrase automat
        </Typography>
        {fields.map((f) => (
          <FieldRow key={f.id} field={f} onSaved={load} />
        ))}
      </Box>
    </Box>
  )
}
