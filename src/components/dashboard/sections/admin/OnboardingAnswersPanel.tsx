import { Box, Chip, Stack, Typography } from '@mui/material'

import type { OnboardingAnswerRecord } from '../../../../services/onboarding.service'

function answerTone(record: OnboardingAnswerRecord): 'success' | 'warning' | 'default' {
  if (record.value === 'yes') return 'success'
  if (record.value === 'no') return 'warning'
  return 'default'
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * Ce a răspuns clientul la un pas: fiecare Da, fiecare Nu, alegerile și câmpurile completate
 * (fără parole). Unde a schimbat un răspuns, apare și ce răspunsese înainte.
 *
 * Stă în cardul pasului din „Verificarea dosarului”, lângă actele și datele lui — nu într-un panou
 * separat, unde adminul trebuia să caute răspunsurile unui pas departe de pasul însuși.
 */
export function StepAnswers({ answers }: { answers: OnboardingAnswerRecord[] }) {
  return (
    <Stack component="ul" data-testid="onboarding-answers" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {answers.map((a, index) => (
        <Stack
          component="li"
          key={a.questionId}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 0.5, sm: 2 }}
          sx={{
            py: 1.1,
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            borderTop: index > 0 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2">{a.question}</Typography>
            <Typography variant="caption" color="text.disabled">
              {formatWhen(a.answeredAtUtc)}
              {a.previousLabels.length > 0 && ` · înainte: ${a.previousLabels.join(' → ')}`}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={a.valueLabel}
            color={answerTone(a)}
            variant={answerTone(a) === 'default' ? 'outlined' : 'filled'}
            sx={{ fontWeight: 700, maxWidth: { xs: '100%', sm: 360 }, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        </Stack>
      ))}
    </Stack>
  )
}
