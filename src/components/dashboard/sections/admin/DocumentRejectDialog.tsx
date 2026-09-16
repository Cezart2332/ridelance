import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { useState } from 'react'

import { TOKENS } from '../../../../constants/tokens'
import type { DocumentSummary } from '../../../../services/document.service'
import { formatDocumentCategory } from '../../../../utils/formatters'

/**
 * Respingerea unui document, cu motiv.
 *
 * Butonul respingea direct, fără text, iar clientul vedea doar un cerc roșu cu semnul exclamării
 * — nimic despre ce anume era greșit. Motivul e obligatoriu și ajunge la el lângă document, în
 * notificare și pe email.
 */
export function DocumentRejectDialog({
  document,
  onClose,
  onConfirm,
}: {
  document: DocumentSummary | null
  onClose: () => void
  onConfirm: (document: DocumentSummary, note: string) => Promise<boolean>
}) {
  // Montat din nou la fiecare document (vezi `key` la apelant), deci pornește mereu gol.
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    if (!document || !note.trim() || saving) return
    setSaving(true)
    setError(false)
    try {
      if (await onConfirm(document, note.trim())) onClose()
      else setError(true)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={document !== null} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth aria-labelledby="reject-document-title">
      <DialogTitle id="reject-document-title">Respinge documentul</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ mb: 1, overflowWrap: 'anywhere' }}>{document?.originalFileName}</Typography>
        <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 2 }}>
          {document ? `„${formatDocumentCategory(document.category)}” — ` : ''}
          respingi acest fișier individual. Explică ce trebuie corectat pentru ca utilizatorul să poată încărca o variantă nouă.
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          autoFocus
          label="Motivul respingerii"
          required
          disabled={saving}
          slotProps={{ htmlInput: { maxLength: 1024 } }}
          helperText={`${note.length}/1024 caractere · Motivul va fi transmis clientului.`}
          placeholder="Ex.: Poza e neclară, nu se citește data expirării."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>Documentul nu a putut fi respins. Motivul a fost păstrat; încearcă din nou.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Anulează</Button>
        <Button
          variant="contained"
          color="error"
          disabled={!note.trim() || saving}
          onClick={() => void submit()}
          sx={{ fontWeight: 700, boxShadow: 'none' }}
        >
          {saving ? 'Se salvează…' : 'Respinge documentul'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
