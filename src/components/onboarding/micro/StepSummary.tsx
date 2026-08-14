import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'

import { isAiPending, type DocumentSummary } from '../../../services/document.service'
import type { MicroStepAnswers, MicroStepView } from '../microStepTypes'
import { TOKENS } from '../onboardingTheme'

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

interface StepSummaryProps {
  /** Micro-pașii pasului curent, mai puțin rezumatul însuși. */
  steps: MicroStepView[]
  answers: MicroStepAnswers
  documents: DocumentSummary[]
  onEdit: (id: string) => void
}

/**
 * Rezumatul pasului: ce a răspuns și ce a încărcat, cu posibilitatea de a schimba orice.
 *
 * Documentele încă în verificare NU blochează — chip-ul „Se verifică" o spune, butonul rămâne
 * activ. Dacă unul pică după ce a avansat, pasul se redeschide singur în rail.
 */
export function StepSummary({ steps, answers, documents, onEdit }: StepSummaryProps) {
  const docFor = (categories: string[]): DocumentSummary | null =>
    documents.filter((d) => categories.includes(d.category)).sort(byNewest)[0] ?? null

  const rows = steps.map((view) => {
    const { def } = view

    if (def.kind === 'upload' && def.document) {
      const doc = docFor([def.document.category])
      return {
        id: def.id,
        label: def.document.label,
        value: doc?.originalFileName ?? 'Neîncărcat',
        pending: doc !== null && isAiPending(doc),
      }
    }

    const answer = answers[def.id]

    // Bifuri multiple: se listează ce s-a ales, nu doar prima variantă.
    if (Array.isArray(answer)) {
      const titles = answer
        .map((value) => def.choices?.find((c) => c.value === value)?.title ?? value)
        .join(', ')
      return { id: def.id, label: def.railLabel, value: titles || 'Nimic ales', pending: false }
    }

    // Câmpurile de text nu au valoare proprie sub `def.id` — se cheie pe câmp.
    if (def.kind === 'text') {
      const filled = (def.fields ?? [])
        .map((field) => answers[`${def.id}.${field.key}`])
        .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
      return {
        id: def.id,
        label: def.railLabel,
        value: filled.length > 0 ? filled.join(' · ') : 'Necompletat',
        pending: false,
      }
    }

    const choice = def.choices?.find((c) => c.value === answer)
    return {
      id: def.id,
      label: def.railLabel,
      value: choice?.title ?? 'Confirmat din documente',
      pending: false,
    }
  })

  return (
    <Stack spacing={2.5}>
      <Box component="dl" sx={{ m: 0, display: 'grid', gap: 0 }}>
        {rows.map((row, index) => (
          <Stack
            key={row.id}
            direction="row"
            sx={{
              alignItems: 'center',
              gap: 2,
              py: 1.75,
              borderTop: index === 0 ? 'none' : `1px solid ${TOKENS.border}`,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="dt" variant="caption" sx={{ color: TOKENS.textMuted }}>
                {row.label}
              </Typography>
              <Typography
                component="dd"
                variant="body2"
                noWrap
                sx={{ m: 0, color: TOKENS.ink, fontWeight: 600 }}
              >
                {row.value}
              </Typography>
            </Box>

            {row.pending ? (
              <Chip size="small" icon={<AutorenewRoundedIcon />} label="Se verifică" />
            ) : (
              <Chip
                size="small"
                icon={<CheckCircleRoundedIcon />}
                label="Gata"
                color="success"
                variant="outlined"
              />
            )}

            <Button size="small" onClick={() => onEdit(row.id)} sx={{ color: TOKENS.textMuted }}>
              Modifică
            </Button>
          </Stack>
        ))}
      </Box>
    </Stack>
  )
}
