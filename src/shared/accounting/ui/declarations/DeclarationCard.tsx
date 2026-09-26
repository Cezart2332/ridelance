import { useState } from 'react'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import {
  Alert,
  Box,
  Button,
  Collapse,
  Divider,
  Link,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { DeclarationAction, DeclarationStatus, DeclarationSummary, DeclarationVersion } from '../../api/types'
import { availableOperations, DECLARATION_STEPPER, type DeclarationOperation } from '../../declarationWorkflow'
import { formatDateTime, formatLei, formatPeriod } from '../../format'
import { DECLARATION_STATUS, DECLARATION_TYPE_LABEL, VALIDATION_LEVEL_LABEL } from '../../statusLabels'
import { AccountingBadge, ConfirmDialog, ReasonDialog } from '../components'
import { useAccountingNav } from '../navigation'
import { useAction } from '../notify'
import { openBlob, useApi } from '../useApi'
import { BreakdownDialog } from './BreakdownDialog'
import { XmlDialog } from './XmlDialog'

const OPERATION_LABEL: Record<DeclarationOperation, string> = {
  VALIDATE: 'Validează',
  MARK_SIGNED: 'Marchează semnat',
  MARK_SUBMITTED: 'Marchează depus',
  MARK_REJECTED: 'Marchează respins',
  REGENERATE: 'Regenerează',
  UPLOAD_RECEIPT: 'Încarcă recipisa',
  CREATE_RECTIFICATION: 'Creează rectificativă',
}

/** Pasul din stepper pe care stă un status; erorile rămân pe pasul la care au apărut. */
function stepIndex(status: DeclarationStatus): number {
  if (status === 'VALIDATION_FAILED') return DECLARATION_STEPPER.indexOf('VALIDATED')
  if (status === 'REJECTED') return DECLARATION_STEPPER.indexOf('ACCEPTED')
  return DECLARATION_STEPPER.indexOf(status)
}

function versionLabel(version: Pick<DeclarationVersion, 'versionNo' | 'kind'>): string {
  return `v${version.versionNo} · ${version.kind === 'RECTIFICATIVE' ? 'Rectificativă' : 'Inițială'}`
}

type Dialog = 'breakdown' | 'xml' | 'reject' | 'rectification' | 'receipt' | 'sign' | 'submit' | null

/** F4: câte un card per declarație (D100, D301, D390) în dosarul PFA. */
export function DeclarationCard({
  summary,
  readOnly,
  onChanged,
}: {
  summary: DeclarationSummary
  readOnly: boolean
  onChanged: () => void
}) {
  const nav = useAccountingNav()
  const { busy, run } = useAction()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [history, setHistory] = useState(false)
  const [receiptNumber, setReceiptNumber] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const declarationId = summary.declarationId
  const detail = useApi(
    () => (declarationId ? accountingApi.declarations.get(declarationId) : Promise.resolve(null)),
    [declarationId, summary.status, summary.currentVersionId],
  )
  const versionId = summary.currentVersionId
  const validation = useApi(
    () => (versionId ? accountingApi.declarations.getValidation(versionId) : Promise.resolve(null)),
    [versionId, summary.status],
  )

  const current = detail.data?.versions.find((version) => version.id === versionId) ?? null
  const status = summary.status
  const operations = !readOnly && status && current ? availableOperations(status) : []
  const title = DECLARATION_TYPE_LABEL[summary.type]
  const isD390 = summary.type === 'D390'
  const amountText = summary.amount === null ? '—' : isD390 ? '0 lei, doar raportare' : formatLei(summary.amount)

  const changed = () => {
    detail.reload()
    validation.reload()
    onChanged()
  }

  const transition = (action: DeclarationAction, note?: string) =>
    accountingApi.declarations.transition(versionId!, { action, note }).then(changed)

  const operate = (operation: DeclarationOperation) => {
    switch (operation) {
      case 'VALIDATE':
        return run('VALIDATE', () => transition('VALIDATE'), 'Validarea s-a încheiat.')
      case 'REGENERATE':
        return run('REGENERATE', () => transition('REGENERATE'), 'Declarația a fost regenerată.')
      case 'MARK_SIGNED':
        return setDialog('sign')
      case 'MARK_SUBMITTED':
        return setDialog('submit')
      case 'MARK_REJECTED':
        return setDialog('reject')
      case 'UPLOAD_RECEIPT':
        return setDialog('receipt')
      case 'CREATE_RECTIFICATION':
        return setDialog('rectification')
    }
  }

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
          <Stack spacing={0.25}>
            <Typography variant="h2">{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {current ? versionLabel(current) : status === 'DRAFT' ? 'Previzualizare, încă negenerată' : formatPeriod(summary.period)}
            </Typography>
          </Stack>
          <AccountingBadge descriptor={status ? DECLARATION_STATUS[status] : null} />
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary">
            {isD390 ? 'De plată' : 'Suma'}
          </Typography>
          {versionId ? (
            <Link component="button" type="button" variant="h5" underline="hover" onClick={() => setDialog('breakdown')} sx={{ display: 'block', textAlign: 'left' }}>
              {amountText}
            </Link>
          ) : (
            <Typography variant="h5">{amountText}</Typography>
          )}
        </Box>

        {summary.blockingReasons.length > 0 && (
          <Alert
            severity={status === 'BLOCKED_MISSING_DOCUMENTS' ? 'error' : 'warning'}
            action={
              <Button color="inherit" size="small" onClick={() => nav.openPfa(summary.pfaId, 'documente', { luna: summary.period })}>
                Documente
              </Button>
            }
          >
            {summary.blockingReasons[0]}
          </Alert>
        )}

        {current && status && (
          <Stepper activeStep={stepIndex(status)} alternativeLabel sx={{ overflowX: 'auto', py: 1 }}>
            {DECLARATION_STEPPER.map((step, index) => {
              const failed =
                (status === 'VALIDATION_FAILED' && step === 'VALIDATED') || (status === 'REJECTED' && step === 'ACCEPTED')
              return (
                <Step key={step} completed={index < stepIndex(status) || (status === 'ACCEPTED' && step === 'ACCEPTED')}>
                  <StepLabel error={failed}>
                    <Typography variant="caption">{failed ? DECLARATION_STATUS[status].label : DECLARATION_STATUS[step].label}</Typography>
                  </StepLabel>
                </Step>
              )
            })}
          </Stepper>
        )}

        {status === 'SUBMITTED' && <Alert severity="warning">Depus nu înseamnă acceptat. Se așteaptă recipisa.</Alert>}
        {current?.receiptNumber && status === 'ACCEPTED' && (
          <Typography variant="body2">Recipisa nr. {current.receiptNumber}</Typography>
        )}

        {validation.data && (
          <Stack spacing={0.75}>
            <Typography variant="subtitle2">Validare ({formatDateTime(validation.data.validatedAt)})</Typography>
            {validation.data.levels.map((level) => (
              <Stack key={level.level} direction="row" sx={{ gap: 1, alignItems: 'flex-start' }}>
                {level.passed ? (
                  <CheckCircleRoundedIcon fontSize="small" sx={{ color: 'success.main', mt: 0.25 }} aria-label="Trecut" />
                ) : (
                  <CancelRoundedIcon fontSize="small" sx={{ color: 'error.main', mt: 0.25 }} aria-label="Picat" />
                )}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {VALIDATION_LEVEL_LABEL[level.level]}
                  </Typography>
                  {level.messages.map((message, index) => (
                    <Typography key={index} variant="body2" color="text.secondary">
                      {message.field ? `${message.field}: ` : ''}
                      {message.text}
                    </Typography>
                  ))}
                </Box>
              </Stack>
            ))}
          </Stack>
        )}

        {(operations.length > 0 || current?.hasPdf || current?.hasXml) && (
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {operations.map((operation, index) => (
              <Button
                key={operation}
                variant={index === 0 ? 'contained' : 'outlined'}
                color={operation === 'MARK_REJECTED' ? 'error' : 'primary'}
                disabled={busy !== null}
                onClick={() => operate(operation)}
              >
                {busy === operation ? 'Se lucrează…' : OPERATION_LABEL[operation]}
              </Button>
            ))}
            {current?.hasPdf && (
              <Button variant="text" onClick={() => run('pdf', async () => openBlob(await accountingApi.declarations.getPdf(current.id)))}>
                Descarcă PDF
              </Button>
            )}
            {current?.hasXml && (
              <Button variant="text" onClick={() => setDialog('xml')}>
                Vezi XML
              </Button>
            )}
          </Stack>
        )}

        {detail.data && detail.data.versions.length > 0 && (
          <>
            <Divider />
            <Link component="button" type="button" variant="body2" onClick={() => setHistory((value) => !value)} sx={{ alignSelf: 'flex-start' }}>
              {history ? 'Ascunde istoricul versiunilor' : `Istoric versiuni (${detail.data.versions.length})`}
            </Link>
            <Collapse in={history} unmountOnExit>
              <Stack spacing={1.5}>
                {[...detail.data.versions].reverse().map((version) => (
                  <Box key={version.id}>
                    <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {versionLabel(version)}
                      </Typography>
                      <AccountingBadge descriptor={DECLARATION_STATUS[version.status]} />
                      <Typography variant="body2">{isD390 ? '0 lei' : formatLei(version.amount)}</Typography>
                    </Stack>
                    {version.rectificationReason && (
                      <Typography variant="caption" color="text.secondary" component="div">
                        Motiv: {version.rectificationReason}
                      </Typography>
                    )}
                    {version.statusHistory.map((entry, index) => (
                      <Typography key={index} variant="caption" color="text.secondary" component="div">
                        {formatDateTime(entry.at)} · {DECLARATION_STATUS[entry.to].label} · {entry.by.name}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Stack>
            </Collapse>
          </>
        )}
      </Stack>

      {dialog === 'breakdown' && versionId && (
        <BreakdownDialog versionId={versionId} type={summary.type} pfaId={summary.pfaId} period={summary.period} onClose={() => setDialog(null)} />
      )}
      {dialog === 'xml' && versionId && current && (
        <XmlDialog versionId={versionId} title={`${summary.type} · ${formatPeriod(summary.period)} · ${versionLabel(current)}`} onClose={() => setDialog(null)} />
      )}
      <ConfirmDialog
        open={dialog === 'sign'}
        title={`Marchează ${summary.type} ca semnată`}
        message="Semnarea se face în afara RIDElance, cu certificatul digital. Aici doar se consemnează."
        confirmLabel="Marchează semnat"
        onClose={() => setDialog(null)}
        onConfirm={() => transition('MARK_SIGNED')}
      />
      <ConfirmDialog
        open={dialog === 'submit'}
        title={`Marchează ${summary.type} ca depusă`}
        message="Depus nu înseamnă acceptat: statusul devine „Recipisă validă” abia după încărcarea recipisei."
        confirmLabel="Marchează depus"
        onClose={() => setDialog(null)}
        onConfirm={() => transition('MARK_SUBMITTED')}
      />
      <ReasonDialog
        open={dialog === 'reject'}
        title={`Marchează ${summary.type} ca respinsă`}
        reasonLabel="Motivul respingerii"
        confirmLabel="Marchează respins"
        destructive
        onClose={() => setDialog(null)}
        onSubmit={(reason) => transition('MARK_REJECTED', reason)}
      />
      <ReasonDialog
        open={dialog === 'rectification'}
        title={`Creează rectificativă ${summary.type}`}
        description={
          <Stack spacing={1.5}>
            <Typography variant="body2">
              Se creează o versiune nouă, calculată din documentele și regulile de acum. Versiunea cu recipisă rămâne neschimbată.
            </Typography>
            {summary.type === 'D100' && (
              <Alert severity="info">
                Pentru D100 se aplică procedura specifică de corecție (de ex. D710, unde e cazul). Implementarea exactă e DE CONFIRMAT cu
                contabilul.
              </Alert>
            )}
          </Stack>
        }
        reasonLabel="Motivul rectificativei"
        confirmLabel="Creează rectificativa"
        onClose={() => setDialog(null)}
        onSubmit={(reason) => accountingApi.declarations.createRectification(declarationId!, { reason }).then(changed)}
      />
      <ReasonDialog
        open={dialog === 'receipt'}
        title={`Încarcă recipisa ${summary.type}`}
        requireReason={false}
        showReason={false}
        canSubmit={receiptFile !== null}
        confirmLabel="Încarcă"
        onClose={() => {
          setDialog(null)
          setReceiptFile(null)
          setReceiptNumber('')
        }}
        onSubmit={async () => {
          await accountingApi.declarations.uploadReceipt(versionId!, { file: receiptFile!, receiptNumber: receiptNumber.trim() || undefined })
          setReceiptFile(null)
          setReceiptNumber('')
          changed()
        }}
      >
        <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
          {receiptFile ? receiptFile.name : 'Alege fișierul recipisei'}
          <input hidden type="file" accept="application/pdf,.pdf,image/*" onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)} />
        </Button>
        <TextField label="Număr recipisă (opțional)" value={receiptNumber} onChange={(event) => setReceiptNumber(event.target.value)} />
      </ReasonDialog>
    </Paper>
  )
}
