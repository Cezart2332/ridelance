import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

import { SRL_ROOT, SRL_PATHS } from '../../../../config/srlNavigation'
import {
  srlHomeService,
  type AttentionItem,
  type AttentionSeverity,
  type SrlHome,
} from '../../../../services/srlHome.service'
import { DASHBOARD_TOKENS, responsiveTableContainerSx } from '../../dashboardTheme'
import { Amount, PageHeader, Panel, SplitBar, StatCard, StatusChip } from '../../ui'

/**
 * Acasă în dashboardul SRL.
 *
 * Răspunde la o singură întrebare: ce trebuie făcut azi. De aceea „Necesită atenție" e primul
 * bloc după cifre și fiecare rând din el duce undeva — o alertă fără destinație e o notificare,
 * nu o sarcină.
 *
 * Cifrele vin gata calculate de pe server. Compuse în frontend din trei liste separate, ar fi
 * ajuns să se contrazică cu paginile care le arată pe fiecare în parte.
 */

const SEVERITY: Record<AttentionSeverity, { color: string; icon: typeof InfoOutlinedIcon }> = {
  danger: { color: DASHBOARD_TOKENS.stateError, icon: ErrorOutlineRoundedIcon },
  warning: { color: DASHBOARD_TOKENS.stateWarning, icon: WarningAmberRoundedIcon },
  info: { color: DASHBOARD_TOKENS.accent, icon: InfoOutlinedIcon },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
}

export function SrlHomePage() {
  const [data, setData] = useState<SrlHome | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    srlHomeService
      .get()
      .then((home) => {
        if (!cancelled) setData(home)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca situația flotei.')
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={110} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={280} />
      </Stack>
    )
  }

  if (error || !data) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error ?? 'Nu am putut încărca situația flotei.'}
        </Alert>
      </Box>
    )
  }

  const utilisation = data.fleetSize === 0 ? 0 : Math.round((data.rentedCount / data.fleetSize) * 100)

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Bun venit înapoi."
        subtitle="Mașinile, închirierile și lucrurile care necesită atenție."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink}
              to={SRL_PATHS.companyPage}
              variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              Pagina publică
            </Button>
            {/* Închirierea se deschide de pe mașină, nu de aici: butonul duce în flotă, unde
                fiecare card are acțiunea pe el. */}
            <Button
              component={RouterLink}
              to={SRL_PATHS.cars}
              variant="contained"
              disableElevation
              startIcon={<DirectionsCarFilledRoundedIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              Mașinile mele
            </Button>
          </Stack>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2 }}>
        <StatCard
          label="Mașini în flotă"
          value={String(data.fleetSize)}
          helper={`${data.publishedCount} publicate`}
          variant="accent"
        />
        <StatCard
          label="Închirieri active"
          value={String(data.activeRentals)}
          helper={`${data.availableCount} mașini libere`}
        />
        <Panel dense>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
            Valoare contractuală
          </Typography>
          <Box sx={{ mt: 0.8 }}>
            <Amount value={data.monthlyContractValueBani / 100} unit="lei" size="card" decimals={0} />
          </Box>
          <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle, mt: 0.6 }}>
            pe lună
          </Typography>
        </Panel>
        <StatCard
          label="Documente expiră"
          value={String(data.documentsExpiringSoon)}
          helper="în 30 de zile"
        />
        <StatCard
          label="Mentenanță programată"
          value={String(data.scheduledMaintenance)}
          helper="în 14 zile"
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' }, gap: 2 }}>
        <Panel
          title="Necesită atenție"
          subtitle="Doar lucrurile care trebuie rezolvate."
          fill
        >
          {data.attention.length === 0 ? (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, py: 1.5 }}>
              Nimic urgent. Flota e în regulă.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {data.attention.map((item) => (
                <AttentionRow key={item.id} item={item} />
              ))}
            </Stack>
          )}
        </Panel>

        <Panel
          title="Utilizare flotă"
          subtitle={`${data.rentedCount} din ${data.fleetSize} mașini sunt închiriate`}
          action={<StatusChip label={`${utilisation}%`} tone="active" size="sm" />}
          fill
        >
          <SplitBar first={data.rentedCount} second={data.availableCount} />

          {/* `BreakdownRow` formatează valoarea în lei; aici sunt mașini, deci etichetele se scriu direct. */}
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', mt: 1.5 }}>
            <Legend color={DASHBOARD_TOKENS.accent} label="Închiriate" value={data.rentedCount} />
            <Legend color={DASHBOARD_TOKENS.accentSoft} label="Libere" value={data.availableCount} />
          </Stack>
        </Panel>
      </Box>

      <Panel
        title="Închirieri active"
        subtitle="Situația mașinilor aflate acum la clienți"
        action={
          <Button
            component={RouterLink}
            to={SRL_PATHS.rentals}
            size="small"
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Toate închirierile
          </Button>
        }
      >
        {data.activeRentalRows.length === 0 ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, py: 1.5 }}>
            Nicio închiriere în desfășurare.
          </Typography>
        ) : (
          <Box sx={responsiveTableContainerSx}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <Box component="thead">
                <Box component="tr">
                  {['Mașină', 'Chiriaș', 'Perioadă', 'Chirie', 'Status'].map((h) => (
                    <Box component="th" key={h} sx={headSx}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {data.activeRentalRows.map((row) => (
                  <Box component="tr" key={row.id}>
                    <Box component="td" sx={{ ...cellSx, fontWeight: 800, fontSize: '0.86rem' }}>
                      {row.carLabel}
                    </Box>
                    <Box component="td" sx={{ ...cellSx, fontSize: '0.85rem' }}>{row.tenantName}</Box>
                    <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
                      {formatDate(row.startAtUtc)} – {formatDate(row.endAtUtc)}
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <Amount value={row.weeklyRentBani / 100} unit="lei/săpt." size="row" decimals={0} />
                    </Box>
                    <Box component="td" sx={cellSx}>
                      <StatusChip
                        label={row.status === 'ending_soon' ? 'Se apropie predarea' : 'Activă'}
                        tone={row.status === 'ending_soon' ? 'warning' : 'active'}
                        size="sm"
                        outlined
                      />
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

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <Stack direction="row" spacing={0.9} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>{value}</Typography>
    </Stack>
  )
}

function AttentionRow({ item }: { item: AttentionItem }) {
  const { color, icon: Icon } = SEVERITY[item.severity]

  return (
    <Stack
      component={RouterLink}
      to={`${SRL_ROOT}/${item.target}`}
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: 'center',
        p: 1.4,
        borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'background-color 120ms ease',
        '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.05) },
        '&:focus-visible': { outline: `2px solid ${DASHBOARD_TOKENS.primaryStrong}`, outlineOffset: 2 },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: `${DASHBOARD_TOKENS.radius.sm}px`,
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha(color, 0.1),
          color,
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.86rem', color: DASHBOARD_TOKENS.ink }}>
          {item.title}
        </Typography>
        <Typography noWrap sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }}>
          {item.detail}
        </Typography>
      </Box>
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
  verticalAlign: 'middle' as const,
}
