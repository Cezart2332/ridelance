import { useDeferredValue, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { Box, Button, ButtonBase, InputAdornment, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { ClientWorkspaceRow } from '../../api/types'
import { formatLei } from '../../format'
import { EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav, type ClientSection } from '../navigation'
import { useApi } from '../useApi'
import { Avatar, MonthSelect, PageTitle, Panel, StatusPill } from './parts'
import { UnassignedDocuments, UploadDocumentsDialog } from './PlatformInbox'
import { bankCell, currentFiscalPeriod, DECLARATION_TYPES, declarationCell, documentsCell, HAIRLINE, INK, PRIMARY, TONES, type Tone } from './status'

type Filter = 'ALL' | 'MISSING' | 'REVIEW' | 'READY' | 'INACTIVE'

const FILTERS: { value: Filter; label: string; tone: Tone | null; match: (row: ClientWorkspaceRow) => boolean }[] = [
  { value: 'ALL', label: 'Toți', tone: null, match: (row) => row.stage !== 'INACTIVE' },
  { value: 'MISSING', label: 'Blocați', tone: 'red', match: (row) => row.monthStatus === 'MISSING_DOCUMENTS' },
  { value: 'REVIEW', label: 'De verificat', tone: 'yellow', match: (row) => row.monthStatus === 'NEEDS_REVIEW' },
  { value: 'READY', label: 'Gata', tone: 'green', match: (row) => row.monthStatus === 'READY' },
  { value: 'INACTIVE', label: 'Inactivi', tone: 'gray', match: (row) => row.stage === 'INACTIVE' },
]

/** Secțiunea din legăturile vechi (`?section=documents|chat`), din notificări. */
const LEGACY_SECTION: Record<string, ClientSection> = { documents: 'luna', chat: 'mesaje' }

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** „Clienți PFA”: un rând pe client, cu starea fiecărui pas al lunii. */
export function ClientsTableView() {
  const nav = useAccountingNav()
  const [params, setParams] = useSearchParams()
  const current = currentFiscalPeriod()
  const period = nav.period ?? current
  const clients = useApi(() => accountingApi.clients.list(period), [period])
  const inbox = useApi(() => accountingApi.platformInbox.list(), [])
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const query = fold(useDeferredValue(search.trim()))
  const [filter, setFilter] = useState<Filter>(nav.listTab === 'inactive' ? 'INACTIVE' : 'ALL')

  // Legăturile din notificări (`?user={userId}&section=…`) deschid direct clientul.
  const linkedUser = params.get('user')
  useEffect(() => {
    if (!linkedUser || !clients.data) return
    const row = clients.data.find((item) => item.userId === linkedUser)
    if (row) {
      nav.openPfa(row.pfaId, LEGACY_SECTION[params.get('section') ?? ''] ?? 'luna')
    } else {
      const next = new URLSearchParams(params)
      next.delete('user')
      next.delete('section')
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedUser, clients.data])

  // Clienții în onboarding nu au încă lună de lucrat: nu apar în tabel.
  const rows = (clients.data ?? []).filter((row) => row.stage !== 'ONBOARDING')
  const active = FILTERS.find((item) => item.value === filter)!
  const visible = rows
    .filter(active.match)
    .filter((row) => !query || fold(row.name).includes(query) || row.cui.includes(query) || fold(row.email).includes(query))
  const open = (row: ClientWorkspaceRow, section: ClientSection = 'luna') => nav.openPfa(row.pfaId, section, { luna: period })

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, gap: 2 }}>
        <PageTitle>Clienți PFA</PageTitle>
        <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
          <Button variant="contained" startIcon={<UploadFileRoundedIcon />} onClick={() => setUploading(true)} sx={{ height: 56, whiteSpace: 'nowrap' }}>
            Încarcă documente
          </Button>
          <MonthSelect value={period} current={current} onChange={(value) => nav.setParam('luna', value)} />
        </Stack>
      </Stack>

      {uploading && (
        <UploadDocumentsDialog
          open
          period={period}
          current={current}
          onClose={() => setUploading(false)}
          onUploaded={() => {
            inbox.reload()
            clients.reload()
          }}
        />
      )}

      <UnassignedDocuments
        items={inbox.data ?? []}
        clients={rows}
        onChanged={() => {
          inbox.reload()
          clients.reload()
        }}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1.5, alignItems: { md: 'center' } }}>
        <TextField
          placeholder="Caută după nume sau CUI"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ width: { xs: '100%', md: 340 } }}
          slotProps={{
            htmlInput: { 'aria-label': 'Caută client' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
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
                  height: 40,
                  px: 2,
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
                {item.label} {clients.data ? rows.filter(item.match).length : ''}
              </ButtonBase>
            )
          })}
        </Stack>
      </Stack>

      <Panel sx={{ overflow: 'hidden' }}>
        {clients.error && (
          <Box sx={{ p: 2 }}>
            <ErrorBlock message={clients.error} onRetry={clients.reload} />
          </Box>
        )}
        {!clients.data && !clients.error && <LoadingBlock />}
        {clients.data && visible.length === 0 && (
          <Box sx={{ px: 2.5, py: 1 }}>
            <EmptyText>{query ? 'Niciun client nu corespunde căutării.' : 'Niciun client.'}</EmptyText>
          </Box>
        )}
        {visible.length > 0 && (
          <TableContainer sx={{ overflowX: 'auto', opacity: clients.loading ? 0.6 : 1 }}>
            <Table sx={{ '& .MuiTableCell-root': { borderColor: HAIRLINE, py: 1.5 }, '& .MuiTableCell-head': { bgcolor: '#FBFDFE', color: '#6B6B7B', fontWeight: 600 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 2.5 }}>Client</TableCell>
                  <TableCell>Documente</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Bancă</TableCell>
                  {DECLARATION_TYPES.map((type) => (
                    <TableCell key={type} sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      {type}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ pr: 2.5, display: { xs: 'none', sm: 'table-cell' } }}>
                    Mesaje
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((row) => (
                  <TableRow
                    key={row.pfaId}
                    hover
                    tabIndex={0}
                    role="link"
                    aria-label={`Deschide dosarul ${row.name}`}
                    onClick={() => open(row)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') open(row)
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ pl: 2.5 }}>
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                        <Avatar name={row.name} size={36} />
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{row.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {row.stage === 'INACTIVE' ? (
                        <StatusPill cell={{ tone: 'gray', label: 'Inactiv' }} />
                      ) : (
                        <StatusPill cell={documentsCell(row)} />
                      )}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <StatusPill cell={bankCell(row.bankStatus)} />
                    </TableCell>
                    {DECLARATION_TYPES.map((type) => {
                      const cell = row.declarations[type]
                      const word = declarationCell(cell)
                      return (
                        <TableCell key={type} sx={{ display: { xs: 'none', lg: 'table-cell' }, whiteSpace: 'nowrap', fontSize: 14 }}>
                          {word ? (
                            <>
                              {type !== 'D390' && cell?.amount !== null && cell?.amount !== undefined && (
                                <Box component="span" sx={{ fontWeight: 600, mr: 0.75 }}>
                                  {formatLei(cell.amount)}
                                </Box>
                              )}
                              <Box component="span" sx={{ color: TONES[word.tone].text, fontWeight: 600, fontSize: 13 }}>
                                {word.label}
                              </Box>
                            </>
                          ) : (
                            <Box component="span" sx={{ color: '#9A9AA8' }}>
                              —
                            </Box>
                          )}
                        </TableCell>
                      )
                    })}
                    <TableCell align="right" sx={{ pr: 2.5, display: { xs: 'none', sm: 'table-cell' } }}>
                      {row.unreadMessages > 0 ? (
                        <Box component="span" sx={{ px: 1.1, py: 0.4, borderRadius: 999, bgcolor: PRIMARY, fontWeight: 700, fontSize: 12, color: INK }}>
                          {row.unreadMessages}
                        </Box>
                      ) : (
                        <Box component="span" sx={{ color: '#9A9AA8' }}>
                          —
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Panel>
    </Stack>
  )
}
