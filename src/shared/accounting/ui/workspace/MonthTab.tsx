import { useState, type ReactNode } from 'react'
import { Alert, Box, Button, Stack, Tooltip, Typography } from '@mui/material'

import { ClientNotificationDialog } from '../../../../components/contabil/ClientNotificationDialog'
import { SideSheet } from '../../../../components/panel/ui'
import { RecurringDocumentationPanel } from '../../../../components/dashboard/sections/RecurringDocumentationPanel'
import { accountingApi } from '../../api/accountingApi'
import type { DeclarationStatus, DeclarationSummary, PfaAccountingSummary, PlatformDocumentListItem } from '../../api/types'
import { ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav } from '../navigation'
import { useNotify } from '../notify'
import { useApi } from '../useApi'
import { documentGroups, uploadInputId } from './documentGroups'
import { MonthDeclarations } from './MonthDeclarations'
import { MonthDocuments } from './MonthDocuments'
import { Panel } from './parts'
import { ReconciliationPanel } from './ReconciliationPanel'
import { currentCalendarPeriod, laggingDeclaration, TONES, type Tone } from './status'
import { useClientJob } from './useClientJob'

interface NextStep {
  tone: Tone
  text: string
  actions: ReactNode
}

const DARK = { bgcolor: 'var(--rl-primary)', color: 'var(--rl-primary-fg)', '&:hover': { bgcolor: 'var(--rl-fg-soft)' } }
const SIGNED_OR_LATER: DeclarationStatus[] = ['SIGNED', 'SUBMITTED', 'ACCEPTED']

/** „Luna”: pasul următor și etapele pe un rând, apoi documentele, declarațiile și închiderea lunii alăturate. */
export function MonthTab({
  summary,
  period,
  onSummaryChanged,
}: {
  summary: PfaAccountingSummary
  period: string
  onSummaryChanged: () => void
}) {
  const nav = useAccountingNav()
  const notify = useNotify()
  const documents = useApi(() => accountingApi.documents.list(summary.id, period), [summary.id, period])
  const declarations = useApi(() => accountingApi.declarations.list(summary.id, period), [summary.id, period])
  const [asking, setAsking] = useState(false)
  const [clientFiles, setClientFiles] = useState(false)

  const reload = () => {
    documents.reload()
    declarations.reload()
    onSummaryChanged()
  }
  const jobs = useClientJob(reload)
  const inProgress = period >= currentCalendarPeriod()

  if (documents.error && !documents.data) return <ErrorBlock message={documents.error} onRetry={documents.reload} />
  if (declarations.error && !declarations.data) return <ErrorBlock message={declarations.error} onRetry={declarations.reload} />
  if (!documents.data || !declarations.data) return <LoadingBlock />

  const docs = documents.data
  const decls = declarations.data
  const step = inProgress ? null : nextStep(summary, docs, decls)
  const steps = monthSteps(summary, docs, decls)

  function nextStep(pfa: PfaAccountingSummary, items: PlatformDocumentListItem[], list: DeclarationSummary[]): NextStep | null {
    if (pfa.readOnly) return null
    const reasonOf = (status: DeclarationStatus) => list.find((item) => item.status === status)?.blockingReasons[0]
    const busy = jobs.busy !== null
    const button = (label: string, onClick: () => void) => (
      <Button size="small" variant="contained" disabled={busy} onClick={onClick} sx={DARK}>
        {busy ? 'Se lucrează…' : label}
      </Button>
    )

    const missingGroup = documentGroups(pfa, items).find((group) => group.key !== 'other' && group.documents.length === 0)
    const missing = reasonOf('BLOCKED_MISSING_DOCUMENTS') ?? (missingGroup ? `Lipsește ${missingGroup.label.toLowerCase()}` : null)
    if (missing) {
      return {
        tone: 'red',
        text: missing,
        actions: (
          <>
            <Button size="small" variant="outlined" onClick={() => setAsking(true)}>
              Cere clientului
            </Button>
            <Button size="small" variant="contained" component="label" htmlFor={uploadInputId(pfa.id)} sx={DARK}>
              Încarcă PDF
            </Button>
          </>
        ),
      }
    }
    const broken = items.find((item) => item.status === 'NEEDS_REVIEW' || item.status === 'EXTRACTION_FAILED')
    if (broken) {
      return {
        tone: 'yellow',
        text: reasonOf('BLOCKED_NEEDS_REVIEW') ?? `${broken.fileName}: de verificat`,
        actions: button('Verifică', () => nav.setParam('document', broken.id)),
      }
    }
    const pending = items.filter((item) => item.status === 'PENDING_CONFIRMATION')
    if (pending.length > 0) {
      return {
        tone: 'blue',
        text: pending.length === 1 ? 'Un document de confirmat' : `${pending.length} documente de confirmat`,
        actions: button('Confirmă', () => {
          void accountingApi.documents.confirmBulk({ ids: pending.map((item) => item.id) }).then((result) => {
            notify(result.confirmed.length === 1 ? 'Un document confirmat.' : `${result.confirmed.length} documente confirmate.`, 'success')
            reload()
          })
        }),
      }
    }
    if (items.some((item) => item.status === 'UPLOADED' || item.status === 'EXTRACTING')) {
      return { tone: 'gray', text: 'Documentele se citesc', actions: null }
    }
    if (list.some((item) => item.status === null)) {
      return {
        tone: 'gray',
        text: 'Luna nu e procesată',
        actions: button('Procesează', () => void jobs.run('process', () => accountingApi.months.process(period, pfa.id))),
      }
    }
    const byType = Object.fromEntries(
      list.map((item) => [item.type, { declarationId: item.declarationId, versionId: item.currentVersionId, status: item.status, amount: item.amount }]),
    )
    const lagging = laggingDeclaration(byType)
    if (!lagging) {
      return list.some((item) => item.status === 'DRAFT')
        ? { tone: 'blue', text: 'Declarațiile sunt gata de generat', actions: button('Generează', () => void jobs.run('generate', () => accountingApi.months.generate(period, pfa.id))) }
        : null
    }
    const { type, cell } = lagging
    const openDeclaration = () => nav.setParam('declaratie', type)
    switch (cell.status) {
      case 'GENERATED':
        return { tone: 'blue', text: `${type} generată, trebuie validată`, actions: button('Validează', () => void jobs.run('validate', () => accountingApi.months.validate(period, pfa.id))) }
      case 'VALIDATION_FAILED':
        return { tone: 'red', text: `${type}: validarea a picat`, actions: button('Vezi erorile', openDeclaration) }
      case 'VALIDATED':
      case 'READY_TO_SIGN':
        return { tone: 'blue', text: `${type} gata de semnat`, actions: button('Semnează', openDeclaration) }
      case 'SIGNED':
        return { tone: 'blue', text: `${type} semnată, de depus`, actions: button('Marchează depus', openDeclaration) }
      case 'SUBMITTED':
        return { tone: 'yellow', text: `${type} depusă, lipsește recipisa`, actions: button('Încarcă recipisa', openDeclaration) }
      case 'REJECTED':
        return { tone: 'red', text: `${type} respinsă`, actions: button('Deschide', openDeclaration) }
      default:
        return { tone: 'green', text: 'Luna e încheiată', actions: null }
    }
  }

  const done: Tone = 'green'
  const header = inProgress ? { tone: 'blue' as Tone, text: 'Lună în curs · documente și cheltuieli', actions: null } : step ?? (summary.readOnly ? { tone: 'gray' as Tone, text: 'Dosar inactiv', actions: null } : { tone: done, text: 'Luna e încheiată', actions: null })

  return (
    <Stack spacing={1.5}>
      {inProgress && <Alert severity="info">Poți încărca, verifica și corecta documentele acestei luni. Procesarea declarațiilor și închiderea lunii devin disponibile după încheierea lunii calendaristice.</Alert>}
      <Panel sx={{ px: 2, py: 1.25 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ alignItems: { md: 'center' }, gap: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: TONES[header.tone].dot }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'var(--rl-fg)' }}>{header.text}</Typography>
            {header.actions && <Stack direction="row" sx={{ gap: 1, ml: 1 }}>{header.actions}</Stack>}
          </Stack>
          <Stack component="ol" aria-label="Etapele lunii" direction="row" sx={{ m: 0, p: 0, listStyle: 'none', gap: 0.5 }}>
            {steps.map((item) => (
              <Tooltip key={item.label} title={item.label}>
                <Box component="li" aria-label={item.label} sx={{ width: { xs: 56, md: 44 }, height: 6, borderRadius: 999, bgcolor: item.tone === 'gray' ? 'var(--rl-muted)' : TONES[item.tone].dot }} />
              </Tooltip>
            ))}
          </Stack>
        </Stack>
      </Panel>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, alignItems: 'start' }}>
        <MonthDocuments summary={summary} period={period} documents={docs} onChanged={reload} onClientFiles={() => setClientFiles(true)} />
        {!inProgress && <MonthDeclarations declarations={decls} readOnly={summary.readOnly} onChanged={reload} />}
        {!inProgress && <ReconciliationPanel summary={summary} period={period} onChanged={reload} />}
      </Box>

      <SideSheet open={clientFiles} title="Încărcate de client" onClose={() => setClientFiles(false)} width={640}>
        <RecurringDocumentationPanel
          year={Number(period.slice(0, 4))}
          month={Number(period.slice(5, 7))}
          contabilContext={{ userId: summary.client?.userId ?? '', pfaRegistrationId: summary.id }}
          onSnackbar={(message, severity) => notify(message, severity)}
        />
      </SideSheet>

      {asking && (
        <ClientNotificationDialog
          open
          pfaId={summary.id}
          clientName={summary.name}
          onClose={() => setAsking(false)}
          onSent={() => {
            setAsking(false)
            notify('Cererea a fost trimisă clientului.', 'success')
          }}
        />
      )}
    </Stack>
  )
}

/** Cei patru pași ai lunii, colorați după unde a ajuns fiecare. */
function monthSteps(summary: PfaAccountingSummary, docs: PlatformDocumentListItem[], list: DeclarationSummary[]): { label: string; tone: Tone }[] {
  const groups = documentGroups(summary, docs)
  const missing = groups.some((group) => group.key !== 'other' && group.documents.length === 0)
  const review = docs.some((doc) => doc.status === 'NEEDS_REVIEW' || doc.status === 'EXTRACTION_FAILED' || doc.status === 'PENDING_CONFIRMATION')
  const documentsTone: Tone = missing ? 'red' : review ? 'yellow' : docs.length > 0 ? 'green' : 'gray'

  const applicable = list.filter((item) => item.status !== null && item.status !== 'NOT_APPLICABLE' && !item.status.startsWith('BLOCKED'))
  const generated = applicable.length > 0 && applicable.every((item) => item.declarationId !== null)
  const signedAll = generated && applicable.every((item) => SIGNED_OR_LATER.includes(item.status!))
  const failed = applicable.some((item) => item.status === 'VALIDATION_FAILED' || item.status === 'REJECTED')
  const signedSome = applicable.some((item) => item.status === 'VALIDATED' || item.status === 'READY_TO_SIGN' || SIGNED_OR_LATER.includes(item.status!))
  const acceptedAll = generated && applicable.every((item) => item.status === 'ACCEPTED')
  const submittedSome = applicable.some((item) => item.status === 'SUBMITTED' || item.status === 'ACCEPTED')

  return [
    { label: 'Documente', tone: documentsTone },
    { label: 'Declarații generate', tone: generated ? 'green' : 'gray' },
    { label: 'Validate și semnate', tone: failed ? 'red' : signedAll ? 'green' : signedSome ? 'blue' : 'gray' },
    { label: 'Depuse cu recipisă', tone: acceptedAll ? 'green' : submittedSome ? 'yellow' : 'gray' },
  ]
}
