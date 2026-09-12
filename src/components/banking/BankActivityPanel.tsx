import { useEffect, useMemo, useState } from 'react'

import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Pagination,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'

import {
  bankService,
  type BankActivityDto,
  type BankTransactionsDto,
} from '../../services/bank.service'
import { DASHBOARD_TOKENS as T, responsiveTableContainerSx } from '../dashboard/dashboardTheme'
import {
  BANK_PERIOD_LABELS,
  isCurrent,
  rangeOf,
  shift,
  type BankPeriod,
  type BankPeriodKind,
} from './bankPeriod'

/**
 * Mișcările din cont pe o perioadă aleasă — ce se uită în locul extrasului de cont.
 *
 * Un singur panou pentru toate trei ecranele (PFA, SRL, contabil), fiindcă toate arată același
 * lucru și diferă doar prin al cui e contul. Contabilul primește `userId`-ul clientului; dreptul
 * de a-l citi se verifică pe server, pe legătura client–contabil.
 *
 * Perioada are patru trepte și se poate plimba înainte/înapoi. Ce pleacă spre server sunt două
 * date calendaristice și gruparea coloanelor — vezi `bankPeriod.ts`.
 */
export function BankActivityPanel({ userId }: { userId?: string }) {
  const [period, setPeriod] = useState<BankPeriod>({ kind: 'month', anchor: new Date() })
  const [page, setPage] = useState(1)

  const [activity, setActivity] = useState<BankActivityDto | null>(null)
  const [transactions, setTransactions] = useState<BankTransactionsDto | null>(null)
  const [loading, setLoading] = useState(true)

  const range = useMemo(() => rangeOf(period), [period])

  // Datele vechi rămân pe ecran cât se aduc cele noi: la schimbarea perioadei, un spinner în
  // locul cifrelor ar face tabelul să clipească la fiecare apăsare de săgeată.
  useEffect(() => {
    let cancelled = false

    Promise.all([
      bankService.getActivity({ from: range.from, to: range.to, bucket: range.bucket, userId }),
      bankService.getTransactions({
        from: range.from,
        to: range.to,
        page,
        pageSize: PAGE_SIZE,
        userId,
      }),
    ])
      .then(([summary, list]) => {
        if (cancelled) return
        setActivity(summary)
        setTransactions(list)
      })
      .catch(() => {
        if (cancelled) return
        setActivity(null)
        setTransactions(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [range.from, range.to, range.bucket, page, userId])

  const changeKind = (kind: BankPeriodKind) => {
    // Treapta nouă se ancorează în ziua de azi, nu în perioada de dinainte: altfel, sărind de la
    // „an" la „zi", ai ateriza pe 1 ianuarie fără să înțelegi de ce.
    setPeriod({ kind, anchor: new Date() })
    setPage(1)
  }

  const move = (steps: number) => {
    setPeriod((current) => shift(current, steps))
    setPage(1)
  }

  const net = (activity?.totalIn ?? 0) - (activity?.totalOut ?? 0)

  return (
    <Stack spacing={2.5}>
      <Paper elevation={0} sx={cardSx}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={period.kind}
            onChange={(_, value: BankPeriodKind | null) => value && changeKind(value)}
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                fontWeight: 700,
                fontSize: 13,
                textTransform: 'none',
                borderColor: T.border,
                color: T.textMuted,
              },
              '& .Mui-selected': {
                color: `${T.primaryStrong} !important`,
                backgroundColor: `${alpha(T.primary, 0.1)} !important`,
              },
            }}
          >
            {(Object.keys(BANK_PERIOD_LABELS) as BankPeriodKind[]).map((kind) => (
              <ToggleButton key={kind} value={kind}>
                {BANK_PERIOD_LABELS[kind]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton size="small" onClick={() => move(-1)} aria-label="Perioada anterioară">
              <ChevronLeftRoundedIcon />
            </IconButton>
            <Typography
              sx={{ fontWeight: 750, color: T.ink, fontSize: 14.5, minWidth: 180, textAlign: 'center' }}
            >
              {range.label}
            </Typography>
            <Tooltip title={isCurrent(period) ? 'Ești pe perioada curentă' : ''}>
              {/* Span-ul ține tooltipul viu peste butonul dezactivat. */}
              <span>
                <IconButton
                  size="small"
                  onClick={() => move(1)}
                  disabled={isCurrent(period)}
                  aria-label="Perioada următoare"
                >
                  <ChevronRightRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 2 }}>
          <Total label="Încasări" value={activity?.totalIn ?? 0} tone="in" />
          <Total label="Cheltuieli" value={activity?.totalOut ?? 0} tone="out" />
          <Total label="Net" value={net} tone={net >= 0 ? 'in' : 'out'} />
          <Total label="Tranzacții" value={activity?.transactionCount ?? 0} tone="plain" />
        </Stack>

        {activity && activity.buckets.length > 0 && (
          <ActivityChart activity={activity} />
        )}

        {activity && activity.accounts.length > 0 && (
          <Typography sx={{ mt: 2, fontSize: 12.5, color: T.textSubtle }}>
            {activity.accounts
              .map((a) => `${a.ibanMasked ?? 'Cont'}${a.currency ? ` · ${a.currency}` : ''}`)
              .join('  ·  ')}
            {' — ultima sincronizare: '}
            {formatDateTime(activity.accounts[0].lastSyncedAtUtc)}
          </Typography>
        )}
      </Paper>

      <Paper elevation={0} sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            p: { xs: 2, md: 2.5 },
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <ReceiptLongRoundedIcon sx={{ fontSize: 20, color: T.primaryStrong }} />
          <Typography sx={{ fontWeight: 800, color: T.ink, fontSize: 15.5 }}>Tranzacții</Typography>
        </Stack>

        {loading ? (
          <Stack sx={{ alignItems: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: T.primary }} />
          </Stack>
        ) : !transactions || transactions.items.length === 0 ? (
          <Stack spacing={1} sx={{ alignItems: 'center', py: 6, px: 2, textAlign: 'center' }}>
            <ReceiptLongRoundedIcon sx={{ fontSize: 36, color: T.textSubtle }} />
            <Typography sx={{ color: T.textMuted, fontSize: 14 }}>
              Nicio tranzacție în perioada aleasă.
            </Typography>
          </Stack>
        ) : (
          <Box sx={responsiveTableContainerSx}>
            <Box sx={{ minWidth: { xs: 0, sm: 560 } }}>
              {transactions.items.map((tx) => {
                const isCredit = tx.amount >= 0
                return (
                  <Stack
                    key={tx.id}
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: 'center',
                      px: { xs: 2, md: 2.5 },
                      py: 1.5,
                      borderBottom: `1px solid ${T.border}`,
                      '&:last-of-type': { borderBottom: 'none' },
                    }}
                  >
                    <Typography
                      sx={{
                        width: { xs: 70, sm: 84 },
                        flexShrink: 0,
                        fontSize: { xs: 12, sm: 13 },
                        color: T.textMuted,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatDate(tx.bookingDate)}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 650,
                          fontSize: 14,
                          color: T.ink,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tx.counterpartyName || tx.remittanceInfo || 'Tranzacție'}
                      </Typography>
                      {tx.counterpartyName && tx.remittanceInfo && (
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            color: T.textSubtle,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tx.remittanceInfo}
                        </Typography>
                      )}
                    </Box>
                    {tx.isPending && (
                      <Chip
                        size="small"
                        label="În procesare"
                        sx={{
                          height: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          color: T.textMuted,
                          backgroundColor: alpha(T.ink, 0.06),
                          flexShrink: 0,
                          display: { xs: 'none', sm: 'inline-flex' },
                        }}
                      />
                    )}
                    <Typography
                      sx={{
                        flexShrink: 0,
                        fontWeight: 750,
                        fontSize: 14,
                        fontVariantNumeric: 'tabular-nums',
                        color: isCredit ? T.accent : T.ink,
                      }}
                    >
                      {isCredit ? '+' : ''}
                      {formatMoney(tx.amount, tx.currency)}
                    </Typography>
                  </Stack>
                )
              })}
            </Box>
          </Box>
        )}

        {transactions && transactions.totalCount > PAGE_SIZE && (
          <Stack sx={{ alignItems: 'center', py: 2, borderTop: `1px solid ${T.border}` }}>
            <Pagination
              count={Math.ceil(transactions.totalCount / PAGE_SIZE)}
              page={page}
              onChange={(_, value) => setPage(value)}
              size="small"
            />
          </Stack>
        )}
      </Paper>
    </Stack>
  )
}

const PAGE_SIZE = 25

const cardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: `${T.radius.lg}px`,
  border: `1px solid ${T.border}`,
  boxShadow: T.shadow.sm,
  backgroundColor: T.paper,
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency || 'RON',
    maximumFractionDigits: 2,
  }).format(amount)

const formatDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—'

const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' }) : 'încă niciodată'

function Total({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'in' | 'out' | 'plain'
}) {
  const color = tone === 'in' ? T.accent : tone === 'out' ? T.ink : T.textMuted

  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: `${T.radius.md}px`,
        border: `1px solid ${T.border}`,
        backgroundColor: T.surface,
        minWidth: 130,
      }}
    >
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: T.textSubtle, letterSpacing: 0.3 }}>
        {label.toUpperCase()}
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 17, color, fontVariantNumeric: 'tabular-nums' }}>
        {tone === 'plain' ? value : formatMoney(value, 'RON')}
      </Typography>
    </Box>
  )
}

/**
 * Coloane simple, desenate cu div-uri: două bare per felie de timp, intrări și ieșiri.
 *
 * Fără bibliotecă de grafice — atât are de arătat, iar una nouă ar însemna un pachet în plus
 * pentru patru dreptunghiuri.
 */
function ActivityChart({ activity }: { activity: BankActivityDto }) {
  const peak = Math.max(...activity.buckets.map((b) => Math.max(b.in, b.out)), 1)

  return (
    <Box sx={{ ...responsiveTableContainerSx, mt: 2.5 }}>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: 'flex-end', height: 120, minWidth: activity.buckets.length * 22 }}
      >
        {activity.buckets.map((bucket) => (
          <Tooltip
            key={bucket.start}
            title={`${formatDate(bucket.start)} · +${formatMoney(bucket.in, 'RON')} / −${formatMoney(bucket.out, 'RON')}`}
          >
            <Stack direction="row" spacing={0.25} sx={{ alignItems: 'flex-end', flex: 1, minWidth: 14, height: '100%' }}>
              <Box
                sx={{
                  flex: 1,
                  height: `${Math.max(2, (bucket.in / peak) * 100)}%`,
                  borderRadius: '3px 3px 0 0',
                  backgroundColor: alpha(T.accent, 0.75),
                }}
              />
              <Box
                sx={{
                  flex: 1,
                  height: `${Math.max(2, (bucket.out / peak) * 100)}%`,
                  borderRadius: '3px 3px 0 0',
                  backgroundColor: alpha(T.ink, 0.22),
                }}
              />
            </Stack>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  )
}
