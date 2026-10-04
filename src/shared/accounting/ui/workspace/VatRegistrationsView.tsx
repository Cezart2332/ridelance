import { useState } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { ButtonBase, Dialog, DialogContent, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { VatRegistration, VatRegistrationStatus } from '../../api/types'
import { formatDate } from '../../format'
import { EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useApi } from '../useApi'
import { Avatar, PageTitle, Panel, StatusPill } from './parts'
import { TONES, VAT_STATUS_CELL, type Tone } from './status'
import { VatRegistrationCard } from './VatRegistrationCard'

type Filter = 'ALL' | 'REVIEW' | 'BLOCKED' | 'TO_FILE' | 'FILED' | 'DONE'

const FILTERS: { value: Filter; label: string; tone: Tone | null; statuses: VatRegistrationStatus[] | null }[] = [
  { value: 'ALL', label: 'Toate', tone: null, statuses: null },
  { value: 'REVIEW', label: 'De verificat', tone: 'yellow', statuses: ['GENERATED', 'READY_FOR_REVIEW'] },
  { value: 'BLOCKED', label: 'Blocate', tone: 'red', statuses: ['WAITING_FOR_DATA', 'VALIDATION_FAILED', 'REJECTED'] },
  { value: 'TO_FILE', label: 'De depus', tone: 'blue', statuses: ['APPROVED'] },
  { value: 'FILED', label: 'Depuse', tone: 'blue', statuses: ['SUBMITTED'] },
  { value: 'DONE', label: 'Cod primit', tone: 'green', statuses: ['REGISTERED'] },
]

/** „Cod TVA”: cererile D700 generate din onboarding, verificate și aprobate de contabil. */
export function VatRegistrationsView() {
  const requests = useApi(() => accountingApi.vatRegistrations.list(), [])
  const [filter, setFilter] = useState<Filter>('ALL')
  const [openId, setOpenId] = useState<string | null>(null)
  // Răspunsul acțiunii din dialog, afișat până sosește lista reîncărcată.
  const [latest, setLatest] = useState<VatRegistration | null>(null)

  if (requests.error && !requests.data) return <ErrorBlock message={requests.error} onRetry={requests.reload} />
  if (!requests.data) return <LoadingBlock />

  const rows = requests.data
  const active = FILTERS.find((item) => item.value === filter)!
  const visible = rows.filter((row) => !active.statuses || active.statuses.includes(row.status))
  const opened = latest?.id === openId ? latest : (rows.find((row) => row.id === openId) ?? null)
  const open = (id: string | null) => {
    setLatest(null)
    setOpenId(id)
  }
  const changed = (next: VatRegistration) => {
    setLatest(next)
    requests.reload()
  }

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <PageTitle>Cod TVA</PageTitle>

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
                borderColor: selected ? 'var(--rl-border-strong)' : (tone?.border ?? 'var(--rl-border)'),
                bgcolor: selected ? 'var(--rl-muted)' : (tone?.bg ?? 'var(--rl-input)'),
                color: selected ? 'var(--rl-fg)' : (tone?.text ?? 'var(--rl-text-muted)'),
              }}
            >
              {item.label} {rows.filter((row) => !item.statuses || item.statuses.includes(row.status)).length}
            </ButtonBase>
          )
        })}
      </Stack>

      <Panel>
        {visible.length === 0 ? (
          <Stack sx={{ px: 2.5, py: 1 }}>
            <EmptyText>Nicio cerere D700.</EmptyText>
          </Stack>
        ) : (
          <TableContainer>
            <Table sx={{ '& td, & th': { borderColor: 'var(--rl-border)' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 2.5 }}>Client</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>CUI</TableCell>
                  <TableCell>Stare</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Actualizată</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    role="link"
                    tabIndex={0}
                    aria-label={`Deschide D700 ${row.clientName}`}
                    onClick={() => open(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') open(row.id)
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ pl: 2.5 }}>
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                        <Avatar name={row.clientName} size={36} />
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{row.clientName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{row.cui ?? '—'}</TableCell>
                    <TableCell>
                      <StatusPill cell={{ ...VAT_STATUS_CELL[row.status], title: row.missingData ?? row.rejectionReason ?? undefined }} />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatDate(row.updatedAtUtc)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Panel>

      <Dialog open={opened !== null} onClose={() => open(null)} maxWidth="sm" fullWidth>
        <Stack direction="row" sx={{ justifyContent: 'flex-end', px: 1, pt: 1 }}>
          <IconButton aria-label="Închide" onClick={() => open(null)}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <DialogContent sx={{ pt: 0 }}>{opened && <VatRegistrationCard key={opened.id} request={opened} onChanged={changed} />}</DialogContent>
      </Dialog>
    </Stack>
  )
}
