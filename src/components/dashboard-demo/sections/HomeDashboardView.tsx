import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { HomeDashboardContent } from '../../dashboard/sections/HomeDashboardView'
import { useDashboardFilters } from '../../dashboard/home/useDashboardFilters'
import { DASHBOARD_TOKENS } from '../../dashboard/dashboardTheme'
import { DocumentStatusChip, PfaStatusChip } from '../../dashboard/ui'
import type { PfaDashboardSummary, RidesPage } from '../../../services/pfaDashboard.service'

/* ── Date de demonstrație ─────────────────────────────────────────────────── */

/**
 * Demo-ul se așază pe luna curentă, ca filtrul implicit („Luna curentă") și datele
 * afișate să spună același lucru — altfel previzualizarea pare desincronizată.
 */
const today = new Date()
const DEMO_MONTH = { year: today.getFullYear(), month: today.getMonth() + 1 }
const DEMO_DAYS_IN_MONTH = new Date(DEMO_MONTH.year, DEMO_MONTH.month, 0).getDate()

const isoDay = (day: number) =>
  `${DEMO_MONTH.year}-${`${DEMO_MONTH.month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`

/** Încasări plauzibile, cu vârfuri în weekend. */
const demoDays = Array.from({ length: DEMO_DAYS_IN_MONTH }, (_, index) => {
  const day = index + 1
  const date = new Date(DEMO_MONTH.year, DEMO_MONTH.month - 1, day)
  const isWeekend = date.getDay() === 0 || date.getDay() === 6
  const bolt = Math.round((isWeekend ? 148 : 96) + Math.sin(day) * 22)
  const uber = Math.round((isWeekend ? 132 : 84) + Math.cos(day) * 18)
  return {
    bucket: isoDay(day),
    label: `${day}`,
    bolt,
    uber,
    total: bolt + uber,
    rides: isWeekend ? 12 : 8,
  }
})

const demoNetTotal = demoDays.reduce((sum, point) => sum + point.total, 0)
const demoBoltNet = demoDays.reduce((sum, point) => sum + point.bolt, 0)
const demoUberNet = demoDays.reduce((sum, point) => sum + point.uber, 0)
const demoBoltFees = Math.round(demoBoltNet * 0.11)
const demoUberFees = Math.round(demoUberNet * 0.12)
const demoFees = demoBoltFees + demoUberFees
const demoVat = Math.round(demoFees * 0.21)
const demoNonResident = Math.round(demoBoltFees * 0.02)
const demoIncomeTax = 420
const demoCasCass = 552
const demoTaxTotal = demoVat + demoNonResident + demoIncomeTax + demoCasCass
const demoExpenses = 3200
const demoProfit = demoNetTotal - demoExpenses - demoTaxTotal

const mockSummary: PfaDashboardSummary = {
  period: { from: isoDay(1), to: isoDay(DEMO_DAYS_IN_MONTH), granularity: 'day' },
  kpis: {
    netEarnings: { value: demoNetTotal, previous: Math.round(demoNetTotal * 0.92) },
    platformFees: {
      value: demoFees,
      previous: Math.round(demoFees * 1.04),
      byPlatform: { bolt: demoBoltFees, uber: demoUberFees },
    },
    onlineHours: { value: 184, previous: 176.5 },
    rideKm: { value: 2140, previous: 2010 },
    netPerHour: { value: demoNetTotal / 184, previous: (demoNetTotal * 0.92) / 176.5 },
    netPerKm: { value: demoNetTotal / 2140, previous: (demoNetTotal * 0.92) / 2010 },
  },
  taxReserve: {
    scope: 'fiscalMonth',
    total: demoTaxTotal,
    components: [
      {
        key: 'vatIntracom',
        label: 'TVA intracomunitar estimat',
        amount: demoVat,
        rate: 0.21,
        basis: demoFees,
        note: '21% din comisionul reținut de platforme',
      },
      {
        key: 'boltNonResident',
        label: 'Taxă nerezident Bolt',
        amount: demoNonResident,
        rate: 0.02,
        basis: demoBoltFees,
        note: '2% din comisionul Bolt',
      },
      {
        key: 'incomeTax',
        label: 'Impozit pe venit estimat',
        amount: demoIncomeTax,
        rate: null,
        basis: demoNetTotal - demoExpenses,
        note: 'Cota anuală estimată, alocată perioadei',
      },
      {
        key: 'casCass',
        label: 'CAS/CASS estimat',
        amount: demoCasCass,
        rate: null,
        basis: demoNetTotal - demoExpenses,
        note: 'Din pragurile fiscale ale anului',
      },
    ],
    fiscalMonth: {
      month: `${DEMO_MONTH.year}-${`${DEMO_MONTH.month}`.padStart(2, '0')}`,
      total: demoTaxTotal,
    },
  },
  realProfit: {
    netEarnings: demoNetTotal,
    deductibleExpenses: demoExpenses,
    estimatedTaxes: demoTaxTotal,
    value: demoProfit,
    retentionRatio: demoProfit / demoNetTotal,
  },
  platformSplit: [
    {
      platform: 'bolt',
      net: demoBoltNet,
      fees: demoBoltFees,
      cash: Math.round(demoBoltNet * 0.35),
      card: Math.round(demoBoltNet * 0.65),
      rides: 214,
    },
    {
      platform: 'uber',
      net: demoUberNet,
      fees: demoUberFees,
      cash: Math.round(demoUberNet * 0.3),
      card: Math.round(demoUberNet * 0.7),
      rides: 168,
    },
  ],
  series: {
    netEarnings: demoDays,
    feesAndTaxes: demoDays.map((point) => {
      const boltFee = Math.round(point.bolt * 0.11)
      const uberFee = Math.round(point.uber * 0.12)
      return {
        bucket: point.bucket,
        label: point.label,
        boltFee,
        uberFee,
        vatIntracom: Math.round((boltFee + uberFee) * 0.21),
        boltNonResident: Math.round(boltFee * 0.02),
      }
    }),
    realProfit: demoDays.map((point) => ({
      bucket: point.bucket,
      label: point.label,
      netEarnings: point.total,
      value: Math.round(point.total * (demoProfit / demoNetTotal)),
    })),
  },
  sources: {
    bolt: { configured: true, connected: true, lastSyncAt: new Date().toISOString(), errorMessage: null },
    uber: {
      connected: true,
      lastReportAt: new Date().toISOString(),
      detectedRange: `${isoDay(1)}/${isoDay(DEMO_DAYS_IN_MONTH)}`,
    },
  },
  uberIsMonthlyAggregate: true,
}

const mockRides: RidesPage = {
  page: 1,
  pageSize: 5,
  total: 214,
  uberRidesAvailable: false,
  items: [
    {
      id: 'demo-ride-1',
      platform: 'bolt',
      startedAtUtc: `${isoDay(Math.min(28, DEMO_DAYS_IN_MONTH))}T11:32:00Z`,
      category: 'Comfort',
      pickup: 'Piața Unirii',
      dropoff: 'Aeroport Otopeni',
      distanceKm: 17.4,
      durationMin: 31,
      paymentType: 'card',
      net: 84.5,
    },
    {
      id: 'demo-ride-2',
      platform: 'bolt',
      startedAtUtc: `${isoDay(Math.min(28, DEMO_DAYS_IN_MONTH))}T09:04:00Z`,
      category: 'Economy',
      pickup: 'Bd. Magheru 12',
      dropoff: 'Gara de Nord',
      distanceKm: 4.1,
      durationMin: 14,
      paymentType: 'cash',
      net: 21.9,
    },
    {
      id: 'demo-ride-3',
      platform: 'bolt',
      startedAtUtc: `${isoDay(Math.min(27, DEMO_DAYS_IN_MONTH))}T19:41:00Z`,
      category: 'Comfort',
      pickup: 'Piața Victoriei',
      dropoff: 'Băneasa Shopping City',
      distanceKm: 8.6,
      durationMin: 22,
      paymentType: 'card',
      net: 39.2,
    },
    {
      id: 'demo-ride-4',
      platform: 'bolt',
      startedAtUtc: `${isoDay(Math.min(27, DEMO_DAYS_IN_MONTH))}T16:18:00Z`,
      category: 'Economy',
      pickup: 'Str. Ion Mihalache 45',
      dropoff: 'AFI Cotroceni',
      distanceKm: 6.3,
      durationMin: 26,
      paymentType: 'card',
      net: 28.7,
    },
    {
      id: 'demo-ride-5',
      platform: 'bolt',
      startedAtUtc: `${isoDay(Math.min(27, DEMO_DAYS_IN_MONTH))}T08:52:00Z`,
      category: 'Economy',
      pickup: 'Titan',
      dropoff: 'Piața Romană',
      distanceKm: 9.8,
      durationMin: 34,
      paymentType: 'cash',
      net: 33.4,
    },
  ],
}

const demoDocuments = [
  { id: 'demo-doc-1', originalFileName: 'ci_sofer_demo.jpg', category: 'Carte de Identitate', status: 'Pending' },
  { id: 'demo-doc-2', originalFileName: 'permis_fata_verso.png', category: 'Permis de Conducere', status: 'Verified' },
  { id: 'demo-doc-3', originalFileName: 'cazier_judiciar_curat.pdf', category: 'Cazier Judiciar', status: 'Verified' },
  { id: 'demo-doc-4', originalFileName: 'Certificat_Inregistrare_PFA.pdf', category: 'Certificat de Înregistrare', status: 'Verified' },
]

/**
 * Previzualizarea publică folosește exact ecranul din aplicație, doar cu date fixe.
 * Filtrele funcționează vizual; datele rămân aceleași, fiind un demo.
 */
export function HomeDashboardView() {
  const { filters, setPeriod, setCustomRange, setPlatform, setPayment, reset } = useDashboardFilters()

  return (
    <Stack spacing={2.5}>
      <HomeDashboardContent
        data={mockSummary}
        isLoading={false}
        isFetching={false}
        error={null}
        onRetry={() => {}}
        filters={filters}
        onPeriodChange={setPeriod}
        onCustomRangeChange={setCustomRange}
        onPlatformChange={setPlatform}
        onPaymentChange={setPayment}
        onReset={reset}
        ridesOverride={mockRides}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gap: 2,
          maxWidth: 1440,
          mx: 'auto',
          width: '100%',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            gridColumn: { xs: 'span 12', md: 'span 5' },
            p: 2.5,
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
          }}
        >
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 0.5 }}>
            Status inregistrare PFA
          </Typography>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
            Starea cererii tale de inregistrare PFA (Demo)
          </Typography>

          <Stack spacing={1.5}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>
                Status
              </Typography>
              <PfaStatusChip status="Approved" />
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>
                Data cererii
              </Typography>
              <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.9rem' }}>
                15.01.2026
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            gridColumn: { xs: 'span 12', md: 'span 7' },
            p: 2.5,
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
          }}
        >
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 0.5 }}>
            Documente recente
          </Typography>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
            Ultimele documente incarcate (Demo)
          </Typography>

          <Stack spacing={1}>
            {demoDocuments.map((doc) => (
              <Paper
                key={doc.id}
                elevation={0}
                sx={{
                  p: 1.4,
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  border: `1px solid ${DASHBOARD_TOKENS.border}`,
                  backgroundColor: DASHBOARD_TOKENS.surface,
                }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: DASHBOARD_TOKENS.ink,
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.originalFileName}
                    </Typography>
                    <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.75rem' }}>
                      {doc.category}
                    </Typography>
                  </Box>
                  <DocumentStatusChip status={doc.status} size="sm" />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
