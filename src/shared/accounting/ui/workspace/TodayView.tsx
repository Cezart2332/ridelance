import { useState, type ReactNode } from 'react'
import { Box, Button, Stack } from '@mui/material'

import { Initials, PageHeading, StatCard, StatGrid } from '../../../../components/panel/ui'
import { ClientNotificationDialog } from '../../../../components/contabil/ClientNotificationDialog'
import { accountingApi } from '../../api/accountingApi'
import type { ClientWorkspaceRow } from '../../api/types'
import { EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav, type ClientSection } from '../navigation'
import { useNotify } from '../notify'
import { useApi } from '../useApi'
import { MonthSelect, Panel, SectionTitle } from './parts'
import { currentFiscalPeriod, HAIRLINE, INK, isFinished, laggingDeclaration, type Tone } from './status'
import { useClientJob } from './useClientJob'

interface Task {
  row: ClientWorkspaceRow
  text: string
  actions: ReactNode
}

const PRIMARY_BUTTON = { bgcolor: 'var(--rl-primary)', color: 'var(--rl-primary-fg)', '&:hover': { bgcolor: 'var(--rl-fg-soft)' } }

/** „Rezumat”: ce e de făcut în lună, grupat pe tip, fiecare cu butonul lui. */
export function TodayView() {
  const nav = useAccountingNav()
  const notify = useNotify()
  const current = currentFiscalPeriod()
  const period = nav.period ?? current
  const clients = useApi(() => accountingApi.clients.list(period), [period])
  const jobs = useClientJob(clients.reload)
  const [asking, setAsking] = useState<ClientWorkspaceRow | null>(null)

  if (clients.error && !clients.data) return <ErrorBlock message={clients.error} onRetry={clients.reload} />
  if (!clients.data) return <LoadingBlock />

  const rows = clients.data.filter((row) => row.stage === 'ACTIVE')
  const open = (row: ClientWorkspaceRow, section: ClientSection = 'luna', extra: Record<string, string> = {}) =>
    nav.openPfa(row.pfaId, section, { luna: period, ...extra })
  const primary = (label: string, onClick: () => void, key?: string) => (
    <Button size="small" variant="contained" disabled={jobs.busy !== null} onClick={onClick} sx={PRIMARY_BUTTON}>
      {key && jobs.busy === key ? 'Se lucrează…' : label}
    </Button>
  )

  const missing: Task[] = rows
    .filter((row) => row.monthStatus === 'MISSING_DOCUMENTS')
    .map((row) => ({
      row,
      text: row.reason ?? 'Lipsesc documente.',
      actions: (
        <>
          <Button size="small" variant="outlined" onClick={() => setAsking(row)}>
            Cere clientului
          </Button>
          {primary('Încarcă', () => open(row))}
        </>
      ),
    }))
  const review: Task[] = rows
    .filter((row) => row.monthStatus === 'NEEDS_REVIEW')
    .map((row) => ({ row, text: row.reason ?? 'De verificat.', actions: primary('Verifică', () => open(row)) }))
  const unprocessed: Task[] = rows
    .filter((row) => row.monthStatus === 'NOT_PROCESSED')
    .map((row) => ({
      row,
      text: 'Luna nu e procesată',
      actions: primary('Procesează', () => void jobs.run(`process-${row.pfaId}`, () => accountingApi.months.process(period, row.pfaId)), `process-${row.pfaId}`),
    }))

  const declarations: Task[] = rows.flatMap((row): Task[] => {
    if (row.monthStatus !== 'READY') return []
    const lagging = laggingDeclaration(row.declarations)
    if (!lagging) {
      const draft = Object.values(row.declarations).some((cell) => cell?.status === 'DRAFT')
      return draft
        ? [
            {
              row,
              text: 'Declarațiile sunt gata de generat',
              actions: primary('Generează', () => void jobs.run(`generate-${row.pfaId}`, () => accountingApi.months.generate(period, row.pfaId)), `generate-${row.pfaId}`),
            },
          ]
        : []
    }
    const { type, cell } = lagging
    switch (cell.status) {
      case 'GENERATED':
        return [
          {
            row,
            text: `${type} generată, trebuie validată`,
            actions: primary('Validează', () => void jobs.run(`validate-${row.pfaId}`, () => accountingApi.months.validate(period, row.pfaId)), `validate-${row.pfaId}`),
          },
        ]
      case 'VALIDATION_FAILED':
        return [{ row, text: `${type}: validarea a picat`, actions: primary('Vezi erorile', () => open(row, 'luna', { declaratie: type })) }]
      case 'VALIDATED':
      case 'READY_TO_SIGN':
        return [{ row, text: `${type} gata de semnat`, actions: primary('Semnează', () => open(row, 'luna', { declaratie: type })) }]
      case 'SIGNED':
        return [{ row, text: `${type} semnată, de depus`, actions: primary('Marchează depus', () => open(row, 'luna', { declaratie: type })) }]
      case 'SUBMITTED':
        return [{ row, text: `${type} depusă, lipsește recipisa`, actions: primary('Încarcă recipisa', () => open(row, 'luna', { declaratie: type })) }]
      case 'REJECTED':
        return [{ row, text: `${type} respinsă`, actions: primary('Deschide', () => open(row, 'luna', { declaratie: type })) }]
      default:
        return []
    }
  })

  const messages: Task[] = clients.data
    .filter((row) => row.unreadMessages > 0)
    .map((row) => ({
      row,
      text: row.unreadMessages === 1 ? 'Un mesaj nou' : `${row.unreadMessages} mesaje noi`,
      actions: primary('Răspunde', () => open(row, 'mesaje')),
    }))

  const readyToFile = rows.filter((row) => {
    const status = laggingDeclaration(row.declarations)?.cell.status
    return status === 'VALIDATED' || status === 'READY_TO_SIGN' || status === 'SIGNED'
  }).length
  const stats: { label: string; value: number; tone: Tone }[] = [
    { label: 'Blocați', value: missing.length, tone: 'red' },
    { label: 'De verificat', value: review.length, tone: 'yellow' },
    { label: 'Gata de depus', value: readyToFile, tone: 'blue' },
    { label: 'Terminați', value: rows.filter(isFinished).length, tone: 'green' },
  ]
  const processAll =
    unprocessed.length > 1 ? (
      <Button size="small" variant="outlined" disabled={jobs.busy !== null} onClick={() => void jobs.run('process-all', () => accountingApi.months.process(period))}>
        {jobs.busy === 'process-all' ? 'Se lucrează…' : 'Procesează toți'}
      </Button>
    ) : null
  const groups: { key: string; title: string; tone: Tone; tasks: Task[]; action?: ReactNode }[] = [
    { key: 'missing', title: 'Lipsesc documente', tone: 'red', tasks: missing },
    { key: 'review', title: 'De verificat', tone: 'yellow', tasks: review },
    { key: 'unprocessed', title: 'Neprocesați', tone: 'gray', tasks: unprocessed, action: processAll },
    { key: 'declarations', title: 'Declarații de dus mai departe', tone: 'blue', tasks: declarations },
    { key: 'messages', title: 'Mesaje', tone: 'blue', tasks: messages },
  ]
  const total = groups.reduce((sum, group) => sum + group.tasks.length, 0)

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <Box>
        <PageHeading title="Rezumat" actions={<MonthSelect value={period} current={current} onChange={(value) => nav.setParam('luna', value)} />} />
        <StatGrid>
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} toneName={stat.value > 0 ? stat.tone : undefined} />
          ))}
        </StatGrid>
      </Box>

      {total === 0 && (
        <Panel sx={{ px: 2.5, py: 1 }}>
          <EmptyText>Nimic de făcut pentru luna aceasta.</EmptyText>
        </Panel>
      )}

      {groups
        .filter((group) => group.tasks.length > 0)
        .map((group) => (
          <Stack key={group.key} component="section" aria-label={group.title} spacing={1.25}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <SectionTitle tone={group.tone} title={group.title} count={group.tasks.length} />
              {group.action}
            </Stack>
            <Panel>
              {group.tasks.map((task, index) => (
                <Stack
                  key={`${task.row.pfaId}-${index}`}
                  direction={{ xs: 'column', sm: 'row' }}
                  sx={{ alignItems: { sm: 'center' }, gap: 1.5, px: 2, py: 1.25, minHeight: 56, borderTop: index === 0 ? 'none' : `1px solid ${HAIRLINE}`, '&:hover': { bgcolor: 'var(--rl-hover)' } }}
                >
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, flexGrow: 1, minWidth: 0 }}>
                    <Initials name={task.row.name} />
                    <Box sx={{ minWidth: 0, fontSize: 13, display: 'flex', flexWrap: 'wrap', columnGap: 1.25, alignItems: 'baseline' }}>
                      <Box
                        component="a"
                        href="#"
                        onClick={(event) => {
                          event.preventDefault()
                          open(task.row)
                        }}
                        sx={{ fontWeight: 600, color: INK, textDecoration: 'none', '&:hover': { color: 'var(--rl-blue-text)' } }}
                      >
                        {task.row.name}
                      </Box>
                      <Box component="span" sx={{ color: 'var(--rl-fg-soft)' }}>
                        {task.text}
                      </Box>
                    </Box>
                  </Stack>
                  <Stack direction="row" sx={{ gap: 1, flexShrink: 0 }}>
                    {task.actions}
                  </Stack>
                </Stack>
              ))}
            </Panel>
          </Stack>
        ))}

      {asking && (
        <ClientNotificationDialog
          open
          pfaId={asking.pfaId}
          clientName={asking.name}
          onClose={() => setAsking(null)}
          onSent={() => {
            setAsking(null)
            notify('Cererea a fost trimisă clientului.', 'success')
          }}
        />
      )}
    </Stack>
  )
}
