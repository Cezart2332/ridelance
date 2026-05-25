import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { userService, type DashboardSummary } from '../../../services/user.service';
import { PfaIncomeSummary } from './PfaIncomeSummary';
import { RevenueCharts } from './RevenueCharts';

function pfaStatusChip(status: string | null) {
  if (!status) return null;
  const map: Record<string, { label: string; color: string; bg: string }> = {
    Pending:  { label: 'In verificare', color: '#b54708', bg: alpha('#ed6c02', 0.1) },
    Approved: { label: 'Aprobat',       color: '#2e7d32', bg: alpha('#2e7d32', 0.08) },
    Rejected: { label: 'Respins',       color: '#b71c1c', bg: alpha('#d32f2f', 0.08) },
  };
  const cfg = map[status] ?? { label: status, color: DASHBOARD_TOKENS.textMuted, bg: alpha(DASHBOARD_TOKENS.ink, 0.06) };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full, color: cfg.color, backgroundColor: cfg.bg }}
    />
  );
}

function docStatusChip(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    Verified: { label: 'Verificat',     color: '#2e7d32', bg: alpha('#2e7d32', 0.08) },
    Pending:  { label: 'In verificare', color: '#b54708', bg: alpha('#ed6c02', 0.10) },
    Rejected: { label: 'Respins',       color: '#b71c1c', bg: alpha('#d32f2f', 0.08) },
  };
  const cfg = map[status] ?? { label: status, color: DASHBOARD_TOKENS.textMuted, bg: alpha(DASHBOARD_TOKENS.ink, 0.06) };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: DASHBOARD_TOKENS.radius.full, color: cfg.color, backgroundColor: cfg.bg }}
    />
  );
}

export function HomeDashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getDashboardSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <CircularProgress size={32} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Stack>
    );
  }

  if (!summary) {
    return (
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted }}>
        Nu s-au putut incarca datele. Incearca din nou mai tarziu.
      </Typography>
    );
  }

  return (
    <Stack spacing={2.5}>
      <PfaIncomeSummary
        venitCash={summary.venitCash ?? 0}
        venitCard={summary.venitCard ?? 0}
        venitBolt={summary.venitBolt ?? 0}
        venitUber={summary.venitUber ?? 0}
        taxeEstimate={summary.taxeEstimate ?? 0}
        venitTotal={summary.venitTotal ?? 0}
        incomeYear={summary.incomeYear}
        incomeMonth={summary.incomeMonth}
      />

      <RevenueCharts
        year={summary.revenueChartYear ?? new Date().getFullYear()}
        monthlyRevenue={summary.monthlyRevenue ?? []}
        venitCash={summary.venitCash ?? 0}
        venitCard={summary.venitCard ?? 0}
        venitBolt={summary.venitBolt ?? 0}
        venitUber={summary.venitUber ?? 0}
        incomeMonth={summary.incomeMonth}
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
            Starea cererii tale de inregistrare PFA
          </Typography>

          {summary.pfaStatus ? (
            <Stack spacing={1.5}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>Status</Typography>
                {pfaStatusChip(summary.pfaStatus)}
              </Stack>
              {summary.pfaCreatedAtUtc && (
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>Data cererii</Typography>
                  <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.9rem' }}>
                    {new Date(summary.pfaCreatedAtUtc).toLocaleDateString('ro-RO')}
                  </Typography>
                </Stack>
              )}
            </Stack>
          ) : (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
              Nu ai o cerere de inregistrare PFA activa.
            </Typography>
          )}
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
            Ultimele 5 documente incarcate
          </Typography>

          {summary.recentDocuments.length === 0 ? (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
              Nu ai incarcat niciun document inca.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {summary.recentDocuments.map((doc) => (
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
          )}
        </Paper>
      </Box>
    </Stack>
  );
}
