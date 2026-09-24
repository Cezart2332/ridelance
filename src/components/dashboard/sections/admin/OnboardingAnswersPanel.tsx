import { useEffect, useState } from 'react'
import { Alert, Box, Chip, Divider, Stack, Typography } from '@mui/material'

import { EmptyState } from '../../../admin/EmptyState'
import { Section } from '../../../admin/Section'
import { SectionSkeleton } from '../../../admin/SectionSkeleton'
import { onboardingService, type OnboardingAnswerRecord } from '../../../../services/onboarding.service'
import { getErrorMessage } from '../../../../utils/errorHandler'

/** Pașii, în ordinea din onboarding. Un pas necunoscut apare la final, cu cheia lui. */
const STEP_LABEL: Record<string, string> = {
  eligibility: 'Eligibilitate',
  pfa: 'PFA',
  fiscal: 'Fiscal și bancă',
  arr: 'Autorizație ARR',
  platforms: 'Platforme',
  vehicle: 'Vehicul',
}
const STEP_ORDER = Object.keys(STEP_LABEL)

function answerTone(record: OnboardingAnswerRecord): 'success' | 'warning' | 'default' {
  if (record.value === 'yes') return 'success'
  if (record.value === 'no') return 'warning'
  return 'default'
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * Tot ce a răspuns clientul în onboarding, pe pași: fiecare Da, fiecare Nu, alegerile și câmpurile
 * completate (fără parole). Unde a schimbat un răspuns, apare și ce răspunsese înainte.
 */
export function OnboardingAnswersPanel({ pfaId, refreshKey }: { pfaId: string; refreshKey?: number }) {
  const [answers, setAnswers] = useState<OnboardingAnswerRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    onboardingService
      .getAnswersForRegistration(pfaId)
      .then((loaded) => {
        if (cancelled) return
        setAnswers(loaded)
        setError(null)
      })
      .catch((err: unknown) => !cancelled && setError(getErrorMessage(err, 'Nu am putut încărca răspunsurile din onboarding.')))
    return () => {
      cancelled = true
    }
  }, [pfaId, refreshKey])

  const groups = (answers ?? []).reduce<Record<string, OnboardingAnswerRecord[]>>((acc, a) => {
    ;(acc[a.stepKey] ??= []).push(a)
    return acc
  }, {})
  const stepKeys = Object.keys(groups).sort((a, b) => {
    const ia = STEP_ORDER.indexOf(a)
    const ib = STEP_ORDER.indexOf(b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })

  return (
    <Section title="Răspunsuri din onboarding" flush>
      <Box data-testid="onboarding-answers">
        {error && (
          <Box sx={{ p: 2.5 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        {!answers && !error && (
          <Box sx={{ p: 2.5 }}>
            <SectionSkeleton rows={3} />
          </Box>
        )}
        {answers && answers.length === 0 && (
          <Box sx={{ px: 2.5 }}>
            <EmptyState
              title="Clientul n-a răspuns încă la nicio întrebare."
              description="Răspunsurile se salvează de acum înainte; cele date înainte de actualizare nu au fost păstrate."
            />
          </Box>
        )}
        {stepKeys.map((key, index) => (
          <Box key={key}>
            {index > 0 && <Divider />}
            <Typography
              variant="overline"
              component="h3"
              sx={{ display: 'block', px: 2.5, pt: 2, pb: 0.5, color: 'text.secondary', fontWeight: 700 }}
            >
              {STEP_LABEL[key] ?? key}
            </Typography>
            <Stack component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {groups[key].map((a) => (
                <Stack
                  component="li"
                  key={a.questionId}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 0.5, sm: 2 }}
                  sx={{ px: 2.5, py: 1.25, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
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
          </Box>
        ))}
      </Box>
    </Section>
  )
}
