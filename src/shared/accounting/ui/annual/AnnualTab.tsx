import { useState, type ReactNode } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
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

import { accountingApi } from '../../api/accountingApi'
import type {
  AnnualDeclaration,
  AnnualDeclarations,
  AnnualRecord,
  C801,
  C801Status,
  DeclarationSummary,
  NonResidentDecision,
  RentalContract,
} from '../../api/types'
import { formatDate, formatLei } from '../../format'
import { DECLARATION_STATUS, DECLARATION_TYPE_LABEL } from '../../statusLabels'
import { AccountingBadge, EmptyText, ErrorBlock, Fact, LoadingBlock, ReasonDialog } from '../components'
import { DeclarationCard } from '../declarations/DeclarationCard'
import { useAction } from '../notify'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { YearSelect } from '../registers/registerParts'
import { useApi } from '../useApi'

const C801_LABEL: Record<C801Status, string> = {
  NOT_STARTED: 'Nedepusă',
  FILED_BY_PROVIDER: 'Depusă de furnizor',
  FILED: 'Depusă',
  NUI_RECEIVED: 'NUI primit',
}

/** Anii închiși posibili: de la începutul colaborării până la anul dinaintea lunii curente. */
function yearsOf(startDate: string, currentPeriod: string): number[] {
  const first = Number(startDate.slice(0, 4))
  const last = Math.max(first, Number(currentPeriod.slice(0, 4)) - 1)
  return Array.from({ length: last - first + 1 }, (_, index) => last - index)
}

function Problems({ blockers, review }: { blockers: string[]; review: string[] }) {
  if (blockers.length === 0 && review.length === 0) return null
  return (
    <Stack spacing={1}>
      {blockers.map((text) => (
        <Alert key={text} severity="error">
          {text}
        </Alert>
      ))}
      {review.map((text) => (
        <Alert key={text} severity="warning">
          {text}
        </Alert>
      ))}
    </Stack>
  )
}

function Section({ title, row, children }: { title: string; row: AnnualDeclaration<unknown>; children: ReactNode }) {
  return (
    <Paper component="section" aria-label={title} sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h2">{title}</Typography>
          <AccountingBadge
            descriptor={
              row.record
                ? DECLARATION_STATUS[row.record.status]
                : row.blockers.length > 0
                  ? { label: 'Blocată', tone: 'error' }
                  : row.ready
                    ? { label: 'Gata de generat', tone: 'success' }
                    : { label: 'Nu se depune', tone: 'neutral' }
            }
          />
        </Stack>
        <Problems blockers={row.blockers} review={row.review} />
        {children}
      </Stack>
    </Paper>
  )
}

function D207Section({ row }: { row: AnnualDeclarations['d207'] }) {
  const model = row.model
  return (
    <Section title={DECLARATION_TYPE_LABEL.D207} row={row}>
      {model.beneficiaries.length === 0 ? (
        <EmptyText>Nicio plată către nerezidenți în an.</EmptyText>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Beneficiar</TableCell>
                <TableCell>Țară</TableCell>
                <TableCell align="right">Venit brut</TableCell>
                <TableCell align="right">Scutit</TableCell>
                <TableCell align="right">Impozit</TableCell>
                <TableCell align="right">În D100</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {model.beneficiaries.map((item) => (
                <TableRow key={`${item.taxId}-${item.incomeType}`}>
                  <TableCell>
                    {item.supplierName}
                    <Typography variant="caption" color="text.secondary" component="div">
                      {item.taxId}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.country}</TableCell>
                  <TableCell align="right">{formatLei(item.grossIncome)}</TableCell>
                  <TableCell align="right">{formatLei(item.exemptIncome)}</TableCell>
                  <TableCell align="right">{formatLei(item.taxWithheld)}</TableCell>
                  <TableCell align="right" sx={{ color: item.declaredInD100 === item.taxWithheld ? undefined : 'error.main' }}>
                    {formatLei(item.declaredInD100)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                  Total
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {formatLei(model.totalGross)}
                </TableCell>
                <TableCell />
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {formatLei(model.totalTax)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Section>
  )
}

function D205Section({ row, contracts, onChanged }: { row: NonNullable<AnnualDeclarations['d205']>; contracts: RentalContract[]; onChanged: () => void }) {
  const [paymentFor, setPaymentFor] = useState<RentalContract | null>(null)
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  return (
    <Section title={DECLARATION_TYPE_LABEL.D205} row={row}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Proprietar</TableCell>
              <TableCell>Contract</TableCell>
              <TableCell align="right">Chirie brută</TableCell>
              <TableCell align="right">Impozit reținut</TableCell>
              <TableCell align="right">Plăți</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.map((contract) => {
              const owner = row.model.beneficiaries.find((item) => item.contractNumber === contract.contractNumber)
              return (
                <TableRow key={contract.id}>
                  <TableCell>
                    {contract.ownerName}
                    <Typography variant="caption" color="text.secondary" component="div">
                      {contract.ownerCnpMasked}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {contract.contractNumber} / {formatDate(contract.contractDate)}
                  </TableCell>
                  <TableCell align="right">{formatLei(owner?.grossIncome ?? 0)}</TableCell>
                  <TableCell align="right">{formatLei(owner?.taxWithheld ?? 0)}</TableCell>
                  <TableCell align="right">{owner?.payments ?? 0}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setPaymentFor(contract)}>
                      Adaugă plată
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <ReasonDialog
        open={paymentFor !== null}
        title={`Plată chirie ${paymentFor?.ownerName ?? ''}`}
        showReason={false}
        requireReason={false}
        canSubmit={Boolean(date) && Number(amount) > 0}
        confirmLabel="Adaugă"
        onClose={() => setPaymentFor(null)}
        onSubmit={async () => {
          if (!paymentFor) return
          await accountingApi.annual.addRentPayment(paymentFor.id, { paymentDate: date, grossAmount: Number(amount) })
          setDate('')
          setAmount('')
          onChanged()
        }}
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField type="date" label="Data plății" value={date} onChange={(event) => setDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="number" label="Suma brută (lei)" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </Stack>
      </ReasonDialog>
    </Section>
  )
}

function D212Section({ pfaId, year, row, onChanged }: { pfaId: string; year: number; row: AnnualDeclarations['d212']; onChanged: () => void }) {
  const { busy, run } = useAction()
  const view = row.model
  const [external, setExternal] = useState<'' | 'yes' | 'no'>(view.hasExternalIncome === null ? '' : view.hasExternalIncome ? 'yes' : 'no')
  const [supplement, setSupplement] = useState(view.supplementCompleted)
  const [prefilled, setPrefilled] = useState(view.anafPrefilledNetIncome === null ? '' : String(view.anafPrefilledNetIncome))
  const save = () =>
    run(
      'answers',
      async () => {
        await accountingApi.annual.saveAnswers(pfaId, year, {
          hasExternalIncome: external === '' ? null : external === 'yes',
          supplementCompleted: external === 'yes' && supplement,
          anafPrefilledNetIncome: prefilled === '' ? null : Number(prefilled),
        })
        onChanged()
      },
      'Răspunsurile au fost salvate.',
    )

  return (
    <Section title={DECLARATION_TYPE_LABEL.D212} row={row}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, alignItems: { md: 'center' }, flexWrap: 'wrap' }}>
        <TextField select size="small" label="Alte venituri în afara RIDElance" value={external} onChange={(event) => setExternal(event.target.value as typeof external)} sx={{ minWidth: 260 }}>
          <MenuItem value="">Fără răspuns</MenuItem>
          <MenuItem value="yes">Da</MenuItem>
          <MenuItem value="no">Nu</MenuItem>
        </TextField>
        {external === 'yes' && (
          <FormControlLabel control={<Checkbox checked={supplement} onChange={(event) => setSupplement(event.target.checked)} />} label="Formular suplimentar completat" />
        )}
        <TextField
          size="small"
          type="number"
          label="Venit net din precompletarea ANAF"
          value={prefilled}
          onChange={(event) => setPrefilled(event.target.value)}
          sx={{ minWidth: 260 }}
        />
        <Button variant="outlined" disabled={busy !== null} onClick={save}>
          Salvează
        </Button>
      </Stack>
      {view.model && (
        <>
          <Stack direction="row" sx={{ gap: 4, flexWrap: 'wrap' }}>
            <Fact label="Venit net">{formatLei(view.model.netIncome)}</Fact>
            <Fact label="CAS">{formatLei(view.model.casDue)}</Fact>
            <Fact label="CASS">{formatLei(view.model.cassDue)}</Fact>
            <Fact label="Impozit">{formatLei(view.model.incomeTaxDue)}</Fact>
            <Fact label="Precompletare ANAF">{view.prefill === 'MATCH' ? 'Egal' : view.prefill === 'NEEDS_REVIEW' ? 'Diferit' : '—'}</Fact>
          </Stack>
          <TableContainer>
            <Table size="small" aria-label={view.formVersion ?? 'D212'}>
              <TableHead>
                <TableRow>
                  <TableCell>{view.formVersion}</TableCell>
                  <TableCell align="right">Valoare</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {view.form.map((field) => (
                  <TableRow key={`${field.section}-${field.label}`}>
                    <TableCell>{field.label}</TableCell>
                    <TableCell align="right">{formatLei(field.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Section>
  )
}

function NonResidentQueue({ pfaId, onChanged }: { pfaId: string; onChanged: () => void }) {
  const queue = useApi(() => accountingApi.annual.listNonResidentDecisions(pfaId, 'NEEDS_LEGAL_CONFIRMATION'), [pfaId])
  const [confirming, setConfirming] = useState<NonResidentDecision | null>(null)
  const items = queue.data ?? []
  if (items.length === 0) return null
  return (
    <Paper component="section" aria-label="Reguli de nerezident de confirmat" sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Typography variant="h2">Reguli de nerezident de confirmat</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data plății</TableCell>
                <TableCell>Beneficiar</TableCell>
                <TableCell align="right">Venit brut</TableCell>
                <TableCell align="right">Cotă</TableCell>
                <TableCell align="right">Impozit</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.paymentDate)}</TableCell>
                  <TableCell>
                    {item.supplierLegalName}
                    <Typography variant="caption" color="text.secondary" component="div">
                      {item.explanation}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatLei(item.grossIncomeRon)}</TableCell>
                  <TableCell align="right">{item.taxRate}%</TableCell>
                  <TableCell align="right">{formatLei(item.taxDue)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setConfirming(item)}>
                      Confirmă
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
      <ReasonDialog
        open={confirming !== null}
        title={`Confirmă regula pentru ${confirming?.supplierLegalName ?? ''}`}
        reasonLabel="Temeiul confirmării"
        confirmLabel="Confirmă"
        onClose={() => setConfirming(null)}
        onSubmit={async (reason) => {
          if (!confirming) return
          await accountingApi.annual.confirmNonResidentDecision(confirming.id, reason)
          queue.reload()
          onChanged()
        }}
      />
    </Paper>
  )
}

function C801Card({ pfaId }: { pfaId: string }) {
  const { busy, run } = useAction()
  const c801 = useApi(() => accountingApi.annual.getC801(pfaId).catch(() => null), [pfaId])
  if (!c801.data) return null
  return <C801Form key={`${c801.data.status}-${c801.data.nuiNumber}`} pfaId={pfaId} data={c801.data} busy={busy !== null} run={run} onSaved={c801.reload} />
}

function C801Form({ pfaId, data, busy, run, onSaved }: { pfaId: string; data: C801; busy: boolean; run: ReturnType<typeof useAction>['run']; onSaved: () => void }) {
  const [status, setStatus] = useState<C801Status>(data.status)
  const [plate, setPlate] = useState(data.vehiclePlate ?? '')
  const [nui, setNui] = useState(data.nuiNumber ?? '')
  const [file, setFile] = useState<File | null>(null)
  const save = () =>
    run(
      'c801',
      async () => {
        const documentId = file ? (await accountingApi.pfas.uploadCashEvidence(pfaId, file)).documentId : data.documentId
        await accountingApi.annual.updateC801(pfaId, { status, documentId, nuiNumber: nui || null, vehiclePlate: plate || null })
        onSaved()
      },
      'C801 a fost salvată.',
    )
  return (
    <Paper component="section" aria-label="C801" sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Typography variant="h2">C801 – casa de marcat</Typography>
          <AccountingBadge descriptor={{ label: C801_LABEL[data.status], tone: data.status === 'NUI_RECEIVED' ? 'success' : data.status === 'NOT_STARTED' ? 'neutral' : 'warning' }} />
        </Stack>
        <Stack direction="row" sx={{ gap: 4, flexWrap: 'wrap' }}>
          <Fact label="CUI">{data.cui ?? '—'}</Fact>
          <Fact label="Tip activitate">{data.activityType ?? '—'}</Fact>
        </Stack>
        {data.missing.length > 0 && <Alert severity="warning">{data.missing.join(', ')}</Alert>}
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, alignItems: { md: 'center' }, flexWrap: 'wrap' }}>
          <TextField select size="small" label="Stare" value={status} onChange={(event) => setStatus(event.target.value as C801Status)} sx={{ minWidth: 200 }}>
            {(Object.keys(C801_LABEL) as C801Status[]).map((value) => (
              <MenuItem key={value} value={value}>
                {C801_LABEL[value]}
              </MenuItem>
            ))}
          </TextField>
          <TextField size="small" label="Nr. înmatriculare" value={plate} onChange={(event) => setPlate(event.target.value)} />
          <TextField size="small" label="NUI" value={nui} onChange={(event) => setNui(event.target.value)} />
          <Button variant="outlined" component="label">
            {file ? file.name : data.documentId ? 'Document încărcat' : 'Document'}
            <input hidden type="file" accept="application/pdf,image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </Button>
          <Button variant="contained" disabled={busy} onClick={save}>
            Salvează
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function RentalContractDialog({ pfaId, open, onClose, onCreated }: { pfaId: string; open: boolean; onClose: () => void; onCreated: () => void }) {
  const rules = useApi(() => (open ? accountingApi.annual.rentRules() : Promise.resolve([])), [open])
  const [form, setForm] = useState({ ownerName: '', ownerCnp: '', contractNumber: '', contractDate: '', grossRent: '', paymentFrequency: 'MONTHLY' })
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm((value) => ({ ...value, [key]: event.target.value }))
  const ruleId = rules.data?.[0]?.id ?? ''
  const complete = form.ownerName && /^\d{13}$/.test(form.ownerCnp) && form.contractNumber && form.contractDate && Number(form.grossRent) > 0 && ruleId
  return (
    <ReasonDialog
      open={open}
      title="Contract de chirie"
      showReason={false}
      requireReason={false}
      canSubmit={Boolean(complete)}
      confirmLabel="Adaugă"
      onClose={onClose}
      onSubmit={async () => {
        await accountingApi.annual.createRentalContract(pfaId, { ...form, grossRent: Number(form.grossRent), withholdingRuleId: ruleId })
        onCreated()
      }}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TextField label="Proprietar" value={form.ownerName} onChange={set('ownerName')} />
        <TextField label="CNP proprietar" value={form.ownerCnp} onChange={set('ownerCnp')} />
        <TextField label="Nr. contract" value={form.contractNumber} onChange={set('contractNumber')} />
        <TextField type="date" label="Data contractului" value={form.contractDate} onChange={set('contractDate')} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField type="number" label="Chirie brută (lei)" value={form.grossRent} onChange={set('grossRent')} />
        <TextField select label="Plată" value={form.paymentFrequency} onChange={set('paymentFrequency')}>
          <MenuItem value="MONTHLY">Lunar</MenuItem>
          <MenuItem value="QUARTERLY">Trimestrial</MenuItem>
          <MenuItem value="YEARLY">Anual</MenuItem>
        </TextField>
      </Stack>
    </ReasonDialog>
  )
}

/** Declarațiile anuale ale PFA-ului (spec declarații §7 „Admin — anual”). */
export function AnnualTab({ summary }: DossierTabProps) {
  const years = yearsOf(summary.engagement.startDate, summary.currentPeriod)
  const [year, setYear] = useState(years[0])
  const [version, setVersion] = useState(0)
  const [contractOpen, setContractOpen] = useState(false)
  const changed = () => setVersion((value) => value + 1)
  const { busy, run } = useAction()
  const annual = useApi(() => accountingApi.annual.get(summary.id, year), [summary.id, year, version])
  const contracts = useApi(() => accountingApi.annual.listRentalContracts(summary.id), [summary.id, version])
  const readOnly = summary.engagement.status === 'INACTIVE'
  const data = annual.data
  const rows: AnnualDeclaration<unknown>[] = data ? [data.d207, ...(data.d205 ? [data.d205] : []), data.d212] : []
  const canGenerate = rows.some((row) => row.ready && !row.record)

  const summaryOf = (type: AnnualDeclaration<unknown>['type'], record: AnnualRecord): DeclarationSummary => ({
    declarationId: record.declarationId,
    pfaId: summary.id,
    period: String(year),
    type,
    status: record.status,
    amount: record.amount,
    currentVersionId: record.versionId,
    currentVersionNo: record.versionNo,
    currentVersionKind: record.versionNo > 1 ? 'RECTIFICATIVE' : 'INITIAL',
    blockingReasons: [],
  })

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <YearSelect years={years} year={year} onChange={setYear} />
        {!readOnly && (
          <>
            <Button
              variant="contained"
              disabled={!canGenerate || busy !== null}
              onClick={() => run('generate', async () => {
                await accountingApi.annual.generate(summary.id, year)
                changed()
              }, 'Declarațiile au fost generate.')}
            >
              Generează declarațiile
            </Button>
            <Button variant="text" onClick={() => setContractOpen(true)}>
              Contract de chirie
            </Button>
          </>
        )}
      </Stack>

      {annual.loading && !data && <LoadingBlock />}
      {annual.error && <ErrorBlock message={annual.error} onRetry={annual.reload} />}
      {data && (
        <>
          {data.pendingLegalConfirmations > 0 && <NonResidentQueue key={version} pfaId={summary.id} onChanged={changed} />}
          <D207Section row={data.d207} />
          {data.d205 && <D205Section row={data.d205} contracts={contracts.data ?? []} onChanged={changed} />}
          <D212Section key={`${year}-${version}`} pfaId={summary.id} year={year} row={data.d212} onChanged={changed} />
          {rows.map((row) =>
            row.record ? (
              <DeclarationCard key={row.record.versionId + row.record.status} summary={summaryOf(row.type, row.record)} readOnly={readOnly} onChanged={changed} />
            ) : null,
          )}
        </>
      )}
      <C801Card pfaId={summary.id} />
      <RentalContractDialog pfaId={summary.id} open={contractOpen} onClose={() => setContractOpen(false)} onCreated={() => { setContractOpen(false); changed() }} />
    </Stack>
  )
}
