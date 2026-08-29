import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material'

import { srlCarPath } from '../../../../config/srlNavigation'
import { rentalsService, type Rental, type RentalOverview, type RentalStatus } from '../../../../services/rentals.service'
import { DASHBOARD_TOKENS, responsiveTableContainerSx } from '../../dashboardTheme'
import { Amount, PageHeader, Panel, StatCard, StatusChip } from '../../ui'
import type { StatusTone } from '../../ui'

/**
 * Închirierile flotei, ca istoric.
 *
 * Pagina a fost și locul din care se deschideau contracte și se generau documente. Nu mai e:
 * o închiriere se face pe o mașină, iar mașina are propriul ecran — a alege din nou mașina
 * dintr-un select, după ce tocmai o aveai în față, era un drum în plus fără niciun câștig.
 *
 * Ce a rămas e întrebarea la nivel de flotă: cine a avut ce, când și pe ce bani. De aceea aici nu
 * se mai poate schimba nimic; fiecare rând duce în mașina lui, unde se și operează.
 */

const STATUS_PRESENTATION: Record<RentalStatus, { label: string; tone: StatusTone }> = {
  // `draft` și `cancelled` vin din decizii, restul din calendar. Amândouă sunt neutre: nici una
  // nu cere ceva de la proprietar acum.
  draft: { label: 'Pregătită', tone: 'neutral' },
  upcoming: { label: 'Viitoare', tone: 'neutral' },
  active: { label: 'Activă', tone: 'active' },
  ending_soon: { label: 'Se apropie predarea', tone: 'warning' },
  completed: { label: 'Încheiată', tone: 'neutral' },
  cancelled: { label: 'Anulată', tone: 'neutral' },
}

const TABS = [
  { id: 'open', label: 'Active' },
  { id: 'upcoming', label: 'Viitoare' },
  { id: 'completed', label: 'Încheiate' },
  // „Toate" nu e un filtru, e o plasă de siguranță: fără el, o închiriere pregătită sau anulată
  // n-ar fi apărut în niciun tab, deci n-ar fi existat pentru cel care o caută.
  { id: 'all', label: 'Toate' },
] as const

type TabId = (typeof TABS)[number]['id']

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function matchesTab(rental: Rental, tab: TabId): boolean {
  if (tab === 'all') return true
  if (tab === 'upcoming') return rental.status === 'upcoming'
  if (tab === 'completed') return rental.status === 'completed'
  return rental.status === 'active' || rental.status === 'ending_soon'
}

export function SrlRentalsPage() {
  const [overview, setOverview] = useState<RentalOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('open')

  useEffect(() => {
    let cancelled = false

    rentalsService
      .getOverview()
      .then((data) => {
        if (!cancelled) setOverview(data)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca închirierile.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={110} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={280} />
      </Stack>
    )
  }

  if (error && !overview) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  const summary = overview?.summary
  const allRentals = overview?.rentals ?? []
  const visible = allRentals.filter((r) => matchesTab(r, tab))
  // Cifra de pe fiecare tab: cel care tocmai a creat o închiriere și n-o vede în „Active" trebuie
  // să citească de pe ecran unde a ajuns, nu să le deschidă pe rând.
  const counts = Object.fromEntries(
    TABS.map((t) => [t.id, allRentals.filter((r) => matchesTab(r, t.id)).length]),
  ) as Record<TabId, number>

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Închirieri"
        subtitle="Istoricul contractelor flotei. O închiriere nouă se deschide din pagina mașinii."
      />

      {summary && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <StatCard label="Închirieri active" value={String(summary.activeCount)} variant="accent" />
          <Panel dense>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
              Valoare contractuală
            </Typography>
            <Box sx={{ mt: 0.8 }}>
              <Amount value={summary.monthlyContractValueBani / 100} unit="lei" size="card" decimals={0} />
            </Box>
            <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle, mt: 0.6 }}>
              pe lună, din contractele deschise
            </Typography>
          </Panel>
          <StatCard
            label="Predări apropiate"
            value={String(summary.upcomingHandoverCount)}
            helper="în următoarele 7 zile"
          />
          <StatCard label="Mașini libere" value={String(summary.availableCars)} />
        </Box>
      )}

      <Panel
        title="Toate închirierile"
        action={
          <Tabs
            value={tab}
            onChange={(_, value: TabId) => setTab(value)}
            sx={{
              minHeight: 0,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                minHeight: 36,
                color: DASHBOARD_TOKENS.textMuted,
                '&.Mui-selected': { color: DASHBOARD_TOKENS.primaryStrong },
              },
            }}
          >
            {TABS.map((t) => (
              <Tab
                key={t.id}
                value={t.id}
                label={counts[t.id] > 0 ? `${t.label} (${counts[t.id]})` : t.label}
              />
            ))}
          </Tabs>
        }
      >
        {visible.length === 0 ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, py: 2 }}>
            {allRentals.length > 0
              ? 'Nicio închiriere aici. Sunt în celelalte categorii — vezi cifrele de pe taburi.'
              : 'Nicio închiriere încă. Prima se deschide din pagina unei mașini.'}
          </Typography>
        ) : (
          <Box sx={responsiveTableContainerSx}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <Box component="thead">
                <Box component="tr">
                  {['Mașină', 'Chiriaș', 'Perioadă', 'Chirie', 'Garanție', 'Status', ''].map((h, i) => (
                    <Box component="th" key={h || i} sx={headSx}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {visible.map((rental) => (
                  <Box component="tr" key={rental.id}>
                    <Box component="td" sx={cellSx}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.86rem', color: DASHBOARD_TOKENS.ink }}>
                        {rental.carLabel}
                      </Typography>
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{rental.tenant.name}</Typography>
                      {rental.tenant.phone && (
                        <Typography sx={{ fontSize: '0.76rem', color: DASHBOARD_TOKENS.textMuted }}>
                          {rental.tenant.phone}
                        </Typography>
                      )}
                      <Typography sx={{ fontSize: '0.72rem', color: DASHBOARD_TOKENS.textSubtle, fontWeight: 700 }}>
                        {rental.publicCode}
                      </Typography>
                    </Box>
                    <Box component="td" sx={{ ...cellSx, fontSize: '0.8rem' }}>
                      {formatDate(rental.startAtUtc)} – {formatDate(rental.endAtUtc)}
                      {rental.closedAtUtc && (
                        <Typography sx={{ fontSize: '0.74rem', color: DASHBOARD_TOKENS.textMuted }}>
                          predată {formatDate(rental.closedAtUtc)}
                        </Typography>
                      )}
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <Amount value={rental.weeklyRentBani / 100} unit="lei/săpt." size="row" decimals={0} />
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <Amount value={rental.depositBani / 100} unit="lei" size="row" decimals={0} />
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <StatusChip
                        label={STATUS_PRESENTATION[rental.status].label}
                        tone={STATUS_PRESENTATION[rental.status].tone}
                        size="sm"
                        outlined
                      />
                    </Box>
                    {/* Singurul lucru care pleacă de aici e drumul spre mașină: documentele,
                        încheierea și predarea se fac acolo. */}
                    <Box component="td" sx={{ ...cellSx, textAlign: 'right' }}>
                      <Button
                        component={RouterLink}
                        to={srlCarPath(rental.carId)}
                        size="small"
                        sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                      >
                        Vezi mașina
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Panel>
    </Stack>
  )
}

const headSx = {
  textAlign: 'left' as const,
  py: 1,
  px: 1.2,
  fontSize: '0.75rem',
  fontWeight: 700,
  color: DASHBOARD_TOKENS.textMuted,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
}

const cellSx = {
  py: 1.3,
  px: 1.2,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
  verticalAlign: 'top' as const,
}
