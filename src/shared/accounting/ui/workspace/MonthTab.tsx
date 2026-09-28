import { useState, type ReactNode } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Stack, Typography } from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'

import { ClientNotificationDialog } from '../../../../components/contabil/ClientNotificationDialog'
import { RecurringDocumentationPanel } from '../../../../components/dashboard/sections/RecurringDocumentationPanel'
import { accountingApi } from '../../api/accountingApi'
import type { DeclarationStatus, DeclarationSummary, PfaAccountingSummary, PlatformDocumentListItem } from '../../api/types'
import { EMPTY } from '../../format'
import { CASH_REGISTER_STATUS, PLATFORM_LABEL } from '../../statusLabels'
import { ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav, type ClientSection } from '../navigation'
import { useNotify } from '../notify'
import { useApi } from '../useApi'
import { documentGroups, uploadInputId } from './documentGroups'
import { MonthDeclarations } from './MonthDeclarations'
import { MonthDocuments } from './MonthDocuments'
import { Panel } from './parts'
import { HAIRLINE, INK, laggingDeclaration, TONES, type Tone } from './status'
import { useClientJob } from './useClientJob'

interface NextStep {
  tone: Tone
  text: string
  actions: ReactNode
}

const DARK = { bgcolor: INK, color: '#FFFFFF', '&:hover': { bgcolor: '#2d2d45' } }
const SIGNED_OR_LATER: DeclarationStatus[] = ['SIGNED', 'SUBMITTED', 'ACCEPTED']

/** „Luna aceasta”: pasul următor, luna pe pași, documentele, declarațiile, datele clientului. */
export function MonthTab({
  summary,
  period,
  onSummaryChanged,
  onOpenSection,
}: {
  summary: PfaAccountingSummary
  period: string
  onSummaryChanged: () => void
  onOpenSection: (section: ClientSection) => void
}) {
  const nav = useAccountingNav()
  const notify = useNotify()
  const documents = useApi(() => accountingApi.documents.list(summary.id, period), [summary.id, period])
  const declarations = useApi(() => accountingApi.declarations.list(summary.id, period), [summary.id, period])
  const settings = useApi(() => accountingApi.pfas.getSettings(summary.id), [summary.id])
  const [asking, setAsking] = useState(false)

  const reload = () => {
    documents.reload()
    declarations.reload()
    onSummaryChanged()
  }
  const jobs = useClientJob(reload)

  if (documents.error && !documents.data) return <ErrorBlock message={documents.error} onRetry={documents.reload} />
  if (declarations.error && !declarations.data) return <ErrorBlock message={declarations.error} onRetry={declarations.reload} />
  if (!documents.data || !declarations.data) return <LoadingBlock />

  const docs = documents.data
  const decls = declarations.data
  const step = nextStep(summary, docs, decls)
  const steps = monthSteps(summary, docs, decls)

  function nextStep(pfa: PfaAccountingSummary, items: PlatformDocumentListItem[], list: DeclarationSummary[]): NextStep | null {
    if (pfa.readOnly) return null
    const reasonOf = (status: DeclarationStatus) => list.find((item) => item.status === status)?.blockingReasons[0]
    const busy = jobs.busy !== null
    const button = (label: string, onClick: () => void) => (
      <Button variant="contained" disabled={busy} onClick={onClick} sx={DARK}>
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
            <Button variant="outlined" onClick={() => setAsking(true)} sx={{ bgcolor: '#FFFFFF' }}>
              Cere clientului
            </Button>
            <Button variant="contained" component="label" htmlFor={uploadInputId(pfa.id)} sx={DARK}>
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

  const vatCode = settings.data?.art317.vatCode
  const details: [string, ReactNode][] = [
    ['CUI', summary.cui || EMPTY],
    ['Cod TVA', vatCode ?? (summary.art317 ? 'necompletat' : 'Nu are')],
    ['Platforme', summary.platforms.map((platform) => PLATFORM_LABEL[platform]).join(', ') || EMPTY],
    ['Email', summary.client?.email ?? EMPTY],
    ['Telefon', summary.client?.phone ?? EMPTY],
    ['Numerar', summary.cash.status === 'NOT_REQUIRED_CURRENT_CONFIGURATION' ? 'Nu' : CASH_REGISTER_STATUS[summary.cash.status].label],
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 340px' }, gap: 2.5, alignItems: 'start' }}>
      <Stack spacing={2}>
        {step && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ alignItems: { sm: 'center' }, gap: 2, px: 2.5, py: 2, borderRadius: '12px', bgcolor: TONES[step.tone].bg, border: `1px solid ${TONES[step.tone].border}` }}
          >
            <Typography sx={{ flexGrow: 1, fontSize: 15, fontWeight: 600, color: TONES[step.tone].text }}>{step.text}</Typography>
            {step.actions && <Stack direction="row" sx={{ gap: 1 }}>{step.actions}</Stack>}
          </Stack>
        )}

        <Panel sx={{ px: 2.5, py: 2 }}>
          <Box component="ol" aria-label="Luna pe pași" sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
            {steps.map((item, index) => (
              <Box component="li" key={item.label} sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box sx={{ height: 6, borderRadius: 999, bgcolor: item.tone === 'gray' ? '#E5EEF2' : TONES[item.tone].dot }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: item.tone === 'gray' ? '#6B6B7B' : INK }}>
                  {index + 1}. {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Panel>

        <MonthDocuments summary={summary} period={period} documents={docs} onChanged={reload} />

        <Accordion disableGutters elevation={0} sx={{ border: `1px solid ${HAIRLINE}`, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 2.5 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: INK }}>Încărcate de client</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
            <RecurringDocumentationPanel
              year={Number(period.slice(0, 4))}
              month={Number(period.slice(5, 7))}
              contabilContext={{ userId: summary.client?.userId ?? '', pfaRegistrationId: summary.id }}
              onSnackbar={(message, severity) => notify(message, severity)}
            />
          </AccordionDetails>
        </Accordion>

        <MonthDeclarations declarations={decls} readOnly={summary.readOnly} onChanged={reload} />
      </Stack>

      <Stack spacing={2}>
        <Panel sx={{ px: 2.5, py: 2 }}>
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: INK, mb: 1.5 }}>
            Client
          </Typography>
          <Stack spacing={1.25}>
            {details.map(([label, value]) => (
              <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 2, fontSize: 14 }}>
                <Box component="span" sx={{ color: '#6B6B7B' }}>
                  {label}
                </Box>
                <Box component="span" sx={{ textAlign: 'right', overflowWrap: 'anywhere' }}>
                  {value}
                </Box>
              </Stack>
            ))}
          </Stack>
        </Panel>
        <Panel sx={{ px: 2.5, py: 2 }}>
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: INK, mb: 1 }}>
            Mesaje
          </Typography>
          <Button onClick={() => onOpenSection('mesaje')} sx={{ px: 0, color: '#2B8FB8', fontWeight: 600 }}>
            Deschide conversația
          </Button>
        </Panel>
      </Stack>

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
    </Box>
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
