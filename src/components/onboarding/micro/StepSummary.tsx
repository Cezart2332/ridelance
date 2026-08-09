import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material'

import { isAiPending, type DocumentSummary } from '../../../services/document.service'
import type { MicroStepView } from '../microStepTypes'
import { TOKENS } from '../onboardingTheme'

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

interface StepSummaryProps {
  /** Micro-pașii pasului curent, mai puțin rezumatul însuși. */
  steps: MicroStepView[]
  answers: Record<string, string>
  documents: DocumentSummary[]
  onEdit: (id: string) => void
}

/**
 * Rezumatul pasului: ce a răspuns și ce a încărcat, cu posibilitatea de a schimba orice.
 *
 * Documentele încă în verificare NU blochează: le arătăm ca atare și spunem clar că se poate
 * continua. Dacă unul pică după ce a avansat, pasul se redeschide singur în rail.
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
    const choice = def.choices?.find((c) => c.value === answer)
    return {
      id: def.id,
      label: def.railLabel,
      value: choice?.title ?? 'Confirmat din documente',
      pending: false,
    }
  })

  const verifying = rows.some((r) => r.pending)

  return (
    <Stack spacing={2.5}>
      {verifying && (
        <Alert severity="info" icon={<AutorenewRoundedIcon />}>
          Verificăm automat documentele. Nu trebuie să aștepți — poți trece la pasul următor, iar
          dacă apare o problemă îți spunem.
        </Alert>
      )}

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
