import { useState } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import {
  HomeDashboardContent,
  type StatsTimeframe,
} from '../../dashboard/sections/HomeDashboardView'
import { DASHBOARD_TOKENS } from '../../dashboard/dashboardTheme'
import { DocumentStatusChip, PfaStatusChip } from '../../dashboard/ui'
import { type DashboardSummary, type UserProfile } from '../../../services/user.service'
import { type BoltDashboardDto } from '../../../services/bolt.service'
import { type UberDashboardDto } from '../../../services/uber.service'

const mockSummary: DashboardSummary = {
  pfaRegistrationId: 'demo-registration-id',
  pfaStatus: 'Approved',
  pfaRegistrationType: 'AmPfa',
  pfaCui: 'RO12345678',
  pfaCertificatId: 'demo-cert-id',
  pfaCreatedAtUtc: new Date(2026, 0, 15).toISOString(),
  totalDocuments: 8,
  approvedDocuments: 6,
  pendingDocuments: 2,
  rejectedDocuments: 0,
  unreadNotifications: 0,
  recentDocuments: [
    {
      id: 'demo-doc-1',
      originalFileName: 'ci_sofer_demo.jpg',
      category: 'Carte de Identitate',
      status: 'Pending',
      uploadedAtUtc: new Date().toISOString(),
    },
    {
      id: 'demo-doc-2',
      originalFileName: 'permis_fata_verso.png',
      category: 'Permis de Conducere',
      status: 'Verified',
      uploadedAtUtc: new Date().toISOString(),
    },
    {
      id: 'demo-doc-3',
      originalFileName: 'cazier_judiciar_curat.pdf',
      category: 'Cazier Judiciar',
      status: 'Verified',
      uploadedAtUtc: new Date().toISOString(),
    },
    {
      id: 'demo-doc-4',
      originalFileName: 'Certificat_Inregistrare_PFA.pdf',
      category: 'Certificat de Înregistrare',
      status: 'Verified',
      uploadedAtUtc: new Date().toISOString(),
    },
  ],
  // Cash + card is the payment split of the platform money, so the two views always match.
  venitCash: 2100,
  venitCard: 3900,
  venitBolt: 3000,
  venitUber: 3000,
  taxeEstimate: 1000,
  venitTotal: 6000,
  incomeYear: 2026,
  incomeMonth: 5, // May
  monthlyStats: {
    year: 2026,
    month: 5,
    venitCash: 2100,
    venitCard: 3900,
    venitBolt: 3000,
    venitUber: 3000,
    venitTotal: 6000,
  },
  yearlyStats: {
    year: 2026,
    month: null,
    venitCash: 7600,
    venitCard: 14600,
    venitBolt: 11900,
    venitUber: 10300,
    venitTotal: 22200,
  },
  revenueChartYear: 2026,
  monthlyRevenue: [
    { month: 1, venitTotal: 3500, venitCash: 1200, venitCard: 2300, venitBolt: 2000, venitUber: 1500 },
    { month: 2, venitTotal: 4000, venitCash: 1400, venitCard: 2600, venitBolt: 2200, venitUber: 1800 },
    { month: 3, venitTotal: 4000, venitCash: 1300, venitCard: 2700, venitBolt: 2200, venitUber: 1800 },
    { month: 4, venitTotal: 4700, venitCash: 1600, venitCard: 3100, venitBolt: 2500, venitUber: 2200 },
    { month: 5, venitTotal: 6000, venitCash: 2100, venitCard: 3900, venitBolt: 3000, venitUber: 3000 },
  ],
  // YTD auto-computed tax breakdown
  taxYear: 2026,
  ytdTotalIncome: 22200,
  ytdDeductibleExpenses: 0,
  ytdProfit: 8000,
  ytdCas: 0,
  ytdCass: 2430,
  ytdIncomeTax: 557,
  ytdTotalTax: 2987,
  ytdNetIncome: 5013,
  ytdExpenses: [],
}

const mockProfile: UserProfile = {
  id: 'demo-user',
  email: 'sofer.demo@ridelance.ro',
  firstName: 'Andrei',
  lastName: 'Popescu',
  phoneNumber: '+40 7xx xxx xxx',
  role: 'Client',
  createdAtUtc: new Date(2026, 0, 15).toISOString(),
}

const mockBolt: BoltDashboardDto = {
  isConfigured: true,
  isConnected: true,
  lastFetchedAtUtc: new Date().toISOString(),
  errorMessage: null,
  period: 'month',
  year: 2026,
  month: 5,
  totalOrdersCount: 214,
  totalNetEarnings: 3000,
  totalCashEarnings: 1050,
  totalCardEarnings: 1950,
  totalBusinessEarnings: 420,
  totalTips: 85,
  totalCommissions: 640,
  totalRideDistanceKm: 1840,
  totalRideHours: 96,
  averageNetPerRide: 14,
  averageNetPerRideHour: 31,
  series: [],
  recentRides: [],
}

const mockUber: UberDashboardDto = {
  period: 'month',
  year: 2026,
  month: 5,
  stats: {
    netEarnings: 3000,
    grossEarnings: 3600,
    cashCollected: 1050,
    commission: 600,
    trips: 168,
    kilometers: 1520,
    onlineHours: 110,
    rideHours: 88,
  },
  imports: [
    {
      id: 'demo-import-1',
      year: 2026,
      month: 5,
      fileType: 'earnings',
      fileName: 'castiguri_mai_2026.csv',
      importedAtUtc: new Date().toISOString(),
      netEarnings: 3000,
      grossEarnings: 3600,
      cashCollected: 1050,
      commission: 600,
      trips: 168,
      kilometers: 1520,
      onlineHours: 110,
      rideHours: 88,
    },
  ],
}

export function HomeDashboardView() {
  const [timeframe, setTimeframe] = useState<StatsTimeframe>('month')

  return (
    <Stack spacing={2.5}>
      <HomeDashboardContent
        summary={mockSummary}
        profile={mockProfile}
        boltDashboard={mockBolt}
        uberDashboard={mockUber}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 2, maxWidth: 1100, mx: 'auto', width: '100%' }}>
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
              <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>Status</Typography>
              <PfaStatusChip status={mockSummary.pfaStatus} />
            </Stack>
            {mockSummary.pfaCreatedAtUtc && (
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>Data cererii</Typography>
                <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.9rem' }}>
                  {new Date(mockSummary.pfaCreatedAtUtc).toLocaleDateString('ro-RO')}
                </Typography>
              </Stack>
            )}
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
            {mockSummary.recentDocuments.map((doc) => (
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
                    <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.originalFileName}
                    </Typography>
                    <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.75rem' }}>
                      {doc.category} · {new Date(doc.uploadedAtUtc).toLocaleDateString('ro-RO')}
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
