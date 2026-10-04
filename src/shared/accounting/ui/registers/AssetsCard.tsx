import { useState } from 'react'
import {
  Button,
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
import type { Asset, AssetKind, FixedAssetCandidate, FixedAssetDecision } from '../../api/types'
import { EMPTY, formatAmount, formatDate, parseAmount } from '../../format'
import { ASSET_KIND_LABEL, ASSET_STATUS } from '../../statusLabels'
import { AccountingBadge, EmptyText, ErrorBlock, LoadingBlock, ReasonDialog } from '../components'
import { useAction } from '../notify'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { downloadBlob, useApi } from '../useApi'

const DECISIONS: { value: FixedAssetDecision; label: string }[] = [
  { value: 'FIXED_ASSET', label: 'Mijloc fix' },
  { value: 'INVENTORY_OBJECT', label: 'Obiect de inventar' },
  { value: 'EXPENSE', label: 'Cheltuială curentă' },
]

interface ClassifyForm {
  name: string
  documentRef: string
  supplierName: string
  inServiceDate: string
  depreciationClassCode: string
  normalLifeMonths: string
}

interface ManualForm {
  name: string
  kind: AssetKind
  entryDate: string
  entryValue: string
  documentRef: string
}

const today = () => new Date().toISOString().slice(0, 10)

/** Registre §6: posibilele mijloace fixe, decizia Adminului, activele, clasificarea, ieșirea, fișa MF. */
export function AssetsCard({ summary, onChanged }: DossierTabProps & { onChanged: () => void }) {
  const { busy, run } = useAction()
  const assets = useApi(() => accountingApi.assets.list(summary.id), [summary.id])
  const candidates = useApi(() => accountingApi.assets.candidates(summary.id), [summary.id])
  const [deciding, setDeciding] = useState<{ candidate: FixedAssetCandidate; decision: FixedAssetDecision; name: string } | null>(null)
  const [classifying, setClassifying] = useState<{ asset: Asset; form: ClassifyForm } | null>(null)
  const [disposing, setDisposing] = useState<{ asset: Asset; date: string } | null>(null)
  const [manual, setManual] = useState<ManualForm | null>(null)
  const readOnly = summary.readOnly

  const reload = () => {
    assets.reload()
    candidates.reload()
    onChanged()
  }

  const classifyForm = classifying?.form
  const setClassify = (patch: Partial<ClassifyForm>) => setClassifying((current) => current && { ...current, form: { ...current.form, ...patch } })
  const life = classifyForm?.normalLifeMonths ? Number(classifyForm.normalLifeMonths) : null
  const classifyValid = Boolean(classifyForm?.name.trim() && classifyForm.documentRef.trim() && (life === null || (life >= 12 && life <= 600)))
  const manualValid = Boolean(manual?.name.trim() && manual.documentRef.trim() && manual.entryDate && parseAmount(manual.entryValue))

  return (
    <Paper id="registers-assets">
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h2">Active și fișe MF</Typography>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {!readOnly && (
              <Button size="small" variant="outlined" onClick={() => setManual({ name: '', kind: 'FIXED_ASSET', entryDate: today(), entryValue: '', documentRef: '' })}>
                Activ adus ca aport
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              disabled={busy !== null}
              onClick={() =>
                run('list', async () => downloadBlob(await accountingApi.assets.exportList(summary.id, today(), 'pdf'), `Lista_active_${summary.cui}.pdf`))
              }
            >
              Lista activelor
            </Button>
          </Stack>
        </Stack>

        {(candidates.data?.length ?? 0) > 0 && (
          <Stack spacing={1} id="registers-asset-candidates">
            <Typography variant="subtitle2">Posibile mijloace fixe</Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableBody>
                  {candidates.data!.map((candidate) => (
                    <TableRow key={candidate.ledgerEntryId} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(candidate.date)}</TableCell>
                      <TableCell>{candidate.counterparty ? `${candidate.description} – ${candidate.counterparty}` : candidate.description}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatAmount(Math.abs(candidate.amount))}</TableCell>
                      <TableCell align="right">
                        {!readOnly && (
                          <Button size="small" variant="contained" onClick={() => setDeciding({ candidate, decision: 'FIXED_ASSET', name: candidate.description })}>
                            Decide
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </Stack>

      {assets.error && <ErrorBlock message={assets.error} onRetry={assets.reload} />}
      {!assets.data && !assets.error && <LoadingBlock />}
      {assets.data && assets.data.length === 0 && (
        <Stack sx={{ px: 2.5, pb: 2.5 }}>
          <EmptyText>Niciun activ.</EmptyText>
        </Stack>
      )}
      {assets.data && assets.data.length > 0 && (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nr.</TableCell>
                <TableCell>Denumire</TableCell>
                <TableCell>Fel</TableCell>
                <TableCell>Intrare</TableCell>
                <TableCell align="right">Valoare</TableCell>
                <TableCell align="right">Amortizat</TableCell>
                <TableCell align="right">Rămas</TableCell>
                <TableCell>Stare</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.data.map((asset) => (
                <TableRow key={asset.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{asset.inventoryNumber}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{ASSET_KIND_LABEL[asset.kind]}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(asset.entryDate)}</TableCell>
                  <TableCell align="right">{formatAmount(asset.entryValue)}</TableCell>
                  <TableCell align="right">{asset.kind === 'FIXED_ASSET' ? formatAmount(asset.accumulated) : EMPTY}</TableCell>
                  <TableCell align="right">{formatAmount(asset.remaining)}</TableCell>
                  <TableCell>
                    <AccountingBadge descriptor={ASSET_STATUS[asset.status]} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {!readOnly && asset.status !== 'DISPOSED' && (
                      <Button
                        size="small"
                        onClick={() =>
                          setClassifying({
                            asset,
                            form: {
                              name: asset.name,
                              documentRef: asset.documentRef,
                              supplierName: asset.supplierName ?? '',
                              inServiceDate: asset.inServiceDate ?? '',
                              depreciationClassCode: asset.depreciationClassCode ?? '',
                              normalLifeMonths: asset.normalLifeMonths ? String(asset.normalLifeMonths) : '',
                            },
                          })
                        }
                      >
                        {asset.status === 'PENDING_CLASSIFICATION' ? 'Clasifică' : 'Modifică'}
                      </Button>
                    )}
                    {asset.kind === 'FIXED_ASSET' && (
                      <Button
                        size="small"
                        disabled={busy !== null}
                        onClick={() =>
                          run(`sheet-${asset.id}`, async () =>
                            downloadBlob(await accountingApi.assets.exportSheet(summary.id, asset.id, 'pdf'), `Fisa_MF_${asset.inventoryNumber}_${summary.cui}.pdf`),
                          )
                        }
                      >
                        Fișa MF
                      </Button>
                    )}
                    {!readOnly && asset.status !== 'DISPOSED' && (
                      <Button size="small" color="inherit" onClick={() => setDisposing({ asset, date: today() })}>
                        Ieșire
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ReasonDialog
        open={deciding !== null}
        title={deciding ? `${deciding.candidate.description} · ${formatAmount(Math.abs(deciding.candidate.amount))} lei` : ''}
        requireReason={false}
        canSubmit={Boolean(deciding && (deciding.decision === 'EXPENSE' || deciding.name.trim()))}
        onClose={() => setDeciding(null)}
        onSubmit={async (reason) => {
          if (!deciding) return
          await accountingApi.assets.decide(summary.id, deciding.candidate.ledgerEntryId, deciding.decision, deciding.name.trim() || null, reason || null)
          reload()
        }}
      >
        {deciding && (
          <>
            <TextField select label="Tratament" value={deciding.decision} onChange={(event) => setDeciding({ ...deciding, decision: event.target.value as FixedAssetDecision })}>
              {DECISIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            {deciding.decision !== 'EXPENSE' && (
              <TextField label="Denumire" value={deciding.name} onChange={(event) => setDeciding({ ...deciding, name: event.target.value })} />
            )}
          </>
        )}
      </ReasonDialog>

      <ReasonDialog
        open={classifying !== null}
        title={classifying ? `${classifying.asset.inventoryNumber} ${classifying.asset.name}` : ''}
        requireReason={false}
        canSubmit={classifyValid}
        onClose={() => setClassifying(null)}
        onSubmit={async (reason) => {
          if (!classifying) return
          const form = classifying.form
          await accountingApi.assets.classify(summary.id, classifying.asset.id, {
            name: form.name.trim(),
            documentRef: form.documentRef.trim(),
            supplierName: form.supplierName.trim() || null,
            inServiceDate: form.inServiceDate || null,
            depreciationClassCode: form.depreciationClassCode.trim() || null,
            normalLifeMonths: form.normalLifeMonths ? Number(form.normalLifeMonths) : null,
            reason: reason || null,
          })
          reload()
        }}
      >
        {classifyForm && classifying && (
          <>
            <TextField label="Denumire" value={classifyForm.name} onChange={(event) => setClassify({ name: event.target.value })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <TextField label="Document de achiziție" value={classifyForm.documentRef} onChange={(event) => setClassify({ documentRef: event.target.value })} fullWidth />
              <TextField label="Furnizor" value={classifyForm.supplierName} onChange={(event) => setClassify({ supplierName: event.target.value })} fullWidth />
            </Stack>
            <TextField
              type="date"
              label="Punere în funcțiune"
              value={classifyForm.inServiceDate}
              onChange={(event) => setClassify({ inServiceDate: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {classifying.asset.kind === 'FIXED_ASSET' && (
              <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
                <TextField label="Clasa (HG 2139/2004)" value={classifyForm.depreciationClassCode} onChange={(event) => setClassify({ depreciationClassCode: event.target.value })} fullWidth />
                <TextField
                  label="Durata normală (luni)"
                  type="number"
                  value={classifyForm.normalLifeMonths}
                  onChange={(event) => setClassify({ normalLifeMonths: event.target.value })}
                  error={life !== null && (life < 12 || life > 600)}
                  fullWidth
                />
              </Stack>
            )}
          </>
        )}
      </ReasonDialog>

      <ReasonDialog
        open={disposing !== null}
        title={disposing ? `Ieșire din gestiune · ${disposing.asset.inventoryNumber}` : ''}
        reasonLabel="Motivul ieșirii"
        destructive
        onClose={() => setDisposing(null)}
        onSubmit={async (reason) => {
          if (!disposing) return
          await accountingApi.assets.dispose(summary.id, disposing.asset.id, disposing.date, reason)
          reload()
        }}
      >
        {disposing && (
          <TextField
            type="date"
            label="Data ieșirii"
            value={disposing.date}
            onChange={(event) => setDisposing({ ...disposing, date: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        )}
      </ReasonDialog>

      <ReasonDialog
        open={manual !== null}
        title="Activ adus ca aport"
        requireReason={false}
        canSubmit={manualValid}
        onClose={() => setManual(null)}
        onSubmit={async (reason) => {
          if (!manual) return
          await accountingApi.assets.create(summary.id, {
            name: manual.name.trim(),
            kind: manual.kind,
            entryDate: manual.entryDate,
            entryValue: parseAmount(manual.entryValue) ?? 0,
            documentRef: manual.documentRef.trim(),
            supplierName: null,
            reason: reason || null,
          })
          reload()
        }}
      >
        {manual && (
          <>
            <TextField label="Denumire" value={manual.name} onChange={(event) => setManual({ ...manual, name: event.target.value })} />
            <TextField select label="Fel" value={manual.kind} onChange={(event) => setManual({ ...manual, kind: event.target.value as AssetKind })}>
              <MenuItem value="FIXED_ASSET">{ASSET_KIND_LABEL.FIXED_ASSET}</MenuItem>
              <MenuItem value="INVENTORY_OBJECT">{ASSET_KIND_LABEL.INVENTORY_OBJECT}</MenuItem>
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <TextField
                type="date"
                label="Data intrării"
                value={manual.entryDate}
                onChange={(event) => setManual({ ...manual, entryDate: event.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField label="Valoare de intrare (lei)" value={manual.entryValue} onChange={(event) => setManual({ ...manual, entryValue: event.target.value })} fullWidth />
            </Stack>
            <TextField label="Document (proces-verbal de aport)" value={manual.documentRef} onChange={(event) => setManual({ ...manual, documentRef: event.target.value })} />
          </>
        )}
      </ReasonDialog>
    </Paper>
  )
}
