import { Box, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { monthNumberToLabel } from '../../../utils/monthLabels';
import { TOKENS } from '../../../constants/tokens';

import iconCash from '../../../assets/SVG/2- Regular/coupon.svg';
import iconCard from '../../../assets/SVG/2- Regular/credit-card.svg';
import iconTaxes from '../../../assets/SVG/2- Regular/file.svg';
import iconBolt from '../../../assets/SVG/2- Regular/users.svg';
import iconUber from '../../../assets/SVG/2- Regular/users-three.svg';
import iconTotal from '../../../assets/SVG/2- Regular/chart-pie.svg';

const iconFilter =
  'invert(31%) sepia(85%) saturate(2853%) hue-rotate(211deg) brightness(98%) contrast(93%)';

interface PfaIncomeSummaryProps {
  venitCash: number;
  venitCard: number;
  venitBolt: number;
  venitUber: number;
  taxeEstimate: number;
  venitTotal: number;
  incomeYear?: number | null;
  incomeMonth?: number | null;
  periodOverride?: string;
}

type IncomeMetric = {
  label: string;
  value: number;
  icon: string;
  highlight?: boolean;
};

function formatLei(value: number) {
  return `${value.toLocaleString('ro-RO')} lei`;
}

function IncomeMetricCard({ label, value, icon, highlight }: IncomeMetric) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: DASHBOARD_TOKENS.radius.xl,
        border: `1px solid ${highlight ? alpha(DASHBOARD_TOKENS.primary, 0.35) : DASHBOARD_TOKENS.border}`,
        backgroundColor: highlight
          ? `linear-gradient(160deg, ${alpha(DASHBOARD_TOKENS.primary, 0.1)} 0%, ${DASHBOARD_TOKENS.paper} 55%)`
          : DASHBOARD_TOKENS.paper,
        display: 'flex',
        flexDirection: 'column',
        transition: `all 0.3s ${TOKENS.easing}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: DASHBOARD_TOKENS.shadow.md,
          borderColor: DASHBOARD_TOKENS.primary,
        },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }} spacing={1.5}>
        <Box
          sx={{
            p: 1.1,
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img src={icon} alt="" style={{ width: 22, height: 22, filter: iconFilter }} />
        </Box>
        <Typography
          sx={{
            color: DASHBOARD_TOKENS.textMuted,
            fontSize: '0.88rem',
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          color: highlight ? DASHBOARD_TOKENS.primaryStrong : DASHBOARD_TOKENS.ink,
          fontWeight: 900,
          fontSize: {
            xs: highlight ? '1.35rem' : '1.25rem',
            sm: highlight ? '1.85rem' : '1.65rem',
          },
          letterSpacing: -0.5,
        }}
      >
        {formatLei(value)}
      </Typography>
    </Paper>
  );
}

export function PfaIncomeSummary({
  venitCash,
  venitCard,
  venitBolt,
  venitUber,
  taxeEstimate,
  venitTotal,
  incomeYear,
  incomeMonth,
  periodOverride,
}: PfaIncomeSummaryProps) {
  const hasAnyIncome =
    venitCash > 0 || venitCard > 0 || venitBolt > 0 || venitUber > 0 || taxeEstimate > 0 || venitTotal > 0;

  const periodLabel = periodOverride
    ? periodOverride
    : incomeMonth && incomeYear
      ? `${monthNumberToLabel(incomeMonth)} ${incomeYear}`
      : 'Luna curentă';

  const metrics: IncomeMetric[] = [
    { label: 'Venit cash', value: venitCash, icon: iconCash },
    { label: 'Venit card', value: venitCard, icon: iconCard },
    { label: 'Venit Bolt', value: venitBolt, icon: iconBolt },
    { label: 'Venit Uber', value: venitUber, icon: iconUber },
    { label: 'Taxe estimate', value: taxeEstimate, icon: iconTaxes },
    { label: 'Venit total', value: venitTotal, icon: iconTotal, highlight: true },
  ];

  return (
    <Stack spacing={2}>
      <Box>
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.1rem' }}>
          Venituri {periodLabel}
        </Typography>
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mt: 0.5 }}>
          Totalul contabil folosește Venit Bolt + Venit Uber. Cash/card sunt informative.
        </Typography>
      </Box>

      {!hasAnyIncome ? (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: DASHBOARD_TOKENS.radius.xl,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
          }}
        >
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
            Nu există încă date de venituri pentru această lună.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: { xs: 1.5, md: 2 },
          }}
        >
          {metrics.map((metric) => (
            <IncomeMetricCard key={metric.label} {...metric} />
          ))}
        </Box>
      )}
    </Stack>
  );
}
