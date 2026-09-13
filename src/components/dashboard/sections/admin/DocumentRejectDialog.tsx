import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
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
  onConfirm: (document: DocumentSummary, note: string) => void
}) {
  // Montat din nou la fiecare document (vezi `key` la apelant), deci pornește mereu gol.
  const [note, setNote] = useState('')

  return (
    <Dialog open={document !== null} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Respinge documentul</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 2 }}>
          {document ? `„${formatDocumentCategory(document.category)}” — ` : ''}
          clientul vede motivul lângă document, în notificare și pe email. Scrie-l ca instrucțiune.
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          autoFocus
          placeholder="Ex.: Poza e neclară, nu se citește data expirării."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Anulează</Button>
        <Button
          variant="contained"
          color="error"
          disabled={!note.trim()}
          onClick={() => document && onConfirm(document, note.trim())}
          sx={{ fontWeight: 700, boxShadow: 'none' }}
        >
          Respinge
        </Button>
      </DialogActions>
    </Dialog>
  )
}
