import { useEffect, useState } from 'react'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'

import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { StatusChip, formatLei } from '../../ui'
import { tabularNums } from '../../home/tokens'
import { clientAnnualService } from '../../../../services/clientAnnual.service'
import { getErrorMessage } from '../../../../utils/errorHandler'
import type { ClientAnnual } from '../../../../shared/accounting/api/types'

function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  return day && month && year ? `${day}.${month}.${year}` : value
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>{label}</Typography>
      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '0.92rem', ...tabularNums }}>{value}</Typography>
    </Stack>
  )
}

/**
 * Anul fiscal încheiat (spec declarații F53): „Ai avut alte venituri…?” cu Da/Nu, fără alt pas.
 * După generarea D212, sumele anuale și termenul.
 */
export function AnnualQuestionCard() {
  const year = new Date().getFullYear() - 1
  const [data, setData] = useState<ClientAnnual | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    clientAnnualService.get(year).then(
      (value) => !cancelled && setData(value),
      () => !cancelled && setData(null),
    )
    return () => {
      cancelled = true
    }
  }, [year])

  if (!data) return null

  const answer = async (value: boolean) => {
    setSaving(true)
    setError(null)
    try {
      await clientAnnualService.answerExternalIncome(year, value)
      setData(await clientAnnualService.get(year))
    } catch (failure) {
      setError(getErrorMessage(failure))
    } finally {
      setSaving(false)
    }
  }

  const total = (data.incomeTaxDue ?? 0) + (data.casDue ?? 0) + (data.cassDue ?? 0)
  const choice = (value: boolean, label: string) => (
    <Button
      variant={data.hasExternalIncome === value ? 'contained' : 'outlined'}
      disabled={saving}
      onClick={() => void answer(value)}
      sx={{ minWidth: 88 }}
    >
      {label}
    </Button>
  )

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: `${DASHBOARD_TOKENS.radius.lg}px`,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        bgcolor: DASHBOARD_TOKENS.paper,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Anul fiscal {year}</Typography>
        <Box sx={{ flex: 1 }} />
        {data.hasExternalIncome === null && <StatusChip tone="warning" label="Răspuns necesar" size="sm" />}
      </Stack>

      <Stack spacing={1.5}>
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontSize: '0.92rem', fontWeight: 600 }}>
          Ai avut alte venituri, contribuții sau situații fiscale care nu apar în RIDElance?
        </Typography>
        <Stack direction="row" spacing={1}>
          {choice(true, 'Da')}
          {choice(false, 'Nu')}
        </Stack>
        {error && <Typography sx={{ color: DASHBOARD_TOKENS.stateError, fontSize: '0.85rem' }}>{error}</Typography>}
        {data.hasExternalIncome === true && !data.supplementCompleted && (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>Contabila te contactează pentru detalii.</Typography>
        )}

        {data.d212Status && (
          <Stack spacing={0.8} sx={{ pt: 1 }}>
            <Row label="Impozit pe venit" value={formatLei(data.incomeTaxDue ?? 0)} />
            <Row label="CAS" value={formatLei(data.casDue ?? 0)} />
            <Row label="CASS" value={formatLei(data.cassDue ?? 0)} />
            <Row label="Total" value={formatLei(total)} />
            {data.dueDate && <Row label="Termen" value={formatDate(data.dueDate)} />}
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
