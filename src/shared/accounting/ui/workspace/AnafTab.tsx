import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, ButtonBase, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { EFacturaMessage, EFacturaMessageKind } from '../../api/types'
import { formatDate, formatDateTime, formatMoney } from '../../format'
import { EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav } from '../navigation'
import { useNotify } from '../notify'
import { downloadBlob, errorMessage, openBlob, useApi } from '../useApi'
import { Panel, StatusPill } from './parts'
import { SpvAppCard } from './SpvAppCard'
import { SpvSection } from './SpvSection'
import { HAIRLINE, INK, MUTED, TONES, type Cell, type Tone } from './status'

const DARK = { bgcolor: INK, color: '#FFFFFF', '&:hover': { bgcolor: '#2d2d45' } }

const KIND_CELL: Record<EFacturaMessageKind, Cell> = {
  RECEIVED: { tone: 'blue', label: 'Primită' },
  SENT: { tone: 'green', label: 'Trimisă' },
  ERROR: { tone: 'red', label: 'Eroare' },
  BUYER_MESSAGE: { tone: 'gray', label: 'Mesaj' },
  OTHER: { tone: 'gray', label: 'Altul' },
}

type Filter = 'ALL' | 'RECEIVED' | 'SENT' | 'ERROR'

const FILTERS: { value: Filter; label: string; tone: Tone | null }[] = [
  { value: 'ALL', label: 'Toate', tone: null },
  { value: 'RECEIVED', label: 'Primite', tone: 'blue' },
  { value: 'SENT', label: 'Trimise', tone: 'green' },
  { value: 'ERROR', label: 'Erori', tone: 'red' },
]

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, py: 1, borderTop: `1px solid ${HAIRLINE}` }}>
      <Typography sx={{ fontSize: 14, color: MUTED }}>{label}</Typography>
      <Box sx={{ fontSize: 14, color: INK, textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' }}>{children}</Box>
    </Stack>
  )
}

/**
 * „ANAF”: conexiunea împuternicitului (OAuth, certificatul adminului) și e-Factura clientului.
 * Conectarea și sincronizarea le face doar adminul; facturile le vede și contabilul.
 */
export function AnafTab({ pfaId }: { pfaId: string }) {
  const nav = useAccountingNav()
  const notify = useNotify()
  const [params, setParams] = useSearchParams()
  const state = useApi(() => accountingApi.anaf.forPfa(pfaId), [pfaId])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('ALL')
  const admin = nav.role === 'Admin'

  // Întoarcerea de la ANAF: rezultatul autorizării vine în URL o singură dată.
  const connected = params.get('anaf')
  const refused = params.get('anaf_eroare')
  useEffect(() => {
    if (!connected && !refused) return
    if (connected) notify('Contul ANAF e conectat.', 'success')
    if (refused) notify(refused, 'error')
    const next = new URLSearchParams(params)
    next.delete('anaf')
    next.delete('anaf_eroare')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, refused])

  if (state.error && !state.data) return <ErrorBlock message={state.error} onRetry={state.reload} />
  if (!state.data) return <LoadingBlock />
  const { connection, link, messages } = state.data

  const run = async (key: string, action: () => Promise<unknown>, done?: string) => {
    setBusy(key)
    setError(null)
    try {
      await action()
      if (done) notify(done, 'success')
      state.reload()
    } catch (actionError) {
      setError(errorMessage(actionError))
    } finally {
      setBusy(null)
    }
  }

  const connectAccount = () =>
    run('account', async () => {
      const returnPath = `${window.location.pathname}${window.location.search}`
      window.location.assign(await accountingApi.anaf.start(returnPath))
    })

  const file = (message: EFacturaMessage, kind: 'xml' | 'pdf') =>
    run(`${kind}-${message.id}`, async () => {
      const blob = await accountingApi.anaf.getFile(message.id, kind)
      if (kind === 'pdf') openBlob(blob)
      else downloadBlob(blob, `efactura_${message.invoiceNumber ?? message.id}.xml`)
    })

  const accountActive = connection.status === 'ACTIVE'
  const accountCell: Cell = accountActive
    ? { tone: 'green', label: 'Conectat' }
    : connection.status === 'EXPIRED'
      ? { tone: 'red', label: 'Expirat' }
      : { tone: 'gray', label: 'Neconectat' }
  const linkCell: Cell | null = link
    ? link.status === 'ACTIVE'
      ? { tone: 'green', label: 'Conectat' }
      : link.status === 'NO_ACCESS'
        ? { tone: 'red', label: 'Fără drept în SPV', title: link.lastError ?? undefined }
        : { tone: 'gray', label: 'Oprit' }
    : null

  const visible = messages.filter((message) => filter === 'ALL' || message.kind === filter)
  const button = (key: string, label: string, onClick: () => void, primary = false) => (
    <Button variant={primary ? 'contained' : 'outlined'} disabled={busy !== null} onClick={onClick} sx={primary ? DARK : undefined}>
      {busy === key ? 'Se lucrează…' : label}
    </Button>
  )

  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      {!connection.configured && <Alert severity="warning">Conexiunea ANAF nu e configurată pe server.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2.5, alignItems: 'stretch' }}>
        <Panel sx={{ flex: 1, px: 2.5, py: 2 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: INK }}>
              Cont ANAF
            </Typography>
            <StatusPill cell={accountCell} />
          </Stack>
          {connection.connectedBy && <Row label="Conectat de">{connection.connectedBy}</Row>}
          {accountActive && <Row label="Valabil până la">{formatDate(connection.refreshExpiresAtUtc)}</Row>}
          {connection.lastError && <Alert severity="warning" sx={{ mt: 1 }}>{connection.lastError}</Alert>}
          {admin && connection.configured && !accountActive && (
            <Box sx={{ pt: 1.5 }}>{button('account', connection.status === 'EXPIRED' ? 'Reconectează' : 'Conectează contul ANAF', () => void connectAccount(), true)}</Box>
          )}
        </Panel>

        <Panel sx={{ flex: 1, px: 2.5, py: 2 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: INK }}>
              e-Factura
            </Typography>
            <StatusPill cell={linkCell} />
          </Stack>
          {link?.lastSyncAtUtc && <Row label="Sincronizat">{formatDateTime(link.lastSyncAtUtc)}</Row>}
          {link?.status === 'ACTIVE' && link.lastError && <Alert severity="warning" sx={{ mt: 1 }}>{link.lastError}</Alert>}
          {link?.status === 'NO_ACCESS' && link.lastError && <Alert severity="error" sx={{ mt: 1 }}>{link.lastError}</Alert>}
          {admin && accountActive && (
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', pt: 1.5 }}>
              {link?.status === 'ACTIVE' ? (
                <>
                  {button('sync', 'Sincronizează', () => void run('sync', () => accountingApi.anaf.sync(pfaId), 'Sincronizat.'), true)}
                  {button('disable', 'Oprește', () => void run('disable', () => accountingApi.anaf.disablePfa(pfaId)))}
                </>
              ) : (
                button('connect', link ? 'Conectează din nou' : 'Conectează clientul', () => void run('connect', () => accountingApi.anaf.connectPfa(pfaId)), true)
              )}
            </Stack>
          )}
        </Panel>
      </Stack>

      {admin && <SpvAppCard />}

      <Stack spacing={1.5}>
        <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: INK }}>
          Facturi e-Factura
        </Typography>
        <Stack direction="row" role="group" aria-label="Filtru" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {FILTERS.map((item) => {
            const selected = item.value === filter
            const tone = item.tone ? TONES[item.tone] : null
            return (
              <ButtonBase
                key={item.value}
                aria-pressed={selected}
                onClick={() => setFilter(item.value)}
                sx={{
                  height: 36,
                  px: 1.75,
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  border: '1px solid',
                  borderColor: selected ? INK : (tone?.border ?? 'rgba(0,0,0,0.12)'),
                  bgcolor: selected ? INK : (tone?.bg ?? '#FFFFFF'),
                  color: selected ? '#FFFFFF' : (tone?.text ?? INK),
                }}
              >
                {item.label} {messages.filter((message) => item.value === 'ALL' || message.kind === item.value).length}
              </ButtonBase>
            )
          })}
        </Stack>

        <Panel>
          {visible.length === 0 ? (
            <Box sx={{ px: 2.5, py: 1 }}>
              <EmptyText>Nicio factură e-Factura.</EmptyText>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ '& td, & th': { borderColor: HAIRLINE } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 2.5 }}>Factura</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Data</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Tip</TableCell>
                    <TableCell align="right" sx={{ pr: 2.5 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map((message) => {
                    const party = message.kind === 'SENT' ? message.customerName : message.supplierName
                    const invoice = message.kind === 'RECEIVED' || message.kind === 'SENT'
                    return (
                      <TableRow key={message.id}>
                        <TableCell sx={{ pl: 2.5 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{party ?? message.anafType}</Typography>
                          {message.invoiceNumber && <Typography sx={{ fontSize: 13, color: MUTED }}>{message.invoiceNumber}</Typography>}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatDate(message.issueDate ?? message.createdAtUtc)}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          {message.totalAmount !== null ? formatMoney(message.totalAmount, message.currency) : ''}
                        </TableCell>
                        <TableCell>
                          <StatusPill cell={{ ...KIND_CELL[message.kind], title: message.downloadError ?? undefined }} />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 2.5, whiteSpace: 'nowrap' }}>
                          {invoice && message.downloaded && (
                            <>
                              <Button size="small" disabled={busy !== null} onClick={() => void file(message, 'pdf')}>
                                PDF
                              </Button>
                              <Button size="small" disabled={busy !== null} onClick={() => void file(message, 'xml')}>
                                XML
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Panel>
      </Stack>

      <SpvSection pfaId={pfaId} />
    </Stack>
  )
}
