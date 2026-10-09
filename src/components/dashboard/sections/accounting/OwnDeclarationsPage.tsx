import { useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'

import { DASHBOARD_TOKENS as T } from '../../dashboardTheme'
import { PageHeader } from '../../ui'
import { formatLei } from '../../../../shared/money'
import { formatDate } from '../../../../shared/accounting/format'
import { useApi } from '../../../../shared/accounting/ui/useApi'
import { ownDeclarationsService, type OwnGenerationResult } from '../../../../services/ownDeclarations.service'
import { documentService } from '../../../../services/document.service'
import { getErrorMessage } from '../../../../utils/errorHandler'

const MONTHS = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie']

const periodLabel = (period: string) =>
  period.length === 4 ? `Anul ${period}` : `${MONTHS[Number(period.slice(5, 7)) - 1]} ${period.slice(0, 4)}`

/** Ultima lună încheiată: declarațiile lunare se fac doar după sfârșitul lunii. */
function lastClosedMonth(): { year: number; month: number } {
  const now = new Date()
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return { year: previous.getFullYear(), month: previous.getMonth() + 1 }
}

/**
 * PFAlone → Declarații: generează D100, D301, D390 (lunare) și D212 (anuală) din ce a trecut el;
 * XML-ul îl descarcă și îl depune singur în SPV. D700 nu e aici: ține de onboarding.
 */
export function OwnDeclarationsPage() {
  const closed = lastClosedMonth()
  const [year, setYear] = useState(closed.year)
  const [month, setMonth] = useState(closed.month)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<OwnGenerationResult | null>(null)
  const [error, setError] = useState('')
  const list = useApi(() => ownDeclarationsService.list(year), [year])

  const run = async (work: () => Promise<OwnGenerationResult>) => {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      setResult(await work())
      list.reload()
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const period = `${year}-${String(month).padStart(2, '0')}`
  const years = Array.from({ length: 4 }, (_, index) => closed.year - index)

  return (
    <Stack spacing={2.5}>
      <PageHeader title="Declarații" />

      <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: `${T.radius.lg}px`, border: `1px solid ${T.border}` }}>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1.5, alignItems: { md: 'center' } }}>
          <TextField select size="small" label="An" value={year} onChange={(event) => setYear(Number(event.target.value))} sx={{ minWidth: 120 }}>
            {years.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Luna" value={month} onChange={(event) => setMonth(Number(event.target.value))} sx={{ minWidth: 160 }}>
            {MONTHS.map((label, index) => <MenuItem key={label} value={index + 1}>{label}</MenuItem>)}
          </TextField>
          <Button variant="contained" disabled={busy} onClick={() => void run(() => ownDeclarationsService.generateMonthly(period))} sx={{ fontWeight: 700 }}>
            Generează lunare
          </Button>
          <Button variant="outlined" disabled={busy} onClick={() => void run(() => ownDeclarationsService.generateAnnual(year))} sx={{ fontWeight: 700 }}>
            Generează D212 {year}
          </Button>
          {busy && <CircularProgress size={20} />}
        </Stack>
      </Paper>

      {result && <Alert severity={result.generated ? 'success' : 'warning'} onClose={() => setResult(null)}>{result.message}</Alert>}
      {(error || list.error) && <Alert severity="error" onClose={() => setError('')}>{error || list.error}</Alert>}

      <Paper elevation={0} sx={{ borderRadius: `${T.radius.lg}px`, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        {list.loading ? (
          <Stack sx={{ p: 4, alignItems: 'center' }}><CircularProgress size={24} /></Stack>
        ) : list.data && list.data.length > 0 ? (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Declarație</TableCell>
                  <TableCell>Perioada</TableCell>
                  <TableCell align="right">De plată</TableCell>
                  <TableCell>Termen</TableCell>
                  <TableCell align="right">XML</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.data.map((item) => (
                  <TableRow key={item.declarationId}>
                    <TableCell sx={{ fontWeight: 700 }}>{item.type}</TableCell>
                    <TableCell>{periodLabel(item.period)}</TableCell>
                    <TableCell align="right">{formatLei(item.amount)}</TableCell>
                    <TableCell>{item.dueDate ? formatDate(item.dueDate) : '—'}</TableCell>
                    <TableCell align="right">
                      {item.xmlDocumentId ? (
                        <Button
                          size="small"
                          startIcon={<DownloadRoundedIcon />}
                          onClick={() => void documentService.downloadAndSave(item.xmlDocumentId!, `${item.type}_${item.period}.xml`)}
                        >
                          Descarcă
                        </Button>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ p: 2, color: T.textMuted }}>Nicio declarație generată în {year}.</Typography>
        )}
      </Paper>
    </Stack>
  )
}
