import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { PfaIncomeSummary } from '../../dashboard/sections/PfaIncomeSummary'
import { PfaTaxSummaryWidget } from '../../dashboard/sections/PfaTaxSummaryWidget'
import { RevenueCharts } from '../../dashboard/sections/RevenueCharts'
import { DASHBOARD_TOKENS } from '../../dashboard/dashboardTheme'
import { type DashboardSummary } from '../../../services/user.service'

function pfaStatusChip(status: string | null) {
  if (!status) return null
  const map: Record<string, { label: string; color: string; bg: string }> = {
    Pending:  { label: 'In verificare', color: '#b54708', bg: alpha('#ed6c02', 0.1) },
    Approved: { label: 'Aprobat',       color: '#2e7d32', bg: alpha('#2e7d32', 0.08) },
    Rejected: { label: 'Respins',       color: '#b71c1c', bg: alpha('#d32f2f', 0.08) },
  }
  const cfg = map[status] ?? { label: status, color: DASHBOARD_TOKENS.textMuted, bg: alpha(DASHBOARD_TOKENS.ink, 0.06) }
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full, color: cfg.color, backgroundColor: cfg.bg }}
    />
  )
}

function docStatusChip(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    Verified: { label: 'Verificat',     color: '#2e7d32', bg: alpha('#2e7d32', 0.08) },
    Pending:  { label: 'In verificare', color: '#b54708', bg: alpha('#ed6c02', 0.10) },
    Rejected: { label: 'Respins',       color: '#b71c1c', bg: alpha('#d32f2f', 0.08) },
  }
  const cfg = map[status] ?? { label: status, color: DASHBOARD_TOKENS.textMuted, bg: alpha(DASHBOARD_TOKENS.ink, 0.06) }
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: DASHBOARD_TOKENS.radius.full, color: cfg.color, backgroundColor: cfg.bg }}
    />
  )
}

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
  venitCash: 1000,
  venitCard: 1000,
  venitBolt: 3000,
  venitUber: 3000,
  taxeEstimate: 1000,
  venitTotal: 6000,
  incomeYear: 2026,
  incomeMonth: 5, // May
  monthlyStats: {
    year: 2026,
    month: 5,
    venitCash: 1000,
    venitCard: 1000,
    venitBolt: 3000,
    venitUber: 3000,
    venitTotal: 6000,
  },
  yearlyStats: {
    year: 2026,
    month: null,
    venitCash: 3200,
    venitCard: 3200,
    venitBolt: 11900,
    venitUber: 10300,
    venitTotal: 22200,
  },
  revenueChartYear: 2026,
  monthlyRevenue: [
    { month: 1, venitTotal: 3500, venitCash: 500, venitCard: 500, venitBolt: 2000, venitUber: 1500 },
    { month: 2, venitTotal: 4000, venitCash: 600, venitCard: 600, venitBolt: 2200, venitUber: 1800 },
    { month: 3, venitTotal: 4000, venitCash: 400, venitCard: 400, venitBolt: 2200, venitUber: 1800 },
    { month: 4, venitTotal: 4700, venitCash: 700, venitCard: 700, venitBolt: 2500, venitUber: 2200 },
    { month: 5, venitTotal: 6000, venitCash: 1000, venitCard: 1000, venitBolt: 3000, venitUber: 3000 },
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

export function HomeDashboardView() {
  return (
    <Stack spacing={2.5}>
      <PfaIncomeSummary
        venitCash={mockSummary.venitCash ?? 0}
        venitCard={mockSummary.venitCard ?? 0}
        venitBolt={mockSummary.venitBolt ?? 0}
        venitUber={mockSummary.venitUber ?? 0}
        taxeEstimate={mockSummary.taxeEstimate ?? 0}
        venitTotal={mockSummary.venitTotal ?? 0}
        incomeYear={mockSummary.incomeYear}
        incomeMonth={mockSummary.incomeMonth}
      />

      <PfaTaxSummaryWidget summary={mockSummary} />

      <RevenueCharts
        year={mockSummary.revenueChartYear ?? new Date().getFullYear()}
        monthlyRevenue={mockSummary.monthlyRevenue ?? []}
        venitCash={mockSummary.venitCash ?? 0}
        venitCard={mockSummary.venitCard ?? 0}
        venitBolt={mockSummary.venitBolt ?? 0}
        venitUber={mockSummary.venitUber ?? 0}
        incomeMonth={mockSummary.incomeMonth}
        timeframe="month"
        platform="all"
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 2 }}>
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
              {pfaStatusChip(mockSummary.pfaStatus)}
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
                  {docStatusChip(doc.status)}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
