import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { DeclarationType, Period } from '../../api/types'
import { formatAmount, formatLei, formatPeriod, formatValidity } from '../../format'
import { DECLARATION_TYPE_LABEL } from '../../statusLabels'
import { ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav } from '../navigation'
import { useApi } from '../useApi'

/** F4: „De unde vine suma” — liniile de calcul ale unei versiuni, cu linkuri spre documentele sursă. */
export function BreakdownDialog({
  versionId,
  type,
  pfaId,
  period,
  onClose,
}: {
  versionId: string
  type: DeclarationType
  pfaId: string
  period: Period
  onClose: () => void
}) {
  const nav = useAccountingNav()
  const breakdown = useApi(() => accountingApi.declarations.getBreakdown(versionId), [versionId])
  const data = breakdown.data

  const openDocument = (documentId: string) => nav.openPfa(pfaId, 'documente', { luna: period, document: documentId })

  const DocumentLink = ({ id, label }: { id: string; label: string }) => (
    <Link component="button" type="button" variant="body2" onClick={() => openDocument(id)} sx={{ textAlign: 'left' }}>
      {label}
    </Link>
  )

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        De unde vine suma · {DECLARATION_TYPE_LABEL[type]} · {formatPeriod(period)}
      </DialogTitle>
      <DialogContent>
        {breakdown.error && <ErrorBlock message={breakdown.error} onRetry={breakdown.reload} />}
        {!data && !breakdown.error && <LoadingBlock />}
        {data && (
          <Stack spacing={2}>
            <Typography variant="body2">{data.explanation}</Typography>

            {type === 'D390' ? (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tip</TableCell>
                      <TableCell>Țară</TableCell>
                      <TableCell>Cod TVA</TableCell>
                      <TableCell>Furnizor</TableCell>
                      <TableCell align="right">Bază</TableCell>
                      <TableCell>Documente</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.operationType}</TableCell>
                        <TableCell>{line.supplierCountry}</TableCell>
                        <TableCell>{line.supplierVatId}</TableCell>
                        <TableCell>{line.supplierName}</TableCell>
                        <TableCell align="right">{formatAmount(line.base)}</TableCell>
                        <TableCell>
                          <DocumentLink id={line.sourceDocumentId} label={line.sourceDocumentLabel} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Document</TableCell>
                      <TableCell>Calcul</TableCell>
                      {type === 'D100' && <TableCell>Convenție și certificat de rezidență</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <DocumentLink id={line.sourceDocumentId} label={line.sourceDocumentLabel} />
                          <Typography variant="caption" color="text.secondary" component="div">
                            {line.supplierName} · {line.supplierVatId}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{line.explanation}</TableCell>
                        {type === 'D100' && (
                          <TableCell>
                            <Typography variant="body2">{line.treaty ?? 'Fără convenție'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {line.residenceCertValidFrom && line.residenceCertValidTo
                                ? `Certificat valabil ${formatValidity(line.residenceCertValidFrom, line.residenceCertValidTo)}`
                                : 'Fără certificat de rezidență'}
                            </Typography>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {type === 'D301' && data.excludedRideIncome !== null && (
              <Alert severity="info">Veniturile din curse nu intră în bază: {formatLei(data.excludedRideIncome)}.</Alert>
            )}
            <Typography variant="subtitle2">{type === 'D390' ? '0 lei de plată, doar raportare.' : `Total: ${formatLei(data.total)}`}</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Închide</Button>
      </DialogActions>
    </Dialog>
  )
}
