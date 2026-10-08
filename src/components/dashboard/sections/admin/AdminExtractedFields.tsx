import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

import { documentService, type ExtractedField } from '../../../../services/document.service'
import { PANEL_COMPAT_TOKENS as TOKENS } from '../../../panel/tokens'
import { fade } from '../../../panel/tokens'

const FIELD_LABELS: Record<string, string> = {
  // Buletin
  full_name: 'Nume complet',
  nume: 'Nume',
  prenume: 'Prenume',
  cnp: 'CNP',
  date_of_birth: 'Data nașterii',
  serie_act: 'Seria CI',
  numar_act: 'Numărul CI',
  autoritate_emitenta: 'Emis de',
  data_emiterii: 'Data emiterii',
  data_expirarii: 'Data expirării',
  domiciliu_judet: 'Județ',
  domiciliu_localitate: 'Localitate',
  domiciliu_strada: 'Strada',
  domiciliu_numar: 'Număr',
  domiciliu_bloc: 'Bloc',
  domiciliu_scara: 'Scara',
  domiciliu_etaj: 'Etaj',
  domiciliu_apartament: 'Apartament',
  // Permis, atestat și alte acte personale
  category_b_obtained_on: 'Categoria B din',
  permis_emis_la_4a: 'Permis emis la (4a)',
  driving_categories: 'Categorii',
  licence_expires_on: 'Permis valabil până la',
  titular: 'Titular',
  titular_nume: 'Nume titular',
  titular_prenume: 'Prenume titular',
  titular_data_nasterii: 'Data nașterii titularului',
  cnp_titular: 'CNP titular',
  atestat_expires_on: 'Atestat valabil până la',
  unitate_emitenta: 'Unitatea emitentă',
  cod_parafa_medic: 'Parafa medicului',
  concluzie: 'Concluzie',
  judet: 'Județ',
  // PFA
  cui: 'CUI',
  legal_name: 'Denumire PFA',
  registry_number: 'Nr. registrul comerțului',
  holder_name: 'Titular PFA',
  professional_office: 'Sediu profesional',
  caen_codes: 'Coduri CAEN',
  authorized_activities: 'Activități autorizate',
  activity_location: 'Locul activității',
  work_points: 'Puncte de lucru',
  iban: 'IBAN',
  // Vehicul
  plate_number: 'Nr. înmatriculare',
  vin: 'Serie șasiu (VIN)',
  make: 'Marcă',
  model: 'Model',
  data_prima_inmatriculare: 'Prima înmatriculare (B)',
  data_inmatriculare: 'Înmatriculare (I)',
  itp_valabil_pana_la_toate: 'Vize ITP',
  authorization_number: 'Nr. autorizație',
  authorization_expires_on: 'Autorizație valabilă până la',
  copy_conforma_number: 'Nr. copie conformă',
  copy_conforma_expires_on: 'Copie conformă valabilă până la',
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

  const chipColor = confirmed ? 'var(--rl-green-text)' : lowConfidence ? 'var(--rl-yellow-text)' : TOKENS.textMuted
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
          sx={{ fontSize: '0.62rem', fontWeight: 700, bgcolor: fade(chipColor, 0.1), color: chipColor, flexShrink: 0 }}
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
            sx={{ fontWeight: 700, bgcolor: 'var(--rl-green-text)', '&:hover': { bgcolor: 'var(--rl-green-text)' }, boxShadow: 'none' }}>
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
    <Accordion defaultExpanded disableGutters sx={{ mx: 2, mb: 2, border: 0, bgcolor: 'grey.50', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon fontSize="small" />}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Date citite din document · {fields.length} câmpuri</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {fields.map((f) => (
          <FieldRow key={f.id} field={f} onSaved={load} />
        ))}
      </AccordionDetails>
    </Accordion>
  )
}
