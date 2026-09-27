import type { ReactNode } from 'react'
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded'
import { visuallyHidden } from '@mui/utils'
import { Box, Button, Divider, Paper, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { PfaAccountingSummary, Period } from '../../api/types'
import { EMPTY, formatDate, formatLei, formatPeriod } from '../../format'
import {
  CASH_REGISTER_STATUS,
  DECLARATION_STATUS,
  DECLARATION_TYPE_LABEL,
  ENGAGEMENT_STATUS,
  PLATFORM_DOCUMENT_STATUS,
  PLATFORM_DOCUMENT_TYPE_LABEL,
  PLATFORM_LABEL,
} from '../../statusLabels'
import { AccountingBadge, EmptyText, LoadingBlock } from '../components'
import type { ClientSection } from '../navigation'
import { useApi } from '../useApi'
import { Card, ClientAvatar } from './ui'

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', minWidth: 0 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', '& svg': { fontSize: 18 } }} aria-hidden>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, typography: 'body2' }}>
        <Box component="span" sx={visuallyHidden}>
          {label}:{' '}
        </Box>
        {children}
      </Box>
    </Stack>
  )
}

function Stat({ value, label }: { value: number | undefined; label: string }) {
  return (
    <Stack sx={{ alignItems: 'center', py: 1.5, minWidth: 0 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value ?? EMPTY}</Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {label}
      </Typography>
    </Stack>
  )
}

/** Prezentarea clientului: cardul de profil și luna aleasă dintr-o privire. */
export function ClientOverview({
  summary,
  period,
  onOpen,
}: {
  summary: PfaAccountingSummary
  period: Period
  onOpen: (section: ClientSection) => void
}) {
  const declarations = useApi(() => accountingApi.declarations.list(summary.id, period), [summary.id, period])
  const documents = useApi(() => accountingApi.documents.list(summary.id, period), [summary.id, period])
  const docs = documents.data ?? []
  const toReview = documents.data ? docs.filter((doc) => doc.status === 'NEEDS_REVIEW' || doc.status === 'PENDING_CONFIRMATION').length : undefined
  const due = declarations.data?.filter((item) => item.status !== 'NOT_APPLICABLE' && item.status !== null).length

  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '300px minmax(0, 1fr)' }, alignItems: 'start' }}>
      <Paper sx={{ p: 3 }}>
        <Stack sx={{ alignItems: 'center', textAlign: 'center', gap: 1 }}>
          <ClientAvatar name={summary.name} size={80} />
          <Typography variant="h2" component="p" sx={{ mt: 1 }}>
            {summary.name}
          </Typography>
          <AccountingBadge descriptor={ENGAGEMENT_STATUS[summary.engagement.status]} />
        </Stack>

        <Box
          sx={{
            mt: 2.5,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            '& > *:not(:last-child)': { borderRight: 1, borderColor: 'divider' },
          }}
        >
          <Stat value={due} label="Declarații" />
          <Stat value={documents.data ? docs.length : undefined} label="Documente" />
          <Stat value={toReview} label="De verificat" />
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Stack spacing={1.5}>
          <Detail icon={<BadgeRoundedIcon />} label="CUI">
            CUI {summary.cui || EMPTY}
          </Detail>
          <Detail icon={<AlternateEmailRoundedIcon />} label="Email">
            <Box component="a" href={`mailto:${summary.client.email}`} sx={{ color: 'inherit', wordBreak: 'break-all' }}>
              {summary.client.email}
            </Box>
          </Detail>
          {summary.client.phone && (
            <Detail icon={<PhoneRoundedIcon />} label="Telefon">
              <Box component="a" href={`tel:${summary.client.phone}`} sx={{ color: 'inherit' }}>
                {summary.client.phone}
              </Box>
            </Detail>
          )}
          <Detail icon={<DirectionsCarRoundedIcon />} label="Platforme">
            {summary.platforms.map((platform) => PLATFORM_LABEL[platform]).join(', ') || 'Fără platforme'}
          </Detail>
          <Detail icon={<ReceiptRoundedIcon />} label="TVA">
            {summary.art317 ? `Cod art. 317 din ${formatDate(summary.art317ActivationDate)}` : 'Fără cod art. 317'}
          </Detail>
          <Detail icon={<PaymentsRoundedIcon />} label="Numerar">
            {summary.cash.status === 'NOT_REQUIRED_CURRENT_CONFIGURATION' ? (
              'Fără numerar'
            ) : (
              <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                Numerar <AccountingBadge descriptor={CASH_REGISTER_STATUS[summary.cash.status]} />
              </Stack>
            )}
          </Detail>
          <Detail icon={<CalendarMonthRoundedIcon />} label="Client din">
            Client din {formatDate(summary.engagement.startDate)}
          </Detail>
        </Stack>
      </Paper>

      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <Card
          title={`Declarații · ${formatPeriod(period)}`}
          padded={false}
          action={
            <Button size="small" onClick={() => onOpen('declaratii')}>
              Vezi toate
            </Button>
          }
        >
          {!declarations.data && <LoadingBlock />}
          {declarations.data && (
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: 2.5, py: 1.25 } }}>
              <TableBody>
                {declarations.data.map((item) => (
                  <TableRow key={item.type}>
                    <TableCell sx={{ fontWeight: 600 }}>{DECLARATION_TYPE_LABEL[item.type]}</TableCell>
                    <TableCell align="right">{item.amount === null ? EMPTY : formatLei(item.amount)}</TableCell>
                    <TableCell align="right" sx={{ width: 180 }}>
                      <AccountingBadge descriptor={item.status ? DECLARATION_STATUS[item.status] : null} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card
          title={`Documente · ${formatPeriod(period)}`}
          padded={false}
          action={
            <Button size="small" onClick={() => onOpen('documente')}>
              Vezi toate
            </Button>
          }
        >
          {!documents.data && <LoadingBlock />}
          {documents.data && docs.length === 0 && (
            <Box sx={{ px: 2.5, pb: 1 }}>
              <EmptyText>Niciun document.</EmptyText>
            </Box>
          )}
          {docs.length > 0 && (
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: 2.5, py: 1.25 } }}>
              <TableBody>
                {docs.slice(0, 6).map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {PLATFORM_DOCUMENT_TYPE_LABEL[doc.documentType]}
                        {doc.platform ? ` ${PLATFORM_LABEL[doc.platform]}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary', maxWidth: 240 }}>
                      <Typography variant="body2" noWrap>
                        {doc.fileName}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ width: 180 }}>
                      <AccountingBadge descriptor={PLATFORM_DOCUMENT_STATUS[doc.status]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </Stack>
    </Box>
  )
}
