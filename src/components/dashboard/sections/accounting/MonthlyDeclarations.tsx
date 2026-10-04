import { useEffect, useState } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'

import { DASHBOARD_TOKENS as T } from '../../dashboardTheme'
import { StatusChip, formatLei, type StatusTone } from '../../ui'
import { tabularNums } from '../../home/tokens'
import { clientDeclarationsService, type ClientDeclaration, type ClientDeclarationState } from '../../../../services/clientDeclarations.service'
import { openDocument } from '../../../common/documentViewerBus'

/** Ce e fiecare declarație pentru PFA, fără coduri tehnice ca titlu (spec declarații §7). */
const TITLE: Record<string, string> = {
  D100: 'Impozit nerezident',
  D301: 'TVA intracomunitar',
  D390: 'Declarație recapitulativă',
  D207: 'Informativă nerezidenți',
  D205: 'Informativă chirii',
  D212: 'Declarația unică',
}

const STATE: Record<ClientDeclarationState, { label: string; tone: StatusTone }> = {
  IN_PREPARATION: { label: 'În pregătire', tone: 'neutral' },
  SUBMITTED: { label: 'Depusă', tone: 'warning' },
  CONFIRMED_BY_ANAF: { label: 'Confirmată ANAF', tone: 'active' },
  WITH_ACCOUNTANT: { label: 'La contabil', tone: 'warning' },
}

function periodLabel(period: string): string {
  if (period.length === 4) return `Anul ${period}`
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
}

function dateLabel(value: string): string {
  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}

/**
 * Taxele lunare de plată (QA 11): din declarațiile generate de contabil, cu suma, termenul și starea.
 * „Confirmată ANAF” doar cu recipisa.
 */
export function MonthlyDeclarations({ year, onLoaded }: { year: number; onLoaded?: (count: number) => void }) {
  const [items, setItems] = useState<ClientDeclaration[] | null>(null)

  useEffect(() => {
    let cancelled = false
    clientDeclarationsService.list(year).then(
      (list) => {
        if (cancelled) return
        setItems(list)
        onLoaded?.(list.length)
      },
      () => {
        if (cancelled) return
        setItems([])
        onLoaded?.(0)
      },
    )
    return () => {
      cancelled = true
    }
  }, [year, onLoaded])

  if (!items || items.length === 0) return null

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
      {items.map((item) => {
        const state = STATE[item.state]
        const reportOnly = item.type === 'D390' || item.type === 'D207' || item.type === 'D205'
        return (
          <Paper
            key={item.declarationId}
            elevation={0}
            sx={{ p: 2.5, borderRadius: `${T.radius.lg}px`, border: `1px solid ${T.border}`, boxShadow: T.shadow.sm, bgcolor: T.paper }}
          >
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: T.ink, fontWeight: 800 }}>{TITLE[item.type] ?? item.type}</Typography>
                <Typography sx={{ color: T.textMuted, fontSize: '0.82rem' }}>{periodLabel(item.period)}</Typography>
              </Box>
              <StatusChip tone={state.tone} label={state.label} size="sm" />
            </Stack>
            <Stack spacing={0.8} sx={{ mt: 2 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                <Typography sx={{ color: T.textMuted, fontSize: '0.85rem' }}>Sumă de plată</Typography>
                <Typography sx={{ color: T.ink, fontWeight: 800, fontSize: '0.95rem', ...tabularNums }}>
                  {reportOnly ? formatLei(0) : formatLei(item.amount)}
                </Typography>
              </Stack>
              {item.dueDate && (
                <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                  <Typography sx={{ color: T.textMuted, fontSize: '0.85rem' }}>Termen</Typography>
                  <Typography sx={{ color: T.ink, fontWeight: 700, fontSize: '0.9rem', ...tabularNums }}>{dateLabel(item.dueDate)}</Typography>
                </Stack>
              )}
            </Stack>
            {(item.pdfDocumentId || item.receiptDocumentId) && (
              <Stack direction="row" spacing={2} sx={{ mt: 1.6 }}>
                {item.pdfDocumentId && <DocumentLink id={item.pdfDocumentId} name={`${item.type}-${item.period}.pdf`} label="Declarația" />}
                {item.receiptDocumentId && <DocumentLink id={item.receiptDocumentId} name={`Recipisa-${item.type}-${item.period}.pdf`} label="Recipisa" />}
              </Stack>
            )}
          </Paper>
        )
      })}
    </Box>
  )
}

function DocumentLink({ id, name, label }: { id: string; name: string; label: string }) {
  return (
    <Stack
      direction="row"
      spacing={0.6}
      component="button"
      onClick={() => openDocument(id, name)}
      sx={{ alignItems: 'center', border: 'none', background: 'none', p: 0, cursor: 'pointer', color: T.primaryStrong, fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit' }}
    >
      <DescriptionRoundedIcon sx={{ fontSize: 16 }} />
      {label}
    </Stack>
  )
}
