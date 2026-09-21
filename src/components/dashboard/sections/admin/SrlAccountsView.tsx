import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { TOKENS } from '../../../../constants/tokens'
import { adminAccountsService, type AdminSrlAccount } from '../../../../services/adminAccounts.service'
import { ActionMenu, StatusBadge, type StatusTone } from '../../../admin'
import { CloseAccountDialog } from './CloseAccountDialog'

/**
 * „SRL înrolate”: firmele, la fel ca lista PFA — cine e activ, cine nu, cine și-a închis contul.
 *
 * Active = abonament plătit. Inactive = onboarding terminat, dar fără abonament activ. „În
 * onboarding” sunt firmele care n-au terminat pașii. „Șterse” sunt conturile închise, care rămân
 * aici cu tot istoricul: nimic nu dispare din evidențe.
 */

type Filter = 'active' | 'inactive' | 'onboarding' | 'deleted'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'onboarding', label: 'În onboarding' },
  { id: 'deleted', label: 'Șterse' },
]

function filterOf(account: AdminSrlAccount): Filter {
  if (account.deletedAtUtc) return 'deleted'
  if (!account.enrolled) return 'onboarding'
  return account.subscriptionActive ? 'active' : 'inactive'
}

const STATUS: Record<Filter, { label: string; tone: StatusTone }> = {
  active: { label: 'Activ', tone: 'success' },
  inactive: { label: 'Inactiv', tone: 'warning' },
  onboarding: { label: 'În onboarding', tone: 'neutral' },
  deleted: { label: 'Cont închis', tone: 'error' },
}

const formatDate = (utc: string | null) => (utc ? new Date(utc).toLocaleDateString('ro-RO') : '—')

function relativeTime(utc: string | null): string {
  if (!utc) return 'Fără activitate'
  const days = Math.floor((Date.now() - new Date(utc).getTime()) / 86_400_000)
  if (days <= 0) return 'Azi'
  if (days === 1) return 'Ieri'
  return `Acum ${days} zile`
}

export function SrlAccountsView({
  onImpersonate,
  onSnackbar,
}: {
  onImpersonate: (userId: string, name: string) => void
  onSnackbar: (message: string, severity: 'success' | 'error') => void
}) {
  const [accounts, setAccounts] = useState<AdminSrlAccount[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('active')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [closing, setClosing] = useState<{ userId: string; name: string; action: 'close' | 'reopen' } | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    let cancelled = false
    adminAccountsService
      .getSrlAccounts()
      .then((data) => {
        if (cancelled) return
        setAccounts(data)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca firmele.')
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { active: 0, inactive: 0, onboarding: 0, deleted: 0 }
    for (const account of accounts ?? []) result[filterOf(account)] += 1
    return result
  }, [accounts])

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (accounts ?? []).filter(
      (account) =>
        filterOf(account) === filter &&
        (!needle ||
          [account.companyName, account.cui, account.email, account.contactName, account.phone]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(needle))),
    )
  }, [accounts, filter, search])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">SRL înrolate</Typography>
        <Typography color="text.secondary" variant="body1" sx={{ mt: 1 }}>
          Firmele cu cont RIDElance: abonamentul, mașinile și anunțurile lor. Conturile închise rămân la „Șterse”, cu tot
          istoricul.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1.5, alignItems: { md: 'center' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SearchRoundedIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
          <TextField
            size="small"
            label="Caută după firmă, CUI sau email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ width: { xs: '100%', sm: 320 } }}
          />
        </Box>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {FILTERS.map((entry) => (
            <Chip
              key={entry.id}
              label={`${entry.label} (${counts[entry.id]})`}
              onClick={() => setFilter(entry.id)}
              variant={filter === entry.id ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 700,
                ...(filter === entry.id
                  ? { bgcolor: TOKENS.primary, color: '#fff', '&:hover': { bgcolor: TOKENS.primaryStrong } }
                  : { borderColor: alpha(TOKENS.ink, 0.15), color: TOKENS.textMuted }),
              }}
            />
          ))}
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {!accounts && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}
      {accounts && visible.length === 0 && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography sx={{ color: TOKENS.textMuted }}>
            {search ? 'Nicio firmă găsită.' : 'Nicio firmă în categoria asta.'}
          </Typography>
        </Box>
      )}

      {accounts && visible.length > 0 && (
        <Paper sx={{ overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">
              {visible.length} firme afișate
            </Typography>
          </Box>
          {visible.map((account) => {
            const status = STATUS[filterOf(account)]
            const open = expanded === account.userId
            const deleted = Boolean(account.deletedAtUtc)
            return (
              <Box
                component="article"
                key={account.userId}
                sx={{ borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      lg: 'minmax(240px, 1.6fr) minmax(160px, 1fr) minmax(170px, 1fr) auto',
                    },
                    gap: 2,
                    p: 2.5,
                    alignItems: 'center',
                    opacity: deleted ? 0.8 : 1,
                    '&:hover': { bgcolor: 'grey.50' },
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'primary.light', color: 'text.primary', fontSize: 16 }}>
                      {account.companyName.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                        {account.companyName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                        {[account.cui ? `CUI ${account.cui}` : null, account.email].filter(Boolean).join(' · ')}
                      </Typography>
                      {account.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {account.phone}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  <Box>
                    <StatusBadge label={status.label} tone={status.tone} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                      {account.plan} · {account.subscriptionStatus}
                      {account.billingCycle ? ` · ${account.billingCycle}` : ''}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2">
                      {account.carsPublished} publicate din {account.carsTotal} mașini
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.paidExtraListings > 0
                        ? `${account.paidExtraListings} anunțuri extra plătite · `
                        : ''}
                      {relativeTime(account.lastActivityAtUtc)}
                    </Typography>
                  </Box>

                  <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center', justifyContent: { lg: 'flex-end' } }}>
                    <Button variant="outlined" size="small" onClick={() => onImpersonate(account.userId, account.companyName)}>
                      Intră în contul firmei
                    </Button>
                    <ActionMenu
                      items={[
                        ...(account.companySlug
                          ? [
                              {
                                key: 'page',
                                label: 'Deschide pagina publică',
                                onClick: () => {
                                  window.open(`/${account.companySlug}`, '_blank', 'noopener')
                                },
                              },
                            ]
                          : []),
                        deleted
                          ? {
                              key: 'reopen',
                              label: 'Redeschide contul',
                              onClick: () => setClosing({ userId: account.userId, name: account.companyName, action: 'reopen' }),
                            }
                          : {
                              key: 'close',
                              label: 'Închide contul',
                              destructive: true,
                              dividerBefore: Boolean(account.companySlug),
                              onClick: () => setClosing({ userId: account.userId, name: account.companyName, action: 'close' }),
                            },
                      ]}
                    />
                    <IconButton
                      size="small"
                      aria-label={open ? 'Ascunde detaliile' : 'Arată detaliile'}
                      aria-expanded={open}
                      onClick={() => setExpanded(open ? null : account.userId)}
                    >
                      <ExpandMoreRoundedIcon sx={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
                    </IconButton>
                  </Stack>
                </Box>

                <Collapse in={open} unmountOnExit>
                  <Box
                    sx={{
                      px: 2.5,
                      pb: 2.5,
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' },
                      gap: 2,
                    }}
                  >
                    {[
                      ['Persoană de contact', account.contactName],
                      ['Plan', `${account.plan}${account.billingCycle ? ` (${account.billingCycle})` : ''}`],
                      ['Următoarea plată', formatDate(account.nextBillingDateUtc)],
                      ['Anunțuri incluse', `${account.carsPublished} folosite din ${account.includedListings}`],
                      ['Anunțuri extra plătite', String(account.paidExtraListings)],
                      ['Onboarding', account.enrolled ? 'Terminat' : `Pasul ${account.onboardingStep + 1}`],
                      ['Cont creat', formatDate(account.createdAtUtc)],
                      ...(deleted
                        ? [
                            ['Închis la', formatDate(account.deletedAtUtc)],
                            ['Motivul închiderii', account.deletionReason ?? '—'],
                          ]
                        : []),
                    ].map(([label, value]) => (
                      <Box key={label}>
                        <Typography variant="caption" color="text.secondary">
                          {label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                          {value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            )
          })}
        </Paper>
      )}

      <CloseAccountDialog
        target={closing}
        onClose={() => setClosing(null)}
        onDone={(message) => {
          setClosing(null)
          onSnackbar(message, 'success')
          reload()
        }}
      />
    </Stack>
  )
}
